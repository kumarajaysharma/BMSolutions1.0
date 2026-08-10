import { NextResponse, NextRequest } from "next/server";
import { db, withTenant } from "@/db";
import { nidhivanDprs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { createHash } from "crypto";

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
        .from(nidhivanDprs)
        .where(eq(nidhivanDprs.tenantId, tenantId))
        .orderBy(desc(nidhivanDprs.createdAt));
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("[NIDHIVAN] DPRs Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "developer");
    if (denied) return denied;

    const tenantId = Number(ctx.tenantId);
    const body = await req.json().catch(() => ({}));

    const { projectId, dprNumber, reportDetails } = body;
    if (!projectId || !dprNumber || !reportDetails) {
      return NextResponse.json(
        { error: "projectId, dprNumber, and reportDetails are required." },
        { status: 400 }
      );
    }

    const rawStringData = `${tenantId}:${projectId}:${dprNumber}:${JSON.stringify(reportDetails)}`;
    const hash = createHash("sha256").update(rawStringData).digest("hex");

    const newDpr = await withTenant(tenantId, async (tx) => {
      const [inserted] = await tx
        .insert(nidhivanDprs)
        .values({
          tenantId,
          projectId: Number(projectId),
          dprNumber: String(dprNumber).trim(),
          reportDetails,
          integrityHash: hash,
        })
        .returning();
      return inserted;
    });

    return NextResponse.json({ success: true, data: newDpr }, { status: 201 });
  } catch (error) {
    console.error("[NIDHIVAN] DPR Creation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}