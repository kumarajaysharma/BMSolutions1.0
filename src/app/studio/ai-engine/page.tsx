/**
 * src/app/studio/ai-engine/page.tsx
 * AI Orchestration Studio Page
 * ==========================================================
 * Imports and renders the AIOrchestrationWorkspace component.
 */

import AIOrchestrationWorkspace from "@/components/workspace/AIOrchestrationWorkspace";

export const dynamic = "force-dynamic";

export default function AiEnginePage() {
  return <AIOrchestrationWorkspace />;
}