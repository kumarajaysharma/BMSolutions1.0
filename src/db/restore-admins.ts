/**
 * src/db/restore-admins.ts
 * Universal Admin Credential Restoration Script
 */
import { getDb } from "./index";
import { users, tenants } from "./schema";
import { eq } from "drizzle-orm";

async function restoreAll() {
  const db = await getDb();
  console.log("[RESTORE] Fetching verified Apex SuperAdmin hash...");
  
  const [superadmin] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!superadmin) {
    console.error("[ERROR] SuperAdmin not found. Cannot clone hash.");
    process.exit(1);
  }

  const allTenants = await db.select().from(tenants);
  
  for (const t of allTenants) {
    if (t.slug === "bnlv") continue;
    
    const adminEmail = `admin@${t.slug}.bnlvconsulting.com`;
    const [existing] = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existing) {
      await db.update(users)
        .set({ passwordHash: superadmin.passwordHash, active: true, role: "admin" })
        .where(eq(users.id, existing.id));
      console.log(`[OK] Restored Hash: ${adminEmail} (Workspace: ${t.slug})`);
    } else {
      await db.insert(users).values({
        tenantId: t.id,
        name: `${t.name} Admin`,
        email: adminEmail,
        passwordHash: superadmin.passwordHash,
        role: "admin",
        active: true,
      });
      console.log(`[OK] Created Missing Admin: ${adminEmail} (Workspace: ${t.slug})`);
    }
  }
  
  console.log("\n[SUCCESS] All subsidiary admins are active.");
  process.exit(0);
}

restoreAll().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});