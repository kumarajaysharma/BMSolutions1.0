/**
 * src/app/api/stats/route.ts — SuperAdmin cross-tenant + per-tenant view
 *
 * GET — returns platform-wide aggregate stats.
 *
 * SECURITY DECISION (confirmed):
 *   - owner / admin roles receive the GLOBAL view across all tenants.
 *     This powers the executive dashboard for BMS, Nidhivan, LIMSY, Vihang.
 *   - developer / designer / viewer roles receive stats scoped ONLY to their tenant.
 *   - The cross-tenant query runs on getDb() (no RLS) — correct for admin aggregates.
 *   - The per-tenant query runs inside withTenant() for RLS enforcement.
 *   - Cache keys are role-class scoped ("stats:global" vs "stats:tenant:<id>") to
 *     prevent admins from reading a tenant-cache entry and vice-versa.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, withTenant } from "@/db/index";
import { aiTasks } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { cached } from "@/lib/server-cache";
import { hasMinimumRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  const isAdmin = hasMinimumRole(ctx.role, "admin");

  if (isAdmin) {
    // ── Global view (owner / admin) ─────────────────────────────────────
    const data = await cached("stats:global", 5_000, async () => {
      const db = await getDb();
      const [countsRes, recentTasks] = await Promise.all([
        db.execute(sql`
          SELECT
            (SELECT count(*) FROM tenants)::int                                          AS tenants,
            (SELECT count(*) FROM users)::int                                            AS users,
            (SELECT count(*) FROM projects)::int                                         AS projects,
            (SELECT count(*) FROM builder_components)::int                               AS components,
            (SELECT count(*) FROM ai_tasks)::int                                         AS tasks,
            (SELECT count(*) FROM ai_tasks WHERE routed_model IN ('claude-fable-5','claude-opus-4.8'))::int AS opus_tasks,
            (SELECT count(*) FROM ai_tasks WHERE routed_model = 'gemini-3.5-flash')::int AS gemini_tasks,
            (SELECT count(*) FROM ai_tasks WHERE status = 'blocked')::int                AS blocked_tasks,
            (SELECT count(*) FROM ai_tasks WHERE status = 'committed')::int              AS committed_tasks,
            (SELECT count(*) FROM environments WHERE status <> 'destroyed')::int         AS environments,
            (SELECT count(*) FROM environments WHERE status = 'running')::int            AS running_envs,
            (SELECT count(*) FROM deployments)::int                                      AS deployments,
            (SELECT count(*) FROM deployments WHERE status = 'success')::int             AS deploys_ok,
            (SELECT count(*) FROM incidents WHERE status <> 'resolved')::int             AS open_incidents,
            (SELECT count(*) FROM api_keys WHERE status = 'active')::int                 AS active_keys,
            (SELECT count(*) FROM feature_flags WHERE enabled = true)::int               AS live_flags,
            (SELECT count(*) FROM client_requests WHERE status = 'pending')::int         AS pending_requests
        `),
        db.select().from(aiTasks).orderBy(desc(aiTasks.id)).limit(5),
      ]);

      const c = countsRes.rows[0] as Record<string, number>;
      return buildStatsPayload(c, recentTasks, true);
    });

    return NextResponse.json(data);
  }

  // ── Tenant-scoped view (developer / designer / viewer) ────────────────
  // Minimum role to access stats at all: developer
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const data = await cached(`stats:tenant:${ctx.tenantId}`, 5_000, () =>
    withTenant(ctx.tenantId, async (tx) => {
      const tid = ctx.tenantId;
      const [countsRes, recentTasks] = await Promise.all([
        tx.execute(sql`
          SELECT
            (SELECT count(*) FROM projects      WHERE tenant_id = ${tid}::int)::int AS projects,
            (SELECT count(*) FROM builder_components WHERE tenant_id = ${tid}::int)::int AS components,
            (SELECT count(*) FROM ai_tasks      WHERE tenant_id = ${tid}::int)::int AS tasks,
            (SELECT count(*) FROM ai_tasks      WHERE tenant_id = ${tid}::int AND routed_model IN ('claude-fable-5','claude-opus-4.8'))::int AS opus_tasks,
            (SELECT count(*) FROM ai_tasks      WHERE tenant_id = ${tid}::int AND routed_model = 'gemini-3.5-flash')::int AS gemini_tasks,
            (SELECT count(*) FROM ai_tasks      WHERE tenant_id = ${tid}::int AND status = 'blocked')::int AS blocked_tasks,
            (SELECT count(*) FROM ai_tasks      WHERE tenant_id = ${tid}::int AND status = 'committed')::int AS committed_tasks,
            (SELECT count(*) FROM environments  WHERE tenant_id = ${tid}::int AND status <> 'destroyed')::int AS environments,
            (SELECT count(*) FROM environments  WHERE tenant_id = ${tid}::int AND status = 'running')::int AS running_envs,
            (SELECT count(*) FROM deployments   WHERE tenant_id = ${tid}::int)::int AS deployments,
            (SELECT count(*) FROM deployments   WHERE tenant_id = ${tid}::int AND status = 'success')::int AS deploys_ok,
            (SELECT count(*) FROM incidents     WHERE tenant_id = ${tid}::int AND status <> 'resolved')::int AS open_incidents,
            (SELECT count(*) FROM api_keys      WHERE tenant_id = ${tid}::int AND status = 'active')::int AS active_keys,
            (SELECT count(*) FROM feature_flags WHERE tenant_id = ${tid}::int AND enabled = true)::int AS live_flags
        `),
        tx.select().from(aiTasks).orderBy(desc(aiTasks.id)).limit(5),
      ]);

      const c = countsRes.rows[0] as Record<string, number>;
      return buildStatsPayload(c, recentTasks, false);
    })
  );

  return NextResponse.json(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildStatsPayload(
  c: Record<string, number>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentTasks: any[],
  isGlobal: boolean
) {
  return {
    scope: isGlobal ? "global" : "tenant",
    tenants: c.tenants ?? null,          // null for tenant-scoped view
    users: c.users ?? null,
    projects: c.projects ?? 0,
    components: c.components ?? 0,
    tasks: c.tasks ?? 0,
    fableTasks: c.opus_tasks ?? 0,
    opusTasks: c.opus_tasks ?? 0,
    geminiTasks: c.gemini_tasks ?? 0,
    blockedTasks: c.blocked_tasks ?? 0,
    committedTasks: c.committed_tasks ?? 0,
    environments: c.environments ?? 0,
    runningEnvs: c.running_envs ?? 0,
    deployments: c.deployments ?? 0,
    deploysOk: c.deploys_ok ?? 0,
    openIncidents: c.open_incidents ?? 0,
    activeKeys: c.active_keys ?? 0,
    liveFlags: c.live_flags ?? 0,
    pendingRequests: c.pending_requests ?? null,
    recentTasks,
  };
}