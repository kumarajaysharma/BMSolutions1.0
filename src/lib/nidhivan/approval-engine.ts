/**
 * src/lib/nidhivan/approval-engine.ts
 *
 * Aiyyo-Nidhi — Maker-Checker-Approver 4-Eyes Approval Engine
 * ============================================================
 * BNLV-COUNCIL-002 4-eyes approval mandate:
 *
 *   Amount ≤ ₹25L  (250,000,000 paise)               → L1 + L2
 *   Amount ≤ ₹1Cr  (1,000,000,000 paise)              → L1 + L2 + L3
 *   Amount > ₹1Cr  OR BOQ variation > 10%             → L1 + L2 + L3 + L4
 *
 * SOD invariant: the user who SUBMITS (maker) must NOT be an approver at ANY tier.
 * Enforced at API layer (here) and as a DB CHECK via trigger (phase 4).
 *
 * GST basis-points arithmetic:
 *   900 bps = 9.00% (CGST component of 18% slab)
 *   1800 bps = 18% IGST
 *   All monetary arithmetic in paise (integer). No DECIMAL/FLOAT.
 */

import type { AppRole } from "@/lib/roles";

// ── Threshold constants (ADR-004 — integer paise) ────────────────────────────
export const THRESHOLD_L2_PAISE = 250_000_000;    // ₹25 Lakh
export const THRESHOLD_L3_PAISE = 1_000_000_000;  // ₹1 Crore
export const BOQ_VARIATION_TRIGGER_PCT = 10;        // L4 required above this

// ── Role order (mirrors roles.ts — duplicated to avoid edge-runtime import) ──
const ROLE_ORDER: AppRole[] = [
  "owner", "admin", "architect", "developer", "designer", "viewer",
] as const;

function meetsMinimumRole(actual: string, required: AppRole): boolean {
  const ai = ROLE_ORDER.indexOf(actual as AppRole);
  const ri = ROLE_ORDER.indexOf(required);
  if (ai === -1 || ri === -1) return false;
  return ai <= ri;
}

// ── Tier determination ────────────────────────────────────────────────────────
export type ApprovalTier = "L1_L2" | "L1_L2_L3" | "L1_L2_L3_L4";

/**
 * Derives the required approval tier from amount and BOQ variation.
 * Use integer paise comparison — never pass rupees or floats here.
 */
export function determineApprovalTier(
  amountPaise:    number,
  boqVariationPct: number,
): ApprovalTier {
  if (amountPaise > THRESHOLD_L3_PAISE || boqVariationPct > BOQ_VARIATION_TRIGGER_PCT) {
    return "L1_L2_L3_L4";
  }
  if (amountPaise > THRESHOLD_L2_PAISE) {
    return "L1_L2_L3";
  }
  return "L1_L2";
}

export function requiredApprovalCount(tier: ApprovalTier): number {
  return tier === "L1_L2" ? 2 : tier === "L1_L2_L3" ? 3 : 4;
}

// ── Approval action types ─────────────────────────────────────────────────────
export type ApprovalAction =
  | "SUBMITTED"
  | "L1_APPROVED"
  | "L2_APPROVED"
  | "L3_APPROVED"
  | "L4_APPROVED"
  | "REJECTED"
  | "RECALLED";

export type BillStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_CHECK"
  | "CERTIFIED"
  | "APPROVED_FOR_PAYMENT"
  | "PAID"
  | "REJECTED";

// ── State machine definition ──────────────────────────────────────────────────
interface StateTransition {
  fromStatuses: BillStatus[];
  action:       ApprovalAction;
  toStatus:     BillStatus;
  minimumRole:  AppRole;
  /** true = actorUserId must differ from bill makerId */
  enforceSod:   boolean;
  /** true = only valid when tier requires L4 */
  requiresL4Tier?: boolean;
  /** true = only valid when tier requires L3+ */
  requiresL3Tier?: boolean;
}

