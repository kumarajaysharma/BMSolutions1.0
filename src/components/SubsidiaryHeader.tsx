import { headers } from "next/headers";
import { getSubsidiaryConfig } from "@/lib/subsidiaries";
import Link from "next/link";

export async function SubsidiaryHeader() {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug") || "bnlv";
  const config = getSubsidiaryConfig(slug);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand / Logo Section */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.accentColor} font-mono text-sm font-bold text-white shadow-sm`}>
              {config.logoText.slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-navy-800">
                {config.name}
              </div>
              <div className="text-[10px] font-medium text-slate-400">
                {config.tagline}
              </div>
            </div>
          </Link>
        </div>

        {/* Subsidiary Context Badge & Navigation Links */}
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${config.badgeTone}`}>
            Workspace: {config.shortName}
          </span>
          <Link
            href="/studio"
            className="rounded-xl bg-navy-700 px-4 py-2 text-xs font-semibold text-sand-50 shadow-sm transition hover:bg-navy-600"
          >
            Open Studio →
          </Link>
        </div>
      </div>
    </header>
  );
}