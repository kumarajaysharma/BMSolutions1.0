import { SubsidiaryHeader } from "@/components/SubsidiaryHeader";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50 text-navy-800">
      {/* Dynamic Tenant-Aware Header */}
      <SubsidiaryHeader />

      {/* Main Studio Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}