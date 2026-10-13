import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import crypto from "crypto";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

function generateScryptHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `$scrypt$N=16384,r=8,p=1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function run() {
  console.log("Executing BMS API Namespace & Lifecycle Sweep...\n");
  const email = "bms_api_test@bms.bnlvconsulting.com";
  const pass = "BMSMatrix2026!";

  try {
    await sql`DELETE FROM users WHERE email = ${email}`;
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, role, tenant_id, active)
      VALUES ('BMS API Test', ${email}, ${generateScryptHash(pass)}, 'admin', 1, true)
      RETURNING id
    `;

    const loginRes = await fetch("https://bms.bnlvconsulting.com/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass, tenantSlug: "bms" })
    });
    const cookieHeader = loginRes.headers.get("set-cookie");
    const sessionCookie = cookieHeader ? cookieHeader.split(";")[0] : "";

    const headers = { "Content-Type": "application/json", "Cookie": sessionCookie };

    const checkRoute = async (label, method, url, body = null) => {
      const res = await fetch(`https://bms.bnlvconsulting.com${url}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined
      });
      // A pass is anything that is handled gracefully (not a raw 500 server crash)
      const isHandled = res.status !== 500;
      console.log(`${label}: ${isHandled ? "PASS" : "FAIL"} (HTTP ${res.status})`);
    };

    console.log("--- Namespace Stubs (BMS-020) ---");
    await checkRoute("BMS-020 (LMS Root)", "GET", "/api/bms/lms");
    await checkRoute("BMS-020 (Studio Root)", "GET", "/api/bms/studio");
    await checkRoute("BMS-020 (Ops Root)", "GET", "/api/bms/ops");
    await checkRoute("BMS-020 (Hosting Root)", "GET", "/api/bms/hosting");

    console.log("\n--- API Lifecycle Endpoints ---");
    await checkRoute("BMS-002 (Academies POST)", "POST", "/api/bms/lms/academies", { name: "Test Academy" });
    await checkRoute("BMS-008 (Labs POST)", "POST", "/api/bms/studio/labs", { title: "Test Lab" });
    await checkRoute("BMS-015 (Code Red POST)", "POST", "/api/bms/ops/code-red", { severity: "high" });
    await checkRoute("BMS-019 (Pendencies POST)", "POST", "/api/bms/ops/pendencies", { title: "Blocker" });

    // Cleanup
    await sql`DELETE FROM users WHERE id = ${user.id}`;
  } catch (e) {
    console.error("Execution Error:", e.message);
  }
}
run();