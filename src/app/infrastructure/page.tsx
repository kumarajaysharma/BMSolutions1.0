"use client";

import { useCallback, useEffect, useState } from "react";

type Env = {
  id: number; projectId: number; projectName: string; name: string;
  region: string; tier: string; status: string; terraform: string; createdAt: string;
};
type Project = { id: number; name: string };

const statusStyle: Record<string, string> = {
  provisioning: "bg-sand-100 text-slate-500 ring-sand-300",
  running: "bg-jade-50 text-jade-600 ring-jade-200",
  degraded: "bg-maroon-50 text-maroon-600 ring-maroon-200",
  destroyed: "bg-sand-100 text-slate-300 ring-sand-200",
};

export default function InfrastructurePage() {
  const [envs, setEnvs] = useState<Env[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Env | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [envName, setEnvName] = useState("development");
  const [region, setRegion] = useState("us-east-1");
  const [tier, setTier] = useState("standard");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [e, p] = await Promise.all([
      fetch("/api/environments").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setEnvs(e);
    setProjects(p);
    setProjectId((cur) => cur ?? p[0]?.id ?? null);
    setSelected((cur) => (cur ? e.find((x: Env) => x.id === cur.id) ?? cur : cur));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => clearInterval(t);
  }, [load]);

  const provision = async () => {
    if (!projectId || busy) return;
    setBusy(true);
    const row = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: envName, region, tier }),
    }).then((r) => r.json());
    setBusy(false);
    setSelected(row);
    load();
  };

  const destroy = async (id: number) => {
    await fetch("/api/environments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const selectCls =
    "rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-navy-800 focus:border-navy-400 focus:outline-none";

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-500">
          Infrastructure-as-Code
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">Environments & IaC</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Every environment is expressed as generated Terraform — reviewable, versioned, and
          lifecycle-managed automatically. Production defaults to multi-AZ, WAF, and deletion protection.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          {/* Provisioner */}
          <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-navy-800">Provision environment</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={projectId ?? ""} onChange={(e) => setProjectId(Number(e.target.value))}
                className={`col-span-2 ${selectCls}`}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={envName} onChange={(e) => setEnvName(e.target.value)} className={selectCls}>
                <option>development</option><option>staging</option><option>production</option>
              </select>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
                <option>us-east-1</option><option>us-west-2</option><option>eu-central-1</option><option>ap-southeast-1</option>
              </select>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className={`col-span-2 ${selectCls}`}>
                <option value="standard">standard — shared compute</option>
                <option value="performance">performance — dedicated CPU</option>
                <option value="dedicated">dedicated — isolated cluster</option>
              </select>
            </div>
            <button onClick={provision} disabled={busy || !projectId}
              className="mt-3 w-full rounded-xl bg-jade-600 py-2.5 text-sm font-semibold text-sand-50 shadow-md shadow-jade-200 transition hover:bg-jade-500 disabled:opacity-40">
              {busy ? "Generating Terraform…" : "Generate Terraform & provision"}
            </button>
          </div>

          {/* Env list */}
          <div className="space-y-2">
            {envs.map((e) => (
              <button key={e.id} onClick={() => setSelected(e)}
                className={`block w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                  selected?.id === e.id
                    ? "border-navy-300 bg-navy-50"
                    : "border-sand-200 bg-white hover:border-sand-300"
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy-800">{e.projectName}</span>
                  <span className="font-mono text-[10px] text-slate-400">/{e.name}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusStyle[e.status]}`}>
                    {e.status === "provisioning" && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-navy-400 align-middle" />}
                    {e.status}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] text-slate-400">
                  <span>{e.region}</span><span>{e.tier}</span>
                  <span>{new Date(e.createdAt).toLocaleTimeString()}</span>
                  {e.status !== "destroyed" && (
                    <span
                      role="button"
                      onClick={(ev) => { ev.stopPropagation(); destroy(e.id); }}
                      className="ml-auto text-maroon-400 hover:text-maroon-600"
                    >
                      terraform destroy
                    </span>
                  )}
                </div>
              </button>
            ))}
            {envs.length === 0 && (
              <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-6 text-center text-xs text-slate-400">
                No environments yet — provision one above.
              </p>
            )}
          </div>
        </div>

        {/* Terraform viewer */}
        <div className="xl:col-span-3">
          <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-sand-200 shadow-lg shadow-sand-200/60">
            <div className="flex items-center gap-2 border-b border-navy-800 bg-navy-800 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-maroon-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-sand-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-jade-400/80" />
              <span className="ml-2 font-mono text-[11px] text-navy-200">
                {selected ? `${selected.projectName}/${selected.name}/main.tf` : "main.tf"}
              </span>
              {selected && (
                <span className="ml-auto font-mono text-[10px] text-navy-400">
                  plan: {selected.status === "running" ? "applied ✓" : selected.status}
                </span>
              )}
            </div>
            <pre className="flex-1 overflow-auto bg-navy-900 p-5 font-mono text-[11px] leading-5 text-sand-100">
              {selected?.terraform ??
                "# Select or provision an environment to inspect its generated Terraform.\n# The studio emits a complete module graph: network, service, database,\n# secrets vault — with zero-trust defaults baked in."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
