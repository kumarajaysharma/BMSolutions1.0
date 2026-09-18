/**
 * src/app/api/bms/hosting/dns/route.ts
 * BMS Hosting Layer — DNS Record Management
 * Restricted to owner/admin (enforced by ADMIN_PREFIXES in proxy.ts + here).
 *
 * When BMS_HOSTING_ENABLED=true:
 *   POST also calls Cloudflare API to create the record in bnlvconsulting.com zone.
 * When BMS_HOSTING_ENABLED=false (Phase C default):
 *   POST writes to Neon only — "managed mode", no live DNS change.
 */
import { NextResponse }       from "next/server";
import { eq, and }            from "drizzle-orm";
import { withTenant }         from "@/lib/tenant";
import { withTenant as dbTx } from "@/db";
import { withErrorHandler }   from "@/lib/api-handler";
import { bmsDnsRecords }      from "@/db/schema";
import { z }                  from "zod";

const DnsRecordSchema = z.object({
  siteSlug: z.string().min(2).max(255),
  type:     z.enum(["A", "CNAME", "TXT", "MX"]).default("CNAME"),
  name:     z.string().min(1).max(255),
  content:  z.string().min(1).max(255),
  ttl:      z.number().int().min(60).max(86400).default(3600),
  proxied:  z.boolean().default(true),
});

const HOSTING_ENABLED = process.env.BMS_HOSTING_ENABLED === "true";
const CF_TOKEN        = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE         = process.env.CLOUDFLARE_ZONE_ID;

async function createCloudflareRecord(
  record: z.infer<typeof DnsRecordSchema>
): Promise<{ cfId: string } | null> {
  if (!HOSTING_ENABLED || !CF_TOKEN || !CF_ZONE) return null;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records`,
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: record.type, name: record.name,
        content: record.content, ttl: record.ttl, proxied: record.proxied,
      }),
    }
  );
  if (!res.ok) throw new Error(`Cloudflare DNS create failed: ${await res.text()}`);
  const json = await res.json();
  return { cfId: json.result?.id ?? "" };
}

// GET /api/bms/hosting/dns?siteSlug=<slug>
// Filter pushed into WHERE clause — avoids implicit-any on post-query .filter()
const _GET = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const siteSlug = new URL(req.url).searchParams.get("siteSlug");

  const records = await dbTx(ctx.tenantId, async (tx) => {
    if (siteSlug) {
      return tx.select().from(bmsDnsRecords).where(
        and(
          eq(bmsDnsRecords.tenantId, ctx.tenantId),
          eq(bmsDnsRecords.siteSlug, siteSlug)
        )
      );
    }
    return tx.select().from(bmsDnsRecords)
      .where(eq(bmsDnsRecords.tenantId, ctx.tenantId));
  });
  return NextResponse.json(records);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const parsed = DnsRecordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  let cfResult: { cfId: string } | null = null;
  let managedMode = !HOSTING_ENABLED;
  try {
    cfResult = await createCloudflareRecord(parsed.data);
  } catch (cfErr) {
    console.error("[dns/POST] Cloudflare error:", cfErr);
    managedMode = true;
  }

  const [record] = await dbTx(ctx.tenantId, async (tx) =>
    tx.insert(bmsDnsRecords)
      .values({ tenantId: ctx.tenantId, verified: cfResult !== null && !managedMode, ...parsed.data })
      .returning()
  );
  return NextResponse.json({
    ...record,
    managedMode,
    cloudflareId: cfResult?.cfId ?? null,
    message: managedMode
      ? "Record saved locally. Set BMS_HOSTING_ENABLED=true and configure CLOUDFLARE_API_TOKEN to make it live."
      : "Record created in Cloudflare DNS and saved to Neon.",
  }, { status: 201 });
});

const _DELETE = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }
  const id = parseInt(new URL(req.url).searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
  const [record] = await dbTx(ctx.tenantId, async (tx) =>
    tx.delete(bmsDnsRecords)
      .where(and(eq(bmsDnsRecords.id, id), eq(bmsDnsRecords.tenantId, ctx.tenantId)))
      .returning()
  );
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ deleted: true, id: record.id });
});

export const GET    = withErrorHandler(_GET);
export const POST   = withErrorHandler(_POST);
export const DELETE = withErrorHandler(_DELETE);
