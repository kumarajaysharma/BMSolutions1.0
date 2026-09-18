/**
 * src/app/api/bms/lms/paths/route.ts
 * BMS Academy — Learning Paths CRUD
 */
import { NextResponse }         from "next/server";
import { eq, asc }              from "drizzle-orm";
import { withTenant }           from "@/lib/tenant";
import { withTenant as dbTx }   from "@/db";
import { withErrorHandler }     from "@/lib/api-handler";
import { bmsLearningPaths }     from "@/db/schema";
import { z }                    from "zod";

const CreatePathSchema = z.object({
  title:          z.string().min(2).max(255),
  description:    z.string().min(5),
  level:          z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
  estimatedWeeks: z.number().int().min(1).max(104).default(6),
  gradient:       z.string().optional(),
  icon:           z.string().optional(),
});

const _GET = withTenant(async (_req, ctx) => {
  const paths = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsLearningPaths)
      .where(eq(bmsLearningPaths.tenantId, ctx.tenantId))
      .orderBy(asc(bmsLearningPaths.title))
  );
  return NextResponse.json(paths);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = CreatePathSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [path] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsLearningPaths)
      .values({ tenantId: ctx.tenantId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(path, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const parsed = CreatePathSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [updated] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsLearningPaths).set(parsed.data)
      .where(eq(bmsLearningPaths.id, id)).returning()
  );
  if (!updated) return NextResponse.json({ error: "Path not found" }, { status: 404 });
  return NextResponse.json(updated);
});

export const GET   = withErrorHandler(_GET);
export const POST  = withErrorHandler(_POST);
export const PATCH = withErrorHandler(_PATCH);
