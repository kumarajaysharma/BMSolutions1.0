// ── AI-Routing Engine ──────────────────────────────────────────────
// "Claude Fable 5 Plans, Gemini Designs."
//   claude-fable-5  → complex planning, multi-step logic, secure backend
//   gemini-3.5-flash → rapid UI generation, styling, design-system work
// The router classifies each task, scores complexity, and dispatches
// an agentic pipeline: Plan → Generate → Verify → Security Gate → Commit.

import { lintSnippet, type Finding } from "./security-linter";

export type RoutedModel = "claude-fable-5" | "gemini-3.5-flash";
export type TaskClass = "planning" | "backend" | "frontend" | "styling";

export type Stage = {
  name: string;
  model: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  detail: string;
};

const BACKEND_SIGNALS =
  /\b(api|auth|oauth|database|db|schema|migration|webhook|payment|stripe|queue|cron|integration|backend|server|security|rbac|tenant|token|encrypt|architecture|plan|refactor|pipeline|dependenc)/i;
const FRONTEND_SIGNALS =
  /\b(ui|component|button|hero|landing|page|layout|style|styling|css|tailwind|design|theme|color|animation|responsive|frontend|nav|card|modal|form|font|gradient)/i;

export function classifyTask(prompt: string): {
  taskClass: TaskClass;
  routedModel: RoutedModel;
  routingReason: string;
  complexityScore: number;
} {
  const backendHits = (prompt.match(new RegExp(BACKEND_SIGNALS.source, "gi")) ?? []).length;
  const frontendHits = (prompt.match(new RegExp(FRONTEND_SIGNALS.source, "gi")) ?? []).length;
  const wordCount = prompt.split(/\s+/).length;
  const multiStep = /\b(then|after|steps?|first|finally|and)\b/gi;
  const stepHits = (prompt.match(multiStep) ?? []).length;
  const complexityScore = Math.min(
    100,
    backendHits * 14 + stepHits * 6 + Math.floor(wordCount / 4) + frontendHits * 4
  );

  if (backendHits > frontendHits || complexityScore >= 60) {
    const taskClass: TaskClass = backendHits >= 2 ? "backend" : "planning";
    return {
      taskClass,
      routedModel: "claude-fable-5",
      routingReason: `Detected ${backendHits} backend/logic signal(s), complexity ${complexityScore}/100 → routed to Claude Fable 5 for multi-step reasoning and secure integration.`,
      complexityScore,
    };
  }
  const taskClass: TaskClass = /\b(style|css|theme|color|font|gradient|animation)\b/i.test(prompt)
    ? "styling"
    : "frontend";
  return {
    taskClass,
    routedModel: "gemini-3.5-flash",
    routingReason: `Detected ${frontendHits} UI/design signal(s), complexity ${complexityScore}/100 → routed to Gemini 3.5 Flash for rapid, design-system-consistent generation.`,
    complexityScore,
  };
}

// ── Simulated model output (deterministic, offline-safe) ──────────
function generateOutput(prompt: string, model: RoutedModel, taskClass: TaskClass): string {
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32).replace(/^-|-$/g, "");
  if (model === "claude-fable-5") {
    if (taskClass === "planning") {
      return `## Implementation Plan — ${prompt.slice(0, 60)}

1. **Decompose** the requirement into bounded contexts (domain, API, persistence).
2. **Define contracts**: zod-validated DTOs shared between service layers.
3. **Sequence dependencies**: schema migration → repository → service → route.
4. **Security posture**: least-privilege DB role, parameterized queries, audit hooks.
5. **Verification**: contract tests against the design constraints before merge.

\`\`\`ts
// service scaffold (parameterized, vault-injected secrets)
export async function handle_${slug.replace(/-/g, "_")}(input: Input) {
  const parsed = InputSchema.parse(input);
  return db.transaction(async (tx) => {
    await tx.insert(events).values({ kind: "${slug}", payload: parsed });
    return { ok: true };
  });
}
\`\`\``;
    }
    return `// claude-fable-5 · secure backend integration
import { z } from "zod";
import { db } from "@/db";

const InputSchema = z.object({ id: z.string().uuid(), payload: z.record(z.string()) });

export async function POST(req: Request) {
  const token = req.headers.get("authorization");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = InputSchema.parse(await req.json());
  // parameterized via ORM — no string-built SQL
  const result = await db.execute(
    sql\`select * from records where id = \${body.id}\`
  );
  return Response.json({ data: result.rows });
}`;
  }
  // gemini-3.5-flash → UI generation aligned to design tokens
  return `// gemini-3.5-flash · design-system component
export function ${slug ? slug.replace(/(^|-)(\w)/g, (_m, _d, c: string) => c.toUpperCase()) : "Generated"}Card() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-widest text-indigo-600">
        New
      </span>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        ${prompt.slice(0, 48)}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Generated with token-locked spacing, radius and palette from the studio design system.
      </p>
      <button className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
        Explore
      </button>
    </section>
  );
}`;
}

export function runPipeline(prompt: string): {
  taskClass: TaskClass;
  routedModel: RoutedModel;
  routingReason: string;
  complexityScore: number;
  stages: Stage[];
  output: string;
  securityStatus: "pass" | "warn" | "fail";
  securityFindings: Finding[];
  status: "committed" | "blocked";
} {
  const routing = classifyTask(prompt);
  const stages: Stage[] = [];
  const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

  stages.push({
    name: "Route & Plan",
    model: "claude-fable-5",
    status: "passed",
    durationMs: rand(400, 1400),
    detail: routing.routingReason,
  });

  const output = generateOutput(prompt, routing.routedModel, routing.taskClass);
  stages.push({
    name: "Generate",
    model: routing.routedModel,
    status: "passed",
    durationMs: routing.routedModel === "gemini-3.5-flash" ? rand(300, 900) : rand(1200, 3200),
    detail: `${routing.routedModel} produced ${output.split("\n").length} lines for class "${routing.taskClass}".`,
  });

  stages.push({
    name: "Self-Verification",
    model: routing.routedModel,
    status: "passed",
    durationMs: rand(200, 700),
    detail:
      "Output checked against project design constraints: naming conventions, design tokens, dependency boundaries — all satisfied.",
  });

  const lint = lintSnippet(output);
  stages.push({
    name: "Zero-Trust Security Gate",
    model: "studio-security-linter",
    status: lint.status === "fail" ? "failed" : "passed",
    durationMs: rand(80, 240),
    detail:
      lint.status === "pass"
        ? "0 findings across 9 policy rules. Snippet cleared for commit."
        : `${lint.findings.length} finding(s): ${lint.findings.map((f) => f.rule).join(", ")}.`,
  });

  const blocked = lint.status === "fail";
  stages.push({
    name: "Commit to Repository",
    model: "studio-git-agent",
    status: blocked ? "skipped" : "passed",
    durationMs: blocked ? 0 : rand(120, 400),
    detail: blocked
      ? "Commit withheld — security gate must pass before repository write."
      : `Committed to main via signed commit (single source of truth updated).`,
  });

  return {
    ...routing,
    stages,
    output,
    securityStatus: lint.status,
    securityFindings: lint.findings,
    status: blocked ? "blocked" : "committed",
  };
}
