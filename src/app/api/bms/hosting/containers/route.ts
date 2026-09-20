/**
 * src/app/api/bms/hosting/containers/route.ts
 * BMS Hosting Layer — Container Management
 * Restricted to owner/admin — proxy.ts enforces via ADMIN_PREFIXES.
 * Defense in depth: role check also enforced in handler.
 * Errors: Direct 23505 catch unwraps pg cause to guarantee 409 on duplicate container allocation.
 */
import { NextResponse }         from "next/server";
import { eq }                   from "drizzle-orm";
import { withTenant }           from "@/lib/tenant";
import { withTenant as dbTx }   from "@/db";
import { withErrorHandler }     from "@/lib/api-handler";
import { bmsHostContainers }    from "@/db/schema";
import { z }                    from "zod";

const CreateContainerSchema = z.object({
  siteSlug:   z.string().min(2).max(255),
  image:      z.string().default("bms/site-runtime:latest"),
  port:       z.number().int().min(1024).max(65535).default(10000),
  region:     z.string().default("ap-south-1"),
  cpuLimit:   z.number().min(0.1).max(16).default(1.0),
  memLimitMb: z.number().int().min(128).max(65536).default(512),
});

const _GET = withTenant(async (_req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }

  const containers = await dbTx(ctx.tenantId, async (tx) =>
    tx.select()
      .from(bmsHostContainers)
      .where(eq(bmsHostContainers.tenantId, ctx.tenantId))
  );
  return NextResponse.json(containers);
});

const _POST = withTenant(async (req, ctx) => {
  if (!["owner", "admin"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden — admin required" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = CreateContainerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const [container] = await dbTx(ctx.tenantId, async (tx) =>
      tx.insert(bmsHostContainers)
        .values({ tenantId: ctx.tenantId, ...parsed.data })
        .returning()
    );
    return NextResponse.json(container, { status: 201 });
  } catch (err: unknown) {
    const pgCode =
      (err as { code?: string })?.code ||
      (err as { cause?: { code?: string } })?.cause?.code;

    if (pgCode === "23505") {
      return NextResponse.json(
        { error: "Duplicate — resource already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
});

export const GET  = withErrorHandler(_GET);
export const POST = withErrorHandler(_POST);