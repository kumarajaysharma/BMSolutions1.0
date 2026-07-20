import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientRequests, auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const SERVICES = [
  "platform-demo",
  "architecture-consult",
  "migration-assessment",
  "security-review",
];

export async function GET() {
  const rows = await db
    .select()
    .from(clientRequests)
    .orderBy(desc(clientRequests.id))
    .limit(60);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Valid name and email are required." },
      { status: 400 }
    );
  }
  const service = SERVICES.includes(body.service) ? body.service : "platform-demo";
  const [row] = await db
    .insert(clientRequests)
    .values({
      name,
      email,
      company: String(body.company ?? "").trim(),
      service,
      preferredDate: String(body.preferredDate ?? ""),
      preferredTime: String(body.preferredTime ?? ""),
      notes: String(body.notes ?? "").slice(0, 2000),
    })
    .returning();
  await db.insert(auditLogs).values({
    actor: "landing-page",
    action: `client.request:${service}`,
    target: email,
  });
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json(); // { id, status }
  const status = ["pending", "confirmed", "completed"].includes(body.status)
    ? body.status
    : "pending";
  const [row] = await db
    .update(clientRequests)
    .set({ status })
    .where(eq(clientRequests.id, Number(body.id)))
    .returning();
  await db.insert(auditLogs).values({
    actor: "studio-admin",
    action: `client.request.${status}`,
    target: row.email,
  });
  return NextResponse.json(row);
}
