/**
 * src/app/api/bms/lms/enrollments/route.ts
 * BMS Academy — Enroll a user in a course + get their enrollments
 * ADR-001: All queries via withTenant()
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { withTenant } from "@/lib/tenant";
import { bmsEnrollments, bmsCourses } from "@/db/schema";
import { withErrorHandler, getPgError } from "@/lib/api-handler";
import { z } from "zod";

const EnrollSchema = z.object({ courseId: z.number().int().positive() });

export const GET = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await withTenant(tenantId, async (tx) =>
    tx.select({
      enrollment: bmsEnrollments,
      course:     bmsCourses,
    })
    .from(bmsEnrollments)
    .innerJoin(bmsCourses, eq(bmsEnrollments.courseId, bmsCourses.id))
    .where(and(
      eq(bmsEnrollments.tenantId, tenantId),
      eq(bmsEnrollments.userId,   userId)
    ))
    .orderBy(desc(bmsEnrollments.lastAccessedAt))
  );
  return NextResponse.json(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const [enrollment] = await withTenant(tenantId, async (tx) =>
      tx.insert(bmsEnrollments)
        .values({ tenantId, userId, courseId: parsed.data.courseId })
        .returning()
    );
    return NextResponse.json(enrollment, { status: 201 });
  } catch (err) {
    if (getPgError(err) === "23505")
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    throw err;
  }
});
