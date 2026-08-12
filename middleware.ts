/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * Next.js Edge Middleware entry point.
 * Delegates all routing, auth, and security logic to src/proxy.ts.
 *
 * IMPORTANT: `config` must be declared statically in this file.
 * Turbopack performs static analysis on `config` at compile time —
 * re-exporting it from another module causes a build failure.
 * Do NOT change config to an import/re-export.
 */

import type { NextRequest } from "next/server";
import { proxy } from "./src/proxy";

export async function middleware(req: NextRequest) {
  return proxy(req);
}

// Must be declared inline — cannot be imported or re-exported from src/proxy.ts
export const config = {
  matcher: [
    // Apply to all routes EXCEPT static files, images, and favicon
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};