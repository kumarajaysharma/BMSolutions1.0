function Test-Endpoint {
    param($Id, $Url, $Method = "GET", $Headers = @{}, $Body = $null, $ExpectedCode, $Cookie = $null)
    try {
        $params = @{ Uri = $Url; Method = $Method; UseBasicParsing = $true; TimeoutSec = 15 }
        if ($Cookie) { $params.Headers = @{ Cookie = "bms_session=$Cookie" } }
        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params -ErrorAction SilentlyContinue
        $code = $r.StatusCode
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
    }
    $status = if ($code -eq $ExpectedCode) { "PASS" } else { "FAIL" }
    Write-Host "[$status] $Id â€” HTTP $code (expected $ExpectedCode)"
    return $code
}

$ARCH = Read-Host "Paste LIMSY_TOKEN (architect)"
$DEV  = Read-Host "Paste DEV_TOKEN (developer)"

Test-Endpoint "ZT-001" "https://www.bnlvconsulting.com"                -ExpectedCode 301
Test-Endpoint "ZT-004" "https://bms.bnlvconsulting.com/api/limsy/cases" -ExpectedCode 401
Test-Endpoint "ZT-009" "https://bms.bnlvconsulting.com/api/limsy/cases" -ExpectedCode 401

Test-Endpoint "LC-001" "https://limsy.bnlvconsulting.com/api/limsy/cases" -Method POST `
  -Cookie $ARCH -ExpectedCode 201 `
  -Body '{"internalRef":"AUDIT-PS-001","courtLevel":"supreme_court","courtName":"Supreme Court of India","caseType":"slp","petitioner":"PS Audit","respondent":"Respondent PS","subjectMatter":"PowerShell audit test case"}'

Test-Endpoint "LC-002" "https://limsy.bnlvconsulting.com/api/limsy/cases" -Method POST `
  -Cookie $ARCH -ExpectedCode 400 `
  -Body '{"internalRef":"AUDIT-PS-MISSING","courtLevel":"supreme_court"}'

Test-Endpoint "LO-002" "https://limsy.bnlvconsulting.com/api/limsy/orders" `
  -Cookie $DEV -ExpectedCode 403

Test-Endpoint "LO-004" "https://limsy.bnlvconsulting.com/api/limsy/orders" `
  -Method DELETE -Cookie $ARCH -ExpectedCode 405

Test-Endpoint "DV-001-bms"      "https://bms.bnlvconsulting.com"      -ExpectedCode 200
Test-Endpoint "DV-001-nidhivan" "https://nidhivan.bnlvconsulting.com" -ExpectedCode 200
Test-Endpoint "DV-001-limsy"    "https://limsy.bnlvconsulting.com"    -ExpectedCode 200
Test-Endpoint "DV-001-vihang"   "https://vihang.bnlvconsulting.com"   -ExpectedCode 200

Write-Host "`nDone. Tokens valid for 24h from login."
