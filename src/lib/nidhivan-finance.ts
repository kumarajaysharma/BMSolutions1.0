/**
 * src/lib/nidhivan-finance.ts
 *
 * Nidhivan Consulting — Financial Intelligence Calculation Library
 * ================================================================
 * Ported and hardened from BI-Nidhivan (src/lib/finance.ts,
 * src/lib/councilData.ts, src/lib/finTech.ts).
 *
 * PAISE BOUNDARY (ADR-004):
 *   All values retrieved from the Neon DB (nidhivan_entities.aum_paise,
 *   nidhivan_boq_items.unit_rate_paise, nidhivan_boq_items.amount_paise,
 *   nidhivan_lab.spend_paise, etc.) are BIGINT in paise.
 *
 *   CONVERSION AT THE CALLING LAYER:
 *     paise → ₹ Crores: paiseToLakhs(n) / 100  (for financial models)
 *     paise → ₹:        paise / 100             (for BOQ display)
 *
 *   Functions in this library operate in ₹ Crores (for financial models)
 *   or ₹ (for BOQ) as documented per function.
 *   Never pass raw paise values to financial model functions.
 *   Never pass float rupees to the database — convert to paise before insert.
 *
 * AI MODEL ROUTING (DPDP Act 2023 / ADR-006):
 *   Financial AI sessions (Council module) route to Claude on Anthropic
 *   infrastructure. Foreign-jurisdiction AI APIs are PROHIBITED for any
 *   computation over un-anonymised client financial data.
 *
 *   COUNCIL.cfo.model     → 'claude-opus-5'       (capital allocation)
 *   COUNCIL.analytics.model → 'claude-sonnet-5'   (BI / risk modeling)
 *   COUNCIL.banker.model  → 'claude-opus-5'        (institutional fundraising)
 *   COUNCIL.controller.model → 'claude-sonnet-5'  (compliance / books)
 *
 *   Override via NIDHIVAN_COUNCIL_MODEL env var (default: claude-sonnet-5)
 */

// ── Paise conversion helpers ──────────────────────────────────────────────────

/** Convert bigint paise from DB to ₹ Crores for financial model calculations */
export const paiseToCrores = (paise: number | bigint): number =>
  Number(paise) / 100 / 100_000; // paise ÷ 100 = ₹, ÷ 1,00,000 = ₹ Cr

/** Convert ₹ Crores back to bigint paise for DB storage */
export const croresToPaise = (crores: number): number =>
  Math.round(crores * 100_000 * 100);

/** Convert bigint paise to ₹ for display (e.g. BOQ line items) */
export const paiseToRupees = (paise: number | bigint): number =>
  Number(paise) / 100;

// ── Format utilities ─────────────────────────────────────────────────────────

export const fmtCr = (crores: number, dp = 2): string =>
  `₹${crores.toFixed(dp)} Cr`;

export const fmtL = (lakhs: number, dp = 2): string =>
  `₹${lakhs.toFixed(dp)} L`;

export const fmtPct = (pct: number, dp = 2): string =>
  `${pct.toFixed(dp)}%`;

export const fmtRupee = (rupees: number, dp = 2): string =>
  rupees.toLocaleString('en-IN', { style: 'currency', currency: 'INR',
    minimumFractionDigits: dp, maximumFractionDigits: dp });

export const fmtMultiplier = (x: number, dp = 2): string =>
  `${x.toFixed(dp)}×`;

// ── DSCR — Debt Service Coverage Ratio ───────────────────────────────────────
/**
 * Calculate DSCR for a given period.
 * @param noi         Net Operating Income (₹ Cr)
 * @param debtService Annual Debt Service — principal + interest (₹ Cr)
 * @returns DSCR ratio; null if debtService ≤ 0
 *
 * Lender minimums (illustrative):
 *   < 1.00 — Cash flow insufficient (NOI < Debt Service)
 *   1.00–1.20 — Below covenant — restructure risk
 *   1.20–1.50 — Acceptable (typical bank threshold)
 *   > 1.50 — Strong / Lender preferred
 */
