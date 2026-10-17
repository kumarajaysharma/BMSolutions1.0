/**
 * src/app/api/nidhivan/ra-bills/[billId]/reject/route.ts
 *
 * POST /api/nidhivan/ra-bills/:billId/reject
 *
 * Rejects an RA Bill from any active (non-terminal) status:
 *   SUBMITTED | UNDER_CHECK | CERTIFIED → REJECTED
 *
 * Body: { remarks: string }   (rejection reason is REQUIRED)
 *
 * Security:
 *   - Minimum role: 'architect' (same as L1 approver).
 *   - SOD: rejector cannot be the bill's maker.
 *   - Rejection is terminal — bill can no longer be approved.
 *     Maker must create a new DRAFT to restart the workflow.
 *   - Approval record appended to nidhivan_bill_approvals (immutable audit trail).
 */

import { NextRequest, NextResponse }     from "next/server";
import { eq, and }                        from "drizzle-orm";
import { withErrorHandler }               from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                     from "@/db";
import { nidhivanRaBills, nidhivanBillApprovals } from "@/db/schema";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ billId: string }> };

const REJECTABLE_STATUSES = new Set(["SUBMITTED", "UNDER_CHECK", "CERTIFIED"]);

async function _POST(req: NextRequest, { params }: RouteParams) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "architect");
  if (denied) return denied;

  const { billId } = await params;
  const id         = parseInt(billId, 10);
  const body       = await req.json();

  if (!body.remarks || typeof body.remarks !== "string" || body.remarks.trim() === "") {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "remarks is required for rejection (audit trail)." },
      { status: 400 },
    );
  }

  const rows = await withTenant(ctx.tenantId, (tx) =>
    tx
      .select({
        status:     nidhivanRaBills.status,
        makerId:    nidhivanRaBills.makerId,
        billNumber: nidhivanRaBills.billNumber,
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

  const { status, makerId, billNumber } = rows[0];

  if (!REJECTABLE_STATUSES.has(status as string)) {
    return NextResponse.json(
      {
        error:  "INVALID_TRANSITION",
        detail: `Bill ${billNumber} is in status ${status}. Only SUBMITTED, UNDER_CHECK, or CERTIFIED bills can be rejected.`,
      },
      { status: 409 },
    );
  }

  // SOD: rejector ≠ maker
  if (ctx.userId === makerId) {
    return NextResponse.json(
      {
        error:  "SOD_VIOLATION",
        detail: "The bill maker cannot reject their own submission. SOD invariant.",
      },
      { status: 422 },
    );
  }

  // Atomic: update + append approval record
  await withTenant(ctx.tenantId, async (tx) => {
    await tx
      .update(nidhivanRaBills)
      .set({ status: "REJECTED" })
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
        action:   "REJECTED",
        remarks:  body.remarks.trim(),
      });
  });

  return NextResponse.json({
    success: true,
    data: {
      billId:         id,
      billNumber,
      previousStatus: status,
      newStatus:      "REJECTED",
      rejectedBy:     ctx.userId,
    },
  });
}

export const POST = withErrorHandler(_POST);
