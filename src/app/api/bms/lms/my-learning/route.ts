/**
 * src/app/api/bms/lms/my-learning/route.ts
 * BMS Academy — Authenticated user's enrolled courses with progress
 * GET — returns enrollments joined to course details for ctx.userId
 */
import { NextResponse }                   from "next/server";
import { eq, and, desc }                  from "drizzle-orm";
import { withTenant }                     from "@/lib/tenant";
import { withTenant as dbTx }             from "@/db";
import { withErrorHandler }               from "@/lib/api-handler";
import { bmsEnrollments, bmsCourses }     from "@/db/schema";

const _GET = withTenant(async (_req, ctx) => {
  const rows = await dbTx(ctx.tenantId, async (tx) =>
    tx.select({
        enrollmentId:   bmsEnrollments.id,
        progress:       bmsEnrollments.progress,
        status:         bmsEnrollments.status,
        enrolledAt:     bmsEnrollments.enrolledAt,
        completedAt:    bmsEnrollments.completedAt,
        lastAccessedAt: bmsEnrollments.lastAccessedAt,
        course: {
          id:                bmsCourses.id,
          title:             bmsCourses.title,
          slug:              bmsCourses.slug,
          description:       bmsCourses.description,
          category:          bmsCourses.category,
          level:             bmsCourses.level,
          durationHours:     bmsCourses.durationHours,
          thumbnailGradient: bmsCourses.thumbnailGradient,
          rating:            bmsCourses.rating,
        },
      })
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

export const GET = withErrorHandler(_GET);
