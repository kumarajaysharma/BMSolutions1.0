/**
 * src/app/api/auth/login/route.ts
 *
 * Changes vs login-route-patched.ts:
 *   [ADR] bcryptjs import and bcrypt fallback branch removed.
 *         DB audit confirmed 0 bcrypt-prefixed password_hash rows (2026-10-09).
 *         scrypt is now the sole verification path per ADR.
 *   [FIX] export const runtime = 'nodejs' added.
 *         crypto.scrypt and promisify are Node.js builtins; Edge runtime
 *         does not expose them. Explicit declaration prevents silent fallback
 *         to Edge if the global Next.js runtime config ever changes.
 */

// Must run on Node.js runtime — crypto.scrypt is not available on Edge.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { promisify } from "util";
import { getDb } from "@/db/index";
import { users, sessions, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createSessionCookie } from "@/lib/auth";

type UserRow = typeof users.$inferSelect;

// Explicitly typed to include options parameter (fixes TS2554)
const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

const MIN_RESPONSE_MS = 200;

export async function POST(request: Request) {
  const start = Date.now();

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const password =
      typeof body.password === "string" ? body.password : null;
    const tenantSlug =
      typeof body.tenantSlug === "string"
        ? body.tenantSlug.trim().toLowerCase()
        : null;

    if (!email || !password || !tenantSlug) {
      return enforcedDelay(
        NextResponse.json({ error: "Missing fields" }, { status: 400 }),
        start
      );
    }

    const db = await getDb();

    // 1. Resolve Tenant
    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    const tenantExists =
      tenantRows.length > 0 && tenantRows[0].status === "active";

    // 2. Lookup User — only if tenant is valid
    let userRows: UserRow[] = [];
    if (tenantExists) {
      userRows = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.tenantId, tenantRows[0].id)
          )
        )
        .limit(1);
    }

    // 3. Verify Password (always runs to prevent timing oracle attacks)
    //    scrypt is the sole verification path per ADR.
    //    bcryptjs removed: DB audit confirmed 0 bcrypt hashes (2026-10-09).
    const DUMMY_HASH = await generateScryptHash("__dummy__");
    const storedHash =
      userRows.length > 0 && userRows[0].passwordHash
        ? userRows[0].passwordHash
        : DUMMY_HASH;

    const passwordMatch = await verifyScryptHash(password, storedHash);

    if (
      !passwordMatch ||
      !tenantExists ||
      userRows.length === 0 ||
      !userRows[0].active
    ) {
      return enforcedDelay(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        start
      );
    }

    const tenant = tenantRows[0];
    const user = userRows[0];

    // 4. Create DB Session Record — tokenHash = SHA-256(sessionId)  [TD-001 closed]
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      tenantId: tenant.id,
      tokenHash: crypto.createHash("sha256").update(sessionId).digest("hex"),
      expiresAt: expiresAt,
    });

    // 5. Issue Encrypted JWT Cookie
    await createSessionCookie({
      userId: user.id.toString(),
      tenantId: tenant.id.toString(),
      role: user.role,
      sessionId: sessionId,
    });

    return enforcedDelay(
      NextResponse.json({ success: true, redirectUrl: "/admin" }),
      start
    );
  } catch (error) {
    console.error("[auth/login] Internal error:", error);
    return enforcedDelay(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      start
    );
  }
}

// --- Security Helpers ---

async function enforcedDelay(
  response: NextResponse,
  startMs: number
): Promise<NextResponse> {
  const elapsed = Date.now() - startMs;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
  }
  return response;
}

async function generateScryptHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const dk = await scryptAsync(password, salt, 32, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `$scrypt$N=16384,r=8,p=1$${salt.toString("base64url")}$${dk.toString(
    "base64url"
  )}`;
}

async function verifyScryptHash(
  password: string,
  stored: string
): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 5 || parts[1] !== "scrypt") return false;

    const params: Record<string, number> = {};
    for (const kv of parts[2].split(",")) {
      const [k, v] = kv.split("=");
      params[k] = parseInt(v, 10);
    }

    const salt = Buffer.from(parts[3], "base64url");
    const storedDk = Buffer.from(parts[4], "base64url");

    const derivedKey = await scryptAsync(password, salt, storedDk.length, {
      N: params["N"] ?? 16384,
      r: params["r"] ?? 8,
      p: params["p"] ?? 1,
      maxmem: 64 * 1024 * 1024,
    });

    return crypto.timingSafeEqual(derivedKey, storedDk);
  } catch (err) {
    console.error("[auth] scrypt verification error:", err);
    return false;
  }
}
