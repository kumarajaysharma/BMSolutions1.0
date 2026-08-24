/**
 * src/app/api/ai/tasks/route.ts — Hardened with withTenant RLS
 *
 * GET  — returns AI tasks scoped to the requesting tenant
 * POST — creates a task; mode:"lint" runs the security linter
 *
 * COMMERCIAL LAUNCH UPDATES:
 *   - Tasks clearing the zero-trust gate auto-provision into the Visual Builder.
 *
 * SECURITY CHANGES:
 *   - All DB operations now run inside withTenant(ctx.tenantId, …) which
 *     sets SET LOCAL app.current_tenant_id inside a Postgres transaction.
 *     The transaction auto-reverts on timeout, crash, or connection drop —
 *     no cross-tenant data can leak.
 *   - Cache key is tenant-scoped to prevent cache poisoning between tenants.
 *   - auditLogs inserts carry ctx.tenantId and ctx.userId as the actor.
 *   - lint mode is tenant-scoped: audit entries are attributed correctly.
 * 
 * FIXES applied:
 *   1. ADR-002 Enforcement: fetchCache = "force-no-store" and runtime = "nodejs".
 *   2. Injected analyzePromptSecurity for active Ingress Zero-Trust blocking.
 *   3. Integrated fire-and-forget webhook to trigger background execution worker.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db/index";
import { aiTasks, auditLogs, builderComponents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { runPipeline } from "@/lib/ai-router";
import { lintSnippet, analyzePromptSecurity } from "@/lib/security-linter";
import { cached, invalidateCache } from "@/lib/server-cache";
import { triggerAIWorker } from "@/lib/trigger-worker";

// --- NEXT.JS FETCH CACHE BYPASS FOR NEON HTTP TRANSACTIONS (ADR-002) ---
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; // CRITICAL: Prevents Next.js from hijacking BEGIN commands
export const runtime = "nodejs";            // CRITICAL: Required for Neon HTTP driver stability

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  // Read operations wrapped in tenant transaction and scoped caching
  const rows = await cached(`ai-tasks:${ctx.tenantId}`, 3_000, async () => {
    return await withTenant(ctx.tenantId, async (tx) => {
      return await tx.select().from(aiTasks).orderBy(desc(aiTasks.id)).limit(40);
    });
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ctx = getRequestContext(req);

  // developers and above can submit tasks; designers and viewers cannot
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body = await req.json() as {
    prompt?: string;
    mode?: string;
    projectId?: number | string;
  };

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  // ── Egress Lint mode: security gate for arbitrary pasted code ───────────
  if (body.mode === "lint") {
    const result = lintSnippet(prompt);

    await withTenant(ctx.tenantId, async (tx) => {
      await tx.insert(auditLogs).values({
        tenantId: Number(ctx.tenantId),
        actor: String(ctx.userId),
        action: `snippet.lint:${result.status}`,
        target: "manual-audit",
        severity:
          result.status === "fail"
            ? "critical"
            : result.status === "warn"
              ? "warn"
              : "info",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      });
    });

    return NextResponse.json(result);
  }

  // ── ZERO-TRUST INGRESS SECURITY CHECK ────────────────────────────────────
  const securityEval = analyzePromptSecurity(prompt);
  let result;

  if (securityEval.status === "fail") {
    // If a jailbreak/exfiltration is detected, block immediately without LLM routing
    result = {
      taskClass: "security" as const, 
      routedModel: "none",
      routingReason: "Blocked by Zero-Trust ingress policy",
      complexityScore: 10,
      status: "blocked" as const,
      stages: [],
      output: "",
      securityStatus: "fail" as const,
      securityFindings: securityEval.findings,
    };
  } else {
    // ── Standard AI pipeline ─────────────────────────────────────────────────
    result = runPipeline(prompt);
    
    // Inject the ingress security context into the pipeline result
    result.securityStatus = securityEval.status === "pending" ? "warn" : securityEval.status;
    result.securityFindings = securityEval.findings;
  }

  // Write operations wrapped in a single, tenant-isolated transaction
  const row = await withTenant(ctx.tenantId, async (tx) => {
    const [inserted] = await tx
      .insert(aiTasks)
      .values({
        tenantId: Number(ctx.tenantId),
        projectId: body.projectId ? Number(body.projectId) : null,
        prompt,
        taskClass: result.taskClass,
        routedModel: result.routedModel,
        routingReason: result.routingReason,
        complexityScore: result.complexityScore,
        status: result.status,
        stages: result.stages,
        output: result.output,
        securityStatus: result.securityStatus,
        securityFindings: result.securityFindings,
      })
      .returning();

    // ── Autonomous R&D Visual Builder Provisioning ─────────────────────────
    if (result.status === "committed" && body.projectId && ["frontend", "styling"].includes(result.taskClass)) {
      const inferredType = result.output.toLowerCase().includes("nav") ? "navbar" : "hero"; 
      
      await tx.insert(builderComponents).values({
        tenantId: Number(ctx.tenantId),
        projectId: Number(body.projectId),
        name: `AI Gen: ${inferredType} (${result.routedModel})`,
        type: inferredType,
        props: { title: "AI Generated Artifact", content: "Autonomously provisioned by AI Engine." },
        sortOrder: 99
      });
      
      await tx.insert(auditLogs).values({
        tenantId: Number(ctx.tenantId),
        actor: "ai-engine",
        action: `builder.auto_provision`,
        target: `project:${body.projectId}`,
        severity: "info",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      });
    }

    await tx.insert(auditLogs).values({
      tenantId: Number(ctx.tenantId),
      actor: String(ctx.userId),
      action: `ai.task.${result.status}`,
      target: `task:${inserted.id}`,
      severity: result.securityStatus === "fail" ? "critical" : "info",
      metadata: {
        model: result.routedModel,
        complexityScore: result.complexityScore,
        securityStatus: result.securityStatus,
      },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    });

    return inserted;
  });

  invalidateCache(`ai-tasks:${ctx.tenantId}`);
  
  // Return a 403 Forbidden specifically for failed ingress
  if (securityEval.status === "fail") {
    return NextResponse.json({ 
      error: "Prompt rejected by security policy.",
      findings: securityEval.findings,
      taskId: row.id 
    }, { status: 403 });
  }

  // ── FIRE-AND-FORGET WEBHOOK TRIGGER ──────────────────────────────────────
  // Dispatches the background worker instantly for valid tasks
  triggerAIWorker(Number(ctx.tenantId), row.id);

  return NextResponse.json(row, { status: 201 });
}