/**
 * src/app/api/bms/lms/courses/route.ts
 * BMS Academy — Courses CRUD
 * Auth: x-tenant-id / x-user-id / x-user-role (injected by proxy.ts)
 * ADR-001: All queries via withTenant()
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { withTenant } from "@/lib/tenant";
import { bmsCourses } from "@/db/schema";
import { withErrorHandler, getPgError } from "@/lib/api-handler";
import { z } from "zod";

const CreateCourseSchema = z.object({
  title:             z.string().min(3).max(255),
  slug:              z.string().min(3).max(255).regex(/^[a-z0-9-]+$/),
  description:       z.string().min(10),
  longDescription:   z.string().optional(),
  category:          z.string().default("Agentic AI"),
  level:             z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
  durationHours:     z.number().int().min(1).max(200).default(8),
  thumbnailGradient: z.string().optional(),
  status:            z.enum(["draft", "published", "archived"]).default("draft"),
  tags:              z.array(z.string()).default([]),
  objectives:        z.array(z.string()).default([]),
  prerequisites:     z.array(z.string()).default([]),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsCourses)
      .where(eq(bmsCourses.tenantId, tenantId))
      .orderBy(desc(bmsCourses.createdAt))
  );
  return NextResponse.json(courses);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  const userRole = req.headers.get("x-user-role") ?? "";
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin", "architect", "developer"].includes(userRole))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body   = await req.json();
  const parsed = CreateCourseSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const [course] = await withTenant(tenantId, async (tx) =>
      tx.insert(bmsCourses)
        .values({ tenantId, instructorId: userId, ...parsed.data })
        .returning()
    );
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    if (getPgError(err) === "23505")
      return NextResponse.json({ error: "Slug already exists in this tenant" }, { status: 409 });
    throw err;
  }
});
