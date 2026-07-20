import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  apiKeys,
  featureFlags,
  vaultSecrets,
  webhookEndpoints,
  auditLogs,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cached, invalidateCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

const rand = () => Math.random().toString(36).slice(2, 10);

export async function GET() {
  const data = await cached("services", 3_000, async () => {
    const [keys, flags, secrets, hooks] = await Promise.all([
      db.select().from(apiKeys).orderBy(desc(apiKeys.id)),
      db.select().from(featureFlags).orderBy(desc(featureFlags.id)),
      db.select().from(vaultSecrets).orderBy(desc(vaultSecrets.id)),
      db.select().from(webhookEndpoints).orderBy(desc(webhookEndpoints.id)),
    ]);
    return { keys, flags, secrets, hooks };
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json(); // { resource, ...fields }
  invalidateCache("services");
  switch (body.resource) {
    case "key": {
      const prefix = `fs_live_${rand()}`;
      const [row] = await db
        .insert(apiKeys)
        .values({
          name: String(body.name ?? "Untitled key").slice(0, 80),
          prefix,
          scopes: Array.isArray(body.scopes) ? body.scopes : ["read"],
          rateLimit: Number(body.rateLimit) || 1000,
        })
        .returning();
      await db.insert(auditLogs).values({
        actor: "api-gateway",
        action: "apikey.create",
        target: prefix,
        severity: "warn",
      });
      // Full key shown exactly once — zero-trust: never stored in plaintext
      return NextResponse.json({ ...row, fullKey: `${prefix}_${rand()}${rand()}` }, { status: 201 });
    }
    case "flag": {
      const [row] = await db
        .insert(featureFlags)
        .values({
          key: String(body.key ?? "new-flag")
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .slice(0, 60),
          description: String(body.description ?? "").slice(0, 200),
          enabled: false,
          rollout: 0,
          environments: ["development"],
        })
        .returning();
      await db.insert(auditLogs).values({ actor: "flag-service", action: "flag.create", target: row.key });
      return NextResponse.json(row, { status: 201 });
    }
    case "secret": {
      const name = String(body.name ?? "SECRET").toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
      const [row] = await db
        .insert(vaultSecrets)
        .values({
          name,
          maskedValue: `••••••••${rand().slice(0, 4)}`,
          environment: body.environment ?? "all",
        })
        .returning();
      await db.insert(auditLogs).values({ actor: "vault", action: "secret.create", target: name, severity: "warn" });
      return NextResponse.json(row, { status: 201 });
    }
    case "hook": {
      const url = String(body.url ?? "");
      if (!/^https:\/\//.test(url))
        return NextResponse.json({ error: "Webhook URLs must use HTTPS (zero-trust policy)." }, { status: 400 });
      const [row] = await db
        .insert(webhookEndpoints)
        .values({
          url: url.slice(0, 300),
          events: Array.isArray(body.events) && body.events.length ? body.events : ["deploy.success"],
          signingSecret: `whsec_${rand()}${rand()}`,
        })
        .returning();
      await db.insert(auditLogs).values({ actor: "webhook-service", action: "webhook.create", target: url });
      return NextResponse.json(row, { status: 201 });
    }
  }
  return NextResponse.json({ error: "unknown resource" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  invalidateCache("services");
  switch (body.resource) {
    case "key": {
      const [row] = await db
        .update(apiKeys)
        .set({ status: "revoked" })
        .where(eq(apiKeys.id, Number(body.id)))
        .returning();
      await db.insert(auditLogs).values({ actor: "api-gateway", action: "apikey.revoke", target: row.prefix, severity: "warn" });
      return NextResponse.json(row);
    }
    case "flag": {
      const patch: Partial<{ enabled: boolean; rollout: number; environments: string[] }> = {};
      if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
      if (typeof body.rollout === "number") patch.rollout = Math.max(0, Math.min(100, body.rollout));
      if (Array.isArray(body.environments)) patch.environments = body.environments;
      const [row] = await db
        .update(featureFlags)
        .set(patch)
        .where(eq(featureFlags.id, Number(body.id)))
        .returning();
      await db.insert(auditLogs).values({
        actor: "flag-service",
        action: `flag.${typeof body.enabled === "boolean" ? (body.enabled ? "enable" : "disable") : "update"}`,
        target: row.key,
      });
      return NextResponse.json(row);
    }
    case "secret": {
      const [cur] = await db.select().from(vaultSecrets).where(eq(vaultSecrets.id, Number(body.id)));
      const [row] = await db
        .update(vaultSecrets)
        .set({
          version: (cur?.version ?? 1) + 1,
          maskedValue: `••••••••${rand().slice(0, 4)}`,
          rotatedAt: new Date(),
        })
        .where(eq(vaultSecrets.id, Number(body.id)))
        .returning();
      await db.insert(auditLogs).values({ actor: "vault", action: `secret.rotate:v${row.version}`, target: row.name, severity: "warn" });
      return NextResponse.json(row);
    }
    case "hook": {
      const [cur] = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, Number(body.id)));
      if (body.action === "test") {
        const [row] = await db
          .update(webhookEndpoints)
          .set({ deliveries: (cur?.deliveries ?? 0) + 1 })
          .where(eq(webhookEndpoints.id, Number(body.id)))
          .returning();
        return NextResponse.json(row);
      }
      const [row] = await db
        .update(webhookEndpoints)
        .set({ status: cur?.status === "active" ? "paused" : "active" })
        .where(eq(webhookEndpoints.id, Number(body.id)))
        .returning();
      return NextResponse.json(row);
    }
  }
  return NextResponse.json({ error: "unknown resource" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  invalidateCache("services");
  if (body.resource === "secret") {
    await db.delete(vaultSecrets).where(eq(vaultSecrets.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }
  if (body.resource === "hook") {
    await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }
  if (body.resource === "flag") {
    await db.delete(featureFlags).where(eq(featureFlags.id, Number(body.id)));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown resource" }, { status: 400 });
}
