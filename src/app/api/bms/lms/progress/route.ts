/**
 * src/app/api/bms/lms/progress/route.ts
 * BMS Academy — Lesson Progress Tracking
 * GET ?lessonId=<id>  POST (mark complete/incomplete)
 * Also updates enrollment progress % on completion.
 */
import { NextResponse }       from "next/server";
import { eq, and, sql }       from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsLessonProgress, bmsEnrollments, bmsLessons, bmsModules } from "@/db/schema";
import { z }                  from "zod";

const ProgressSchema = z.object({
  lessonId:  z.number().int().positive(),
  courseId:  z.number().int().positive(),
  completed: z.boolean(),
});

const _GET = withTenant(async (req, ctx) => {
  const lessonId = parseInt(new URL(req.url).searchParams.get("lessonId") ?? "0");
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId query param required" }, { status: 400 });
  }
  const [progress] = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsLessonProgress)
      .where(and(
        eq(bmsLessonProgress.lessonId, lessonId),
        eq(bmsLessonProgress.userId,   ctx.userId)
      ))
  );
  return NextResponse.json(progress ?? { lessonId, completed: false });
});

const _POST = withTenant(async (req, ctx) => {
  const parsed = ProgressSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { lessonId, courseId, completed } = parsed.data;

  const [progress] = await dbTx(ctx.tenantId, async (tx) => {
    // Upsert lesson progress
    const [row] = await tx.insert(bmsLessonProgress)
      .values({
        tenantId: ctx.tenantId,
        userId:   ctx.userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [bmsLessonProgress.tenantId, bmsLessonProgress.userId, bmsLessonProgress.lessonId],
        set:    { completed, completedAt: completed ? new Date() : null },
      })
      .returning();

    // Recalculate enrollment progress %
    // Count total lessons in course via module join
    const totalRes = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bmsLessons)
      .innerJoin(bmsModules, eq(bmsLessons.moduleId, bmsModules.id))
      .where(eq(bmsModules.courseId, courseId));
    const total = totalRes[0]?.count ?? 1;

    const doneRes = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bmsLessonProgress)
      .innerJoin(bmsLessons, eq(bmsLessonProgress.lessonId, bmsLessons.id))
      .innerJoin(bmsModules,  eq(bmsLessons.moduleId, bmsModules.id))
      .where(and(
        eq(bmsModules.courseId,           courseId),
        eq(bmsLessonProgress.userId,      ctx.userId),
        eq(bmsLessonProgress.completed,   true)
      ));
    const done = doneRes[0]?.count ?? 0;

    const pct = Math.round((done / total) * 100 * 100) / 100; // numeric(5,2)

    await tx.update(bmsEnrollments)
      .set({
        progress:       String(pct),
        lastAccessedAt: new Date(),
        status:         pct >= 100 ? "completed" : "active",
        completedAt:    pct >= 100 ? new Date() : null,
      })
      .where(and(
        eq(bmsEnrollments.tenantId, ctx.tenantId),
        eq(bmsEnrollments.userId,   ctx.userId),
        eq(bmsEnrollments.courseId, courseId)
      ));

    return [row];
  });
  return NextResponse.json(progress);
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
