import { getDb } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function verify() {
  console.log("🔍 Checking user: admin@bnlvconsulting.com");
  const db = await getDb();
  
  const [user] = await db.select().from(users).where(eq(users.email, "admin@bnlvconsulting.com"));
  
  if (!user) {
    console.error("❌ CRITICAL: User not found in database.");
    return;
  }

  console.log("✅ User found in DB. Checking password...");
  const isMatch = await bcrypt.compare("Password123!", user.passwordHash!);
  
  if (isMatch) {
    console.log("🎉 Password match SUCCESSFUL. Database is fine.");
  } else {
    console.error("❌ Password match FAILED. Your database hash does not match 'Password123!'");
  }
}

verify().catch((err) => console.error("❌ Script Error:", err));