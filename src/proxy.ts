/**
 * src/proxy.ts
 *
 * BNLV Studio — Native Next.js 16 Proxy (Edge Runtime Compatible)
 * Handles multi-tenant routing, JWT validation, and RBAC injection.
 */

import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/jwt";
import { hasMinimumRole, AppRole } from "@/lib/roles";

const SESSION_COOKIE = "bms_session";

const MANAGED_HEADERS = [
  "x-tenant-id",
  "x-user-id",
  "x-user-role",
  "x-session-id",
  "x-tenant-slug",
];

const PUBLIC_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/health",
  "/login",
  "/403",
  "/",
  "/home",
  "/about",
  "/contact",
  "/careers",
  "/companies",
  "/bms",
  "/nidhivan",
  "/limsy",
  "/vihang",
]);

const ADMIN_PREFIXES = ["/admin", "/api/admin"];

function unauthorizedResponse(isApiRoute: boolean, req: NextRequest): NextResponse {
  if (isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Safely construct redirect URLs
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

function forbiddenResponse(isApiRoute: boolean, req: NextRequest): NextResponse {
  if (isApiRoute) {
    return NextResponse.json({ error: "Forbidden - Insufficient privileges" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/403", req.url));
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // 1. WWW Redirect (handled safely)
  if (hostname === "www.bnlvconsulting.com") {
    const redirectUrl = new URL(req.url);
    redirectUrl.host = "bnlvconsulting.com";
    redirectUrl.protocol = "https:";
    return NextResponse.redirect(redirectUrl, { status: 308 });
  }

  // 2. Multi-Tenant Subdomain Routing
  let tenantSlug = "bnlv";
  if (hostname.startsWith("bms.")) {
    tenantSlug = "bms";
  } else if (hostname.startsWith("nidhivan.")) {
    tenantSlug = "nidhivan";
  } else if (hostname.startsWith("limsy.")) {
    tenantSlug = "limsy";
  } else if (hostname.startsWith("vihang.")) {
    tenantSlug = "vihang";
  } else if (hostname.includes("bmsolutions-")) {
    tenantSlug = "bms";
  }

  // Developer override
  if (searchParams.has("tenant") && process.env.NODE_ENV !== "production") {
    tenantSlug = searchParams.get("tenant") || tenantSlug;
  }

  // 3. Header Sanitization
  const sanitisedHeaders = new Headers(req.headers);
  for (const h of MANAGED_HEADERS) sanitisedHeaders.delete(h);
  sanitisedHeaders.set("x-tenant-slug", tenantSlug);

  const passThrough = () => NextResponse.next({ request: { headers: sanitisedHeaders } });

  const isApiRoute = pathname.startsWith("/api/");
  const isNextAsset = pathname.startsWith("/_next/") || pathname.startsWith("/static/");

  // 4. Public Route Bypass
  if (isNextAsset || PUBLIC_PATHS.has(pathname)) {
    // Special case for mutating session endpoints
    if (pathname === "/api/auth/session" && req.method !== "GET") {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (!token || !(await decrypt(token))) {
        return unauthorizedResponse(isApiRoute, req);
      }
    }
    return passThrough();
  }

  // 5. Protected Route Authorization
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decrypt(token) : null;

  if (!session) {
    return unauthorizedResponse(isApiRoute, req);
  }

  // 6. RBAC Admin Verification
  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute && !hasMinimumRole(session.role as AppRole, "admin")) {
    return forbiddenResponse(isApiRoute, req);
  }

  // 7. Inject Trusted Headers
  sanitisedHeaders.set("x-tenant-id", session.tenantId.toString());
  sanitisedHeaders.set("x-user-id", session.userId.toString());
  sanitisedHeaders.set("x-user-role", session.role);
  if (session.sessionId) {
    sanitisedHeaders.set("x-session-id", session.sessionId);
  }

  return NextResponse.next({ request: { headers: sanitisedHeaders } });
}