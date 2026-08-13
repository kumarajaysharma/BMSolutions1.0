/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * Next.js Edge Middleware entry point.
 * Delegates all routing, auth, and security logic to src/proxy.ts.
 *
 * IMPORTANT: config must be declared statically in this file.
 * Use @/ alias for imports — relative paths break Turbopack NFT generation
 * in production builds (ENOENT middleware.js.nft.json).
 */

import { proxy } from "@/proxy";

export const middleware = proxy;

export const config = {
  matcher: [
    // Match all routes EXCEPT static assets, image optimizer, and public files.
    // API routes are intentionally included — proxy.ts enforces JWT + RBAC on them.
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};