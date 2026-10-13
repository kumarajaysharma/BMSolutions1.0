"use client";

/**
 * StudioShell — Root layout wrapper for non-studio, non-landing routes.
 *
 * Route dispatch:
 *   /studio/*  → transparent pass-through; Shell (studio/layout.tsx) owns
 *                the full frame (sidebar, topbar, ⌘K palette, user identity).
 *   landing    → minimal public wrapper (amber background, no sidebar).
 *   other      → legacy internal wrapper with Sidebar + CommandPalette.
 *                (Retained for any non-studio authenticated routes.)
 */

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

export default function StudioShell({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  const pathname = usePathname();

  // Studio routes — Shell (src/app/studio/layout.tsx) owns the full frame.
  // Return children directly; do NOT add a second sidebar or command palette.
  const isStudio = pathname === "/studio" || pathname.startsWith("/studio/");
  if (isStudio) {
    return <>{children}</>;
  }

  // Public / landing routes — no nav chrome.
  const LANDING_ROUTES = [
    "/", "/home", "/about", "/contact", "/careers",
    "/login", "/403", "/companies",
    "/bms", "/nidhivan", "/limsy", "/vihang",
  ];
  const isLanding = LANDING_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  if (isLanding) {
    return (
      <main className="min-h-screen bg-amber-50 flex flex-col selection:bg-amber-200">
        <CommandPalette />
        {children}
      </main>
    );
  }

  // Legacy authenticated routes (e.g. /builder, /services, /admin).
  // Still served by the old Sidebar until those routes are migrated to /studio/*.
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 selection:bg-amber-200">
      <CommandPalette />
      {header}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto bg-amber-50 rounded-tl-2xl border-t border-l border-amber-900/30 shadow-[inset_0_4px_6px_rgba(0,0,0,0.1)]">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}