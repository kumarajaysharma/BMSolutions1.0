/**
 * src/components/workspace/BoqDataGrid.tsx
 *
 * Nidhivan Consulting — BOQ Data Grid (Cost Breakdown Structure)
 * ============================================================
 * PRODUCTION FIXES (Phase C launch):
 *
 *  SEC-001  REMOVED `x-tenant-id` from client fetch headers.
 *           The Zero Trust middleware (src/proxy.ts Step 2) strips ALL
 *           client-supplied injected headers and re-injects them from the
 *           verified JWT. Sending it from the client is a Zero Trust violation:
 *           even if the middleware overwrites it today, any future bypass of
 *           the middleware chain (health checks, route-specific exclusions)
 *           would make the client-supplied value authoritative. The `tenantId`
 *           prop is retained for display/parent-component use only.
 *
 *  TYPE-001 REMOVED `item: any` cast in CategoryRow — replaced with the
 *           Drizzle-inferred `BoqItemType`. The schema confirms `sectionCode`,
 *           `isSectionHeader`, and `description` are actual columns on
 *           `nidhivan_boq_items`; the `& { isSectionHeader?: boolean; ... }`
 *           augmentation was therefore redundant and masked type errors.
 *
 *  TYPE-002 REMOVED dead `item.itemCode` path. `nidhivan_boq_items` has
 *           `item_number` (integer), not `item_code`. The fallback
 *           `?? item.itemCode ?? '-'` evaluated `item.itemCode` as `undefined`
 *           on every row; this is now `item.itemNumber?.toString() ?? '-'`.
 *
 *  PERF-001 REPLACED `isMounted` pattern with AbortController + useRef.
 *           The `isMounted` flag prevents `setState` but does NOT cancel the
 *           in-flight network request. Under fast tab switches or boqId changes,
 *           the old pattern leaves N dangling requests. AbortController
 *           terminates the network request on unmount or prop change.
 *
 *  PERF-002 Removed `tenantId` from the `useCallback` dependency array.
 *           `tenantId` was not used in the fetch (middleware provides it from
 *           JWT). Re-creating `fetchBoqData` on every tenantId prop change was
 *           triggering redundant network calls.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { nidhivanBoqItems } from '@/db/schema';

// ── Type Definitions ────────────────────────────────────────────────────────

/** Full Drizzle-inferred row type — covers all columns including sectionCode */
type BoqItemType = typeof nidhivanBoqItems.$inferSelect;

interface BoqGroup {
  id: string | number;
  name: string;
  sectionCode: string;
  items: BoqItemType[];
  subCategories: BoqGroup[];
}

interface BoqDataGridProps {
  boqId: string;
  /**
   * tenantId is for display / parent-component orchestration only.
   * It MUST NOT be sent as a request header — the Zero Trust middleware
   * injects x-tenant-id from the verified JWT (ADR-001).
   */
  tenantId: string;
}

// ── Precision-safe BigInt conversion ────────────────────────────────────────
// unit_rate_paise and amount_paise are bigint in the DB. Drizzle serializes
// them as JS `number` when mode: 'number' is used. For CPWD projects exceeding
// ₹90,000 Cr per line item (> Number.MAX_SAFE_INTEGER paise), switch to
// BigInt mode and use toLocaleString with BigInt-aware formatting.

