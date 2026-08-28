/**
 * src/components/workspace/DprDashboardLayout.tsx
 *
 * Nidhivan Consulting — Corporate Dashboard Shell
 * ==========================================================
 * Provides the MBB-grade structural wrapper and navigation for 
 * the financial workspace.
 */

import React, { ReactNode } from 'react';

interface DprDashboardLayoutProps {
  children: ReactNode;
  projectName: string;
}

export default function DprDashboardLayout({ children, projectName }: DprDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-bold text-white shadow-inner">
              N
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">
              Nidhivan Consulting <span className="ml-2 font-normal text-slate-400">| DPR Workspace</span>
            </h1>
          </div>
          <nav className="flex gap-6">
            <button className="border-b-2 border-slate-900 pb-1 text-sm font-medium text-slate-900 transition-colors">
              Projects
            </button>
            <button className="pb-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              Schedule of Rates
            </button>
            <button className="pb-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 border-b border-stone-200 pb-6">
          <h2 className="text-3xl font-bold text-slate-900">{projectName}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage Detailed Project Reports, financial feasibility, and hierarchical BOQ estimations.
          </p>
        </div>
        
        {/* Child content (like the BOQ grid and working Export buttons from page.tsx) goes here */}
        {children}
      </main>
    </div>
  );
}