/**
 * src/app/api/limsy/hearings/route.ts
 *
 * LIMSY Supreme Court Standard — Cause-List & Hearing Management API
 * ==================================================================
 * REMEDIATION (P0 Sprint — 2026-07-24):
 *   - POST now inserts canonical schema fields matching limsy_hearings in SQL migration.
 *     Removed non-existent `hearingDate`, `benchAllocation`, `causeListItem` mappings.
 *     Canonical columns: scheduledDate, adjournmentCount (default 0), createdBy.
 *   - Enum validation on status override using VALID_LIMSY_HEARING_STATUSES.
 *   - All date fields use Date objects — TIMESTAMPTZ round-trip is safe via Drizzle.
 * SECURITY REMEDIATION (2026-07-27):
 *   - Updated IP extraction to prioritize Cloudflare's authoritative `cf-connecting-ip` header.
 *   - Added a PATCH handler with explicit `tenantId` match predicates in the query `WHERE` clause for defense-in-depth isolation.
 * BLOCKER REMEDIATION:
 *   - CR-001: Removed client-writable adjournmentCount. Now uses SQL database-side increment on 'adjourned' status.
 *   - CR-002: Fixed auditLogs actor string format to enforce `user:${ctx.userId}`.
 *
 * RBAC:
 *   - GET   → "architect"  (protects sensitive pre-published data like proceedings_summary)
 *   - POST  → "architect"  (scheduling a hearing is a privileged docket action)
 *   - PATCH → "architect"  (updating a hearing lifecycle is a privileged docket action)
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import { limsyHearings, auditLogs, VALID_LIMSY_HEARING_STATUSES } from "@/db/schema";
import type { SQL } from "drizzle-orm";
import { asc, eq, and, sql } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET — Retrieve tenant-scoped hearing cause-list
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    // Elevated to "architect" to protect detailed minutes and proceedings summaries
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const data = await withTenant(ctx.tenantId, async (tx) => {
      return tx.select().from(limsyHearings).orderBy(asc(limsyHearings.id));
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[LIMSY] hearings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Schedule a new cause-list hearing
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));

    // Required field validation — matches NOT NULL constraints in 0003_limsys_workflow.sql
    if (!body.caseId || !body.scheduledDate || body.hearingNumber === undefined) {
      return NextResponse.json(
        {
          error: "Required fields: caseId, scheduledDate, hearingNumber.",
        },
        { status: 400 }
      );
    }

    const hearingNumber = Number(body.hearingNumber);
    if (isNaN(hearingNumber) || hearingNumber < 1) {
      return NextResponse.json(
        { error: "hearingNumber must be a positive integer." },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(body.scheduledDate);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledDate format." }, { status: 400 });
    }

    // Enum validation on optional status override
    let status: (typeof VALID_LIMSY_HEARING_STATUSES)[number] = "scheduled";
    if (body.status !== undefined) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_HEARING_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_HEARING_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      status = trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number];
    }

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const actor = `user:${ctx.userId}`; // CR-002: Hardened Actor format

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(limsyHearings)
        .values({
          tenantId: ctx.tenantId,
          caseId: Number(body.caseId),
          hearingNumber,
          scheduledDate,
          status,
          boardPosition: body.boardPosition ? Number(body.boardPosition) : null,
          courtRoom: body.courtRoom ? String(body.courtRoom).trim() : null,
          sessionType: body.sessionType ? String(body.sessionType).trim() : "regular",
          adjournmentCount: 0, // Always initialise at zero; incremented via PATCH on adjournment
          appearances: body.appearances ?? null,
          documentLinks: body.documentLinks ?? null,
          complianceDeadline: body.complianceDeadline ? new Date(body.complianceDeadline) : null,
          complianceNotes: body.complianceNotes ? String(body.complianceNotes).trim() : null,
          createdBy: ctx.userId,
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor, // CR-002
        action: `limsy.hearing.schedule:${inserted.hearingNumber}`,
        target: `case:${inserted.caseId}`,
        severity: "warn",
        ipAddress: ip,
      });

      return inserted;
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("[LIMSY] hearing POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update hearing status, actual date, or adjournment count
// ─────────────────────────────────────────────────────────────────────────────

type HearingPatch = Partial<typeof limsyHearings.$inferInsert> & {
  adjournmentCount?: number | SQL;
};

export async function PATCH(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "architect");
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json({ error: "Hearing ID is required." }, { status: 400 });
    }

    const patch: HearingPatch = {};

    if (body.status !== undefined) {
      const trimmedStatus = String(body.status).trim();
      if (
        !VALID_LIMSY_HEARING_STATUSES.includes(
          trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_LIMSY_HEARING_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      patch.status = trimmedStatus as (typeof VALID_LIMSY_HEARING_STATUSES)[number];

      // CR-001: Safely increment adjournment count on db side ONLY when status transitions to adjourned
      if (patch.status === "adjourned") {
        patch.adjournmentCount = sql`${limsyHearings.adjournmentCount} + 1`;
        
        if (body.adjournmentReason !== undefined) {
          patch.adjournmentReason = String(body.adjournmentReason).trim();
        }
        if (body.adjournedBy !== undefined) {
          patch.adjournedBy = String(body.adjournedBy).trim();
        }
      }
    }

    if (body.actualDate !== undefined) {
      if (body.actualDate === null) {
        patch.actualDate = null;
      } else {
        const actualDate = new Date(body.actualDate);
        if (isNaN(actualDate.getTime())) {
          return NextResponse.json({ error: "Invalid actualDate format." }, { status: 400 });
        }
        patch.actualDate = actualDate;
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    patch.updatedBy = ctx.userId;
    patch.updatedAt = new Date();

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";
      
    const actor = `user:${ctx.userId}`; // CR-002: Hardened Actor format

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [updated] = await tx
        .update(limsyHearings)
        .set(patch)
        .where(
          and(
            eq(limsyHearings.id, Number(body.id)),
            eq(limsyHearings.tenantId, ctx.tenantId)
          )
        )
        .returning();

      if (updated) {
        await tx.insert(auditLogs).values({
          tenantId: ctx.tenantId,
          actor, // CR-002
          action: `limsy.hearing.update:${updated.hearingNumber}`,
          target: String(updated.id),
          severity: "warn",
          ipAddress: ip,
        });
      }

      return updated;
    });

    if (!row) {
      return NextResponse.json({ error: "Hearing not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[LIMSY] hearing PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}