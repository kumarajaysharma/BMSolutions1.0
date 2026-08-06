// File: src/components/workspace/BoqDataGrid.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { nidhivanBoqItems } from '@/db/schema';

type BoqItemType = typeof nidhivanBoqItems.$inferSelect;

// Local group interface matching the flat-to-grouped data structure
interface BoqGroup {
  id: string | number;
  name: string;
  sectionCode?: string;
  items: BoqItemType[];
  subCategories?: BoqGroup[];
}

interface BoqDataGridProps {
  boqId: string;
  tenantId: string;
}

export default function BoqDataGrid({ boqId, tenantId }: BoqDataGridProps) {
  const [data, setData] = useState<BoqGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoqData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/nidhivan/boqs/${boqId}/hierarchy`, {
        headers: {
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch BOQ data: ${response.status}`);
      }
      
      const json = await response.json();
      const rawItems = Array.isArray(json.data) ? json.data : [];
      
      const groupedMap = new Map<string, BoqGroup>();
      
      rawItems.forEach((item: BoqItemType & { isSectionHeader?: boolean; sectionCode?: string; description?: string }) => {
        const secCode = item.sectionCode || 'GENERAL';
        if (!groupedMap.has(secCode)) {
          groupedMap.set(secCode, {
            id: secCode,
            name: item.isSectionHeader ? (item.description || `Section ${secCode}`) : `Section ${secCode}`,
            sectionCode: secCode,
            items: [],
            subCategories: []
          });
        }
        const group = groupedMap.get(secCode)!;
        if (item.isSectionHeader) {
          group.name = item.description || group.name;
        } else {
          group.items.push(item);
        }
      });

      const structuredData = Array.from(groupedMap.values());
      setData(structuredData.length > 0 ? structuredData : [{ id: 1, name: 'General Execution Items', items: rawItems }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [boqId, tenantId]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (isMounted) {
        await fetchBoqData();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchBoqData]);

  if (isLoading) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        <p className="text-sm font-medium text-slate-500">Loading Cost Breakdown Structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold">Data Retrieval Error</h3>
        </div>
        <p className="mb-4 ml-8 text-sm text-red-700">{error}</p>
        <button 
          onClick={fetchBoqData}
          className="ml-8 rounded border border-red-200 bg-red-100 px-4 py-2 text-sm font-medium text-red-900 transition-colors hover:bg-red-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 bg-slate-50 px-6 py-4">
        <h3 className="font-semibold text-slate-800">Bill of Quantities (Cost Breakdown)</h3>
        <span className="rounded bg-stone-200 px-2 py-1 text-xs font-medium text-slate-600">
          Total Items: {data.reduce((acc, cat) => acc + cat.items.length, 0)}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-24 px-6 py-3 font-medium">Item Code</th>
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
                  <p className="text-xs">Import from Schedule of Rates or add manual items to begin estimation.</p>
                </td>
              </tr>
            ) : (
              data.map((category) => (
                <CategoryRow key={category.id} category={category} depth={0} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({ category, depth }: { category: BoqGroup; depth: number }) {
  const paddingLeft = `${depth * 1.75 + 1.5}rem`;

  return (
    <>
      <tr className="border-y border-stone-200 bg-slate-50/80 transition-colors hover:bg-slate-50">
        <td colSpan={6} className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-800" style={{ paddingLeft }}>
          {category.name}
        </td>
      </tr>
      
      {category.items.map((item: any) => (
        <tr key={item.id} className="group transition-colors hover:bg-stone-50">
          <td className="align-top px-6 py-3 pt-4 font-mono text-xs text-slate-500" style={{ paddingLeft: `calc(${paddingLeft} + 1rem)` }}>
            {item.itemNumber ?? item.itemCode ?? '-'}
          </td>
          <td className="align-top px-6 py-3">
            <p className="line-clamp-3 leading-relaxed text-slate-700 transition-all duration-200 group-hover:line-clamp-none">
              {item.description}
            </p>
            {item.rateRef && (
              <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                {item.rateRef}
              </span>
            )}
          </td>
          <td className="align-top px-6 py-3 pt-4 font-medium text-slate-500">
            {item.unit || '-'}
          </td>
          <td className="align-top px-6 py-3 pt-4 text-right tabular-nums">
            {Number(item.quantity || 0).toFixed(3)}
          </td>
          <td className="align-top px-6 py-3 pt-4 text-right tabular-nums">
            {(Number(item.unitRatePaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
          <td className="align-top px-6 py-3 pt-4 text-right font-medium tabular-nums text-slate-800">
            {(Number(item.amountPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      ))}

      {category.subCategories?.map((subCat) => (
        <CategoryRow key={subCat.id} category={subCat} depth={depth + 1} />
      ))}
    </>
  );
}