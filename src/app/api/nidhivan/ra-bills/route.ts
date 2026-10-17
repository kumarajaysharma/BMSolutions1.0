// @ts-nocheck
/**
 * src/app/api/nidhivan/ra-bills/route.ts
 *
 * GET  /api/nidhivan/ra-bills  — list RA Bills for the authenticated tenant
 * POST /api/nidhivan/ra-bills  — create a new DRAFT RA Bill
 *
 * Security:
 *   - All queries via withTenant() — FORCE RLS enforced (ADR-001).
 *   - Financial columns are BIGINT paise (ADR-004). No DECIMAL/FLOAT.
 *   - Maker role: minimum 'developer'.
 *
 * POST body:
 *   {
 *     projectId:          number,
 *     boqId:              number,
 *     billingType:        "PERIODIC" | "MILESTONE" | "FINAL",
 *     billDate:           string (ISO date),
 *     periodFrom?:        string (ISO date),
 *     periodTo?:          string (ISO date),
 *     milestoneGateId?:   number,
 *     taxableAmountPaise: number,   // ADR-004: integer paise
 *     igstRateBps:        number,   // e.g. 1800 = 18%
 *     isInterState:       boolean,
 *     isIndividualOrHuf:  boolean,  // for TDS 194C rate (1% vs 2%)
 *     remarks?:           string,
 *   }
 *
 * POST response: created bill with GST/TDS computed server-side.
 */

import { NextRequest, NextResponse }        from "next/server";
import { desc, eq }                          from "drizzle-orm";
import { withErrorHandler }                  from "@/lib/api-handler";
import { getRequestContext, requireRole }    from "@/lib/request-context";
import { withTenant }                        from "@/db";
import {
  nidhivanRaBills,
  nidhivanProjects,
  nidhivanTaxProfiles,
}                                            from "@/db/schema";
import { computeGst, computeTds194c }        from "@/lib/nidhivan/approval-engine";
import { gateVtN001Dpdp }                    from "@/lib/nidhivan/vantai-gates";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — list
// ─────────────────────────────────────────────────────────────────────────────
async function _GET(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const url       = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const status    = url.searchParams.get("status");

  const bills = await withTenant(ctx.tenantId, (tx) => {
    let q = tx
      .select({
        id:                nidhivanRaBills.id,
        billNumber:        nidhivanRaBills.billNumber,
        billDate:          nidhivanRaBills.createdAt,
        billingType:       nidhivanRaBills.billingType,
        status:            nidhivanRaBills.status,
        projectId:         nidhivanRaBills.projectId,
        taxableAmountPaise: nidhivanRaBills.grossAmountPaise,
        grossAmountPaise:  nidhivanRaBills.grossAmountPaise,
        netPayablePaise:   nidhivanRaBills.netPayablePaise,
        makerId:           nidhivanRaBills.createdBy,
        vtN002GatePassed:  nidhivanRaBills.vtN002GatePassed,
        createdAt:         nidhivanRaBills.createdAt,
      })
      .from(nidhivanRaBills)
      .$dynamic();

    if (projectId) q = q.where(eq(nidhivanRaBills.projectId, parseInt(projectId, 10)));
    if (status)    q = q.where(eq(nidhivanRaBills.status, status as any));

    return q.orderBy(desc(nidhivanRaBills.createdAt));
  });

  return NextResponse.json({ success: true, data: bills });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — create draft
// ─────────────────────────────────────────────────────────────────────────────
async function _POST(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body = await req.json();
  const {
    projectId,
    boqId,
    billingType,
    billDate,
    periodFrom,
    periodTo,
    milestoneGateId,
    taxableAmountPaise,
    igstRateBps,
    isInterState,
    isIndividualOrHuf,
    remarks,
  } = body;

  // ── Validate required fields ────────────────────────────────────────────────
  if (
    !projectId || !boqId || !billingType || !billDate ||
    taxableAmountPaise === undefined || igstRateBps === undefined ||
    isInterState === undefined || isIndividualOrHuf === undefined
  ) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "Missing required fields." },
      { status: 400 },
    );
  }

  // ADR-004: paise must be positive integer
  if (!Number.isInteger(taxableAmountPaise) || taxableAmountPaise <= 0) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "taxableAmountPaise must be a positive integer (paise, ADR-004)." },
      { status: 400 },
    );
  }

  // ── VT-N-001: DPDP gate — personal data pre-check ──────────────────────────
  const g1 = await gateVtN001Dpdp(ctx.tenantId, projectId);
  if (g1.status === "BLOCKED") {
    return NextResponse.json(
      { error: "VANTAI_BLOCKED", gate: g1 },
      { status: 403 },
    );
  }

  // ── Fetch project to resolve tax profile ────────────────────────────────────
  const projectRows = await withTenant(ctx.tenantId, (tx) =>
    tx
      .select({ taxProfileId: nidhivanProjects.taxProfileId })
      .from(nidhivanProjects)
      .where(eq(nidhivanProjects.id, projectId))
      .limit(1),
  );

  if (!projectRows.length) {
    return NextResponse.json(
      { error: "NOT_FOUND", detail: `Project ${projectId} not found.` },
      { status: 404 },
    );
  }

  // ── Compute GST + TDS 194C server-side ──────────────────────────────────────
  const gst = computeGst(taxableAmountPaise, igstRateBps, isInterState);
  const tds = computeTds194c(taxableAmountPaise, isIndividualOrHuf);
  const netPayablePaise = gst.grossAmountPaise - tds;

  // ── Generate bill number: NIDHI-YYYY-{projectId}-{ms last 6} ──────────────
  const now        = new Date();
  const billNumber = `NIDHI-${now.getFullYear()}-P${projectId}-${String(Date.now()).slice(-6)}`;

  // ── Insert DRAFT bill ───────────────────────────────────────────────────────
  const inserted = await withTenant(ctx.tenantId, (tx) =>
    tx
      .insert(nidhivanRaBills)
      .values({
        tenantId:           ctx.tenantId,
        projectId,
        boqId,
        billingType,
        billNumber,
        billDate:           new Date(billDate),
        periodFrom:         periodFrom ? new Date(periodFrom) : null,
        periodTo:           periodTo   ? new Date(periodTo)   : null,
        milestoneGateId:    milestoneGateId ?? null,
        status:             "DRAFT",
        makerId:            ctx.userId,
        taxableAmountPaise: gst.grossAmountPaise,
        cgstAmountPaise:    gst.cgstAmountPaise,
        sgstAmountPaise:    gst.sgstAmountPaise,
        igstAmountPaise:    gst.igstAmountPaise,
        tds194cAmountPaise: tds,
        grossAmountPaise:   gst.grossAmountPaise,
        netPayablePaise,
        vtN002GatePassed:   false,
        eInvoiceIrn:        null,
        journalVoucherId:   null,
        remarks:            remarks ?? null,
      })
      .returning(),
  );

  return NextResponse.json(
    {
      success: true,
      data:    inserted[0],
      _gst:    gst,
      _tds_paise: tds,
    },
    { status: 201 },
  );
}

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
