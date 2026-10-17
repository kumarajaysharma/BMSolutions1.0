/**
 * src/lib/nidhivan/vantai-gates.ts
 *
 * VANTAI Legal Compliance Agent — Gate Middleware
 * ================================================
 * BNLV-COUNCIL-002 · Agent: VANTAI (Legal Compliance H9)
 *
 * Gates enforced at runtime before sensitive workflow transitions:
 *
 *   VT-N-001  DPDP Act 2023 — Data Protection Agreement required before
 *             any personal data (contractor PAN, bank details) is processed.
 *             Direct check: nidhivan_projects.vt_n001_dpa_signed = TRUE.
 *             Column added in migration 0024. Administrator sets via
 *             PATCH /api/nidhivan/projects/:id with vtN001DpaReference.
 *
 *   VT-N-002  TDS 194C — CA/human-approver gate before RA Bill payment dispatch.
 *             Checks nidhivan_ra_bills.vt_n002_gate_passed = TRUE.
 *
 *   VT-N-003  GST e-invoice — NIC IRP integration required for bills ≥ ₹5Cr.
 *             Checks nidhivan_ra_bills.e_invoice_irn IS NOT NULL.
 *
 *   VT-N-004  Inter-company BNLV consolidation — human acknowledgement before
 *             any journal entry posting to an inter-company account.
 *             Checks nidhivan_chart_of_accounts.is_inter_company flag.
 *
 * CONTRACT:
 *   - BLOCKED  result must halt the calling workflow immediately.
 *   - PENDING_HUMAN result surfaces to operator UI for action.
 *   - No gate may be bypassed regardless of operational urgency.
 *   - All DB reads via withTenant() — RLS enforced (ADR-001).
 */

import { eq }         from "drizzle-orm";
import { withTenant } from "@/db";
import {
  nidhivanProjects,
  nidhivanRaBills,
} from "@/db/schema";

// ── Threshold constants (ADR-004 paise; BigInt-safe integer comparison) ────────
/** ₹5Cr = 5,000,000,000 paise */
export const E_INVOICE_THRESHOLD_PAISE = 5_000_000_000;

// ── Gate result types ─────────────────────────────────────────────────────────
export type VantaiGateStatus = "PASSED" | "BLOCKED" | "PENDING_HUMAN";
export type VantaiGateCode   = "VT-N-001" | "VT-N-002" | "VT-N-003" | "VT-N-004";

export interface VantaiGateResult {
  gate_code:          VantaiGateCode;
  status:             VantaiGateStatus;
  detail:             string;
  /** ISO-8601 timestamp of evaluation */
  evaluated_at:       string;
  /** Set on PENDING_HUMAN — user ID of the required human approver */
  requires_human_id?: number;
}

// ── VT-N-001: DPDP Act 2023 DPA check ────────────────────────────────────────
/**
 * Verifies a Data Protection Agreement (DPA) has been executed for this project
 * before any personal data (contractor PAN, bank details, Aadhaar references)
 * is processed. DPDP Act 2023, Section 4(1)(b): Data Fiduciary must have
 * verifiable lawful basis before processing personal data.
 *
 * Gate check: nidhivan_projects.vt_n001_dpa_signed = TRUE
 * Column added in migration 0024. Administrator sets via:
 *   PATCH /api/nidhivan/projects/:id
 *   body: { vtN001DpaSigned: true, vtN001DpaReference: "<contract-ref>" }
 *   role: admin
 */
