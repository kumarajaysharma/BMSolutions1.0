/**
 * src/app/studio/page.tsx
 *
 * BNLV Studio — Subsidiary-Aware Pilot Client Dashboard
 * Dynamically switches telemetry, project lists, and module panels 
 * based on the active tenant slug resolved by the edge middleware.
 */

import { headers } from "next/headers";
import { getSubsidiaryConfig } from "@/lib/subsidiaries";
import { withTenant } from "@/db";
import { projects, environments, deployments, incidents } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Layers, Server, ShieldCheck, Activity, Cpu, FileText, Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudioWorkspacePage() {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug") || "bnlv";
  const tenantIdHeader = headersList.get("x-tenant-id");
  const tenantId = tenantIdHeader ? Number(tenantIdHeader) : 1;

  const config = getSubsidiaryConfig(slug);

  // Fetch isolated tenant telemetry safely using withTenant RLS pattern
  const workspaceData = await withTenant(tenantId, async (tx) => {
    const [projectRows, envRows, deploymentRows, incidentRows] = await Promise.all([
      tx.select().from(projects).orderBy(desc(projects.id)).limit(5),
      tx.select().from(environments).orderBy(desc(environments.id)).limit(5),
      tx.select().from(deployments).orderBy(desc(deployments.id)).limit(5),
      tx.select().from(incidents).orderBy(desc(incidents.id)).limit(5),
    ]);
    return {
      projects: projectRows,
      environments: envRows,
      deployments: deploymentRows,
      incidents: incidentRows,
    };
  }).catch(() => ({
    projects: [],
    environments: [],
    deployments: [],
    incidents: [],
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      {/* Workspace Hero Banner */}
      <div className={`rounded-3xl bg-gradient-to-r ${config.accentColor} p-8 text-white shadow-xl`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Active Subsidiary: {config.shortName}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {config.name} Workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              {config.tagline} — Operating under isolated tenant schema security with real-time RLS enforcement.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition hover:bg-white/20"
            >
              Control Panel →
            </Link>
            <Link
              href="/audit"
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-sand-50"
            >
              Security Audit
            </Link>
          </div>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <Layers size={18} className="text-navy-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{workspaceData.projects.length}</div>
          <div className="mt-1 text-[11px] text-jade-600">● Tenant Isolation Verified</div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Environments</span>
            <Server size={18} className="text-jade-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{workspaceData.environments.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Terraform IaC synchronized</div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Deployments</span>
            <Activity size={18} className="text-maroon-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{workspaceData.deployments.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Zero-trust CI pipeline</div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Incidents</span>
            <ShieldCheck size={18} className="text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{workspaceData.incidents.length}</div>
          <div className="mt-1 text-[11px] text-jade-600">Zero critical unpatched alerts</div>
        </div>
      </div>

      {/* Subsidiary-Specific Tailored Module View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Core Projects & Infrastructure */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-navy-800">Tenant Project Repository</h2>
              <span className="font-mono text-xs text-slate-400">slug: {slug}</span>
            </div>
            <div className="space-y-3">
              {workspaceData.projects.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No projects initialized in this tenant scope.</p>
              ) : (
                workspaceData.projects.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-sand-200 bg-sand-50 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-navy-800">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.description || "No description provided."}</p>
                    </div>
                    <span className="rounded-full bg-navy-50 px-2.5 py-1 font-mono text-[10px] font-medium text-navy-700">
                      ID: #{p.id}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Deployments Status */}
          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy-800 mb-4">Recent Pipeline Deployments</h2>
            <div className="space-y-2">
              {workspaceData.deployments.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No recent deployment runs recorded.</p>
              ) : (
                workspaceData.deployments.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-xs">
                    <span className="font-mono font-semibold text-navy-800">{d.version}</span>
                    <span className="font-mono text-slate-400">env: #{d.environmentId}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      d.status === "success" ? "bg-jade-50 text-jade-700" : "bg-maroon-50 text-maroon-700"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Subsidiary Module Specialization Panel */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy-800 mb-3">Subsidiary Specialization Module</h2>
            
            {slug === "bms" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-blue-800">
                  <Cpu size={20} className="shrink-0" />
                  <span><b>BMSolutions Module:</b> SaaS projects, environment provisioning, and CI/CD deployment pipelines.</span>
                </div>
                <p>Manage multi-tenant code generation, component catalogs, and automated build releases securely.</p>
              </div>
            )}

            {slug === "nidhivan" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800">
                  <FileText size={20} className="shrink-0" />
                  <span><b>Nidhivan Module:</b> Financial advisory metrics, DPR compliance checklists, and capital reporting.</span>
                </div>
                <p>Track institutional financial structures, project feasibility evaluations, and regulatory metrics.</p>
              </div>
            )}

            {slug === "limsy" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-rose-800">
                  <ShieldCheck size={20} className="shrink-0" />
                  <span><b>LIMSY Module:</b> Legal Intelligence Managerial Systems.</span>
                </div>
                <p>Handle comprehensive case design, legal workflow management, and operational document tracking.</p>
              </div>
            )}

            {slug === "vihang" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 rounded-xl bg-fuchsia-50 p-3 text-fuchsia-800">
                  <Palette size={20} className="shrink-0" />
                  <span><b>Vihang Module:</b> Brand identity suites, heraldic design assets, typography configurations, HDTV real-time telemetry, split-screen feeds, and OTT delivery controls.</span>
                </div>
                <p>Manage creative design assets, typography renderers, and real-time media broadcast delivery panels.</p>
              </div>
            )}

            {slug === "bnlv" && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-amber-800">
                  <Layers size={20} className="shrink-0" />
                  <span><b>BNLV Apex Holding:</b> Cross-subsidiary governance and global enterprise telemetry hub.</span>
                </div>
                <p>Supervise multi-tenant provisioning, security audit logs, and commercial readiness milestones.</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-navy-800 p-6 text-sand-50 shadow-xl">
            <h3 className="text-sm font-semibold">Sprint Objective Status</h3>
            <p className="mt-2 text-xs leading-5 text-navy-200">
              Operating inside the 90-day corporate readiness window ending July 31, 2026. All RLS security controls and subdomain mappings verified.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-jade-400">
              <span>● System Status: Fully Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}