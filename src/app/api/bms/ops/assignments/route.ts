/**
 * src/app/api/bms/ops/assignments/route.ts
 * BMS Ops — Assignment Management
 * GET (?status=<status>)  POST  PATCH ?id=<id>
 * Status filter pushed into WHERE clause — avoids implicit-any on .filter()
 */
import { NextResponse }       from "next/server";
import { eq, and, desc }      from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsAssignments }     from "@/db/schema";
import { z }                  from "zod";

const AssignmentStatusEnum = z.enum(["open", "submitted", "graded", "closed"]);

const CreateAssignmentSchema = z.object({
  code:         z.string().min(1).max(20),
  title:        z.string().min(3).max(255),
  course:       z.string().min(2),
  vertical:     z.string().default("Agentic AI"),
  description:  z.string().min(10),
  prompt:       z.string().min(10),
  deliverables: z.array(z.string()).default([]),
  rubric:       z.string().optional(),
  maxScore:     z.number().int().min(1).max(1000).default(100),
  dueInDays:    z.number().int().min(1).max(365).default(7),
  status:       AssignmentStatusEnum.default("open"),
});

const _GET = withTenant(async (req, ctx) => {
  const statusFilter = new URL(req.url).searchParams.get("status");

  const rows = await dbTx(ctx.tenantId, async (tx) => {
    if (statusFilter) {
      return tx.select().from(bmsAssignments)
        .where(and(
          eq(bmsAssignments.tenantId, ctx.tenantId),
          eq(bmsAssignments.status,   statusFilter)
        ))
        .orderBy(desc(bmsAssignments.createdAt));
    }
    return tx.select().from(bmsAssignments)
      .where(eq(bmsAssignments.tenantId, ctx.tenantId))
      .orderBy(desc(bmsAssignments.createdAt));
  });
  return NextResponse.json(rows);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — architect or above required" }, { status: 403 });
  }
  const parsed = CreateAssignmentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  // withErrorHandler catches 23505 (duplicate code) → 409
  const [assignment] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsAssignments)
      .values({ tenantId: ctx.tenantId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(assignment, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const partial = z.object({
    status: AssignmentStatusEnum.optional(),
    score:  z.number().min(0).max(1000).optional(),
    rubric: z.string().optional(),
  });
  const parsed = partial.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [assignment] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsAssignments).set(parsed.data)
      .where(eq(bmsAssignments.id, id)).returning()
  );
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  return NextResponse.json(assignment);
});

export const GET   = withErrorHandler(_GET);
export const POST  = withErrorHandler(_POST);
export const PATCH = withErrorHandler(_PATCH);
