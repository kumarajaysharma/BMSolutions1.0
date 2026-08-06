/**
 * src/app/api/requests/route.ts
 *
 * Hardened Client Requests & Scheduling API Route
 * - GET: Protected by admin role check (prevents public exposure of client PII).
 * - POST: Public intake with input sanitization, length capping, and audit logging.
 * - PATCH: Protected by admin role check for updating request statuses.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientRequests, auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

const SERVICES = [
  "platform-demo",
  "architecture-consult",
  "migration-assessment",
  "security-review",
];

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  
  // Secure the GET endpoint: only internal staff with minimum 'admin' role can view client requests
  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const rows = await db
    .select()
    .from(clientRequests)
    .orderBy(desc(clientRequests.id))
    .limit(60);
    
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    // Strict input validation for public PII intake
    if (!name || name.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid name (max 120 chars) and email are required." },
        { status: 400 }
      );
    }

    const tenantIdHeader = req.headers.get("x-tenant-id");
    const tenantId: number = tenantIdHeader ? Number(tenantIdHeader) : Number(body.tenantId ?? 1);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    const service = SERVICES.includes(body.service) ? body.service : "platform-demo";
    const [row] = await db
      .insert(clientRequests)
      .values({
        tenantId,
        name,
        email,
        company: String(body.company ?? "").trim().slice(0, 120),
        service,
        preferredDate: String(body.preferredDate ?? "").slice(0, 30),
        preferredTime: String(body.preferredTime ?? "").slice(0, 30),
        notes: String(body.notes ?? "").slice(0, 2000),
      })
      .returning();

    // Audit log entry for DPDP compliance tracking
    await db.insert(auditLogs).values({
      tenantId,
      actor: "landing-page",
      action: `client.request:${service}`,
      target: email,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (error) {
    console.error("Client request submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    
    // Secure the PATCH endpoint: require minimum 'admin' role
    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Request ID required" }, { status: 400 });
    }

    const status = ["pending", "confirmed", "completed", "cancelled"].includes(body.status)
      ? body.status
      : "pending";

    const [row] = await db
      .update(clientRequests)
      .set({ status })
      .where(eq(clientRequests.id, Number(body.id)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const tenantIdHeader = req.headers.get("x-tenant-id");
    const tenantId: number = tenantIdHeader ? Number(tenantIdHeader) : 1;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    await db.insert(auditLogs).values({
      tenantId,
      actor: ctx.userId ? String(ctx.userId) : "studio-admin",
      action: `client.request.${status}`,
      target: row.email,
      ipAddress: ip,
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error("Client request patch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}