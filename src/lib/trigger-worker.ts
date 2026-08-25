// src/lib/trigger-worker.ts

/**
 * Instantly triggers the background execution worker.
 * Fire-and-forget pattern ensures the client isn't waiting for LLM generation.
 */
export function triggerAIWorker(tenantId: number, taskId: number) {
  // Use the absolute URL in production, or localhost in development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const workerSecret = process.env.AI_WORKER_SECRET;

  if (!workerSecret) {
    console.error("[TRIGGER_WORKER] AI_WORKER_SECRET is not configured.");
    return;
  }

  // Fire-and-forget fetch payload
  fetch(`${baseUrl}/api/ai/worker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${workerSecret}`,
    },
    body: JSON.stringify({ tenantId, taskId }),
  }).catch((error) => {
    console.error(`[WEBHOOK_FAILED] Task ${taskId}:`, error);
  });
}