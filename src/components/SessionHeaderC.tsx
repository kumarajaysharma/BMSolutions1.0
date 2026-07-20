/**
 * src/components/SessionHeaderC.tsx
 *
 * Async Server Component — reads the JWT cookie directly on the server,
 * resolves user name and tenant name from the DB, and renders the session bar.
 *
 * Zero client JavaScript. Zero loading spinner. Zero layout shift.
 * The page arrives from the server already showing the user's name and role.
 */

import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { getDb } from "@/db/index";
import { users, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import LogoutButton from "./LogoutButton";
import { Building2, User } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  architect: "Architect",
  developer: "Developer",
  designer: "Designer",
  viewer: "Viewer",
};

// Mapped to your premium Navy/Gold/Cream/Accent aesthetic
const ROLE_COLOURS: Record<string, string> = {
  owner: "bg-amber-900/40 text-amber-400 border-amber-700/50",
  admin: "bg-blue-900/40 text-blue-400 border-blue-700/50",
  architect: "bg-cyan-900/40 text-cyan-400 border-cyan-700/50",
  developer: "bg-emerald-900/40 text-emerald-400 border-emerald-700/50",
  designer: "bg-fuchsia-900/40 text-fuchsia-400 border-fuchsia-700/50",
  viewer: "bg-slate-800 text-slate-400 border-slate-700",
};

export default async function SessionHeader() {
  // 1. Read JWT from httpOnly cookie — server-side only
  // 'await' is required here because cookies() is asynchronous in Next.js 16+
  const cookieStore = await cookies();
  const token = cookieStore.get("bms_session")?.value;

  if (!token) return null;

  // 2. Verify and decode
  const session = await decrypt(token);
  if (!session?.userId || !session?.tenantId) return null;

  // 3. Read-only, pre-tenant-context lookup using the global pool
  const db = await getDb();
  const [userData] = await db
    .select({
      userName: users.name,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, Number(session.userId)))
    .limit(1);

  if (!userData) return null;

  const role = session.role ?? "viewer";
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColour = ROLE_COLOURS[role] ?? ROLE_COLOURS.viewer;

  return (
    <header className="h-16 bg-slate-900 border-b border-amber-900/30 flex items-center justify-between px-6 shadow-sm sticky top-0 z-30">
      {/* Left — tenant context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-amber-50">
          <Building2 size={18} className="text-amber-500 shrink-0" />
          <span className="font-semibold tracking-wide truncate">
            {userData.tenantName}
          </span>
          {userData.tenantSlug && (
            <span className="hidden sm:inline text-xs text-slate-400 font-mono truncate">
              ({userData.tenantSlug})
            </span>
          )}
        </div>
        <div className="h-4 w-px bg-slate-700 shrink-0"></div>
        <div className="flex items-center gap-2">
          <span className={`text-xs uppercase tracking-wider font-bold px-2 py-1 rounded border ${roleColour}`}>
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Right — user identity + logout */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <div className="hidden sm:flex h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 items-center justify-center shadow-sm shrink-0 border border-slate-600">
            <span className="text-xs font-bold text-amber-50 select-none">
              {userData.userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden md:block max-w-36 truncate">{userData.userName}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}