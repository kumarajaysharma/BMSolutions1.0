/**
 * src/app/studio/bms-academy/page.tsx
 * BMS Academy — Course Catalogue
 * RSC: reads tenant context from proxy-injected headers → withTenant DB query.
 * Follows identical pattern to src/app/studio/page.tsx.
 */
import { headers }     from "next/headers";
import { withTenant }  from "@/db";
import { bmsCourses, bmsEnrollments } from "@/db/schema";
import { eq, count }   from "drizzle-orm";
import Link            from "next/link";
import {
  BookOpen, GraduationCap, Route,
  Clock, Star, Users, ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BmsAcademyPage() {
  const headersList  = await headers();
  const tenantId     = Number(headersList.get("x-tenant-id") ?? 10);
  const userId       = Number(headersList.get("x-user-id")   ?? 0);

  const { courses, myEnrollmentCount, completedCount } = await withTenant(
    tenantId,
    async (tx) => {
      const courseRows = await tx.select().from(bmsCourses)
        .where(eq(bmsCourses.tenantId, tenantId));

      const enrollRows = userId
        ? await tx.select().from(bmsEnrollments)
            .where(eq(bmsEnrollments.userId, userId))
        : [];

      return {
        courses:           courseRows,
        myEnrollmentCount: enrollRows.length,
        completedCount:    enrollRows.filter((e: any) => e.status === "completed").length,
      };
    }
  ).catch(() => ({ courses: [], myEnrollmentCount: 0, completedCount: 0 }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              BMS Academy
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Agentic AI Learning Platform
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Enterprise-grade courses on AI agent design, multi-tenant architecture,
              and production-grade prompt engineering.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/studio/bms-academy/my-learning"
              className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition hover:bg-white/20"
            >
              My Learning →
            </Link>
            <Link
              href="/studio/bms-academy/paths"
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-sand-50"
            >
              Learning Paths
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Courses</span>
            <BookOpen size={18} className="text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{courses.length}</div>
          <div className="mt-1 text-[11px] text-jade-600">✓ Tenant-isolated content</div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">My Enrollments</span>
            <GraduationCap size={18} className="text-violet-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">{myEnrollmentCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">{completedCount} completed</div>
        </div>

        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Learning Paths</span>
            <Route size={18} className="text-fuchsia-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-navy-800">2</div>
          <div className="mt-1 text-[11px] text-slate-500">Structured multi-course tracks</div>
        </div>
      </div>

      {/* Course Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-navy-800">All Courses</h2>
          <Link
            href="/studio/bms-academy/paths"
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            View Learning Paths →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-3xl border border-sand-200 bg-white p-12 text-center shadow-sm">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No courses found in this tenant.</p>
            <p className="mt-1 text-xs text-slate-400">
              Run <code className="font-mono">npx tsx src/db/seed-bms-academy.ts</code> to seed initial content.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="rounded-3xl border border-sand-200 bg-white shadow-sm overflow-hidden flex flex-col transition hover:shadow-md"
              >
                {/* Gradient Thumbnail */}
                <div className={`bg-gradient-to-br ${course.thumbnailGradient ?? "from-indigo-600 to-violet-600"} p-8 flex items-center justify-center`}>
                  <BookOpen size={40} className="text-white/80" />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">
                      {course.category}
                    </span>
                    <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {course.level}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-navy-800 leading-snug mb-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {course.durationHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400" /> {course.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {course.enrollmentsCount} enrolled
                    </span>
                  </div>

                  <Link
                    href={`/studio/bms-academy/my-learning`}
                    className="mt-4 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Enrol Now <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
