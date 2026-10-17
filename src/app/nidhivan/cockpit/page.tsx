/**
 * src/app/nidhivan/cockpit/page.tsx
 *
 * Aiyyo-Nidhi Cockpit — Operational Dashboard
 * =============================================
 * Real-time view of the Nidhivan financial workflow engine:
 *
 *   • Workflow Status Summary  — RA Bill status distribution (paise totals)
 *   • Approval Queue           — Bills pending L1/L2/L3/L4 action
 *   • VANTAI Gate Status       — Live compliance gate registry
 *   • Advance Tracker          — Project advances, GST exposure, recovery
 *
 * Client component — fetches from Phase 3 API routes at runtime.
 * All monetary display is paise → ₹ (÷100, toLocaleString en-IN).
 *
 * Route: /nidhivan/cockpit
 * Minimum role: developer (reads only — no mutation from this page).
 *
 * BNLV Tenant: nidhivan (tenantId = 2)
 * ADR-006: AI routes — Anthropic ONLY (no calls to AI from this page).
 */

"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type BillStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_CHECK"
  | "CERTIFIED"
  | "APPROVED_FOR_PAYMENT"
  | "PAYMENT_INITIATED"
  | "PAID"
  | "REJECTED"
  | "CANCELLED"
  | "ON_HOLD";

type AdvanceStatus =
  | "SANCTIONED"
  | "DISBURSED"
  | "PARTIALLY_RECOVERED"
  | "FULLY_RECOVERED"
  | "WRITTEN_OFF";

interface RaBill {
  id: number;
  billNumber: string;
  status: BillStatus;
  grossAmountPaise: number;
  taxableAmountPaise: number;
  cgstAmountPaise: number;
  sgstAmountPaise: number;
  igstAmountPaise: number;
  tds194cAmountPaise: number;
  netPayablePaise: number;
  billDate: string;
  projectId: number | null;
  vtN002GatePassed: boolean;
  eInvoiceIrn: string | null;
  createdAt: string;
}

interface ProjectAdvance {
  id: number;
  projectId: number;
  advanceType: "MOBILISATION" | "SECURED_MATERIAL";
  status: AdvanceStatus;
  advanceAmountPaise: number;
  recoveredAmountPaise: number;
  cgstOnAdvancePaise: number;
  sgstOnAdvancePaise: number;
  igstOnAdvancePaise: number;
  contractorEntityId: number;
  createdAt: string;
}

interface VantaiGateRow {
  code: string;
  name: string;
  description: string;
  status: "ACTIVE" | "PENDING_REVIEW";
  lastTriggered?: string;
}

