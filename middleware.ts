/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * Next.js Edge Middleware entry point.
 * Delegates all routing, auth, and security logic to src/proxy.ts.
 *
 * RULES:
 * 1. config must be declared statically inline — never re-exported.
 * 2. Use explicit async function declaration — not const assignment.
 *    Turbopack's middleware NFT generator requires a named function.
 * 3. proxy.ts must NOT export config — two config exports in the module
 *    graph cause Turbopack to fail generating middleware.js.nft.json.
 * 4. Use @/ alias — relative paths break NFT resolution on Vercel.
 */

import type { NextRequest } from "next/server";
import { proxy } from "@/proxy";

export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    // Match all routes EXCEPT static assets, image optimizer, and public files.
    // API routes are intentionally included — proxy.ts enforces JWT + RBAC on them.
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};
