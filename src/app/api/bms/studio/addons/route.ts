/**
 * src/app/api/bms/studio/addons/route.ts
 * BMS Studio — Addon / Skill Registry
 * GET  POST (install)  PATCH ?addonId=<id> (update meta)  DELETE ?addonId=<id>
 * Restricted to admin+ — addon installation affects all tenant users.
 */
import { NextResponse }       from "next/server";
import { eq, and }            from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsStudioAddons }    from "@/db/schema";
import { z }                  from "zod";

const InstallAddonSchema = z.object({
  addonId: z.string().min(2).max(255),
  kind:    z.enum(["skill", "connector", "plugin", "template"]).default("skill"),
  custom:  z.boolean().default(false),
  meta:    z.record(z.string(), z.unknown()).default({}),
  version: z.string().default("1.0.0"),
  files:   z.array(z.record(z.string(), z.unknown())).default([]),
});

const _GET = withTenant(async (_req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const addons = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsStudioAddons)
      .where(eq(bmsStudioAddons.tenantId, ctx.tenantId))
  );
  return NextResponse.json(addons);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const parsed = InstallAddonSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  // withErrorHandler catches 23505 (already installed) → 409
  const [addon] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsStudioAddons)
      .values({ tenantId: ctx.tenantId, installed: true, ...parsed.data })
      .returning()
  );
  return NextResponse.json(addon, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const addonId = new URL(req.url).searchParams.get("addonId") ?? "";
  if (!addonId) return NextResponse.json({ error: "addonId query param required" }, { status: 400 });

  const partial = z.object({
    meta:      z.record(z.string(), z.unknown()).optional(),
    version:   z.string().optional(),
    files:     z.array(z.record(z.string(), z.unknown())).optional(),
    installed: z.boolean().optional(),
  });
  const parsed = partial.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [addon] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsStudioAddons)
      .set({ ...parsed.data, syncedAt: new Date() })
      .where(and(
        eq(bmsStudioAddons.tenantId, ctx.tenantId),
        eq(bmsStudioAddons.addonId,  addonId)
      ))
      .returning()
  );
  if (!addon) return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  return NextResponse.json(addon);
});

const _DELETE = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const addonId = new URL(req.url).searchParams.get("addonId") ?? "";
  if (!addonId) return NextResponse.json({ error: "addonId query param required" }, { status: 400 });

  // Soft uninstall — preserve history, set installed=false
  const [addon] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsStudioAddons)
      .set({ installed: false, syncedAt: new Date() })
      .where(and(
        eq(bmsStudioAddons.tenantId, ctx.tenantId),
        eq(bmsStudioAddons.addonId,  addonId)
      ))
      .returning()
  );
  if (!addon) return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  return NextResponse.json({ uninstalled: true, addonId: addon.addonId });
});

export const GET    = withErrorHandler(_GET);
export const POST   = withErrorHandler(_POST);
export const PATCH  = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
