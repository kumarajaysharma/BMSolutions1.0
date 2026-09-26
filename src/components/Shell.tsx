"use client";

/**
 * src/components/Shell.tsx
 *
 * BNLV Group Enterprise Shell — Navigation & Layout Wrapper
 * =========================================================
 * Ported from full-stack-visual-builder-ide/src/components/Shell.tsx
 * with the following BNLV-mandatory adaptations:
 *
 *   AUTH-001  AUTH_ENFORCED flag removed — BNLV middleware ALWAYS enforces
 *             auth via JWT HS256. The shell receives a verified user object
 *             from the server layout; no fallback identity is ever used.
 *
 *   AUTH-002  Session cookie changed from 'bnlv_session' to 'bms_session'.
 *             The logout call is handled by the existing /api/auth/logout
 *             route which clears bms_session.
 *
 *   NAV-001   Route paths updated to BNLV studio namespace:
 *               builder routes → /studio/bms/*
 *               nidhivan routes → /studio/nidhivan/*
 *               limsy routes → /studio/limsy/*
 *
 *   NAV-002   Documentation Engine added to Build group:
 *               /studio/bms/documents → Documentation Engine
 *
 *   NAV-003   All 17 new tables from migration 0018 have corresponding
 *             nav entries, stubbed until pages are built.
 *
 *   RBAC-001  Role-based nav filtering added:
 *               architect+ sees LIMSY trial room and financial journals
 *               developer+ sees Studio Builder and Workflow Canvas
 *               viewer sees read-only dashboards only
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type NavItem = {
  href:  string;
  label: string;
  icon:  string;
  hint:  string;
  minRole?: "viewer" | "developer" | "architect" | "admin" | "owner";
};

type NavGroup = { title: string; items: NavItem[] };

// ── RBAC helper ───────────────────────────────────────────────────────────────

const ROLE_RANK: Record<string, number> = {
  owner: 0, admin: 1, architect: 2, developer: 3, designer: 4, viewer: 5,
};

function hasRole(actual: string, required: string): boolean {
  return (ROLE_RANK[actual] ?? 99) <= (ROLE_RANK[required] ?? 0);
}

// ── Navigation definition ─────────────────────────────────────────────────────

const NAV: NavGroup[] = [
  {
    title: "Studio",
    items: [
      { href: "/studio",          label: "Command Centre",  icon: "◎", hint: "Group delivery signal" },
      { href: "/studio/bms",      label: "BMS Workspace",  icon: "◫", hint: "BMSolutions operations" },
      { href: "/studio/bms/projects", label: "Programmes", icon: "◫", hint: "Client engagements" },
      { href: "/studio/bms/clients",  label: "Clients",    icon: "◐", hint: "Revenue portfolio", minRole: "developer" },
      { href: "/studio/bms/team",     label: "Studio Team",icon: "◔", hint: "People & allocation", minRole: "developer" },
    ],
  },
  {
    title: "Build",
    items: [
      { href: "/studio/bms/builder",    label: "Visual Builder",     icon: "✎", hint: "Canvas composition",          minRole: "developer" },
      { href: "/studio/bms/library",    label: "Block Library",      icon: "⬡", hint: "Design system",               minRole: "developer" },
      { href: "/studio/bms/documents",  label: "Documentation",      icon: "D", hint: "4-phase doc engine · AI",     minRole: "developer" },
      { href: "/studio/bms/marketplace",label: "Customize",          icon: "⊞", hint: "Skills, connectors & plugins" },
      { href: "/studio/bms/tasks",      label: "Delivery Board",     icon: "☰", hint: "Kanban execution" },
    ],
  },
  {
    title: "Nidhivan Finance",
    items: [
      { href: "/studio/nidhivan",            label: "Nidhivan Desk",    icon: "₹", hint: "Fintech & research command" },
      { label: "CFO Cockpit", href: "/studio/nidhivan/cockpit" }, { href: "/studio/nidhivan/books",      label: "The Books",        icon: "▤", hint: "Ledger, journals, close",   minRole: "architect" },
      { href: "/studio/nidhivan/boqs",       label: "BOQ / DPR",        icon: "▩", hint: "CPWD cost estimation" },
      { href: "/studio/nidhivan/research",   label: "Research",         icon: "◈", hint: "Equity, credit, fintech" },
      { href: "/studio/nidhivan/lab",        label: "Fintech Lab",      icon: "⚗", hint: "R&D sandbox to production", minRole: "developer" },
      { href: "/studio/nidhivan/counsel",    label: "Fin Co-Counsel",   icon: "◆", hint: "CFO & accountant AI",       minRole: "architect" },
      { href: "/studio/nidhivan/connectors", label: "Fin Connectors",   icon: "⊞", hint: "Stripe, QB, S&P, IBKR",   minRole: "admin" },
    ],
  },
  {
    title: "LIMSY Legal",
    items: [
      { href: "/studio/limsy",              label: "LIMSY Studio",    icon: "⚖", hint: "Legal intelligence command" },
      { href: "/studio/limsy/matters",      label: "The Docket",      icon: "§", hint: "Case inception to closure" },
      { href: "/studio/limsy/trial",        label: "Trial Room",      icon: "▣", hint: "Court in session",         minRole: "architect" },
      { href: "/studio/limsy/frameworks",   label: "Frameworks",      icon: "¶", hint: "IRAC / CREAC builder",     minRole: "architect" },
      { href: "/studio/limsy/counsel",      label: "Co-Counsel",      icon: "◆", hint: "LIMSY legal intelligence", minRole: "architect" },
      { href: "/studio/limsy/connectors",   label: "Legal Connectors",icon: "⊞", hint: "Harvey, CoCounsel, Everlaw", minRole: "admin" },
    ],
  },
  {
    title: "Automate",
    items: [
      { href: "/studio/bms/agentic",    label: "Agentic AI",       icon: "◆", hint: "Enterprise agent platform", minRole: "developer" },
      { href: "/studio/bms/workflows",  label: "Workflow Builder",  icon: "⚡", hint: "Visual automation canvas",  minRole: "developer" },
    ],
  },
  {
    title: "Ship",
    items: [
      { href: "/studio/bms/deployments", label: "Release Console", icon: "▲", hint: "Pipelines & rollback",     minRole: "developer" },
      { href: "/studio/bms/hosting",     label: "Hosting",         icon: "☁", hint: "Container & DNS mgmt",    minRole: "architect" },
    ],
  },
  {
    title: "Governance",
    items: [
      { href: "/studio/bms/release",     label: "Release Evidence", icon: "◈", hint: "Live QA and release sign-off", minRole: "architect" },
      { href: "/studio/bms/pendencies",  label: "Risk Register",    icon: "⚠", hint: "Tech debt & blockers",         minRole: "admin" },
      { href: "/studio/bms/admin",       label: "Super Admin",      icon: "⌘", hint: "Platform administration",      minRole: "admin" },
    ],
  },
];

// ── Shell component ───────────────────────────────────────────────────────────

export function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name:     string;
    email:    string;
    role:     string;
    brand:    string;
    avatarHue: number;
  };
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [palette, setPalette]         = useState(false);
  const [q, setQ]                     = useState("");

  // Filter nav by user role
  const filteredNav = useMemo<NavGroup[]>(() =>
    NAV.map(g => ({
      ...g,
      items: g.items.filter(i => !i.minRole || hasRole(user.role, i.minRole)),
    })).filter(g => g.items.length > 0),
    [user.role]
  );

  const allItems = useMemo(() => filteredNav.flatMap(g => g.items), [filteredNav]);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/studio" && pathname.startsWith(href + "/")) ||
    (href !== "/studio" && pathname === href);

  // ⌘K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(v => !v);
      }
      if (e.key === "Escape") { setPalette(false); setSidebarOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(
    () => allItems.filter(i => `${i.label} ${i.hint}`.toLowerCase().includes(q.toLowerCase())),
    [q, allItems],
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const initials = user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden",
      background: "#080D18", color: "#DDE5EF",
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <nav style={{
        width: sidebarOpen ? 220 : 52, flexShrink: 0,
        background: "#0C1425", borderRight: "1px solid #162340",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease",
        overflowX: "hidden", overflowY: "auto",
        zIndex: 40,
      }}>
        {/* Logo / toggle */}
        <button onClick={() => setSidebarOpen(v => !v)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 14px", flexShrink: 0, borderBottom: "1px solid #162340",
        }}>
          <div style={{ width: 24, height: 24, background: "#C9A84C", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 900, color: "#080800", flexShrink: 0 }}>B</div>
          {sidebarOpen && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
              BNLV STUDIO
            </span>
          )}
        </button>

        {/* Nav groups */}
        <div style={{ flex: 1, padding: "8px 0" }}>
          {filteredNav.map(group => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              {sidebarOpen && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7,
                  color: "#4A6080", letterSpacing: "0.16em", textTransform: "uppercase",
                  padding: "6px 14px 3px" }}>
                  {group.title}
                </div>
              )}
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} title={sidebarOpen ? "" : `${item.label} — ${item.hint}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: sidebarOpen ? "7px 14px" : "7px 14px",
                      background: active ? "rgba(201,168,76,0.12)" : "none",
                      borderLeft: active ? "2px solid #C9A84C" : "2px solid transparent",
                      color: active ? "#C9A84C" : "#8DA0B8",
                      textDecoration: "none", fontSize: 12, fontWeight: active ? 600 : 400,
                      whiteSpace: "nowrap", transition: "all 0.12s",
                    }}>
                    <span style={{ fontSize: 13, flexShrink: 0, width: 18, textAlign: "center" }}>
                      {item.icon}
                    </span>
                    {sidebarOpen && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User identity at bottom */}
        <div style={{ borderTop: "1px solid #162340", padding: "10px 12px",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: `hsl(${user.avatarHue}, 60%, 45%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "#fff" }}>
            {initials}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#DDE5EF",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                color: "#C9A84C", letterSpacing: "0.08em" }}>
                {user.role} · {user.brand}
              </div>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={logout} title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#4A6080", fontSize: 14, padding: 2, flexShrink: 0 }}>
              ⏻
            </button>
          )}
        </div>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ height: 44, flexShrink: 0, background: "#0C1425",
          borderBottom: "1px solid #162340", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>

          {/* Breadcrumb from pathname */}
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            color: "#4A6080", letterSpacing: "0.1em" }}>
            {pathname.split("/").filter(Boolean).join(" › ").toUpperCase() || "STUDIO"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* ⌘K shortcut hint */}
            <button onClick={() => setPalette(true)} style={{
              background: "#0F1B30", border: "1px solid #162340", borderRadius: 5,
              padding: "4px 10px", color: "#4A6080",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>⌘K</span>
              <span style={{ color: "#8DA0B8" }}>Search</span>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "auto" }}>
          {children}
        </main>
      </div>

      {/* ── ⌘K COMMAND PALETTE ─────────────────────────────────────────────── */}
      {palette && (
        <div onClick={() => setPalette(false)} style={{
          position: "fixed", inset: 0, background: "rgba(8,13,24,0.85)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          paddingTop: "15vh", zIndex: 100,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 480, background: "#0C1425", border: "1px solid #162340",
            borderRadius: 12, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #162340" }}>
              <span style={{ padding: "12px 14px", color: "#4A6080", fontSize: 14 }}>⌕</span>
              <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search pages…"
                style={{ flex: 1, background: "none", border: "none", outline: "none",
                  padding: "12px 0", color: "#DDE5EF", fontSize: 13,
                  fontFamily: "'Inter', sans-serif" }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                color: "#4A6080", padding: "0 14px" }}>ESC</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {results.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#4A6080",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                  No results for "{q}"
                </div>
              ) : results.map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => { setPalette(false); setQ(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", color: "#8DA0B8", textDecoration: "none",
                    borderBottom: "1px solid #0F1B30", fontSize: 13,
                  }}>
                  <span style={{ width: 20, textAlign: "center", flexShrink: 0,
                    fontSize: 14 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 500, color: "#DDE5EF" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#4A6080" }}>{item.hint}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8, color: "#4A6080" }}>
                    {item.href}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
