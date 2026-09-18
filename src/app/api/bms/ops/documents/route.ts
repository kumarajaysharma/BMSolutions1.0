/**
 * src/app/api/bms/ops/documents/route.ts
 * BMS Ops — Document Vault
 * GET (?type=<type>)  POST  PATCH ?id=<id>
 * Type filter pushed into WHERE clause — avoids implicit-any on .filter()
 */
import { NextResponse }       from "next/server";
import { eq, and, desc }      from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsDocuments }       from "@/db/schema";
import { z }                  from "zod";

const DocTypeEnum = z.enum(["Playbook", "Technical Guide", "Standard", "Policy", "Template", "Report"]);

const DocSchema = z.object({
  code:        z.string().min(1).max(20),
  title:       z.string().min(2).max(255),
  type:        DocTypeEnum.default("Playbook"),
  description: z.string().min(5),
  body:        z.string().default(""),
  version:     z.string().default("v1.0"),
  owner:       z.string().default("BNLV R&D"),
  pages:       z.number().int().min(1).default(12),
  sharedWith:  z.array(z.string()).default([]),
});

const _GET = withTenant(async (req, ctx) => {
  const typeFilter = new URL(req.url).searchParams.get("type");

  const docs = await dbTx(ctx.tenantId, async (tx) => {
    if (typeFilter) {
      return tx.select().from(bmsDocuments)
        .where(and(
          eq(bmsDocuments.tenantId, ctx.tenantId),
          eq(bmsDocuments.type,     typeFilter)
        ))
        .orderBy(desc(bmsDocuments.updatedAt));
    }
    return tx.select().from(bmsDocuments)
      .where(eq(bmsDocuments.tenantId, ctx.tenantId))
      .orderBy(desc(bmsDocuments.updatedAt));
  });
  return NextResponse.json(docs);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = DocSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  // withErrorHandler catches 23505 (duplicate code) → 409
  const [doc] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsDocuments)
      .values({ tenantId: ctx.tenantId, ...parsed.data })
      .returning()
  );
  return NextResponse.json(doc, { status: 201 });
});

const _PATCH = withTenant(async (req, ctx) => {
  if (!["owner", "admin", "architect", "developer"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const partial = DocSchema.partial().omit({ code: true });
  const parsed  = partial.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const [doc] = await dbTx(ctx.tenantId, async (tx) =>
    tx.update(bmsDocuments)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(bmsDocuments.id, id))
      .returning()
  );
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json(doc);
});

export const GET   = withErrorHandler(_GET);
export const POST  = withErrorHandler(_POST);
export const PATCH = withErrorHandler(_PATCH);