export async function gateVtN001Dpdp(
  tenantId: number,
  projectId: number,
): Promise<VantaiGateResult> {
  const rows = await withTenant(tenantId, (tx) =>
    tx
      .select({
        vtN001DpaSigned:    nidhivanProjects.vtN001DpaSigned,
        vtN001DpaReference: nidhivanProjects.vtN001DpaReference,
      })
      .from(nidhivanProjects)
      .where(eq(nidhivanProjects.id, projectId))
      .limit(1),
  );

  if (!rows.length) {
    return {
      gate_code:    "VT-N-001",
      status:       "BLOCKED",
      detail:       `Project ${projectId} not found; DPA status cannot be verified.`,
      evaluated_at: new Date().toISOString(),
    };
  }

  if (!rows[0].vtN001DpaSigned) {
    return {
      gate_code: "VT-N-001",
      status:    "BLOCKED",
      detail:
        "DPDP Act 2023 S.4(1)(b) — Data Protection Agreement not executed for this project. " +
        "Administrator must record DPA execution via " +
        "PATCH /api/nidhivan/projects/:id with { vtN001DpaSigned: true, vtN001DpaReference }. " +
        "Personal data (contractor PAN, bank details) may NOT be processed until cleared. " +
        "Contact Legal — VANTAI VT-N-001.",
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    gate_code:    "VT-N-001",
    status:       "PASSED",
    detail:
      `DPDP DPA executed. Reference: ${rows[0].vtN001DpaReference ?? "on record"}. ` +
      "Personal data processing permitted.",
    evaluated_at: new Date().toISOString(),
  };
}

// ── VT-N-002: TDS 194C human gate ────────────────────────────────────────────
/**
 * Mandates CA/authorised-signatory review before RA Bill payment dispatch.
 * Gate is set by a privileged user calling PATCH /api/nidhivan/ra-bills/:id
 * with { vt_n002_gate_passed: true } — restricted to admin role.
 *
 * @param billId  RA Bill being dispatched
 */
export async function gateVtN002Tds194c(
  tenantId: number,
  billId:   number,
): Promise<VantaiGateResult> {
  const rows = await withTenant(tenantId, (tx) =>
    tx
      .select({
        billNumber:       nidhivanRaBills.billNumber,
        vtN002GatePassed: nidhivanRaBills.vtN002GatePassed,
      })
      .from(nidhivanRaBills)
      .where(eq(nidhivanRaBills.id, billId))
      .limit(1),
  );

  if (!rows.length) {
    return {
      gate_code:    "VT-N-002",
      status:       "BLOCKED",
      detail:       `RA Bill ${billId} not found.`,
      evaluated_at: new Date().toISOString(),
    };
  }

  const { billNumber, vtN002GatePassed } = rows[0];

  if (!vtN002GatePassed) {
    return {
      gate_code: "VT-N-002",
      status:    "PENDING_HUMAN",
      detail:
        `TDS 194C gate not cleared for Bill ${billNumber}. ` +
        "CA or authorised signatory must verify TDS deduction computation " +
        "and set vt_n002_gate_passed = TRUE before payment dispatch. " +
        "PATCH /api/nidhivan/ra-bills/:id with { vtN002GatePassed: true } " +
        "— requires admin role.",
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    gate_code:    "VT-N-002",
    status:       "PASSED",
    detail:       `TDS 194C gate cleared for Bill ${billNumber}.`,
    evaluated_at: new Date().toISOString(),
  };
}

// ── VT-N-003: GST e-invoice NIC IRP gate ─────────────────────────────────────
/**
 * Blocks payment dispatch when bill gross ≥ ₹5Cr and IRN is not yet assigned.
 * e-invoice IRN is set by the GST portal integration (NIC IRP webhook).
 */
export async function gateVtN003EInvoice(
  tenantId: number,
  billId:   number,
): Promise<VantaiGateResult> {
  const rows = await withTenant(tenantId, (tx) =>
    tx
      .select({
        billNumber:       nidhivanRaBills.billNumber,
        grossAmountPaise: nidhivanRaBills.grossAmountPaise,
        eInvoiceIrn:      nidhivanRaBills.eInvoiceIrn,
      })
      .from(nidhivanRaBills)
      .where(eq(nidhivanRaBills.id, billId))
      .limit(1),
  );

  if (!rows.length) {
    return {
      gate_code:    "VT-N-003",
      status:       "BLOCKED",
      detail:       `RA Bill ${billId} not found.`,
      evaluated_at: new Date().toISOString(),
    };
  }

  const { billNumber, grossAmountPaise, eInvoiceIrn } = rows[0];
  const gross = Number(grossAmountPaise ?? 0);

  if (gross >= E_INVOICE_THRESHOLD_PAISE && !eInvoiceIrn) {
    return {
      gate_code: "VT-N-003",
      status:    "BLOCKED",
      detail:
        `Bill ${billNumber} gross = ₹${(gross / 100).toLocaleString("en-IN")} — ` +
        "exceeds ₹5Cr e-invoice threshold (Rule 48(4) CGST Rules). " +
        "IRN from NIC IRP must be obtained before payment. " +
        "Integrate via GST e-invoice webhook (VT-N-003).",
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    gate_code:    "VT-N-003",
    status:       "PASSED",
    detail:
      gross >= E_INVOICE_THRESHOLD_PAISE
        ? `E-invoice IRN assigned: ${eInvoiceIrn}`
        : "Bill below ₹5Cr e-invoice threshold. IRN not required.",
    evaluated_at: new Date().toISOString(),
  };
}

// ── VT-N-004: Inter-company BNLV consolidation gate ──────────────────────────
/**
 * Flags inter-company journal entries for BNLV Group consolidation review.
 * Triggered when posting to an account where is_inter_company = TRUE.
 *
 * Current implementation: stateless flag check.
 * Full implementation (Phase 4): webhook to bnlv tenant consolidation endpoint.
 */
export async function gateVtN004InterCompany(
  isInterCompanyTransaction: boolean,
): Promise<VantaiGateResult> {
  if (!isInterCompanyTransaction) {
    return {
      gate_code:    "VT-N-004",
      status:       "PASSED",
      detail:       "Not an inter-company transaction. Gate N/A.",
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    gate_code: "VT-N-004",
    status:    "PENDING_HUMAN",
    detail:
      "Inter-company transaction detected (Ind AS 24 / ICAI related-party). " +
      "BNLV Group consolidation officer (bnlv tenant, role=admin) must acknowledge " +
      "before ledger entry is finalised. " +
      "Reference: VANTAI VT-N-004.",
    evaluated_at: new Date().toISOString(),
  };
}

// ── Composite gate runner (payment dispatch) ──────────────────────────────────
export interface PaymentDispatchGateOpts {
  projectId:      number;
  billId:         number;
  isInterCompany: boolean;
}

export interface CompositeGateResult {
  overall: VantaiGateStatus;
  gates:   VantaiGateResult[];
}

/**
 * Runs all applicable gates for a payment dispatch event in parallel.
 * Overall status: BLOCKED if any gate BLOCKED; else PENDING_HUMAN if any pending;
 * else PASSED only if all pass.
 *
 * Order of precedence: BLOCKED > PENDING_HUMAN > PASSED.
 */
export async function runPaymentDispatchGates(
  tenantId: number,
  opts:     PaymentDispatchGateOpts,
): Promise<CompositeGateResult> {
  const [g1, g2, g3, g4] = await Promise.all([
    gateVtN001Dpdp(tenantId, opts.projectId),
    gateVtN002Tds194c(tenantId, opts.billId),
    gateVtN003EInvoice(tenantId, opts.billId),
    gateVtN004InterCompany(opts.isInterCompany),
  ]);

  const gates = [g1, g2, g3, g4];
  let overall: VantaiGateStatus = "PASSED";
  for (const g of gates) {
    if (g.status === "BLOCKED")       { overall = "BLOCKED"; break; }
    if (g.status === "PENDING_HUMAN")   overall = "PENDING_HUMAN";
  }

  return { overall, gates };
}
