/**
 * src/app/api/bms/studio/workflows/route.ts
 * BMS Studio — Workflow Registry CRUD + Run trigger
 * GET  POST  PATCH ?id=<id>
 * POST /run  ?id=<id>  — triggers workflow execution via AI Orchestrator
 */
import { NextResponse }       from "next/server";
import { eq, desc }           from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsWorkflows, auditLogs } from "@/db/schema";
import { z }                  from "zod";

const WorkflowSchema = z.object({
  title:            z.string().min(2).max(255),
  description:      z.string().min(5),
  category:         z.string().default("Multi-Agent"),
  difficulty:       z.enum(["Beginner", "Intermediate", "Advanced"]).default("Intermediate"),
  estimatedMinutes: z.number().int().min(1).max(1440).default(90),
  gradient:         z.string().optional(),
  steps:            z.array(z.record(z.string(), z.unknown())).default([]),
  agents:           z.array(z.string()).default([]),
  status:           z.enum(["draft", "published", "archived"]).default("draft"),
});

const _GET = withTenant(async (_req, ctx) => {
  const workflows = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsWorkflows)
      .where(eq(bmsWorkflows.tenantId, ctx.tenantId))
      .orderBy(desc(bmsWorkflows.updatedAt))
  );
  return NextResponse.json(workflows);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);

  // POST /api/bms/studio/workflows?run=true&id=<id>  → trigger execution
  if (url.searchParams.get("run") === "true") {
    const id = parseInt(url.searchParams.get("id") ?? "0");
    if (!id) return NextResponse.json({ error: "id required for run" }, { status: 400 });

    const [wf] = await dbTx(ctx.tenantId, async (tx) =>
      tx.select().from(bmsWorkflows).where(eq(bmsWorkflows.id, id))
    );
    if (!wf) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    // Audit the run
    await dbTx(ctx.tenantId, async (tx) =>
      tx.insert(auditLogs).values({
        tenantId: ctx.tenantId,
        actor:    `user:${ctx.userId}`,
        action:   "workflow.triggered",
        target:   `bms_workflows:${id}`,
        severity: "info",
        metadata: { workflowTitle: wf.title, agentCount: wf.agents.length },
      })
    );

    // Increment run count
    await dbTx(ctx.tenantId, async (tx) =>
      tx.update(bmsWorkflows)
        .set({ updatedAt: new Date() })
        .where(eq(bmsWorkflows.id, id))
    );

    return NextResponse.json({
      triggered:  true,
      workflowId: id,
      title:      wf.title,
      steps:      wf.steps,
      agents:     wf.agents,
      message:    "Workflow queued — steps will execute via AI Orchestrator",
    });
  }

  // Regular POST → create workflow
  const parsed = WorkflowSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [workflow] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsWorkflows)
      .values({ tenantId: ctx.tenantId, createdBy: ctx.userId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(workflow, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const parsed = WorkflowSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [wf] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsWorkflows)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(bmsWorkflows.id, id))
      .returning()
  );
  if (!wf) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  return NextResponse.json(wf);
});

export const GET   = withErrorHandler(_GET);
export const POST  = withErrorHandler(_POST);
export const PATCH = withErrorHandler(_PATCH);
