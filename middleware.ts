/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * Next.js Edge Middleware entry point.
 * TEMPORARY ISOLATION TEST: Bypassing proxy.ts to diagnose boot-time crash.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🚨 TEMPORARILY DISABLED TO ISOLATE THE BOOT CRASH
// import { proxy } from "@/proxy";

export async function middleware(request: NextRequest) {
  return new NextResponse(
    JSON.stringify({ success: true, message: "Edge Runtime is Alive!" }),
    { 
      status: 200, 
      headers: { "content-type": "application/json" } 
    }
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};