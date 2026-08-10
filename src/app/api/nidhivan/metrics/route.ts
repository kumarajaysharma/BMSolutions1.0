import { NextResponse, NextRequest } from "next/server";
import { db, withTenant } from "@/db";
import { nidhivanFinancialMetrics } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "viewer");
    if (denied) return denied;

    const tenantId = Number(ctx.tenantId);

    const data = await withTenant(tenantId, async (tx) => {
      return await tx
        .select()
        .from(nidhivanFinancialMetrics)
        .where(eq(nidhivanFinancialMetrics.tenantId, tenantId))
        .orderBy(desc(nidhivanFinancialMetrics.createdAt))
        .limit(1);
    });

    const rows = data as Array<unknown>;
    return NextResponse.json({ success: true, data: rows[0] ?? null }, { status: 200 });
  } catch (error) {
    console.error("[NIDHIVAN] Metrics Fetch Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error fetching metrics." },
      { status: 500 }
    );
  }
}