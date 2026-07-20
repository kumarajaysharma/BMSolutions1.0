"use client";

import { useCallback, useEffect, useState } from "react";

type ApiKey = {
  id: number; name: string; prefix: string; scopes: string[];
  rateLimit: number; status: string; createdAt: string;
};
type Flag = {
  id: number; key: string; description: string; enabled: boolean;
  rollout: number; environments: string[];
};
type Secret = {
  id: number; name: string; maskedValue: string; environment: string;
  version: number; rotatedAt: string;
};
type Hook = {
  id: number; url: string; events: string[]; signingSecret: string;
  status: string; deliveries: number;
};

const SCOPES = ["read", "write", "deploy", "admin"];
const EVENTS = ["deploy.success", "deploy.failed", "incident.open", "flag.change", "tenant.update"];

const TABS = ["keys", "flags", "secrets", "webhooks"] as const;

export default function ServicesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [revealed, setRevealed] = useState<string | null>(null);

  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["read"]);
  const [flagKey, setFlagKey] = useState("");
  const [flagDesc, setFlagDesc] = useState("");
  const [secretName, setSecretName] = useState("");
  const [secretEnv, setSecretEnv] = useState("all");
  const [hookUrl, setHookUrl] = useState("");
  const [hookEvents, setHookEvents] = useState<string[]>(["deploy.success"]);
  const [hookError, setHookError] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/services").then((r) => r.json());
    setKeys(d.keys); setFlags(d.flags); setSecrets(d.secrets); setHooks(d.hooks);
  }, []);
  useEffect(() => { load(); }, [load]);

  const post = async (payload: object) => {
    const res = await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    load();
    return { ok: res.ok, data };
  };
  const patch = async (payload: object) => {
    await fetch("/api/services", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
  };
  const del = async (payload: object) => {
    await fetch("/api/services", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
  };

  const createKey = async () => {
    if (!keyName.trim()) return;
    const { data } = await post({ resource: "key", name: keyName, scopes: keyScopes });
    setKeyName("");
    setRevealed(data.fullKey ?? null);
  };

  const inputCls =
    "rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-navy-800 placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none";

  const tabLabel: Record<string, string> = {
    keys: `API Keys (${keys.filter((k) => k.status === "active").length})`,
    flags: `Feature Flags (${flags.length})`,
    secrets: `Secrets Vault (${secrets.length})`,
    webhooks: `Webhooks (${hooks.length})`,
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maroon-500">
          Platform Services
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">Developer Platform</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          The extension-layer control plane: scoped API keys with rate limits, progressive feature
          rollouts, a rotating secrets vault and signed webhook delivery.
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-sand-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === t ? "bg-navy-700 text-sand-50 shadow" : "text-slate-500 hover:text-navy-700"
            }`}
          >
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* ── API Keys ── */}
      {tab === "keys" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g. ci-pipeline)" className={`w-56 ${inputCls}`} />
            <div className="flex gap-1">
              {SCOPES.map((s) => (
                <button
                  key={s}
                  onClick={() => setKeyScopes((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset transition ${
                    keyScopes.includes(s)
                      ? "bg-navy-50 text-navy-600 ring-navy-200"
                      : "bg-white text-slate-400 ring-sand-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button onClick={createKey} className="rounded-xl bg-maroon-600 px-4 py-2 text-xs font-semibold text-sand-50 shadow-md shadow-maroon-200 hover:bg-maroon-500">
              + Issue key
            </button>
          </div>
          {revealed && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-jade-200 bg-jade-50 px-4 py-3">
              <span className="text-xs font-semibold text-jade-700">Key issued — copy now, it will never be shown again:</span>
              <code className="rounded-lg bg-white px-3 py-1 font-mono text-[11px] text-navy-800 ring-1 ring-jade-200">{revealed}</code>
              <button onClick={() => setRevealed(null)} className="ml-auto text-xs text-jade-600 hover:underline">dismiss</button>
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand-100 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Scopes</th>
                  <th className="px-4 py-3">Rate limit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-t border-sand-200">
                    <td className="px-4 py-3 font-medium text-navy-800">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{k.prefix}•••</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span key={s} className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] font-medium text-navy-600">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{k.rateLimit}/min</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${k.status === "active" ? "text-jade-600" : "text-maroon-500"}`}>
                        {k.status === "active" ? "● active" : "○ revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.status === "active" && (
                        <button onClick={() => patch({ resource: "key", id: k.id })} className="text-xs text-slate-400 hover:text-maroon-600">
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No keys issued yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Feature Flags ── */}
      {tab === "flags" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <input value={flagKey} onChange={(e) => setFlagKey(e.target.value)} placeholder="flag-key (e.g. new-billing-ui)" className={`w-56 ${inputCls}`} />
            <input value={flagDesc} onChange={(e) => setFlagDesc(e.target.value)} placeholder="Description" className={`flex-1 min-w-48 ${inputCls}`} />
            <button
              onClick={async () => { if (flagKey.trim()) { await post({ resource: "flag", key: flagKey, description: flagDesc }); setFlagKey(""); setFlagDesc(""); } }}
              className="rounded-xl bg-jade-600 px-4 py-2 text-xs font-semibold text-sand-50 shadow-md shadow-jade-200 hover:bg-jade-500"
            >
              + Create flag
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {flags.map((f) => (
              <div key={f.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => patch({ resource: "flag", id: f.id, enabled: !f.enabled })}
                    className={`relative h-5 w-9 rounded-full transition ${f.enabled ? "bg-jade-500" : "bg-sand-300"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${f.enabled ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <code className="font-mono text-xs font-semibold text-navy-800">{f.key}</code>
                  <span className={`ml-auto text-[10px] font-medium ${f.enabled ? "text-jade-600" : "text-slate-400"}`}>
                    {f.enabled ? `live · ${f.rollout}% rollout` : "off"}
                  </span>
                  <button onClick={() => del({ resource: "flag", id: f.id })} className="text-xs text-slate-300 hover:text-maroon-500">✕</button>
                </div>
                {f.description && <p className="mt-1.5 text-[11px] text-slate-500">{f.description}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range" min={0} max={100} step={5}
                    value={f.rollout}
                    onChange={(e) => patch({ resource: "flag", id: f.id, rollout: Number(e.target.value) })}
                    disabled={!f.enabled}
                    className="flex-1 accent-jade-600 disabled:opacity-40"
                  />
                  <span className="w-10 text-right font-mono text-[11px] tabular-nums text-slate-500">{f.rollout}%</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {["development", "staging", "production"].map((env) => {
                    const on = f.environments.includes(env);
                    return (
                      <button
                        key={env}
                        onClick={() => patch({
                          resource: "flag", id: f.id,
                          environments: on ? f.environments.filter((x) => x !== env) : [...f.environments, env],
                        })}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-medium ring-1 ring-inset ${
                          on ? "bg-navy-50 text-navy-600 ring-navy-200" : "bg-white text-slate-300 ring-sand-200"
                        }`}
                      >
                        {env}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {flags.length === 0 && (
              <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-xs text-slate-400 lg:col-span-2">
                No flags — create one to run progressive rollouts.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Secrets Vault ── */}
      {tab === "secrets" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <input value={secretName} onChange={(e) => setSecretName(e.target.value)} placeholder="SECRET_NAME (e.g. STRIPE_API_KEY)" className={`w-64 ${inputCls}`} />
            <select value={secretEnv} onChange={(e) => setSecretEnv(e.target.value)} className={inputCls}>
              <option value="all">all environments</option>
              <option>development</option><option>staging</option><option>production</option>
            </select>
            <button
              onClick={async () => { if (secretName.trim()) { await post({ resource: "secret", name: secretName, environment: secretEnv }); setSecretName(""); } }}
              className="rounded-xl bg-navy-700 px-4 py-2 text-xs font-semibold text-sand-50 shadow-md shadow-navy-200 hover:bg-navy-600"
            >
              + Store secret
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand-100 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Rotated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {secrets.map((s) => (
                  <tr key={s.id} className="border-t border-sand-200">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-navy-800">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{s.maskedValue}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] text-slate-500">{s.environment}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">v{s.version}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">{new Date(s.rotatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => patch({ resource: "secret", id: s.id })} className="mr-3 text-xs text-navy-500 hover:text-navy-700">⟳ Rotate</button>
                      <button onClick={() => del({ resource: "secret", id: s.id })} className="text-xs text-slate-300 hover:text-maroon-500">Delete</button>
                    </td>
                  </tr>
                ))}
                {secrets.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">Vault is empty. Secrets are AES-encrypted at rest and injected at runtime — never in code.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Webhooks ── */}
      {tab === "webhooks" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://api.yourapp.com/hooks/forge" className={`w-80 ${inputCls}`} />
            <div className="flex flex-wrap gap-1">
              {EVENTS.map((ev) => (
                <button
                  key={ev}
                  onClick={() => setHookEvents((cur) => cur.includes(ev) ? cur.filter((x) => x !== ev) : [...cur, ev])}
                  className={`rounded-full px-2 py-1 font-mono text-[9px] ring-1 ring-inset transition ${
                    hookEvents.includes(ev) ? "bg-maroon-50 text-maroon-600 ring-maroon-200" : "bg-white text-slate-400 ring-sand-300"
                  }`}
                >
                  {ev}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                setHookError("");
                const { ok, data } = await post({ resource: "hook", url: hookUrl, events: hookEvents });
                if (!ok) setHookError(data.error);
                else setHookUrl("");
              }}
              className="rounded-xl bg-jade-600 px-4 py-2 text-xs font-semibold text-sand-50 shadow-md shadow-jade-200 hover:bg-jade-500"
            >
              + Add endpoint
            </button>
          </div>
          {hookError && (
            <p className="mb-4 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-2.5 text-xs text-maroon-600">{hookError}</p>
          )}
          <div className="space-y-2">
            {hooks.map((h) => (
              <div key={h.id} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${h.status === "active" ? "bg-jade-500" : "bg-sand-300"}`} />
                  <code className="font-mono text-xs text-navy-800">{h.url}</code>
                  <span className="ml-auto font-mono text-[10px] text-slate-400">{h.deliveries} deliveries</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {h.events.map((ev) => (
                    <span key={ev} className="rounded-full bg-maroon-50 px-2 py-0.5 font-mono text-[9px] text-maroon-600">{ev}</span>
                  ))}
                  <span className="font-mono text-[9px] text-slate-300">sig: {h.signingSecret.slice(0, 12)}•••</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => patch({ resource: "hook", id: h.id, action: "test" })} className="text-[10px] font-medium text-navy-500 hover:text-navy-700">
                      ⚡ Send test
                    </button>
                    <button onClick={() => patch({ resource: "hook", id: h.id })} className="text-[10px] font-medium text-slate-400 hover:text-navy-700">
                      {h.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <button onClick={() => del({ resource: "hook", id: h.id })} className="text-[10px] text-slate-300 hover:text-maroon-500">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hooks.length === 0 && (
              <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-xs text-slate-400">
                No endpoints — all payloads are HMAC-signed and delivered with exponential backoff.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
