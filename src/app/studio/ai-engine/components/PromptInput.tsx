"use client";

import { useState } from "react";
import { AlertTriangle, Send, Loader2, ShieldAlert } from "lucide-react";

interface SecurityFinding {
  ruleId: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

export function PromptInput({ projectId }: { projectId?: number }) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityViolations, setSecurityViolations] = useState<SecurityFinding[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    setSecurityViolations([]); // Reset previous findings

    try {
      const res = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          taskClass: "backend", // Or dynamically selected by the user
          projectId,
        }),
      });

      const data = await res.json();

      if (res.status === 403) {
        // Zero-Trust Perimeter activated: Prompt Blocked
        setSecurityViolations(data.findings || []);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to enqueue task");

      // Success: Task is queued for the background worker
      setPrompt("");
      // Trigger local UI refresh to show the new 'queued' task
      
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Security Violations Banner */}
      {securityViolations.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800 font-medium mb-2">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Prompt Rejected by Zero-Trust Policy
          </div>
          <ul className="space-y-2 mt-2">
            {securityViolations.map((finding, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-start">
                <span className="font-mono text-xs bg-red-100 px-1.5 py-0.5 rounded mr-2 mt-0.5">
                  {finding.ruleId}
                </span>
                {finding.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the multi-tenant feature, database schema, or UI component..."
          className="w-full min-h-[120px] p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-bnlv-navy focus:border-bnlv-navy resize-none"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !prompt.trim()}
          className="absolute bottom-4 right-4 inline-flex items-center px-4 py-2 bg-bnlv-navy text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Queue Task
        </button>
      </form>
    </div>
  );
}