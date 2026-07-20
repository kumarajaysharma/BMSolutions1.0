"use client"; // This makes it a Client Component

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

export default function StudioShell({ 
  children, 
  header 
}: { 
  children: React.ReactNode; 
  header?: React.ReactNode; // Accept the header as a prop
}) {
  const pathname = usePathname();

  const LANDING_ROUTES = [
    "/", "/home", "/about", "/contact", "/careers", "/login", "/403", "/companies", "/bms", "/nidhivan", "/limsy", "/vihang"
  ];
  
  const isLanding = LANDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isLanding) {
    return (
      <main className="min-h-screen bg-amber-50 flex flex-col selection:bg-amber-200">
        <CommandPalette />
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 selection:bg-amber-200">
      <CommandPalette />
      
      {/* Render the header passed as a prop */}
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