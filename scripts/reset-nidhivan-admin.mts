import crypto from 'crypto';
import { promisify } from 'util';
import { getDb } from '../src/db/index.ts';
import { tenants, users } from '../src/db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

const scryptAsync = promisify(crypto.scrypt);
async function makeHash(password) {
  const salt = crypto.randomBytes(16);
  const dk = await scryptAsync(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return '$scrypt$N=16384,r=8,p=1$' + salt.toString('base64url') + '$' + dk.toString('base64url');
}

async function main() {
  const newPassword = process.argv[2] || 'Nidhivan@2026!';
  const email = 'admin@nidhivan.bnlvconsulting.com';
  const slug = 'nidhivan';
  const db = await getDb();

  const allTenants = await db.select().from(tenants);
  console.log('Current Tenants:', allTenants.map(t => ({ id: t.id, slug: t.slug, status: t.status })));

  let [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant) {
    [tenant] = await db.insert(tenants).values({
      name: 'Nidhivan Consulting',
      slug: 'nidhivan',
      plan: 'enterprise',
      status: 'active'
    }).returning();
    console.log('Created tenant nidhivan:', tenant.id);
  } else if (tenant.status !== 'active') {
    [tenant] = await db.update(tenants).set({ status: 'active' }).where(eq(tenants.id, tenant.id)).returning();
    console.log('Activated tenant nidhivan:', tenant.id);
  }

  await db.execute(sql`SELECT set_config('app.current_tenant_id', ${String(tenant.id)}, false)`);
  const hash = await makeHash(newPassword);

  const existing = await db.select().from(users).where(and(eq(users.email, email), eq(users.tenantId, tenant.id))).limit(1);
  if (existing.length === 0) {
    const [created] = await db.insert(users).values({
      tenantId: tenant.id,
      email,
      name: 'CA Ajay Kumar Sharma',
      role: 'owner',
      passwordHash: hash,
      active: true
    }).returning();
    console.log('Created user:', { id: created.id, email: created.email, tenantId: created.tenantId, role: created.role });
  } else {
    const [updated] = await db.update(users).set({
      passwordHash: hash,
      role: 'owner',
      active: true
    }).where(eq(users.id, existing[0].id)).returning();
    console.log('Updated user password:', { id: updated.id, email: updated.email, tenantId: updated.tenantId, role: updated.role });
  }
  console.log('\n=== READY TO LOGIN ===');
  console.log('Workspace ID :', slug);
  console.log('Email        :', email);
  console.log('Password     :', newPassword);
}
main().catch(e => { console.error(e); process.exit(1); });
