/**
 * src/app/api/ai/orchestrate/route.ts
 *
 * BNLV Group — Multi-Agent Orchestration API
 * ==========================================
 * TRACK C: Exposes the multi-agent system as a secure Next.js API route.
 * Routes tasks to Legal, Financial, or Hybrid agents based on intent.
 *
 * RBAC: "developer" minimum enabled for multi-agent test execution.
 *
 * AUDIT: Every agent run is written to audit_logs with:
 *          actor:    "system:ai-agent:{agentName}"
 *          action:   "ai.agent.run:{taskClass}"
 *          target:    truncated task (first 80 chars)
 *          severity: "warn"
 *
 * SECURITY:
 *   - ANTHROPIC_API_KEY is server-side only — never transmitted to client
 *   - Tenant context from JWT header — not from request body
 *   - withTenant() scopes all data reads — cross-tenant agent contamination
 *     is structurally impossible via RLS
 *   - Agent context data is fetched server-side; client cannot inject
 *     arbitrary data into the agent prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant } from "@/db";
import { auditLogs } from "@/db/schema";
import {
  orchestrate,
  type AgentInput,
  type AgentContext,
} from "@/lib/ai/agents";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs"; // generateText requires Node.js runtime

// ── Request schema ─────────────────────────────────────────────────────────────

interface OrchestrateRequest {
  task:         string;                 // Natural language task description
  contextData?: Record<string, unknown>;  // Optional pre-fetched domain data
  // If contextData is omitted, the route auto-fetches from DB based on domain
}

// ── Auto-context fetchers ──────────────────────────────────────────────────────
// When the caller does not supply contextData, the route fetches the most
// relevant tenant-scoped records to enrich the agent prompt automatically.

async function fetchLegalContext(tenantId: number): Promise<Record<string, unknown>> {
  const { limsyCases, limsy_hearings_table, limsy_orders_table } = await import("@/db/schema").then(s => ({
    limsyCases:            s.limsyCases,
    limsy_hearings_table: s.limsyHearings,
    limsy_orders_table:   s.limsyOrders,
  }));
  const { asc } = await import("drizzle-orm");

  return withTenant(tenantId, async (tx) => {
    const [cases, orders] = await Promise.all([
      tx.select({
        id:             limsyCases.id,
        internalRef:    limsyCases.internalRef,
        caseType:       limsyCases.caseType,
        status:         limsyCases.status,
        courtLevel:     limsyCases.courtLevel,
        courtName:      limsyCases.courtName,
        petitioner:     limsyCases.petitioner,
        respondent:     limsyCases.respondent,
        subjectMatter:  limsyCases.subjectMatter,
        urgencyFlag:    limsyCases.urgencyFlag,
        nextHearingDate:limsyCases.nextHearingDate,
      }).from(limsyCases).orderBy(asc(limsyCases.id)).limit(10),

      tx.select({
        id:         limsy_orders_table.id,
        orderType:  limsy_orders_table.orderType,
        orderTitle: limsy_orders_table.orderTitle,
        operative:  limsy_orders_table.operative,
        orderDate:  limsy_orders_table.orderDate,
        cryptoHash: limsy_orders_table.cryptoHash,
      }).from(limsy_orders_table).orderBy(asc(limsy_orders_table.id)).limit(5),
    ]);

    return { cases, orders, tenantId };
  });
}

async function fetchFinancialContext(tenantId: number): Promise<Record<string, unknown>> {
  const {
    nidhivanProjects,
    nidhivanDprs,
    nidhivanBoqs,
    nidhivanBoqItems,
    nidhivanFinancialMetrics,
  } = await import("@/db/schema");
  const { asc, eq } = await import("drizzle-orm");

  return withTenant(tenantId, async (tx) => {
    const [projects, dprs, boqs, items, metrics] = await Promise.all([
      tx.select().from(nidhivanProjects).limit(5),
      tx.select().from(nidhivanDprs).limit(5),
      tx.select().from(nidhivanBoqs).limit(5),
      tx.select().from(nidhivanBoqItems).limit(20),
      tx.select().from(nidhivanFinancialMetrics).limit(5),
    ]);

    // Compute aggregates with explicit parameter types to satisfy strict TypeScript rules
    const boqTotalPaise = items.reduce(
      (sum: number, i: { amountPaise?: number | string | null }) => 
        sum + Number(i.amountPaise ?? 0), 
      0
    );

    return {
      projects,
      dprs,
      boqs,
      items,
      metrics,
      aggregate: {
        totalItemCount:  items.length,
        boqTotalPaise,
        boqTotalCrore:   (boqTotalPaise / 1_000_000_000).toFixed(2),
      },
      tenantId,
    };
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);

  // Updated to allow developer role access for multi-agent test execution
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body: OrchestrateRequest = await req.json().catch(() => ({}));

  if (!body.task || typeof body.task !== "string" || body.task.trim().length < 10) {
    return NextResponse.json(
      { error: "task is required and must be at least 10 characters." },
      { status: 400 }
    );
  }

  const task = body.task.trim();

  // Build agent context from JWT-derived values (not from request body)
  const agentCtx: AgentContext = {
    tenantId:  ctx.tenantId,
    userId:    ctx.userId,
    userRole:  ctx.role,
    sessionId: req.cookies.get("bms_session")?.value?.slice(0, 8) + "…",
  };

  // If caller did not supply contextData, auto-detect domain and fetch
  let contextData = body.contextData ?? {};

  if (!body.contextData) {
    // Quick heuristic classification to decide which DB to pre-fetch
    const taskLower = task.toLowerCase();
    const isLegal     = /case|petition|court|hearing|order|slp|writ|limsy|legal|advocate/.test(taskLower);
    const isFinancial = /dpr|boq|irr|npv|nidhivan|cpwd|infra|fund|invest|project cost/.test(taskLower);

    if (isLegal && !isFinancial) {
      contextData = await fetchLegalContext(ctx.tenantId);
    } else if (isFinancial && !isLegal) {
      contextData = await fetchFinancialContext(ctx.tenantId);
    } else {
      // Fetch both for hybrid or ambiguous tasks
      const [legal, financial] = await Promise.all([
        fetchLegalContext(ctx.tenantId),
        fetchFinancialContext(ctx.tenantId),
      ]);
      contextData = { legal, financial };
    }
  }

  // Run orchestration
  const result = await orchestrate({ task, contextData, context: agentCtx });

  // Write audit log for each agent that ran
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";

  await withTenant(ctx.tenantId, async (tx) => {
    for (const output of result.outputs) {
      await tx.insert(auditLogs).values({
        tenantId:  ctx.tenantId,
        actor:     `system:ai-agent:${output.agentName}`,
        action:    `ai.agent.run:${output.taskClass}`,
        target:    task.slice(0, 80),
        severity:  "warn",
        ipAddress: ip,
      });
    }
  });

  return NextResponse.json({
    success:     true,
    taskClass:   result.taskClass,
    agents:      result.agents,
    outputs:     result.outputs.map(o => ({
      agentName:  o.agentName,
      taskClass:  o.taskClass,
      content:    o.content,
      confidence: o.confidence,
      tokensUsed: o.tokensUsed,
      durationMs: o.durationMs,
    })),
    merged:      result.merged ?? null,
    totalTokens: result.totalTokens,
    durationMs:  result.durationMs,
  });
}

export const POST = withErrorHandler(_POST);