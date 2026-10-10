/**
 * BNLV Studio — Visual Builder IDE Route Consolidation Map
 * =========================================================
 * Maps every route from full-stack-visual-builder-ide into the BNLV
 * studio namespace. Use this as the implementation checklist for
 * creating page stubs under src/app/studio/**.
 *
 * STATUS LEGEND:
 *   EXISTS  — page already deployed in BNLV
 *   STUB    — directory + page.tsx needed (minimal stub, feature TBD)
 *   BUILD   — full component port from builder required
 *   EXTEND  — BNLV page exists; add builder capability to it
 *   SKIP    — conflicts with existing BNLV implementation; not needed
 *
 * AUTH NOTE:
 *   All routes inherit auth from src/app/studio/layout.tsx which
 *   reads x-user-id/role/tenant-id from middleware-injected headers.
 *   No per-page auth check needed — middleware handles the gate.
 *   RBAC enforcement at API layer via requireRole().
 */

// =============================================================================
// BUILDER ROUTE → BNLV ROUTE MAP
// =============================================================================

const ROUTE_MAP = [

  // ── Studio Hub ──────────────────────────────────────────────────────────────
  {
    builderPath: '/dashboard',
    bnlvPath:    '/studio',
    status:      'EXISTS',
    notes:       'BMS command centre page already at src/app/studio/bms/page.tsx. ' +
                 'Add group delivery signal widget from builder Dashboard component.',
  },

  // ── Visual Builder ──────────────────────────────────────────────────────────
  {
    builderPath: '/builder',
    bnlvPath:    '/studio/bms/builder',
    status:      'BUILD',
    notes:       'Port Builder.tsx (canvas + blocks sidebar + theme picker). ' +
                 'API: GET/POST/PATCH /api/bms/builder/pages using builder_pages table (0018). ' +
                 'Create: src/app/studio/bms/builder/page.tsx',
    tableAdded:  'builder_pages (0018)',
  },
  {
    builderPath: '/library',
    bnlvPath:    '/studio/bms/library',
    status:      'BUILD',
    notes:       'Port block library grid. API: /api/bms/builder/blocks → builder_blocks table (0018). ' +
                 'Create: src/app/studio/bms/library/page.tsx',
    tableAdded:  'builder_blocks (0018)',
  },

  // ── BMS Core ────────────────────────────────────────────────────────────────
  {
    builderPath: '/projects',
    bnlvPath:    '/studio/bms/projects',
    status:      'EXISTS',
    notes:       'bms_studio_projects table already exists (0014). Add builder card view.',
  },
  {
    builderPath: '/clients',
    bnlvPath:    '/studio/bms/clients',
    status:      'STUB',
    notes:       'Create page at src/app/studio/bms/clients/page.tsx. ' +
                 'Reads from client_requests + provisioned tenants. ' +
                 'No new table — uses existing client_requests (0008).',
  },
  {
    builderPath: '/tasks',
    bnlvPath:    '/studio/bms/tasks',
    status:      'EXTEND',
    notes:       'Kanban over bms_assignments + bms_code_red_cases. ' +
                 'Port builder TaskBoard component into existing BMS workspace.',
  },
  {
    builderPath: '/team',
    bnlvPath:    '/studio/bms/team',
    status:      'STUB',
    notes:       'Reads from users table (scoped to tenant). Create stub page.',
  },
  {
    builderPath: '/marketplace',
    bnlvPath:    '/studio/bms/marketplace',
    status:      'EXTEND',
    notes:       'Extend existing bms_studio_addons. Port builder Marketplace grid UI.',
  },

  // ── BMS Documentation Engine ─────────────────────────────────────────────────
  {
    builderPath: '(new — not in builder)',
    bnlvPath:    '/studio/bms/documents',
    status:      'EXISTS',
    notes:       'DEPLOYED — 14-template AI Documentation Engine. ' +
                 'Place bms-documents-page.tsx at src/app/studio/bms/documents/page.tsx.',
    tableAdded:  'bms_documents (0017)',
  },

  // ── Automate ────────────────────────────────────────────────────────────────
  {
    builderPath: '/agentic',
    bnlvPath:    '/studio/bms/agentic',
    status:      'BUILD',
    notes:       'Port AgenticClient.tsx. Uses existing bms_ai_agents table (0015). ' +
                 'Workspace: task dispatch, agent status, prompt tuning, sandbox runner. ' +
                 'Create: src/app/studio/bms/agentic/page.tsx',
  },
  {
    builderPath: '/workflows',
    bnlvPath:    '/studio/bms/workflows',
    status:      'BUILD',
    notes:       'Port WorkflowCanvas.tsx (visual node/edge canvas). ' +
                 'Uses existing bms_workflows table (0015). ' +
                 'Create: src/app/studio/bms/workflows/page.tsx',
  },

  // ── Ship / Deploy ───────────────────────────────────────────────────────────
  {
    builderPath: '/deployments',
    bnlvPath:    '/studio/bms/deployments',
    status:      'EXTEND',
    notes:       'Extend existing BMS Hosting. Add builder deployment timeline view. ' +
                 'Tables: bms_host_containers (0014) + bms_dns_records (0014).',
  },
  {
    builderPath: '/release',
    bnlvPath:    '/studio/bms/release',
    status:      'BUILD',
    notes:       'Port builder Release / QA runner. Uses bms_release_evidence (0018) ' +
                 'and bms_pendencies (0018). ' +
                 'Create: src/app/studio/bms/release/page.tsx',
    tableAdded:  'bms_release_evidence, bms_pendencies (0018)',
  },

  // ── Governance ──────────────────────────────────────────────────────────────
  {
    builderPath: '/super-admin',
    bnlvPath:    '/studio/bms/admin',
    status:      'STUB',
    notes:       'Admin-only (minRole: admin). Tenant management, pendencies register, ' +
                 'release evidence history. Create stub at src/app/studio/bms/admin/page.tsx.',
  },

  // ── Nidhivan Financial Intelligence ────────────────────────────────────────
  {
    builderPath: '/nidhivan',
    bnlvPath:    '/studio/nidhivan',
    status:      'EXTEND',
    notes:       'BNLV Nidhivan workspace already has BOQ/DPR. ' +
                 'Port builder Hub.tsx as a new entry page with desk nav.',
  },
  {
    builderPath: '/nidhivan/books',
    bnlvPath:    '/studio/nidhivan/books',
    status:      'BUILD',
    notes:       'Port builder Books/Ledger view. ' +
                 'Tables: nidhivan_entities, nidhivan_accounts, nidhivan_journals, ' +
                 'nidhivan_closes (all 0018). architect+ only. ' +
                 'Create: src/app/studio/nidhivan/books/page.tsx',
    tableAdded:  'nidhivan_entities, nidhivan_accounts, nidhivan_journals, nidhivan_closes (0018)',
  },
  {
    builderPath: '/nidhivan/boqs',
    bnlvPath:    '/studio/nidhivan/boqs',
    status:      'EXISTS',
    notes:       'Nidhivan BOQ/DPR already live. BoqDataGrid deployed. No changes needed.',
  },
  {
    builderPath: '/nidhivan/research',
    bnlvPath:    '/studio/nidhivan/research',
    status:      'BUILD',
    notes:       'Port builder Research desk (equity/credit/macro). ' +
                 'Table: nidhivan_research (0018). ' +
                 'Create: src/app/studio/nidhivan/research/page.tsx',
    tableAdded:  'nidhivan_research (0018)',
  },
  {
    builderPath: '/nidhivan/lab',
    bnlvPath:    '/studio/nidhivan/lab',
    status:      'BUILD',
    notes:       'Port builder Fintech Lab pipeline. ' +
                 'Table: nidhivan_lab (0018). developer+ only. ' +
                 'Create: src/app/studio/nidhivan/lab/page.tsx',
    tableAdded:  'nidhivan_lab (0018)',
  },
  {
    builderPath: '/nidhivan/counsel',
    bnlvPath:    '/studio/nidhivan/counsel',
    status:      'BUILD',
    notes:       'Port builder Fin Co-Counsel (AI CFO/CA chat). ' +
                 'Table: nidhivan_counsel (0018). Claude Sonnet 5. architect+ only. ' +
                 'Create: src/app/studio/nidhivan/counsel/page.tsx',
    tableAdded:  'nidhivan_counsel (0018)',
  },
  {
    builderPath: '/nidhivan/connectors',
    bnlvPath:    '/studio/nidhivan/connectors',
    status:      'STUB',
    notes:       'Stripe, QuickBooks, S&P Global, IBKR connector hub. admin+ only. ' +
                 'Create stub at src/app/studio/nidhivan/connectors/page.tsx.',
  },

  // ── LIMSY Legal Intelligence ─────────────────────────────────────────────────
  {
    builderPath: '/limsy',
    bnlvPath:    '/studio/limsy',
    status:      'EXISTS',
    notes:       'LIMSY workspace page deployed (limsy-page.tsx). ' +
                 'Add navigation tabs for new sub-routes below.',
  },
  {
    builderPath: '/limsy/matters',
    bnlvPath:    '/studio/limsy/matters',
    status:      'BUILD',
    notes:       'Port MatterWorkspace.tsx (case list, detail, parties, documents). ' +
                 'Tables: limsy_parties, limsy_documents, limsy_authorities (0018) ' +
                 '+ existing limsy_cases. ' +
                 'Create: src/app/studio/limsy/matters/page.tsx',
    tableAdded:  'limsy_parties, limsy_documents, limsy_authorities (0018)',
  },
  {
    builderPath: '/limsy/trial',
    bnlvPath:    '/studio/limsy/trial',
    status:      'BUILD',
    notes:       'Port TrialRoom.tsx (phase machine, transcript, exhibits, rulings). ' +
                 'Table: limsy_trials (0018). architect+ only. ' +
                 'Create: src/app/studio/limsy/trial/page.tsx',
    tableAdded:  'limsy_trials (0018)',
  },
  {
    builderPath: '/limsy/frameworks',
    bnlvPath:    '/studio/limsy/frameworks',
    status:      'BUILD',
    notes:       'Port IRAC/CREAC argumentation canvas (WorkflowCanvas-style). ' +
                 'Table: limsy_frameworks (0018). architect+ only. ' +
                 'Create: src/app/studio/limsy/frameworks/page.tsx',
    tableAdded:  'limsy_frameworks (0018)',
  },
  {
    builderPath: '/limsy/counsel',
    bnlvPath:    '/studio/limsy/counsel',
    status:      'BUILD',
    notes:       'Port Legal Co-Counsel chat (Claude Sonnet 5 — DPDP data sovereign). ' +
                 'Table: limsy_counsel_sessions (0018). architect+ only. ' +
                 'Extends existing LIMSY synopsis architecture. ' +
                 'Create: src/app/studio/limsy/counsel/page.tsx',
    tableAdded:  'limsy_counsel_sessions (0018)',
  },
  {
    builderPath: '/limsy/connectors',
    bnlvPath:    '/studio/limsy/connectors',
    status:      'STUB',
    notes:       'Harvey AI, CoCounsel, Everlaw connector hub. admin+ only. ' +
                 'Create stub at src/app/studio/limsy/connectors/page.tsx.',
  },

  // ── SKIP list ────────────────────────────────────────────────────────────────
  {
    builderPath: '/login (builder)',
    bnlvPath:    '/login (existing)',
    status:      'SKIP',
    notes:       'BNLV already has /login with JWT HS256 + scrypt. ' +
                 'Builder login uses plain token — DO NOT merge.',
  },
  {
    builderPath: 'builder/users table',
    bnlvPath:    'users (existing)',
    status:      'SKIP',
    notes:       'BNLV users table already has tenant_id, scrypt hash, JWT role. ' +
                 'Builder users table has no tenant_id and uses raw tokens.',
  },
  {
    builderPath: 'builder/sessions table',
    bnlvPath:    'sessions (existing)',
    status:      'SKIP',
    notes:       'BNLV sessions table is JWT-based. Builder uses raw string tokens. ' +
                 'TD-001 remediation (SHA-256 tokenHash) takes priority.',
  },
  {
    builderPath: 'builder/agents table',
    bnlvPath:    'bms_ai_agents (existing)',
    status:      'SKIP',
    notes:       'bms_ai_agents already exists (0015) with 5 seed records. ' +
                 'Extend existing table rather than adding duplicate.',
  },
  {
    builderPath: 'builder/workflows table',
    bnlvPath:    'bms_workflows (existing)',
    status:      'SKIP',
    notes:       'bms_workflows already exists (0015). Use existing.',
  },
  {
    builderPath: 'builder/activity table',
    bnlvPath:    'audit_logs (existing)',
    status:      'SKIP',
    notes:       'audit_logs serves the same purpose with stronger guarantees ' +
                 '(actor format, severity, IP). Do not duplicate.',
  },
] as const;

