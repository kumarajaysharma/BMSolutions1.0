/**
 * src/app/api/nidhivan/ra-bills/[billId]/route.ts
 *
 * GET   /api/nidhivan/ra-bills/:billId  — fetch full bill detail
 * PATCH /api/nidhivan/ra-bills/:billId  — update mutable fields on DRAFT bills
 *                                          or set vt_n002_gate_passed (admin only)
 *
 * Security:
 *   - RLS via withTenant() (ADR-001).
 *   - PATCH of vt_n002_gate_passed requires minimum role 'admin' (VT-N-002 gate).
 *   - PATCH of financial fields only permitted on DRAFT status bills.
 *
 * PATCH body (all optional):
 *   {
 *     remarks?:            string,
 *     vtN002GatePassed?:   boolean,  // admin-only: sets TDS 194C human gate
 *     eInvoiceIrn?:        string,   // admin-only: NIC IRP acknowledgement
 *   }
 *
 *   NOTE: Recalculation of GST/TDS requires creating a new DRAFT or using
 *   the RECALLED → edit → re-SUBMIT workflow. Financial amounts are immutable
 *   once submitted (ADR append-only intent).
 */

import { NextRequest, NextResponse }     from "next/server";
import { eq, and }                        from "drizzle-orm";
import { withErrorHandler }               from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                     from "@/db";
import { nidhivanRaBills, nidhivanBillApprovals } from "@/db/schema";
import { determineApprovalTier }          from "@/lib/nidhivan/approval-engine";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ billId: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET — bill detail with approval trail
// ─────────────────────────────────────────────────────────────────────────────
async function _GET(req: NextRequest, { params }: RouteParams) {
  const ctx      = getRequestContext(req);
  const denied   = requireRole(ctx, "developer");
  if (denied) return denied;

  const { billId } = await params;
  const id         = parseInt(billId, 10);

  const [bill, approvals] = await Promise.all([
    withTenant(ctx.tenantId, (tx) =>
      tx
        .select()
        .from(nidhivanRaBills)
        .where(
          and(
            eq(nidhivanRaBills.id,       id),
            eq(nidhivanRaBills.tenantId, ctx.tenantId),
          ),
        )
        .limit(1),
    ),
    withTenant(ctx.tenantId, (tx) =>
      tx
        .select()
        .from(nidhivanBillApprovals)
        .where(eq(nidhivanBillApprovals.billId, id)),
    ),
  ]);

  if (!bill.length) {
    return NextResponse.json(
      { error: "NOT_FOUND", detail: `RA Bill ${id} not found.` },
      { status: 404 },
    );
  }

  const b    = bill[0];
  const tier = determineApprovalTier(
    Number(b.grossAmountPaise),
    0, // BOQ variation not yet tracked on bill; computed at submit time
  );

  return NextResponse.json({
    success: true,
    data:    { ...b, _approvalTier: tier },
    trail:   approvals,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — update mutable fields
// ─────────────────────────────────────────────────────────────────────────────
async function _PATCH(req: NextRequest, { params }: RouteParams) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const { billId } = await params;
  const id         = parseInt(billId, 10);
  const body       = await req.json();

  // Fetch current bill (tenant-scoped)
  const rows = await withTenant(ctx.tenantId, (tx) =>
    tx
      .select({ status: nidhivanRaBills.status })
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

  const currentStatus = rows[0].status;
  const updates: Record<string, unknown> = {};

  // remarks: permitted on any non-terminal status
  if (body.remarks !== undefined) {
    if (!["PAID", "REJECTED"].includes(currentStatus as string)) {
      updates.remarks = body.remarks;
    } else {
      return NextResponse.json(
        { error: "IMMUTABLE", detail: "Cannot update remarks on a terminal-status bill." },
        { status: 409 },
      );
    }
  }

  // vtN002GatePassed: admin-only (VT-N-002 human gate)
  if (body.vtN002GatePassed !== undefined) {
    const adminCheck = requireRole(ctx, "admin");
    if (adminCheck) return adminCheck;
    updates.vtN002GatePassed = Boolean(body.vtN002GatePassed);
  }

  // eInvoiceIrn: admin-only (NIC IRP integration)
  if (body.eInvoiceIrn !== undefined) {
    const adminCheck = requireRole(ctx, "admin");
    if (adminCheck) return adminCheck;
    if (typeof body.eInvoiceIrn !== "string" || body.eInvoiceIrn.trim() === "") {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", detail: "eInvoiceIrn must be a non-empty string." },
        { status: 400 },
      );
    }
    updates.eInvoiceIrn = body.eInvoiceIrn.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "No updatable fields provided." },
      { status: 400 },
    );
  }

  const updated = await withTenant(ctx.tenantId, (tx) =>
    tx
      .update(nidhivanRaBills)
      .set(updates)
      .where(
        and(
          eq(nidhivanRaBills.id,       id),
          eq(nidhivanRaBills.tenantId, ctx.tenantId),
        ),
      )
      .returning(),
  );

  return NextResponse.json({ success: true, data: updated[0] });
}

export const GET   = withErrorHandler(_GET);
export const PATCH = withErrorHandler(_PATCH);
