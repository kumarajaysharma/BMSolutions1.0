/**
 * src/app/api/limsy/cases/route.ts
 *
 * LIMSY Supreme Court Standard — Case Workflow Automation API
 * ==========================================================
 * REMEDIATION (P0 Sprint — 2026-07-24):
 *   - Defect 1: POST now inserts canonical schema fields (petitioner, respondent,
 *               caseType, subjectMatter, internalRef, courtLevel, courtName).
 *               Removed hallucinated title/filingType/benchCoram mappings.
 *   - Defect 3: PATCH validates status against VALID_LIMSY_CASE_STATUSES before
 *               entering withTenant(), returning 400 with explicit enum list on mismatch.
 *   - Defect 4: patch object typed as Partial<typeof limsyCases.$inferInsert>,
 *               eliminating the `as any` cast entirely.
 * SECURITY REMEDIATION (2026-07-27):
 *   - Updated IP extraction to prioritize Cloudflare's authoritative `cf-connecting-ip` header.
 *   - Added explicit `tenantId` match predicate to the PATCH query `WHERE` clause for defense-in-depth RLS separation.
 * 
 * BLOCKER REMEDIATION (Current):
 *   - CR-002: Fixed auditLogs actor string format to enforce `user:${ctx.userId}` in POST and PATCH.
 *   - CR-003: Implemented role-gated column projection in GET to restrict sensitive party data.
 *   - CR-004: Catch Postgres unique constraint violations (code 23505) for duplicate internalRef to prevent 500 errors.
 *
 * RBAC:
 *   - GET  → "developer"  (read docket list; sensitive operative text gated to architect+)
 *   - POST → "architect"  (case intake is a privileged legal action)
 *   - PATCH→ "architect"  (status mutation on a legal record)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import {
  limsyCases,
  auditLogs,
  VALID_LIMSY_CASE_STATUSES,
  VALID_LIMSY_CASE_TYPES,
  VALID_COURT_LEVELS,
} from "@/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Retrieve tenant-scoped case docket
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "developer");
    if (denied) return denied;

    // CR-003: Party-identifying and operative fields restricted to architect+
    const fullAccess = ["owner", "admin", "architect"].includes(ctx.role ?? "");

    const data = await withTenant(ctx.tenantId, async (tx) => {
      if (fullAccess) {
        return tx.select().from(limsyCases).orderBy(asc(limsyCases.id));
      }
      
      // Developer/designer/viewer: docket metadata only
      return tx.select({
        id:              limsyCases.id,
        tenantId:        limsyCases.tenantId,
        caseNumber:      limsyCases.caseNumber,
        internalRef:     limsyCases.internalRef,
        courtLevel:      limsyCases.courtLevel,
        courtName:       limsyCases.courtName,
        courtLocation:   limsyCases.courtLocation,
        caseType:        limsyCases.caseType,
        status:          limsyCases.status,
        filingDate:      limsyCases.filingDate,
        admissionDate:   limsyCases.admissionDate,
        nextHearingDate: limsyCases.nextHearingDate,
        urgencyFlag:     limsyCases.urgencyFlag,
        priorityLevel:   limsyCases.priorityLevel,
        parentCaseId:    limsyCases.parentCaseId,
        createdAt:       limsyCases.createdAt,
        updatedAt:       limsyCases.updatedAt,
      }).from(limsyCases).orderBy(asc(limsyCases.id));
    });

    return NextResponse.json(data);
  } catch (error: unknown) { // Applied strict TS typing
    console.error("[LIMSY] cases GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — File a new petition / appeal
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    // Required field validation — matches NOT NULL constraints in 0003_limsys_workflow.sql
    if (
      !body.internalRef ||
      !body.courtLevel ||
      !body.courtName ||
      !body.caseType ||
      !body.petitioner ||
      !body.respondent ||
      !body.subjectMatter
    ) {
      return NextResponse.json(
        {
          error:
            "Required fields: internalRef, courtLevel, courtName, caseType, petitioner, respondent, subjectMatter.",
        },
        { status: 400 }
      );
    }

    // Enum validation — pre-flight before database round-trip
    const courtLevel = String(body.courtLevel).trim();
    if (!VALID_COURT_LEVELS.includes(courtLevel as (typeof VALID_COURT_LEVELS)[number])) {
      return NextResponse.json(
        { error: `Invalid courtLevel. Must be one of: ${VALID_COURT_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }

    const caseType = String(body.caseType).trim();
    if (!VALID_LIMSY_CASE_TYPES.includes(caseType as (typeof VALID_LIMSY_CASE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid caseType. Must be one of: ${VALID_LIMSY_CASE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Optional status override — default is "intake" per schema
    let status: (typeof VALID_LIMSY_CASE_STATUSES)[number] = "intake";
    if (body.status) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_CASE_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_CASE_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      status = trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number];
    }

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const actor = `user:${ctx.userId}`; // CR-002

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(limsyCases)
        .values({
          tenantId: ctx.tenantId,
          // Core identifiers
          caseNumber: body.caseNumber ? String(body.caseNumber).trim() : null,
          internalRef: String(body.internalRef).trim(),
          // Court classification
          courtLevel: courtLevel as (typeof VALID_COURT_LEVELS)[number],
          courtName: String(body.courtName).trim(),
          courtLocation: body.courtLocation ? String(body.courtLocation).trim() : null,
          // Case classification
          caseType: caseType as (typeof VALID_LIMSY_CASE_TYPES)[number],
          status,
          // Parties
          petitioner: String(body.petitioner).trim(),
          respondent: String(body.respondent).trim(),
          petitionerAdv: body.petitionerAdv ? String(body.petitionerAdv).trim() : null,
          respondentAdv: body.respondentAdv ? String(body.respondentAdv).trim() : null,
          // Dates
          filingDate: body.filingDate ? new Date(body.filingDate) : null,
          admissionDate: body.admissionDate ? new Date(body.admissionDate) : null,
          nextHearingDate: body.nextHearingDate ? new Date(body.nextHearingDate) : null,
          // Substance
          subjectMatter: String(body.subjectMatter).trim(),
          reliefSought: body.reliefSought ? String(body.reliefSought).trim() : null,
          actsSections: body.actsSections ? String(body.actsSections).trim() : null,
          tags: body.tags ? String(body.tags).trim() : null,
          // Priority
          urgencyFlag: Boolean(body.urgencyFlag ?? false),
          priorityLevel: body.priorityLevel ? Number(body.priorityLevel) : 3,
          // Relationships
          parentCaseId: body.parentCaseId ? Number(body.parentCaseId) : null,
          relatedCases: body.relatedCases ?? null,
          documentLinks: body.documentLinks ?? null,
          // Audit
          createdBy: ctx.userId,
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor, // CR-002
        action: `limsy.case.file:${inserted.caseType}`,
        target: inserted.internalRef,
        severity: "warn",
        ipAddress: ip,
      });

      return inserted;
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: unknown) {
    console.error("[LIMSY] case POST error:", error);

    // CR-004: Bulletproof check for Neon/Postgres unique constraint errors
    const errObj = error as Record<string, any>;
    const errString = String(error).toLowerCase();

    if (
      errObj?.code === '23505' || 
      errString.includes('23505') || 
      errString.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { 
          error: "A case with this internal reference already exists.",
          detail: errObj?.detail || "Unique constraint violation"
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update case status or next hearing date
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Case ID is required." }, { status: 400 });
    }

    // Strict Drizzle-inferred type — no `as any` cast
    const patch: Partial<typeof limsyCases.$inferInsert> = {};

    // Enum validation before entering the transaction
    if (body.status !== undefined) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_CASE_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_CASE_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      patch.status = trimmedStatus as (typeof VALID_LIMSY_CASE_STATUSES)[number];
    }

    if (body.nextHearingDate !== undefined) {
      patch.nextHearingDate = body.nextHearingDate ? new Date(body.nextHearingDate) : null;
    }

    if (body.urgencyFlag !== undefined) {
      patch.urgencyFlag = Boolean(body.urgencyFlag);
    }

    if (body.priorityLevel !== undefined) {
      const level = Number(body.priorityLevel);
      if (isNaN(level) || level < 1 || level > 5) {
        return NextResponse.json(
          { error: "priorityLevel must be an integer between 1 and 5." },
          { status: 400 }
        );
      }
      patch.priorityLevel = level;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    // Stamp the updater
    patch.updatedBy = ctx.userId;
    patch.updatedAt = new Date();

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const actor = `user:${ctx.userId}`; // CR-002

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [updated] = await tx
        .update(limsyCases)
        .set(patch)
        .where(
          and(
            eq(limsyCases.id, Number(body.id)),
            eq(limsyCases.tenantId, ctx.tenantId)
          )
        )
        .returning();

      if (updated) {
        await tx.insert(auditLogs).values({
          tenantId: ctx.tenantId,
          actor, // CR-002
          action: `limsy.case.update:${updated.caseNumber ?? updated.internalRef}`,
          target: String(updated.id),
          severity: "warn",
          ipAddress: ip,
        });
      }

      return updated;
    });

    if (!row) {
      return NextResponse.json({ error: "Case not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error: unknown) {
    console.error("[LIMSY] case PATCH error:", error);
    
    // Catch edge-case unique constraint violations on PATCH 
    const errObj = error as Record<string, any>;
    const errString = String(error).toLowerCase();

    if (
      errObj?.code === '23505' || 
      errString.includes('23505') || 
      errString.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { 
          error: "Update failed: Record with this unique identifier already exists.",
          detail: errObj?.detail || "Unique constraint violation"
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}