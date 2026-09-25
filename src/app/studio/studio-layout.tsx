/**
 * src/app/studio/layout.tsx
 *
 * BNLV Studio — Server Layout Wrapper
 * =====================================
 * Reads verified identity from middleware-injected headers (x-user-id,
 * x-user-role, x-tenant-id) and wraps every /studio/* page with the Shell
 * navigation component.
 *
 * ARCHITECTURE NOTE:
 *   The BNLV Zero Trust middleware (src/proxy.ts) runs BEFORE this layout:
 *   - Step 2:  Strips all client-supplied x-* headers (spoofing prevention)
 *   - Step 4:  Verifies JWT HS256 (jose)
 *   - Step 6:  Injects x-user-id, x-user-role, x-tenant-id from verified JWT
 *
 *   This layout trusts these headers because they are downstream of the
 *   verified JWT injection. They cannot be forged by the client.
 *   If any header is missing, the middleware already redirected to /login.
 *
 *   IMPORTANT: This layout uses next/headers which is SERVER-ONLY.
 *   It must never be imported into Edge Runtime (middleware, proxy.ts).
 *
 * RBAC COLOURS (avatar hue by role):
 *   owner: 32°   admin: 232°  architect: 270°
 *   developer: 160°  designer: 320°  viewer: 0°
 *
 * ADDING NEW STUDIO ROUTES:
 *   Any file placed under src/app/studio/**\/page.tsx automatically
 *   inherits this layout. No registration required.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { withTenant } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// ── Role → avatar hue mapping ─────────────────────────────────────────────────
const ROLE_HUE: Record<string, number> = {
  owner:     32,    // gold
  admin:     232,   // navy-blue
  architect: 270,   // indigo
  developer: 160,   // green
  designer:  320,   // pink
  viewer:    0,     // grey
};

// ── Brand slug → display name mapping ────────────────────────────────────────
const BRAND_NAME: Record<string, string> = {
  bms:      'BMSolutions',
  nidhivan: 'Nidhivan Consulting',
  limsy:    'LIMSY',
  vihang:   'Vihang Creations',
  bnlv:     'BNLV Group',
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Read middleware-injected verified headers ─────────────────────────────
  const hdrs = await headers();

  const rawUserId   = hdrs.get('x-user-id');
  const rawTenantId = hdrs.get('x-tenant-id');
  const role        = hdrs.get('x-user-role');

  // Middleware already handles redirect on missing JWT; this is a failsafe
  if (!rawUserId || !rawTenantId || !role) {
    redirect('/login');
  }

  const userId   = parseInt(rawUserId, 10);
  const tenantId = parseInt(rawTenantId, 10);

  if (isNaN(userId) || isNaN(tenantId)) {
    redirect('/login');
  }

  // ── Fetch user name + tenant slug for Shell display ───────────────────────
  // Uses withTenant so the query runs inside the RLS context for the tenant.
  // Falls back to safe defaults if the DB query fails (defensive).
  let displayName  = 'Admin';
  let displayEmail = 'admin@bnlvconsulting.com';
  let tenantSlug   = 'bms';

  try {
    const [row] = await withTenant(tenantId, async (tx) =>
      tx
        .select({
          email: users.email,
          slug:  tenants.slug,
        })
        .from(users)
        .innerJoin(tenants, eq(tenants.id, users.tenantId))
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId),
          )
        )
        .limit(1)
    );

    if (row) {
      displayEmail = row.email;
      tenantSlug   = row.slug;
      // Derive a display name from email (admin@bms.bnlvconsulting.com → "Admin")
      const localPart = row.email.split('@')[0] ?? 'admin';
      displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
  } catch {
    // Non-fatal — Shell renders with defaults; user can still navigate
    console.warn('[StudioLayout] Could not fetch user display name from DB');
  }

  const userProps = {
    name:      displayName,
    email:     displayEmail,
    role,
    brand:     BRAND_NAME[tenantSlug] ?? 'BNLV Group',
    avatarHue: ROLE_HUE[role] ?? 232,
  };

  return (
    <Shell user={userProps}>
      {children}
    </Shell>
  );
}
