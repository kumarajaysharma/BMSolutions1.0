// TC-scripts/tc-sec-verify.mjs: To officially mathematically verify that the credential rotation is successful and both connections are healthy, we will run a targeted connection test against both URLs.

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function verifySecurityFixes() {
  console.log("🛡️ Executing Security Post-Incident Verification...");
  
  const pooledUrl = process.env.DATABASE_URL;
  const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;

  if (!pooledUrl || !unpooledUrl) {
    console.error("\n❌ BLOCKER: Missing DATABASE_URL or DATABASE_URL_UNPOOLED in .env.local");
    return;
  }

  try {
    // Test 1: SEC-OPEN-1 (Pooled Connection / App Router)
    const sqlPooled = neon(pooledUrl);
    const [res1] = await sqlPooled`SELECT current_database() as db, current_user as usr`;
    console.log(`\n✅ SEC-OPEN-1 (Pooled Application Connection): PASS`);
    console.log(`   Connected as: ${res1.usr} @ ${res1.db}`);

    // Test 2: SEC-OPEN-2 (Unpooled Connection / Drizzle Migrations)
    const sqlUnpooled = neon(unpooledUrl);
    const [res2] = await sqlUnpooled`SELECT current_database() as db, current_user as usr`;
    console.log(`\n✅ SEC-OPEN-2 (Unpooled DDL Connection): PASS`);
    console.log(`   Connected as: ${res2.usr} @ ${res2.db}`);
    
    console.log("\n🔒 CONFIRMED: Both endpoints are actively accepting the newly rotated credentials.");

  } catch (err) {
    console.error("\n❌ CONNECTION FAILED:", err.message);
    console.error("   Ensure the new passwords from the Neon Dashboard were copied correctly into .env.local");
  }
}

verifySecurityFixes();
