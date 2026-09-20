/**
 * src/app/api/bms/studio/projects/route.ts
 * BMS SaaS Studio Builder — Project CRUD
 *
 * Auth:    withTenant (@/lib/tenant) validates x-tenant-id/x-user-id/x-user-role
 *          headers injected by proxy.ts — no manual header parsing.
 * DB:      dbTx (@/db withTenant alias) sets app.current_tenant_id via SET LOCAL,
 *          enforces FORCE RLS — ADR-001.
 * Errors:  Direct 23505 catch unwraps pg cause to guarantee 409 on duplicate slug.
 */
import { NextResponse }         from "next/server";
import { eq, desc }             from "drizzle-orm";
import { withTenant }           from "@/lib/tenant";
import { withTenant as dbTx }   from "@/db";
import { withErrorHandler }     from "@/lib/api-handler";
import { bmsStudioProjects }    from "@/db/schema";
import { z }                    from "zod";

const CreateProjectSchema = z.object({
  name:        z.string().min(2).max(255),
  slug:        z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().default(""),
  gradient:    z.string().optional(),
});

const _GET = withTenant(async (_req, ctx) => {
  const projects = await dbTx(ctx.tenantId, async (tx) =>
    tx.select()
      .from(bmsStudioProjects)
      .where(eq(bmsStudioProjects.tenantId, ctx.tenantId))
      .orderBy(desc(bmsStudioProjects.createdAt))
  );
  return NextResponse.json(projects);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const [project] = await dbTx(ctx.tenantId, async (tx) =>
      tx.insert(bmsStudioProjects)
        .values({ tenantId: ctx.tenantId, ...parsed.data })
        .returning()
    );
    return NextResponse.json(project, { status: 201 });
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