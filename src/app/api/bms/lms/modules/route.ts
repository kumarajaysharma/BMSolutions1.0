/**
 * src/app/api/bms/lms/modules/route.ts
 * BMS Academy — Course Modules CRUD
 * GET ?courseId=<id>  POST  PATCH ?id=<id>
 */
import { NextResponse }       from "next/server";
import { eq, asc }            from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsModules }         from "@/db/schema";
import { z }                  from "zod";

const CreateModuleSchema = z.object({
  courseId:    z.number().int().positive(),
  title:       z.string().min(2).max(255),
  description: z.string().optional(),
  orderIndex:  z.number().int().min(0).default(0),
});

const _GET = withTenant(async (req, ctx) => {
  const courseId = parseInt(new URL(req.url).searchParams.get("courseId") ?? "0");
  if (!courseId) {
    return NextResponse.json({ error: "courseId query param required" }, { status: 400 });
  }
  const modules = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsModules)
      .where(eq(bmsModules.courseId, courseId))
      .orderBy(asc(bmsModules.orderIndex))
  );
  return NextResponse.json(modules);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = CreateModuleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [mod] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsModules).values({ tenantId: ctx.tenantId, ...parsed.data }).returning()
  );
  return NextResponse.json(mod, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const partial = z.object({
    title:       z.string().min(2).max(255).optional(),
    description: z.string().optional(),
    orderIndex:  z.number().int().min(0).optional(),
  });
  const parsed = partial.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [mod] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsModules).set(parsed.data).where(eq(bmsModules.id, id)).returning()
  );
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });
  return NextResponse.json(mod);
});

export const GET   = withErrorHandler(_GET);
export const POST  = withErrorHandler(_POST);
export const PATCH = withErrorHandler(_PATCH);
