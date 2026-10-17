/**
 * src/app/api/nidhivan/ra-bills/[billId]/submit/route.ts
 *
 * POST /api/nidhivan/ra-bills/:billId/submit
 *
 * Transitions a DRAFT RA Bill → SUBMITTED and records the SUBMITTED
 * approval action in nidhivan_bill_approvals (append-only, immutable).
 *
 * Approval tier is computed at submit time from the bill gross amount
 * and BOQ variation percentage (fetched from the BOQ).
 *
 * Security:
 *   - Minimum role: 'developer' (maker).
 *   - VT-N-001 gate checked before submit.
 *   - Bill must be in DRAFT status.
 *   - Actor becomes the recorded maker for all subsequent SOD checks.
 *
 * Body: { remarks?: string }
 */

import { NextRequest, NextResponse }     from "next/server";
import { eq, and }                        from "drizzle-orm";
import { withErrorHandler }               from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                     from "@/db";
import {
  nidhivanRaBills,
  nidhivanBillApprovals,
  nidhivanBoqs,
}                                         from "@/db/schema";
import {
  determineApprovalTier,
  computeBoqVariationPct,
}                                         from "@/lib/nidhivan/approval-engine";
import { gateVtN001Dpdp }                 from "@/lib/nidhivan/vantai-gates";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ billId: string }> };

async function _POST(req: NextRequest, { params }: RouteParams) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const { billId } = await params;
  const id         = parseInt(billId, 10);
  const body       = await req.json().catch(() => ({}));

  // ── Fetch bill ──────────────────────────────────────────────────────────────
  const rows = await withTenant(ctx.tenantId, (tx) =>
    tx
      .select({
        id:                nidhivanRaBills.id,
        status:            nidhivanRaBills.status,
        makerId:           nidhivanRaBills.makerId,
        projectId:         nidhivanRaBills.projectId,
        boqId:             nidhivanRaBills.boqId,
        grossAmountPaise:  nidhivanRaBills.grossAmountPaise,
        billNumber:        nidhivanRaBills.billNumber,
      })
      .from(nidhivanRaBills)
      .where(
        and(
          eq(nidhivanRaBills.id,       id),
          eq(nidhivanRaBills.tenantId, ctx.tenantId),
        ),
      )
      .limit(1),
  );

  if (!rows.length) {
    return NextResponse.json(
      { error: "NOT_FOUND", detail: `RA Bill ${id} not found.` },
      { status: 404 },
    );
  }

  const bill = rows[0];

  if (bill.status !== "DRAFT") {
    return NextResponse.json(
      { error: "INVALID_TRANSITION", detail: `Bill is in status ${bill.status}; only DRAFT bills can be submitted.` },
      { status: 409 },
    );
  }

  // ── VT-N-001 gate ───────────────────────────────────────────────────────────
  const g1 = await gateVtN001Dpdp(ctx.tenantId, bill.projectId!);
  if (g1.status === "BLOCKED") {
    return NextResponse.json(
      { error: "VANTAI_BLOCKED", gate: g1 },
      { status: 403 },
    );
  }

  // ── Compute BOQ variation for tier determination ────────────────────────────
  let boqVariationPct = 0;
  if (bill.boqId) {
    const boqRows = await withTenant(ctx.tenantId, (tx) =>
      tx
        .select({ totalAmountPaise: nidhivanBoqs.totalAmountPaise })
        .from(nidhivanBoqs)
        .where(eq(nidhivanBoqs.id, bill.boqId!))
        .limit(1),
    );
    if (boqRows.length && boqRows[0].totalAmountPaise) {
      boqVariationPct = computeBoqVariationPct(
        Number(boqRows[0].totalAmountPaise),
        Number(bill.grossAmountPaise),
      );
    }
  }

  const tier = determineApprovalTier(Number(bill.grossAmountPaise), boqVariationPct);

  // ── Transition DRAFT → SUBMITTED (atomic: update + insert approval) ─────────
  await withTenant(ctx.tenantId, async (tx) => {
    await tx
      .update(nidhivanRaBills)
      .set({ status: "SUBMITTED" })
      .where(
        and(
          eq(nidhivanRaBills.id,       id),
          eq(nidhivanRaBills.tenantId, ctx.tenantId),
        ),
      );

    await tx
      .insert(nidhivanBillApprovals)
      .values({
        tenantId: ctx.tenantId,
        billId:   id,
        actorId:  ctx.userId,
        action:   "SUBMITTED",
        remarks:  body.remarks ?? null,
      });
  });

  return NextResponse.json({
    success: true,
    data: {
      billId:          id,
      billNumber:      bill.billNumber,
      newStatus:       "SUBMITTED",
      approvalTier:    tier,
      boqVariationPct: Math.round(boqVariationPct * 100) / 100,
    },
  });
}

export const POST = withErrorHandler(_POST);