function paiseToRupees(paiseValue: number | bigint | null | undefined): string {
  if (paiseValue == null) return '0.00';
  const asNumber = typeof paiseValue === 'bigint' ? Number(paiseValue) : paiseValue;
  if (!Number.isSafeInteger(asNumber) && typeof paiseValue !== 'bigint') {
    console.warn('[BoqDataGrid] Amount exceeds MAX_SAFE_INTEGER — precision may be lost. Migrate to mode: "bigint".');
  }
  return (asNumber / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function BoqDataGrid({ boqId, tenantId }: BoqDataGridProps) {
  const [data, setData] = useState<BoqGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // tenantId is intentionally not in the dependency array — not used in fetch
  const fetchBoqData = useCallback(async () => {
    // Cancel any prior in-flight request before starting a new one
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // SEC-001: No x-tenant-id header — middleware injects it from JWT
      const response = await fetch(`/api/nidhivan/boqs/${boqId}/hierarchy`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errorData.error ?? `HTTP ${response.status}`);
      }

      const rawItems: BoqItemType[] = await response.json();
      const itemsArray = Array.isArray(rawItems) ? rawItems : [];

      // Group flat items into sections by sectionCode
      const groupedMap = new Map<string, BoqGroup>();

      for (const item of itemsArray) {
        const secCode = item.sectionCode ?? 'GENERAL';

        if (!groupedMap.has(secCode)) {
          groupedMap.set(secCode, {
            id: secCode,
            name: `Section ${secCode}`,
            sectionCode: secCode,
            items: [],
            subCategories: [],
          });
        }

        const group = groupedMap.get(secCode)!;

        if (item.isSectionHeader) {
          // Section header row sets the display name for this code
          group.name = item.description ?? group.name;
        } else {
          group.items.push(item);
        }
      }

      const structuredData = Array.from(groupedMap.values());

      // Fallback: no section codes in data — render as a single flat group
      if (!controller.signal.aborted) {
        setData(
          structuredData.length > 0
            ? structuredData
            : [{ id: 'GENERAL', name: 'General Execution Items', sectionCode: 'GENERAL',
                 items: itemsArray.filter((i) => !i.isSectionHeader),
                 subCategories: [] }]
        );
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return; // Suppress intentional abort

      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'An unknown network error occurred.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [boqId]); // Only boqId triggers re-fetch — tenantId is middleware-resolved

  useEffect(() => {
    fetchBoqData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchBoqData]);

  // ── Render States ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-stone-200 bg-white shadow-sm mt-8">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <p className="text-sm font-medium text-slate-500">Loading Cost Breakdown Structure…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm mt-8">
        <div className="mb-2 flex items-center gap-3">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold">Data Retrieval Error</h3>
        </div>
        <p className="mb-4 ml-8 text-sm text-red-700">{error}</p>
        <button
          onClick={fetchBoqData}
          className="ml-8 rounded border border-red-200 bg-red-100 px-4 py-2 text-sm font-medium
                     text-red-900 transition-colors hover:bg-red-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Grand total across all sections — section-header rows excluded (isSectionHeader = true)
  const grandTotalPaise = data.reduce(
    (acc, cat) => acc + cat.items.reduce((sum, item) => sum + Number(item.amountPaise ?? 0), 0),
    0
  );

  const totalItemCount = data.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm mt-8">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-slate-50 px-6 py-4">
        <h3 className="font-semibold text-slate-800">Bill of Quantities (Cost Breakdown)</h3>
        <div className="flex items-center gap-3">
          {totalItemCount > 500 && (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              Large BOQ ({totalItemCount} items) — scroll to navigate
            </span>
          )}
          <span className="rounded bg-stone-200 px-2 py-1 text-xs font-medium text-slate-600">
            {totalItemCount} items
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-24 px-6 py-3 font-medium">Item No.</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="w-24 px-6 py-3 font-medium">UOM</th>
              <th className="w-32 px-6 py-3 text-right font-medium">Quantity</th>
              <th className="w-32 px-6 py-3 text-right font-medium">Rate (₹)</th>
              <th className="w-40 px-6 py-3 text-right font-medium">Amount (₹)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="bg-stone-50/30 px-6 py-12 text-center text-slate-400">
                  <p className="mb-1 font-medium text-slate-500">No execution items found.</p>
                  <p className="text-xs">
                    Import from Schedule of Rates or add manual items to begin estimation.
                  </p>
                </td>
              </tr>
            ) : (
              data.map((category) => (
                <CategoryRow key={category.sectionCode} category={category} depth={0} />
              ))
            )}
          </tbody>

          {data.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5}
                  className="px-6 py-4 text-right font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Grand Total CAPEX
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-900">
                  ₹{paiseToRupees(grandTotalPaise)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ── Recursive Section Renderer ───────────────────────────────────────────────

function CategoryRow({ category, depth }: { category: BoqGroup; depth: number }) {
  const paddingLeft = `${depth * 1.75 + 1.5}rem`;

  return (
    <>
      {/* Section header row */}
      <tr className="border-y border-stone-200 bg-slate-50/80">
        <td
          colSpan={6}
          className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-800"
          style={{ paddingLeft }}
        >
          {category.sectionCode !== 'GENERAL' && (
            <span className="mr-2 font-mono text-slate-400">{category.sectionCode}</span>
          )}
          {category.name}
        </td>
      </tr>

      {/* Item rows — TYPE-001: item is BoqItemType, no `any` */}
      {category.items.map((item: BoqItemType) => (
        <tr key={item.id} className="group transition-colors hover:bg-stone-50">
          {/* TYPE-002: itemCode does not exist in schema — use itemNumber only */}
          <td
            className="align-top px-6 py-3 pt-4 font-mono text-xs text-slate-500"
            style={{ paddingLeft: `calc(${paddingLeft} + 1rem)` }}
          >
            {item.itemNumber?.toString() ?? '-'}
          </td>

          <td className="align-top px-6 py-3">
            <p className="line-clamp-3 leading-relaxed text-slate-700 transition-all
                          duration-200 group-hover:line-clamp-none">
              {item.description}
            </p>
            {item.rateRef && (
              <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5
                               text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                {item.rateRef}
              </span>
            )}
          </td>

          <td className="align-top px-6 py-3 pt-4 font-medium text-slate-500">
            {item.unit ?? '-'}
          </td>

          <td className="align-top px-6 py-3 pt-4 text-right tabular-nums">
            {Number(item.quantity ?? 0).toFixed(3)}
          </td>

          <td className="align-top px-6 py-3 pt-4 text-right tabular-nums">
            {paiseToRupees(item.unitRatePaise)}
          </td>

          <td className="align-top px-6 py-3 pt-4 text-right font-medium tabular-nums text-slate-800">
            {paiseToRupees(item.amountPaise)}
          </td>
        </tr>
      ))}

      {/* Recursive subcategories */}
      {category.subCategories.map((subCat) => (
        <CategoryRow key={subCat.sectionCode} category={subCat} depth={depth + 1} />
      ))}
    </>
  );
}
