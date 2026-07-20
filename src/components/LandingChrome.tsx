"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher, ThemeSwitcher, usePrefs } from "./Preferences";
import { BmsLogo } from "./BmsLogo";

export function LandingHeader() {
  const { t } = usePrefs();
  const pathname = usePathname();

  const pageLinks = [
    { href: "/about", label: t("nav.about") },
    { href: "/careers", label: t("nav.careers") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-sand-50/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-3.5">
        <Link href="/" className="flex shrink-0 items-center transition-opacity hover:opacity-95">
          <BmsLogo variant="header" />
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-500 lg:flex">
          <Link
            href="/home"
            className={pathname === "/home" ? "font-bold text-navy-800 underline underline-offset-8 decoration-maroon-500 decoration-2" : "hover:text-navy-800 transition-colors"}
          >
            {t("nav.home")}
          </Link>
          {pathname === "/" || pathname === "/home" ? (
            <>
              <a href="#platform" className="hover:text-navy-800 transition-colors">{t("nav.platform")}</a>
              <a href="#workflow" className="hover:text-navy-800 transition-colors">{t("nav.workflow")}</a>
              <a href="#schedule" className="hover:text-navy-800 transition-colors">{t("nav.schedule")}</a>
            </>
          ) : (
            <Link href="/#schedule" className="hover:text-navy-800 transition-colors">{t("nav.schedule")}</Link>
          )}
          {pageLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "font-bold text-navy-800 underline underline-offset-8 decoration-maroon-500 decoration-2" : "hover:text-navy-800 transition-colors"}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side: language + aesthetics switchers */}
        <div className="ml-auto flex items-center gap-2.5">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Link
            href="/studio"
            className="hidden rounded-xl bg-gradient-to-r from-navy-800 to-navy-700 px-4 py-2 text-xs font-bold tracking-wide uppercase text-sand-50 shadow-md shadow-navy-900/10 transition-all hover:scale-[1.02] hover:bg-navy-900 md:inline-flex items-center gap-1.5"
          >
            <span>{t("nav.enter")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  const { t } = usePrefs();
  return (
    <footer className="border-t border-sand-200/80 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2 pr-6">
          <BmsLogo variant="footer" />
          <p className="mt-4 max-w-md text-xs leading-relaxed text-slate-500">{t("foot.tag")}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-navy-600">
            <span className="h-1.5 w-1.5 rounded-full bg-jade-500 animate-pulse" />
            <span>True Professional · Bespoke Enterprise Edition</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Studio Platform</div>
          <div className="mt-3 flex flex-col gap-2.5 text-xs font-medium text-slate-600">
            <Link href="/studio" className="hover:text-navy-800 transition-colors">BMS Studio Overview</Link>
            <Link href="/builder" className="hover:text-navy-800 transition-colors">Visual Component Builder</Link>
            <Link href="/ai-engine" className="hover:text-navy-800 transition-colors">Claude Fable 5 AI Engine</Link>
            <Link href="/deployments" className="hover:text-navy-800 transition-colors">CI/CD Deployments</Link>
            <Link href="/observability" className="hover:text-navy-800 transition-colors">SLO Observability</Link>
            <Link href="/audit" className="hover:text-navy-800 transition-colors">Enterprise Readiness Audit</Link>
            <Link href="/app" className="hover:text-navy-800 transition-colors">Market App Parity</Link>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">BNLV Group of Company</div>
          <div className="mt-3 flex flex-col gap-2.5 text-xs font-medium text-slate-600">
            <Link href="/home" className="hover:text-navy-800 transition-colors">{t("nav.home")}</Link>
            <Link href="/about" className="hover:text-navy-800 transition-colors">{t("nav.about")}</Link>
            <Link href="/careers" className="hover:text-navy-800 transition-colors">{t("nav.careers")}</Link>
            <Link href="/#schedule" className="hover:text-navy-800 transition-colors">{t("nav.schedule")}</Link>
            <Link href="/admin" className="hover:text-navy-800 transition-colors">BMS Studio Admin</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-sand-200/80 py-5 bg-sand-50/50 text-center text-[11px] font-medium text-slate-500 flex flex-wrap items-center justify-center gap-2">
        <span>© {new Date().getFullYear()} BMS (Business Management Solutions) · A BNLV Group of Company.</span>
        <span className="text-sand-300">|</span>
        <span className="text-maroon-600 font-semibold">Claude Fable 5 plans, Gemini designs</span>
        <span className="text-sand-300">|</span>
        <span className="text-jade-600 font-semibold">Zero-trust by default</span>
      </div>
    </footer>
  );
}
