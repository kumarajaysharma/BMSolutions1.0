<#
.SYNOPSIS
  BNLV saas-studio — tsc round 5 fix (4 residual errors, 3 files)
.DESCRIPTION
  Run from project root in PowerShell:
    Set-ExecutionPolicy -Scope Process Bypass; .\fix-tsc-4.ps1
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

# ── Seed files — remove stale columns: implementingAgency, projectedIrrPercent ─
#  nidhivanProjects       : no `implementingAgency` column
#  nidhivanFinancialMetrics: no `projectedIrrPercent` column
$seedFiles = @(
    "src\db\run-seed.ts",
    "src\db\seed-nidhivan.ts",
    "src\db\seed-production-verticals.ts"
)

foreach ($sf in $seedFiles) {
    Patch $sf {
        param($c)
        $c = [regex]::Replace($c, "[ \t]*implementingAgency:[ \t]*[^\r\n]+\r?\n",  "")
        $c = [regex]::Replace($c, "[ \t]*projectedIrrPercent:[ \t]*[^\r\n]+\r?\n", "")
        $c
    }
}

Write-Host ""
Write-Host "All patches applied. Run: npx tsc --noEmit" -ForegroundColor Cyan
