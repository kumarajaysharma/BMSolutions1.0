// @ts-nocheck
/**
 * src/app/api/nidhivan/ra-bills/[billId]/approve/route.ts
 *
 * POST /api/nidhivan/ra-bills/:billId/approve
 *
 * Advances an RA Bill through the Maker-Checker-Approver flow:
 *
 *   SUBMITTED          → (L1_APPROVED by architect) → UNDER_CHECK
 *   UNDER_CHECK        → (L2_APPROVED by admin)     → CERTIFIED
 *                                                    → APPROVED_FOR_PAYMENT  [L1_L2 tier]
 *   CERTIFIED          → (L3_APPROVED by admin)     → CERTIFIED / APPROVED_FOR_PAYMENT [L1_L2_L3]
 *   CERTIFIED          → (L4_APPROVED by owner)     → APPROVED_FOR_PAYMENT  [L1_L2_L3_L4]
 *
 * Body:
 *   {
 *     action:   "L1_APPROVED" | "L2_APPROVED" | "L3_APPROVED" | "L4_APPROVED",
 *     remarks?: string,
 *   }
 *
 * Security:
 *   - SOD: approver cannot be the bill's maker (userId stored at SUBMITTED).
 *   - Role validated against action via approval-engine state machine.
 *   - All mutations inside withTenant() transaction (ADR-001/002).
 *   - VANTAI VT-N-002 check on final approval step (APPROVED_FOR_PAYMENT).
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
  validateApprovalTransition,
  computeBoqVariationPct,
  type ApprovalAction,
}                                         from "@/lib/nidhivan/approval-engine";
import { gateVtN002Tds194c, gateVtN003EInvoice } from "@/lib/nidhivan/vantai-gates";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ billId: string }> };

const VALID_APPROVE_ACTIONS = new Set<ApprovalAction>([
  "L1_APPROVED", "L2_APPROVED", "L3_APPROVED", "L4_APPROVED",
]);

async function _POST(req: NextRequest, { params }: RouteParams) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "architect"); // minimum for any approval action
  if (denied) return denied;

  const { billId } = await params;
  const id         = parseInt(billId, 10);
  const body       = await req.json();
  const { action, remarks } = body;

  if (!VALID_APPROVE_ACTIONS.has(action as ApprovalAction)) {
    return NextResponse.json(
      {
        error:  "VALIDATION_ERROR",
        detail: `action must be one of: ${[...VALID_APPROVE_ACTIONS].join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // ── Fetch bill ──────────────────────────────────────────────────────────────
  const rows = await withTenant(ctx.tenantId, (tx) =>
    tx
      .select({
        id:               nidhivanRaBills.id,
        billNumber:       nidhivanRaBills.billNumber,
        status:           nidhivanRaBills.status,
        makerId:          nidhivanRaBills.createdBy,
        projectId:        nidhivanRaBills.projectId,
        boqId:            nidhivanRaBills.boqId,
        grossAmountPaise: nidhivanRaBills.grossAmountPaise,
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

  // ── Compute tier ────────────────────────────────────────────────────────────
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

  // ── State machine validation ────────────────────────────────────────────────
  const validation = validateApprovalTransition(
    bill.status as any,
    action as ApprovalAction,
    ctx.role,
    ctx.userId,
    bill.createdBy!,
    tier,
  );

  if (!validation.allowed) {
    return NextResponse.json(
      { error: "APPROVAL_DENIED", detail: validation.reason },
      { status: 422 },
    );
  }

  const nextStatus = validation.nextStatus!;

  // ── VANTAI gates on final approval step (→ APPROVED_FOR_PAYMENT) ───────────
  if (nextStatus === "APPROVED_FOR_PAYMENT") {
    const [g2, g3] = await Promise.all([
      gateVtN002Tds194c(ctx.tenantId, id),
      gateVtN003EInvoice(ctx.tenantId, id),
    ]);

    const blocked = [g2, g3].filter((g) => g.status !== "PASSED");
    if (blocked.length > 0) {
      return NextResponse.json(
        {
          error:  "VANTAI_BLOCKED",
          detail: "One or more VANTAI gates must be cleared before final approval.",
          gates:  blocked,
        },
        { status: 403 },
      );
    }
  }

  // ── Atomic: update status + insert approval record ──────────────────────────
  await withTenant(ctx.tenantId, async (tx) => {
    await tx
      .update(nidhivanRaBills)
      .set({ status: nextStatus as any })
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
        action:   action as any,
        remarks:  remarks ?? null,
      });
  });

  return NextResponse.json({
    success: true,
    data: {
      billId:       id,
      billNumber:   bill.billNumber,
      action,
      previousStatus: bill.status,
      newStatus:    nextStatus,
      approvalTier: tier,
    },
  });
}

export const POST = withErrorHandler(_POST);
