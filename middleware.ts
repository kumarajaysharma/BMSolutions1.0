// middleware.ts  ← replace project root file with this
import { NextRequest, NextResponse } from "next/server";

const MANAGED = ["x-tenant-id","x-user-id","x-user-role","x-session-id","x-tenant-slug"] as const;

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get("host") ?? "";

  // www → apex
  if (host === "www.bnlvconsulting.com") {
    const url = new URL(request.url);
    url.host = "bnlvconsulting.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

  // Tenant slug
  let slug = "bnlv";
  if      (host.startsWith("bms."))       slug = "bms";
  else if (host.startsWith("nidhivan."))  slug = "nidhivan";
  else if (host.startsWith("limsy."))     slug = "limsy";
  else if (host.startsWith("vihang."))    slug = "vihang";
  else if (host.includes("bmsolutions-")) slug = "bms";

  const headers = new Headers(request.headers);
  MANAGED.forEach(h => headers.delete(h));
  headers.set("x-tenant-slug", slug);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)"],
};