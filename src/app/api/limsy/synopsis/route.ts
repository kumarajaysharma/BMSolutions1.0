import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-handler";
import { getRequestContext, requireRole } from "@/lib/request-context";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const dynamic = "force-dynamic";

async function _POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  
  // Only Architects (legal leads) can generate binding synopses
  const denied = requireRole(ctx, "architect");
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const { subjectMatter, petitioner, respondent, caseType } = body;

  if (!subjectMatter) {
    return NextResponse.json(
      { error: "Subject matter is required to generate a synopsis." }, 
      { status: 400 }
    );
  }

  const prompt = `You are a Senior Advocate at the Supreme Court of India.
Based on the following case details, generate a formal, highly dense legal synopsis structured EXACTLY with these three uppercase headings. Use professional, objective legal terminology.

1. MATTER IN ISSUE
2. RELIEF SOUGHT
3. PRELIMINARY ASSESSMENT

Case Type: ${caseType || 'Not specified'}
Petitioner: ${petitioner || 'Not specified'}
Respondent: ${respondent || 'Not specified'}
Subject Matter Fact Pattern: 
${subjectMatter}
`;

  // Ensure ANTHROPIC_API_KEY is set in your .env.local or Vercel environment variables
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt: prompt,
    temperature: 0.1, // Low temperature for deterministic, formal legal output
  });

  return NextResponse.json({ synopsis: text }, { status: 200 });
}

export const POST = withErrorHandler(_POST);