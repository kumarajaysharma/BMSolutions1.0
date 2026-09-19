/**
 * src/app/studio/code-red/page.tsx
 * BMS Ops Intelligence — Code Red Business Cases
 * RSC: lists bms_code_red_cases for the tenant.
 */
import { headers }    from "next/headers";
import { withTenant } from "@/db";
import { bmsCodeRedCases } from "@/db/schema";
import { eq, desc }   from "drizzle-orm";
import Link           from "next/link";
import { AlertTriangle, TrendingUp, Clock, BarChart3, CheckCircle2, Circle, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const PRIORITY_COLOR: Record<string, string> = {
  P0: "bg-red-100   text-red-700   ring-red-200",
  P1: "bg-amber-50  text-amber-700 ring-amber-200",
  P2: "bg-blue-50   text-blue-700  ring-blue-200",
  P3: "bg-slate-100 text-slate-600 ring-slate-200",
};

const STATUS_COLOR: Record<string, string> = {
  proposed:    "bg-slate-100 text-slate-600",
  approved:    "bg-blue-50   text-blue-700",
  in_progress: "bg-amber-50  text-amber-700",
  completed:   "bg-jade-50   text-jade-700",
  cancelled:   "bg-red-50    text-red-600",
};

const COMPLEXITY_COLOR: Record<string, string> = {
  Low:    "text-jade-600",
  Medium: "text-amber-600",
  High:   "text-maroon-600",
};

export default async function CodeRedPage() {
  const headersList = await headers();
  const tenantId    = Number(headersList.get("x-tenant-id") ?? 10);

  const cases = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsCodeRedCases)
      .where(eq(bmsCodeRedCases.tenantId, tenantId))
      .orderBy(desc(bmsCodeRedCases.createdAt))
  ).catch(() => []);

  const p0Count     = cases.filter((c: any) => c.priority === "P0").length;
  const activeCount = cases.filter((c: any) => ["approved", "in_progress"].includes(c.status)).length;
  const avgRoi      = cases.length
    ? (cases.reduce((s: number, c: any) => s + parseFloat(c.roiMultiple ?? "0"), 0) / cases.length).toFixed(1)
    : "0.0";

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-red-700 via-rose-600 to-maroon-700 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Code Red Intelligence
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Business Cases</h1>
            <p className="mt-2 text-sm text-white/80">
              High-priority AI automation opportunities ranked by ROI multiple and strategic impact.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-3xl font-bold">{cases.length}</span>
            <span className="text-xs text-white/70">Total Cases</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">P0 Critical</span>
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{p0Count}</div>
          <div className="mt-1 text-[11px] text-red-600">Immediate action required</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
            <Zap size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{activeCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Approved or in progress</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg ROI</span>
            <TrendingUp size={18} className="text-jade-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{avgRoi}×</div>
          <div className="mt-1 text-[11px] text-jade-600">Return multiple across all cases</div>
        </div>
      </div>

      {/* Case List */}
      <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy-800 mb-4">All Cases</h2>

        {cases.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No Code Red cases found.</p>
            <p className="mt-1 text-xs text-slate-400">
              Seed data: <code className="font-mono">npx tsx src/db/seed-bms-academy.ts</code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c: any) => (
              <div key={c.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{c.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${PRIORITY_COLOR[c.priority] ?? PRIORITY_COLOR.P3}`}>
                        {c.priority}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[c.status] ?? STATUS_COLOR.proposed}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-navy-800">{c.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{c.impact}</p>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <div className="text-lg font-bold text-jade-700">{parseFloat(c.roiMultiple).toFixed(1)}×</div>
                    <div className="text-[10px] text-slate-400">ROI · {c.paybackMonths}mo payback</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                  <span className="font-medium text-slate-600">{c.vertical}</span>
                  <span className={COMPLEXITY_COLOR[c.complexity] ?? ""}>{c.complexity} complexity</span>
                  <span>{c.effortWeeks}w effort</span>
                  {(c.agents ?? []).length > 0 && (
                    <span>{c.agents.length} agent{c.agents.length > 1 ? "s" : ""}</span>
                  )}
                  <span className="font-mono text-slate-400">{c.architecture}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
