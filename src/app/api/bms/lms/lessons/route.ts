/**
 * src/app/api/bms/lms/lessons/route.ts
 * BMS Academy — Lessons CRUD
 * GET ?moduleId=<id>  POST  PATCH ?id=<id>
 */
import { NextResponse }       from "next/server";
import { eq, asc }            from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsLessons }         from "@/db/schema";
import { z }                  from "zod";

const CreateLessonSchema = z.object({
  moduleId:        z.number().int().positive(),
  title:           z.string().min(2).max(255),
  type:            z.enum(["video", "text", "code", "quiz"]).default("video"),
  durationMinutes: z.number().int().min(1).max(480).default(15),
  content:         z.string().optional(),
  videoUrl:        z.string().url().optional(),
  codeStarter:     z.string().optional(),
  orderIndex:      z.number().int().min(0).default(0),
  isFree:          z.boolean().default(false),
});

const _GET = withTenant(async (req, ctx) => {
  const moduleId = parseInt(new URL(req.url).searchParams.get("moduleId") ?? "0");
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId query param required" }, { status: 400 });
  }
  const lessons = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsLessons)
      .where(eq(bmsLessons.moduleId, moduleId))
      .orderBy(asc(bmsLessons.orderIndex))
  );
  return NextResponse.json(lessons);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = CreateLessonSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [lesson] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsLessons).values({ tenantId: ctx.tenantId, ...parsed.data }).returning()
  );
  return NextResponse.json(lesson, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const partial = CreateLessonSchema.partial().omit({ moduleId: true });
  const parsed  = partial.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [lesson] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsLessons).set(parsed.data).where(eq(bmsLessons.id, id)).returning()
  );
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  return NextResponse.json(lesson);
});

export const GET   = withErrorHandler(_GET);
export const POST  = withErrorHandler(_POST);
export const PATCH = withErrorHandler(_PATCH);
