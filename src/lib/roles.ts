/**
 * src/lib/roles.ts
 *
 * Canonical role hierarchy and RBAC helpers.
 * Imported by: src/middleware.ts, src/lib/request-context.ts
 *
 * This file must NOT import from "@/db" — it runs on the Edge Runtime
 * where Node.js modules are unavailable.
 */

// Array index represents privilege level (0 = highest privilege)
export const ROLE_HIERARCHY = [
  "owner",     // 0
  "admin",     // 1
  "architect", // 2
  "developer", // 3
  "designer",  // 4
  "viewer",    // 5
] as const;

export type AppRole = (typeof ROLE_HIERARCHY)[number];

/**
 * Returns true if `actual` role satisfies the `required` minimum level.
 * owner > admin > architect > developer > designer > viewer
 *
 * Example: hasMinimumRole("admin", "admin")      → true
 *          hasMinimumRole("developer", "admin")   → false
 *          hasMinimumRole("owner", "viewer")      → true
 */
export function hasMinimumRole(actual: string, required: AppRole): boolean {
  // We accept 'actual' as a string to handle unexpected runtime input 
  // safely when reading from headers or decoded JWTs.
  const actualIndex = ROLE_HIERARCHY.indexOf(actual as AppRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(required);

  // CRITICAL SECURITY FAILSAFE:
  // If an invalid role string is passed, indexOf returns -1.
  // Without this check, -1 <= 1 evaluates to TRUE, bypassing security.
  if (actualIndex === -1 || requiredIndex === -1) {
    return false;
  }

  return actualIndex <= requiredIndex;
}