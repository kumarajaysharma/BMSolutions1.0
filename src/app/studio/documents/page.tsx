/**
 * src/app/studio/documents/page.tsx
 * BMS Ops — Document Vault
 * RSC: lists bms_documents for the tenant.
 */
import { headers }    from "next/headers";
import { withTenant } from "@/db";
import { bmsDocuments } from "@/db/schema";
import { eq, desc }   from "drizzle-orm";
import { FileText, BookMarked, Shield, Layout, BarChart2, FileCode } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_CONFIG: Record<string, { color: string; icon: typeof FileText }> = {
  "Playbook":       { color: "bg-indigo-50 text-indigo-700",  icon: BookMarked },
  "Technical Guide":{ color: "bg-blue-50   text-blue-700",    icon: FileCode },
  "Standard":       { color: "bg-amber-50  text-amber-700",   icon: Shield },
  "Policy":         { color: "bg-red-50    text-red-700",     icon: Shield },
  "Template":       { color: "bg-teal-50   text-teal-700",    icon: Layout },
  "Report":         { color: "bg-violet-50 text-violet-700",  icon: BarChart2 },
};

export default async function DocumentsPage() {
  const headersList = await headers();
  const tenantId    = Number(headersList.get("x-tenant-id") ?? 10);

  const documents = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsDocuments)
      .where(eq(bmsDocuments.tenantId, tenantId))
      .orderBy(desc(bmsDocuments.updatedAt))
  ).catch(() => []);

  // Count by type
    const typeCounts = documents.reduce((acc: Record<string, number>, d: any) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPages = documents.reduce((s: number, d: any) => s + (d.pages ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              Document Vault
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Knowledge Repository</h1>
            <p className="mt-2 text-sm text-white/80">
              Playbooks, standards, technical guides, and policies that govern BNLV platform development.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-3xl font-bold">{documents.length}</span>
            <span className="text-xs text-white/70">{totalPages} total pages</span>
          </div>
        </div>
      </div>

      {/* Type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(typeCounts).map(([type, count]) => {
            const tc = TYPE_CONFIG[type] ?? { color: "bg-slate-100 text-slate-600", icon: FileText };
            const Icon = tc.icon;
            return (
              <div key={type} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${tc.color}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="text-base font-bold text-navy-800">{Number(count)}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{type}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Grid */}
      <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-navy-800 mb-4">All Documents</h2>

        {documents.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">No documents found.</p>
            <p className="mt-1 text-xs text-slate-400">
              Seed data: <code className="font-mono">npx tsx src/db/seed-bms-academy.ts</code>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d: any) => {
              const tc = TYPE_CONFIG[d.type] ?? { color: "bg-slate-100 text-slate-600", icon: FileText };
              const Icon = tc.icon;
              return (
                <div key={d.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`rounded-xl p-2.5 ${tc.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tc.color}`}>
                        {d.type}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">{d.version}</span>
                    </div>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-navy-800 leading-snug">{d.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 flex-1">{d.description}</p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{d.pages} pages</span>
                    <span>{d.owner}</span>
                    <span className="font-mono">{d.code}</span>
                  </div>

                  {(d.sharedWith ?? []).length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-400">
                      Shared with: {d.sharedWith.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
