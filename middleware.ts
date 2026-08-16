/**
 * middleware.ts  ← project root
 *
 * CACHE AND REGEX BYPASS TEST
 */

import { NextResponse } from "next/server";

export function middleware() {
  return new NextResponse(
    JSON.stringify({ success: true, message: "Absolute Bare Minimum Edge is Alive!" }),
    { 
      status: 200, 
      headers: { "content-type": "application/json" } 
    }
  );
}