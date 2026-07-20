/**
 * src/app/api/ai/tasks/route.ts — Hardened with withTenant RLS
 *
 * GET  — returns AI tasks scoped to the requesting tenant
 * POST — creates a task; mode:"lint" runs the security linter
 *
 * SECURITY CHANGES:
 *   - All DB operations now run inside withTenant(ctx.tenantId, …) which
 *     sets SET LOCAL app.current_tenant_id inside a Postgres transaction.
 *     The transaction auto-reverts on timeout, crash, or connection drop —
 *     no cross-tenant data can leak.
 *   - Cache key is tenant-scoped to prevent cache poisoning between tenants.
 *   - auditLogs inserts carry ctx.tenantId and ctx.userId as the actor.
 *   - lint mode is tenant-scoped: audit entries are attributed correctly.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db/index";
import { aiTasks, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { runPipeline } from "@/lib/ai-router";
import { lintSnippet } from "@/lib/security-linter";
import { cached, invalidateCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  // Read operations wrapped in tenant transaction and scoped caching
  const rows = await cached(`ai-tasks:${ctx.tenantId}`, 3_000, () =>
    withTenant(ctx.tenantId, (tx) =>
      tx.select().from(aiTasks).orderBy(desc(aiTasks.id)).limit(40)
    )
  );

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

  // ── Lint mode: security gate for arbitrary pasted code ──────────────────
  if (body.mode === "lint") {
    const result = lintSnippet(prompt);

    await withTenant(ctx.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: Number(ctx.tenantId),
        actor: ctx.userId,
        action: `snippet.lint:${result.status}`,
        target: "manual-audit",
        severity:
          result.status === "fail"
            ? "critical"
            : result.status === "warn"
              ? "warn"
              : "info",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      })
    );

    return NextResponse.json(result);
  }

  // ── Standard AI pipeline ─────────────────────────────────────────────────
  const result = runPipeline(prompt);

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

    await tx.insert(auditLogs).values({
      tenantId: Number(ctx.tenantId),
      actor: ctx.userId,
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
  return NextResponse.json(row, { status: 201 });
}