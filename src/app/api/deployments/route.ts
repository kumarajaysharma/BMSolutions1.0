/**
 * src/app/api/deployments/route.ts — Hardened with withTenant RLS
 *
 * GET   — lists deployments scoped to the requesting tenant
 * POST  — triggers a simulated deployment for a tenant-owned environment
 * PATCH — rolls back a deployment securely
 *
 * SECURITY CHANGES:
 *   - All reads and writes scoped via withTenant transaction block (RLS).
 *   - Cache key is strictly tenant-scoped (`deployments:${tenantId}`).
 *   - POST verifies the environmentId belongs to the caller's tenant automatically via RLS.
 *   - Requires minimum role: developer to trigger or rollback a deployment.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db/index";
import { deployments, projects, environments, auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { cached, invalidateCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));
const sha = () =>
  Array.from({ length: 7 }, () => "0123456789abcdef"[rand(0, 16)]).join("");

function runDeploymentPipeline(chaos: boolean) {
  const defs: [string, string][] = [
    ["Checkout", "Fetched source from single source of truth (signed commit verified)."],
    ["Build", "Compiled production bundle — tree-shaken — 0 warnings."],
    ["Unit & Contract Tests", "142 tests passed across service and UI contracts."],
    ["Security Scan", "SAST + dependency audit: 0 critical, 0 high findings."],
    ["Terraform Plan", "Infrastructure diff computed — no drift detected."],
    ["Deploy (Blue/Green)", "Traffic shifted 10% → 50% → 100% with automatic canary analysis."],
    ["Health Check", "Liveness, readiness and synthetic probes all green."],
  ];

  const failAt = chaos && Math.random() < 0.5 ? rand(2, 6) : -1;
  const stages = defs.map(([name, detail], i) => {
    if (failAt !== -1 && i > failAt)
      return { name, status: "skipped", durationMs: 0, detail: "Skipped — pipeline halted upstream." };
    if (i === failAt)
      return {
        name,
        status: "failed",
        durationMs: rand(400, 2200),
        detail:
          name === "Security Scan"
            ? "1 high finding: transitive dependency CVE — deployment blocked by policy."
            : name === "Deploy (Blue/Green)"
              ? "Canary error rate exceeded 2% threshold — automatic rollback initiated."
              : "Stage failed quality gate — see logs.",
      };
    return { name, status: "passed", durationMs: rand(300, i === 1 ? 9000 : 4000), detail };
  });

  return { stages, success: failAt === -1 };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  const data = await cached(`deployments:${ctx.tenantId}`, 4_000, () =>
    withTenant(ctx.tenantId, async (tx) => {
      const [rows, projs, envs] = await Promise.all([
        tx.select().from(deployments).orderBy(desc(deployments.id)).limit(40),
        tx.select().from(projects),
        tx.select().from(environments),
      ]);
      return rows.map((d) => ({
        ...d,
        projectName: projs.find((p) => p.id === d.projectId)?.name ?? "—",
        envName: envs.find((e) => e.id === d.environmentId)?.name ?? "—",
      }));
    })
  );

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body = await req.json() as {
    environmentId?: number | string;
    chaos?: boolean;
  };

  const environmentId = Number(body.environmentId);
  if (!environmentId) {
    return NextResponse.json({ error: "environmentId is required" }, { status: 400 });
  }

  const result = runDeploymentPipeline(body.chaos ?? false);
  const status = result.success ? "success" : "failed";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  const row = await withTenant(ctx.tenantId, async (tx) => {
    // RLS ensures this environment belongs to the tenant
    const [env] = await tx
      .select()
      .from(environments)
      .where(eq(environments.id, environmentId));

    if (!env) throw new Error("ENV_NOT_FOUND");

    const version = `v${Date.now().toString(36).toUpperCase()}`;

    const [inserted] = await tx
      .insert(deployments)
      .values({
        tenantId: Number(ctx.tenantId),
        projectId: env.projectId,
        environmentId,
        version,
        commitSha: sha(),
        triggeredBy: ctx.userId,
        status,
        stages: result.stages,
      })
      .returning();

    await tx.insert(auditLogs).values({
      tenantId: Number(ctx.tenantId),
      actor: ctx.userId,
      action: `deploy.${status}`,
      target: `env:${env.name}#${env.id}`,
      severity: status === "failed" ? "warn" : "info",
      metadata: { deploymentId: inserted.id, version },
      ipAddress: ip,
    });

    return inserted;
  }).catch((err: Error) => {
    if (err.message === "ENV_NOT_FOUND") return null;
    throw err;
  });

  if (!row) {
    return NextResponse.json({ error: "Environment not found or unauthorized" }, { status: 404 });
  }

  invalidateCache(`deployments:${ctx.tenantId}`);
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const { id } = await req.json() as { id?: string | number };
  
  if (!id) {
    return NextResponse.json({ error: "Deployment ID is required" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  const row = await withTenant(ctx.tenantId, async (tx) => {
    const [updated] = await tx
      .update(deployments)
      .set({ status: "rolled_back" })
      .where(eq(deployments.id, Number(id)))
      .returning();

    if (updated) {
      await tx.insert(auditLogs).values({
        tenantId: Number(ctx.tenantId),
        actor: ctx.userId,
        action: `deploy.rollback:${updated.version}`,
        target: `deployment:${updated.id}`,
        severity: "warn",
        ipAddress: ip,
      });
    }
    return updated;
  });

  if (!row) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  invalidateCache(`deployments:${ctx.tenantId}`);
  return NextResponse.json(row);
}