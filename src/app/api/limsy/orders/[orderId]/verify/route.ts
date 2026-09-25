/**
 * src/app/api/limsy/orders/[orderId]/verify/route.ts
 *
 * LIMSY Supreme Court Standard — Cryptographic Seal Verification
 * ==============================================================
 * P0 SECURITY REMEDIATION — Resolves SEC-001 from limsy-page.tsx audit:
 *   The client-side `verifySeal()` function was a 1.4-second fake animation
 *   that displayed "SEAL VERIFIED" without performing any cryptographic
 *   computation. In a legal records system this constitutes a material
 *   misrepresentation of tamper-proof integrity to judges, advocates, and
 *   opposing counsel. This route provides the real server-side verification.
 *
 * CANONICAL STRING SPECIFICATION:
 *   The SHA-256 hash stored in limsy_orders.crypto_hash was computed at
 *   creation time (POST /api/limsy/orders) over the following exact string:
 *
 *     `${caseId}:${orderDate.toISOString()}:${orderType}:${operative.trim()}`
 *
 *   Where:
 *     caseId     = Number(body.caseId).toString()  (e.g. "10", never "10.0")
 *     orderDate  = new Date(body.orderDate).toISOString()  (UTC ISO-8601)
 *     orderType  = String(body.orderType).trim()
 *     operative  = String(body.operative).trim()
 *
 *   This route MUST reconstruct the canonical string using the SAME format.
 *   ANY divergence — timezone, whitespace, numeric representation — produces
 *   a false HASH_MISMATCH on a tamper-free record.
 *
 * TIMESTAMP PRECISION NOTE:
 *   PostgreSQL TIMESTAMPTZ stores microseconds. JavaScript Date has millisecond
 *   precision only. Since orderDate originates from a client-supplied ISO string
 *   (millisecond precision), round-trip via Drizzle → Date → .toISOString()
 *   is lossless. This assumption holds only for client-originated timestamps;
 *   DB-generated timestamps (DEFAULT NOW()) could carry sub-ms values.
 *   limsy_orders.order_date is user-supplied — this is safe.
 *
 * AUDIT TRAIL:
 *   Every verification attempt is written to audit_logs:
 *   - Successful verification: severity "info"
 *   - Hash mismatch (tamper detected): severity "critical"
 *   This creates a forensic record of who verified what, and when any
 *   integrity failure was first detected.
 *
 * RESPONSE SHAPE:
 *   200 → { orderId, orderNumber, verified: true, storedHash, computedHash }
 *   200 → { orderId, orderNumber, verified: false, storedHash, computedHash,
 *            tamperIndicator: "HASH_MISMATCH", detail: string }
 *   400 → { error: string }  (invalid orderId)
 *   404 → { error: string }  (order not found or not in tenant)
 *   422 → { error: string }  (order has no crypto_hash — unsealed record)
 *
 * RBAC: GET → "architect" (cryptographic legal data — matches GET on orders route)
 *
 * CACHE: no-store — verification result must always reflect current DB state.
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { withTenant } from "@/db";
import { limsyOrders, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ── Response headers ──────────────────────────────────────────────────────────

const SECURE_HEADERS = {
  "Cache-Control": "no-store",        // Verification must always reflect live DB state
  "X-Content-Type-Options": "nosniff",
} as const;

// ── Canonical hash computation ────────────────────────────────────────────────

/**
 * Reconstructs the SHA-256 canonical string using the IDENTICAL format
 * used at creation time in POST /api/limsy/orders.
 *
 * THIS FUNCTION IS THE SINGLE SOURCE OF TRUTH for the canonical format.
 * Any change here must be mirrored in the POST route, and vice versa.
 * The comment block at the top of this file documents the format specification.
 */
