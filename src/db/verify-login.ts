/**
 * src/db/verify-login.ts
 * BNLV Group Enterprise Login Verification Script
 */

import { getDb } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

async function verifyScryptHash(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 5 || parts[1] !== "scrypt") return false;
    
    const paramsPart = parts[2];
    const saltStr = parts[3];
    const dkStr = parts[4];

    const params: Record<string, number> = {};
    paramsPart.split(",").forEach(param => {
      const [k, v] = param.split("=");
      params[k] = parseInt(v, 10);
    });

    const salt = Buffer.from(saltStr, "base64url");
    const expectedDk = Buffer.from(dkStr, "base64url");

    const computedDk = await scryptAsync(password, salt, expectedDk.length, {
      N: params.N,
      r: params.r,
      p: params.p,
    });

    return crypto.timingSafeEqual(computedDk, expectedDk);
  } catch (err) {
    return false;
  }
}

async function verify() {
  console.log("🔍 Checking user: admin@bnlvconsulting.com");
  const db = await getDb();
  
  const [user] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!user) {
    console.error("❌ CRITICAL: User not found in database.");
    return;
  }

  console.log("✅ User found in DB. Checking password hash via scrypt...");
  const isMatch = await verifyScryptHash("Password123!", user.passwordHash);
  
  if (isMatch) {
    console.log("🎉 Password match SUCCESSFUL. Database is fine.");
  } else {
    console.error("❌ Password match FAILED. Your database hash does not match 'Password123!'");
  }
}

verify().catch((err) => console.error("❌ Script Error:", err));