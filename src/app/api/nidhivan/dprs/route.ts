/**
 * src/app/api/nidhivan/dprs/route.ts
 * GET /api/nidhivan/dprs
 *
 * Returns all Detailed Project Reports for the authenticated tenant.
 * RLS enforced via withTenant() — cross-tenant leakage structurally impossible.
 * RBAC: developer minimum (read-only financial document metadata).
 */

import { NextRequest, NextResponse }     from "next/server";
import { asc }                           from "drizzle-orm";
import { withErrorHandler }              from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                    from "@/db";
import { nidhivanDprs }                  from "@/db/schema";

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
