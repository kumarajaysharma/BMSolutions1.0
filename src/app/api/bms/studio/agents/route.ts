/**
 * src/app/api/bms/studio/agents/route.ts
 * BMS Studio — AI Agent Registry CRUD
 * GET  POST  PATCH ?id=<id>  DELETE ?id=<id>
 */
import { NextResponse }       from "next/server";
import { eq, desc }           from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsAiAgents }        from "@/db/schema";
import { z }                  from "zod";

const AgentSchema = z.object({
  name:          z.string().min(2).max(255),
  role:          z.string().min(2).max(255),
  description:   z.string().min(5),
  model:         z.string().default("claude-sonnet-4-6"),
  tools:         z.array(z.string()).default([]),
  systemPrompt:  z.string().optional(),
  color:         z.string().optional(),
  autonomyLevel: z.number().int().min(1).max(5).default(3),
});

const _GET = withTenant(async (_req, ctx) => {
  const agents = await dbTx(ctx.tenantId, async (tx) =>
    tx.select().from(bmsAiAgents)
      .where(eq(bmsAiAgents.tenantId, ctx.tenantId))
      .orderBy(desc(bmsAiAgents.createdAt))
  );
  return NextResponse.json(agents);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = AgentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [agent] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsAiAgents)
      .values({ tenantId: ctx.tenantId, createdBy: ctx.userId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(agent, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const parsed = AgentSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [agent] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsAiAgents).set(parsed.data)
      .where(eq(bmsAiAgents.id, id)).returning()
  );
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json(agent);
});

// Soft-delete: set status=archived rather than hard delete
const _DELETE = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const [agent] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsAiAgents).set({ status: "archived" })
      .where(eq(bmsAiAgents.id, id)).returning()
  );
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json({ archived: true, id: agent.id });
});

export const GET    = withErrorHandler(_GET);
export const POST   = withErrorHandler(_POST);
export const PATCH  = withErrorHandler(_PATCH);
export const DELETE = withErrorHandler(_DELETE);
