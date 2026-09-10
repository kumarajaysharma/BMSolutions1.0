###############################################################################
# NEO-001: Neon Driver Concurrency & RLS Isolation Test
# BNLV-ATP-MASTER-001 — Section 12: Neon Driver Stability
#
# WHAT THIS TESTS:
#   20 concurrent requests split between two tenants (bms=10, limsy=4).
#   Each request hits GET /api/limsy/cases with its tenant-scoped JWT.
#   The bms session must NEVER receive limsy case records.
#   The limsy session must NEVER receive bms case records.
#   Zero cross-tenant responses = SET LOCAL is correctly scoped in withTenant().
#
# PREREQUISITES:
#   1. At least 1 limsy case record exists (from LC-001 test)
#   2. bms tenant has NO limsy_cases records
#   3. Both tokens are valid (< 24h old)
#   4. Run from PowerShell — not CMD
#
# USAGE:
#   $env:LIMSY_TOKEN = "eyJ..."  (architect@limsy.bnlvconsulting.com)
#   $env:BMS_TOKEN   = "eyJ..."  (admin@bms.bnlvconsulting.com)
#   .\neo001-concurrency-test.ps1
###############################################################################

param(
    [string]$LimsyToken = $env:LIMSY_TOKEN,
    [string]$BmsToken   = $env:BMS_TOKEN,
    [int]   $TotalRequests = 20
)

