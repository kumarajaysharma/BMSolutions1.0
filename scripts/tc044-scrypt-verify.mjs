// TC-044: scrypt hash verification — known-good vector
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import crypto from "crypto";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(2);
}

const sql = neon(process.env.DATABASE_URL);

// Standardized scrypt generation matching your internal format
function generateScryptHash(password) {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1, keyLen = 32;
  const hash = crypto.scryptSync(password, salt, keyLen, { N, r, p });
  
  const saltBase64 = salt.toString("base64");
  const hashBase64 = hash.toString("base64");
  
  return `$scrypt$N=${N},r=${r},p=${p}$${saltBase64}$${hashBase64}`;
}

async function run() {
  console.log("TC-044 · BLOCKER · scrypt hash verification — known-good vector");
  
  const testEmail = "tc044_vector@bms.bnlvconsulting.com";
  const plaintextPass = "KnownGood2026!";
  
  try {
    const hashed = generateScryptHash(plaintextPass);
    console.log(`  1. Generated known vector for: ${plaintextPass}`);
    console.log(`     Hash: ${hashed.substring(0, 35)}...`);
    
    // Clean up any previous runs
    await sql`DELETE FROM users WHERE email = ${testEmail}`;
    
    console.log(`  2. Injecting test user into database (Tenant ID 1)...`);
    // Insert directly via root connection to bypass RLS for setup
    await sql`
      INSERT INTO users (name, email, password_hash, role, tenant_id)
      VALUES ('TC044 Vector', ${testEmail}, ${hashed}, 'viewer', 1)
    `;
    
    console.log(`  3. Firing POST /api/auth/login with known password...`);
    const response = await fetch("https://bms.bnlvconsulting.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: plaintextPass,
        tenantSlug: "bms"
      })
    });

    const status = response.status;
    console.log(`     Response Code: ${status}`);

    // Cleanup
    await sql`DELETE FROM users WHERE email = ${testEmail}`;

    // Evaluate
    if (status === 200) {
      console.log("\nRESULT: PASS — API successfully verified the scrypt hash vector (200 OK)");
      process.exit(0);
    } else {
      const text = await response.text();
      console.error(`\nRESULT: FAIL — Expected 200, got ${status}.`);
      console.error(`Response Body: ${text}`);
      process.exit(1);
    }

  } catch (err) {
    console.error("\nERROR:", err.message);
    process.exit(2);
  }
}

run();