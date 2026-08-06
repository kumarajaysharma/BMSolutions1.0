import { NextRequest } from "next/server";

export interface TenantContext {
  isAuthenticated: boolean;
  tenantId: string;
  role: string;
}

export async function withTenant(req: NextRequest): Promise<TenantContext | null> {
  try {
    const tenantId = req.headers.get("x-tenant-id");
    const role = req.headers.get("x-user-role") || "admin";

    if (!tenantId) {
      return null;
    }

    return {
      isAuthenticated: true,
      tenantId,
      role,
    };
  } catch {
    return null;
  }
}