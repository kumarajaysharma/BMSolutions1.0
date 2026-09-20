/**
 * src/app/api/bms/ops/code-red/route.ts
 * BMS Ops Intelligence — Code Red Business Cases
 *
 * Restricted to owner/admin/architect — audit logged on every POST.
 * Errors: Direct 23505 catch unwraps pg cause to guarantee 409 on duplicate code.
 */
import { NextResponse }         from "next/server";
import { eq, desc }             from "drizzle-orm";
import { withTenant }           from "@/lib/tenant";
import { withTenant as dbTx }   from "@/db";
import { withErrorHandler }     from "@/lib/api-handler";
import { bmsCodeRedCases, auditLogs } from "@/db/schema";
import { z }                    from "zod";

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

const _GET = withTenant(async (_req, ctx) => {
  const cases = await dbTx(ctx.tenantId, async (tx) =>
    tx.select()
      .from(bmsCodeRedCases)
      .where(eq(bmsCodeRedCases.tenantId, ctx.tenantId))
      .orderBy(desc(bmsCodeRedCases.createdAt))
  );
  return NextResponse.json(cases);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — architect or above required" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = CreateCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const [codeRedCase] = await dbTx(ctx.tenantId, async (tx) => {
      const [row] = await tx.insert(bmsCodeRedCases)
        .values({ tenantId: ctx.tenantId, ...parsed.data })
        .returning();

      // Audit log — ADR-001 actor format
      await tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor:    `user:${ctx.userId}`,
        action:   "code_red.created",
        target:   `bms_code_red_cases:${row.id}`,
        severity: "info",
        metadata: { code: parsed.data.code, priority: parsed.data.priority },
      });

      return [row];
    });
    return NextResponse.json(codeRedCase, { status: 201 });
  } catch (err: unknown) {
    const pgCode =
      (err as { code?: string })?.code ||
      (err as { cause?: { code?: string } })?.cause?.code;

    if (pgCode === "23505") {
      return NextResponse.json(
        { error: "Duplicate — resource already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);