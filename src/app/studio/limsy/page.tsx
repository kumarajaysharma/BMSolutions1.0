/**
 * src/app/studio/limsy/page.tsx
 * LIMSY Supreme Court Standard — Workspace Management Dashboard
 *
 * REMEDIATION (P0 — 2026-07-25):
 *    - CaseItem type realigned to limsy_cases schema columns.
 *      Removed: title, filingType, benchCoram (non-existent in schema).
 *      Added: internalRef, courtLevel, courtName, caseType, petitioner,
 *             respondent, urgencyFlag, priorityLevel.
 *    - OrderItem type enriched with complianceRequired, complianceDeadline, isFinal.
 *    - handleFileCase POST body corrected to API-required canonical fields:
 *      internalRef, courtLevel, courtName, caseType, petitioner, respondent, subjectMatter.
 *      Optional: caseNumber.
 *    - All form state variables and inputs aligned to schema field names.
 *    - Docket list renderer updated to schema-accurate fields with status
 *      colour mapping and urgency flag indicator.
 *    - Raw .json() calls replaced with safeJson (SyntaxError prevention on empty bodies).
 *    - Explicit 401/403 response handling in loadData and handleFileCase.
 *    - loadData wrapped in useCallback to satisfy exhaustive-deps lint rule.
 *    - submitting guard added to prevent duplicate POST on double-click.
 *    - Error dismissal control added.
 *    - resetForm() called on successful submission.
 *    - Full court_level and case_type enum dropdowns present (matches 0003_limsys_workflow.sql).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { safeJson } from "@/lib/safe-json";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — aligned to limsy_cases and limsy_orders schema columns
// ─────────────────────────────────────────────────────────────────────────────

type CaseItem = {
  id: number;
  caseNumber: string | null;
  internalRef: string;
  courtLevel: string;
  courtName: string;
  caseType: string;
  status: string;
  petitioner: string;
  respondent: string;
  nextHearingDate: string | null;
  urgencyFlag: boolean;
  priorityLevel: number;
};

type OrderItem = {
  id: number;
  orderTitle: string;
  orderType: string;
  orderDate: string;
  cryptoHash: string | null;
  hasStay: boolean;
  complianceRequired: boolean;
  complianceDeadline: string | null;
  isFinal: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// ENUM DISPLAY MAPS — mirrors court_level and case_type enums in 0003_limsys_workflow.sql
// ─────────────────────────────────────────────────────────────────────────────

const COURT_LEVEL_LABELS: Record<string, string> = {
  supreme_court:    "Supreme Court",
  high_court:       "High Court",
  district_court: "District Court",
  tribunal:         "Tribunal",
  consumer_forum: "Consumer Forum",
  arbitration:      "Arbitration",
  nclt:             "NCLT",
  nclat:            "NCLAT",
  ncdrc:            "NCDRC",
};

const CASE_TYPE_LABELS: Record<string, string> = {
  slp:                      "Special Leave Petition (SLP)",
  writ_petition:            "Writ Petition",
  civil_appeal:             "Civil Appeal",
  criminal_appeal:          "Criminal Appeal",
  review_petition:          "Review Petition",
  curative_petition:        "Curative Petition",
  original_suit:            "Original Suit",
  execution_petition:       "Execution Petition",
  consumer_complaint:       "Consumer Complaint",
  arbitration_petition:     "Arbitration Petition",
  ibc_petition:             "IBC Petition",
  nclt_petition:            "NCLT Petition",
  other:                    "Other",
};

const STATUS_COLOURS: Record<string, string> = {
  intake:          "bg-slate-100 text-slate-700",
  diarised:        "bg-blue-50 text-blue-700",
  admitted:        "bg-sky-50 text-sky-700",
  pending_hearing: "bg-amber-50 text-amber-700",
  under_hearing:   "bg-orange-50 text-orange-700",
  reserved:        "bg-violet-50 text-violet-700",
  disposed:        "bg-emerald-50 text-emerald-700",
  withdrawn:       "bg-rose-50 text-rose-700",
  abated:          "bg-gray-50 text-gray-500",
  transferred:     "bg-teal-50 text-teal-700",
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPER
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LimsyDashboard() {
  const [activeTab, setActiveTab] = useState<"cases" | "orders">("cases");
  const [cases, setCases]         = useState<CaseItem[]>([]);
  const [orders, setOrders]       = useState<OrderItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Form state — aligned to limsy_cases API-required fields ────────────────
  const [internalRef,   setInternalRef]   = useState("");
  const [caseNumber,    setCaseNumber]    = useState("");
  const [courtLevel,    setCourtLevel]    = useState("supreme_court");
  const [courtName,     setCourtName]     = useState("");
  const [caseType,      setCaseType]      = useState("slp");
  const [petitioner,    setPetitioner]    = useState("");
  const [respondent,    setRespondent]    = useState("");
  const [subjectMatter, setSubjectMatter] = useState("");

  // ── Data Loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, ordersRes] = await Promise.all([
        fetch("/api/limsy/cases"),
        fetch("/api/limsy/orders"),
      ]);

      if (casesRes.status === 401 || ordersRes.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (casesRes.status === 403 || ordersRes.status === 403) {
        setError("Insufficient privileges to access LIMSY workspace data.");
        return;
      }

      const casesData  = casesRes.ok  ? (await safeJson(casesRes) as CaseItem[])   : null;
      const ordersData = ordersRes.ok ? (await safeJson(ordersRes) as OrderItem[]) : null;

      if (casesData)  setCases(casesData);
      if (ordersData) setOrders(ordersData);
    } catch {
      setError("Network error — failed to fetch LIMSY workspace data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (isMounted) {
        await loadData();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // ── Case Filing ───────────────────────────────────────────────────────────────

  const resetForm = () => {
    setInternalRef("");
    setCaseNumber("");
    setCourtLevel("supreme_court");
    setCourtName("");
    setCaseType("slp");
    setPetitioner("");
    setRespondent("");
    setSubjectMatter("");
  };

  const handleFileCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/limsy/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalRef:   internalRef.trim(),
          caseNumber:    caseNumber.trim() || undefined,
          courtLevel,
          courtName:     courtName.trim(),
          caseType,
          petitioner:    petitioner.trim(),
          respondent:    respondent.trim(),
          subjectMatter: subjectMatter.trim(),
        }),
      });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (res.status === 403) {
        setError("Insufficient privileges to file a case.");
        return;
      }

      if (res.ok) {
        resetForm();
        await loadData();
      } else {
        const d = await safeJson(res) as { error?: string };
        setError(d?.error ?? "Failed to file case. Please verify all required fields.");
      }
    } catch {
      setError("Network error while filing case.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      {/* ── Page Header ────────────────────────────────────────────────        */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-800">
            LIMSY Legal Intelligence Studio
          </h1>
          <p className="text-xs text-slate-500">
            Supreme Court Standard Litigation Workflow &amp; Cryptographic Order Verification
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("cases")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "cases"
                ? "bg-navy-700 text-white"
                : "bg-white text-slate-600 border border-sand-200"
            }`}
          >
            Litigation Cases ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "orders"
                ? "bg-navy-700 text-white"
                : "bg-white text-slate-600 border border-sand-200"
            }`}
          >
            Verified Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 flex items-start justify-between rounded-xl border border-rose-200 bg-rose-50 p-4">
          <span className="text-xs font-medium text-rose-700">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="ml-4 shrink-0 text-xs font-semibold text-rose-400 hover:text-rose-700 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Cases Tab ────────────────────────────────────────────────────────── */}
      {activeTab === "cases" ? (
        <div className="grid gap-8 lg:grid-cols-3">

          {/* File New Case Form */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-sm font-semibold text-navy-800">File New Petition / Appeal</h2>
            <form onSubmit={handleFileCase} className="space-y-3">

              {/* Internal Reference — unique per-tenant; required */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Internal Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={internalRef}
                  onChange={(e) => setInternalRef(e.target.value)}
                  placeholder="LIMSY-SC-2026-001"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Case Number — court-assigned docket number; optional */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Case Number
                </label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="SLP(C) No. 0001/2026"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                />
              </div>

              {/* Court Level — enum: court_level */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Court Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={courtLevel}
                  onChange={(e) => setCourtLevel(e.target.value)}
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                >
                  {Object.entries(COURT_LEVEL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Court Name */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Court Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="Supreme Court of India"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Case Type — enum: limsy_case_type */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Case Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                >
                  {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Petitioner */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Petitioner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={petitioner}
                  onChange={(e) => setPetitioner(e.target.value)}
                  placeholder="State of Delhi"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Respondent */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Respondent <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  placeholder="Union of India"
                  className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  required
                />
              </div>

              {/* Subject Matter */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Subject Matter <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={subjectMatter}
                  onChange={(e) => setSubjectMatter(e.target.value)}
                  placeholder="Brief description of the legal matter and primary relief sought…"
                  className="w-full resize-none rounded-xl border border-sand-300 px-3 py-2 text-xs focus:outline-none focus:border-navy-500"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-navy-700 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Petition Intake"}
              </button>
            </form>
          </div>

          {/* Docket List */}
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-sand-200 bg-sand-50 px-6 py-4">
              <h2 className="text-sm font-semibold text-navy-800">Active Supreme Court Dockets</h2>
            </div>
            <div className="divide-y divide-sand-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading litigation records…</div>
              ) : cases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No active cases found in workspace.</div>
              ) : (
                cases.map((c) => (
                  <div key={c.id} className="flex items-start justify-between px-6 py-4 hover:bg-sand-50/50">
                    <div className="min-w-0 flex-1">
                      {/* Parties — primary identifier */}
                      <div className="flex items-center gap-2">
                        {c.urgencyFlag && (
                          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase text-rose-700">
                            Urgent
                          </span>
                        )}
                        <span className="truncate font-semibold text-sm text-navy-800">
                          {c.petitioner} v. {c.respondent}
                        </span>
                      </div>
                      {/* Meta row */}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{c.internalRef}</span>
                        {c.caseNumber && (
                          <span className="font-mono text-[10px] text-slate-400">· {c.caseNumber}</span>
                        )}
                        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium uppercase text-navy-700">
                          {CASE_TYPE_LABELS[c.caseType] ?? c.caseType}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {COURT_LEVEL_LABELS[c.courtLevel] ?? c.courtLevel}
                        </span>
                      </div>
                      {/* Next hearing */}
                      {c.nextHearingDate && (
                        <div className="mt-1 text-[10px] text-slate-400">
                          Next hearing: {formatDate(c.nextHearingDate)}
                        </div>
                      )}
                    </div>
                    {/* Status badge */}
                    <span
                      className={`ml-4 shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                        STATUS_COLOURS[c.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ── Orders Tab ────────────────────────────────────────────────────── */
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
          <div className="border-b border-sand-200 bg-sand-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-navy-800">
              Cryptographically Verified Judicial Orders
            </h2>
          </div>
          <div className="divide-y divide-sand-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading verified orders…</div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No cryptographic orders recorded.</div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="flex items-start justify-between px-6 py-4 hover:bg-sand-50/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {o.isFinal && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                          Final
                        </span>
                      )}
                      <span className="truncate font-semibold text-sm text-navy-800">
                        {o.orderTitle}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase text-rose-700">
                        {o.orderType.replace(/_/g, " ")}
                      </span>
                      {o.cryptoHash && (
                        <span className="font-mono text-[10px] text-slate-400">
                          SHA-256: {o.cryptoHash.slice(0, 16)}…
                        </span>
                      )}
                    </div>
                    {o.complianceRequired && o.complianceDeadline && (
                      <div className="mt-1 text-[10px] font-medium text-amber-600">
                        Compliance due: {formatDate(o.complianceDeadline)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
                    {o.hasStay && (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-semibold text-rose-700">
                        Stay Granted
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{formatDate(o.orderDate)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}