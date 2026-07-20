"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LANGUAGES, translate, type Lang } from "@/lib/i18n";

// ── Aesthetic themes ───────────────────────────────────────────────
// "Serene Sand" is the saved default. Each theme re-tints the global
// CSS variable palette, so the entire studio transforms instantly.

export const THEMES = [
  { id: "serene-sand", label: "Serene Sand", swatch: ["#fdfbf7", "#3a5680", "#8c4457", "#357257"] },
  { id: "royal-maroon", label: "Royal Maroon", swatch: ["#fdf7f7", "#833f55", "#a05a6b", "#357257"] },
  { id: "forest-jade", label: "Forest Jade", swatch: ["#f7fbf8", "#2f6b52", "#8c4457", "#46896c"] },
  { id: "navy-blue", label: "Navy Blue", swatch: ["#f7f9fc", "#2f4d8a", "#51619e", "#357257"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

type Prefs = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  t: (key: string) => string;
};

const PrefsContext = createContext<Prefs>({
  lang: "en",
  setLang: () => {},
  theme: "serene-sand",
  setTheme: () => {},
  t: (k) => translate("en", k),
});

export function usePrefs() {
  return useContext(PrefsContext);
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<ThemeId>("serene-sand");

  useEffect(() => {
    const savedLang = localStorage.getItem("forge-lang") as Lang | null;
    const savedTheme = localStorage.getItem("forge-theme") as ThemeId | null;
    if (savedLang && LANGUAGES.some((l) => l.code === savedLang)) setLangState(savedLang);
    if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("forge-lang", l);
  }, []);

  const setTheme = useCallback((th: ThemeId) => {
    setThemeState(th);
    localStorage.setItem("forge-theme", th);
    document.documentElement.dataset.theme = th;
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <PrefsContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </PrefsContext.Provider>
  );
}

// ── Dropdown primitives ────────────────────────────────────────────

function useClickOutside(close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [close]);
  return ref;
}

export function LanguageSwitcher() {
  const { lang, setLang } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white/80 px-3 py-2 text-xs font-medium text-navy-700 shadow-sm transition hover:border-navy-200"
        aria-label="Change language"
      >
        <span className="text-sm leading-none">🌐</span>
        {current?.native}
        <span className="text-[9px] text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-sand-200 bg-white shadow-xl">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition ${
                lang === l.code ? "bg-navy-50 font-semibold text-navy-700" : "text-slate-600 hover:bg-sand-50"
              }`}
            >
              <span>{l.native}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">{l.code}</span>
            </button>
          ))}
          <div className="border-t border-sand-200 bg-sand-50 px-3.5 py-1.5 text-[9px] text-slate-400">
            Default: English
          </div>
        </div>
      )}
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const current = THEMES.find((th) => th.id === theme);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white/80 px-3 py-2 text-xs font-medium text-navy-700 shadow-sm transition hover:border-navy-200"
        aria-label="Change aesthetic theme"
      >
        <span className="flex -space-x-1">
          {current?.swatch.slice(1).map((c) => (
            <span key={c} className="h-3 w-3 rounded-full ring-1 ring-white" style={{ background: c }} />
          ))}
        </span>
        {current?.label}
        <span className="text-[9px] text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-sand-200 bg-white shadow-xl">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => { setTheme(th.id); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs transition ${
                theme === th.id ? "bg-navy-50 font-semibold text-navy-700" : "text-slate-600 hover:bg-sand-50"
              }`}
            >
              <span className="flex -space-x-1">
                {th.swatch.map((c) => (
                  <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-white" style={{ background: c }} />
                ))}
              </span>
              <span className="flex-1">{th.label}</span>
              {th.id === "serene-sand" && (
                <span className="rounded-full bg-sand-100 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                  default
                </span>
              )}
              {theme === th.id && <span className="text-jade-600">✓</span>}
            </button>
          ))}
          <div className="border-t border-sand-200 bg-sand-50 px-3.5 py-1.5 text-[9px] text-slate-400">
            Saved automatically · applies studio-wide
          </div>
        </div>
      )}
    </div>
  );
}
