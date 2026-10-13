// TC-042: Cross-tenant session isolation
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(2);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("TC-042 · Cross-tenant session isolation");
  console.log("  Role:    studio_app (Forced via SET LOCAL ROLE)");
  console.log("  Context: app.current_tenant_id = '1' (bms)");
  console.log("  Query:   SELECT sessions WHERE tenant_id = 3 (limsy)");
  console.log("  Expect:  0 rows\n");

  try {
    const results = await sql.transaction([
      sql`SET LOCAL ROLE studio_app`, // 1. Downgrade to restricted app role
      sql`SELECT set_config('app.current_tenant_id', '1', true)`, // 2. Set tenant context
      sql`SELECT id, tenant_id, user_id FROM sessions WHERE tenant_id = 3 LIMIT 5` // 3. Attempt breach
    ]);

    const rows = results[2]; // The output is now the 3rd query in the array

    if (rows.length === 0) {
      console.log("RESULT: PASS — RLS blocked cross-tenant read (0 rows)");
      process.exit(0);
    } else {
      console.error(`RESULT: FAIL — ${rows.length} row(s) leaked across tenant boundary:`);
      console.error(JSON.stringify(rows, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(2);
  }
}

run();