/**
 * src/app/api/requests/route.ts
 *
 * Hardened Client Requests API Route
 * - GET:   Protected by admin role — returns all client intake records.
 * - POST:  Public intake aligned to clientRequests schema (Phase A).
 * - PATCH: Protected by admin role — updates request status.
 *
 * FIXES applied:
 *   1. POST .values() rewritten to match clientRequests schema columns.
 *      Removed: tenantId, name, email, company, service, preferredDate,
 *               preferredTime, notes (none exist on clientRequests).
 *      Added:   contactName, contactEmail, companyName, subsidiary,
 *               message, requestedPlan, idempotencyKey, handledByTenantId.
 *   2. PATCH status enum corrected to: pending | approved | rejected | onboarded.
 *   3. PATCH audit log: row.email → row.contactEmail.
 *   4. PATCH actor format updated to ADR-001 convention: user:{userId}.
 *   5. IP extraction order updated: cf-connecting-ip → x-real-ip → x-forwarded-for.
 */

import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientRequests, auditLogs, tenants } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

/** Resolves the BNLV root tenant ID dynamically — per Migration 0008 §4.5. */
async function resolveBnlvTenantId(): Promise<number> {
  const [root] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "bnlv"))
    .limit(1);
  if (!root) throw new Error("BNLV root tenant not found.");
  return root.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Admin-protected list of client requests
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const rows = await db
    .select()
    .from(clientRequests)
    .orderBy(desc(clientRequests.id))
    .limit(60);

  return NextResponse.json(rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Public client intake (maps to clientRequests schema)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const contactName  = String(body.name    ?? body.contactName  ?? "").trim();
    const contactEmail = String(body.email   ?? body.contactEmail ?? "").trim().toLowerCase();
    const companyName  = String(body.company ?? body.companyName  ?? "").trim();

    // Input validation
    if (
      !contactName  || contactName.length  > 120 ||
      !contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) ||
      !companyName  || companyName.length  > 200
    ) {
      return NextResponse.json(
        { error: "Valid name (max 120), company (max 200), and email are required." },
        { status: 400 }
      );
    }

    // Derive subsidiary from body or x-tenant-slug header injected by proxy
    const subsidiary = String(
      body.subsidiary ?? req.headers.get("x-tenant-slug") ?? "general"
    ).slice(0, 120);

    // Combine legacy scheduling fields into message
    const messageParts = [
      body.service       ? `Service: ${body.service}`             : null,
      body.preferredDate ? `Preferred date: ${body.preferredDate}` : null,
      body.preferredTime ? `Preferred time: ${body.preferredTime}` : null,
      body.notes         ? `Notes: ${body.notes}`                  : null,
      body.message       ? body.message                            : null,
    ].filter(Boolean);
    const message = messageParts.join(" | ").slice(0, 2000) || null;

    // Deterministic idempotency key — per Developer Guideline 7.4
    const hourBucket    = new Date().toISOString().slice(0, 13);
    const idempotencyKey = createHash("sha256")
      .update(`${subsidiary}:${contactEmail}:${companyName}:${hourBucket}`)
      .digest("hex");

    const handledByTenantId = await resolveBnlvTenantId();
    const ip = extractIp(req);

    const [row] = await db
      .insert(clientRequests)
      .values({
        idempotencyKey,
        companyName,
        contactName,
        contactEmail,
        subsidiary,
        message,
        requestedPlan:    "starter",
        status:           "pending",
        handledByTenantId,
      })
      .onConflictDoNothing({ target: clientRequests.idempotencyKey })
      .returning();

    // Audit log — actor format per ADR-001
    await db.insert(auditLogs).values({
      tenantId:  handledByTenantId,
      actor:     "system:landing-page",
      action:    `client.request:${subsidiary}`,
      target:    contactEmail,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, id: row?.id ?? null }, { status: 201 });
  } catch (error) {
    console.error("Client request submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Admin-protected status update
// ─────────────────────────────────────────────────────────────────────────────

// Valid status values from requestStatusEnum — per schema.ts
const VALID_STATUSES = ["pending", "approved", "rejected", "onboarded"] as const;
type RequestStatus = typeof VALID_STATUSES[number];

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);

    const denied = requireRole(ctx, "admin");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Request ID required" }, { status: 400 });
    }

    const status: RequestStatus = VALID_STATUSES.includes(body.status)
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
    const ip = extractIp(req);

    // Actor format per ADR-001: user:{userId}
    const actor = ctx.userId ? `user:${ctx.userId}` : "system:admin";

    await db.insert(auditLogs).values({
      tenantId,
      actor,
      action:    `client.request.${status}`,
      target:    row.contactEmail,   // FIX: was row.email — column is contactEmail
      ipAddress: ip,
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error("Client request patch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