interface StatusBucket {
  status: BillStatus;
  count: number;
  totalPaise: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Convert paise integer to formatted INR string */
function inr(paise: number | undefined | null): string {
  if (paise === undefined || paise === null) return "—";
  return "₹" + (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const STATUS_LABELS: Record<BillStatus, string> = {
  DRAFT:                "Draft",
  SUBMITTED:            "Submitted",
  UNDER_CHECK:          "Under Check",
  CERTIFIED:            "Certified",
  APPROVED_FOR_PAYMENT: "Approved",
  PAYMENT_INITIATED:    "Payment Initiated",
  PAID:                 "Paid",
  REJECTED:             "Rejected",
  CANCELLED:            "Cancelled",
  ON_HOLD:              "On Hold",
};

const STATUS_BADGE: Record<BillStatus, string> = {
  DRAFT:                "bg-sand-200 text-slate-600",
  SUBMITTED:            "bg-navy-100 text-navy-700",
  UNDER_CHECK:          "bg-amber-100 text-amber-700",
  CERTIFIED:            "bg-jade-100 text-jade-700",
  APPROVED_FOR_PAYMENT: "bg-jade-200 text-jade-800",
  PAYMENT_INITIATED:    "bg-navy-200 text-navy-800",
  PAID:                 "bg-jade-500 text-white",
  REJECTED:             "bg-maroon-100 text-maroon-700",
  CANCELLED:            "bg-sand-300 text-slate-500",
  ON_HOLD:              "bg-amber-200 text-amber-800",
};

const QUEUE_STATUSES = new Set<BillStatus>(["SUBMITTED", "UNDER_CHECK", "CERTIFIED"]);

const VANTAI_GATE_REGISTRY: VantaiGateRow[] = [
  {
    code:        "VT-N-001",
    name:        "DPDP DPA Gate",
    description: "DPDP Act 2023 S.4(1)(b) — Verifies Data Protection Agreement executed before processing personal data (PAN, bank details).",
    status:      "ACTIVE",
  },
  {
    code:        "VT-N-002",
    name:        "TDS 194C Human Gate",
    description: "Mandates CA / authorised-signatory review of TDS 194C deduction computation before RA Bill payment dispatch.",
    status:      "ACTIVE",
  },
  {
    code:        "VT-N-003",
    name:        "GST e-Invoice Gate",
    description: "Blocks payment for bills ≥ ₹5 Cr until IRN from NIC IRP is recorded. CGST Rule 48(4).",
    status:      "ACTIVE",
  },
  {
    code:        "VT-N-004",
    name:        "Inter-Company Consolidation Gate",
    description: "Requires BNLV Group consolidation officer acknowledgement before posting to inter-company ledger accounts. Phase 4: full webhook.",
    status:      "PENDING_REVIEW",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function NidhivanCockpit() {
  const [bills,      setBills]      = useState<RaBill[]>([]);
  const [advances,   setAdvances]   = useState<ProjectAdvance[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsRes, advancesRes] = await Promise.all([
        fetch("/api/nidhivan/ra-bills"),
        fetch("/api/nidhivan/advances"),
      ]);

      if (!billsRes.ok)    throw new Error(`RA Bills API: ${billsRes.status}`);
      if (!advancesRes.ok) throw new Error(`Advances API: ${advancesRes.status}`);

      const billsJson    = await billsRes.json();
      const advancesJson = await advancesRes.json();

      setBills(billsJson.data   ?? []);
      setAdvances(advancesJson.data ?? []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cockpit data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const statusBuckets = (() => {
    const map = new Map<BillStatus, StatusBucket>();
    for (const bill of bills) {
      const existing = map.get(bill.status);
      if (existing) {
        existing.count++;
        existing.totalPaise += Number(bill.grossAmountPaise ?? 0);
      } else {
        map.set(bill.status, {
          status:     bill.status,
          count:      1,
          totalPaise: Number(bill.grossAmountPaise ?? 0),
        });
      }
    }
    return [...map.values()].sort((a, b) => b.totalPaise - a.totalPaise);
  })();

  const approvalQueue  = bills.filter((b) => QUEUE_STATUSES.has(b.status));

  const totalGstExposurePaise = advances.reduce((s, a) => {
    const gst = Number(a.cgstOnAdvancePaise ?? 0)
              + Number(a.sgstOnAdvancePaise ?? 0)
              + Number(a.igstOnAdvancePaise ?? 0);
    return s + gst;
  }, 0);

  const pendingRecoveryPaise = advances
    .filter((a) => a.status === "DISBURSED" || a.status === "PARTIALLY_RECOVERED")
    .reduce((s, a) =>
      s + Math.max(0,
        Number(a.advanceAmountPaise ?? 0) - Number(a.recoveredAmountPaise ?? 0)
      ), 0);

  const pendingVantaiCount = bills.filter(
    (b) => b.status === "APPROVED_FOR_PAYMENT" && (!b.vtN002GatePassed || !b.eInvoiceIrn)
  ).length;

  const totalApprovedPaise = bills
    .filter((b) => b.status === "APPROVED_FOR_PAYMENT" || b.status === "PAYMENT_INITIATED")
    .reduce((s, b) => s + Number(b.netPayablePaise ?? 0), 0);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sand-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-maroon-500">
              Nidhivan · Aiyyo-Nidhi
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-900">
              Cockpit
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              RA Bill workflow · Approval queue · Advances · VANTAI compliance
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-navy-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-800 disabled:opacity-60"
            >
              {loading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13.5 2.5A6.5 6.5 0 1 1 2.5 8" strokeLinecap="round"/>
                  <path d="M13.5 2.5V6h-3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Refresh
            </button>
            <span className="text-[11px] text-slate-400">
              Updated {lastRefresh.toLocaleTimeString("en-IN")}
            </span>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="rounded-xl border border-maroon-200 bg-maroon-50 px-5 py-4 text-sm text-maroon-700">
            <strong>API Error:</strong> {error}
          </div>
        )}

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total RA Bills",         value: bills.length.toString(),        sub: "all statuses"             },
            { label: "Pending Approval",        value: approvalQueue.length.toString(), sub: "awaiting action"         },
            { label: "Approved for Payment",    value: inr(totalApprovedPaise),        sub: "net payable"             },
            { label: "Advance GST Exposure",    value: inr(totalGstExposurePaise),     sub: "CGST Act S.13(2)"        },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-sand-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{kpi.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-navy-800">{kpi.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Two-column grid: Status Summary + VANTAI ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Status Summary */}
          <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
            <div className="border-b border-sand-200 px-6 py-4">
              <h2 className="text-sm font-bold text-navy-800">Workflow Status Distribution</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {bills.length} bills · gross totals in INR
              </p>
            </div>
            <div className="divide-y divide-sand-100 px-6">
              {loading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
              ) : statusBuckets.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No RA Bills found.</div>
              ) : (
                statusBuckets.map((bucket) => (
                  <div key={bucket.status} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[bucket.status]}`}>
                        {STATUS_LABELS[bucket.status]}
                      </span>
                      <span className="text-xs text-slate-500">{bucket.count} bill{bucket.count !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{inr(bucket.totalPaise)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* VANTAI Gate Registry */}
          <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
            <div className="border-b border-sand-200 px-6 py-4">
              <h2 className="text-sm font-bold text-navy-800">VANTAI Compliance Gates</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                BNLV-COUNCIL-002 · Legal Compliance H9
                {pendingVantaiCount > 0 && (
                  <span className="ml-2 rounded-full bg-maroon-100 px-2 py-0.5 text-xs font-semibold text-maroon-700">
                    {pendingVantaiCount} blocked
                  </span>
                )}
              </p>
            </div>
            <div className="divide-y divide-sand-100 px-6">
              {VANTAI_GATE_REGISTRY.map((gate) => (
                <div key={gate.code} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-navy-100 px-2 py-0.5 font-mono text-[11px] font-bold text-navy-700">
                        {gate.code}
                      </span>
                      <span className="text-sm font-semibold text-navy-800">{gate.name}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      gate.status === "ACTIVE"
                        ? "bg-jade-100 text-jade-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {gate.status === "ACTIVE" ? "Active" : "Pending Review"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{gate.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Approval Queue ── */}
        <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-200 px-6 py-4">
            <h2 className="text-sm font-bold text-navy-800">Approval Queue</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Bills in SUBMITTED · UNDER_CHECK · CERTIFIED — awaiting Maker-Checker action
            </p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            ) : approvalQueue.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No bills pending approval.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3">Bill No.</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Gross (₹)</th>
                    <th className="px-4 py-3 text-right">Net Payable (₹)</th>
                    <th className="px-4 py-3">VT-N-002</th>
                    <th className="px-4 py-3">e-Invoice IRN</th>
                    <th className="px-4 py-3">Bill Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {approvalQueue.map((bill) => (
                    <tr key={bill.id} className="hover:bg-sand-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-navy-700">
                        {bill.billNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[bill.status]}`}>
                          {STATUS_LABELS[bill.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {inr(bill.grossAmountPaise)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-navy-800">
                        {inr(bill.netPayablePaise)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          bill.vtN002GatePassed ? "bg-jade-100 text-jade-700" : "bg-maroon-100 text-maroon-600"
                        }`}>
                          {bill.vtN002GatePassed ? "✓ Cleared" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {bill.eInvoiceIrn ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {bill.billDate ? new Date(bill.billDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Advance Tracker ── */}
        <div className="rounded-xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-200 px-6 py-4">
            <h2 className="text-sm font-bold text-navy-800">Project Advance Tracker</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              CGST Act S.13(2) · GST on advance booked at receipt · pending recovery:{" "}
              <span className="font-semibold text-maroon-600">{inr(pendingRecoveryPaise)}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
            ) : advances.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No project advances recorded.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Recovered</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">GST (advance)</th>
                    <th className="px-4 py-3">Sanctioned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {advances.map((adv) => {
                    const advPaise       = Number(adv.advanceAmountPaise  ?? 0);
                    const recoveredPaise = Number(adv.recoveredAmountPaise ?? 0);
                    const balancePaise   = Math.max(0, advPaise - recoveredPaise);
                    const gstPaise       = Number(adv.cgstOnAdvancePaise ?? 0)
                                         + Number(adv.sgstOnAdvancePaise ?? 0)
                                         + Number(adv.igstOnAdvancePaise ?? 0);
                    const recoveryPct    = advPaise > 0
                      ? Math.round((recoveredPaise / advPaise) * 100)
                      : 0;

                    return (
                      <tr key={adv.id} className="hover:bg-sand-50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-navy-700">ADV-{String(adv.id).padStart(4, "0")}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-navy-100 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
                            {adv.advanceType === "MOBILISATION" ? "Mob." : "Sec. Mat."}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            adv.status === "FULLY_RECOVERED"   ? "bg-jade-100 text-jade-700"     :
                            adv.status === "PARTIALLY_RECOVERED" ? "bg-amber-100 text-amber-700" :
                            adv.status === "DISBURSED"         ? "bg-navy-100 text-navy-700"     :
                            adv.status === "SANCTIONED"        ? "bg-sand-200 text-slate-600"    :
                                                                  "bg-maroon-100 text-maroon-700"
                          }`}>
                            {adv.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{inr(advPaise)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-jade-700 font-medium">{inr(recoveredPaise)}</span>
                          <span className="ml-1 text-[11px] text-slate-400">({recoveryPct}%)</span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${balancePaise > 0 ? "text-maroon-600" : "text-jade-600"}`}>
                          {inr(balancePaise)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500">{inr(gstPaise)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(adv.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-sand-200 pt-4 text-center text-[11px] text-slate-400">
          Aiyyo-Nidhi · BNLV Group · Nidhivan Consulting ·
          ADR-004 (paise) · ADR-006 (Anthropic-only AI) ·
          DPDP Act 2023 · CGST Act 2017 · TDS 194C Income Tax Act 1961
        </div>

      </div>
    </div>
  );
}
