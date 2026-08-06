/**
 * src/app/admin/page.tsx
 *
 * BNLV Studio — Super Admin Control Plane
 * =========================================
 * Comprehensive P0 Admin Control Plane combining modular sub-components
 * with full multi-tenant, RBAC, request triage, and audit trail coverage.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TenantPlan   = "starter" | "scale" | "enterprise";
type TenantStatus = "active"  | "suspended" | "deleted";

type Tenant = {
  id: number;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  region: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  projectCount: number;
};

type UserRole = "owner" | "admin" | "architect" | "developer" | "designer" | "viewer";

type User = {
  id: number;
  tenantId: number;
  tenantName: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type Audit = {
  id: number;
  actor: string;
  action: string;
  target: string;
  severity: string;
  createdAt: string;
};

type ClientRequest = {
  id: number;
  name: string;
  email: string;
  company: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: string;
  createdAt: string;
};

type Tab = "tenants" | "users" | "rbac" | "requests" | "audit";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & STYLES
// ─────────────────────────────────────────────────────────────────────────────

const PLANS: TenantPlan[] = ["starter", "scale", "enterprise"];
const ROLES: UserRole[]   = ["owner", "admin", "architect", "developer", "designer", "viewer"];
const REGIONS             = ["ap-south-1", "us-east-1", "eu-west-1", "ap-southeast-1"];

const PERMS = [
  ["Manage tenants & billing", [true, false, false, false, false, false]],
  ["Manage users & roles (RBAC)", [true, true, false, false, false, false]],
  ["Provision environments (IaC)", [true, true, true, false, false, false]],
  ["Approve security-gate overrides", [true, true, true, false, false, false]],
  ["Extension layer: code studio", [true, true, true, true, false, false]],
  ["Configuration layer: visual builder", [true, true, true, true, true, false]],
  ["Read-only dashboards", [true, true, true, true, true, true]],
] as const;

const planChip: Record<TenantPlan, string> = {
  starter:    "bg-sand-100 text-slate-500 ring-sand-300",
  scale:      "bg-navy-50 text-navy-600 ring-navy-200",
  enterprise: "bg-amber-50 text-amber-700 ring-amber-200",
};

const statusChip: Record<TenantStatus, string> = {
  active:    "bg-jade-50 text-jade-700 ring-jade-200",
  suspended: "bg-maroon-50 text-maroon-600 ring-maroon-200",
  deleted:   "bg-sand-100 text-slate-400 ring-sand-200",
};

const roleChip: Record<UserRole, string> = {
  owner:     "bg-amber-50 text-amber-700 ring-amber-200",
  admin:     "bg-navy-50 text-navy-700 ring-navy-200",
  architect: "bg-maroon-50 text-maroon-600 ring-maroon-200",
  developer: "bg-jade-50 text-jade-700 ring-jade-200",
  designer:  "bg-sand-100 text-slate-600 ring-sand-300",
  viewer:    "bg-sand-50 text-slate-400 ring-sand-200",
};

const SERVICE_LABEL: Record<string, string> = {
  "platform-demo": "Platform Demo",
  "architecture-consult": "Architecture Consultation",
  "migration-assessment": "Migration Assessment",
  "security-review": "Security Review",
};

const reqStatusStyle: Record<string, string> = {
  pending: "bg-sand-100 text-slate-500 ring-sand-300",
  confirmed: "bg-navy-50 text-navy-600 ring-navy-200",
  completed: "bg-jade-50 text-jade-600 ring-jade-200",
};

const inputCls =
  "w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-navy-800 " +
  "placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:outline-none";

const selectCls =
  "rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-navy-800 " +
  "focus:border-navy-400 focus:outline-none";

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, data: null, error: data?.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: data as T, error: null };
  } catch {
    return { ok: false, data: null, error: "Network error — check your connection." };
  }
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-maroon-500" />
      <p className="text-xs font-medium text-maroon-700">{message}</p>
    </div>
  );
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-sand-200" />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-PANELS
// ─────────────────────────────────────────────────────────────────────────────

function TenantsPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [busy, setBusy]       = useState(false);

  const [name,   setName]   = useState("");
  const [plan,   setPlan]   = useState<TenantPlan>("scale");
  const [region, setRegion] = useState("ap-south-1");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { ok, data, error } = await apiFetch<Tenant[]>("/api/admin/tenants");
    if (ok && data) setTenants(data);
    else setError(error ?? "Failed to load tenants.");
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const createTenant = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const { ok, error } = await apiFetch("/api/admin/tenants", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), plan, region }),
    });
    if (!ok) setError(error ?? "Failed to create tenant.");
    else { setName(""); await load(); }
    setBusy(false);
  };

  const patchTenant = async (id: number, patch: { status?: TenantStatus; plan?: TenantPlan }) => {
    setBusy(true);
    setError(null);
    const { ok, error } = await apiFetch("/api/admin/tenants", {
      method: "PATCH",
      body: JSON.stringify({ id, ...patch }),
    });
    if (!ok) setError(error ?? "Failed to update tenant.");
    else await load();
    setBusy(false);
  };

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-navy-800">Provision new workspace</h3>
        {error && <ErrorBanner message={error} />}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workspace name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createTenant()} placeholder="e.g. Acme Corp" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value as TenantPlan)} className={selectCls}>
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={createTenant} disabled={busy || !name.trim()} className="rounded-xl bg-navy-700 px-5 py-2 text-xs font-semibold text-sand-50 shadow-sm transition hover:bg-navy-600 disabled:opacity-40">
            {busy ? "Provisioning…" : "+ Provision"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-sand-200 bg-sand-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-navy-800">
            Tenant Registry
            <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 font-mono text-[10px] text-navy-600 ring-1 ring-inset ring-navy-100">
              {loading ? "…" : tenants.length}
            </span>
          </h3>
          <button onClick={load} disabled={loading} className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:border-navy-300 hover:text-navy-700 disabled:opacity-40">
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Name / Slug</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3">Users</th>
                <th className="px-5 py-3">Projects</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {loading ? Array.from({ length: 3 }).map((_, i) => <LoadingRow key={i} cols={9} />) : tenants.map((t) => (
                <tr key={t.id} className="transition hover:bg-sand-50/60">
                  <td className="px-5 py-3 font-mono text-[11px] text-slate-400">#{t.id}</td>
                  <td className="px-5 py-3">
                    <div className="font-semibold text-navy-800">{t.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{t.slug}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${planChip[t.plan]}`}>{t.plan}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusChip[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{t.region}</td>
                  <td className="px-5 py-3 tabular-nums text-xs text-slate-600">{t.userCount}</td>
                  <td className="px-5 py-3 tabular-nums text-xs text-slate-600">{t.projectCount}</td>
                  <td className="px-5 py-3 text-[11px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.plan !== "enterprise" && (
                        <button onClick={() => patchTenant(t.id, { plan: t.plan === "starter" ? "scale" : "enterprise" })} disabled={busy} className="rounded-lg border border-navy-200 bg-navy-50 px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:bg-navy-100 disabled:opacity-40">↑ Upgrade</button>
                      )}
                      {t.status === "active" ? (
                        <button onClick={() => patchTenant(t.id, { status: "suspended" })} disabled={busy} className="rounded-lg border border-maroon-200 bg-maroon-50 px-2.5 py-1 text-[10px] font-medium text-maroon-600 hover:bg-maroon-100 disabled:opacity-40">Suspend</button>
                      ) : t.status === "suspended" ? (
                        <button onClick={() => patchTenant(t.id, { status: "active" })} disabled={busy} className="rounded-lg border border-jade-200 bg-jade-50 px-2.5 py-1 text-[10px] font-medium text-jade-700 hover:bg-jade-100 disabled:opacity-40">Activate</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersPanel({ tenants }: { tenants: { id: number; name: string }[] }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [busy, setBusy]       = useState(false);

  const [userName, setUserName] = useState("");
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState<UserRole>("developer");
  const [tenantId, setTenantId] = useState<number | "">(tenants[0]?.id ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { ok, data, error } = await apiFetch<User[]>("/api/admin/users");
    if (ok && data) setUsers(data);
    else setError(error ?? "Failed to load users.");
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (tenants.length > 0 && tenantId === "") setTenantId(tenants[0].id); }, [tenants, tenantId]);

  const createUser = async () => {
    if (!userName.trim() || !email.trim() || !tenantId) return;
    setBusy(true);
    setError(null);
    const { ok, error } = await apiFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ name: userName.trim(), email: email.trim(), role, tenantId }),
    });
    if (!ok) setError(error ?? "Failed to create user.");
    else { setUserName(""); setEmail(""); await load(); }
    setBusy(false);
  };

  const patchUser = async (id: number, patch: { role?: UserRole; active?: boolean }) => {
    setBusy(true);
    setError(null);
    const { ok, error } = await apiFetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({ id, ...patch }),
    });
    if (!ok) setError(error ?? "Failed to update user.");
    else await load();
    setBusy(false);
  };

  const deleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Permanently delete user "${name}"?`)) return;
    setBusy(true);
    setError(null);
    const { ok, error } = await apiFetch("/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (!ok) setError(error ?? "Failed to delete user.");
    else await load();
    setBusy(false);
  };

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-navy-800">Provision new user</h3>
        {error && <ErrorBanner message={error} />}
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Full name</label>
            <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Jane Cooper" className={inputCls} />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={selectCls}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workspace</label>
            <select value={tenantId} onChange={(e) => setTenantId(Number(e.target.value))} className={selectCls}>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={createUser} disabled={busy || !userName.trim() || !email.trim() || !tenantId} className="rounded-xl bg-navy-700 px-5 py-2 text-xs font-semibold text-sand-50 shadow-sm transition hover:bg-navy-600 disabled:opacity-40">
            {busy ? "Creating…" : "+ Create"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-sand-200 bg-sand-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-navy-800">
            User Registry
            <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 font-mono text-[10px] text-navy-600 ring-1 ring-inset ring-navy-100">{loading ? "…" : users.length}</span>
          </h3>
          <button onClick={load} disabled={loading} className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:border-navy-300 hover:text-navy-700 disabled:opacity-40">
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Workspace</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Login</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {loading ? Array.from({ length: 4 }).map((_, i) => <LoadingRow key={i} cols={8} />) : users.map((u) => (
                <tr key={u.id} className={`transition hover:bg-sand-50/60 ${!u.active ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3 font-mono text-[11px] text-slate-400">#{u.id}</td>
                  <td className="px-5 py-3 font-semibold text-navy-800">{u.name}</td>
                  <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{u.email}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{u.tenantName}</td>
                  <td className="px-5 py-3">
                    <select value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value as UserRole })} disabled={busy} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset focus:outline-none disabled:opacity-40 ${roleChip[u.role]}`}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => patchUser(u.id, { active: !u.active })} disabled={busy} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset transition disabled:opacity-40 ${u.active ? "bg-jade-50 text-jade-700 ring-jade-200 hover:bg-jade-100" : "bg-sand-100 text-slate-400 ring-sand-200 hover:bg-maroon-50 hover:text-maroon-500"}`}>
                      {u.active ? "● active" : "○ disabled"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-slate-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => deleteUser(u.id, u.name)} disabled={busy} className="rounded-lg border border-maroon-200 bg-maroon-50 px-2.5 py-1 text-[10px] font-medium text-maroon-600 hover:bg-maroon-100 disabled:opacity-40">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE WITH ALL 5 TABS
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("tenants");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [audit, setAudit]     = useState<Audit[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const loadAll = useCallback(async () => {
    setLoadingTenants(true);
    const [tRes, aRes, rRes] = await Promise.all([
      apiFetch<Tenant[]>("/api/admin/tenants"),
      apiFetch<Audit[]>("/api/audit"),
      apiFetch<ClientRequest[]>("/api/requests"),
    ]);
    if (tRes.ok && tRes.data) setTenants(tRes.data);
    if (aRes.ok && aRes.data) setAudit(aRes.data);
    if (rRes.ok && rRes.data) setRequests(rRes.data);
    setLoadingTenants(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll(); }, [loadAll]);

  const setRequestStatus = async (id: number, status: string) => {
    await apiFetch("/api/requests", { method: "PATCH", body: JSON.stringify({ id, status }) });
    loadAll();
  };

  return (
    <div className="min-h-screen bg-sand-50 p-8">
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-600">Super Admin</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">Control Plane</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Live data from Neon PostgreSQL via authenticated Drizzle ORM routes with RLS enforcement.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total Workspaces", loadingTenants ? "—" : tenants.length],
          ["Enterprise", loadingTenants ? "—" : tenants.filter((t) => t.plan === "enterprise").length],
          ["Active", loadingTenants ? "—" : tenants.filter((t) => t.status === "active").length],
          ["Pending Requests", loadingTenants ? "—" : requests.filter((r) => r.status === "pending").length],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold tabular-nums text-navy-800">{value}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* 5-Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-sand-200 bg-white p-1 shadow-sm">
        {([
          ["tenants", "Tenant Registry"],
          ["users", "User Management"],
          ["rbac", "RBAC Matrix"],
          ["requests", `Requests (${requests.filter((r) => r.status === "pending").length})`],
          ["audit", "Audit Trail"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${tab === id ? "bg-navy-700 text-sand-50 shadow" : "text-slate-500 hover:text-navy-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "tenants" && <TenantsPanel />}
      {tab === "users" && <UsersPanel tenants={tenants.map((t) => ({ id: t.id, name: t.name }))} />}
      
      {tab === "rbac" && (
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand-100 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Capability</th>
                {ROLES.map((r) => (<th key={r} className="px-3 py-3 text-center"><span className={`rounded-full px-2 py-0.5 ${roleChip[r]}`}>{r}</span></th>))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([cap, grants]) => (
                <tr key={cap as string} className="border-t border-sand-200">
                  <td className="px-4 py-3 text-xs text-slate-600">{cap}</td>
                  {(grants as readonly boolean[]).map((g, i) => (<td key={i} className="px-3 py-3 text-center">{g ? <span className="text-jade-500">✓</span> : <span className="text-sand-300">—</span>}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-sand-200 bg-sand-50 px-4 py-3 text-[11px] text-slate-400">Policy is enforced server-side per tenant; every role change is written to the audit trail.</div>
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 && <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-slate-400">No client requests yet.</p>}
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[11px] font-semibold text-maroon-600">REQ-{String(r.id).padStart(4, "0")}</span>
                <span className="text-sm font-semibold text-navy-800">{r.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{r.email}</span>
                {r.company && <span className="text-xs text-slate-500">· {r.company}</span>}
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${reqStatusStyle[r.status]}`}>{r.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="rounded-full bg-navy-50 px-2.5 py-0.5 font-medium text-navy-600">{SERVICE_LABEL[r.service] ?? r.service}</span>
                {r.preferredDate && <span>📅 {r.preferredDate} {r.preferredTime && `· ${r.preferredTime}`}</span>}
                <span className="text-slate-300">received {new Date(r.createdAt).toLocaleString()}</span>
              </div>
      {r.notes && <p className="mt-2 rounded-xl bg-sand-50 px-3 py-2 text-xs leading-5 text-slate-500">{r.notes}</p>}
              <div className="mt-3 flex gap-2">
                {["pending", "confirmed", "completed"].map((s) => (
                  <button key={s} onClick={() => setRequestStatus(r.id, s)} disabled={r.status === s} className={`rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize transition ${r.status === s ? "bg-navy-700 text-sand-50" : "bg-sand-100 text-slate-500 hover:bg-navy-50 hover:text-navy-700"}`}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-1.5">
          {audit.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-xs shadow-sm">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.severity === "critical" ? "bg-maroon-500" : a.severity === "warn" ? "bg-sand-300" : "bg-jade-400"}`} />
              <span className="font-mono text-slate-400">{new Date(a.createdAt).toLocaleTimeString()}</span>
              <span className="font-mono text-navy-600">{a.actor}</span>
              <span className="text-slate-600">{a.action}</span>
              <span className="ml-auto font-mono text-slate-300">{a.target}</span>
            </div>
          ))}
          {audit.length === 0 && <p className="text-sm text-slate-400">No audit events yet.</p>}
        </div>
      )}
    </div>
  );
}