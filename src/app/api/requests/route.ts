/**
 * src/app/api/requests/route.ts
 *
 * Hardened Client Requests API Route
 * - GET:   Protected by admin role — returns all client intake records.
 * - POST:  Public intake aligned to clientRequests schema (Phase A).
 * - PATCH: Protected by admin role — updates request status.
 *
 * FIXES applied:
 *   1. runtime = "edge" enforced to provide native WebSocket support for Neon transactions.
 *   2. Node `crypto` replaced with `crypto.subtle` for Edge compatibility (ADR-001).
 *   3. ADR-001 Enforcement: All Drizzle queries strictly wrapped in withTenant().
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import { clientRequests, auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // CRITICAL: Edge runtime resolves the Neon WebSocket crash

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Admin-protected list of client requests
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const tenantId = ctx.tenantId || 1; 

  const rows = await withTenant(tenantId, async (tx) => {
    return tx
      .select()
      .from(clientRequests)
      .orderBy(desc(clientRequests.id))
      .limit(60);
  });

  return NextResponse.json(rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Public client intake
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const contactName  = String(body.name    ?? body.contactName  ?? "").trim();
    const contactEmail = String(body.email   ?? body.contactEmail ?? "").trim().toLowerCase();
    const companyName  = String(body.company ?? body.companyName  ?? "").trim();

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

    const subsidiary = String(
      body.subsidiary ?? req.headers.get("x-tenant-slug") ?? "general"
    ).slice(0, 120);

    const messageParts = [
      body.service       ? `Service: ${body.service}`             : null,
      body.preferredDate ? `Preferred date: ${body.preferredDate}` : null,
      body.preferredTime ? `Preferred time: ${body.preferredTime}` : null,
      body.notes         ? `Notes: ${body.notes}`                 : null,
      body.message       ? body.message                           : null,
    ].filter(Boolean);
    const message = messageParts.join(" | ").slice(0, 2000) || null;

    // Web Crypto API for Edge-compatible deterministic SHA-256
    const hourBucket = new Date().toISOString().slice(0, 13);
    const encoder = new TextEncoder();
    const data = encoder.encode(`${subsidiary}:${contactEmail}:${companyName}:${hourBucket}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const idempotencyKey = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const handledByTenantId = 1; 
    const ip = extractIp(req);

    // ADR-001: Mandatory Query Pattern (Insert & Audit scoped together)
    const insertedId = await withTenant(handledByTenantId, async (tx) => {
      const [row] = await tx
        .insert(clientRequests)
        .values({
          idempotencyKey,
          companyName,
          contactName,
          contactEmail,
          subsidiary,
          message,
          requestedPlan: "starter",
          status: "pending",
          handledByTenantId,
        })
        .onConflictDoNothing({ target: clientRequests.idempotencyKey })
        .returning();

      if (row) {
        await tx.insert(auditLogs).values({
          tenantId: handledByTenantId,
          actor: "system:landing-page",
          action: `client.request:${subsidiary}`,
          target: contactEmail,
          ipAddress: ip,
        });
      }

      return row?.id ?? null;
    });

    return NextResponse.json({ ok: true, id: insertedId }, { status: 201 });
  } catch (error) {
    console.error("Client request submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Admin-protected status update
// ─────────────────────────────────────────────────────────────────────────────

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

    const tenantIdHeader = req.headers.get("x-tenant-id");
    const tenantId: number = tenantIdHeader ? Number(tenantIdHeader) : 1;
    const ip = extractIp(req);
    const actor = ctx.userId ? `user:${ctx.userId}` : "system:admin";

    const row = await withTenant(tenantId, async (tx) => {
      const [updated] = await tx
        .update(clientRequests)
        .set({ status })
        .where(eq(clientRequests.id, Number(body.id)))
        .returning();

      if (updated) {
        await tx.insert(auditLogs).values({
          tenantId,
          actor,
          action: `client.request.${status}`,
          target: updated.contactEmail,
          ipAddress: ip,
        });
      }

      return updated;
    });

    if (!row) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Client request patch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}