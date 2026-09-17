/**
 * src/app/api/bms/studio/projects/route.ts
 * BMS SaaS Studio — Studio Projects CRUD
 * ADR-001: All queries via withTenant()
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { withTenant } from "@/lib/tenant";
import { bmsStudioProjects } from "@/db/schema";
import { withErrorHandler, getPgError } from "@/lib/api-handler";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name:        z.string().min(2).max(255),
  slug:        z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().default(""),
  gradient:    z.string().optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsStudioProjects)
      .where(eq(bmsStudioProjects.tenantId, tenantId))
      .orderBy(desc(bmsStudioProjects.createdAt))
  );
  return NextResponse.json(projects);
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
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const [project] = await withTenant(tenantId, async (tx) =>
      tx.insert(bmsStudioProjects)
        .values({ tenantId, ...parsed.data })
        .returning()
    );
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (getPgError(err) === "23505")
      return NextResponse.json({ error: "Project slug already exists" }, { status: 409 });
    throw err;
  }
});