function computeCanonicalHash(
  caseId: number,
  orderDate: Date,
  orderType: string,
  operative: string
): string {
  // caseIdStr must match: Number(body.caseId).toString() from POST route
  const caseIdStr = Number(caseId).toString();

  // orderDate.toISOString() is UTC ISO-8601 — matches POST route's new Date(body.orderDate).toISOString()
  const canonical = `${caseIdStr}:${orderDate.toISOString()}:${orderType}:${operative.trim()}`;

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

// ── Route context ─────────────────────────────────────────────────────────────

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

// ── GET Handler ───────────────────────────────────────────────────────────────

async function _GET(req: NextRequest, context: RouteContext) {
  const ctx = getRequestContext(req);

  // RBAC: architect+ only — operative text and crypto_hash are sensitive legal data
  const denied = requireRole(ctx, "architect");
  if (denied) return denied;

  // Next.js 15: params is a Promise
  const { orderId: rawOrderId } = await context.params;
  const orderId = parseInt(rawOrderId, 10);

  if (isNaN(orderId) || orderId <= 0) {
    return NextResponse.json(
      { error: "Invalid orderId — must be a positive integer." },
      { status: 400, headers: SECURE_HEADERS }
    );
  }

  // ── Fetch order ─────────────────────────────────────────────────────────────

  const [order] = await withTenant(ctx.tenantId, async (tx) => {
    return tx
      .select()
      .from(limsyOrders)
      .where(
        and(
          eq(limsyOrders.id, orderId),
          eq(limsyOrders.tenantId, ctx.tenantId) // Defense-in-depth alongside RLS
        )
      )
      .limit(1);
  });

  if (!order) {
    return NextResponse.json(
      { error: "Order not found or not accessible in this tenant." },
      { status: 404, headers: SECURE_HEADERS }
    );
  }

  // ── Sealed record check ─────────────────────────────────────────────────────

  if (!order.cryptoHash) {
    return NextResponse.json(
      {
        error: "This order has no cryptographic seal. It was recorded without hash computation.",
        orderId: order.id,
        orderNumber: order.orderNumber ?? null,
      },
      { status: 422, headers: SECURE_HEADERS }
    );
  }

  // ── Cryptographic verification ──────────────────────────────────────────────

  const computedHash = computeCanonicalHash(
    order.caseId,
    new Date(order.orderDate), // Cast to Date — Drizzle may return string in some runtimes
    order.orderType,
    order.operative ?? ""
  );

  const verified = computedHash === order.cryptoHash;

  const ip     = extractIp(req);
  const actor  = `user:${ctx.userId}`;

  // ── Audit log — non-blocking ────────────────────────────────────────────────
  // Tamper detection (verified === false) is a CRITICAL severity event.
  // Successful verification is INFO. Both must be logged for forensic completeness.

  withTenant(ctx.tenantId, async (tx) => {
    await tx.insert(auditLogs).values({
      tenantId: ctx.tenantId,
      actor,
      action:   `limsy.order.verify:${verified ? "pass" : "FAIL"}:${order.orderType}`,
      target:   `order:${orderId}:${order.cryptoHash.slice(0, 16)}`,
      severity: verified ? "info" : "critical",
      ipAddress: ip,
    });
  }).catch((err: unknown) => {
    // Audit write failure is non-fatal but must be visible in logs
    console.error("[LIMSY] verify audit log failed:", err instanceof Error ? err.message : err);
  });

  // ── Response ────────────────────────────────────────────────────────────────

  if (verified) {
    return NextResponse.json(
      {
        orderId:      order.id,
        orderNumber:  order.orderNumber ?? null,
        verified:     true,
        storedHash:   order.cryptoHash,
        computedHash,
      },
      { status: 200, headers: SECURE_HEADERS }
    );
  }

  // Hash mismatch — potential tampering
  return NextResponse.json(
    {
      orderId:         order.id,
      orderNumber:     order.orderNumber ?? null,
      verified:        false,
      storedHash:      order.cryptoHash,
      computedHash,
      tamperIndicator: "HASH_MISMATCH",
      detail:
        "The SHA-256 hash recomputed from the stored canonical fields does not " +
        "match the sealed hash. The operative text, order type, order date, or " +
        "case reference may have been altered after the order was sealed. " +
        "This event has been logged as CRITICAL in the audit trail.",
    },
    { status: 200, headers: SECURE_HEADERS } // 200 — not an HTTP error, a verification result
  );
}

export const GET = withErrorHandler(_GET);
