import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, tenants, auditLogs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { cached, invalidateCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

const ROLES = ["owner", "admin", "architect", "developer", "designer", "viewer"];

export async function GET() {
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

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || !body.email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 });
  }
  if (!ROLES.includes(body.role)) body.role = "developer";
  const [row] = await db
    .insert(users)
    .values({
      tenantId: Number(body.tenantId) || 1,
      name: body.name,
      email: body.email,
      role: body.role,
    })
    .returning();
  await db.insert(auditLogs).values({
    tenantId: row.tenantId,
    actor: "studio-admin",
    action: `rbac.user.create:${row.role}`,
    target: row.email,
  });
  invalidateCache("admin-users");
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json(); // { id, role?, active? }
  const patch: Partial<{ role: string; active: boolean }> = {};
  if (body.role && ROLES.includes(body.role)) patch.role = body.role;
  if (typeof body.active === "boolean") patch.active = body.active;
  const [row] = await db.update(users).set(patch).where(eq(users.id, Number(body.id))).returning();
  await db.insert(auditLogs).values({
    tenantId: row.tenantId,
    actor: "studio-admin",
    action: body.role ? `rbac.role.change:${body.role}` : `rbac.user.${row.active ? "enable" : "disable"}`,
    target: row.email,
    severity: "warn",
  });
  invalidateCache("admin-users");
  return NextResponse.json(row);
}
