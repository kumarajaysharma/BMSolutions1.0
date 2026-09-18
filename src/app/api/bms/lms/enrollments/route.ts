/**
 * src/app/api/bms/lms/enrollments/route.ts
 * BMS Academy — Course Enrollment
 */
import { NextResponse }         from "next/server";
import { and, eq, desc }        from "drizzle-orm";
import { withTenant }           from "@/lib/tenant";
import { withTenant as dbTx }   from "@/db";
import { withErrorHandler }     from "@/lib/api-handler";
import { bmsEnrollments, bmsCourses } from "@/db/schema";
import { z }                    from "zod";

const EnrollSchema = z.object({ courseId: z.number().int().positive() });

const _GET = withTenant(async (_req, ctx) => {
  const rows = await dbTx(ctx.tenantId, async (tx) =>
    tx.select({ enrollment: bmsEnrollments, course: bmsCourses })
      .from(bmsEnrollments)
      .innerJoin(bmsCourses, eq(bmsEnrollments.courseId, bmsCourses.id))
      .where(
        and(
          eq(bmsEnrollments.tenantId, ctx.tenantId),
          eq(bmsEnrollments.userId,   ctx.userId)
        )
      )
      .orderBy(desc(bmsEnrollments.lastAccessedAt))
  );
  return NextResponse.json(rows);
});

const _POST = withTenant(async (req, ctx) => {
  const body   = await req.json();
  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // withErrorHandler catches 23505 (already enrolled) → 409 automatically
  const [enrollment] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsEnrollments)
      .values({ tenantId: ctx.tenantId, userId: ctx.userId, courseId: parsed.data.courseId })
      .returning()
  );
  return NextResponse.json(enrollment, { status: 201 });
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
