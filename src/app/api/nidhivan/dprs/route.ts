/**
 * src/app/api/nidhivan/dprs/route.ts
 * GET /api/nidhivan/dprs
 *
 * Returns all Detailed Project Reports for the authenticated tenant.
 * RLS enforced via withTenant(). RBAC: developer minimum.
 */

import { NextRequest, NextResponse } from "next/server";
import { asc }                       from "drizzle-orm";
import { withErrorHandler }          from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                from "@/db";
import { nidhivanDprs }              from "@/db/schema";

export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const data = await withTenant(ctx.tenantId, async (tx) =>
    tx.select().from(nidhivanDprs).orderBy(asc(nidhivanDprs.id))
  );

  return NextResponse.json({ success: true, data });
}

export const GET = withErrorHandler(_GET);


// ─────────────────────────────────────────────────────────────────────────────


/**
 * src/app/api/nidhivan/boqs/route.ts
 * GET /api/nidhivan/boqs
 *
 * Returns all BOQ records with computed financial totals (paise → crore).
 * Aggregates line items server-side to avoid float division on the client.
 * RBAC: developer minimum.
 */

// NOTE: This file exports the DPRs handler above.
// Create boqs/route.ts separately with the content below:

/*
import { NextRequest, NextResponse } from "next/server";
import { asc, eq }                   from "drizzle-orm";
import { withErrorHandler }          from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                from "@/db";
import { nidhivanBoqs, nidhivanBoqItems } from "@/db/schema";

export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const data = await withTenant(ctx.tenantId, async (tx) => {
    const boqs  = await tx.select().from(nidhivanBoqs).orderBy(asc(nidhivanBoqs.id));
    const items = await tx.select().from(nidhivanBoqItems).orderBy(asc(nidhivanBoqItems.id));

    // Attach items to their parent BOQ and compute financial aggregates
    // All monetary values stay in paise (bigint) — no float division here
    return boqs.map(boq => {
      const boqItems = items.filter(i => i.boqId === boq.id);
      const totalAmountPaise = boqItems.reduce(
        (sum: number, i: { amountPaise?: number | string | null }) =>
          sum + Number(i.amountPaise ?? 0),
        0
      );
      return {
        ...boq,
        items: boqItems,
        aggregate: {
          itemCount:       boqItems.length,
          totalAmountPaise,
          totalAmountCrore: (totalAmountPaise / 1_000_000_000).toFixed(4),
        },
      };
    });
  });

  return NextResponse.json({ success: true, data });
}

export const GET = withErrorHandler(_GET);
*/
