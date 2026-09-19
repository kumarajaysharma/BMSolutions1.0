/**
 * src/app/studio/assignments/page.tsx
 * BMS Ops — Learning Assignments Dashboard
 * RSC: lists bms_assignments for the tenant.
 */
import { headers }    from "next/headers";
import { withTenant } from "@/db";
import { bmsAssignments } from "@/db/schema";
import { eq, desc }   from "drizzle-orm";
import { ClipboardList, CheckCircle2, Clock, AlertCircle, Star } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:      { label: "Open",      color: "bg-blue-50   text-blue-700"  },
  submitted: { label: "Submitted", color: "bg-amber-50  text-amber-700" },
  graded:    { label: "Graded",    color: "bg-jade-50   text-jade-700"  },
  closed:    { label: "Closed",    color: "bg-slate-100 text-slate-500" },
};

export default async function AssignmentsPage() {
  const headersList = await headers();
  const tenantId    = Number(headersList.get("x-tenant-id") ?? 10);

  const assignments = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsAssignments)
      .where(eq(bmsAssignments.tenantId, tenantId))
      .orderBy(desc(bmsAssignments.createdAt))
  ).catch(() => []);

  const openCount    = assignments.filter((a: any) => a.status === "open").length;
  const gradedCount  = assignments.filter((a: any) => a.status === "graded").length;
  const avgScore     = assignments.filter((a: any) => a.score !== null).length > 0
    ? (assignments.filter((a: any) => a.score !== null)
        .reduce((s: number, a: any) => s + parseFloat(a.score ?? "0"), 0) /
       assignments.filter((a: any) => a.score !== null).length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Assignments
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Learning Assignments</h1>
            <p className="mt-2 text-sm text-white/80">
              Practical AI engineering tasks tied to Academy courses with structured deliverables and rubrics.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-3xl font-bold">{assignments.length}</span>
            <span className="text-xs text-white/70">Total Assignments</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Open</span>
            <AlertCircle size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{openCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Pending submission</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Graded</span>
            <CheckCircle2 size={18} className="text-jade-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{gradedCount}</div>
          <div className="mt-1 text-[11px] text-jade-600">Feedback available</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Score</span>
            <Star size={18} className="text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">
            {avgScore ?? "—"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {avgScore ? "out of 100" : "No grades yet"}
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy-800 mb-4">All Assignments</h2>

        {assignments.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No assignments found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a: any) => {
              const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.open;
              return (
                <div key={a.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{a.code}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.color}`}>
                          {sc.label}
                        </span>
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] text-teal-700">
                          {a.vertical}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-navy-800">{a.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{a.description}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      {a.score !== null ? (
                        <div className="text-lg font-bold text-jade-700">
                          {parseFloat(a.score).toFixed(0)}<span className="text-xs font-normal text-slate-400">/{a.maxScore}</span>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-slate-400">Max {a.maxScore}pts</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                    <span>{a.course}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={9} /> Due in {a.dueInDays}d
                    </span>
                    {(a.deliverables ?? []).length > 0 && (
                      <span>{a.deliverables.length} deliverable{a.deliverables.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
