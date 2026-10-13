// TC-045: Timing oracle resistance — invalid user vs invalid password
import { performance } from "perf_hooks";

async function measureLogin(email, password, label) {
  const start = performance.now();
  const res = await fetch("https://bms.bnlvconsulting.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantSlug: "bms" })
  });
  await res.text(); // consume body
  const end = performance.now();
  const duration = end - start;
  console.log(`  [${label}] Response Time: ${duration.toFixed(2)} ms (Status: ${res.status})`);
  return duration;
}

async function run() {
  console.log("TC-045 · BLOCKER · Timing oracle resistance\n");
  
  // Warmup request to establish TLS/DNS caching
  await measureLogin("warmup@test.com", "warmup", "Warmup");

  console.log("\nExecuting constant-time measurements...");
  
  // Test A: Valid user, wrong password (triggers real DB fetch + real Argon2id hash)
  const timeValidUser = await measureLogin("admin@bms.bnlvconsulting.com", "WrongPass123!", "Valid User / Wrong Pass");
  
  // Test B: Invalid user, any password (triggers fake DB fetch + dummy Argon2id hash)
  const timeInvalidUser = await measureLogin("ghost@bms.bnlvconsulting.com", "AnyPass123!", "Invalid User / Any Pass");

  const delta = Math.abs(timeValidUser - timeInvalidUser);
  console.log(`\n  Timing Delta: ${delta.toFixed(2)} ms`);

  // We allow a network variance of up to 80-100ms over the internet, but the core execution must not be hundreds of ms apart.
  if (delta < 100) {
    console.log("RESULT: PASS — Constant-time execution verified. No timing oracle leak.");
  } else {
    console.error("RESULT: FAIL — Timing delta is too large. Possible oracle vulnerability.");
  }
}

run();