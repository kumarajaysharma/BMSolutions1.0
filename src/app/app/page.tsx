"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AppConfig = {
  appId: string;
  name: string;
  defaultLanguage: string;
  defaultTheme: string;
  supportedLanguages: string[];
  supportedThemes: string[];
  requiredCapabilities: string[];
  complianceBaseline: string[];
  generatedAt: string;
  website: Record<string, string>;
  appNavigation: { id: string; label: string; path: string }[];
  publicApi: Record<string, string>;
  complianceLinks: Record<string, string>;
};

type Readiness = {
  score: number;
  readinessLevel: string;
  platforms: {
    id: string;
    name: string;
    channel: string;
    status: "pass" | "warn" | "fail";
    capabilities: string[];
    compliance: string[];
  }[];
};

const platformIcon: Record<string, string> = {
  web: "🌐",
  pwa: "▣",
  ios: "",
  android: "🤖",
  desktop: "▤",
};
const statusClass = {
  pass: "bg-jade-50 text-jade-700 ring-jade-200",
  warn: "bg-sand-100 text-slate-600 ring-sand-300",
  fail: "bg-maroon-50 text-maroon-700 ring-maroon-200",
};

export default function AppReadinessPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/app-config").then((r) => r.json()),
      fetch("/api/readiness").then((r) => r.json()),
    ]).then(([cfg, audit]) => {
      setConfig(cfg);
      setReadiness(audit);
    });
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jade-600">
            Market App Readiness
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">
            Website ↔ App Platform Sync
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            The public website, installable PWA and native app shells share one app contract:
            navigation, themes, languages, compliance links and public APIs are exposed from
            <span className="font-mono text-navy-700"> /api/app-config</span> so every platform stays
            synchronized and market-ready.
          </p>
        </div>
        <Link
          href="/audit"
          className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-100"
        >
          Open Enterprise Audit →
        </Link>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-4">
        <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            App identity
          </div>
          <h2 className="mt-2 text-2xl font-bold text-navy-800">{config?.name ?? "BMS (Business Management Solutions) — A BNLV Group of Company"}</h2>
          <div className="mt-2 font-mono text-xs text-slate-400">{config?.appId ?? "com.bnlvgroup.bms.enterprise"}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/manifest.webmanifest" className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-navy-100">
              Manifest
            </Link>
            <Link href="/sw.js" className="rounded-full bg-jade-50 px-3 py-1 text-xs font-medium text-jade-700 ring-1 ring-inset ring-jade-100">
              Service Worker
            </Link>
            <Link href="/api/app-config" className="rounded-full bg-maroon-50 px-3 py-1 text-xs font-medium text-maroon-700 ring-1 ring-inset ring-maroon-100">
              Config API
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-navy-800">{readiness?.score ?? "—"}</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">Enterprise score</div>
          <p className="mt-3 rounded-xl bg-jade-50 px-3 py-2 text-xs text-jade-700 ring-1 ring-inset ring-jade-100">
            {readiness?.readinessLevel ?? "Loading…"}
          </p>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
          <div className="text-3xl font-bold text-navy-800">{readiness?.platforms.length ?? "—"}</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">Platform targets</div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Web, PWA, iOS, Android and desktop shells stay in sync from one contract.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy-800">Platform parity matrix</h2>
            <div className="mt-4 space-y-3">
              {(readiness?.platforms ?? []).map((p) => (
                <div key={p.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl">{platformIcon[p.id] ?? "▣"}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-navy-800">{p.name}</h3>
                      <p className="text-[11px] text-slate-400">{p.channel}</p>
                    </div>
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusClass[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Capabilities</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.capabilities.map((c) => (
                          <span key={c} className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-navy-600 ring-1 ring-inset ring-navy-100">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Compliance</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.compliance.map((c) => (
                          <span key={c} className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-jade-700 ring-1 ring-inset ring-jade-100">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy-800">Shared contract</h2>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Default UX</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-sand-50 px-3 py-2">Language: <b className="text-navy-800">{config?.defaultLanguage}</b></div>
                  <div className="rounded-xl bg-sand-50 px-3 py-2">Theme: <b className="text-navy-800">{config?.defaultTheme}</b></div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</div>
                <div className="mt-2 grid gap-1.5">
                  {(config?.appNavigation ?? []).map((n) => (
                    <Link key={n.id} href={n.path} className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2 text-xs text-slate-600 hover:bg-navy-50 hover:text-navy-700">
                      <span>{n.label}</span>
                      <code className="text-[10px] text-slate-400">{n.path}</code>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy-800">App release checklist</h2>
            <div className="mt-4 space-y-2">
              {[
                "Use /api/app-config as the single source for app navigation and public links.",
                "Consume the same scheduler and careers APIs as the website.",
                "Respect saved language/theme preferences on every platform.",
                "Use HTTPS-only network calls and no client-side secrets.",
                "Complete Apple privacy nutrition and Google Data Safety forms before store submission.",
                "Sign native binaries and enable staged rollout / phased release.",
              ].map((item, i) => (
                <div key={item} className="flex gap-2 rounded-xl bg-sand-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  <span className="font-mono text-maroon-500">{String(i + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-navy-800 p-6 text-sand-50 shadow-xl shadow-navy-200">
            <h2 className="text-base font-semibold">Production app principle</h2>
            <p className="mt-2 text-sm leading-6 text-navy-200">
              The website is the canonical product surface; native and desktop apps are synchronized
              shells over the same contract, APIs, compliance links and operational controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
