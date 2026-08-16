/**
 * middleware.ts  ← project root
 *
 * Next.js Edge Middleware entry point.
 * Delegates all routing, auth, and security logic to src/proxy.ts.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { proxy } from "@/proxy";

export async function middleware(request: NextRequest) {
  try {
    return await proxy(request);
  } catch (error) {
    console.error("🚨 EDGE MIDDLEWARE EXCEPTION:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Edge Middleware Exception",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};