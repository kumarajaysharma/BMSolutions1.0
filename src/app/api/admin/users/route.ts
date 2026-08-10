/**
 * src/app/api/admin/users/route.ts
 *
 * Hardened Admin Users Management API Route
 * - GET: Lists all users with tenant joins (Admin role required).
 * - POST: Provisions a new user with audit tracking (Admin role required).
 * - PATCH: Updates user role or active status with audit logging (Admin role required).
 * - DELETE: Permanently removes a user identity with critical audit logging (Admin role required).
 *
 * Security Fixes Applied (this revision):
 *   [P2] cf-connecting-ip priority over x-forwarded-for — extracted via shared extractIp() helper.
 *   [P2] patch as any removed — strictly typed via UserRole union, TS strict-mode compliant.
 *   [ADR] actor field corrected to "user:{userId}" format across all three mutation handlers.
 *   [Guard] Empty-patch early return added to PATCH to prevent no-op DB writes.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, tenants, auditLogs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { cached, invalidateCache } from "@/lib/server-cache";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

// Declared as const tuple — enables UserRole union and type-safe .includes() guard.
const ROLES = [
  "owner",
  "admin",
  "architect",
  "developer",
  "designer",
  "viewer",
] as const;

type UserRole = (typeof ROLES)[number];

/** Type guard: narrows unknown string to UserRole without unsafe cast. */
function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Extracts the real client IP with Cloudflare priority.
 * cf-connecting-ip is injected by Cloudflare WAF and cannot be spoofed
 * by upstream proxies. x-forwarded-for is accepted only as a final fallback.
 */
function extractIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

// ─── GET ──────────────────────────────────────────────────────────────────────

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

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const role: UserRole = isValidRole(body.role) ? body.role : "developer";
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

    await db.insert(auditLogs).values({
      tenantId,
      actor: `user:${ctx.userId}`,
      action: `rbac.user.create:${role}`,
      target: row.email,
      ipAddress: extractIp(req),
    });

    invalidateCache("admin-users");
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    if (!body.id) {
      return NextResponse.json({ error: "User ID required." }, { status: 400 });
    }

    // Strictly typed — no `as any`. Drizzle `.set()` accepts this shape directly.
    const patch: { role?: UserRole; active?: boolean } = {};
    if (isValidRole(body.role)) patch.role = body.role;
    if (typeof body.active === "boolean") patch.active = body.active;

    // Guard: reject no-op updates before hitting the database.
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update. Provide role or active." },
        { status: 400 }
      );
    }

    const [row] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, Number(body.id)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      tenantId: row.tenantId,
      actor: `user:${ctx.userId}`,
      action: patch.role
        ? `rbac.role.change:${patch.role}`
        : `rbac.user.${row.active ? "enable" : "disable"}`,
      target: row.email,
      severity: "warn",
      ipAddress: extractIp(req),
    });

    invalidateCache("admin-users");
    return NextResponse.json(row);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

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

    await db.insert(auditLogs).values({
      tenantId: row.tenantId,
      actor: `user:${ctx.userId}`,
      action: "rbac.user.delete",
      target: row.email,
      severity: "critical",
      ipAddress: extractIp(req),
    });

    invalidateCache("admin-users");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}