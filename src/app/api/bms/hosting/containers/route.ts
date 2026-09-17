/**
 * src/app/api/bms/hosting/containers/route.ts
 * BMS Hosting — Container Management (ADMIN ONLY)
 * ADR-001: All queries via withTenant()
 * SECURITY: Restricted to owner/admin — proxy.ts enforces via ADMIN_PREFIXES
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withTenant } from "@/lib/tenant";
import { bmsHostContainers } from "@/db/schema";
import { withErrorHandler, getPgError } from "@/lib/api-handler";
import { z } from "zod";

const CreateContainerSchema = z.object({
  siteSlug:   z.string().min(2).max(255),
  image:      z.string().default("bms/site-runtime:latest"),
  port:       z.number().int().min(1024).max(65535).default(10000),
  region:     z.string().default("ap-south-1"),
  cpuLimit:   z.number().min(0.1).max(16).default(1.0),
  memLimitMb: z.number().int().min(128).max(65536).default(512),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  const userRole = req.headers.get("x-user-role") ?? "";
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(userRole))
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });

  const containers = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsHostContainers)
      .where(eq(bmsHostContainers.tenantId, tenantId))
  );
  return NextResponse.json(containers);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  const userRole = req.headers.get("x-user-role") ?? "";
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(userRole))
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });

  const body   = await req.json();
  const parsed = CreateContainerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const [container] = await withTenant(tenantId, async (tx) =>
    tx.insert(bmsHostContainers)
      .values({ tenantId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(container, { status: 201 });
});
