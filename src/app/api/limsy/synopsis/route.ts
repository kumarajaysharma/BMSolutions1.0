/**
 * src/app/api/limsy/synopsis/route.ts  —  VERSION 2 (post-migration 0016)
 *
 * LIMSY Supreme Court Standard — AI Legal Synopsis Generator
 * ============================================================
 * DEPLOY AFTER: migration 0016_limsy_synopsis_column.sql is applied
 *   and verified (backfill query confirms zero residual delimiters
 *   in subject_matter). Deploying before migration will cause a
 *   Drizzle column-not-found runtime error on any caseId persist path.
 *
 * CHANGE FROM v1:
 *   TODO-001 RESOLVED — synopsis persistence now writes to the dedicated
 *   `synopsis`, `synopsis_generated_at`, and `synopsis_generated_by`
 *   columns instead of appending to `subject_matter` via text delimiter.
 *
 *   v1 (deprecated):
 *     subject_matter = `${base}\n\n=== AI SYNOPSIS ===\n${text}`
 *
 *   v2 (this file):
 *     synopsis              = text
 *     synopsis_generated_at = new Date()
 *     synopsis_generated_by = ctx.userId
 *
 *   The `=== AI SYNOPSIS ===` delimiter pattern is NO LONGER WRITTEN.
 *   Existing embedded synopses were extracted by migration 0016 backfill.
 *   limsy-page.tsx must be updated simultaneously (see limsy-page-patch.ts)
 *   to read `c.synopsis` instead of parsing `c.subjectMatter`.
 *   Deploy this file and the page patch in the same commit.
 *
 * ALL OTHER BEHAVIOUR UNCHANGED from v1:
 *   - COMPLIANCE MANDATE: OPTION A (DATA SOVEREIGNTY — Claude only)
 *   - Model: claude-sonnet-5 (overridable via LIMSY_SYNOPSIS_MODEL env)
 *   - Prompt injection defence (sanitizeLegalInput)
 *   - Input length validation (MAX_SUBJECT_CHARS = 8,000)
 *   - Audit log write on every generation (ADR-001)
 *   - RBAC: architect+ only
 *   - Fire-and-forget audit/persist (non-blocking on caller)
 *
 * RBAC: POST → "architect"
 */

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { withTenant } from "@/db";
import { limsyCases, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const dynamic = "force-dynamic";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Override via LIMSY_SYNOPSIS_MODEL for constitutional bench matters → claude-opus-5 */
const SYNOPSIS_MODEL = process.env.LIMSY_SYNOPSIS_MODEL ?? "claude-sonnet-5";

const MAX_SUBJECT_CHARS = 8_000;
const MAX_PARTY_CHARS   = 500;
const MAX_TYPE_CHARS    = 100;

// ── Input sanitization ────────────────────────────────────────────────────────

/**
 * Strips LLM control tokens from user-supplied legal text before
 * interpolation into the system prompt. Prevents prompt injection
 * where a crafted subjectMatter overrides the Senior Advocate persona
 * or exfiltrates context window contents.
 */
function sanitizeLegalInput(raw: unknown, maxLen: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .slice(0, maxLen)
    .replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi, "")
    .replace(/^(Human|Assistant|System|User)\s*:/gim, "")
    .replace(/<\/?(?:system|prompt|instruction)[^>]*>/gi, "")
    .trim();
}

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

