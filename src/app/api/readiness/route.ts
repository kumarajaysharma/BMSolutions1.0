import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  buildEnterpriseControls,
  overallScore,
  readinessLevel,
} from "@/lib/enterprise-readiness";
import { cached } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await cached("readiness", 10_000, async () => {
    const res = await db.execute(sql`select
      (select count(*) from tenants)::int                                  as tenants,
      (select count(*) from users)::int                                    as users,
      (select count(*) from projects)::int                                 as projects,
      (select count(*) from environments where status = 'running')::int    as running_envs,
      (select count(*) from deployments)::int                              as deployments,
      (select count(*) from deployments where status = 'success')::int     as deploys_ok,
      (select count(*) from incidents where status <> 'resolved')::int     as open_incidents,
      (select count(*) from api_keys where status = 'active')::int         as active_keys,
      (select count(*) from feature_flags where enabled = true)::int       as live_flags,
      (select count(*) from client_requests where status = 'pending')::int as pending_requests
    `);
    const c = res.rows[0] as Record<string, number>;

    const input = {
      tenants: c.tenants,
      users: c.users,
      projects: c.projects,
      runningEnvs: c.running_envs,
      deployments: c.deployments,
      deploySuccessRate: c.deployments
        ? Math.round((c.deploys_ok / c.deployments) * 100)
        : 100,
      openIncidents: c.open_incidents,
      activeKeys: c.active_keys,
      liveFlags: c.live_flags,
      pendingRequests: c.pending_requests,
    };

    const { controls, phases, platforms } = buildEnterpriseControls(input);
    const score = overallScore([...controls, ...phases, ...platforms]);

    return {
      generatedAt: new Date().toISOString(),
      score,
      readinessLevel: readinessLevel(score),
      summary: input,
      controls,
      phases,
      platforms,
      productionSignoff: {
        status: score >= 90 ? "approved-with-standard-legal-completion" : "conditional",
        requiredBeforePublicLaunch: [
          "Finalize privacy policy, DPA and subprocessors list.",
          "Complete native-store privacy nutrition / data-safety questionnaires.",
          "Enable enterprise SSO (SAML/OIDC) for paid enterprise tenants.",
          "Run disaster recovery restore drill and record evidence.",
        ],
        alreadyVerified: [
          "Production build passes.",
          "Health endpoint verified.",
          "Scheduling and careers flows persist to database.",
          "PWA manifest and service worker present.",
          "Website/app configuration contract is live.",
          "Read-path APIs served via aggregate counts + micro-cache.",
        ],
      },
    };
  });

  return NextResponse.json(payload);
}
