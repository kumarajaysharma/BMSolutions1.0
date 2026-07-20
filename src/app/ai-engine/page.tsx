"use client";

import { useCallback, useEffect, useState } from "react";

type Stage = { name: string; model: string; status: string; durationMs: number; detail: string };
type Task = {
  id: number;
  prompt: string;
  taskClass: string;
  routedModel: string;
  routingReason: string;
  complexityScore: number;
  status: string;
  stages: Stage[];
  output: string;
  securityStatus: string;
  securityFindings: { rule: string; severity: string; message: string; line: number }[];
  createdAt: string;
};

const SAMPLES = [
  "Design a beautiful pricing page hero with gradient styling and animated cards",
  "Plan a multi-step OAuth integration with token rotation, database schema migration and webhook security",
  "Restyle the dashboard nav with our design-system colors and a responsive layout",
  "Build a secure Stripe payment webhook API with idempotency, queue retries and audit logging",
];

const modelBadge = (m: string) =>
  m === "claude-fable-5"
    ? "bg-maroon-50 text-maroon-600 ring-maroon-200"
    : m === "gemini-3.5-flash"
      ? "bg-navy-50 text-navy-600 ring-navy-200"
      : "bg-sand-100 text-slate-500 ring-sand-300";

export default function AiEnginePage() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [visibleStages, setVisibleStages] = useState(0);
  const [current, setCurrent] = useState<Task | null>(null);
  const [history, setHistory] = useState<Task[]>([]);

  const load = useCallback(async () => {
    setHistory(await fetch("/api/ai/tasks").then((r) => r.json()));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const dispatch = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setCurrent(null);
    setVisibleStages(0);
    const task: Task = await fetch("/api/ai/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((r) => r.json());
    setCurrent(task);
    for (let i = 1; i <= task.stages.length; i++) {
      await new Promise((res) => setTimeout(res, Math.min(700, 200 + task.stages[i - 1].durationMs / 4)));
      setVisibleStages(i);
    }
    setRunning(false);
    setPrompt("");
    load();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maroon-500">
          Model Composition Layer
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">AI Routing Engine</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          <span className="font-semibold text-maroon-600">Claude Fable 5</span> plans — complex
          dependencies, multi-step logic, secure backend integration.{" "}
          <span className="font-semibold text-navy-600">Gemini 3.5 Flash</span> designs — rapid UI,
          styling, design-system consistency. Every artifact passes the zero-trust gate before commit.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Dispatch + pipeline */}
        <div className="space-y-4 xl:col-span-3">
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <label className="text-xs font-semibold text-navy-800">Task description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe the task — the router will classify it and dispatch the right model…"
              className="mt-2 w-full rounded-xl border border-sand-300 bg-sand-50 p-3 text-sm text-navy-800 placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-sand-300 bg-sand-50 px-2.5 py-1 text-[10px] text-slate-500 hover:border-navy-300 hover:text-navy-700"
                >
                  {s.slice(0, 52)}…
                </button>
              ))}
            </div>
            <button
              onClick={dispatch}
              disabled={running || !prompt.trim()}
              className="mt-3 w-full rounded-xl bg-navy-700 py-2.5 text-sm font-semibold text-sand-50 shadow-md shadow-navy-200 transition hover:bg-navy-600 disabled:opacity-40"
            >
              {running ? "Pipeline running…" : "Dispatch through router"}
            </button>
          </div>

          {current && (
            <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-800">Agentic pipeline</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ring-1 ring-inset ${modelBadge(current.routedModel)}`}
                >
                  {current.routedModel}
                </span>
              </div>
              <p className="mt-2 rounded-xl border border-sand-200 bg-sand-50 p-3 text-[11px] leading-5 text-slate-500">
                <span className="font-semibold text-navy-700">Routing decision:</span>{" "}
                {current.routingReason} Class:{" "}
                <span className="font-mono text-maroon-600">{current.taskClass}</span>
              </p>
              <div className="mt-4 space-y-0">
                {current.stages.map((s, i) => {
                  const shown = i < visibleStages;
                  const active = i === visibleStages && running;
                  return (
                    <div key={s.name} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                            shown
                              ? s.status === "passed"
                                ? "bg-jade-100 text-jade-700 ring-1 ring-jade-400"
                                : s.status === "failed"
                                  ? "bg-maroon-100 text-maroon-600 ring-1 ring-maroon-400"
                                  : "bg-sand-200 text-slate-500 ring-1 ring-sand-300"
                              : active
                                ? "animate-pulse bg-navy-100 text-navy-600 ring-1 ring-navy-400"
                                : "bg-sand-100 text-slate-300"
                          }`}
                        >
                          {shown ? (s.status === "passed" ? "✓" : s.status === "failed" ? "✕" : "–") : i + 1}
                        </div>
                        {i < current.stages.length - 1 && (
                          <div className={`w-px flex-1 ${shown ? "bg-navy-200" : "bg-sand-200"}`} />
                        )}
                      </div>
                      <div className={`pb-5 transition-opacity ${shown ? "opacity-100" : "opacity-40"}`}>
                        <div className="flex items-center gap-2 text-sm font-medium text-navy-800">
                          {s.name}
                          <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ring-1 ring-inset ${modelBadge(s.model)}`}>
                            {s.model}
                          </span>
                          {shown && (
                            <span className="font-mono text-[10px] text-slate-400">{s.durationMs}ms</span>
                          )}
                        </div>
                        {shown && <p className="mt-1 text-[11px] leading-5 text-slate-500">{s.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleStages >= current.stages.length && (
                <>
                  <div
                    className={`mt-2 rounded-xl p-3 text-xs ${
                      current.status === "committed"
                        ? "border border-jade-200 bg-jade-50 text-jade-700"
                        : "border border-maroon-200 bg-maroon-50 text-maroon-600"
                    }`}
                  >
                    {current.status === "committed"
                      ? "✓ Verified & committed — snippet cleared zero-trust security gate."
                      : "✕ Blocked — security findings must be resolved before commit."}
                  </div>
                  <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-navy-900 p-4 font-mono text-[11px] leading-5 text-sand-100">
                    {current.output}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>

        {/* Routing matrix + history */}
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Routing matrix</h3>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="rounded-xl border border-maroon-200 bg-maroon-50 p-3">
                <div className="font-mono text-xs font-semibold text-maroon-600">claude-fable-5</div>
                <p className="mt-1 leading-5 text-slate-600">
                  Architecture planning · multi-step logic · schema & migrations · auth, payments,
                  webhooks · dependency sequencing · secure backend integration
                </p>
              </div>
              <div className="rounded-xl border border-navy-200 bg-navy-50 p-3">
                <div className="font-mono text-xs font-semibold text-navy-600">gemini-3.5-flash</div>
                <p className="mt-1 leading-5 text-slate-600">
                  UI components · layout & styling · design-token consistency · animations ·
                  rapid frontend iteration
                </p>
              </div>
              <div className="rounded-xl border border-jade-200 bg-jade-50 p-3">
                <div className="font-mono text-xs font-semibold text-jade-600">studio-security-linter</div>
                <p className="mt-1 leading-5 text-slate-600">
                  Zero-trust gate: 9 policy rules (eval, secrets, XSS, SQL injection, TLS, CORS…) —
                  blocking findings withhold the commit.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Task history</h3>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
              {history.length === 0 && (
                <p className="text-xs text-slate-400">No tasks dispatched yet.</p>
              )}
              {history.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setCurrent(t); setVisibleStages(t.stages.length); }}
                  className="block w-full rounded-xl border border-sand-200 bg-sand-50 p-3 text-left transition hover:border-navy-200 hover:bg-white"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        t.status === "committed" ? "bg-jade-500" : "bg-maroon-500"
                      }`}
                    />
                    <span className="truncate text-xs text-slate-600">{t.prompt}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 pl-3.5">
                    <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ring-1 ring-inset ${modelBadge(t.routedModel)}`}>
                      {t.routedModel}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">
                      cx {t.complexityScore}/100 · {t.taskClass} · sec:{t.securityStatus}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
