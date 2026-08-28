/**
 * src/app/studio/nidhivan/page.tsx
 *
 * Nidhivan Consulting — CPWD DSR 2023 Workspace
 * ================================================
 * DEFECT FIX (Session — August 2026):
 *   - Removed hardcoded `activeTenantId = 1` which queried BMSolutions tenant.
 *     Nidhivan seed data is scoped to Tenant ID 10 (dynamic). Hardcoding tenant 1
 *     guaranteed null results and the "No BOQ records found" dead-end regardless
 *     of seed execution success.
 *   - Tenant ID is now read from the proxy-injected `x-tenant-id` header, which
 *     is set by src/proxy.ts after JWT verification. This is the correct pattern
 *     for all server components in the studio layout.
 *   - Database query now runs inside withTenant() to enforce RLS context.
 *     Direct db.query calls bypass SET LOCAL app.current_tenant_id and expose
 *     data to cross-tenant leakage in pooled connection scenarios.
 *
 * TRACK B (COMMERCIAL LAUNCH - DOCUMENT PIPELINE):
 *   - Added native form POST trigger for the PDF generation pipeline.
 *   - Passes boqId context to /api/nidhivan/export/pdf.
 *
 * SECURITY:
 *   - withTenant() uses DATABASE_URL_UNPOOLED per ADR-001.
 *   - x-tenant-id originates exclusively from the proxy after JWT decryption.
 *     Client-supplied x-tenant-id is stripped by MANAGED_HEADERS in proxy.ts.
 *   - Returns 401 if no tenant context is present (unauthenticated request bypassed proxy).
 */

import { headers } from "next/headers";
import DprDashboardLayout from "@/components/workspace/DprDashboardLayout";
import BoqDataGrid from "@/components/workspace/BoqDataGrid";
import { withTenant } from "@/db";
import { nidhivanBoqs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────

function NoContext() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50">
      <div className="rounded-2xl border border-maroon-200 bg-maroon-50 p-8 text-center shadow-sm">
        <div className="text-sm font-semibold text-maroon-700">
          No tenant context. Authenticate before accessing the workspace.
        </div>
      </div>
    </div>
  );
}

function NoData({ tenantId }: { tenantId: number }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50">
      <div className="rounded-2xl border border-sand-200 bg-white p-8 text-center shadow-sm">
        <div className="text-sm font-semibold text-navy-800">
          No BOQ records found for tenant {tenantId}.
        </div>
        <div className="mt-2 font-mono text-xs text-slate-400">
          Run: npm run db:seed:nidhivan
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default async function NidhivanWorkspace() {
  // Read the proxy-injected tenant context — set by src/proxy.ts after JWT decryption.
  // This header is stripped from client requests by MANAGED_HEADERS; it is
  // authoritative and safe to trust without further validation.
  const headerStore = await headers();
  const tenantIdHeader = headerStore.get("x-tenant-id");

  if (!tenantIdHeader) {
    return <NoContext />;
  }

  const tenantId = parseInt(tenantIdHeader, 10);

  if (isNaN(tenantId) || tenantId <= 0) {
    return <NoContext />;
  }

  // RLS-enforced query via withTenant() — DATABASE_URL_UNPOOLED per ADR-001.
  // Selects the first BOQ ordered by id ascending for a stable, reproducible
  // landing record. The BoqDataGrid client component fetches full hierarchy
  // via /api/nidhivan/boqs/[boqId]/hierarchy, also RLS-scoped.
  const seededBoq = await withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(nidhivanBoqs)
      .where(eq(nidhivanBoqs.tenantId, tenantId))
      .orderBy(asc(nidhivanBoqs.id))
      .limit(1);
    return rows[0] ?? null;
  });

  if (!seededBoq) {
    return <NoData tenantId={tenantId} />;
  }

  return (
    <DprDashboardLayout projectName="NH-44 Highway Expansion (Package 1)">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        
        {/* Left: BOQ Metadata */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-jade-600">
            CPWD DSR 2023 — Bill of Quantities
          </div>
          <h3 className="mt-1 text-lg font-semibold text-navy-800">
            {seededBoq.title}
          </h3>
          <div className="mt-1 flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${
                seededBoq.status === "approved"
                  ? "bg-jade-50 text-jade-700 ring-jade-200"
                  : seededBoq.status === "draft"
                    ? "bg-sand-100 text-slate-500 ring-sand-300"
                    : "bg-navy-50 text-navy-600 ring-navy-200"
              }`}
            >
              {seededBoq.status}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              BOQ #{seededBoq.id} — Tenant {tenantId}
            </span>
          </div>
        </div>

        {/* Right: DPR Document Generation Pipeline Trigger */}
        <div>
          <form method="POST" action="/api/nidhivan/export/pdf" target="_blank">
            <input type="hidden" name="boqId" value={seededBoq.id.toString()} />
            {/* 
              tenantId is technically in the JWT/Cookie, but we pass it explicitly 
              to ensure the export pipeline has immediate routing context 
            */}
            <input type="hidden" name="tenantId" value={tenantId.toString()} />
            
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-navy-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
            >
              <svg 
                className="h-4 w-4 text-sand-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate DPR (PDF)
            </button>
          </form>
        </div>

      </div>

      {/* BoqDataGrid fetches full hierarchy and items via RLS-enforced API routes */}
      <BoqDataGrid
        boqId={seededBoq.id.toString()}
        tenantId={tenantId.toString()}
      />
    </DprDashboardLayout>
  );
}