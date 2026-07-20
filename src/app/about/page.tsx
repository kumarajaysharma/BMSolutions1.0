"use client";

import Link from "next/link";
import { usePrefs } from "@/components/Preferences";
import { LandingHeader, LandingFooter } from "@/components/LandingChrome";
import { BmsLogo } from "@/components/BmsLogo";

const LEADERS = [
  { name: "Ada Lindqvist", role: "Chief Executive Officer", initials: "AL", tone: "bg-navy-100 text-navy-700", bio: "Former platform lead at two hyperscalers; believes internal tools deserve external polish." },
  { name: "Marcus Chen", role: "Chief Architect", initials: "MC", tone: "bg-maroon-100 text-maroon-700", bio: "Author of the studio's routing engine. Twenty years of distributed-systems scar tissue." },
  { name: "Priya Raman", role: "VP Engineering", initials: "PR", tone: "bg-jade-100 text-jade-700", bio: "Runs the weekly ship cadence. Allergic to unreviewable deploys and untested rollbacks." },
  { name: "Sofia Marino", role: "Head of Design", initials: "SM", tone: "bg-sand-200 text-slate-700", bio: "Keeper of the Serene Sand system — every token, radius and rhythm across the platform." },
];

const MILESTONES = [
  ["2023", "Founded on a conviction: generated code must be verified code."],
  ["2024", "AI routing engine ships — Claude Fable 5 plans, Gemini designs enters production."],
  ["2025", "Multi-tenant platform GA · SOC2 Type II · 99.95% delivered availability."],
  ["2026", "Full IaC lifecycle, observability suite and the developer platform launch."],
];

export default function AboutPage() {
  const { t } = usePrefs();

  return (
    <div className="bg-sand-50">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(500px 260px at 20% 0%, rgba(58,86,128,0.08), transparent), radial-gradient(500px 260px at 80% 20%, rgba(53,114,87,0.07), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-16 text-center">
          <div className="mb-6 flex justify-center">
            <BmsLogo variant="icon" className="scale-125" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-maroon-500">
            {t("about.kicker")}
          </div>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-navy-800 sm:text-5xl">
            {t("about.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">{t("about.sub")}</p>
        </div>
      </section>

      {/* Mission / Conviction */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-navy-200 bg-navy-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-navy-600 shadow-sm">◎</div>
            <h2 className="mt-4 text-xl font-semibold text-navy-800">{t("about.missionT")}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t("about.missionB")}</p>
          </div>
          <div className="rounded-3xl border border-jade-200 bg-jade-50 p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-jade-600 shadow-sm">⛨</div>
            <h2 className="mt-4 text-xl font-semibold text-navy-800">{t("about.visionT")}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t("about.visionB")}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy-800">
          {t("about.valuesT")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { tk: "about.v1t", bk: "about.v1b", icon: "⬒", tone: "text-navy-600" },
            { tk: "about.v2t", bk: "about.v2b", icon: "⛨", tone: "text-jade-600" },
            { tk: "about.v3t", bk: "about.v3b", icon: "⚙", tone: "text-maroon-600" },
            { tk: "about.v4t", bk: "about.v4b", icon: "◉", tone: "text-slate-600" },
          ].map((v) => (
            <div key={v.tk} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
              <span className={`text-xl ${v.tone}`}>{v.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-navy-800">{t(v.tk)}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{t(v.bk)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones */}
      <section className="border-y border-sand-200 bg-white/60">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-0">
            {MILESTONES.map(([year, text], i) => (
              <div key={year} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-14 items-center justify-center rounded-xl bg-navy-700 font-mono text-xs font-bold text-sand-50 shadow-sm">
                    {year}
                  </div>
                  {i < MILESTONES.length - 1 && <div className="w-px flex-1 bg-sand-300" />}
                </div>
                <p className="pb-8 pt-2.5 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy-800">{t("about.teamT")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERS.map((l) => (
            <div key={l.name} className="rounded-2xl border border-sand-200 bg-white p-6 text-center shadow-sm">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold ${l.tone}`}>
                {l.initials}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-navy-800">{l.name}</h3>
              <div className="mt-0.5 text-[11px] font-medium text-maroon-500">{l.role}</div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{l.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-navy-800 px-8 py-12 text-center shadow-xl shadow-navy-200">
          <h2 className="text-2xl font-bold tracking-tight text-sand-50">{t("about.ctaT")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy-200">{t("about.ctaB")}</p>
          <Link
            href="/#schedule"
            className="mt-6 inline-block rounded-xl bg-sand-50 px-6 py-3 text-sm font-semibold text-navy-800 transition hover:bg-white"
          >
            {t("about.ctaBtn")}
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
