'use server';

import { createHash } from 'crypto';
import { z } from 'zod';
import { db } from '@/db';
import { clientRequests, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';

const IntakeSchema = z.object({
  companyName:   z.string().min(2).max(200),
  contactName:   z.string().min(2).max(100),
  contactEmail:  z.string().email().max(254),
  subsidiary:    z.enum(['BMSolutions', 'Nidhivan Consulting', 'Legal Intelligence (LIMSY)', 'Vihang Creations']),
  requestedPlan: z.enum(['pilot', 'starter', 'professional', 'scale', 'enterprise']),
  message:       z.string().max(2000).optional(),
});

export async function createClientRequest(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const raw = {
    companyName:   formData.get('companyName'),
    contactName:   formData.get('contactName'),
    contactEmail:  formData.get('contactEmail'),
    subsidiary:    formData.get('subsidiary'),
    requestedPlan: formData.get('requestedPlan'),
    message:       formData.get('message'),
  };

  const parsed = IntakeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Invalid submission data.' };
  }

  const { companyName, contactName, contactEmail, subsidiary, requestedPlan, message } = parsed.data;

  // Deterministic idempotency key — per Developer Guideline 7.4
  const hourBucket = new Date().toISOString().slice(0, 13);
  const idempotencyKey = createHash('sha256')
    .update(`${subsidiary}:${contactEmail}:${companyName}:${hourBucket}`)
    .digest('hex');

  // Resolve BNLV root tenant ID dynamically — per Migration 0008 §4.5
  const [bnlvTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, 'bnlv'))
    .limit(1);

  if (!bnlvTenant) {
    return { success: false, error: 'Service configuration error.' };
  }

  try {
    await db.insert(clientRequests).values({
      idempotencyKey,
      companyName,
      contactName,
      contactEmail,
      subsidiary,
      requestedPlan,
      message: message ?? null,
      status: 'pending',
      handledByTenantId: bnlvTenant.id,
    }).onConflictDoNothing({ target: clientRequests.idempotencyKey });

    return { success: true };
  } catch {
    return { success: false, error: 'Request could not be submitted.' };
  }
}