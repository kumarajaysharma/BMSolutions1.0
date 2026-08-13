/**
 * src/proxy.ts
 *
 * BNLV Studio — Native Next.js 16 Proxy (Edge Runtime)
 * Replaces legacy middleware convention.
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
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

function forbiddenResponse(isApiRoute: boolean, req: NextRequest): NextResponse {
  if (isApiRoute) {
    return NextResponse.json({ error: "Forbidden - Insufficient privileges" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/403", req.nextUrl.origin));
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  if (hostname === "www.bnlvconsulting.com") {
    const url = req.nextUrl.clone();
    url.host = "bnlvconsulting.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

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

  if (searchParams.has("tenant") && process.env.NODE_ENV !== "production") {
    tenantSlug = searchParams.get("tenant") || tenantSlug;
  }

  const sanitisedHeaders = new Headers(req.headers);
  for (const h of MANAGED_HEADERS) sanitisedHeaders.delete(h);
  sanitisedHeaders.set("x-tenant-slug", tenantSlug);

  const passThrough = () => NextResponse.next({ request: { headers: sanitisedHeaders } });

  const isApiRoute = pathname.startsWith("/api/");
  const isNextAsset = pathname.startsWith("/_next/") || pathname.startsWith("/static/");

  if (isNextAsset || PUBLIC_PATHS.has(pathname)) {
    if (pathname === "/api/auth/session" && req.method !== "GET") {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (!token || !(await decrypt(token))) {
        return unauthorizedResponse(isApiRoute, req);
      }
    }
    return passThrough();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decrypt(token) : null;

  if (!session) {
    return unauthorizedResponse(isApiRoute, req);
  }

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute && !hasMinimumRole(session.role as AppRole, "admin")) {
    return forbiddenResponse(isApiRoute, req);
  }

  sanitisedHeaders.set("x-tenant-id", session.tenantId.toString());
  sanitisedHeaders.set("x-user-id", session.userId.toString());
  sanitisedHeaders.set("x-user-role", session.role);
  if (session.sessionId) {
    sanitisedHeaders.set("x-session-id", session.sessionId);
  }

  return NextResponse.next({ request: { headers: sanitisedHeaders } });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.png|robots.txt|sitemap.xml).*)",
  ],
};