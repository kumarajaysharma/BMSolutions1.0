import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Extracts Postgres error details even if wrapped by Drizzle/Neon in a `cause` property.
 */
export function getPgError(e: unknown): { code: string; detail?: string } | null {
  if (typeof e !== 'object' || e === null) return null;
  
  // 1. Check if it's a direct Postgres/Neon error
  if ('code' in e && typeof (e as any).code === 'string') {
    return e as { code: string; detail?: string };
  }
  
  // 2. Check if Drizzle wrapped the real error inside a 'cause' property
  if ('cause' in e && typeof (e as any).cause === 'object' && (e as any).cause !== null) {
    const cause = (e as any).cause;
    if ('code' in cause && typeof cause.code === 'string') {
      return cause as { code: string; detail?: string };
    }
  }
  
  return null;
}

// Define the standard Next.js route handler signature using NextRequest
type RouteHandler = (
  req: NextRequest,
  context: any
) => Promise<NextResponse> | NextResponse;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      // Execute the actual route logic
      return await handler(req, context);
      
    } catch (error: unknown) {
      console.error(`[API Error] ${req.method} ${req.url}:`, error);

      // Unwrap the error safely
      const pgError = getPgError(error);

      // 1. Catch Postgres Unique Constraint Violations (Duplicate Records)
      if (pgError?.code === '23505') {
        return NextResponse.json(
          { error: "A record with this unique identifier already exists.", detail: pgError.detail || "Unique constraint violation" },
          { status: 409 }
        );
      }

      // 2. Catch Postgres Foreign Key Violations
      if (pgError?.code === '23503') {
        return NextResponse.json(
          { error: "Referenced record does not exist.", detail: pgError.detail || "Foreign key constraint violation" },
          { status: 400 }
        );
      }

      // 3. Catch Zod Validation Errors
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: error.issues },
          { status: 400 }
        );
      }

      // 4. Fallback for unhandled errors
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}