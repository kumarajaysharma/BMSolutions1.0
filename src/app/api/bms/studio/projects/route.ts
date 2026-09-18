/**
 * src/app/api/bms/studio/projects/route.ts
 * BMS SaaS Studio Builder — Project CRUD
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

  // withErrorHandler catches 23505 (duplicate slug) → 409 automatically
  const [project] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsStudioProjects)
      .values({ tenantId: ctx.tenantId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(project, { status: 201 });
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
