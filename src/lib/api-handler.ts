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

      // 1. Type-safe check for Postgres database errors using the type guard
      if (isPgError(error)) {
        // Catch Postgres Unique Constraint Violations (e.g., duplicate internalRef)
        if (error.code === '23505') {
          return NextResponse.json(
            { error: "A record with this unique identifier already exists.", detail: error.detail },
            { status: 409 } // 409 Conflict
          );
        }

        // Catch Postgres Foreign Key Violations (e.g., referencing a caseId that doesn't exist)
        if (error.code === '23503') {
          return NextResponse.json(
            { error: "Referenced record does not exist.", detail: error.detail },
            { status: 400 }
          );
        }
      }

      // 2. Catch Zod Validation Errors
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: error.issues },
          { status: 400 }
        );
      }

      // 3. Fallback for unhandled errors
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}