/**
 * src/app/api/ai/router/route.ts
 *
 * BMSolutions — Zero-Trust Multi-Agent Orchestrator
 * ==========================================================
 * TRACK C (AI ORCHESTRATION) - TypeScript Remediation
 */

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { withErrorHandler } from "@/lib/api-handler";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getAgentTools } from "@/lib/ai/tools";

export const runtime = "nodejs";

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "developer");
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const { messages, agentRole = "ORCHESTRATOR" } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "Invalid payload: 'messages' must be an array." },
      { status: 400 }
    );
  }

  let systemPrompt = `You are the Principal AI Orchestrator for BMSolutions Enterprise Suite.
Operating Standards: Institutional Grade (MBB / Harvard / Stanford).
Tenant Isolation: Tenant ID ${ctx.tenantId} active.
Current Timestamp: ${new Date().toISOString()}

You have direct access to tools for querying legal records (LIMSY) and CPWD financial estimates (Nidhivan).
Always call the appropriate tool when answering questions about cases, dockets, BOQs, or financial metrics before providing an assessment.`;

  if (agentRole === "LEGAL") {
    systemPrompt += `\nSpecialization: VANTAI Legal Intelligence. Emphasize constitutional provisions, precedent analysis, and procedural compliance under Supreme Court of India standards.`;
  } else if (agentRole === "FINANCIAL") {
    systemPrompt += `\nSpecialization: ADIDO Financial Engineering. Emphasize CPWD Schedule of Rates, deterministic cost breakdowns, and CAPEX feasibility.`;
  }

  const tools = getAgentTools(ctx.tenantId);

  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    system: systemPrompt,
    messages,
    tools,
    ...({ maxSteps: 5 } as any),
    temperature: 0.1,
  });

  // Cast standard Response stream to NextResponse to satisfy withErrorHandler signature
  return result.toTextStreamResponse() as unknown as NextResponse;
}

export const POST = withErrorHandler(_POST);