const STATE_MACHINE: StateTransition[] = [
  // Maker submits draft
  {
    fromStatuses: ["DRAFT"],
    action:       "SUBMITTED",
    toStatus:     "SUBMITTED",
    minimumRole:  "developer",
    enforceSod:   false,
  },
  // L1: junior checker (architect) → UNDER_CHECK
  {
    fromStatuses: ["SUBMITTED"],
    action:       "L1_APPROVED",
    toStatus:     "UNDER_CHECK",
    minimumRole:  "architect",
    enforceSod:   true,
  },
  // L2: senior checker (admin) → CERTIFIED
  {
    fromStatuses: ["UNDER_CHECK"],
    action:       "L2_APPROVED",
    toStatus:     "CERTIFIED",
    minimumRole:  "admin",
    enforceSod:   true,
  },
  // L3: CFO-level (admin) on CERTIFIED — only for L1_L2_L3 or L1_L2_L3_L4 tiers
  // L3 does NOT move to APPROVED_FOR_PAYMENT directly; stays CERTIFIED until L4 or dispatch
  {
    fromStatuses:    ["CERTIFIED"],
    action:          "L3_APPROVED",
    toStatus:        "CERTIFIED",
    minimumRole:     "admin",
    enforceSod:      true,
    requiresL3Tier:  true,
  },
  // L4: board-level (owner) on CERTIFIED → APPROVED_FOR_PAYMENT
  // Requires L4 tier; if L1_L2_L3 tier, L2 approval directly enables dispatch
  {
    fromStatuses:   ["CERTIFIED"],
    action:         "L4_APPROVED",
    toStatus:       "APPROVED_FOR_PAYMENT",
    minimumRole:    "owner",
    enforceSod:     true,
    requiresL4Tier: true,
  },
  // Fast-path: L1_L2 tier — CERTIFIED directly → APPROVED_FOR_PAYMENT via L2 approval
  // (handled in route: if tier === L1_L2, L2_APPROVED sets APPROVED_FOR_PAYMENT)
  // Rejection valid from any active non-terminal status
  {
    fromStatuses: ["SUBMITTED", "UNDER_CHECK", "CERTIFIED"],
    action:       "REJECTED",
    toStatus:     "REJECTED",
    minimumRole:  "architect",
    enforceSod:   true,
  },
  // Recall by maker (SUBMITTED → DRAFT)
  {
    fromStatuses: ["SUBMITTED"],
    action:       "RECALLED",
    toStatus:     "DRAFT",
    minimumRole:  "developer",
    enforceSod:   false, // maker recalls their own submission
  },
];

// ── Transition validator ──────────────────────────────────────────────────────
export interface ApprovalValidationResult {
  allowed:    boolean;
  reason?:    string;
  nextStatus?: BillStatus;
}

/**
 * Validates an approval action against the state machine.
 *
 * @param currentStatus  Present status of the RA Bill
 * @param action         Requested action
 * @param actorRole      AppRole of the user performing the action
 * @param actorUserId    User ID of the actor
 * @param makerUserId    User ID who originally submitted the bill (SOD baseline)
 * @param tier           Approval tier derived from bill amount + BOQ variation
 */
export function validateApprovalTransition(
  currentStatus: BillStatus,
  action:        ApprovalAction,
  actorRole:     string,
  actorUserId:   number,
  makerUserId:   number,
  tier:          ApprovalTier,
): ApprovalValidationResult {
  const transition = STATE_MACHINE.find(
    (t) => t.fromStatuses.includes(currentStatus) && t.action === action,
  );

  if (!transition) {
    return {
      allowed: false,
      reason:  `Action ${action} is not permitted from status ${currentStatus}.`,
    };
  }

  // Tier guard: L3 actions require L1_L2_L3 or L1_L2_L3_L4
  if (transition.requiresL3Tier && tier === "L1_L2") {
    return {
      allowed: false,
      reason:  `L3 approval not required for tier ${tier} (amount ≤ ₹25L).`,
    };
  }

  // Tier guard: L4 actions require L1_L2_L3_L4
  if (transition.requiresL4Tier && tier !== "L1_L2_L3_L4") {
    return {
      allowed: false,
      reason:  `L4 approval not required for tier ${tier}.`,
    };
  }

  // SOD invariant
  if (transition.enforceSod && actorUserId === makerUserId) {
    return {
      allowed: false,
      reason:  "SOD violation: approver cannot be the same user as the bill maker/submitter.",
    };
  }

  // RBAC
  if (!meetsMinimumRole(actorRole, transition.minimumRole)) {
    return {
      allowed: false,
      reason:  `Insufficient privilege: ${action} requires minimum role '${transition.minimumRole}'. Actor has '${actorRole}'.`,
    };
  }

  // Fast-path override: for L1_L2 tier, L2_APPROVED advances directly to APPROVED_FOR_PAYMENT
  let nextStatus = transition.toStatus;
  if (action === "L2_APPROVED" && tier === "L1_L2") {
    nextStatus = "APPROVED_FOR_PAYMENT";
  }
  // For L1_L2_L3 tier, L3_APPROVED advances to APPROVED_FOR_PAYMENT
  if (action === "L3_APPROVED" && tier === "L1_L2_L3") {
    nextStatus = "APPROVED_FOR_PAYMENT";
  }

  return { allowed: true, nextStatus };
}

