/**
 * src/app/api/admin/tenants/route.ts
 *
 * Hardened Admin Tenants Management API Route
 * - GET: Lists all workspaces with aggregated user and project counts (Admin role required).
 * - POST: Provisions a new tenant workspace with slug generation and audit tracking (Admin role required).
 * - PATCH: Updates workspace status or plan tier with audit logging (Admin role required).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenants, auditLogs } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { cached, invalidateCache } from "@/lib/server-cache";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const data = await cached("admin-tenants", 4_000, async () => {
    const rows = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        plan: tenants.plan,
        status: tenants.status,
        region: tenants.region,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        userCount: sql<number>`(SELECT count(*) FROM users WHERE users.tenant_id = tenants.id)::int`,
        projectCount: sql<number>`(SELECT count(*) FROM projects WHERE projects.tenant_id = tenants.id)::int`,
      })
      .from(tenants)
      .orderBy(asc(tenants.id));

    return rows;
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Tenant name is required." }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    const plan = ["starter", "scale", "enterprise"].includes(body.plan) ? body.plan : "scale";
    const region = String(body.region ?? "ap-south-1").slice(0, 40);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    const [row] = await db
      .insert(tenants)
      .values({ name, slug, plan, region, status: "active" })
      .returning();

    await db.insert(auditLogs).values({
      tenantId: row.id,
      actor: String(ctx.userId),
      action: `tenant.provision:${plan}`,
      target: slug,
      ipAddress: ip,
    });

    invalidateCache("admin-tenants");
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Tenant provisioning error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Tenant ID is required." }, { status: 400 });
    }

    const patch: Partial<{ status: "active" | "suspended" | "deleted"; plan: "starter" | "scale" | "enterprise" }> = {};
    if (["active", "suspended", "deleted"].includes(body.status)) patch.status = body.status;
    if (["starter", "scale", "enterprise"].includes(body.plan)) patch.plan = body.plan;

    const [row] = await db
      .update(tenants)
      .set(patch as any)
      .where(eq(tenants.id, Number(body.id)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    await db.insert(auditLogs).values({
      tenantId: row.id,
      actor: String(ctx.userId),
      action: patch.status ? `tenant.status:${patch.status}` : `tenant.plan:${patch.plan}`,
      target: row.slug,
      severity: "warn",
      ipAddress: ip,
    });

    invalidateCache("admin-tenants");
    return NextResponse.json(row);
  } catch (error) {
    console.error("Tenant update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}