/**
 * src/app/api/projects/[id]/components/route.ts
 *
 * Visual Builder Components API
 * 
 * FIXES applied:
 *   1. ADR-002 Enforcement: Added fetchCache = "force-no-store" and runtime = "nodejs".
 *   2. ADR-001 Enforcement: Wrapped all operations in withTenant(tenantId, tx => ...) for RLS.
 *   3. Zero Trust Security: Replaced manual tenant resolution with getRequestContext and requireRole.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/db";
import { builderComponents, auditLogs } from "@/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { COMPONENT_CATALOG } from "@/lib/codegen";
import { invalidateCache } from "@/lib/server-cache";
import { getRequestContext, requireRole } from "@/lib/request-context";

// --- NEXT.JS FETCH CACHE BYPASS FOR NEON HTTP TRANSACTIONS (ADR-002) ---
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; // CRITICAL: Prevents Next.js from hijacking BEGIN commands
export const runtime = "nodejs";            // CRITICAL: Required for Neon HTTP driver stability

// ─────────────────────────────────────────────────────────────────────────────
// GET — Fetch all components for a project
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "viewer");
    if (denied) return denied;

    const { id } = await params;
    const projectId = Number(id);

    // ADR-001: RLS enforcement
    const rows = await withTenant(ctx.tenantId, async (tx) => {
      return await tx
        .select()
        .from(builderComponents)
        .where(eq(builderComponents.projectId, projectId))
        .orderBy(asc(builderComponents.sortOrder));
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[GET_COMPONENTS_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Add a new component to the project
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "developer");
    if (denied) return denied;

    const { id } = await params;
    const projectId = Number(id);
    const body = await req.json();
    
    const catalog = COMPONENT_CATALOG[body.type];
    if (!catalog) {
      return NextResponse.json({ error: "unknown component type" }, { status: 400 });
    }

    const tenantId = ctx.tenantId || 1;
    const actor = ctx.userId ? `user:${ctx.userId}` : "system:visual-builder";

    // ADR-001: RLS enforced transaction
    const row = await withTenant(tenantId, async (tx) => {
      // Get existing components count for sortOrder
      const existing = await tx
        .select({ id: builderComponents.id })
        .from(builderComponents)
        .where(eq(builderComponents.projectId, projectId));

      const [inserted] = await tx
        .insert(builderComponents)
        .values({
          tenantId,
          projectId,
          type: body.type,
          props: { ...catalog.defaults },
          sortOrder: existing.length,
        })
        .returning();

      await tx.insert(auditLogs).values({
        tenantId,
        actor,
        action: `component.add:${body.type}`,
        target: `project:${projectId}`,
        severity: "info",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
      });

      return inserted;
    });

    invalidateCache("projects");
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("[POST_COMPONENT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update component props or sort order
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "developer");
    if (denied) return denied;

    await params; // Ensure params is awaited per Next.js 15 routing rules
    const body = await req.json(); // { componentId, props?, sortOrder? }
    
    if (!body.componentId) {
      return NextResponse.json({ error: "componentId is required" }, { status: 400 });
    }

    const patch: Partial<{ props: Record<string, string>; sortOrder: number }> = {};
    if (body.props) patch.props = body.props;
    if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;

    const row = await withTenant(ctx.tenantId, async (tx) => {
      const [updated] = await tx
        .update(builderComponents)
        .set(patch)
        .where(eq(builderComponents.id, Number(body.componentId)))
        .returning();
      return updated;
    });

    if (!row) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("[PATCH_COMPONENT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Remove a component
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = getRequestContext(req);
    const denied = requireRole(ctx, "developer");
    if (denied) return denied;

    const { id } = await params;
    const projectId = Number(id);
    const body = await req.json();

    if (!body.componentId) {
      return NextResponse.json({ error: "componentId is required" }, { status: 400 });
    }

    const tenantId = ctx.tenantId || 1;
    const actor = ctx.userId ? `user:${ctx.userId}` : "system:visual-builder";

    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(builderComponents)
        .where(eq(builderComponents.id, Number(body.componentId)));

      await tx.insert(auditLogs).values({
        tenantId,
        actor,
        action: "component.remove",
        target: `project:${projectId}`,
        severity: "info",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
      });
    });

    invalidateCache("projects");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE_COMPONENT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}