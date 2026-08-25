import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import { aiTasks, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { lintSnippet } from "@/lib/security-linter";

// ADR-002: Bypassing Next.js Fetch Cache for Transaction Safety
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Protect the worker endpoint via a secure pre-shared key
const WORKER_SECRET = process.env.AI_WORKER_SECRET;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the worker invocation
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${WORKER_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized worker invocation" }, { status: 401 });
    }

    const { tenantId, taskId } = await req.json();

    if (!tenantId || !taskId) {
      return NextResponse.json({ error: "tenantId and taskId required" }, { status: 400 });
    }

    // 2. ADR-001: Execute the entire processing workflow within the tenant boundary
    const result = await withTenant(tenantId, async (tx) => {
      
      // Fetch the specific queued task
      const [task] = await tx
        .select()
        .from(aiTasks)
        .where(and(eq(aiTasks.id, taskId), eq(aiTasks.status, "queued")))
        .limit(1);

      if (!task) {
        throw new Error(`Task ${taskId} not found or not in 'queued' state.`);
      }

      // Mark task as running to prevent double-processing
      await tx
        .update(aiTasks)
        .set({ status: "running" })
        .where(eq(aiTasks.id, taskId));

      let generatedOutput = "";
      let executionStages = [...(task.stages as any[]), { stage: "execution_started", timestamp: new Date().toISOString() }];

      try {
        // 3. Dispatch to the Autonomous Multi-Agent Engine
        // (Mocked integration. Replace with actual API calls to DeepSeek/Claude/Qwen/Vertex)
        executionStages.push({ stage: `dispatching_to_${task.routedModel}`, timestamp: new Date().toISOString() });
        
        // Example LLM Invocation Router
        if (task.routedModel === "deepseek-r1-pro") {
          // generatedOutput = await callDeepSeek(task.prompt);
          generatedOutput = "// DeepSeek-R1 RLS Postgres Logic\nconst data = await db.select();"; 
        } else if (task.routedModel === "claude-3-5-sonnet") {
          // generatedOutput = await callClaude(task.prompt);
          generatedOutput = "export default function Component() { return <div>UI</div>; }";
        } else {
          // generatedOutput = await callQwen(task.prompt);
          generatedOutput = "// Orchestration complete";
        }

        executionStages.push({ stage: "generation_complete", timestamp: new Date().toISOString() });

        // 4. EGRESS ZERO-TRUST: Lint the generated snippet before committing
        const egressEval = lintSnippet(generatedOutput);
        
        if (egressEval.status === "fail") {
          // The LLM generated malicious or strictly forbidden code (e.g., eval(), hardcoded secrets)
          const updated = await tx
            .update(aiTasks)
            .set({
              output: generatedOutput,
              status: "failed", // Block deployment[cite: 1]
              securityStatus: "fail", // Flag security breach[cite: 1]
              securityFindings: egressEval.findings,
              stages: [...executionStages, { stage: "egress_security_failure", timestamp: new Date().toISOString() }],
            })
            .where(eq(aiTasks.id, taskId))
            .returning();

          await tx.insert(auditLogs).values({
            tenantId,
            actor: `model:${task.routedModel}`,
            action: `ai.egress.blocked`,
            target: `task:${taskId}`,
            severity: "critical", //[cite: 1]
            metadata: { findings: egressEval.findings }
          });

          return { success: false, reason: "Egress security check failed", task: updated[0] };
        }

        // 5. Success: Commit the clean code back to the system
        const updated = await tx
          .update(aiTasks)
          .set({
            output: generatedOutput,
            status: "committed", // Artifact is ready for the Visual Builder[cite: 1]
            securityStatus: "pass",
            stages: [...executionStages, { stage: "egress_security_passed", timestamp: new Date().toISOString() }],
          })
          .where(eq(aiTasks.id, taskId))
          .returning();

        return { success: true, task: updated[0] };

      } catch (executionError: any) {
        // Handle LLM timeout or API failures
        await tx
          .update(aiTasks)
          .set({
            status: "failed",
            stages: [...executionStages, { stage: "execution_error", error: executionError.message, timestamp: new Date().toISOString() }],
          })
          .where(eq(aiTasks.id, taskId));

        throw executionError;
      }
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("[WORKER_EXECUTION_ERROR]", error);
    return NextResponse.json({ error: error.message || "Worker failed" }, { status: 500 });
  }
}