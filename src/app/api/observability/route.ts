/**
 * src/app/api/observability/route.ts — Hardened with withTenant RLS
 *
 * GET    — returns SLO metrics, incident data, and service health scoped to tenant
 * POST   — creates incidents for tenant environments
 * PATCH  — updates/resolves incidents securely
 *
 * SECURITY CHANGES:
 *   - Environment and incident reads are scoped via withTenant transaction block (RLS).
 *   - Computed/synthetic metric series (p50, p95, errRate) are derived from
 *     tenant-owned environment rows only — no cross-tenant data leakage.
 *   - Cache key is strictly tenant-scoped (`observability:${tenantId}`).
 *   - Incident mutations (POST/PATCH) verify roles and attribute audit logs to ctx.userId.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db/index";
import { incidents, environments, auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { cached, invalidateCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC METRIC GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

function prng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function series(seed: number, base: number, jitter: number, points = 24) {
  const r = prng(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v = Math.max(0, v + (r() - 0.48) * jitter);
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);

  const payload = await cached(`observability:${ctx.tenantId}`, 5_000, () =>
    withTenant(ctx.tenantId, async (tx) => {
      const [envs, incidentRows] = await Promise.all([
        tx.select().from(environments),
        tx
          .select()
          .from(incidents)
          .orderBy(desc(incidents.id))
          .limit(30),
      ]);

      const live = envs.filter((e) => e.status === "running");
      const hourSeed = Math.floor(Date.now() / 3_600_000);

      const services = live.map((e) => {
        const seed = e.id * 7919 + hourSeed;
        const p50 = series(seed, 42, 14);
        const p95 = p50.map(
          (v, i) => Math.round((v * 2.6 + series(seed + 1, 20, 8)[i]) * 10) / 10
        );
        const errRate = series(seed + 2, 0.35, 0.4).map((v) => Math.min(v, 4));
        const rps = series(
          seed + 3,
          e.name === "production" ? 840 : 120,
          e.name === "production" ? 220 : 60
        );
        const cpu = series(seed + 4, 38, 16).map((v) => Math.min(96, Math.round(v)));
        const mem = series(seed + 5, 52, 10).map((v) => Math.min(94, Math.round(v)));
        const availability =
          100 - errRate.reduce((a, b) => a + b, 0) / errRate.length / 10;

        return {
          envId: e.id,
          envName: e.name,
          region: e.region,
          tier: e.tier,
          p50,
          p95,
          errRate,
          rps,
          cpu,
          mem,
          availability: Math.round(availability * 1000) / 1000,
          apdex: Math.round((0.99 - errRate[errRate.length - 1] / 100) * 100) / 100,
        };
      });

      const open = incidentRows.filter((i) => i.status !== "resolved");

      return {
        services,
        incidents: incidentRows,
        slo: {
          target: 99.9,
          current:
            services.length > 0
              ? Math.round((services.reduce((a, s) => a + s.availability, 0) / services.length) * 1000) / 1000
              : 100,
          errorBudgetUsed: Math.min(100, open.length * 12 + (services[0]?.errRate.at(-1) ?? 0) * 9),
          openIncidents: open.length,
        },
      };
    })
  );

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body = await req.json() as {
    title?: string;
    service?: string;
    severity?: string;
  };
  
  if (!body.title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  const row = await withTenant(ctx.tenantId, async (tx) => {
    const [inserted] = await tx
      .insert(incidents)
      .values({
        tenantId: Number(ctx.tenantId),
        title: String(body.title).slice(0, 200),
        service: body.service ?? "app-service",
        severity: (["sev1", "sev2", "sev3"].includes(body.severity ?? "") ? body.severity : "sev3") as "sev1" | "sev2" | "sev3",
        status: "open",
      })
      .returning();

    await tx.insert(auditLogs).values({
      tenantId: Number(ctx.tenantId),
      actor: ctx.userId,
      action: `incident.open:${inserted.severity}`,
      target: inserted.service,
      severity: inserted.severity === "sev1" ? "critical" : "warn",
      ipAddress: ip,
    });

    return inserted;
  });

  invalidateCache(`observability:${ctx.tenantId}`);
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body = await req.json() as {
    id?: number | string;
    status?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const status = (["open", "monitoring", "resolved"].includes(body.status ?? "") ? body.status : "open") as "open" | "monitoring" | "resolved";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  const row = await withTenant(ctx.tenantId, async (tx) => {
    const [updated] = await tx
      .update(incidents)
      .set({ status, resolvedAt: status === "resolved" ? new Date() : null })
      .where(eq(incidents.id, Number(body.id)))
      .returning();

    if (updated) {
      await tx.insert(auditLogs).values({
        tenantId: Number(ctx.tenantId),
        actor: ctx.userId,
        action: `incident.${status}`,
        target: updated.service,
        severity: "info",
        ipAddress: ip,
      });
    }

    return updated;
  });

  if (!row) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  invalidateCache(`observability:${ctx.tenantId}`);
  return NextResponse.json(row);
}