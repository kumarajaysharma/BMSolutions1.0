// TC-046, 047, 054-058: RLS, Isolation, and Immutability Checks
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Executing DB Fortress Suite...\n");

  try {
    // TC-047: Verify bypass is absent
    const bypassCheck = await sql`
      SELECT tablename FROM pg_policies 
      WHERE schemaname = 'public' AND policyname = 'tmp_studio_app_bypass'
    `;
    console.log(`TC-047 (Bypass Absent): ${bypassCheck.length === 0 ? "PASS" : "FAIL"}`);

    // Execute Cross-Tenant Isolation Checks
    const isolationResults = await sql.transaction([
      sql`SET LOCAL ROLE studio_app`,
      sql`SELECT set_config('app.current_tenant_id', '1', true)`,
      
      sql`SELECT count(*) as c FROM limsy_cases`, // TC-046 & 055
      sql`SELECT count(*) as c FROM limsy_documents`, // TC-055
      sql`SELECT count(*) as c FROM nidhivan_financial_metrics`, // TC-056
      sql`SELECT count(*) as c FROM vault_secrets WHERE tenant_id != 1` // TC-054
    ]);

    console.log(`TC-046 (LIMSY Cases isolated): ${isolationResults[2][0].c === '0' ? "PASS" : "FAIL"}`);
    console.log(`TC-055 (LIMSY DPDP isolated): ${isolationResults[3][0].c === '0' ? "PASS" : "FAIL"}`);
    console.log(`TC-056 (Nidhivan Financials isolated): ${isolationResults[4][0].c === '0' ? "PASS" : "FAIL"}`);
    console.log(`TC-054 (Vault Secrets isolated): ${isolationResults[5][0].c === '0' ? "PASS" : "FAIL"}`);

    // TC-057: Immutability — DELETE privilege revoked for studio_app on bms_certificates
    // Uses has_table_privilege() catalog query — does not require an existing row or role
    // switching via SET LOCAL ROLE (unreliable over Neon pooled connections).
    // Migration 0022: REVOKE DELETE ON bms_certificates FROM studio_app
    try {
      const tc057 = await sql`
        SELECT has_table_privilege('studio_app', 'bms_certificates', 'delete') AS can_delete
      `;
      const canDelete = tc057[0].can_delete;
      console.log(
        `TC-057 (DELETE bms_certificates): ${canDelete === false ? "PASS (privilege revoked)" : "FAIL (privilege still granted)"}`
      );
    } catch (e) {
      console.log(`TC-057 (DELETE bms_certificates): ERROR (${e.message})`);
    }

    // TC-058: Immutability — TRUNCATE privilege absent for studio_app on nidhivan_journals
    // PostgreSQL does not grant TRUNCATE by default; this confirms it was never granted.
    // has_table_privilege() supports 'truncate' as a valid privilege type (PG 9.0+).
    try {
      const tc058 = await sql`
        SELECT has_table_privilege('studio_app', 'nidhivan_journals', 'truncate') AS can_truncate
      `;
      const canTruncate = tc058[0].can_truncate;
      console.log(
        `TC-058 (TRUNCATE nidhivan_journals): ${canTruncate === false ? "PASS (privilege absent)" : "FAIL (privilege present)"}`
      );
    } catch (e) {
      console.log(`TC-058 (TRUNCATE nidhivan_journals): ERROR (${e.message})`);
    }

  } catch (err) {
    console.error("Execution Error:", err);
  }
}

run();