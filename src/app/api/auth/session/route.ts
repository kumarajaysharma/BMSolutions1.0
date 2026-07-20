import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { getDb } from "@/db/index";
import { sessions, users, tenants } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

// ----------------------------------------------------------------------
// SECURITY HELPER
// ----------------------------------------------------------------------

/** Constant-time string comparison — prevents timing-based secret extraction */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ----------------------------------------------------------------------
// GET: EDGE-NATIVE CLIENT HYDRATION (Lightning Fast UI)
// ----------------------------------------------------------------------

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("bms_session")?.value;

    if (!token) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const session = await decrypt(token);

    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Return ONLY safe, non-sensitive data to the client UI
    return NextResponse.json({
      session: {
        userId: session.userId,
        tenantId: session.tenantId,
        role: session.role,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ session: null }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: STRICT INTERNAL PROXY (Database Verified Audit)
// ----------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Authenticate the internal caller
  const callerSecret = req.headers.get("x-internal-secret") ?? "";

  if (!INTERNAL_SECRET || !timingSafeEqual(callerSecret, INTERNAL_SECRET)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Validate request body
  let body: { tokenHash?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const tokenHash = body.tokenHash;
  if (typeof tokenHash !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // 3. Strict Database Lookup
  const now = new Date();
  
  try {
    const db = await getDb();
    const rows = await db
      .select({
        sessionId: sessions.id,
        userId: sessions.userId,
        tenantId: sessions.tenantId,
        expiresAt: sessions.expiresAt,
        role: users.role,
        tenantSlug: tenants.slug,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, now),
          eq(users.active, true),
          eq(tenants.status, "active")
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json({
      session: {
        sessionId: row.sessionId,
        userId: row.userId,
        tenantId: row.tenantId,
        tenantSlug: row.tenantSlug,
        role: row.role,
        expiresAt: row.expiresAt.toISOString(),
      }
    });

  } catch (err) {
    console.error("[auth/session POST] DB error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}