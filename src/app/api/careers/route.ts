/**
 * src/app/api/careers/route.ts
 *
 * Hardened Career Applications API Route
 * - GET: Protected by admin role check (prevents public exposure of applicant PII).
 * - POST: Public intake with input sanitization, length capping, and audit logging.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobApplications, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  
  // Secure the GET endpoint: only internal staff with minimum 'admin' role can view candidate PII
  const denied = requireRole(ctx, "admin");
  if (denied) return denied;

  const rows = await db
    .select()
    .from(jobApplications)
    .orderBy(desc(jobApplications.id))
    .limit(60);
    
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    // Strict input validation for public PII intake
    if (!name || name.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid name (max 120 chars) and email are required." },
        { status: 400 }
      );
    }

    const tenantIdHeader = req.headers.get("x-tenant-id");
    const tenantId: number = tenantIdHeader ? Number(tenantIdHeader) : Number(body.tenantId ?? 1);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

    const roleSlug = String(body.roleSlug ?? "general").slice(0, 60);
    const roleTitle = String(body.roleTitle ?? "General application").slice(0, 120);

    const [row] = await db
      .insert(jobApplications)
      .values({
        tenantId,
        roleSlug,
        roleTitle,
        name,
        candidateName: name,
        email,
        position: roleTitle,
        portfolio: String(body.portfolio ?? "").slice(0, 300),
        note: String(body.note ?? "").slice(0, 2000),
      })
      .returning();

    // Audit log entry for DPDP compliance tracking
    await db.insert(auditLogs).values({
      tenantId,
      actor: "careers-page",
      action: `job.application:${roleSlug}`,
      target: email,
      ipAddress: ip,
    });

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (error) {
    console.error("Careers submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}