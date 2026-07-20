import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobApplications, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(jobApplications)
    .orderBy(desc(jobApplications.id))
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
  const [row] = await db
    .insert(jobApplications)
    .values({
      roleSlug: String(body.roleSlug ?? "general").slice(0, 60),
      roleTitle: String(body.roleTitle ?? "General application").slice(0, 120),
      name,
      email,
      portfolio: String(body.portfolio ?? "").slice(0, 300),
      note: String(body.note ?? "").slice(0, 2000),
    })
    .returning();
  await db.insert(auditLogs).values({
    actor: "careers-page",
    action: `job.application:${row.roleSlug}`,
    target: email,
  });
  return NextResponse.json(row, { status: 201 });
}
