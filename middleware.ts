/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * Next.js Edge Middleware entry point.
 * Delegates all routing, auth, and security logic to src/proxy.ts.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { proxy } from "@/proxy";

export async function middleware(request: NextRequest) {
  try {
    // Await the proxy to catch any async rejections
    const response = await proxy(request);
    return response;
  } catch (error) {
    // 1. Log the exact stack trace so it appears in Vercel Logs
    console.error("🚨 EDGE MIDDLEWARE EXCEPTION [src/proxy.ts]:", error);

    // 2. Return a graceful 500 response instead of a hard Edge crash
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Edge Middleware Exception",
        details: error instanceof Error ? error.message : "Unknown error in proxy routing",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "x-middleware-error": "caught",
        },
      }
    );
  }
}

export const config = {
  matcher: [
    // Match all routes EXCEPT static assets, image optimizer, and public files.
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};