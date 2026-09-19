/**
 * src/app/studio/bms-academy/paths/page.tsx
 * BMS Academy — Learning Paths
 * RSC: structured multi-course tracks for progressive skill building.
 */
import { headers }    from "next/headers";
import { withTenant } from "@/db";
import { bmsLearningPaths, bmsCourses } from "@/db/schema";
import { eq }         from "drizzle-orm";
import Link           from "next/link";
import { Route, Clock, BarChart2, ArrowLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const LEVEL_COLOR: Record<string, string> = {
  Beginner:     "bg-jade-50  text-jade-700",
  Intermediate: "bg-amber-50  text-amber-700",
  Advanced:     "bg-maroon-50 text-maroon-700",
};

const ICON_MAP: Record<string, string> = {
  cpu:    "💻",
  server: "🖥️",
  route:  "🗺️",
  brain:  "🧠",
  shield: "🛡️",
  code:   "⌨️",
};

export default async function LearningPathsPage() {
  const headersList = await headers();
  const tenantId    = Number(headersList.get("x-tenant-id") ?? 10);

  const { paths, totalCourses } = await withTenant(tenantId, async (tx) => {
    const pathRows   = await tx.select().from(bmsLearningPaths)
      .where(eq(bmsLearningPaths.tenantId, tenantId));
    const courseRows = await tx.select().from(bmsCourses)
      .where(eq(bmsCourses.tenantId, tenantId));
    return { paths: pathRows, totalCourses: courseRows.length };
  }).catch(() => ({ paths: [], totalCourses: 0 }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Back link */}
      <Link
        href="/studio/bms-academy"
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy-800 transition w-fit"
      >
        <ArrowLeft size={14} /> Back to Courses
      </Link>

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Learning Paths
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Structured Career Tracks
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Curated multi-course sequences that build from fundamentals to production-grade expertise.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-3xl font-bold">{paths.length}</span>
            <span className="text-xs text-white/70">Active Paths</span>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Paths</span>
            <Route size={18} className="text-cyan-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{paths.length}</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Courses</span>
            <BarChart2 size={18} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{totalCourses}</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Duration</span>
            <Clock size={18} className="text-violet-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">
            {paths.length > 0
              ? Math.round(paths.reduce((s: number, p: any) => s + p.estimatedWeeks, 0) / paths.length)
              : 0}
            <span className="ml-1 text-sm font-normal text-slate-400">wks avg</span>
          </div>
        </div>
      </div>

      {/* Path Cards */}
      {paths.length === 0 ? (
        <div className="rounded-3xl border border-sand-200 bg-white p-12 text-center shadow-sm">
          <Route size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-400">No learning paths found.</p>
          <p className="mt-1 text-xs text-slate-400">
            Run <code className="font-mono">npx tsx src/db/seed-bms-academy.ts</code> to seed paths.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {paths.map((path: any) => (
            <div
              key={path.id}
              className="rounded-3xl border border-sand-200 bg-white shadow-sm overflow-hidden flex flex-col transition hover:shadow-md"
            >
              {/* Gradient header strip */}
              <div className={`bg-gradient-to-r ${path.gradient ?? "from-cyan-500 to-blue-600"} px-6 py-5 flex items-center gap-3`}>
                <span className="text-3xl" role="img" aria-label={path.icon}>
                  {ICON_MAP[path.icon] ?? "🗺️"}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{path.title}</h3>
                  <span className={`mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white`}>
                    {path.level}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-slate-500 leading-relaxed flex-1">
                  {path.description}
                </p>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {path.estimatedWeeks} weeks
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${LEVEL_COLOR[path.level] ?? "bg-slate-100 text-slate-600"}`}>
                    {path.level}
                  </span>
                </div>

                <Link
                  href="/studio/bms-academy"
                  className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  View Courses in Path <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA to full catalogue */}
      <div className="rounded-3xl bg-navy-800 p-6 text-sand-50 shadow-xl flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Ready to start a path?</h3>
          <p className="mt-1 text-xs text-navy-200">
            Enrol in individual courses from the catalogue to build your learning path progress.
          </p>
        </div>
        <Link
          href="/studio/bms-academy"
          className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-navy-900 shadow-sm hover:bg-sand-50 transition"
        >
          Browse All Courses
        </Link>
      </div>
    </div>
  );
}
