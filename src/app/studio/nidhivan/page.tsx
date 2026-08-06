import DprDashboardLayout from "@/components/workspace/DprDashboardLayout";
import BoqDataGrid from "@/components/workspace/BoqDataGrid";
import { db } from "@/db";
import { nidhivanBoqs } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function NidhivanWorkspace() {
  // In production, these variables will come from your URL params and Auth session
  const activeTenantId = 1; 

  // Dynamically fetch the BOQ record from the correct Nidhivan table
  const seededBoq = await db.query.nidhivanBoqs.findFirst({
    where: eq(nidhivanBoqs.tenantId, activeTenantId),
  });

  if (!seededBoq) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-slate-500">
        <p>No BOQ records found. Please run the seed script.</p>
      </div>
    );
  }

  return (
    <DprDashboardLayout projectName="NH-44 Highway Expansion (Package 1)">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">{seededBoq.title}</h3>
        <p className="text-sm text-slate-500">Status: <span className="uppercase">{seededBoq.status}</span></p>
      </div>
      
      {/* Pass the dynamic, real identifier to the client component */}
      <BoqDataGrid boqId={seededBoq.id.toString()} tenantId={activeTenantId.toString()} />
    </DprDashboardLayout>
  );
}