export function calculateDSCR(noi: number, debtService: number): number | null {
  if (debtService <= 0) return null;
  return noi / debtService;
}

export function dscrVerdict(ratio: number | null): {
  label: string; color: string; note: string;
} {
  if (ratio === null) return { label: 'N/A', color: '#4A6080', note: 'Enter debt service > 0' };
  if (ratio < 1.0) return { label: 'Insufficient', color: '#DC2626',
    note: 'Cash flow below debt obligations. Immediate restructuring required.' };
  if (ratio < 1.2) return { label: 'Below Covenant', color: '#D97706',
    note: 'Below lender threshold. Review debt terms or grow NOI.' };
  if (ratio < 1.5) return { label: 'Acceptable', color: '#C9A84C',
    note: 'Within typical bank covenant range (1.20–1.50×).' };
  return { label: 'Strong', color: '#0FA472',
    note: 'DSCR above 1.50×. Favourable for refinancing or growth capex.' };
}

// ── IRR — Internal Rate of Return (Bisection method) ─────────────────────────
/**
 * Compute IRR given a series of cash flows.
 * @param cashFlows Array of cash flows (₹ Cr); cashFlows[0] must be negative (initial investment)
 * @param precision Convergence tolerance (default 1e-6)
 * @returns IRR as a decimal (e.g. 0.18 = 18%); null if non-convergent
 */
export function calculateIRR(cashFlows: number[], precision = 1e-6): number | null {
  if (!cashFlows.length || cashFlows[0] >= 0) return null;

  const npv = (rate: number): number =>
    cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);

  let lo = -0.999;
  let hi = 10.0;
  let mid = 0;

  for (let iter = 0; iter < 1000; iter++) {
    mid = (lo + hi) / 2;
    const npvMid = npv(mid);
    if (Math.abs(npvMid) < precision) return mid;
    if (npvMid > 0) lo = mid; else hi = mid;
  }
  return Math.abs(npv(mid)) < 0.01 ? mid : null;
}

// ── Valuation — Pre/Post-money ────────────────────────────────────────────────
/**
 * Model pre-money and post-money valuations from an investment round.
 * @param investment  Investment amount in ₹ Cr
 * @param ownershipPct  Equity % the investor receives (0–100)
 * @returns { preMoney, postMoney } in ₹ Cr; null if ownershipPct = 0
 */
export function modelValuation(
  investment: number, ownershipPct: number,
): { preMoney: number; postMoney: number } | null {
  if (ownershipPct <= 0 || ownershipPct >= 100) return null;
  const postMoney = investment / (ownershipPct / 100);
  const preMoney  = postMoney - investment;
  return { preMoney, postMoney };
}

// ── BOQ — Bill of Quantities (paise-aware) ───────────────────────────────────

export interface BOQItem {
  id:          string;
  description: string;
  unit:        string;
  quantity:    number;           // engineering quantity (double precision)
  unitRateRs:  number;          // ₹ per unit (converted from paise / 100 at display layer)
  rateRef?:    string;
}

export interface BOQResult {
  rows:            Array<BOQItem & { amountRs: number }>;
  subtotalRs:      number;
  contingencyRs:   number;
  taxRs:           number;
  totalRs:         number;
  totalPaise:      number; // for DB storage — bigint paise
}

/**
 * Calculate BOQ totals with contingency and tax.
 * Works in ₹ (rupees) — NOT paise. Convert paise values before calling.
 * Returns totalPaise for DB storage per ADR-004.
 */
