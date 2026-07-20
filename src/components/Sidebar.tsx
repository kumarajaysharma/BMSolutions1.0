"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BmsLogo } from "./BmsLogo";

const NAV = [
  { href: "/studio", label: "Studio Overview", icon: "◈", hint: "BMS System architecture" },
  { href: "/builder", label: "Visual Builder", icon: "⬒", hint: "Drag & drop → React code" },
  { href: "/ai-engine", label: "AI Routing Engine", icon: "⇄", hint: "Claude Fable 5 · Gemini 3.5" },
  { href: "/deployments", label: "Deployments", icon: "▶", hint: "CI/CD · canary · rollback" },
  { href: "/observability", label: "Observability", icon: "◉", hint: "SLOs · metrics · incidents" },
  { href: "/services", label: "Developer Platform", icon: "⚙", hint: "Keys · flags · secrets" },
  { href: "/audit", label: "Enterprise Audit", icon: "✓", hint: "Readiness · compliance" },
  { href: "/app", label: "Market App Parity", icon: "▰", hint: "PWA · iOS · Android" },
  { href: "/admin", label: "Studio Admin", icon: "⛨", hint: "RBAC · multi-tenant" },
  { href: "/infrastructure", label: "Infrastructure", icon: "▣", hint: "IaC · environments" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-66 shrink-0 flex-col border-r border-sand-200/80 bg-white/80 backdrop-blur-md shadow-xs">
      <div className="border-b border-sand-200/80 px-5 py-4">
        <Link href="/" className="block transition-opacity hover:opacity-95">
          <BmsLogo variant="sidebar" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2.5 transition-all duration-150 ${
                active
                  ? "bg-gradient-to-r from-navy-800 to-navy-700 text-sand-50 shadow-md shadow-navy-900/10 font-semibold"
                  : "text-slate-600 hover:bg-sand-100/80 hover:text-navy-800"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-medium">
                <span className={`w-4 text-center text-sm ${active ? "text-maroon-300" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                <span className={active ? "font-bold tracking-tight" : ""}>{item.label}</span>
              </div>
              <div className={`pl-[26px] text-[10px] ${active ? "text-navy-100" : "text-slate-400"}`}>{item.hint}</div>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2.5 border-t border-sand-200/80 p-4 bg-sand-50/40">
        <div className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-2xs">
          <span>Command Palette</span>
          <kbd className="rounded-md bg-sand-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-navy-700 ring-1 ring-sand-300">⌘K</kbd>
        </div>
        <Link
          href="/"
          className="block rounded-xl border border-sand-200 bg-white px-3 py-2 text-center text-xs font-bold text-navy-700 transition hover:border-navy-300 hover:bg-navy-50 shadow-2xs"
        >
          ← Back to BMS Home
        </Link>
        <div className="rounded-xl bg-gradient-to-br from-jade-50 to-jade-100/60 p-3 text-[11px] leading-5 text-jade-800 ring-1 ring-inset ring-jade-200/80 shadow-2xs">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-jade-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-jade-500" />
            <span>Zero-Trust AI Gate</span>
          </div>
          <div className="text-[10px] text-jade-700 font-medium">
            Claude Fable 5 & Gemini code verified before git commit.
          </div>
        </div>
      </div>
    </aside>
  );
}
