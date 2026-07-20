"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Cmd = { label: string; hint: string; href: string; icon: string; keywords: string };

const COMMANDS: Cmd[] = [
  { label: "BMS Home / Landing", hint: "Client request scheduling", href: "/", icon: "⌂", keywords: "home landing schedule request book language theme bms bnlv" },
  { label: "Home Page", hint: "Dedicated /home route (same landing)", href: "/home", icon: "⌂", keywords: "home page dedicated route landing bms bnlv" },
  { label: "About BMS Studio", hint: "BNLV Group mission, values, leadership", href: "/about", icon: "◎", keywords: "about company mission values team leadership bms bnlv" },
  { label: "Careers", hint: "Open roles & applications", href: "/careers", icon: "✦", keywords: "careers jobs roles hiring apply bnlv bms" },
  { label: "BMS Studio Overview", hint: "Architecture & live stats", href: "/studio", icon: "◈", keywords: "overview dashboard stats architecture bms" },
  { label: "Visual Builder", hint: "Drag & drop → React code", href: "/builder", icon: "⬒", keywords: "builder visual components canvas code drag" },
  { label: "AI Routing Engine", hint: "Claude Fable 5 · Gemini 3.5", href: "/ai-engine", icon: "⇄", keywords: "ai routing claude gemini fable flash pipeline tasks" },
  { label: "Deployments", hint: "CI/CD pipeline & rollback", href: "/deployments", icon: "▶", keywords: "deploy cicd pipeline release rollback canary chaos" },
  { label: "Observability", hint: "SLOs, metrics, incidents", href: "/observability", icon: "◉", keywords: "observability metrics slo latency incidents monitoring health" },
  { label: "Developer Platform", hint: "Keys · flags · secrets · webhooks", href: "/services", icon: "⚙", keywords: "api keys feature flags secrets vault webhooks platform services" },
  { label: "Enterprise Audit", hint: "Production readiness & compliance", href: "/audit", icon: "✓", keywords: "audit readiness production compliance enterprise signoff controls" },
  { label: "Market App Parity", hint: "PWA · iOS · Android · Desktop sync", href: "/app", icon: "▰", keywords: "app pwa ios android desktop manifest service worker market ready sync" },
  { label: "BMS Studio Admin", hint: "RBAC · tenants · requests", href: "/admin", icon: "⛨", keywords: "admin rbac users tenants roles audit requests" },
  { label: "Infrastructure", hint: "Terraform & environments", href: "/infrastructure", icon: "▣", keywords: "infrastructure terraform iac environments provision" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = query.trim()
    ? COMMANDS.filter((c) =>
        `${c.label} ${c.keywords}`.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-navy-900/30 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-sand-200 px-4">
          <span className="text-slate-300">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter" && results[active]) go(results[active].href);
            }}
            placeholder="Jump to a module or capability…"
            className="w-full bg-transparent py-3.5 text-sm text-navy-800 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded-md bg-sand-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-400">No matches.</p>
          )}
          {results.map((c, i) => (
            <button
              key={c.href}
              onClick={() => go(c.href)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                i === active ? "bg-navy-50" : ""
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                i === active ? "bg-white text-navy-600 shadow-sm" : "bg-sand-100 text-slate-400"
              }`}>
                {c.icon}
              </span>
              <span>
                <span className="block text-sm font-medium text-navy-800">{c.label}</span>
                <span className="block text-[10px] text-slate-400">{c.hint}</span>
              </span>
              {i === active && <kbd className="ml-auto font-mono text-[10px] text-slate-300">↵</kbd>}
            </button>
          ))}
        </div>
        <div className="border-t border-sand-200 bg-sand-50 px-4 py-2 text-[10px] text-slate-400">
          Navigate with ↑ ↓ · open with <kbd className="font-mono">⌘K</kbd> anywhere in the studio
        </div>
      </div>
    </div>
  );
}
