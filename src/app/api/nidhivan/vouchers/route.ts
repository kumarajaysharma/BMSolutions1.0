/**
 * src/app/api/nidhivan/vouchers/route.ts
 *
 * GET  /api/nidhivan/vouchers  — list journal vouchers for the authenticated tenant
 * POST /api/nidhivan/vouchers  — post a new double-entry journal voucher
 *
 * Double-entry invariant (ICAI CoA):
 *   Sum(debit lines) = Sum(credit lines) in paise.
 *   Enforced server-side before insert; any imbalance → 400.
 *
 * VANTAI VT-N-004 gate:
 *   If any ledger line references an is_inter_company account,
 *   the voucher is blocked until the BNLV consolidation officer clears it.
 *
 * Ledger entries are IMMUTABLE (no UPDATE/DELETE). Corrections via
 * reversal vouchers (reversalVoucherId → creates opposing entry set).
 *
 * POST body:
 *   {
 *     voucherType:    "JOURNAL" | "PAYMENT" | "RECEIPT" | "CONTRA" |
 *                     "DEBIT_NOTE" | "CREDIT_NOTE" | "RA_BILL_BOOKING",
 *     voucherDate:    string (ISO date),
 *     fiscalYear:     string (e.g. "2026-27"),
 *     period:         number (1–12),
 *     narration:      string,
 *     reversalOf?:    number (voucherId this reverses),
 *     lines: Array<{
 *       ledgerAccountId:  number,
 *       debitAmountPaise: number,   // 0 if credit line
 *       creditAmountPaise: number,  // 0 if debit line
 *       currencyCode?:    string,   // default "INR"
 *       lineNarration?:   string,
 *     }>,
 *   }
 *
 * Security:
 *   - Minimum role: 'admin' (financial posting gate).
 *   - All mutations inside withTenant() transaction (ADR-001/002).
 *   - nidhivan_ledger_entries: REVOKE DELETE/TRUNCATE → append-only.
 */

import { NextRequest, NextResponse }     from "next/server";
import { desc, eq, inArray }              from "drizzle-orm";
import { withErrorHandler }               from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withTenant }                     from "@/db";
import {
  nidhivanJournalVouchers,
  nidhivanLedgerEntries,
  nidhivanChartOfAccounts,
}                                         from "@/db/schema";
import { gateVtN004InterCompany }         from "@/lib/nidhivan/vantai-gates";

export const dynamic = "force-dynamic";

interface LedgerLine {
  ledgerAccountId:   number;
  debitAmountPaise:  number;
  creditAmountPaise: number;
  currencyCode?:     string;
  lineNarration?:    string;
}

const VALID_VOUCHER_TYPES = new Set([
  "JOURNAL", "PAYMENT", "RECEIPT", "CONTRA",
  "DEBIT_NOTE", "CREDIT_NOTE", "RA_BILL_BOOKING",
]);

