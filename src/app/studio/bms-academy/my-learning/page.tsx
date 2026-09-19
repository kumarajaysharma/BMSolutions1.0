/**
 * src/app/studio/bms-academy/my-learning/page.tsx
 * BMS Academy — Learner Dashboard
 * RSC: enrolled courses with live progress bars.
 */
import { headers }    from "next/headers";
import { withTenant } from "@/db";
import { bmsEnrollments, bmsCourses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link           from "next/link";
import {
  GraduationCap, BookOpen, CheckCircle2,
  Clock, ChevronRight, ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-indigo-50 text-indigo-700",
  completed: "bg-jade-50  text-jade-700",
  paused:    "bg-amber-50  text-amber-700",
};

export default async function MyLearningPage() {
  const headersList = await headers();
  const tenantId    = Number(headersList.get("x-tenant-id") ?? 10);
  const userId      = Number(headersList.get("x-user-id")   ?? 0);

  const enrollments = await withTenant(tenantId, async (tx) => {
    if (!userId) return [];
    return tx
      .select({
        enrollmentId:   bmsEnrollments.id,
        progress:       bmsEnrollments.progress,
        status:         bmsEnrollments.status,
        enrolledAt:     bmsEnrollments.enrolledAt,
        completedAt:    bmsEnrollments.completedAt,
        lastAccessedAt: bmsEnrollments.lastAccessedAt,
        courseId:       bmsCourses.id,
        courseTitle:    bmsCourses.title,
        courseSlug:     bmsCourses.slug,
        courseCategory: bmsCourses.category,
        courseLevel:    bmsCourses.level,
        courseHours:    bmsCourses.durationHours,
        courseGradient: bmsCourses.thumbnailGradient,
      })
      .from(bmsEnrollments)
      .innerJoin(bmsCourses, eq(bmsEnrollments.courseId, bmsCourses.id))
      .where(
        and(
          eq(bmsEnrollments.tenantId, tenantId),
          eq(bmsEnrollments.userId,   userId)
        )
      )
      .orderBy(desc(bmsEnrollments.lastAccessedAt));
  }).catch(() => []);

  const completed = enrollments.filter((e: any) => e.status === "completed").length;
  const inProgress = enrollments.filter((e: any) => e.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/studio/bms-academy"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy-800 transition"
        >
          <ArrowLeft size={14} /> Back to Courses
        </Link>
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              My Learning
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Learning Dashboard</h1>
            <p className="mt-2 text-sm text-white/80">
              Track your enrolled courses and continue where you left off.
            </p>
          </div>
          <Link
            href="/studio/bms-academy"
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-sand-50"
          >
            Browse Courses
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Enrolled</span>
            <BookOpen size={18} className="text-violet-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{enrollments.length}</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock size={18} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{inProgress}</div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 size={18} className="text-jade-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{completed}</div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy-800 mb-4">My Courses</h2>

        {enrollments.length === 0 ? (
          <div className="py-12 text-center">
            <GraduationCap size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No enrollments yet.</p>
            <Link
              href="/studio/bms-academy"
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Browse Courses <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e: any) => {
              const pct = parseFloat(e.progress ?? "0");
              return (
                <div
                  key={e.enrollmentId}
                  className="rounded-2xl border border-sand-200 bg-sand-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: course info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`shrink-0 rounded-xl bg-gradient-to-br ${e.courseGradient ?? "from-indigo-600 to-violet-600"} p-3`}>
                        <BookOpen size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-navy-800 leading-snug truncate">
                          {e.courseTitle}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">{e.courseCategory}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-500">{e.courseLevel}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-500">{e.courseHours}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: status badge */}
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE[e.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {e.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">Progress</span>
                      <span className="text-[11px] font-semibold text-navy-800">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-sand-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {e.status !== "completed" && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/studio/bms-academy`}
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 transition"
                      >
                        Continue <ChevronRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