// ── POST Handler ──────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const denied = requireRole(ctx, "architect");
  if (denied) return denied;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { subjectMatter, petitioner, respondent, caseType, caseId } = body;

  // ── Validation ──────────────────────────────────────────────────────────────

  if (!subjectMatter || typeof subjectMatter !== "string" || !subjectMatter.trim()) {
    return NextResponse.json(
      { error: "Subject matter is required to generate a synopsis." },
      { status: 400 }
    );
  }

  if (subjectMatter.length > MAX_SUBJECT_CHARS) {
    return NextResponse.json(
      {
        error: `Subject matter must not exceed ${MAX_SUBJECT_CHARS.toLocaleString()} characters. Received ${subjectMatter.length}.`,
      },
      { status: 400 }
    );
  }

  const numericCaseId = caseId != null ? Number(caseId) : null;
  if (caseId != null && (isNaN(numericCaseId!) || numericCaseId! <= 0)) {
    return NextResponse.json(
      { error: "caseId must be a positive integer." },
      { status: 400 }
    );
  }

  // ── Sanitize all prompt-interpolated fields ─────────────────────────────────

  const cleanSubject    = sanitizeLegalInput(subjectMatter, MAX_SUBJECT_CHARS);
  const cleanPetitioner = sanitizeLegalInput(petitioner, MAX_PARTY_CHARS) || "Not specified";
  const cleanRespondent = sanitizeLegalInput(respondent, MAX_PARTY_CHARS) || "Not specified";
  const cleanCaseType   = sanitizeLegalInput(caseType, MAX_TYPE_CHARS)
                            .replace(/[^a-z0-9_\s]/gi, "") || "Not specified";

  // ── AI generation ───────────────────────────────────────────────────────────
  // COMPLIANCE MANDATE: OPTION A — DATA SOVEREIGNTY
  // Supreme Court legal facts route exclusively to Claude on Anthropic-compliant
  // infrastructure. DeepSeek-R1, GPT-4, Gemini: PROHIBITED on this endpoint.

  const prompt = `You are a Senior Advocate at the Supreme Court of India.
Based on the following case details, generate a formal, highly dense legal synopsis structured EXACTLY with these three uppercase headings. Use professional, objective legal terminology. Cite relevant constitutional provisions and landmark precedents where applicable.

1. MATTER IN ISSUE
2. RELIEF SOUGHT
3. PRELIMINARY ASSESSMENT

Case Type: ${cleanCaseType}
Petitioner: ${cleanPetitioner}
Respondent: ${cleanRespondent}
Subject Matter Fact Pattern:
${cleanSubject}`;

  const { text } = await generateText({
    model:       anthropic(SYNOPSIS_MODEL),
    prompt,
    temperature: 0.1,   // Deterministic — formal legal output
    maxOutputTokens:   1_500,
  });

  // ── Audit log + optional persistence ───────────────────────────────────────
  // Fire-and-forget: audit/persist failure MUST NOT surface to the caller.
  // A failed audit log write should never abort a legitimate legal workflow.

  const actor       = `user:${ctx.userId}`;
  const ip          = extractIp(req);
  const auditTarget = numericCaseId != null
    ? `case:${numericCaseId}`
    : `standalone:${cleanPetitioner.slice(0, 80)}`;

  withTenant(ctx.tenantId, async (tx) => {

    // ── PERSIST-001 (v2): Write to dedicated synopsis column ─────────────────
    // Migration 0016 must be applied before this path executes.
    // If caseId is not supplied the synopsis is returned only — caller persists.
    if (numericCaseId != null) {
      const [existing] = await tx
        .select({ id: limsyCases.id })
        .from(limsyCases)
        .where(
          and(
            eq(limsyCases.id, numericCaseId),
            eq(limsyCases.tenantId, ctx.tenantId) // Defense-in-depth alongside RLS
          )
        )
        .limit(1);

      if (existing) {
        await tx
          .update(limsyCases)
          .set({
            // v2: three dedicated columns — no delimiter embedding in subject_matter
            synopsis:            text,
            synopsisGeneratedAt: new Date(),
            synopsisGeneratedBy: ctx.userId,
            updatedBy:           ctx.userId,
            updatedAt:           new Date(),
          })
          .where(
            and(
              eq(limsyCases.id, numericCaseId),
              eq(limsyCases.tenantId, ctx.tenantId)
            )
          );
      }
    }

    // ── ADR-001: Audit log — every AI generation traceable to user + case ────
    await tx.insert(auditLogs).values({
      tenantId:  ctx.tenantId,
      actor,
      action:    `limsy.synopsis.generate:${cleanCaseType.replace(/\s+/g, "_")}`,
      target:    auditTarget,
      severity:  "info",
      ipAddress: ip,
    });

  }).catch((err: unknown) => {
    console.error(
      "[LIMSY] Synopsis audit/persist error:",
      err instanceof Error ? err.message : err
    );
  });

  // ── Response ────────────────────────────────────────────────────────────────

  return NextResponse.json(
    {
      synopsis: text,
      model:    SYNOPSIS_MODEL,
      ...(numericCaseId != null ? { persistedToCaseId: numericCaseId } : {}),
    },
    { status: 200 }
  );
}

export const POST = withErrorHandler(_POST);