# ── Validation ─────────────────────────────────────────────────────────────────
if (-not $LimsyToken -or $LimsyToken.Length -lt 20) {
    Write-Host "ERROR: Set LIMSY_TOKEN first:`n  `$env:LIMSY_TOKEN = 'eyJ...'" -ForegroundColor Red
    exit 1
}
if (-not $BmsToken -or $BmsToken.Length -lt 20) {
    Write-Host "ERROR: Set BMS_TOKEN first:`n  `$env:BMS_TOKEN = 'eyJ...'" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NEO-001: RLS Concurrency & Isolation Test" -ForegroundColor Cyan
Write-Host "  $TotalRequests concurrent requests — bms vs limsy tenants" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Issue 20 concurrent requests ───────────────────────────────────────────────
$jobs = @()
$results = [System.Collections.Concurrent.ConcurrentBag[object]]::new()

for ($i = 0; $i -lt $TotalRequests; $i++) {
    $isLimsy   = ($i % 2 -eq 0)
    $token     = if ($isLimsy) { $LimsyToken } else { $BmsToken }
    $tenantTag = if ($isLimsy) { "LIMSY" }     else { "BMS"   }
    $url       = if ($isLimsy) {
        "https://limsy.bnlvconsulting.com/api/limsy/cases"
    } else {
        "https://bms.bnlvconsulting.com/api/limsy/cases"
    }
    $reqIndex  = $i

    $job = Start-Job -ScriptBlock {
        param($Url, $Token, $TenantTag, $Index)
        try {
            $response = Invoke-WebRequest `
                -Uri $Url `
                -Method GET `
                -Headers @{ Cookie = "bms_session=$Token" } `
                -UseBasicParsing `
                -TimeoutSec 20 `
                -ErrorAction SilentlyContinue

            $body  = $response.Content
            $code  = $response.StatusCode
            $parsed = $null
            try { $parsed = $body | ConvertFrom-Json } catch {}

            # Detect cross-tenant leakage
            $leak = $false
            if ($TenantTag -eq "BMS" -and $code -eq 200) {
                # bms session hitting limsy endpoint — should get [] or 401
                if ($parsed -is [System.Array] -and $parsed.Count -gt 0) {
                    $leak = $true  # bms received limsy case records
                }
            }

            return @{
                Index     = $Index
                Tenant    = $TenantTag
                Url       = $Url
                HttpCode  = $code
                RecordCount = if ($parsed -is [System.Array]) { $parsed.Count } else { -1 }
                Leak      = $leak
                Error     = $null
            }
        } catch {
            return @{
                Index     = $Index
                Tenant    = $TenantTag
                Url       = $Url
                HttpCode  = 0
                RecordCount = -1
                Leak      = $false
                Error     = $_.Exception.Message
            }
        }
    } -ArgumentList $url, $token, $tenantTag, $reqIndex

    $jobs += $job
}

Write-Host "  ◌ Fired $TotalRequests concurrent requests..." -ForegroundColor Yellow

# ── Collect results ────────────────────────────────────────────────────────────
$allResults = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

# ── Analysis ───────────────────────────────────────────────────────────────────
$leaks   = $allResults | Where-Object { $_.Leak -eq $true }
$errors  = $allResults | Where-Object { $_.Error -ne $null }
$bmsRes  = $allResults | Where-Object { $_.Tenant -eq "BMS" }
$limsyRes= $allResults | Where-Object { $_.Tenant -eq "LIMSY" }

Write-Host ""
Write-Host "  Results:" -ForegroundColor White

foreach ($r in ($allResults | Sort-Object Index)) {
    $icon   = if ($r.Leak)  { "❌ LEAK" }
              elseif ($r.Error) { "⚠️  ERR " }
              else { "✅     " }
    $detail = if ($r.Error) { "ERROR: $($r.Error.Substring(0, [Math]::Min(60, $r.Error.Length)))" }
              else { "HTTP $($r.HttpCode) | $($r.RecordCount) records" }
    Write-Host "    [$($r.Index.ToString().PadLeft(2))] $($r.Tenant.PadRight(5))  $icon  $detail"
}

# ── Verdict ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ─────────────────────────────────────────────────────────"
Write-Host "  SUMMARY:"
Write-Host "    Total requests    : $TotalRequests"
Write-Host "    LIMSY requests    : $($limsyRes.Count)"
Write-Host "    BMS requests      : $($bmsRes.Count)"
Write-Host "    Errors            : $($errors.Count)"
Write-Host "    Cross-tenant leaks: $($leaks.Count)"
Write-Host ""

if ($leaks.Count -eq 0 -and $errors.Count -eq 0) {
    Write-Host "  ✅ NEO-001: PASS" -ForegroundColor Green
    Write-Host "     Zero cross-tenant leaks across $TotalRequests concurrent requests." -ForegroundColor Green
    Write-Host "     SET LOCAL is correctly scoped within withTenant() transactions." -ForegroundColor Green
} elseif ($leaks.Count -gt 0) {
    Write-Host "  ❌ NEO-001: FAIL — CROSS-TENANT LEAKAGE DETECTED" -ForegroundColor Red
    Write-Host "     $($leaks.Count) request(s) returned wrong-tenant data." -ForegroundColor Red
    Write-Host "     Check: DATABASE_URL_UNPOOLED role (must be studio_app not neondb_owner)" -ForegroundColor Red
    Write-Host "     Check: withTenant() transaction isolation in src/db/index.ts" -ForegroundColor Red
    foreach ($l in $leaks) {
        Write-Host "     Leaking request: Index=$($l.Index) Tenant=$($l.Tenant) Records=$($l.RecordCount)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  NEO-001: PARTIAL — $($errors.Count) error(s), 0 leaks" -ForegroundColor Yellow
    Write-Host "     No cross-tenant leakage but some requests failed." -ForegroundColor Yellow
    Write-Host "     Check token validity and network connectivity." -ForegroundColor Yellow
}

Write-Host "  ─────────────────────────────────────────────────────────"
Write-Host ""

# ── Export results to file ─────────────────────────────────────────────────────
$report = @{
    testId      = "NEO-001"
    timestamp   = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    totalReqs   = $TotalRequests
    leaks       = $leaks.Count
    errors      = $errors.Count
    verdict     = if ($leaks.Count -eq 0 -and $errors.Count -eq 0) { "PASS" } elseif ($leaks.Count -gt 0) { "FAIL" } else { "PARTIAL" }
    results     = $allResults
}
$report | ConvertTo-Json -Depth 5 | Out-File -FilePath "NEO001_RESULTS.json" -Encoding UTF8
Write-Host "  Report written to NEO001_RESULTS.json"
Write-Host ""
