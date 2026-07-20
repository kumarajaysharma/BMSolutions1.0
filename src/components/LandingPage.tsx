"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrefs } from "./Preferences";
import { LandingHeader, LandingFooter } from "./LandingChrome";
import { BmsLogo } from "./BmsLogo";

const SERVICE_META = [
  { value: "platform-demo", lk: "svc.1l", dk: "svc.1d", dot: "bg-navy-500" },
  { value: "architecture-consult", lk: "svc.2l", dk: "svc.2d", dot: "bg-maroon-500" },
  { value: "migration-assessment", lk: "svc.3l", dk: "svc.3d", dot: "bg-jade-500" },
  { value: "security-review", lk: "svc.4l", dk: "svc.4d", dot: "bg-slate-500" },
];

const MODULE_META = [
  { icon: "⬒", tk: "mod.1t", bk: "mod.1b", tone: "border-navy-200 bg-navy-50", chip: "bg-white text-navy-600" },
  { icon: "⇄", tk: "mod.2t", bk: "mod.2b", tone: "border-maroon-200 bg-maroon-50", chip: "bg-white text-maroon-600" },
  { icon: "⛨", tk: "mod.3t", bk: "mod.3b", tone: "border-jade-200 bg-jade-50", chip: "bg-white text-jade-600" },
  { icon: "▣", tk: "mod.4t", bk: "mod.4b", tone: "border-sand-300 bg-sand-100", chip: "bg-white text-slate-600" },
];

export function LandingPage() {
  const { t } = usePrefs();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service: "platform-demo",
    preferredDate: "",
    preferredTime: "10:00",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone({ id: data.id });
  };

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none";

  return (
    <div className="bg-sand-50">
      <LandingHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 15% 0%, rgba(58,86,128,0.08), transparent), radial-gradient(500px 280px at 85% 10%, rgba(140,68,87,0.07), transparent), radial-gradient(600px 320px at 50% 100%, rgba(53,114,87,0.06), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 grid gap-10 lg:grid-cols-12 items-center">
          {/* Left Column: Bespoke Royal Enterprise Typography */}
          <div className="lg:col-span-7 flex flex-col items-start text-left pt-12 sm:pt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-jade-200 bg-jade-50/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-jade-700 shadow-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-jade-500" />
              {t("hero.badge")}
            </div>
            <h1 className="mt-8 text-3xl font-light leading-[1.35] tracking-wide text-navy-800 sm:text-4xl lg:text-5xl">
              {t("hero.t1")} <span className="font-normal text-maroon-600 underline decoration-sand-300/50 underline-offset-8">{t("hero.t2")}</span> {t("hero.t3")}{" "}
              <span className="font-normal text-jade-600">{t("hero.t4")}</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm font-light leading-7 tracking-wide text-slate-500">{t("hero.sub")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/studio"
                className="rounded-xl border border-navy-200 bg-navy-50 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-navy-700 shadow-sm transition hover:bg-navy-100 hover:border-navy-300"
              >
                {t("hero.explore")}
              </Link>
              <a
                href="#schedule"
                className="rounded-xl border border-maroon-200 bg-maroon-50/60 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-maroon-600 shadow-sm transition hover:bg-maroon-100 hover:border-maroon-300"
              >
                {t("hero.schedule")}
              </a>
            </div>
          </div>

          {/* Right Column: Complete Logo emblem with stacked text below */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <BmsLogo variant="hero" />
          </div>

          {/* Bottom row: Statistics counters */}
          <div className="lg:col-span-12 mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 w-full">
            {[
              [t("stat.1a"), t("stat.1b")],
              [t("stat.2a"), t("stat.2b")],
              [t("stat.3a"), t("stat.3b")],
              [t("stat.4a"), t("stat.4b")],
            ].map(([a, b]) => (
              <div key={a} className="rounded-2xl border border-sand-200 bg-white/80 px-4 py-4 shadow-sm text-center">
                <div className="text-lg font-bold text-navy-800">{a}</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform modules ── */}
      <section id="platform" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-maroon-500">
            {t("plat.kicker")}
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-800">{t("plat.title")}</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {MODULE_META.map((m) => (
            <div
              key={m.tk}
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${m.tone}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-sm ${m.chip}`}>
                {m.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy-800">{t(m.tk)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t(m.bk)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="border-y border-sand-200 bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-jade-600">
              {t("wf.kicker")}
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-800">{t("wf.title")}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {(["1", "2", "3"] as const).map((n) => (
              <div key={n} className="rounded-2xl border border-sand-200 bg-sand-50 p-6">
                <div className="font-mono text-xs font-bold text-maroon-500">0{n}</div>
                <h3 className="mt-2 text-base font-semibold text-navy-800">{t(`wf.${n}t`)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{t(`wf.${n}b`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Client Request Scheduling ── */}
      <section id="schedule" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-navy-500">
              {t("sch.kicker")}
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-800">{t("sch.title")}</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">{t("sch.sub")}</p>
            <div className="mt-8 space-y-3">
              {SERVICE_META.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("service", s.value)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    form.service === s.value
                      ? "border-navy-300 bg-white shadow-md"
                      : "border-sand-200 bg-white/60 hover:border-sand-300 hover:bg-white"
                  }`}
                >
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy-800">{t(s.lk)}</span>
                      {form.service === s.value && (
                        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-600 ring-1 ring-inset ring-navy-200">
                          {t("svc.selected")}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{t(s.dk)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-lg shadow-sand-200/60">
            {done ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-jade-100 text-2xl text-jade-600">
                  ✓
                </div>
                <h3 className="mt-5 text-xl font-semibold text-navy-800">{t("form.okTitle")}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  {t("form.okBody")}{" "}
                  <span className="font-mono font-semibold text-maroon-600">
                    REQ-{String(done.id).padStart(4, "0")}
                  </span>
                  .
                </p>
                <button
                  onClick={() => { setDone(null); setForm((f) => ({ ...f, name: "", email: "", company: "", notes: "" })); }}
                  className="mt-6 rounded-xl border border-navy-200 bg-navy-50 px-5 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-100"
                >
                  {t("form.another")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-lg font-semibold text-navy-800">{t("form.title")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">{t("form.name")}</span>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Jane Cooper" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">{t("form.email")}</span>
                    <input value={form.email} onChange={(e) => set("email", e.target.value)} required type="email" placeholder="jane@company.com" className={inputCls} />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("form.company")}</span>
                  <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company Ltd." className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("form.service")}</span>
                  <select value={form.service} onChange={(e) => set("service", e.target.value)} className={inputCls}>
                    {SERVICE_META.map((s) => (
                      <option key={s.value} value={s.value}>{t(s.lk)}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">{t("form.date")}</span>
                    <input
                      value={form.preferredDate}
                      onChange={(e) => set("preferredDate", e.target.value)}
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      className={inputCls}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">{t("form.time")}</span>
                    <select value={form.preferredTime} onChange={(e) => set("preferredTime", e.target.value)} className={inputCls}>
                      {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map((tm) => (
                        <option key={tm}>{tm}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("form.notes")}</span>
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder={t("form.notesPh")} className={inputCls} />
                </label>
                {error && (
                  <p className="rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-2.5 text-xs text-maroon-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-maroon-600 py-3 text-sm font-semibold text-sand-50 shadow-md shadow-maroon-200 transition hover:bg-maroon-500 disabled:opacity-50"
                >
                  {submitting ? t("form.submitting") : t("form.submit")}
                </button>
                <p className="text-center text-[11px] text-slate-400">{t("form.note")}</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
