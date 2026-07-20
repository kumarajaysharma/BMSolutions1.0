"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  tenants: number;
  users: number;
  projects: number;
  components: number;
  tasks: number;
  fableTasks?: number;
  opusTasks: number;
  geminiTasks: number;
  blockedTasks: number;
  committedTasks: number;
  environments: number;
  runningEnvs: number;
  deployments: number;
  deploySuccessRate: number;
  openIncidents: number;
  activeKeys: number;
  liveFlags: number;
  pendingRequests: number;
  recentTasks: {
    id: number;
    prompt: string;
    routedModel: string;
    status: string;
    securityStatus: string;
  }[];
};

const MODULES = [
  {
    title: "Visual Builder",
    href: "/builder",
    icon: "⬒",
    tone: "border-navy-200 bg-navy-50",
    chip: "bg-white text-navy-600",
    desc: "Drag-and-drop components mapped 1:1 to clean React source. The builder state is the single source of truth — every action regenerates the codebase in real time.",
    tag: "Configuration layer",
  },
  {
    title: "AI Routing Engine",
    href: "/ai-engine",
    icon: "⇄",
    tone: "border-maroon-200 bg-maroon-50",
    chip: "bg-white text-maroon-600",
    desc: "Claude Fable 5 handles planning, multi-step logic and secure backend integration. Gemini 3.5 Flash handles rapid UI generation and design-system consistency.",
    tag: "Claude Fable 5 · Gemini 3.5",
  },
  {
    title: "Studio Admin",
    href: "/admin",
    icon: "⛨",
    tone: "border-jade-200 bg-jade-50",
    chip: "bg-white text-jade-600",
    desc: "Role-based access control across six roles, multi-tenant lifecycle management, and a zero-trust audit trail of every privileged action.",
    tag: "RBAC · multi-tenant",
  },
  {
    title: "Infrastructure-as-Code",
    href: "/infrastructure",
    icon: "▣",
    tone: "border-sand-300 bg-sand-100",
    chip: "bg-white text-slate-600",
    desc: "Every environment is provisioned from generated Terraform — encrypted storage, IAM auth, WAF on production — so the full lifecycle is automated and reviewable.",
    tag: "Terraform lifecycle",
  },
  {
    title: "Deployment Pipeline",
    href: "/deployments",
    icon: "▶",
    tone: "border-jade-200 bg-jade-50",
    chip: "bg-white text-jade-600",
    desc: "Seven-stage blue/green CI/CD with canary analysis, policy-gated security scanning, chaos drills and one-click rollback across every environment.",
    tag: "CI/CD · canary · rollback",
  },
  {
    title: "Observability",
    href: "/observability",
    icon: "◉",
    tone: "border-navy-200 bg-navy-50",
    chip: "bg-white text-navy-600",
    desc: "Golden signals per service — latency, traffic, errors, saturation — with SLO targets, error-budget burn tracking and full incident lifecycle management.",
    tag: "SLOs · metrics · incidents",
  },
  {
    title: "Developer Platform",
    href: "/services",
    icon: "⚙",
    tone: "border-maroon-200 bg-maroon-50",
    chip: "bg-white text-maroon-600",
    desc: "Scoped API keys with rate limits, progressive feature-flag rollouts, a rotating secrets vault and HMAC-signed webhook delivery.",
    tag: "Keys · flags · secrets · hooks",
  },
  {
    title: "Client Scheduling",
    href: "/admin",
    icon: "📅",
    tone: "border-sand-300 bg-sand-100",
    chip: "bg-white text-slate-600",
    desc: "Landing-page request scheduling flows straight into the admin triage queue — pending, confirmed and completed states, all audit-logged.",
    tag: "Requests · triage",
  },
  {
    title: "Enterprise Audit",
    href: "/audit",
    icon: "✓",
    tone: "border-jade-200 bg-jade-50",
    chip: "bg-white text-jade-600",
    desc: "Step-by-step production-grade audit across design, development, build, security, operations, compliance and cross-platform app parity.",
    tag: "Readiness · sign-off",
  },
  {
    title: "Market App",
    href: "/app",
    icon: "▰",
    tone: "border-navy-200 bg-navy-50",
    chip: "bg-white text-navy-600",
    desc: "PWA manifest, service worker, shared app-config contract and platform matrix for synchronized web, iOS, Android and desktop editions.",
    tag: "PWA · native sync",
  },
];

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/stats").then((r) => r.json()).then(setStats);
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maroon-500">
          BNLV Group of Company · Executive Architecture
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">BMS Studio Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          A decoupled, enterprise-grade SaaS studio. Standard CRUD and layout live in the{" "}
          <span className="font-medium text-navy-700">configuration layer</span> (visual builder);
          custom business logic flows through the{" "}
          <span className="font-medium text-navy-700">extension layer</span> (AI-routed code
          studio) — every artifact passing the zero-trust security gate before commit.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Tenants", stats?.tenants],
          ["Projects", stats?.projects],
          ["AI Tasks", stats?.tasks],
          ["Live Envs", stats?.runningEnvs],
          ["Deploys", `${stats?.deployments ?? "—"}${stats ? ` · ${stats.deploySuccessRate}%` : ""}`],
          ["Incidents", stats?.openIncidents],
          ["API Keys", stats?.activeKeys],
          ["Live Flags", stats?.liveFlags],
          ["Users", stats?.users],
          ["Components", stats?.components],
          ["Requests", stats?.pendingRequests],
          ["Committed", stats?.committedTasks],
        ].map(([label, v]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-bold tabular-nums text-navy-800">{v ?? "—"}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {MODULES.map((m) => (
          <Link
            key={m.title}
            href={m.href}
            className={`group rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${m.tone}`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-sm ${m.chip}`}>
                {m.icon}
              </span>
              <span className="rounded-full border border-white/80 bg-white/70 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {m.tag}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-navy-800">{m.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-navy-800">Recent AI pipeline runs</h3>
          <div className="mt-4 space-y-2">
            {stats?.recentTasks?.length ? (
              stats.recentTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      t.status === "committed" ? "bg-jade-500" : "bg-maroon-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{t.prompt}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                      t.routedModel === "claude-fable-5"
                        ? "bg-maroon-100 text-maroon-600"
                        : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {t.routedModel}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No runs yet — dispatch a task from the AI Routing Engine.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-800">Model utilization</h3>
          <div className="mt-4 space-y-4 text-sm">
            {[
              ["Claude Fable 5", (stats?.fableTasks ?? stats?.opusTasks) ?? 0, "bg-maroon-400", "Planning · backend"],
              ["Gemini 3.5 Flash", stats?.geminiTasks ?? 0, "bg-navy-400", "UI · styling"],
            ].map(([name, count, color, sub]) => {
              const total = (stats?.tasks ?? 0) || 1;
              return (
                <div key={name as string}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{name}</span>
                    <span className="tabular-nums text-slate-400">{count} tasks</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-200">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${((count as number) / total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">{sub}</div>
                </div>
              );
            })}
            <div className="rounded-xl border border-sand-200 bg-sand-50 p-3 text-xs text-slate-500">
              <span className="font-semibold text-jade-600">
                {stats?.committedTasks ?? 0} committed
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-maroon-600">
                {stats?.blockedTasks ?? 0} blocked
              </span>{" "}
              by the security gate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
