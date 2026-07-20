"use client";

import { useState } from "react";
import { usePrefs } from "@/components/Preferences";
import { LandingHeader, LandingFooter } from "@/components/LandingChrome";
import { BmsLogo } from "@/components/BmsLogo";

const ROLES = [
  {
    slug: "senior-platform-engineer",
    title: "Senior Platform Engineer",
    team: "Infrastructure",
    location: "Remote (UTC−5 to UTC+5:30)",
    type: "Full-time",
    tone: "bg-navy-50 text-navy-600 ring-navy-200",
    blurb: "Own the Terraform generation pipeline and the multi-tenant provisioning plane.",
  },
  {
    slug: "ai-systems-engineer",
    title: "AI Systems Engineer",
    team: "Routing Engine",
    location: "Remote (global)",
    type: "Full-time",
    tone: "bg-maroon-50 text-maroon-600 ring-maroon-200",
    blurb: "Evolve task classification, model orchestration and the verification stage.",
  },
  {
    slug: "product-design-engineer",
    title: "Product Design Engineer",
    team: "Design Systems",
    location: "Remote (Europe / India)",
    type: "Full-time",
    tone: "bg-jade-50 text-jade-600 ring-jade-200",
    blurb: "Push the Serene Sand system further — tokens, themes, motion and accessibility.",
  },
  {
    slug: "security-engineer",
    title: "Security Engineer, Zero Trust",
    team: "Security",
    location: "Remote (global)",
    type: "Full-time",
    tone: "bg-sand-100 text-slate-600 ring-sand-300",
    blurb: "Expand the security gate: SAST rules, policy engines and supply-chain integrity.",
  },
  {
    slug: "developer-advocate",
    title: "Developer Advocate",
    team: "Community",
    location: "Remote (global)",
    type: "Full-time",
    tone: "bg-navy-50 text-navy-600 ring-navy-200",
    blurb: "Teach the 'Claude Fable 5 plans, Gemini designs' workflow through docs, demos and talks.",
  },
];

const PERKS = [
  { icon: "🌍", tk: "car.p1t", bk: "car.p1b" },
  { icon: "🚢", tk: "car.p2t", bk: "car.p2b" },
  { icon: "🧠", tk: "car.p3t", bk: "car.p3b" },
  { icon: "💻", tk: "car.p4t", bk: "car.p4b" },
  { icon: "📊", tk: "car.p5t", bk: "car.p5b" },
  { icon: "🤝", tk: "car.p6t", bk: "car.p6b" },
];

export default function CareersPage() {
  const { t } = usePrefs();
  const [applyingTo, setApplyingTo] = useState<(typeof ROLES)[number] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", portfolio: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [doneRef, setDoneRef] = useState<number | null>(null);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingTo) return;
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/careers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, roleSlug: applyingTo.slug, roleTitle: applyingTo.title }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDoneRef(data.id);
  };

  const closeModal = () => {
    setApplyingTo(null);
    setDoneRef(null);
    setForm({ name: "", email: "", portfolio: "", note: "" });
    setError("");
  };

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none";

  return (
    <div className="bg-sand-50">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(500px 260px at 25% 0%, rgba(140,68,87,0.07), transparent), radial-gradient(500px 260px at 75% 15%, rgba(58,86,128,0.08), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-16 text-center">
          <div className="mb-6 flex justify-center">
            <BmsLogo variant="icon" className="scale-125" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-jade-600">
            {t("car.kicker")}
          </div>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-navy-800 sm:text-5xl">
            {t("car.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-500">{t("car.sub")}</p>
        </div>
      </section>

      {/* How we work */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy-800">{t("car.whyT")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.tk} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <span className="text-xl">{p.icon}</span>
              <h3 className="mt-2 text-sm font-semibold text-navy-800">{t(p.tk)}</h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{t(p.bk)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy-800">
          {t("car.rolesT")}
          <span className="ml-2 align-middle rounded-full bg-jade-50 px-2.5 py-0.5 text-xs font-semibold text-jade-600 ring-1 ring-inset ring-jade-200">
            {ROLES.length}
          </span>
        </h2>
        <div className="mt-8 space-y-3">
          {ROLES.map((r) => (
            <div
              key={r.slug}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:border-navy-200 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-navy-800">{r.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${r.tone}`}>
                    {r.team}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{r.blurb}</p>
                <div className="mt-1.5 flex gap-3 text-[10px] text-slate-400">
                  <span>📍 {r.location}</span>
                  <span>· {r.type}</span>
                </div>
              </div>
              <button
                onClick={() => setApplyingTo(r)}
                className="rounded-xl bg-navy-700 px-5 py-2.5 text-xs font-semibold text-sand-50 shadow-sm transition hover:bg-navy-600"
              >
                {t("car.apply")} →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Apply modal */}
      {applyingTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/30 px-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {doneRef ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-jade-100 text-2xl text-jade-600">✓</div>
                <h3 className="mt-4 text-lg font-semibold text-navy-800">{t("car.okTitle")}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {t("car.okBody")}{" "}
                  <span className="font-mono font-semibold text-maroon-600">
                    APP-{String(doneRef).padStart(4, "0")}
                  </span>
                </p>
                <button
                  onClick={closeModal}
                  className="mt-5 rounded-xl border border-navy-200 bg-navy-50 px-5 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-100"
                >
                  {t("car.close")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3.5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {t("car.applyingFor")}
                  </div>
                  <h3 className="mt-0.5 text-lg font-semibold text-navy-800">{applyingTo.title}</h3>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("form.name")}</span>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Jane Cooper" className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("form.email")}</span>
                  <input value={form.email} onChange={(e) => set("email", e.target.value)} required type="email" placeholder="jane@company.com" className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("car.portfolio")}</span>
                  <input value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="https://…" className={inputCls} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">{t("car.note")}</span>
                  <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={3} className={inputCls} />
                </label>
                {error && (
                  <p className="rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-2.5 text-xs text-maroon-600">{error}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-sand-300 bg-sand-50 py-2.5 text-sm font-medium text-slate-500 hover:bg-sand-100"
                  >
                    {t("car.close")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-maroon-600 py-2.5 text-sm font-semibold text-sand-50 shadow-md shadow-maroon-200 hover:bg-maroon-500 disabled:opacity-50"
                  >
                    {submitting ? "…" : t("car.submit")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  );
}
