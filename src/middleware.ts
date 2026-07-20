/**
 * src/middleware.ts
 *
 * BNLV Studio — Zero-Trust Request Middleware
 * ============================================
 * Runs on the Next.js Edge Runtime before every matched request.
 *
 * SECURITY FEATURES (Best of Both Worlds):
 *   1. Zero-Trust Header Stripping: Removes client-supplied session headers to prevent injection.
 *   2. Edge-Native Speed: Decrypts the JWT locally using `jose` (< 5ms) instead of slow DB fetches.
 *   3. Context Injection: Safely passes verified tenantId, userId, and role to downstream routes.
 *   4. Granular RBAC: Enforces role hierarchy for admin-level UI and API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";
import { ROLE_HIERARCHY, hasMinimumRole, AppRole } from "@/lib/roles";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & ROUTE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "bms_session"; // Matches our login/logout routes

/** Headers injected by middleware — stripped from incoming requests */
const MANAGED_HEADERS = [
  "x-tenant-id",
  "x-user-id",
  "x-user-role",
  "x-session-id",
];

/** Paths that require no authentication */
const PUBLIC_PATHS = new Set([
  // Authentication & System API
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session", // GET is public for UI hydration, POST is protected by internal secret
  "/api/health",
  
  // System Pages
  "/login",
  "/403",
  
  // Public Marketing Website Pages (Vite Migration)
  "/",
  "/home",
  "/about",
  "/contact",
  "/careers",
  "/companies",
  "/bms",
  "/nidhivan",
  "/limsy",
  "/vihang"
]);

/** Paths that strictly require at least 'admin' level access */
const ADMIN_PREFIXES = ["/admin", "/api/admin"];

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function unauthorizedResponse(isApiRoute: boolean, req: NextRequest): NextResponse {
  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  
  const response = NextResponse.redirect(loginUrl);
  // Clear any malformed cookies
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

function forbiddenResponse(isApiRoute: boolean, req: NextRequest): NextResponse {
  if (isApiRoute) {
    return NextResponse.json({ error: "Forbidden - Insufficient privileges" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/403", req.nextUrl.origin));
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // ── 1. Strip client-supplied managed headers (Injection Prevention) ───────
  const sanitisedHeaders = new Headers(req.headers);
  for (const h of MANAGED_HEADERS) sanitisedHeaders.delete(h);

  const passThrough = () => NextResponse.next({ request: { headers: sanitisedHeaders } });

  // ── 2. Classify the route & bypass public assets ──────────────────────────
  const isApiRoute = pathname.startsWith("/api/");
  const isNextAsset = pathname.startsWith("/_next/") || pathname.startsWith("/static/");

  // Allow next assets and public marketing pages to pass through without JWT checks
  if (isNextAsset || PUBLIC_PATHS.has(pathname)) {
    return passThrough();
  }

  // ── 3. Edge-Native JWT Verification (Lightning Fast) ──────────────────────
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decrypt(token) : null;

  if (!session) {
    return unauthorizedResponse(isApiRoute, req);
  }

  // ── 4. Role-Based Access Control (RBAC) ───────────────────────────────────
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  
  if (isAdminRoute && !hasMinimumRole(session.role as AppRole, "admin")) {
    return forbiddenResponse(isApiRoute, req);
  }

  // ── 5. Inject verified session context for downstream handlers ────────────
  sanitisedHeaders.set("x-tenant-id", session.tenantId.toString());
  sanitisedHeaders.set("x-user-id", session.userId.toString());
  sanitisedHeaders.set("x-user-role", session.role);
  if (session.sessionId) {
    sanitisedHeaders.set("x-session-id", session.sessionId);
  }

  return NextResponse.next({ request: { headers: sanitisedHeaders } });
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    // Apply to all routes EXCEPT static files, images, and favicon
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};