import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function auditAndRevokeBypass() {
  console.log("🛡️ Executing RLS Privilege Audit on 'neondb_owner'...");
  
  const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
  if (!unpooledUrl) {
    console.error("❌ BLOCKER: Missing DATABASE_URL_UNPOOLED in .env.local");
    return;
  }

  try {
    const sql = neon(unpooledUrl);

    // 1. Query the pg_roles catalog for the exact attribute
    const [roleInfo] = await sql`
      SELECT rolname, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = 'neondb_owner'
    `;

    if (!roleInfo) {
      console.log("⚠️ Role 'neondb_owner' not found. Check your database username.");
      return;
    }

    console.log(`🔍 Current Status -> Role: ${roleInfo.rolname}, BYPASSRLS: ${roleInfo.rolbypassrls}`);

    // 2. Revoke if it exists
    if (roleInfo.rolbypassrls === true) {
      console.log("🚨 VULNERABILITY DETECTED: BYPASSRLS is TRUE. Revoking immediately...");
      
      // ALTER ROLE requires the unpooled DDL connection
      await sql`ALTER ROLE neondb_owner NOBYPASSRLS;`;
      
      // 3. Verify the revocation
      const [verify] = await sql`
        SELECT rolbypassrls 
        FROM pg_roles 
        WHERE rolname = 'neondb_owner'
      `;
      
      if (verify.rolbypassrls === false) {
        console.log(`✅ SEC-OPEN-3 (BYPASSRLS Revocation): PASS. Privilege successfully stripped.`);
      } else {
        console.error("❌ FAILED: Could not revoke BYPASSRLS. You may need to do this manually in the Neon SQL Editor.");
      }
    } else {
      console.log("✅ SEC-OPEN-3 (BYPASSRLS Audit): PASS. The role is already restricted. Zero-trust is intact.");
    }

  } catch (err) {
    console.error("\n❌ AUDIT FAILED:", err.message);
  }
}

auditAndRevokeBypass();