export function calculateBOQ(
  items:           BOQItem[],
  contingencyRate: number, // % (e.g. 5 for 5%)
  taxRate:         number, // % GST (e.g. 18 for 18%)
): BOQResult {
  const rows = items.map(item => ({
    ...item,
    amountRs: item.quantity * item.unitRateRs,
  }));
  const subtotalRs    = rows.reduce((sum, r) => sum + r.amountRs, 0);
  const contingencyRs = subtotalRs * (contingencyRate / 100);
  const taxRs         = (subtotalRs + contingencyRs) * (taxRate / 100);
  const totalRs       = subtotalRs + contingencyRs + taxRs;
  return {
    rows, subtotalRs, contingencyRs, taxRs, totalRs,
    totalPaise: Math.round(totalRs * 100), // ADR-004
  };
}

// ── Runway & Burn ─────────────────────────────────────────────────────────────

export interface RunwayInputs {
  cashBalance:      number; // ₹ Cr
  monthlyBurn:      number; // ₹ Cr
  monthlyRevenue:   number; // ₹ Cr
  revenueGrowthPct: number; // % monthly
}

export const DEFAULT_RUNWAY: RunwayInputs = {
  cashBalance: 42, monthlyBurn: 3.8, monthlyRevenue: 2.1, revenueGrowthPct: 6.5,
};

export interface RunwayRow {
  month:   number;
  cash:    number;
  revenue: number;
  burn:    number;
  netBurn: number;
}

export function projectRunway(inputs: RunwayInputs, months = 24): RunwayRow[] {
  const rows: RunwayRow[] = [];
  let cash    = inputs.cashBalance;
  let revenue = inputs.monthlyRevenue;
  for (let m = 0; m <= months; m++) {
    const netBurn = inputs.monthlyBurn - revenue;
    rows.push({ month: m, cash: Math.max(0, cash), revenue, burn: inputs.monthlyBurn, netBurn });
    cash    -= netBurn;
    revenue *= 1 + inputs.revenueGrowthPct / 100;
    if (cash <= 0) break;
  }
  return rows;
}

// ── LTV : CAC ────────────────────────────────────────────────────────────────

export function computeLTVCAC(
  arpu:           number, // ₹ monthly
  grossMarginPct: number, // %
  churnPct:       number, // % monthly
  cac:            number, // ₹
): { ltv: number; ratio: number; paybackMonths: number } {
  const ltv           = churnPct > 0 ? (arpu * (grossMarginPct / 100)) / (churnPct / 100) : 0;
  const ratio         = cac > 0 ? ltv / cac : 0;
  const paybackMonths = arpu > 0 ? cac / (arpu * (grossMarginPct / 100)) : 0;
  return { ltv, ratio, paybackMonths };
}

// ── Burn Multiple & Governance Gate ──────────────────────────────────────────

export function burnMultiple(
  monthlyBurn:    number,
  monthlyRevenue: number,
  newARR:         number,  // ₹ Cr new ARR this quarter
): { netBurn: number; mult: number } {
  const netBurn = Math.max(0, monthlyBurn - monthlyRevenue) * 3; // 3-month net burn
  const mult    = newARR > 0 ? netBurn / newARR : Infinity;
  return { netBurn, mult };
}

export type BurnTone = 'success' | 'gold' | 'amber' | 'alert';

export function burnVerdict(mult: number): {
  label: string; tone: BurnTone; note: string;
} {
  if (mult <= 1.0) return { label: 'Efficient',   tone: 'success',
    note: 'Top-quartile capital efficiency. Room to accelerate spend.' };
  if (mult <= 1.5) return { label: 'Healthy',     tone: 'gold',
    note: 'Best-in-class band (1.0–1.5×). Maintain current discipline.' };
  if (mult <= 2.0) return { label: 'Watch',       tone: 'amber',
    note: 'Acceptable but drifting. Review channel CAC before scaling.' };
  return               { label: 'Inefficient', tone: 'alert',
    note: 'Burn outpacing new ARR. Freeze discretionary spend immediately.' };
}

export type SpendTier = 'Conservative' | 'Moderate' | 'Aggressive' | 'Breach';