// ── GST computation (integer basis-points; no floating-point money) ───────────
export interface GstComponents {
  /** Charged GST rate in bps */
  cgstBps:             number;
  sgstBps:             number;
  igstBps:             number;
  taxableAmountPaise:  number;
  cgstAmountPaise:     number;
  sgstAmountPaise:     number;
  igstAmountPaise:     number;
  grossAmountPaise:    number;
}

/**
 * Computes CGST/SGST (intra-state) or IGST (inter-state) from taxable paise.
 *
 * Intra-state: CGST = floor(igstRateBps / 2); SGST = igstRateBps - CGST.
 *   (picks up the odd bps on SGST, per CGST Act convention)
 * Inter-state: IGST = igstRateBps.
 *
 * All amounts computed via integer floor division:
 *   amount = floor(taxable * rateBps / 10_000)
 *
 * Any 1-paise rounding residual is acceptable per GSTIN portal practice.
 */
export function computeGst(
  taxableAmountPaise: number,
  igstRateBps:        number,
  isInterState:       boolean,
): GstComponents {
  let cgstBps = 0, sgstBps = 0, igstBps = 0;
  let cgstAmountPaise = 0, sgstAmountPaise = 0, igstAmountPaise = 0;

  if (isInterState) {
    igstBps          = igstRateBps;
    igstAmountPaise  = Math.floor((taxableAmountPaise * igstRateBps) / 10_000);
  } else {
    cgstBps          = Math.floor(igstRateBps / 2);
    sgstBps          = igstRateBps - cgstBps;  // odd bps land on SGST
    cgstAmountPaise  = Math.floor((taxableAmountPaise * cgstBps) / 10_000);
    sgstAmountPaise  = Math.floor((taxableAmountPaise * sgstBps) / 10_000);
  }

  const grossAmountPaise =
    taxableAmountPaise + cgstAmountPaise + sgstAmountPaise + igstAmountPaise;

  return {
    cgstBps, sgstBps, igstBps,
    taxableAmountPaise,
    cgstAmountPaise, sgstAmountPaise, igstAmountPaise,
    grossAmountPaise,
  };
}

// ── TDS 194C deduction (integer paise) ───────────────────────────────────────
/**
 * TDS under Section 194C of the Income Tax Act 1961.
 *
 *   Individual/HUF contractor:     1% of taxable amount
 *   Any other contractor (company): 2% of taxable amount
 *
 * TDS is computed on the TAXABLE amount (pre-GST), not gross.
 * Returns floor paise — any residual 1-paise is acceptable.
 */
export function computeTds194c(
  taxableAmountPaise: number,
  isIndividualOrHuf:  boolean,
): number {
  const rateBps = isIndividualOrHuf ? 100 : 200; // 1% or 2% in bps
  return Math.floor((taxableAmountPaise * rateBps) / 10_000);
}

// ── BOQ variation ─────────────────────────────────────────────────────────────
/**
 * Computes percentage deviation between original BOQ amount and current bill.
 * Returns negative for under-run, positive for over-run.
 * Returns 0 if originalAmountPaise = 0 (avoids division by zero).
 */
export function computeBoqVariationPct(
  originalAmountPaise: number,
  currentAmountPaise:  number,
): number {
  if (originalAmountPaise === 0) return 0;
  return ((currentAmountPaise - originalAmountPaise) / originalAmountPaise) * 100;
}