// =============================================================================
// PAGE STUB GENERATION — copy-paste commands for Windows PowerShell
// =============================================================================

/*
# Run from D:\BMS-Final\saas-studio

# 1. Documentation Engine (fix 404 FIRST)
New-Item -ItemType Directory -Path "src\app\studio\bms\documents" -Force
# Copy bms-documents-page.tsx → src\app\studio\bms\documents\page.tsx

# 2. Shell layout
# Copy studio-layout.tsx → src\app\studio\layout.tsx
# Copy Shell.tsx → src\components\Shell.tsx

# 3. Create stub pages for BUILD/STUB routes
$stubs = @(
  "src\app\studio\bms\builder",
  "src\app\studio\bms\library",
  "src\app\studio\bms\clients",
  "src\app\studio\bms\tasks",
  "src\app\studio\bms\team",
  "src\app\studio\bms\marketplace",
  "src\app\studio\bms\agentic",
  "src\app\studio\bms\workflows",
  "src\app\studio\bms\deployments",
  "src\app\studio\bms\release",
  "src\app\studio\bms\admin",
  "src\app\studio\bms\pendencies",
  "src\app\studio\nidhivan\books",
  "src\app\studio\nidhivan\research",
  "src\app\studio\nidhivan\lab",
  "src\app\studio\nidhivan\counsel",
  "src\app\studio\nidhivan\connectors",
  "src\app\studio\limsy\matters",
  "src\app\studio\limsy\trial",
  "src\app\studio\limsy\frameworks",
  "src\app\studio\limsy\counsel",
  "src\app\studio\limsy\connectors"
)

$stubContent = @"
export default function Page() {
  return (
    <div style={{ padding: 32, color: '#DDE5EF', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ color: '#C9A84C', marginBottom: 8 }}>COMING SOON</div>
      <div>This page is being built. Check the route consolidation map for status.</div>
    </div>
  );
}
"@

foreach ($path in $stubs) {
  New-Item -ItemType Directory -Path $path -Force
  Set-Content -Path "$path\page.tsx" -Value $stubContent
}

# 4. Apply migration 0018
npm run db:migrate

# 5. Run npx drizzle-kit generate to sync schema.ts
npx drizzle-kit generate
npx drizzle-kit migrate

# 6. Add Shell.tsx to components
# Copy Shell.tsx → src\components\Shell.tsx

# 7. Deploy
git add .
git commit -m "feat: visual builder IDE consolidation — migration 0018, Shell nav, 22 stub pages"
git push origin main
*/

export { ROUTE_MAP };