export function governanceGate(
  spend: number, budget: number, capex: number,
): { tier: SpendTier; util: number; verdict: string } {
  const util     = budget > 0 ? (spend / budget) * 100 : 0;
  const overCapex = spend > capex;
  if (overCapex || util > 100) return { tier: 'Breach',
    util, verdict: 'Board approval required — spend exceeds authorised gate.' };
  if (util > 85) return { tier: 'Aggressive',
    util, verdict: 'Above 85% of quarterly budget. CFO sign-off recommended.' };
  if (util > 60) return { tier: 'Moderate',
    util, verdict: 'Within guardrails. Continue with standard approval flow.' };
  return { tier: 'Conservative',
    util, verdict: 'Underrun relative to budget. Consider redeploying to growth.' };
}

// ── Co-Council definitions ────────────────────────────────────────────────────
// AI model routing: all Nidhivan financial AI must use Anthropic (ADR-006)

export type CouncilRole = 'cfo' | 'analytics' | 'banker' | 'controller';

export interface CouncilMember {
  id:           CouncilRole;
  title:        string;
  name:         string;
  tagline:      string;
  capabilities: string[];
  model:        string;   // Anthropic model string — MUST be claude-* only
  color:        string;   // display accent color
  status:       'active' | 'reviewing' | 'standby';
}

export const COUNCIL: Record<CouncilRole, CouncilMember> = {
  cfo: {
    id: 'cfo', name: 'Agent Kavach',
    title: 'Fractional / Strategic CFO',
    tagline: 'Capital allocation, runway & banking partnerships',
    capabilities: ['Unit economics modeling', 'Debt/equity syndication',
      'RBI / regulatory reporting', 'Audit readiness', 'Board pack preparation'],
    model: 'claude-opus-5',         // DPDP-compliant; Anthropic only; never DeepSeek/GPT
    color: '#C9A84C', status: 'active',
  },
  analytics: {
    id: 'analytics', name: 'Agent Drishti',
    title: 'Head of Business Analytics & Risk',
    tagline: 'Telemetry, underwriting logic & cohort economics',
    capabilities: ['Fraud/default modeling', 'Conversion funnel telemetry',
      'Retention cohorts', 'SQL/Python data stacks', 'WOE / PD scoring'],
    model: 'claude-sonnet-5',
    color: '#0FA472', status: 'active',
  },
  banker: {
    id: 'banker', name: 'Agent Vittarth',
    title: 'Investment Banking & Capital Advisor',
    tagline: 'Institutional fundraising & debt facility structuring',
    capabilities: ['Term sheet negotiation', 'Lender relations',
      'Cap table structuring', 'Institutional roadshows', 'NBFC tie-ups'],
    model: 'claude-opus-5',
    color: '#6366F1', status: 'reviewing',
  },
  controller: {
    id: 'controller', name: 'Agent Nirikshak',
    title: 'Compliance & Financial Controller',
    tagline: 'Books, statutory filings & escrow audits',
    capabilities: ['GST, MCA filings', 'PMLA / KYC operational controls',
      'Statutory audit handoffs', 'Escrow reconciliation', 'DPDP data processing'],
    model: 'claude-sonnet-5',
    color: '#8B5CF6', status: 'active',
  },
};

export const DEAL_STAGES = ['Lead', 'Qualify', 'Proposal', 'Contract', 'Closed'] as const;
export type DealStage = typeof DEAL_STAGES[number];

// Seed cohort data (demo — replace with live nidhivan_research / analytics data)
export const SEED_COHORTS = [
  { cohort: 'Jan 2026', users: 4200, retention: [100, 68, 54, 47, 42, 39] },
  { cohort: 'Feb 2026', users: 5100, retention: [100, 71, 58, 51, 46, 0]  },
  { cohort: 'Mar 2026', users: 6300, retention: [100, 74, 61, 55, 0,  0]  },
  { cohort: 'Apr 2026', users: 7800, retention: [100, 76, 64, 0,  0,  0]  },
  { cohort: 'May 2026', users: 8900, retention: [100, 79, 0,  0,  0,  0]  },
];

export const COHORT_MONTHS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'] as const;
