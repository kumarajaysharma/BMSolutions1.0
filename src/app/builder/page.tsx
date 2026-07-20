"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COMPONENT_CATALOG,
  generateProjectCode,
  type BuilderComponent,
} from "@/lib/codegen";

type Project = {
  id: number;
  name: string;
  framework: string;
  tenantName: string;
  componentCount: number;
};
type Comp = BuilderComponent & { projectId: number };

function Preview({ c }: { c: Comp }) {
  const p = c.props;
  const list = (k: string) => (p[k] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  switch (c.type) {
    case "navbar":
      return (
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
          <span className="text-sm font-bold text-zinc-900">{p.brand}</span>
          <div className="flex gap-3 text-[11px] text-zinc-500">
            {list("links").map((l) => <span key={l}>{l}</span>)}
          </div>
        </div>
      );
    case "hero":
      return (
        <div className="px-6 py-8 text-center">
          <div className="text-xl font-bold text-zinc-900">{p.title}</div>
          <div className="mt-1 text-xs text-zinc-500">{p.subtitle}</div>
          <span className="mt-3 inline-block rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] text-white">
            {p.cta}
          </span>
        </div>
      );
    case "features":
      return (
        <div className="px-4 py-5">
          <div className="text-center text-sm font-semibold text-zinc-900">{p.title}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {list("items").map((f) => (
              <div key={f} className="rounded-md border border-zinc-200 p-2 text-[10px] text-zinc-600">
                {f}
              </div>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="mx-4 my-4 rounded-lg bg-zinc-900 px-4 py-5 text-center">
          <div className="text-sm font-semibold text-white">{p.title}</div>
          <span className="mt-2 inline-block rounded-md bg-white px-3 py-1 text-[10px] text-zinc-900">
            {p.button}
          </span>
        </div>
      );
    case "form":
      return (
        <div className="mx-auto max-w-[220px] px-4 py-5">
          <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
          {list("fields").map((f) => (
            <div key={f} className="mt-1.5 rounded border border-zinc-200 px-2 py-1 text-[10px] text-zinc-400">
              {f}
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="px-4 py-5">
          <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
          <div className="mt-2 flex gap-2 border-b border-zinc-200 pb-1 text-[10px] font-medium text-zinc-600">
            {list("columns").map((col) => <span key={col} className="flex-1">{col}</span>)}
          </div>
          <div className="mt-1 flex gap-2 text-[10px] text-zinc-300">
            {list("columns").map((col) => <span key={col} className="flex-1">—</span>)}
          </div>
        </div>
      );
    case "footer":
      return (
        <div className="border-t border-zinc-200 px-4 py-3 text-center text-[10px] text-zinc-400">
          © {p.brand}. {p.note}
        </div>
      );
    default:
      return null;
  }
}

export default function BuilderPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [comps, setComps] = useState<Comp[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeFile, setActiveFile] = useState(0);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const project = projects.find((p) => p.id === projectId) ?? null;
  const selected = comps.find((c) => c.id === selectedId) ?? null;

  const loadProjects = useCallback(async () => {
    const rows: Project[] = await fetch("/api/projects").then((r) => r.json());
    setProjects(rows);
    setProjectId((cur) => cur ?? rows[0]?.id ?? null);
  }, []);

  const loadComps = useCallback(async (pid: number) => {
    const rows: Comp[] = await fetch(`/api/projects/${pid}/components`).then((r) => r.json());
    setComps(rows);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  useEffect(() => {
    if (projectId) loadComps(projectId);
  }, [projectId, loadComps]);

  const files = useMemo(
    () => generateProjectCode(project?.name ?? "Untitled", comps),
    [project?.name, comps]
  );
  useEffect(() => {
    if (activeFile >= files.length) setActiveFile(0);
  }, [files.length, activeFile]);

  const addComponent = async (type: string) => {
    if (!projectId) return;
    setSaving(true);
    const row = await fetch(`/api/projects/${projectId}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).then((r) => r.json());
    setComps((c) => [...c, row]);
    setSelectedId(row.id);
    setSaving(false);
  };

  const updateProps = async (key: string, value: string) => {
    if (!selected || !projectId) return;
    const props = { ...selected.props, [key]: value };
    setComps((cs) => cs.map((c) => (c.id === selected.id ? { ...c, props } : c)));
    await fetch(`/api/projects/${projectId}/components`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId: selected.id, props }),
    });
  };

  const move = async (id: number, dir: -1 | 1) => {
    if (!projectId) return;
    const sorted = [...comps].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((c) => c.id === id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    const me = sorted[idx];
    setComps((cs) =>
      cs.map((c) =>
        c.id === me.id
          ? { ...c, sortOrder: swap.sortOrder }
          : c.id === swap.id
            ? { ...c, sortOrder: me.sortOrder }
            : c
      )
    );
    await Promise.all([
      fetch(`/api/projects/${projectId}/components`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: me.id, sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/projects/${projectId}/components`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: swap.id, sortOrder: me.sortOrder }),
      }),
    ]);
  };

  const remove = async (id: number) => {
    if (!projectId) return;
    setComps((cs) => cs.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    await fetch(`/api/projects/${projectId}/components`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId: id }),
    });
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    const row = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    }).then((r) => r.json());
    setNewName("");
    await loadProjects();
    setProjectId(row.id);
  };

  const sorted = [...comps].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-sand-200 bg-white/70 px-6 py-3.5 backdrop-blur">
        <div>
          <h1 className="text-sm font-semibold text-navy-800">Visual Builder</h1>
          <p className="text-[11px] text-slate-400">
            Configuration layer — every action regenerates the source below in real time
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={projectId ?? ""}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-xs text-navy-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.framework}
              </option>
            ))}
          </select>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProject()}
            placeholder="New project name…"
            className="w-40 rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-xs text-navy-800 placeholder:text-slate-400"
          />
          <button
            onClick={createProject}
            className="rounded-xl bg-navy-700 px-3 py-1.5 text-xs font-medium text-sand-50 hover:bg-navy-600"
          >
            + Create
          </button>
          {saving && <span className="text-[10px] text-slate-400">syncing…</span>}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Palette */}
        <div className="w-52 shrink-0 overflow-y-auto border-r border-sand-200 bg-white/50 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Component palette
          </div>
          {Object.entries(COMPONENT_CATALOG).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => addComponent(type)}
              className="mb-1.5 flex w-full items-center gap-2.5 rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-left text-xs text-slate-600 shadow-sm transition hover:border-navy-200 hover:bg-navy-50"
            >
              <span className="text-maroon-500">{meta.icon}</span>
              {meta.label}
              <span className="ml-auto text-slate-300">+</span>
            </button>
          ))}
          <div className="mt-3 rounded-xl border border-jade-100 bg-jade-50 p-2.5 text-[10px] leading-4 text-jade-700">
            Standardized React component model — each block maps to one generated .tsx file.
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-sand-100/70 p-6">
          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-sand-300/50 ring-1 ring-sand-200">
            {sorted.length === 0 && (
              <div className="p-16 text-center text-sm text-slate-400">
                Canvas empty — add components from the palette.
              </div>
            )}
            {sorted.map((c, i) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`group relative cursor-pointer transition ${
                  selectedId === c.id
                    ? "ring-2 ring-inset ring-navy-400"
                    : "hover:ring-1 hover:ring-inset hover:ring-navy-200"
                }`}
              >
                <Preview c={c} />
                <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
                  <button
                    onClick={(e) => { e.stopPropagation(); move(c.id, -1); }}
                    disabled={i === 0}
                    className="rounded bg-navy-700/90 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-30"
                  >↑</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); move(c.id, 1); }}
                    disabled={i === sorted.length - 1}
                    className="rounded bg-navy-700/90 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-30"
                  >↓</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                    className="rounded bg-maroon-500/90 px-1.5 py-0.5 text-[10px] text-white"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Inspector */}
          {selected && (
            <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-navy-800">
                  Inspector — {COMPONENT_CATALOG[selected.type]?.label}
                </span>
                <span className="font-mono text-[10px] text-slate-400">#{selected.id}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(selected.props).map(([k, v]) => (
                  <label key={k} className="block">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      {k}
                    </span>
                    <input
                      value={v}
                      onChange={(e) => updateProps(k, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-2.5 py-1.5 text-xs text-navy-800 focus:border-navy-400 focus:bg-white focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code panel */}
        <div className="flex w-[420px] shrink-0 flex-col border-l border-sand-200">
          <div className="flex items-center gap-2 border-b border-sand-200 bg-white/70 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-jade-500" />
            <span className="text-xs font-semibold text-navy-800">Generated source</span>
            <span className="ml-auto rounded-full bg-jade-50 px-2 py-0.5 font-mono text-[10px] text-jade-700 ring-1 ring-inset ring-jade-100">
              single source of truth
            </span>
          </div>
          <div className="flex flex-wrap gap-1 border-b border-sand-200 bg-white/50 px-3 py-2">
            {files.map((f, i) => (
              <button
                key={f.path}
                onClick={() => setActiveFile(i)}
                className={`rounded-lg px-2 py-1 font-mono text-[10px] ${
                  i === activeFile
                    ? "bg-navy-100 text-navy-700"
                    : "text-slate-400 hover:text-navy-600"
                }`}
              >
                {f.path.split("/").pop()}
              </button>
            ))}
          </div>
          <pre className="flex-1 overflow-auto bg-navy-900 p-4 font-mono text-[11px] leading-5 text-sand-100">
            {files[activeFile]?.code ?? ""}
          </pre>
        </div>
      </div>
    </div>
  );
}
