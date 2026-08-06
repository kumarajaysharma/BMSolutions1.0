/**
 * src/db/sync-hash.ts
 * Surgically copies the working SuperAdmin password hash to the LIMSY admin.
 */
import { getDb } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function fix() {
  const db = await getDb();
  console.log("🔧 Syncing hashes...");
  
  // 1. Grab the known-working hash from the SuperAdmin
  const [superadmin] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!superadmin) {
    console.log("❌ SuperAdmin not found. Please run seed script first.");
    process.exit(1);
  }

  // 2. Paste it directly onto the LIMSY admin
  const [updatedUser] = await db.update(users)
    .set({ passwordHash: superadmin.passwordHash, active: true })
    .where(eq(users.email, "admin@limsy.bnlvconsulting.com"))
    .returning();
  
  if (updatedUser) {
    console.log("✅ Hash synced! The password for admin@limsy.bnlvconsulting.com is now: Password123!");
  } else {
    console.log("❌ LIMSY user not found in the database.");
  }
  process.exit(0);
}

fix();