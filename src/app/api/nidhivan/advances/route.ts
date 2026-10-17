/**
 * src/app/api/nidhivan/advances/route.ts
 *
 * GET  /api/nidhivan/advances  — list project advances for the authenticated tenant
 * POST /api/nidhivan/advances  — sanction a Mobilisation or Secured Material advance
 *
 * Business rules:
 *   - Advances are subject to CGST Act Section 13(2): output GST must be
 *     booked immediately on advance receipt (before RA Bill is raised).
 *     cgst_on_advance_paise / sgst_on_advance_paise / igst_on_advance_paise
 *     are computed server-side and stored in paise (ADR-004).
 *   - Advance GST is later adjusted/reversed on recovery against RA Bills.
 *   - advanceAmountPaise must be a positive integer.
 *   - Sanctioned status is set on POST; disbursement via a separate PATCH.
 *
 * POST body:
 *   {
 *     projectId:          number,
 *     advanceType:        "MOBILISATION" | "SECURED_MATERIAL",
 *     contractorEntityId: number,
 *     advanceAmountPaise: number,   // ADR-004 integer paise
 *     igstRateBps:        number,   // e.g. 1800 = 18%
 *     isInterState:       boolean,
 *     remarks?:           string,
 *   }
 *
 * Security:
 *   - Sanctioning requires minimum role 'admin' (financial commitment gate).
 *   - All DB operations via withTenant() (ADR-001).
 */

import { NextRequest, NextResponse }     from "next/server";
import { desc, eq }                       from "drizzle-orm";
import { withErrorHandler }               from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                     from "@/db";
import { nidhivanProjectAdvances }        from "@/db/schema";
import { computeGst }                     from "@/lib/nidhivan/approval-engine";
import { gateVtN001Dpdp }                 from "@/lib/nidhivan/vantai-gates";

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

  const advances = await withTenant(ctx.tenantId, (tx) => {
    let q = tx
      .select()
      .from(nidhivanProjectAdvances)
      .$dynamic();

    if (projectId) q = q.where(eq(nidhivanProjectAdvances.projectId, parseInt(projectId, 10)));

    return q.orderBy(desc(nidhivanProjectAdvances.createdAt));
  });

  return NextResponse.json({ success: true, data: advances });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — sanction advance
// ─────────────────────────────────────────────────────────────────────────────
async function _POST(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "admin"); // financial commitment — admin gate
  if (denied) return denied;

  const body = await req.json();
  const {
    projectId,
    advanceType,
    contractorEntityId,
    advanceAmountPaise,
    igstRateBps,
    isInterState,
    remarks,
  } = body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!projectId || !advanceType || !contractorEntityId ||
      advanceAmountPaise === undefined || igstRateBps === undefined ||
      isInterState === undefined) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "Missing required fields." },
      { status: 400 },
    );
  }

  if (!["MOBILISATION", "SECURED_MATERIAL"].includes(advanceType)) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "advanceType must be MOBILISATION or SECURED_MATERIAL." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(advanceAmountPaise) || advanceAmountPaise <= 0) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "advanceAmountPaise must be a positive integer (paise, ADR-004)." },
      { status: 400 },
    );
  }

  // ── VT-N-001: DPDP gate ─────────────────────────────────────────────────────
  const g1 = await gateVtN001Dpdp(ctx.tenantId, projectId);
  if (g1.status === "BLOCKED") {
    return NextResponse.json(
      { error: "VANTAI_BLOCKED", gate: g1 },
      { status: 403 },
    );
  }

  // ── CGST Act Section 13(2): GST on advance receipt ─────────────────────────
  // Output GST is booked on the advance amount at point of receipt.
  // On recovery against RA Bill, journal entry is reversed.
  const gst = computeGst(advanceAmountPaise, igstRateBps, isInterState);

  // ── Insert advance (status: SANCTIONED) ────────────────────────────────────
  const inserted = await withTenant(ctx.tenantId, (tx) =>
    tx
      .insert(nidhivanProjectAdvances)
      .values({
        tenantId:             ctx.tenantId,
        projectId,
        advanceType,
        status:               "SANCTIONED",
        contractorEntityId,
        advanceAmountPaise,
        // CGST Act S.13(2): advance GST stored separately for adjustment tracking
        cgstOnAdvancePaise:   gst.cgstAmountPaise,
        sgstOnAdvancePaise:   gst.sgstAmountPaise,
        igstOnAdvancePaise:   gst.igstAmountPaise,
        disbursementJournalId: null,  // set after disbursement journal is posted
        sanctionedById:       ctx.userId,
        recoveredAmountPaise: 0,
        remarks:              remarks ?? null,
      })
      .returning(),
  );

  return NextResponse.json(
    {
      success: true,
      data:    inserted[0],
      _gstOnAdvance: {
        cgstAmountPaise: gst.cgstAmountPaise,
        sgstAmountPaise: gst.sgstAmountPaise,
        igstAmountPaise: gst.igstAmountPaise,
        note: "CGST Act S.13(2): output GST booked on advance receipt. Reverse on recovery.",
      },
    },
    { status: 201 },
  );
}

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
