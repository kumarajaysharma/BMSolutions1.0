/**
 * src/app/api/nidhivan/cockpit/route.ts
 *
 * Nidhivan Consulting — Executive Cockpit Data Feed
 * ==================================================
 * Aggregates live data from 0018 Nidhivan tables for the executive
 * cockpit dashboard at /studio/nidhivan/cockpit.
 *
 * Returns a single JSON response with all cockpit data in one call
 * to minimise waterfall latency on the client.
 *
 * RBAC: viewer+ (read-only aggregation — no financial mutation)
 * CACHE: no-store — RLS-scoped data; never cache across tenants
 *
 * DATA SOURCES (all from migration 0018 + earlier migrations):
 *   nidhivan_entities        → advisory portfolio + AUM
 *   nidhivan_research        → latest desk publications
 *   nidhivan_closes          → open period closes requiring action
 *   nidhivan_lab             → active fintech experiments
 *   client_requests          → incoming pipeline (deal stages)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { withTenant } from '@/db';
import {
  nidhivanEntities, nidhivanResearch, nidhivanCloses,
  nidhivanLab, clientRequests,
} from '@/db/schema';
import { eq, desc, and, count, sum } from 'drizzle-orm';
import { getRequestContext, requireRole } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

const SECURE_HEADERS = { 'Cache-Control': 'no-store' } as const;

async function _GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, 'viewer');
  if (denied) return denied;

  const data = await withTenant(ctx.tenantId, async (tx) => {

    // ── 1. Advisory portfolio ───────────────────────────────────────────────
    const entities = await tx
      .select({
        id:           nidhivanEntities.id,
        name:         nidhivanEntities.name,
        ticker:       nidhivanEntities.ticker,
        sector:       nidhivanEntities.sector,
        status:       nidhivanEntities.status,
        relationship: nidhivanEntities.relationship,
        aumPaise:     nidhivanEntities.aumPaise,
        revenuePaise: nidhivanEntities.revenuePaise,
        currency:     nidhivanEntities.currency,
      })
      .from(nidhivanEntities)
      .where(eq(nidhivanEntities.tenantId, ctx.tenantId))
      .orderBy(desc(nidhivanEntities.aumPaise))
      .limit(20);

    // ── 2. AUM aggregate ────────────────────────────────────────────────────
    const [aumRow] = await tx
      .select({ totalAumPaise: sum(nidhivanEntities.aumPaise) })
      .from(nidhivanEntities)
      .where(and(
        eq(nidhivanEntities.tenantId, ctx.tenantId),
        eq(nidhivanEntities.status, 'active'),
      ));

    // ── 3. Entity counts by status ──────────────────────────────────────────
    const entityCounts = await tx
      .select({ status: nidhivanEntities.status, cnt: count() })
      .from(nidhivanEntities)
      .where(eq(nidhivanEntities.tenantId, ctx.tenantId))
      .groupBy(nidhivanEntities.status);

    // ── 4. Latest research publications ────────────────────────────────────
    const research = await tx
      .select({
        id:          nidhivanResearch.id,
        title:       nidhivanResearch.title,
        desk:        nidhivanResearch.desk,
        rating:      nidhivanResearch.rating,
        status:      nidhivanResearch.status,
        author:      nidhivanResearch.author,
        publishedOn: nidhivanResearch.publishedOn,
        thesis:      nidhivanResearch.thesis,
      })
      .from(nidhivanResearch)
      .where(and(
        eq(nidhivanResearch.tenantId, ctx.tenantId),
        eq(nidhivanResearch.status, 'published'),
      ))
      .orderBy(desc(nidhivanResearch.createdAt))
      .limit(6);

    // ── 5. Open period closes requiring action ──────────────────────────────
    const openCloses = await tx
      .select({
        id:       nidhivanCloses.id,
        period:   nidhivanCloses.period,
        status:   nidhivanCloses.status,
        owner:    nidhivanCloses.owner,
        entityId: nidhivanCloses.entityId,
      })
      .from(nidhivanCloses)
      .where(and(
        eq(nidhivanCloses.tenantId, ctx.tenantId),
        eq(nidhivanCloses.status, 'open'),
      ))
      .orderBy(desc(nidhivanCloses.updatedAt))
      .limit(10);

    // ── 6. Active fintech lab experiments ───────────────────────────────────
    const labItems = await tx
      .select({
        id:     nidhivanLab.id,
        name:   nidhivanLab.name,
        stage:  nidhivanLab.stage,
        domain: nidhivanLab.domain,
        owner:  nidhivanLab.owner,
      })
      .from(nidhivanLab)
      .where(and(
        eq(nidhivanLab.tenantId, ctx.tenantId),
        eq(nidhivanLab.status, 'active'),
      ))
      .limit(8);

    // ── 7. Pipeline from client_requests ───────────────────────────────────
    const pipeline = await tx
      .select({ status: clientRequests.status, cnt: count() })
      .from(clientRequests)
      .where(and(
        eq(clientRequests.handledByTenantId, ctx.tenantId),
      ))
      .groupBy(clientRequests.status);

    return {
      entities,
      aumTotalPaise: Number(aumRow?.totalAumPaise ?? 0),
      entityCounts,
      research,
      openCloses,
      labItems,
      pipeline,
    };
  });

  return NextResponse.json(data, { status: 200, headers: SECURE_HEADERS });
}

export const GET = withErrorHandler(_GET);
