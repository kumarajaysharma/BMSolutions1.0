/**
 * src/app/api/bms/lms/courses/route.ts
 * BMS Academy — Course Catalogue CRUD
 *
 * Auth:    withTenant (@/lib/tenant) validates x-tenant-id/x-user-id/x-user-role
 *          headers injected by proxy.ts — no manual header parsing.
 * DB:      dbTx (@/db withTenant alias) sets app.current_tenant_id via SET LOCAL,
 *          enforces FORCE RLS — ADR-001.
 * Errors:  withErrorHandler (@/lib/api-handler) catches 23505/23503/ZodError
 *          globally — no per-route try/catch needed for PG errors.
 */
import { NextResponse }                  from "next/server";
import { eq, desc }                      from "drizzle-orm";
import { withTenant }                    from "@/lib/tenant";
import { withTenant as dbTx }            from "@/db";
import { withErrorHandler }              from "@/lib/api-handler";
import { bmsCourses }                    from "@/db/schema";
import { z }                             from "zod";

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

const _GET = withTenant(async (_req, ctx) => {
  const courses = await dbTx(ctx.tenantId, async (tx) =>
    tx.select()
      .from(bmsCourses)
      .where(eq(bmsCourses.tenantId, ctx.tenantId))
      .orderBy(desc(bmsCourses.createdAt))
  );
  return NextResponse.json(courses);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = CreateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // withErrorHandler catches 23505 → 409 automatically — no try/catch required
  const [course] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsCourses)
      .values({ tenantId: ctx.tenantId, instructorId: ctx.userId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(course, { status: 201 });
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
