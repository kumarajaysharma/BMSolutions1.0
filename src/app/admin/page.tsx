"use client";

import { useCallback, useEffect, useState } from "react";

type Tenant = {
  id: number; name: string; slug: string; plan: string; status: string;
  region: string; userCount: number; projectCount: number;
};
type User = {
  id: number; tenantId: number; tenantName: string; name: string;
  email: string; role: string; active: boolean;
};
type Audit = {
  id: number; actor: string; action: string; target: string;
  severity: string; createdAt: string;
};
type ClientRequest = {
  id: number; name: string; email: string; company: string; service: string;
  preferredDate: string; preferredTime: string; notes: string; status: string; createdAt: string;
};

const ROLES = ["owner", "admin", "architect", "developer", "designer", "viewer"];
const PERMS = [
  ["Manage tenants & billing", [true, false, false, false, false, false]],
  ["Manage users & roles (RBAC)", [true, true, false, false, false, false]],
  ["Provision environments (IaC)", [true, true, true, false, false, false]],
  ["Approve security-gate overrides", [true, true, true, false, false, false]],
  ["Extension layer: code studio", [true, true, true, true, false, false]],
  ["Configuration layer: visual builder", [true, true, true, true, true, false]],
  ["Read-only dashboards", [true, true, true, true, true, true]],
] as const;