// ─────────────────────────────────────────────────────────────────────────────
// GET — list vouchers
// ─────────────────────────────────────────────────────────────────────────────
async function _GET(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const url        = new URL(req.url);
  const fiscalYear = url.searchParams.get("fiscalYear");
  const period     = url.searchParams.get("period");

  const vouchers = await withTenant(ctx.tenantId, (tx) => {
    let q = tx
      .select()
      .from(nidhivanJournalVouchers)
      .$dynamic();

    if (fiscalYear) q = q.where(eq(nidhivanJournalVouchers.fiscalYear, fiscalYear));
    if (period)     q = q.where(eq(nidhivanJournalVouchers.period, parseInt(period, 10)));

    return q.orderBy(desc(nidhivanJournalVouchers.voucherDate));
  });

  return NextResponse.json({ success: true, data: vouchers });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — post journal voucher
// ─────────────────────────────────────────────────────────────────────────────
async function _POST(req: NextRequest) {
  const ctx    = getRequestContext(req);
  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const body = await req.json();
  const {
    voucherType,
    voucherDate,
    fiscalYear,
    period,
    narration,
    reversalOf,
    lines,
  } = body;

  // ── Structural validation ───────────────────────────────────────────────────
  if (!VALID_VOUCHER_TYPES.has(voucherType)) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: `Invalid voucherType: ${voucherType}.` },
      { status: 400 },
    );
  }

  if (!voucherDate || !fiscalYear || !period || !narration) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "voucherDate, fiscalYear, period, and narration are required." },
      { status: 400 },
    );
  }

  if (!Array.isArray(lines) || lines.length < 2) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", detail: "A minimum of 2 ledger lines is required for a valid voucher." },
      { status: 400 },
    );
  }

  // ── Validate all paise values are non-negative integers ────────────────────
  for (const line of lines as LedgerLine[]) {
    if (!Number.isInteger(line.debitAmountPaise)  || line.debitAmountPaise  < 0 ||
        !Number.isInteger(line.creditAmountPaise) || line.creditAmountPaise < 0) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", detail: "debitAmountPaise and creditAmountPaise must be non-negative integers (ADR-004)." },
        { status: 400 },
      );
    }
    if (line.debitAmountPaise === 0 && line.creditAmountPaise === 0) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", detail: "A ledger line cannot have both debit and credit = 0." },
        { status: 400 },
      );
    }
    if (line.debitAmountPaise > 0 && line.creditAmountPaise > 0) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", detail: "A ledger line cannot carry both debit and credit amounts." },
        { status: 400 },
      );
    }
  }

  // ── Double-entry balance check (ICAI invariant) ─────────────────────────────
  const totalDebit  = (lines as LedgerLine[]).reduce((s, l) => s + l.debitAmountPaise,  0);
  const totalCredit = (lines as LedgerLine[]).reduce((s, l) => s + l.creditAmountPaise, 0);

  if (totalDebit !== totalCredit) {
    return NextResponse.json(
      {
        error:   "DOUBLE_ENTRY_IMBALANCE",
        detail:  `Sum(Debit) = ${totalDebit} paise ≠ Sum(Credit) = ${totalCredit} paise. ` +
                 "ICAI double-entry invariant violated.",
        totalDebitPaise:  totalDebit,
        totalCreditPaise: totalCredit,
        diffPaise:        Math.abs(totalDebit - totalCredit),
      },
      { status: 400 },
    );
  }

  // ── VT-N-004: inter-company detection ──────────────────────────────────────
  const accountIds = (lines as LedgerLine[]).map((l) => l.ledgerAccountId);
  const accounts   = await withTenant(ctx.tenantId, (tx) =>
    tx
      .select({ id: nidhivanChartOfAccounts.id, isInterCompany: nidhivanChartOfAccounts.isInterCompany })
      .from(nidhivanChartOfAccounts)
      .where(inArray(nidhivanChartOfAccounts.id, accountIds)),
  );

  const hasInterCompany = accounts.some((a) => a.isInterCompany);
  const g4 = await gateVtN004InterCompany(hasInterCompany);

  if (g4.status !== "PASSED") {
    return NextResponse.json(
      {
        error:  "VANTAI_PENDING",
        detail: "VANTAI VT-N-004 gate must be cleared by BNLV consolidation officer before posting.",
        gate:   g4,
      },
      { status: 403 },
    );
  }

  // ── Atomic: insert voucher + ledger entries ─────────────────────────────────
  const result = await withTenant(ctx.tenantId, async (tx) => {
    const [voucher] = await tx
      .insert(nidhivanJournalVouchers)
      .values({
        tenantId:          ctx.tenantId,
        voucherType,
        voucherDate:       new Date(voucherDate),
        fiscalYear,
        period:            parseInt(String(period), 10),
        narration,
        reversalVoucherId: reversalOf ?? null,
        createdById:       ctx.userId,
      })
      .returning();

    // Insert ledger entries (append-only; DELETE/TRUNCATE revoked on studio_app)
    await tx
      .insert(nidhivanLedgerEntries)
      .values(
        (lines as LedgerLine[]).map((line, idx) => ({
          tenantId:          ctx.tenantId,
          voucherId:         voucher.id,
          ledgerAccountId:   line.ledgerAccountId,
          debitAmountPaise:  line.debitAmountPaise,
          creditAmountPaise: line.creditAmountPaise,
          currencyCode:      line.currencyCode ?? "INR",
          lineNarration:     line.lineNarration ?? null,
          sequenceNo:        idx + 1,
        })),
      );

    return voucher;
  });

  return NextResponse.json(
    {
      success: true,
      data:    result,
      _summary: {
        totalDebitPaise:  totalDebit,
        totalCreditPaise: totalCredit,
        lineCount:        lines.length,
      },
    },
    { status: 201 },
  );
}

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);
