import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    const dbLatencyMs = Date.now() - startedAt;
    return Response.json({
      ok: true,
      status: "healthy",
      checks: {
        database: { ok: true, latencyMs: dbLatencyMs },
        runtime: { ok: true, node: process.version },
      },
      version: "enterprise-1.0.0",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        ok: false,
        status: "degraded",
        checks: { database: { ok: false } },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
