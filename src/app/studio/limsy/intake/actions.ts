"use server";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { withTenant } from "@/db/index";
import { limsyCases } from "@/db/schema";
import { revalidatePath } from "next/cache";

export interface IntakePayload {
  courtName: string;     // mapped from form's "forum" select
  caseType: string;
  petitioner: string;
  respondent: string;
  subjectMatter: string; // auto-generated or user-supplied summary
}

export async function createIntakeRecord(payload: IntakePayload): Promise<
  { success: true; caseId: number } | { success: false; error: string }
> {
  try {
    // 1. Authenticate & bind tenant context from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("bms_session")?.value;
    if (!token) return { success: false, error: "Unauthorized: no session" };

    const session = await decrypt(token);
    if (!session?.tenantId) return { success: false, error: "Unauthorized: invalid tenant context" };

    // 2. Zero-Trust database write — tenant_id is pinned by withTenant, not caller-supplied
    const [newCase] = await withTenant(String(session.tenantId), async (tx) =>
      tx.insert(limsyCases).values({
        tenantId:     Number(session.tenantId),
        courtName:    payload.courtName,
        caseType:     payload.caseType,
        petitioner:   payload.petitioner,
        respondent:   payload.respondent,
        subjectMatter: payload.subjectMatter,
        status:       "intake",
      }).returning({ id: limsyCases.id })
    );

    revalidatePath("/studio/limsy/intake");
    revalidatePath("/studio/limsy/matters");

    return { success: true, caseId: newCase.id };

  } catch (error) {
    console.error("[LIMSY Intake Action] Error:", error);
    return { success: false, error: "Failed to initialize case record. Please retry." };
  }
}
