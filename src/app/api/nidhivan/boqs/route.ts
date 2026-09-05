/**
 * src/app/api/nidhivan/boqs/route.ts
 * GET /api/nidhivan/boqs
 *
 * Returns all BOQ records with embedded line items and computed
 * financial aggregates. All monetary values remain in paise (bigint)
 * throughout the server layer — conversion to crore is done here
 * only for the aggregate display field.
 *
 * RBAC: developer minimum.
 * RLS:  withTenant() enforces tenant isolation.
 */

import { NextRequest, NextResponse }     from "next/server";
import { asc }                         from "drizzle-orm";
import { withErrorHandler }              from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                    from "@/db";
import { nidhivanBoqs, nidhivanBoqItems } from "@/db/schema";

export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const data = await withTenant(ctx.tenantId, async (tx) => {
    const [boqs, items] = await Promise.all([
      tx.select().from(nidhivanBoqs).orderBy(asc(nidhivanBoqs.id)),
      tx.select().from(nidhivanBoqItems).orderBy(asc(nidhivanBoqItems.id)),
    ]);

    // Attach items to their parent BOQ and compute financial aggregates.
    // All monetary values stay in paise — no floating-point division in DB
    // (TD-002: quantity is double_precision — Phase C migration to numeric(12,3))
    return boqs.map((boq: typeof nidhivanBoqs.$inferSelect) => {
      const boqItems = items.filter((i: typeof nidhivanBoqItems.$inferSelect) => i.boqId === boq.id);

      const totalAmountPaise = boqItems.reduce(
        (sum: number, i: { amountPaise?: number | string | null }) =>
          sum + Number(i.amountPaise ?? 0),
        0
      );

      return {
        ...boq,
        items: boqItems,
        aggregate: {
          itemCount:        boqItems.length,
          totalAmountPaise,
          // Display-only conversion — not stored, not used in calculations
          totalAmountCrore: (totalAmountPaise / 1_000_000_000).toFixed(4),
        },
      };
    });
  });

  return NextResponse.json({ success: true, data });
}

export const GET = withErrorHandler(_GET);