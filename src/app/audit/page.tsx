"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "pass" | "warn" | "fail";
type Control = {
  id: string;
  title: string;
  domain: string;
  status: Status;
  owner: string;
  evidence: { label: string; value: string; href?: string }[];
  recommendation: string;
};
type Phase = {
  id: string;
  title: string;
  description: string;
  status: Status;
  steps: { label: string; status: Status; detail: string }[];
};
type Platform = {
  id: string;
  name: string;
  channel: string;
  status: Status;
  capabilities: string[];
  compliance: string[];
};
type Audit = {
  generatedAt: string;
  score: number;
  readinessLevel: string;
  summary: Record<string, number>;
  controls: Control[];
  phases: Phase[];
  platforms: Platform[];
  productionSignoff: {
    status: string;
    requiredBeforePublicLaunch: string[];
    alreadyVerified: string[];
  };
};

const statusClass: Record<Status, string> = {
  pass: "bg-jade-50 text-jade-700 ring-jade-200",
  warn: "bg-sand-100 text-slate-600 ring-sand-300",
  fail: "bg-maroon-50 text-maroon-700 ring-maroon-200",
};
const statusDot: Record<Status, string> = {
  pass: "bg-jade-500",
  warn: "bg-sand-300",
  fail: "bg-maroon-500",
};

export default function AuditPage() {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [tab, setTab] = useState<"phases" | "controls" | "platforms" | "signoff">("phases");

  useEffect(() => {
    fetch("/api/readiness").then((r) => r.json()).then(setAudit);
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, Control[]> = {};
    for (const c of audit?.controls ?? []) {
      groups[c.domain] ??= [];
      groups[c.domain].push(c);
    }
    return groups;
  }, [audit]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maroon-500">
            Enterprise Edition Audit
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">
            End-to-End Production Readiness
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            A step-by-step audit of design, development, build, release, operations, compliance and
            cross-platform app parity. This center verifies the website and market-ready app contract
            remain synchronized for web, PWA, iOS, Android and desktop shells.
          </p>
        </div>
        <Link
          href="/app"
          className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-100"
        >
          View App Readiness →
        </Link>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Readiness score
              </div>
              <div className="mt-2 text-5xl font-bold tracking-tight text-navy-800">
                {audit?.score ?? "—"}
                <span className="text-2xl text-slate-300">/100</span>
              </div>
            </div>
            <div className="relative h-24 w-24 rounded-full bg-sand-100">
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `conic-gradient(var(--color-jade-500) ${(audit?.score ?? 0) * 3.6}deg, var(--color-sand-200) 0deg)`,
                }}
              />
              <div className="absolute inset-5 rounded-full bg-white" />
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-jade-50 px-4 py-3 text-sm font-semibold text-jade-700 ring-1 ring-inset ring-jade-200">
            {audit?.readinessLevel ?? "Loading…"}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Generated {audit ? new Date(audit.generatedAt).toLocaleString() : "—"}
          </p>
        </div>

        {[
          ["Tenants", audit?.summary.tenants],
          ["Running envs", audit?.summary.runningEnvs],
          ["Deployments", audit?.summary.deployments],
          ["Open incidents", audit?.summary.openIncidents],
          ["Active keys", audit?.summary.activeKeys],
          ["Live flags", audit?.summary.liveFlags],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold tabular-nums text-navy-800">{value ?? "—"}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-sand-200 bg-white p-1 shadow-sm">
        {[
          ["phases", "Step-by-step"],
          ["controls", "Control evidence"],
          ["platforms", "App parity"],
          ["signoff", "Launch sign-off"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === id ? "bg-navy-700 text-sand-50 shadow" : "text-slate-500 hover:text-navy-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "phases" && (
        <div className="space-y-4">
          {(audit?.phases ?? []).map((phase, idx) => (
            <div key={phase.id} className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy-700 font-mono text-xs font-bold text-sand-50">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-navy-800">{phase.title}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusClass[phase.status]}`}>
                      {phase.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{phase.description}</p>
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {phase.steps.map((s) => (
                      <div key={s.label} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusDot[s.status]}`} />
                          <div className="text-xs font-semibold text-navy-800">{s.label}</div>
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-slate-500">{s.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "controls" && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([domain, controls]) => (
            <section key={domain}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{domain}</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {controls.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusDot[c.status]}`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] font-semibold text-maroon-500">{c.id}</div>
                        <h3 className="mt-0.5 text-sm font-semibold text-navy-800">{c.title}</h3>
                        <div className="mt-1 text-[11px] text-slate-400">Owner: {c.owner}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusClass[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {c.evidence.map((e) => {
                        const content = (
                          <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2">
                            <div className="text-[9px] uppercase tracking-wider text-slate-400">{e.label}</div>
                            <div className="mt-0.5 truncate text-xs font-semibold text-navy-800">{e.value}</div>
                          </div>
                        );
                        return e.href ? <Link key={e.label} href={e.href}>{content}</Link> : <div key={e.label}>{content}</div>;
                      })}
                    </div>
                    <p className="mt-3 rounded-xl bg-navy-50 px-3 py-2 text-[11px] leading-5 text-navy-700">
                      Recommendation: {c.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === "platforms" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(audit?.platforms ?? []).map((p) => (
            <div key={p.id} className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDot[p.status]}`} />
                <div>
                  <h2 className="text-base font-semibold text-navy-800">{p.name}</h2>
                  <p className="text-xs text-slate-400">{p.channel}</p>
                </div>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusClass[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Capabilities</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.capabilities.map((c) => (
                      <span key={c} className="rounded-full bg-navy-50 px-2 py-1 text-[10px] font-medium text-navy-600 ring-1 ring-inset ring-navy-100">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Compliance</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.compliance.map((c) => (
                      <span key={c} className="rounded-full bg-jade-50 px-2 py-1 text-[10px] font-medium text-jade-700 ring-1 ring-inset ring-jade-100">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "signoff" && audit && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-jade-200 bg-jade-50 p-6">
            <h2 className="text-base font-semibold text-navy-800">Already verified</h2>
            <div className="mt-4 space-y-2">
              {audit.productionSignoff.alreadyVerified.map((item) => (
                <div key={item} className="flex gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-jade-800">
                  <span>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-maroon-200 bg-maroon-50 p-6">
            <h2 className="text-base font-semibold text-navy-800">Required before public enterprise launch</h2>
            <div className="mt-4 space-y-2">
              {audit.productionSignoff.requiredBeforePublicLaunch.map((item) => (
                <div key={item} className="flex gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-maroon-800">
                  <span>→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
