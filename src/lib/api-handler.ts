import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Type guard for Postgres database errors.
 * Safely narrows the unknown error object for strict TypeScript analysis.
 */
export function isPgError(e: unknown): e is { code: string; detail?: string } {
  return typeof e === 'object' && e !== null && 'code' in e;
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

      // Safely extract a string representation of the error, even if it's deeply nested
      const errMessage = error instanceof Error ? error.message : String(error);
      const errStringLower = errMessage.toLowerCase();

      // 1. Catch Postgres Unique Constraint Violations (Duplicate Records)
      const isDuplicate = 
        (isPgError(error) && error.code === '23505') || 
        errStringLower.includes('23505') ||
        errStringLower.includes('duplicate key value violates unique constraint');

      if (isDuplicate) {
        const detail = isPgError(error) ? error.detail : "Unique constraint violation";
        return NextResponse.json(
          { error: "A record with this unique identifier already exists.", detail },
          { status: 409 }
        );
      }

      // 2. Catch Postgres Foreign Key Violations
      const isForeignKey = 
        (isPgError(error) && error.code === '23503') || 
        errStringLower.includes('23503') ||
        errStringLower.includes('violates foreign key constraint');

      if (isForeignKey) {
        const detail = isPgError(error) ? error.detail : "Foreign key constraint violation";
        return NextResponse.json(
          { error: "Referenced record does not exist.", detail },
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

      // 4. Fallback for unhandled errors - WITH DIAGNOSTICS EXPOSED
      return NextResponse.json(
        { 
          error: "Internal server error",
          debug_message: errMessage,
          debug_keys: typeof error === 'object' && error !== null ? Object.keys(error) : []
        },
        { status: 500 }
      );
    }
  };
}