const roleColor: Record<string, string> = {
  owner: "bg-sand-100 text-slate-700",
  admin: "bg-maroon-100 text-maroon-600",
  architect: "bg-navy-100 text-navy-600",
  developer: "bg-navy-50 text-navy-500",
  designer: "bg-jade-100 text-jade-600",
  viewer: "bg-sand-100 text-slate-400",
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

const TABS = ["tenants", "users", "rbac", "requests", "audit"] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("tenants");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [tenantName, setTenantName] = useState("");
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uRole, setURole] = useState("developer");
  const [uTenant, setUTenant] = useState<number>(1);

  const load = useCallback(async () => {
    const [t, u, a, r] = await Promise.all([
      fetch("/api/admin/tenants").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/audit").then((r) => r.json()),
      fetch("/api/requests").then((r) => r.json()),
    ]);
    setTenants(t); setUsers(u); setAudit(a); setRequests(r);
  }, []);
  useEffect(() => { load(); }, [load]);

  const addTenant = async () => {
    if (!tenantName.trim()) return;
    await fetch("/api/admin/tenants", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tenantName }),
    });
    setTenantName(""); load();
  };

  const toggleTenant = async (t: Tenant) => {
    await fetch("/api/admin/tenants", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: t.status === "active" ? "suspended" : "active" }),
    });
    load();
  };

  const addUser = async () => {
    if (!uName.trim() || !uEmail.trim()) return;
    await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: uName, email: uEmail, role: uRole, tenantId: uTenant }),
    });
    setUName(""); setUEmail(""); load();
  };

  const setRole = async (id: number, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    load();
  };

  const toggleUser = async (u: User) => {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    });
    load();
  };

  const setRequestStatus = async (id: number, status: string) => {
    await fetch("/api/requests", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const inputCls =
    "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-navy-800 placeholder:text-slate-400 focus:border-navy-400 focus:outline-none";

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jade-600">
          Administrative Controls
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-800">Studio Admin</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Multi-tenant lifecycle, role-based access control, client request triage, and the
          zero-trust audit trail.
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-2xl border border-sand-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
              tab === t ? "bg-navy-700 text-sand-50 shadow" : "text-slate-500 hover:text-navy-700"
            }`}
          >
            {t === "rbac" ? "RBAC Matrix" : t === "audit" ? "Audit Trail" : t === "requests" ? `Requests (${requests.filter((r) => r.status === "pending").length})` : t}
          </button>
        ))}
      </div>

      {tab === "tenants" && (
        <div>
          <div className="mb-4 flex gap-2">
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTenant()}
              placeholder="New tenant organization name…"
              className={`w-72 ${inputCls}`}
            />
            <button onClick={addTenant} className="rounded-xl bg-jade-600 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-jade-500">
              + Onboard tenant
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {tenants.map((t) => (
              <div key={t.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-navy-800">{t.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        t.status === "active" ? "bg-jade-100 text-jade-600" : "bg-maroon-100 text-maroon-600"
                      }`}>{t.status}</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-400">
                      {t.slug} · {t.region} · plan: {t.plan}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTenant(t)}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-medium ${
                      t.status === "active"
                        ? "bg-maroon-50 text-maroon-600 hover:bg-maroon-100"
                        : "bg-jade-50 text-jade-600 hover:bg-jade-100"
                    }`}
                  >
                    {t.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </div>
                <div className="mt-4 flex gap-6 text-xs text-slate-500">
                  <span><b className="text-navy-800">{t.userCount}</b> users</span>
                  <span><b className="text-navy-800">{t.projectCount}</b> projects</span>
                  <span className="ml-auto text-slate-300">isolated schema + vault</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <input value={uName} onChange={(e) => setUName(e.target.value)} placeholder="Full name" className={`w-44 ${inputCls}`} />
            <input value={uEmail} onChange={(e) => setUEmail(e.target.value)} placeholder="email@company.com" className={`w-56 ${inputCls}`} />
            <select value={uRole} onChange={(e) => setURole(e.target.value)} className={inputCls}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select value={uTenant} onChange={(e) => setUTenant(Number(e.target.value))} className={inputCls}>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={addUser} className="rounded-xl bg-jade-600 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-jade-500">
              + Invite
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand-100 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-sand-200">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy-800">{u.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.tenantName}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => setRole(u.id, e.target.value)}
                        className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${roleColor[u.role]}`}
                      >
                        {ROLES.map((r) => <option key={r} className="bg-white text-slate-700">{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${u.active ? "text-jade-600" : "text-slate-400"}`}>
                        {u.active ? "● active" : "○ disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleUser(u)} className="text-xs text-slate-400 underline-offset-2 hover:text-navy-700 hover:underline">
                        {u.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "rbac" && (
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand-100 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Capability</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 ${roleColor[r]}`}>{r}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([cap, grants]) => (
                <tr key={cap as string} className="border-t border-sand-200">
                  <td className="px-4 py-3 text-xs text-slate-600">{cap}</td>
                  {(grants as readonly boolean[]).map((g, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {g ? <span className="text-jade-500">✓</span> : <span className="text-sand-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-sand-200 bg-sand-50 px-4 py-3 text-[11px] text-slate-400">
            Policy is enforced server-side per tenant; every role change is written to the audit trail.
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 && (
            <p className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-slate-400">
              No client requests yet — they arrive from the landing page scheduler.
            </p>
          )}
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[11px] font-semibold text-maroon-600">
                  REQ-{String(r.id).padStart(4, "0")}
                </span>
                <span className="text-sm font-semibold text-navy-800">{r.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{r.email}</span>
                {r.company && <span className="text-xs text-slate-500">· {r.company}</span>}
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${reqStatusStyle[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="rounded-full bg-navy-50 px-2.5 py-0.5 font-medium text-navy-600">
                  {SERVICE_LABEL[r.service] ?? r.service}
                </span>
                {r.preferredDate && <span>📅 {r.preferredDate} {r.preferredTime && `· ${r.preferredTime}`}</span>}
                <span className="text-slate-300">received {new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.notes && (
                <p className="mt-2 rounded-xl bg-sand-50 px-3 py-2 text-xs leading-5 text-slate-500">
                  {r.notes}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                {["pending", "confirmed", "completed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRequestStatus(r.id, s)}
                    disabled={r.status === s}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize transition ${
                      r.status === s
                        ? "bg-navy-700 text-sand-50"
                        : "bg-sand-100 text-slate-500 hover:bg-navy-50 hover:text-navy-700"
                    }`}
                  >
                    {s}
                  </button>
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
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                a.severity === "critical" ? "bg-maroon-500" : a.severity === "warn" ? "bg-sand-300" : "bg-jade-400"
              }`} />
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
