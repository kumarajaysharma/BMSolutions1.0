import { NextResponse, NextRequest } from "next/server";
import { db, withTenant } from "@/db";
import { nidhivanProjects } from "@/db/schema";
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
        .from(nidhivanProjects)
        .where(eq(nidhivanProjects.tenantId, tenantId))
        .orderBy(desc(nidhivanProjects.createdAt));
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("[NIDHIVAN] Projects Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}