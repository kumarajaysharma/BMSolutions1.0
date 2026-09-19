/**
 * src/app/studio/bms-studio/page.tsx
 * BMS SaaS Studio Builder — Project Management Dashboard
 * RSC: lists bms_studio_projects for the tenant.
 */
import { headers }    from "next/headers";
import { withTenant } from "@/db";
import { bmsStudioProjects, bmsStudioAddons } from "@/db/schema";
import { eq, desc }   from "drizzle-orm";
import Link           from "next/link";
import {
  Layers, Globe, Package, Plus,
  Clock, Code2, CheckCircle2, Circle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  draft:     { label: "Draft",     color: "bg-slate-100 text-slate-600",   icon: Circle },
  published: { label: "Published", color: "bg-jade-50 text-jade-700",      icon: CheckCircle2 },
  archived:  { label: "Archived",  color: "bg-amber-50 text-amber-700",    icon: Clock },
};

export default async function BmsStudioPage() {
  const headersList = await headers();
  const tenantId    = Number(headersList.get("x-tenant-id") ?? 10);

  const { projects, addonCount } = await withTenant(tenantId, async (tx) => {
    const projectRows = await tx.select().from(bmsStudioProjects)
      .where(eq(bmsStudioProjects.tenantId, tenantId))
      .orderBy(desc(bmsStudioProjects.createdAt));
    const addonRows = await tx.select().from(bmsStudioAddons)
      .where(eq(bmsStudioAddons.tenantId, tenantId));
    return { projects: projectRows, addonCount: addonRows.length };
  }).catch(() => ({ projects: [], addonCount: 0 }));

  const published = projects.filter((p: any) => p.status === "published").length;
  const draft     = projects.filter((p: any) => p.status === "draft").length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              SaaS Studio Builder
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Studio Projects</h1>
            <p className="mt-2 text-sm text-white/80">
              Manage blueprint-mode studio projects, schemas, API routes, and deployment configuration.
            </p>
          </div>
          <Link
            href="/studio/bms-studio"
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-sand-50 flex items-center gap-1"
          >
            <Plus size={14} /> New Project
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Projects</span>
            <Layers size={18} className="text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{projects.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">{published} published · {draft} draft</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
            <Globe size={18} className="text-jade-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{published}</div>
          <div className="mt-1 text-[11px] text-jade-600">✓ Live projects</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Installed Addons</span>
            <Package size={18} className="text-orange-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{addonCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Skills · connectors · plugins</div>
        </div>
      </div>

      {/* Project List */}
      <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy-800 mb-4">All Projects</h2>

        {projects.length === 0 ? (
          <div className="py-12 text-center">
            <Code2 size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No studio projects yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              POST to <code className="font-mono">/api/bms/studio/projects</code> to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p: any) => {
              const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = sc.icon;
              return (
                <div key={p.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`shrink-0 rounded-xl bg-gradient-to-br ${p.gradient ?? "from-amber-600 to-orange-600"} p-3`}>
                      <Code2 size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-navy-800 truncate">{p.name}</h3>
                        <span className="font-mono text-[10px] text-slate-400">v{p.version}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {p.description || "No description."} · slug: {p.slug}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                        <span>{(p.pages ?? []).length} pages</span>
                        <span>{(p.apiRoutes ?? []).length} routes</span>
                        <span>{(p.tables ?? []).length} tables</span>
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${sc.color}`}>
                    <StatusIcon size={10} /> {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blueprint Mode Notice */}
      <div className="rounded-3xl bg-navy-800 p-6 text-sand-50 shadow-xl">
        <h3 className="text-sm font-semibold">Blueprint Mode Active</h3>
        <p className="mt-2 text-xs text-navy-200 leading-relaxed">
          Studio projects operate in blueprint mode. Set <code className="font-mono text-amber-300">BMS_HOSTING_ENABLED=true</code> and
          configure <code className="font-mono text-amber-300">CLOUDFLARE_API_TOKEN</code> to enable live DNS provisioning
          and container deployment via <code className="font-mono text-amber-300">/api/bms/hosting/dns</code>.
        </p>
      </div>
    </div>
  );
}
