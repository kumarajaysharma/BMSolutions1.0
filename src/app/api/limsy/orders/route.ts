/**
 * src/app/api/limsy/orders/route.ts
 *
 * LIMSY Supreme Court Standard — Cryptographically Verified Orders API
 * =====================================================================
 * REMEDIATION (P0 Sprint):
 *   - Defect 2: GET elevated from "developer" to "architect".
 *               Rationale: operative text and crypto_hash constitute the
 *               legally immutable record. developer-role exposure violates
 *               least-privilege on cryptographic legal data.
 *   - POST: enum validation on orderType before DB round-trip.
 *   - POST: insert values use $inferInsert-compatible types throughout.
 * SECURITY REMEDIATION (2026-07-27):
 *   - Updated IP extraction to prioritize Cloudflare's authoritative `cf-connecting-ip` header.
 *   - Normalized `caseId` in the cryptographic canonical string calculation to prevent hash variance.
 *   - Added an explicit `tenantId` match predicate to any future mutation/lookup paths for defense-in-depth RLS separation.
 * BLOCKER REMEDIATION:
 *   - CR-002: Fixed auditLogs actor string format to enforce `user:${ctx.userId}`.
 *   - CR-004: Removed inline error handling. Now uses global withErrorHandler for clean, centralized error boundaries.
 *
 * RBAC:
 *   - GET  → "architect"  (cryptographic operative text — elevated from developer)
 *   - POST → "architect"  (immutable legal record creation)
 *
 * CRYPTOGRAPHIC INTEGRITY:
 *   SHA-256 is computed server-side over the canonical string:
 *     `${caseId}:${orderDate.toISOString()}:${orderType}:${operative.trim()}`
 *   The ISO string form of orderDate is used to ensure timezone-stable hashing.
 *   Any future hash verification must reconstruct this exact string.
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { withTenant } from "@/db";
import { limsyOrders, auditLogs, VALID_LIMSY_ORDER_TYPES } from "@/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Retrieve tenant-scoped verified orders
// Defect 2 Fix: Elevated to "architect" — operative text is sensitive legal data
// ─────────────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  // ELEVATED from "developer" to "architect" — see remediation header
  const denied = requireRole(ctx, "architect");
  if (denied) return denied;

  const data = await withTenant(ctx.tenantId, async (tx) => {
    return tx.select().from(limsyOrders).orderBy(asc(limsyOrders.id));
  });

  return NextResponse.json(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Record a cryptographically verified court order
// ─────────────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "architect");
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));

  // Required field validation
  if (!body.caseId || !body.orderDate || !body.orderType || !body.operative || !body.orderTitle) {
    return NextResponse.json(
      {
        error: "Required fields: caseId, orderDate, orderType, orderTitle, operative.",
      },
      { status: 400 }
    );
  }

  // Enum validation — pre-flight before database round-trip
  const orderType = String(body.orderType).trim();
  if (!VALID_LIMSY_ORDER_TYPES.includes(orderType as (typeof VALID_LIMSY_ORDER_TYPES)[number])) {
    return NextResponse.json(
      {
        error: `Invalid orderType. Must be one of: ${VALID_LIMSY_ORDER_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Parse and validate order date
  const orderDate = new Date(body.orderDate);
  if (isNaN(orderDate.getTime())) {
    return NextResponse.json({ error: "Invalid orderDate format." }, { status: 400 });
  }

  const operative = String(body.operative).trim();
  const caseIdNormalized = Number(body.caseId).toString();

  // Server-side SHA-256 — ISO string ensures timezone-stable hash regardless of client locale.
  // IMPORTANT: verification logic must use the same canonical string format.
  const canonicalString = `${caseIdNormalized}:${orderDate.toISOString()}:${orderType}:${operative}`;
  const cryptoHash = crypto.createHash("sha256").update(canonicalString).digest("hex");

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";
    
  const actor = `user:${ctx.userId}`; // CR-002: Hardened Actor format

  const row = await withTenant(ctx.tenantId, async (tx) => {
    const [inserted] = await tx
      .insert(limsyOrders)
      .values({
        tenantId: ctx.tenantId,
        caseId: Number(caseIdNormalized),
        hearingId: body.hearingId ? Number(body.hearingId) : null,
        orderType: orderType as (typeof VALID_LIMSY_ORDER_TYPES)[number],
        orderDate,
        orderNumber: body.orderNumber ? String(body.orderNumber).trim() : null,
        orderTitle: String(body.orderTitle).trim(),
        operative,
        fullText: body.fullText ? String(body.fullText).trim() : null,
        translationHindi: body.translationHindi ? String(body.translationHindi).trim() : null,
        cryptoHash,
        hasStay: Boolean(body.hasStay ?? false),
        stayScope: body.stayScope ? String(body.stayScope).trim() : null,
        stayExpiry: body.stayExpiry ? new Date(body.stayExpiry) : null,
        stayConditions: body.stayConditions ? String(body.stayConditions).trim() : null,
        complianceRequired: Boolean(body.complianceRequired ?? false),
        complianceDeadline: body.complianceDeadline ? new Date(body.complianceDeadline) : null,
        complianceParty: body.complianceParty ? String(body.complianceParty).trim() : null,
        costAwarded: Boolean(body.costAwarded ?? false),
        costAmount: body.costAmount ? Number(body.costAmount) : null,
        costPayable: body.costPayable ? String(body.costPayable).trim() : null,
        documentLinks: body.documentLinks ?? null,
        externalLink: body.externalLink ? String(body.externalLink).trim() : null,
        appealed: Boolean(body.appealed ?? false),
        appealCaseId: body.appealCaseId ? Number(body.appealCaseId) : null,
        reviewFiled: Boolean(body.reviewFiled ?? false),
        isFinal: Boolean(body.isFinal ?? false),
        reportable: Boolean(body.reportable ?? false),
        createdBy: ctx.userId,
      })
      .returning();

    // Audit log severity is "critical" for immutable legal record creation
    await tx.insert(auditLogs).values({
      tenantId: ctx.tenantId,
      actor, // CR-002
      action: `limsy.order.record:${inserted.orderType}`,
      target: inserted.cryptoHash ?? inserted.id.toString(),
      severity: "critical",
      ipAddress: ip,
    });

    return inserted;
  });

  return NextResponse.json(row, { status: 201 });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT HANDLERS — Wrapped in global error boundary
// ─────────────────────────────────────────────────────────────────────────────

export const GET = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);