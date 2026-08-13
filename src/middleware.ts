import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

// The official Next.js middleware entry point
export async function middleware(request: NextRequest, event: any) {
  return proxy(request, event);
}

// Ensure the middleware matches your app routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.png|robots.txt|sitemap.xml).*)",
  ],
};