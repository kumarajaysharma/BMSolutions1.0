/**
 * src/lib/tenant.ts
 * BNLV Group — Tenant Context Wrapper
 * Extracts tenant and user identity from proxy-injected headers.
 */
import { NextRequest, NextResponse } from "next/server";

export interface TenantContext {
  tenantId: number;
  userId: number;
  role: string;
  tenantSlug: string;
}

export function withTenant(
  handler: (req: NextRequest, ctx: TenantContext) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const tenantIdStr  = req.headers.get("x-tenant-id");
      const userIdStr    = req.headers.get("x-user-id");
      const role         = req.headers.get("x-user-role");
      const tenantSlug   = req.headers.get("x-tenant-slug");

      if (!tenantIdStr || !userIdStr || !role || !tenantSlug) {
        return NextResponse.json(
          { error: "UNAUTHORIZED", detail: "Missing tenant or user context headers" },
          { status: 401 }
        );
      }

      const ctx: TenantContext = {
        tenantId:   parseInt(tenantIdStr, 10),
        userId:     parseInt(userIdStr,   10),
        role,
        tenantSlug,
      };

      return await handler(req, ctx);
    } catch (error: unknown) {
      console.error("[withTenant] Error:", error);
      return NextResponse.json(
        { error: "INTERNAL_SERVER_ERROR", detail: (error as Error).message },
        { status: 500 }
      );
    }
  };
}
