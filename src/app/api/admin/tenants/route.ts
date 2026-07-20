/**
 * src/app/api/admin/tenants/route.ts — updated for Module 2
 * Session context is now verified by middleware before this handler runs.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { tenants, users, projects, auditLogs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { cached, invalidateCache } from "@/lib/server-cache";
import { getRequestContext } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Middleware has already verified admin role — no further check needed here.
  const data = await cached("admin-tenants", 4_000, async () => {
    const db = await getDb();
    const [rows, allUsers, allProjects] = await Promise.all([
      db.select().from(tenants).orderBy(asc(tenants.id)),
      db.select().from(users),
      db.select().from(projects),
    ]);
    return rows.map((t) => ({
      ...t,
      userCount: allUsers.filter((u) => u.tenantId === t.id).length,
      projectCount: allProjects.filter((p) => p.tenantId === t.id).length,
    }));
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const db = await getDb();

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const slug = String(body.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const [row] = await db
    .insert(tenants)
    .values({
      name: body.name,
      slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
      plan: body.plan ?? "scale",
      region: body.region ?? "us-east-1",
    })
    .returning();

  await db.insert(auditLogs).values({
    tenantId: row.id,
    actor: ctx.userId, // Real actor from secure session context
    action: "tenant.create",
    target: row.slug,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
  });

  invalidateCache("admin-tenants");
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = getRequestContext(req);
  const db = await getDb();

  const body = await req.json();
  const patch: Partial<{ status: string; plan: string }> = {};
  if (body.status) patch.status = body.status;
  if (body.plan) patch.plan = body.plan;

  const [row] = await db
    .update(tenants)
    .set(patch)
    .where(eq(tenants.id, Number(body.id)))
    .returning();

  await db.insert(auditLogs).values({
    tenantId: row.id,
    actor: ctx.userId,
    action: `tenant.update:${body.status ?? body.plan}`,
    target: row.slug,
    severity: body.status === "suspended" ? "warn" : "info",
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
  });

  invalidateCache("admin-tenants");
  return NextResponse.json(row);
}