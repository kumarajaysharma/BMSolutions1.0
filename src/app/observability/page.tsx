"use client";

import { useCallback, useEffect, useState } from "react";

type Service = {
  envId: number; envName: string; region: string; tier: string;
  p50: number[]; p95: number[]; errRate: number[]; rps: number[];
  cpu: number[]; mem: number[]; availability: number; apdex: number;
};
type Incident = {
  id: number; title: string; service: string; severity: string;
  status: string; createdAt: string; resolvedAt: string | null;
};
type Data = {
  services: Service[];
  incidents: Incident[];
  slo: { target: number; current: number; errorBudgetUsed: number; openIncidents: number };
};

function Sparkline({ data, stroke, fill }: { data: number[]; stroke: string; fill: string }) {
  const w = 220, h = 48;
  const max = Math.max(...data) * 1.15 || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={fill} />
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth="1.75" />
    </svg>
  );
}

function Gauge({ pct, label }: { pct: number; label: string }) {
  const color = pct > 80 ? "#a05a6b" : pct > 55 ? "#b8a26b" : "#46896c";
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const sevChip: Record<string, string> = {
  sev1: "bg-maroon-100 text-maroon-700 ring-maroon-300",
  sev2: "bg-maroon-50 text-maroon-500 ring-maroon-200",
  sev3: "bg-sand-100 text-slate-500 ring-sand-300",
};
const incStatusChip: Record<string, string> = {
  open: "bg-maroon-50 text-maroon-600",
  monitoring: "bg-navy-50 text-navy-600",
  resolved: "bg-jade-50 text-jade-600",
};

export default function ObservabilityPage() {
  const [data, setData] = useState<Data | null>(null);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("sev3");

  const load = useCallback(async () => {
    setData(await fetch("/api/observability").then((r) => r.json()));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 10000);
    return () => clearInterval(t);
  }, [load]);

  const openIncident = async () => {
    if (!title.trim()) return;
    await fetch("/api/observability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, severity }),
    });
    setTitle("");
    load();
  };

  const setStatus = async (id: number, status: string) => {
    await fetch("/api/observability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const slo = data?.slo;
  const budget = Math.round(slo?.errorBudgetUsed ?? 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-500">
          Observability & Reliability
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">Service Health</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Live golden signals per environment — latency, traffic, errors, saturation — with SLO
          tracking, error-budget burn and full incident lifecycle management.
        </p>
      </div>

      {/* SLO cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold tabular-nums text-navy-800">{slo?.current ?? "—"}%</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Availability (target {slo?.target ?? 99.9}%)
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
          <div className={`text-2xl font-bold tabular-nums ${budget > 80 ? "text-maroon-600" : "text-navy-800"}`}>
            {budget}%
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Error budget used
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-200">
            <div
              className={`h-full rounded-full ${budget > 80 ? "bg-maroon-500" : budget > 50 ? "bg-sand-300" : "bg-jade-500"}`}
              style={{ width: `${budget}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
          <div className={`text-2xl font-bold tabular-nums ${(slo?.openIncidents ?? 0) > 0 ? "text-maroon-600" : "text-jade-600"}`}>
            {slo?.openIncidents ?? 0}
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Open incidents
          </div>
        </div>
        <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold tabular-nums text-navy-800">{data?.services.length ?? 0}</div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Monitored services
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Service panels */}
        <div className="space-y-4 xl:col-span-2">
          {(data?.services ?? []).map((s) => (
            <div key={s.envId} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-navy-800">app-service</h3>
                <span className="rounded-full bg-navy-50 px-2 py-0.5 font-mono text-[10px] text-navy-600">
                  /{s.envName}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{s.region} · {s.tier}</span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-jade-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-jade-500" />
                  apdex {s.apdex} · {s.availability}% avail
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Latency p50 / p95</span>
                    <span className="font-mono tabular-nums">
                      {s.p50.at(-1)}ms / <span className="text-maroon-500">{s.p95.at(-1)}ms</span>
                    </span>
                  </div>
                  <Sparkline data={s.p95} stroke="#a05a6b" fill="rgba(160,90,107,0.08)" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Throughput</span>
                    <span className="font-mono tabular-nums">{Math.round(s.rps.at(-1) ?? 0)} req/s</span>
                  </div>
                  <Sparkline data={s.rps} stroke="#3a5680" fill="rgba(58,86,128,0.08)" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Error rate</span>
                    <span className={`font-mono tabular-nums ${(s.errRate.at(-1) ?? 0) > 1.5 ? "text-maroon-600" : ""}`}>
                      {s.errRate.at(-1)}%
                    </span>
                  </div>
                  <Sparkline data={s.errRate} stroke="#8c4457" fill="rgba(140,68,87,0.07)" />
                </div>
                <div className="space-y-3 pt-1">
                  <Gauge pct={s.cpu.at(-1) ?? 0} label="CPU saturation" />
                  <Gauge pct={s.mem.at(-1) ?? 0} label="Memory" />
                </div>
              </div>
            </div>
          ))}
          {data && data.services.length === 0 && (
            <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-slate-400">
              No running environments — provision one under Infrastructure to begin monitoring.
            </p>
          )}
        </div>

        {/* Incidents */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Declare incident</h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && openIncident()}
              placeholder="Elevated 5xx on checkout service…"
              className="mt-2 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-navy-800 placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-navy-800"
              >
                <option value="sev1">SEV1 — critical outage</option>
                <option value="sev2">SEV2 — degraded</option>
                <option value="sev3">SEV3 — minor</option>
              </select>
              <button
                onClick={openIncident}
                className="flex-1 rounded-xl bg-maroon-600 px-4 py-2 text-xs font-semibold text-sand-50 shadow-md shadow-maroon-200 hover:bg-maroon-500"
              >
                Declare
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Incident timeline</h3>
            <div className="mt-3 max-h-[430px] space-y-2 overflow-y-auto">
              {(data?.incidents ?? []).length === 0 && (
                <p className="text-xs text-slate-400">No incidents — all systems nominal. ✨</p>
              )}
              {(data?.incidents ?? []).map((inc) => (
                <div key={inc.id} className="rounded-xl border border-sand-200 bg-sand-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ring-1 ring-inset ${sevChip[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-navy-800">{inc.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${incStatusChip[inc.status]}`}>
                      {inc.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-mono">{inc.service}</span>
                    <span>· {new Date(inc.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {inc.status !== "resolved" && (
                    <div className="mt-2 flex gap-1.5">
                      {["monitoring", "resolved"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(inc.id, s)}
                          className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-medium capitalize text-slate-500 ring-1 ring-inset ring-sand-300 hover:text-navy-700"
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
