/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * BNLV Studio — Zero Trust Edge Middleware
 * ═══════════════════════════════════════════════════════════════════════════════
 * Self-contained: imports ONLY from next/server and jose.
 * No @/ cross-module imports — eliminates Turbopack edge bundle graph complexity.
 *
 * Security features:
 *   0. WWW → apex 301 canonical redirect
 *   1. Host-header multi-tenant slug resolution
 *   2. Zero Trust header stripping (injection prevention)
 *   3. JWT HS256 verification (jose — edge-native, < 5ms)
 *   4. RBAC role hierarchy enforcement
 *   5. Verified context injection for downstream handlers
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "bms_session";

const MANAGED_HEADERS = [
  "x-tenant-id",
  "x-user-id",
  "x-user-role",
  "x-session-id",
  "x-tenant-slug",
] as const;

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

const ROLE_HIERARCHY = [
  "owner",      // 0 — highest
  "admin",      // 1
  "architect",  // 2
  "developer",  // 3
  "designer",   // 4
  "viewer",     // 5 — lowest
] as const;

type AppRole = (typeof ROLE_HIERARCHY)[number];

// ── JWT helper ────────────────────────────────────────────────────────────────

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("[middleware] JWT_SECRET missing or < 32 chars");
  }
  return new TextEncoder().encode(secret);
}

async function verifyJwt(token: string): Promise<{
  userId: string;
  tenantId: string;
  role: string;
  sessionId?: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as { userId: string; tenantId: string; role: string; sessionId?: string };
  } catch {
    return null;
  }
}

// ── RBAC helper ───────────────────────────────────────────────────────────────

function hasMinimumRole(actual: string, required: AppRole): boolean {
  const ai = ROLE_HIERARCHY.indexOf(actual as AppRole);
  const ri = ROLE_HIERARCHY.indexOf(required);
  // CRITICAL: indexOf returns -1 for unknown roles.
  // Without this guard, -1 <= ri evaluates true, bypassing all RBAC.
  if (ai === -1 || ri === -1) return false;
  return ai <= ri;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ── 0. WWW → apex canonical redirect (before all auth logic) ─────────────
  if (hostname === "www.bnlvconsulting.com") {
    const url = new URL(request.url);
    url.host = "bnlvconsulting.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── 1. Host-header tenant resolution ─────────────────────────────────────
  let tenantSlug = "bnlv"; // default: BNLV Group apex
  if (hostname.startsWith("bms."))          tenantSlug = "bms";
  else if (hostname.startsWith("nidhivan.")) tenantSlug = "nidhivan";
  else if (hostname.startsWith("limsy."))    tenantSlug = "limsy";
  else if (hostname.startsWith("vihang."))   tenantSlug = "vihang";
  else if (hostname.includes("bmsolutions-")) tenantSlug = "bms"; // Vercel preview URLs

  // Dev-only tenant override (blocked in production)
  if (
    process.env.NODE_ENV !== "production" &&
    request.nextUrl.searchParams.has("tenant")
  ) {
    tenantSlug = request.nextUrl.searchParams.get("tenant") ?? tenantSlug;
  }

  // ── 2. Header sanitization (injection prevention) ─────────────────────────
  const headers = new Headers(request.headers);
  for (const h of MANAGED_HEADERS) headers.delete(h);
  headers.set("x-tenant-slug", tenantSlug);

  const passThrough = () => NextResponse.next({ request: { headers } });
  const isApi   = pathname.startsWith("/api/");
  const isAsset = pathname.startsWith("/_next/") || pathname.startsWith("/static/");

  // ── 3. Public paths — pass through without JWT ────────────────────────────
  if (isAsset || PUBLIC_PATHS.has(pathname)) {
    // Gate mutating session endpoint behind auth (R13 fix)
    if (pathname === "/api/auth/session" && request.method !== "GET") {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (!token || !(await verifyJwt(token))) {
        return isApi
          ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
          : NextResponse.redirect(new URL("/login", request.url));
      }
    }
    return passThrough();
  }

  // ── 4. JWT verification ───────────────────────────────────────────────────
  const token   = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJwt(token) : null;

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // ── 5. RBAC enforcement ───────────────────────────────────────────────────
  const isAdminRoute = ADMIN_PREFIXES.some(p => pathname.startsWith(p));
  if (isAdminRoute && !hasMinimumRole(session.role, "admin")) {
    return isApi
      ? NextResponse.json({ error: "Forbidden - Insufficient privileges" }, { status: 403 })
      : NextResponse.redirect(new URL("/403", request.url));
  }

  // ── 6. Inject verified session context ────────────────────────────────────
  headers.set("x-tenant-id",   session.tenantId);
  headers.set("x-user-id",     session.userId);
  headers.set("x-user-role",   session.role);
  if (session.sessionId) headers.set("x-session-id", session.sessionId);

  return NextResponse.next({ request: { headers } });
}

// ── Matcher ───────────────────────────────────────────────────────────────────
// config must be declared inline — Turbopack requires static analysis.
// Do not import or re-export this from another file.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};
