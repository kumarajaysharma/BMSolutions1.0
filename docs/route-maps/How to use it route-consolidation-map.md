How to use it route-consolidation-map.ts — Placement

This is a planning reference, not a deployable module. Place it at:

D:\BMS-Final\saas-studio\docs\route-maps\route-consolidation-map.ts

How to use it: It is your Phase C sprint checklist. The BUILD entries are the 16 pages that need full component ports. The STUB entries are the 6 pages that need only the placeholder page.tsx. The PowerShell block inside the comment (lines 307–374) is a one-time deployment script — run it once to scaffold all 22 stub directories, then replace stubs with real components per the BUILD notes. Never import this file into the Next.js app — it is dev tooling only.