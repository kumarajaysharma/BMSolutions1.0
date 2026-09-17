/**
 * src/app/api/bms/ops/code-red/route.ts
 * BMS Ops Intelligence — Code Red Cases
 * ADR-001: All queries via withTenant()
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { withTenant } from "@/lib/tenant";
import { bmsCodeRedCases, auditLogs } from "@/db/schema";
import { withErrorHandler, getPgError } from "@/lib/api-handler";
import { z } from "zod";

const CreateCaseSchema = z.object({
  code:          z.string().min(1).max(20),
  title:         z.string().min(3),
  vertical:      z.string().min(2),
  businessUnit:  z.string().default("BMSolutions"),
  problem:       z.string().min(10),
  solution:      z.string().min(10),
  agents:        z.array(z.string()).default([]),
  impact:        z.string().min(5),
  metric:        z.string().default(""),
  roiMultiple:   z.number().min(0).max(100).default(3),
  paybackMonths: z.number().int().min(1).max(60).default(9),
  complexity:    z.enum(["Low", "Medium", "High"]).default("Medium"),
  effortWeeks:   z.number().int().min(1).max(52).default(10),
  priority:      z.enum(["P0", "P1", "P2", "P3"]).default("P1"),
  status:        z.enum(["proposed", "approved", "in_progress", "completed", "cancelled"]).default("proposed"),
  architecture:  z.string().default("hub-spoke"),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cases = await withTenant(tenantId, async (tx) =>
    tx.select().from(bmsCodeRedCases)
      .where(eq(bmsCodeRedCases.tenantId, tenantId))
      .orderBy(desc(bmsCodeRedCases.createdAt))
  );
  return NextResponse.json(cases);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const tenantId = parseInt(req.headers.get("x-tenant-id") ?? "0");
  const userId   = parseInt(req.headers.get("x-user-id") ?? "0");
  const userRole = req.headers.get("x-user-role") ?? "";
  if (!tenantId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin", "architect"].includes(userRole))
    return NextResponse.json({ error: "Forbidden — admin+ required" }, { status: 403 });

  const body   = await req.json();
  const parsed = CreateCaseSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const [codeRedCase] = await withTenant(tenantId, async (tx) => {
      const [row] = await tx.insert(bmsCodeRedCases)
        .values({ tenantId, ...parsed.data })
        .returning();
      await tx.insert(auditLogs).values({
        tenantId,
        actor:  `user:${userId}`,
        action: "code_red.created",
        target: `bms_code_red_cases:${row.id}`,
        severity: "info",
        metadata: { code: parsed.data.code, priority: parsed.data.priority },
      });
      return [row];
    });
    return NextResponse.json(codeRedCase, { status: 201 });
  } catch (err) {
    if (getPgError(err) === "23505")
      return NextResponse.json({ error: "Code already exists in this tenant" }, { status: 409 });
    throw err;
  }
});
