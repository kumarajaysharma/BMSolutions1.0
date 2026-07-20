import { getDb } from "./index";
import { users, tenants } from "./schema";
import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

async function generateScryptHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const dk = (await scryptAsync(password, salt, 32, { N: 16384, r: 8, p: 1 })) as Buffer;
  return `$scrypt$N=16384,r=8,p=1$${salt.toString("base64url")}$${dk.toString("base64url")}`;
}

async function seed() {
  console.log("🌱 Starting seed...");
  const db = await getDb();

  // Create Tenant
  const [tenant] = await db.insert(tenants).values({
    name: "BNLV Group",
    slug: "bnlv",
  }).returning();
  
  // Create User with Scrypt
  const passwordHash = await generateScryptHash("Password123!");

  await db.insert(users).values({
    name: "Ajay Kumar",
    email: "admin@bnlvconsulting.com",
    passwordHash: passwordHash,
    tenantId: tenant.id,
    role: "owner",
    active: true,
  });

  console.log("✅ Seed complete! Login with: admin@bnlvconsulting.com / Password123!");
  process.exit();
}

seed();