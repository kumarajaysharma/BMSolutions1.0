<#
.SYNOPSIS
  BNLV saas-studio — tsc round 4 fix (5 residual errors, 4 files)
.DESCRIPTION
  Run from project root in PowerShell:
    Set-ExecutionPolicy -Scope Process Bypass; .\fix-tsc-5.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Get-Location

function Patch([string]$rel, [scriptblock]$fn) {
    $p = Join-Path $root $rel
    if (-not (Test-Path $p)) { Write-Warning "NOT FOUND: $rel"; return }
    $before = Get-Content $p -Raw -Encoding UTF8
    $after  = & $fn $before
    if ($after -eq $before) { Write-Warning "No change (check manually): $rel" }
    else {
        Set-Content -Path $p -Value $after -Encoding UTF8 -NoNewline
        Write-Host "Patched: $rel" -ForegroundColor Green
    }
}

# ── 1. src/app/api/bms/lms/progress/route.ts ─────────────────────────────────
# isNotNull is called (line 76) but NOT in the drizzle-orm import.
# Root cause of prior failures: guard `$c -match "\bisNotNull\b"` matched the
# function-call body and short-circuited before touching the import line.
# Fix: inspect only the import block's captured content (group 2).
Patch "src\app\api\bms\lms\progress\route.ts" {
    param($c)
    $pat = '(?s)(import\s*\{)([^}]*)(\}\s*from\s*[''"]drizzle-orm[''"])'
    $m   = [regex]::Match($c, $pat)
    if ($m.Success -and ($m.Groups[2].Value -notmatch '\bisNotNull\b')) {
        $c = [regex]::Replace($c, $pat, '$1$2, isNotNull $3')
    }
    $c
}

# ── 2. Seed files — remove stale columns: sector, reportingPeriod ─────────────
#  nidhivanProjects  : no `sector` column
#  nidhivanFinancialMetrics : no `reportingPeriod` column (schema uses `period`)
$seedFiles = @(
    "src\db\run-seed.ts",
    "src\db\seed-nidhivan.ts",
    "src\db\seed-production-verticals.ts"
)

foreach ($sf in $seedFiles) {
    Patch $sf {
        param($c)
        $c = [regex]::Replace($c, "[ \t]*sector:[ \t]*[^\r\n]+\r?\n",          "")
        $c = [regex]::Replace($c, "[ \t]*reportingPeriod:[ \t]*[^\r\n]+\r?\n", "")
        $c
    }
}

Write-Host ""
Write-Host "All patches applied. Run: npx tsc --noEmit" -ForegroundColor Cyan
