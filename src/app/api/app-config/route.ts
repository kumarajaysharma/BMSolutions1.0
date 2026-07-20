import { NextResponse } from "next/server";
import { APP_CAPABILITY_CONTRACT } from "@/lib/enterprise-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ...APP_CAPABILITY_CONTRACT,
    generatedAt: new Date().toISOString(),
    website: {
      basePath: "/",
      landing: "/",
      about: "/about",
      careers: "/careers",
      scheduler: "/#schedule",
      manifest: "/manifest.webmanifest",
      serviceWorker: "/sw.js",
    },
    appNavigation: [
      { id: "home", label: "Home", path: "/" },
      { id: "home-alias", label: "Home (dedicated)", path: "/home" },
      { id: "schedule", label: "Schedule", path: "/#schedule" },
      { id: "about", label: "About", path: "/about" },
      { id: "careers", label: "Careers", path: "/careers" },
      { id: "studio", label: "Studio", path: "/studio" },
      { id: "audit", label: "Audit", path: "/audit" },
      { id: "app", label: "App Readiness", path: "/app" },
    ],
    publicApi: {
      scheduling: "/api/requests",
      careers: "/api/careers",
      readiness: "/api/readiness",
      health: "/api/health",
    },
    complianceLinks: {
      readinessAudit: "/audit",
      appReadiness: "/app",
      healthCheck: "/api/health",
      configurationContract: "/api/app-config",
    },
  });
}
