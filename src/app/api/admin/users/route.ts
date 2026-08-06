/**
 * src/app/api/admin/users/route.ts
 *
 * Hardened Admin Users Management API Route
 * - GET: Lists all users with tenant joins (Admin role required).
 * - POST: Provisions a new user with audit tracking (Admin role required).
 * - PATCH: Updates user role or active status with audit logging (Admin role required).
 * - DELETE: Permanently removes a user identity with critical audit logging (Admin role required).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, tenants, auditLogs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { cached, invalidateCache } from "@/lib/server-cache";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

const ROLES = ["owner", "admin", "architect", "developer", "designer", "viewer"];

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const data = await cached("admin-users", 4_000, async () => {
    const [rows, allTenants] = await Promise.all([
      db.select().from(users).orderBy(asc(users.id)),
      db.select().from(tenants),
    ]);
    return rows.map((u) => ({
      ...u,
      tenantName: allTenants.find((t) => t.id === u.tenantId)?.name ?? "—",
    }));
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    const role = ROLES.includes(body.role) ? body.role : "developer";
    const tenantId = Number(body.tenantId) || ctx.tenantId || 1;

    const [row] = await db
      .insert(users)
      .values({
        tenantId,
        name: String(body.name).trim(),
        email: String(body.email).trim().toLowerCase(),
        role,
      })
      .returning();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    await db.insert(auditLogs).values({
      tenantId,
      actor: String(ctx.userId),
      action: `rbac.user.create:${role}`,
      target: row.email,
      ipAddress: ip,
    });

    invalidateCache("admin-users");
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
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
      return NextResponse.json({ error: "User ID required." }, { status: 400 });
    }

    const patch: Partial<{ role: string; active: boolean }> = {};
    if (body.role && ROLES.includes(body.role)) patch.role = body.role;
    if (typeof body.active === "boolean") patch.active = body.active;

    const [row] = await db
      .update(users)
      .set(patch as any)
      .where(eq(users.id, Number(body.id)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    await db.insert(auditLogs).values({
      tenantId: row.tenantId,
      actor: String(ctx.userId),
      action: body.role ? `rbac.role.change:${body.role}` : `rbac.user.${row.active ? "enable" : "disable"}`,
      target: row.email,
      severity: "warn",
      ipAddress: ip,
    });

    invalidateCache("admin-users");
    return NextResponse.json(row);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "User ID required." }, { status: 400 });
    }

    const [row] = await db
      .delete(users)
      .where(eq(users.id, Number(body.id)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    await db.insert(auditLogs).values({
      tenantId: row.tenantId,
      actor: String(ctx.userId),
      action: "rbac.user.delete",
      target: row.email,
      severity: "critical",
      ipAddress: ip,
    });

    invalidateCache("admin-users");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}