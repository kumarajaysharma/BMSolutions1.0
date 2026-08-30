/**
 * src/lib/ai/tools.ts
 *
 * BMSolutions — Zero-Trust AI Tool Registry
 * ==========================================================
 * TRACK C (AI ORCHESTRATION) - TypeScript Remediation
 * Removed the `tool()` wrapper to align with streamText tool object expectations.
 */

import { z } from "zod";
import { withTenant } from "@/db";
import { limsyCases, nidhivanBoqs, nidhivanBoqItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export function getAgentTools(tenantId: number) {
  return {
    readLimsyData: {
      description:
        "Retrieves active legal cases and dockets from the LIMSY database. Use this to conduct case briefs, check urgencies, and draft legal intelligence.",
      parameters: z.object({
        caseType: z
          .enum([
            "slp",
            "writ_petition",
            "civil_appeal",
            "criminal_appeal",
            "review_petition",
            "curative_petition",
            "original_suit",
            "execution_petition",
            "consumer_complaint",
            "arbitration_petition",
            "ibc_petition",
            "nclt_petition",
            "other",
            "all",
          ])
          .optional()
          .describe('Filter by case type. Use "all" for all active cases.'),
        urgencyOnly: z
          .boolean()
          .optional()
          .describe("If true, only returns cases flagged as urgent."),
      }),
      execute: async (args: { caseType?: string; urgencyOnly?: boolean }) => {
        return await withTenant(tenantId, async (tx) => {
          const cases = await tx
            .select()
            .from(limsyCases)
            .where(eq(limsyCases.tenantId, tenantId))
            .limit(50);

          let filtered = cases;
          if (args.caseType && args.caseType !== "all") {
            filtered = filtered.filter((c: any) => c.caseType === args.caseType);
          }
          if (args.urgencyOnly) {
            filtered = filtered.filter((c: any) => c.urgencyFlag === true);
          }

          return {
            status: "success",
            recordCount: filtered.length,
            records: filtered.map((c: any) => ({
              internalReference: c.internalRef,
              caseNumber: c.caseNumber,
              parties: `${c.petitioner} v. ${c.respondent}`,
              court: `${c.courtName} (${c.courtLevel})`,
              caseType: c.caseType,
              subjectMatter: c.subjectMatter,
              status: c.status,
              isUrgent: c.urgencyFlag,
            })),
          };
        });
      },
    },

    readNidhivanFinancials: {
      description:
        "Retrieves financial Detailed Project Reports (DPR) and CPWD Bill of Quantities (BOQ) data. Use this to analyze CAPEX, calculate totals, and draft financial narratives.",
      parameters: z.object({
        boqId: z
          .number()
          .optional()
          .describe(
            "Specific BOQ ID to fetch. If omitted, returns a high-level summary of all BOQs."
          ),
      }),
      execute: async (args: { boqId?: number }) => {
        return await withTenant(tenantId, async (tx) => {
          if (args.boqId) {
            const [boq] = await tx
              .select()
              .from(nidhivanBoqs)
              .where(
                and(
                  eq(nidhivanBoqs.tenantId, tenantId),
                  eq(nidhivanBoqs.id, args.boqId)
                )
              )
              .limit(1);

            if (!boq)
              return { error: `BOQ ${args.boqId} not found in this workspace.` };

            const items = await tx
              .select()
              .from(nidhivanBoqItems)
              .where(eq(nidhivanBoqItems.tenantId, tenantId))
              .limit(100);

            const grandTotalPaise = items.reduce(
              (sum: number, item: any) => sum + Number(item.amountPaise || 0),
              0
            );

            return {
              projectTitle: boq.title,
              status: boq.status,
              totalItems: items.length,
              grandTotalINR: grandTotalPaise / 100,
              lineItems: items.map((i: any) => ({
                code: i.itemCode,
                description: i.description,
                quantity: i.quantity,
                unit: i.unit,
                unitRateINR: Number(i.ratePaise || 0) / 100,
                amountINR: Number(i.amountPaise || 0) / 100,
              })),
            };
          } else {
            const boqs = await tx
              .select()
              .from(nidhivanBoqs)
              .where(eq(nidhivanBoqs.tenantId, tenantId));

            return {
              status: "success",
              availableProjects: boqs.map((b: any) => ({
                id: b.id,
                title: b.title,
                status: b.status,
              })),
            };
          }
        });
      },
    },
  };
}