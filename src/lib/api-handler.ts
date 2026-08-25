import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Define the standard Next.js route handler signature
type RouteHandler = (
  req: Request,
  context: any
) => Promise<NextResponse> | NextResponse;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      // Execute the actual route logic
      return await handler(req, context);
      
    } catch (error: unknown) {
      console.error(`[API Error] ${req.method} ${req.url}:`, error);

      // 1. Type-safe check for Postgres database errors
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const dbError = error as { code: string; detail?: string };

        // Catch Postgres Unique Constraint Violations (e.g., duplicate internalRef)
        if (dbError.code === '23505') {
          return NextResponse.json(
            { error: "A record with this unique identifier already exists.", detail: dbError.detail },
            { status: 409 } // 409 Conflict
          );
        }

        // Catch Postgres Foreign Key Violations (e.g., referencing a caseId that doesn't exist)
        if (dbError.code === '23503') {
          return NextResponse.json(
            { error: "Referenced record does not exist.", detail: dbError.detail },
            { status: 400 }
          );
        }
      }

      // 2. Catch Zod Validation Errors (if you throw them manually inside the route)
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: error.issues }, // FIX: changed from .errors to .issues
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