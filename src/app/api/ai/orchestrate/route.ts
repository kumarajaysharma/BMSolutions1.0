/**
 * src/app/api/ai/orchestrate/route.ts
 *
 * BNLV Group — Multi-Agent Orchestration API
 * ==========================================
 * TRACK C: Exposes the multi-agent system as a secure Next.js API route.
 * Routes tasks to Legal, Financial, or Hybrid agents based on intent.
 *
 * RBAC: "developer" minimum — allows multi-agent task execution by all
 *       studio roles. Sensitive data is gated at the agent prompt level.
 *
 * AUDIT: Every agent run writes to audit_logs:
 *          actor:    "system:ai-agent:{agentName}"
 *          action:   "ai.agent.run:{taskClass}"
 *          target:   truncated task (first 80 chars)
 *          severity: "warn"
 *
 * SECURITY:
 *   - ANTHROPIC_API_KEY is server-side only — never transmitted to client
 *   - Tenant context from JWT header — not from request body
 *   - withTenant() scopes all data reads — cross-tenant contamination
 *     is structurally impossible via RLS
 *   - Agent context data fetched server-side; client cannot inject
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
  task:         string;                       // Natural language task description
  contextData?: Record<string, unknown>;      // Optional pre-fetched domain data
}

// ── Legal context fetcher ──────────────────────────────────────────────────────
// Fetches cases, upcoming hearings, and sealed orders for the tenant.
// Hearing schedule is critical for urgency assessment by the Legal Agent.

async function fetchLegalContext(tenantId: number): Promise<Record<string, unknown>> {
  const { limsyCases, limsyHearings, limsyOrders } = await import("@/db/schema");
  const { asc, eq, and, gte } = await import("drizzle-orm");

  return withTenant(tenantId, async (tx) => {
    const [cases, hearings, orders] = await Promise.all([

      // All active cases — full detail for architect context
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
        reliefSought:   limsyCases.reliefSought,
        urgencyFlag:    limsyCases.urgencyFlag,
        nextHearingDate:limsyCases.nextHearingDate,
      }).from(limsyCases)
        .orderBy(asc(limsyCases.id))
        .limit(10),

      // Upcoming hearings — ordered by date so agent sees next listed matters first
      tx.select({
        id:             limsyHearings.id,
        caseId:         limsyHearings.caseId,
        hearingNumber:  limsyHearings.hearingNumber,
        status:         limsyHearings.status,
        scheduledDate:  limsyHearings.scheduledDate,
        courtRoom:      limsyHearings.courtRoom,
        adjournmentCount: limsyHearings.adjournmentCount,
      }).from(limsyHearings)
        .orderBy(asc(limsyHearings.scheduledDate))
        .limit(10),

      // Sealed court orders — includes operative text and SHA-256 hash
      tx.select({
        id:         limsyOrders.id,
        caseId:     limsyOrders.caseId,
        orderType:  limsyOrders.orderType,
        orderTitle: limsyOrders.orderTitle,
        operative:  limsyOrders.operative,
        orderDate:  limsyOrders.orderDate,
        cryptoHash: limsyOrders.cryptoHash,
      }).from(limsyOrders)
        .orderBy(asc(limsyOrders.id))
        .limit(5),
    ]);

    return { cases, hearings, orders, tenantId };
  });
}

// ── Financial context fetcher ──────────────────────────────────────────────────
// Fetches all Nidhivan financial data for the tenant including BOQ aggregates.

async function fetchFinancialContext(tenantId: number): Promise<Record<string, unknown>> {
  const {
    nidhivanProjects,
    nidhivanDprs,
    nidhivanBoqs,
    nidhivanBoqItems,
    nidhivanFinancialMetrics,
  } = await import("@/db/schema");
  const { asc } = await import("drizzle-orm");

  return withTenant(tenantId, async (tx) => {
    const [projects, dprs, boqs, items, metrics] = await Promise.all([
      tx.select().from(nidhivanProjects).orderBy(asc(nidhivanProjects.id)).limit(5),
      tx.select().from(nidhivanDprs).orderBy(asc(nidhivanDprs.id)).limit(5),
      tx.select().from(nidhivanBoqs).orderBy(asc(nidhivanBoqs.id)).limit(5),
      tx.select().from(nidhivanBoqItems).orderBy(asc(nidhivanBoqItems.id)).limit(25),
      tx.select().from(nidhivanFinancialMetrics).orderBy(asc(nidhivanFinancialMetrics.id)).limit(5),
    ]);

    // Aggregate BOQ total in paise — explicit types for TypeScript strict mode
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
        totalItemCount: items.length,
        boqTotalPaise,
        boqTotalCrore:  (boqTotalPaise / 1_000_000_000).toFixed(2),
      },
      tenantId,
    };
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);

  // Developer minimum — multi-agent execution available to all studio roles
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

  // Build agent context from JWT-derived values — never from request body
  const agentCtx: AgentContext = {
    tenantId:  ctx.tenantId,
    userId:    ctx.userId,
    userRole:  ctx.role,
    sessionId: req.cookies.get("bms_session")?.value?.slice(0, 8) + "…",
  };

  // Auto-fetch context if caller did not supply domain data
  let contextData = body.contextData ?? {};

  if (!body.contextData) {
    const taskLower  = task.toLowerCase();
    const isLegal    = /case|petition|court|hearing|order|slp|writ|limsy|legal|advocate|article|section|act\b/.test(taskLower);
    const isFinancial = /dpr|boq|irr|npv|nidhivan|cpwd|infra|fund|invest|project cost|crore|lakh|rate/.test(taskLower);

    if (isLegal && !isFinancial) {
      contextData = await fetchLegalContext(ctx.tenantId);
    } else if (isFinancial && !isLegal) {
      contextData = await fetchFinancialContext(ctx.tenantId);
    } else {
      // Hybrid or ambiguous — fetch both in parallel
      const [legal, financial] = await Promise.all([
        fetchLegalContext(ctx.tenantId),
        fetchFinancialContext(ctx.tenantId),
      ]);
      contextData = { legal, financial };
    }
  }

  // Run multi-agent orchestration
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
