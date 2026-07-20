"use client";

import { useCallback, useEffect, useState } from "react";

type Stage = { name: string; status: string; durationMs: number; detail: string };
type Deployment = {
  id: number; projectName: string; envName: string; version: string;
  commitSha: string; triggeredBy: string; status: string; stages: Stage[]; createdAt: string;
};
type Env = { id: number; projectName: string; name: string; status: string };

const statusChip: Record<string, string> = {
  success: "bg-jade-50 text-jade-600 ring-jade-200",
  failed: "bg-maroon-50 text-maroon-600 ring-maroon-200",
  running: "bg-navy-50 text-navy-600 ring-navy-200",
  rolled_back: "bg-sand-100 text-slate-500 ring-sand-300",
};

export default function DeploymentsPage() {
  const [deploys, setDeploys] = useState<Deployment[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);
  const [envId, setEnvId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Deployment | null>(null);
  const [visible, setVisible] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, e] = await Promise.all([
      fetch("/api/deployments").then((r) => r.json()),
      fetch("/api/environments").then((r) => r.json()),
    ]);
    setDeploys(d);
    const running = e.filter((x: Env) => x.status === "running");
    setEnvs(running);
    setEnvId((cur) => cur ?? running[0]?.id ?? null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const trigger = async (chaos: boolean) => {
    if (!envId || busy) return;
    setBusy(true);
    setSelected(null);
    setVisible(0);
    const row: Deployment = await fetch("/api/deployments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environmentId: envId, chaos }),
    }).then((r) => r.json());
    setSelected(row);
    for (let i = 1; i <= row.stages.length; i++) {
      await new Promise((res) => setTimeout(res, Math.min(650, 150 + row.stages[i - 1].durationMs / 8)));
      setVisible(i);
    }
    setBusy(false);
    load();
  };

  const rollback = async (id: number) => {
    await fetch("/api/deployments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
    if (selected?.id === id) setSelected({ ...selected, status: "rolled_back" });
  };

  const successRate = deploys.length
    ? Math.round((deploys.filter((d) => d.status === "success").length / deploys.length) * 100)
    : 100;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jade-600">
          Continuous Delivery
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">Deployment Pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Seven-stage blue/green pipeline with canary analysis, policy-gated security scanning and
          one-click rollback. Chaos drills exercise failure paths safely.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total deploys", deploys.length],
          ["Success rate", `${successRate}%`],
          ["Rolled back", deploys.filter((d) => d.status === "rolled_back").length],
          ["Active targets", envs.length],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold tabular-nums text-navy-800">{v}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Trigger deployment</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={envId ?? ""}
                onChange={(e) => setEnvId(Number(e.target.value))}
                className="flex-1 rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-navy-800 focus:border-navy-400 focus:outline-none"
              >
                {envs.map((e) => (
                  <option key={e.id} value={e.id}>{e.projectName} / {e.name}</option>
                ))}
              </select>
              <button
                onClick={() => trigger(false)}
                disabled={busy || !envId}
                className="rounded-xl bg-jade-600 px-5 py-2 text-xs font-semibold text-sand-50 shadow-md shadow-jade-200 hover:bg-jade-500 disabled:opacity-40"
              >
                {busy ? "Pipeline running…" : "▶ Deploy"}
              </button>
              <button
                onClick={() => trigger(true)}
                disabled={busy || !envId}
                className="rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-2 text-xs font-semibold text-maroon-600 hover:bg-maroon-100 disabled:opacity-40"
                title="Runs the pipeline with fault injection enabled"
              >
                ⚡ Chaos drill
              </button>
            </div>
          </div>

          {selected && (
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-navy-800">
                  {selected.version}
                </h3>
                <span className="font-mono text-[10px] text-slate-400">#{selected.commitSha}</span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusChip[selected.status]}`}>
                  {selected.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-4">
                {selected.stages.map((s, i) => {
                  const shown = i < visible;
                  const active = i === visible && busy;
                  return (
                    <div key={s.name} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                          shown
                            ? s.status === "passed"
                              ? "bg-jade-100 text-jade-700 ring-1 ring-jade-400"
                              : s.status === "failed"
                                ? "bg-maroon-100 text-maroon-600 ring-1 ring-maroon-400"
                                : "bg-sand-200 text-slate-400 ring-1 ring-sand-300"
                            : active
                              ? "animate-pulse bg-navy-100 text-navy-600 ring-1 ring-navy-400"
                              : "bg-sand-100 text-slate-300"
                        }`}>
                          {shown ? (s.status === "passed" ? "✓" : s.status === "failed" ? "✕" : "–") : i + 1}
                        </div>
                        {i < selected.stages.length - 1 && (
                          <div className={`w-px flex-1 ${shown ? "bg-navy-200" : "bg-sand-200"}`} />
                        )}
                      </div>
                      <div className={`pb-4 transition-opacity ${shown ? "opacity-100" : "opacity-40"}`}>
                        <div className="flex items-center gap-2 text-sm font-medium text-navy-800">
                          {s.name}
                          {shown && s.durationMs > 0 && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {(s.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                        {shown && <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{s.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {!busy && selected.status === "success" && (
                <button
                  onClick={() => rollback(selected.id)}
                  className="mt-2 rounded-xl border border-sand-300 bg-sand-50 px-4 py-2 text-xs font-medium text-slate-600 hover:border-maroon-200 hover:bg-maroon-50 hover:text-maroon-600"
                >
                  ⟲ Roll back this release
                </button>
              )}
            </div>
          )}
        </div>

        {/* History */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Release history</h3>
            <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto">
              {deploys.length === 0 && (
                <p className="text-xs text-slate-400">No deployments yet — trigger one.</p>
              )}
              {deploys.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-sand-200 bg-sand-50 p-3 transition hover:border-navy-200 hover:bg-white"
                >
                  <button
                    onClick={() => { setSelected(d); setVisible(d.stages.length); }}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-navy-800">{d.version}</span>
                      <span className="font-mono text-[10px] text-slate-400">#{d.commitSha}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusChip[d.status]}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{d.projectName} / {d.envName}</span>
                      <span>· by {d.triggeredBy}</span>
                      <span className="ml-auto">{new Date(d.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </button>
                  {d.status === "success" && (
                    <button
                      onClick={() => rollback(d.id)}
                      className="mt-1.5 text-[10px] font-medium text-slate-400 hover:text-maroon-600"
                    >
                      ⟲ rollback
                    </button>
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
