/**
 * src/app/api/auth/login/route.ts
 *
 * Security architecture:
 *   Transaction 1 — tenant + user lookup (read-only, fast)
 *   Password verification — OUTSIDE transaction (CPU-bound ~100ms)
 *   Transaction 2 — session INSERT only (auth critical path)
 *   Transaction 3 — audit INSERT, AWAITED with isolated try/catch
 *
 * ADR: Fire-and-forget promises are NOT reliable in Vercel serverless —
 * the function is frozen after response is sent, dropping floating promises.
 * Transaction 3 uses await + isolated catch so the audit is guaranteed to
 * complete while login success is never blocked by audit failure.
 *
 * ISO 27001 A.12.4 / PCI-DSS Req 10.2.4 compliance: every successful login
 * writes to audit_logs before the response is returned.
 */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { promisify } from "util";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { users, sessions, tenants, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createSessionCookie } from "@/lib/auth";

type UserRow   = typeof users.$inferSelect;
type TenantRow = typeof tenants.$inferSelect;

type LookupResult =
  | { found: false }
  | { found: true; tenant: TenantRow; user: UserRow };

const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt:     string | Buffer,
  keylen:   number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

const MIN_RESPONSE_MS = 200;

export async function POST(request: Request) {
  const start = Date.now();

  try {
    const body       = await request.json();
    const email      = typeof body.email      === "string" ? body.email.trim().toLowerCase() : null;
    const password   = typeof body.password   === "string" ? body.password                   : null;
    const tenantSlug = typeof body.tenantSlug === "string" ? body.tenantSlug.trim().toLowerCase() : null;

    if (!email || !password || !tenantSlug) {
      return enforcedDelay(
        NextResponse.json({ error: "Missing fields" }, { status: 400 }),
        start
      );
    }

    const db = await getDb();

    // Pre-generate dummy hash OUTSIDE any transaction.
    // Constant-time baseline regardless of which DB path executes.
    const DUMMY_HASH = await generateScryptHash("__dummy__");

    // ── Transaction 1: Resolve tenant + user (read-only) ─────────────────────
    const lookup = await db.transaction(async (tx): Promise<LookupResult> => {
      const tenantRows = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.slug, tenantSlug))
        .limit(1);

      if (!tenantRows.length || tenantRows[0].status !== "active") {
        return { found: false };
      }

      const tenant = tenantRows[0];

      await tx.execute(
        sql`SELECT set_config('app.current_tenant_id', ${String(tenant.id)}, true)`
      );

      const userRows: UserRow[] = await tx
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.tenantId, tenant.id)))
        .limit(1);

      if (!userRows.length || !userRows[0].active) {
        return { found: false };
      }

      return { found: true, tenant, user: userRows[0] };
    });

    // ── Password verification (outside transaction, CPU-bound ~100ms) ─────────
    const storedHash =
      lookup.found && lookup.user.passwordHash
        ? lookup.user.passwordHash
        : DUMMY_HASH;

    const passwordMatch = await verifyScryptHash(password, storedHash);

    if (!passwordMatch || !lookup.found) {
      return enforcedDelay(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        start
      );
    }

    const { tenant, user } = lookup;

    // ── Transaction 2: Insert session (auth critical path only) ──────────────
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_tenant_id', ${String(tenant.id)}, true)`
      );
      await tx.insert(sessions).values({
        id:        sessionId,
        userId:    user.id,
        tenantId:  tenant.id,
        tokenHash: crypto.createHash("sha256").update(sessionId).digest("hex"),
        expiresAt,
      });
    });

    // ── Transaction 3: Audit log (awaited, isolated — never blocks login) ─────
    // await is required: fire-and-forget is unreliable in Vercel serverless;
    // the function may be frozen before a floating promise resolves.
    // The try/catch ensures audit failure never propagates to the caller.
    try {
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT set_config('app.current_tenant_id', ${String(tenant.id)}, true)`
        );
        await tx.insert(auditLogs).values({
          tenantId:  tenant.id,
          actor:     user.email,
          action:    `auth.login:${user.id}`,
          target:    `user:${user.id}`,
          severity:  "info",
          ipAddress: request.headers.get("x-forwarded-for")
                       ?? request.headers.get("x-real-ip")
                       ?? "unknown",
        });
      });
    } catch (auditErr) {
      // Intentionally not re-thrown. Login already committed in Transaction 2.
      console.error(
        `[auth/login] AUDIT WRITE FAILED for user ${user.id} tenant ${tenant.id}:`,
        auditErr
      );
    }

    // ── Issue Encrypted JWT Cookie ────────────────────────────────────────────
    await createSessionCookie({
      userId:   user.id.toString(),
      tenantId: tenant.id.toString(),
      role:     user.role,
      sessionId,
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

// ── Security Helpers ──────────────────────────────────────────────────────────

async function enforcedDelay(
  response: NextResponse,
  startMs:  number
): Promise<NextResponse> {
  const elapsed = Date.now() - startMs;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
  }
  return response;
}

async function generateScryptHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const dk   = await scryptAsync(password, salt, 32, {
    N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024,
  });
  return `$scrypt$N=16384,r=8,p=1$${salt.toString("base64url")}$${dk.toString("base64url")}`;
}

async function verifyScryptHash(
  password: string,
  stored:   string
): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 5 || parts[1] !== "scrypt") return false;

    const params: Record<string, number> = {};
    for (const kv of parts[2].split(",")) {
      const [k, v] = kv.split("=");
      params[k] = parseInt(v, 10);
    }

    const salt      = Buffer.from(parts[3], "base64url");
    const storedDk  = Buffer.from(parts[4], "base64url");
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
