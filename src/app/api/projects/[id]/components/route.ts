import { NextResponse } from "next/server";
import { db } from "@/db";
import { builderComponents, auditLogs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { COMPONENT_CATALOG } from "@/lib/codegen";
import { invalidateCache } from "@/lib/server-cache";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(builderComponents)
    .where(eq(builderComponents.projectId, Number(id)))
    .orderBy(asc(builderComponents.sortOrder));
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const catalog = COMPONENT_CATALOG[body.type];
  if (!catalog) {
    return NextResponse.json({ error: "unknown component type" }, { status: 400 });
  }
  const existing = await db
    .select()
    .from(builderComponents)
    .where(eq(builderComponents.projectId, Number(id)));
  const [row] = await db
    .insert(builderComponents)
    .values({
      projectId: Number(id),
      type: body.type,
      props: { ...catalog.defaults },
      sortOrder: existing.length,
    })
    .returning();
  await db.insert(auditLogs).values({
    actor: "visual-builder",
    action: `component.add:${body.type}`,
    target: `project:${id}`,
  });
  invalidateCache("projects");
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const body = await req.json(); // { componentId, props?, sortOrder? }
  const patch: Partial<{ props: Record<string, string>; sortOrder: number }> = {};
  if (body.props) patch.props = body.props;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
  const [row] = await db
    .update(builderComponents)
    .set(patch)
    .where(eq(builderComponents.id, Number(body.componentId)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  await db
    .delete(builderComponents)
    .where(eq(builderComponents.id, Number(body.componentId)));
  await db.insert(auditLogs).values({
    actor: "visual-builder",
    action: "component.remove",
    target: `project:${id}`,
  });
  invalidateCache("projects");
  return NextResponse.json({ ok: true });
}
