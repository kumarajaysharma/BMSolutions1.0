import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { projects } from "@/db/schema";
import { headers } from "next/headers";

export async function GET(request: Request) {
  // 1. Extract secure context provided by Middleware
  const headersList = headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json({ error: "Context missing" }, { status: 401 });
  }

  // 2. Query data (Module 3 will enforce RLS at the DB level via tx.execute)
  const db = await getDb();
  
  // For Module 2, we enforce isolation in the query clause
  const tenantProjects = await db.query.projects.findMany({
    where: (projects, { eq }) => eq(projects.tenantId, tenantId),
  });

  return NextResponse.json(tenantProjects);
}