/**
 * src/app/api/bms/lms/enrollments/route.ts
 * BMS Academy — Course Enrollment
 *
 * Auth:    withTenant (@/lib/tenant) validates x-tenant-id/x-user-id/x-user-role
 *          headers injected by proxy.ts — no manual header parsing.
 * DB:      dbTx (@/db withTenant alias) sets app.current_tenant_id via SET LOCAL,
 *          enforces FORCE RLS — ADR-001.
 * Errors:  Direct 23505 catch unwraps pg cause to guarantee 409 on duplicate enrollments.
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

  try {
    const [enrollment] = await dbTx(ctx.tenantId, async (tx) =>
      tx.insert(bmsEnrollments)
        .values({ tenantId: ctx.tenantId, userId: ctx.userId, courseId: parsed.data.courseId })
        .returning()
    );
    return NextResponse.json(enrollment, { status: 201 });
  } catch (err: unknown) {
    const pgCode =
      (err as { code?: string })?.code ||
      (err as { cause?: { code?: string } })?.cause?.code;

    if (pgCode === "23505") {
      return NextResponse.json(
        { error: "Duplicate — resource already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);