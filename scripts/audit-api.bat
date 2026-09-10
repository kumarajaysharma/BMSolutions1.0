@echo off
REM ============================================================
REM BNLV Group — Live API Test Battery
REM Run from project root: audit-api.bat
REM
REM Prerequisites:
REM   1. Run audit-platform.mjs first (local checks)
REM   2. Run audit-neon.sql in Neon editor (DB checks)
REM   3. Obtain fresh tokens before running (tokens expire 24h)
REM   4. Set LIMSY_TOKEN and DEV_TOKEN before running
REM
REM Usage:
REM   set LIMSY_TOKEN=eyJ...   (architect@limsy.bnlvconsulting.com)
REM   set DEV_TOKEN=eyJ...     (dev@limsy.bnlvconsulting.com)
REM   set BMS_TOKEN=eyJ...     (admin@bms.bnlvconsulting.com)
REM   audit-api.bat
REM ============================================================

setlocal enabledelayedexpansion
set PASS_COUNT=0
set FAIL_COUNT=0
set SKIP_COUNT=0
set REPORT_FILE=AUDIT_API_RESULTS.txt

echo. > %REPORT_FILE%
echo BNLV GROUP — LIVE API TEST BATTERY >> %REPORT_FILE%
echo Generated: %date% %time% >> %REPORT_FILE%
echo ============================================================ >> %REPORT_FILE%

echo.
echo ============================================================
echo  BNLV GROUP ^| saas-studio ^| Live API Test Battery
echo  Report: %REPORT_FILE%
echo ============================================================

REM ─── TOKEN VALIDATION ────────────────────────────────────────────────────────
echo.
echo [SETUP] Validating tokens...

if "%LIMSY_TOKEN%"=="" (
    echo [WARN] LIMSY_TOKEN not set. Run:
    echo        curl -si -X POST https://limsy.bnlvconsulting.com/api/auth/login
    echo        -H "Content-Type: application/json"
    echo        -d "{\"email\":\"architect@limsy.bnlvconsulting.com\",\"password\":\"LimsyArch@2026\",\"tenantSlug\":\"limsy\"}"
    echo        Then: set LIMSY_TOKEN=^<bms_session value from Set-Cookie^>
    set LIMSY_TOKEN=MISSING
)

if "%DEV_TOKEN%"=="" (
    echo [WARN] DEV_TOKEN not set. Run login for dev@limsy.bnlvconsulting.com
    set DEV_TOKEN=MISSING
)

if "%BMS_TOKEN%"=="" (
    echo [WARN] BMS_TOKEN not set. Run login for admin@bms.bnlvconsulting.com
    set BMS_TOKEN=MISSING
)

REM ─── HELPER MACROS ───────────────────────────────────────────────────────────
REM  check_http <test_id> <expected_code> <actual_code> <description>

REM ═══════════════════════════════════════════════════════════════════════════
REM SECTION 1: ZERO-TRUST INGRESS
REM ═══════════════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════
echo  SECTION 1: ZERO-TRUST INGRESS
echo ════════════════════════════════════════
echo. >> %REPORT_FILE%
echo SECTION 1: ZERO-TRUST INGRESS >> %REPORT_FILE%

REM ZT-001: www redirect
echo.
echo [ZT-001] www subdomain redirect...
for /f %%i in ('curl -sI https://www.bnlvconsulting.com ^| findstr /B "HTTP/"') do set ZT001_STATUS=%%i
echo   Status: !ZT001_STATUS!
if "!ZT001_STATUS!"=="HTTP/1.1 308 Permanent Redirect" (
    echo   CONDITIONAL PASS - 308 accepted ^(Vercel emits 308, not 301^) >> %REPORT_FILE%
    echo   [COND] ZT-001: www redirect - 308 ^(Vercel^), documented deviation
    set /a PASS_COUNT+=1
) else if "!ZT001_STATUS!"=="HTTP/1.1 301 Moved Permanently" (
    echo   PASS - 301 redirect >> %REPORT_FILE%
    echo   [PASS] ZT-001: www redirect - 301
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 301/308, got: !ZT001_STATUS! >> %REPORT_FILE%
    echo   [FAIL] ZT-001: Unexpected status !ZT001_STATUS!
    set /a FAIL_COUNT+=1
)

REM ZT-003: Unknown subdomain TLS rejection
echo.
echo [ZT-003] Unknown subdomain TLS rejection...
curl -s --max-time 8 https://unknown.bnlvconsulting.com > nul 2>&1
if errorlevel 1 (
    echo   PASS - Connection rejected at TLS layer >> %REPORT_FILE%
    echo   [PASS] ZT-003: TLS handshake rejected for unknown subdomain
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Connection succeeded for unknown subdomain >> %REPORT_FILE%
    echo   [FAIL] ZT-003: Unknown subdomain accepted connection
    set /a FAIL_COUNT+=1
)

REM ZT-004: Header injection stripped
echo.
echo [ZT-004] Client x-tenant-id header injection...
for /f %%i in ('curl -sI -H "x-tenant-id: 1" -H "x-user-role: owner" https://bms.bnlvconsulting.com/api/limsy/cases ^| findstr /B "HTTP/"') do set ZT004_STATUS=%%i
echo   Status: !ZT004_STATUS!
if "!ZT004_STATUS!"=="HTTP/1.1 401 Unauthorized" (
    echo   PASS - 401 on injected headers >> %REPORT_FILE%
    echo   [PASS] ZT-004: Injected x-tenant-id rejected
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 401, got: !ZT004_STATUS! >> %REPORT_FILE%
    echo   [FAIL] ZT-004: Unexpected status !ZT004_STATUS!
    set /a FAIL_COUNT+=1
)

REM ZT-008: Developer RBAC (requires DEV_TOKEN)
echo.
echo [ZT-008] Developer blocked from architect endpoint...
if "%DEV_TOKEN%"=="MISSING" (
    echo   SKIP - DEV_TOKEN not set >> %REPORT_FILE%
    echo   [SKIP] ZT-008: Set DEV_TOKEN to run
    set /a SKIP_COUNT+=1
) else (
    for /f %%i in ('curl -sI -X POST https://limsy.bnlvconsulting.com/api/limsy/cases -H "Content-Type: application/json" -H "Cookie: bms_session=%DEV_TOKEN%" -d "{\"internalRef\":\"RBAC-AUDIT\",\"courtLevel\":\"supreme_court\",\"courtName\":\"SC\",\"caseType\":\"slp\",\"petitioner\":\"A\",\"respondent\":\"B\",\"subjectMatter\":\"RBAC audit test\"}" ^| findstr /B "HTTP/"') do set ZT008_STATUS=%%i
    echo   Status: !ZT008_STATUS!
    if "!ZT008_STATUS!"=="HTTP/1.1 403 Forbidden" (
        echo   PASS - 403 for developer role >> %REPORT_FILE%
        echo   [PASS] ZT-008: Developer blocked from architect POST
        set /a PASS_COUNT+=1
    ) else (
        echo   FAIL - Expected 403, got: !ZT008_STATUS! >> %REPORT_FILE%
        echo   [FAIL] ZT-008: Unexpected status !ZT008_STATUS!
        set /a FAIL_COUNT+=1
    )
)

REM ZT-009: Unauthenticated request
echo.
echo [ZT-009] Unauthenticated API request...
for /f %%i in ('curl -sI https://bms.bnlvconsulting.com/api/limsy/cases ^| findstr /B "HTTP/"') do set ZT009_STATUS=%%i
echo   Status: !ZT009_STATUS!
if "!ZT009_STATUS!"=="HTTP/1.1 401 Unauthorized" (
    echo   PASS - 401 unauthenticated >> %REPORT_FILE%
    echo   [PASS] ZT-009: Unauthenticated request rejected
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 401, got: !ZT009_STATUS! >> %REPORT_FILE%
    echo   [FAIL] ZT-009: Unexpected status !ZT009_STATUS!
    set /a FAIL_COUNT+=1
)

REM ═══════════════════════════════════════════════════════════════════════════
REM SECTION 2: AUTHENTICATION
REM ═══════════════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════
echo  SECTION 2: AUTHENTICATION
echo ════════════════════════════════════════
echo. >> %REPORT_FILE%
echo SECTION 2: AUTHENTICATION >> %REPORT_FILE%

REM AUTH-001: Valid login
echo.
echo [AUTH-001] Valid login creates httpOnly cookie...
set AUTH001_OUT=
for /f %%i in ('curl -si -X POST https://bms.bnlvconsulting.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@bms.bnlvconsulting.com\",\"password\":\"YOUR_NEW_PASSWORD\",\"tenantSlug\":\"bms\"}" 2^>nul ^| findstr /I "set-cookie"') do set AUTH001_OUT=%%i
if not "!AUTH001_OUT!"=="" (
    echo   PASS - Set-Cookie header present >> %REPORT_FILE%
    echo   [PASS] AUTH-001: Login creates session cookie
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - No Set-Cookie header ^(update password in script^) >> %REPORT_FILE%
    echo   [FAIL] AUTH-001: No cookie - verify BMS admin password in script
    set /a FAIL_COUNT+=1
)

REM AUTH-002: Wrong password timing
echo.
echo [AUTH-002] Wrong password response time...
for /f %%i in ('curl -s -o nul -w "%%{time_total}" -X POST https://bms.bnlvconsulting.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@bms.bnlvconsulting.com\",\"password\":\"DEFINITELY_WRONG_PW_123\",\"tenantSlug\":\"bms\"}"') do set AUTH002_TIME=%%i
echo   Response time: !AUTH002_TIME!s
echo   AUTH-002: Response time=!AUTH002_TIME!s (need ge 0.200) >> %REPORT_FILE%
echo   [INFO] AUTH-002: Verify time is ^>= 0.200s: !AUTH002_TIME!s

REM AUTH-004: Session endpoint guard
echo.
echo [AUTH-004] Session endpoint middleware guard...
for /f %%i in ('curl -sI -X POST https://bms.bnlvconsulting.com/api/auth/sessions -H "Content-Type: application/json" -d "{\"test\":\"no-auth\"}" ^| findstr /B "HTTP/"') do set AUTH004_STATUS=%%i
echo   Status: !AUTH004_STATUS!
if "!AUTH004_STATUS!"=="HTTP/1.1 401 Unauthorized" (
    echo   PASS - 401 without auth >> %REPORT_FILE%
    echo   [PASS] AUTH-004: Session endpoint guards unauthenticated POST
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 401, got !AUTH004_STATUS! >> %REPORT_FILE%
    echo   [FAIL] AUTH-004: Unexpected status !AUTH004_STATUS!
    set /a FAIL_COUNT+=1
)

REM ═══════════════════════════════════════════════════════════════════════════
REM SECTION 3: LIMSY API — REQUIRES LIMSY_TOKEN
REM ═══════════════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════
echo  SECTION 3: LIMSY API
echo ════════════════════════════════════════
echo. >> %REPORT_FILE%
echo SECTION 3: LIMSY API >> %REPORT_FILE%

if "%LIMSY_TOKEN%"=="MISSING" (
    echo   [SKIP] All LIMSY tests - LIMSY_TOKEN not set
    echo   SKIP - LIMSY_TOKEN not set >> %REPORT_FILE%
    set /a SKIP_COUNT+=6
    goto :NIDHIVAN
)

REM LC-001: POST valid case
echo.
echo [LC-001] POST valid SLP case...
for /f %%i in ('curl -sI -X POST https://limsy.bnlvconsulting.com/api/limsy/cases -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"internalRef\":\"AUDIT-2026-001\",\"courtLevel\":\"supreme_court\",\"courtName\":\"Supreme Court of India\",\"caseType\":\"slp\",\"petitioner\":\"BNLV Audit Test\",\"respondent\":\"Respondent Audit\",\"subjectMatter\":\"Automated audit test case\"}" ^| findstr /B "HTTP/"') do set LC001_STATUS=%%i
echo   Status: !LC001_STATUS!
if "!LC001_STATUS!"=="HTTP/1.1 201 Created" (
    echo   PASS - 201 created >> %REPORT_FILE%
    echo   [PASS] LC-001: Case created successfully
    set /a PASS_COUNT+=1
) else if "!LC001_STATUS!"=="HTTP/1.1 409 Conflict" (
    echo   PASS - 409 duplicate ^(case already exists from prior run^) >> %REPORT_FILE%
    echo   [PASS] LC-001: 409 - case already exists ^(idempotent^)
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 201/409, got: !LC001_STATUS! >> %REPORT_FILE%
    echo   [FAIL] LC-001: Unexpected status !LC001_STATUS!
    set /a FAIL_COUNT+=1
)

REM LC-002: Missing field validation
echo.
echo [LC-002] POST missing required field...
for /f %%i in ('curl -sI -X POST https://limsy.bnlvconsulting.com/api/limsy/cases -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"internalRef\":\"AUDIT-MISSING\",\"courtLevel\":\"supreme_court\"}" ^| findstr /B "HTTP/"') do set LC002_STATUS=%%i
echo   Status: !LC002_STATUS!
if "!LC002_STATUS!"=="HTTP/1.1 400 Bad Request" (
    echo   PASS - 400 on missing fields >> %REPORT_FILE%
    echo   [PASS] LC-002: Missing field validation works
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 400, got: !LC002_STATUS! >> %REPORT_FILE%
    echo   [FAIL] LC-002: Unexpected status !LC002_STATUS!
    set /a FAIL_COUNT+=1
)

REM LC-004: Developer projection (requires DEV_TOKEN)
echo.
echo [LC-004] Developer role column projection...
if "%DEV_TOKEN%"=="MISSING" (
    echo   [SKIP] LC-004: DEV_TOKEN not set
    echo   SKIP - DEV_TOKEN not set >> %REPORT_FILE%
    set /a SKIP_COUNT+=1
) else (
    set LC004_BODY=
    for /f %%i in ('curl -s https://limsy.bnlvconsulting.com/api/limsy/cases -H "Cookie: bms_session=%DEV_TOKEN%"') do set LC004_BODY=%%i
    echo !LC004_BODY! | findstr "petitioner" > nul 2>&1
    if errorlevel 1 (
        echo   PASS - petitioner absent from developer response >> %REPORT_FILE%
        echo   [PASS] LC-004: Developer projection excludes party fields
        set /a PASS_COUNT+=1
    ) else (
        echo   FAIL - petitioner visible in developer response >> %REPORT_FILE%
        echo   [FAIL] LC-004: Party fields exposed to developer role
        set /a FAIL_COUNT+=1
    )
)

REM LH-001: POST hearing
echo.
echo [LH-001] POST schedule hearing...
for /f %%i in ('curl -sI -X POST https://limsy.bnlvconsulting.com/api/limsy/hearings -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"caseId\":1,\"scheduledDate\":\"2026-10-15T10:00:00Z\",\"hearingNumber\":99,\"courtRoom\":\"Court 6 - Audit Test\"}" ^| findstr /B "HTTP/"') do set LH001_STATUS=%%i
echo   Status: !LH001_STATUS!
if "!LH001_STATUS!"=="HTTP/1.1 201 Created" (
    echo   PASS - 201 hearing created >> %REPORT_FILE%
    echo   [PASS] LH-001: Hearing scheduled successfully
    set /a PASS_COUNT+=1
) else if "!LH001_STATUS!"=="HTTP/1.1 409 Conflict" (
    echo   PASS - 409 duplicate hearing number >> %REPORT_FILE%
    echo   [PASS] LH-001: 409 - duplicate hearing number constraint works
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 201/409, got: !LH001_STATUS! >> %REPORT_FILE%
    echo   [FAIL] LH-001: Unexpected status !LH001_STATUS!
    set /a FAIL_COUNT+=1
)

REM LH-003: adjournmentCount tamper resistance
echo.
echo [LH-003] adjournmentCount tamper resistance...
set LH003_RESP=
for /f %%i in ('curl -s -X PATCH https://limsy.bnlvconsulting.com/api/limsy/hearings -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"id\":1,\"adjournmentCount\":999}"') do set LH003_RESP=%%i
echo   Response: !LH003_RESP!
echo !LH003_RESP! | findstr "No valid fields" > nul 2>&1
if not errorlevel 1 (
    echo   PASS - 400 No valid fields ^(adjournmentCount silently rejected^) >> %REPORT_FILE%
    echo   [PASS] LH-003: Client adjournmentCount rejected
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - adjournmentCount may have been accepted >> %REPORT_FILE%
    echo   [FAIL] LH-003: Unexpected response: !LH003_RESP!
    set /a FAIL_COUNT+=1
)

REM LO-001: SHA-256 order hash
echo.
echo [LO-001] POST order with cryptographic hash...
set LO001_RESP=
for /f "delims=" %%i in ('curl -s -X POST https://limsy.bnlvconsulting.com/api/limsy/orders -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"caseId\":1,\"orderDate\":\"2026-10-15T14:00:00Z\",\"orderType\":\"interim_stay\",\"orderTitle\":\"Audit Test Order\",\"operative\":\"This is an automated audit test order for integrity verification.\"}"') do set LO001_RESP=%%i
echo !LO001_RESP! | findstr "cryptoHash" > nul 2>&1
if not errorlevel 1 (
    echo   PASS - cryptoHash present in response >> %REPORT_FILE%
    echo   [PASS] LO-001: Order created with SHA-256 cryptoHash
    set /a PASS_COUNT+=1
) else (
    echo !LO001_RESP! | findstr "409" > nul 2>&1
    if not errorlevel 1 (
        echo   PASS - 409 duplicate ^(order constraint working^) >> %REPORT_FILE%
        echo   [PASS] LO-001: 409 duplicate order - constraint working
        set /a PASS_COUNT+=1
    ) else (
        echo   FAIL - No cryptoHash in response >> %REPORT_FILE%
        echo   [FAIL] LO-001: Missing cryptoHash. Response: !LO001_RESP:~0,100!
        set /a FAIL_COUNT+=1
    )
)

REM LO-002: Developer GET orders blocked
echo.
echo [LO-002] Developer GET orders...
if "%DEV_TOKEN%"=="MISSING" (
    echo   [SKIP] LO-002: DEV_TOKEN not set
    set /a SKIP_COUNT+=1
) else (
    for /f %%i in ('curl -sI https://limsy.bnlvconsulting.com/api/limsy/orders -H "Cookie: bms_session=%DEV_TOKEN%" ^| findstr /B "HTTP/"') do set LO002_STATUS=%%i
    echo   Status: !LO002_STATUS!
    if "!LO002_STATUS!"=="HTTP/1.1 403 Forbidden" (
        echo   PASS - 403 developer blocked from orders >> %REPORT_FILE%
        echo   [PASS] LO-002: Developer blocked from orders endpoint
        set /a PASS_COUNT+=1
    ) else (
        echo   FAIL - Expected 403, got: !LO002_STATUS! >> %REPORT_FILE%
        echo   [FAIL] LO-002: Orders exposed to developer role
        set /a FAIL_COUNT+=1
    )
)

REM LO-004: DELETE blocked
echo.
echo [LO-004] DELETE on orders returns 405...
for /f %%i in ('curl -sI -X DELETE https://limsy.bnlvconsulting.com/api/limsy/orders -H "Cookie: bms_session=%LIMSY_TOKEN%" ^| findstr /B "HTTP/"') do set LO004_STATUS=%%i
echo   Status: !LO004_STATUS!
if "!LO004_STATUS!"=="HTTP/1.1 405 Method Not Allowed" (
    echo   PASS - 405 DELETE blocked >> %REPORT_FILE%
    echo   [PASS] LO-004: DELETE returns 405
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 405, got: !LO004_STATUS! >> %REPORT_FILE%
    echo   [FAIL] LO-004: Unexpected status !LO004_STATUS!
    set /a FAIL_COUNT+=1
)

:NIDHIVAN
REM ═══════════════════════════════════════════════════════════════════════════
REM SECTION 4: DEPLOYMENT VERIFICATION
REM ═══════════════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════
echo  SECTION 4: DEPLOYMENT VERIFICATION
echo ════════════════════════════════════════
echo. >> %REPORT_FILE%
echo SECTION 4: DEPLOYMENT VERIFICATION >> %REPORT_FILE%

for %%S in (bms nidhivan limsy vihang) do (
    echo.
    echo [DV-001] %%S.bnlvconsulting.com...
    for /f %%i in ('curl -sI https://%%S.bnlvconsulting.com ^| findstr /B "HTTP/"') do set DV001_%%S=%%i
    echo   Status: !DV001_%%S!
    if "!DV001_%%S!"=="HTTP/1.1 200 OK" (
        echo   PASS - %%S 200 OK >> %REPORT_FILE%
        echo   [PASS] DV-001: %%S.bnlvconsulting.com renders
        set /a PASS_COUNT+=1
    ) else (
        echo   FAIL - %%S: !DV001_%%S! >> %REPORT_FILE%
        echo   [FAIL] DV-001: %%S status !DV001_%%S!
        set /a FAIL_COUNT+=1
    )
)

REM Cloudflare WAF
echo.
echo [DV-008] Cloudflare WAF active...
for /f %%i in ('curl -sI https://bms.bnlvconsulting.com ^| findstr /I "cf-ray"') do set DV008_CF=%%i
if not "!DV008_CF!"=="" (
    echo   PASS - CF-Ray: !DV008_CF! >> %REPORT_FILE%
    echo   [PASS] DV-008: Cloudflare WAF active
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - CF-Ray header absent >> %REPORT_FILE%
    echo   [FAIL] DV-008: Cloudflare not proxying
    set /a FAIL_COUNT+=1
)

REM Vercel region
echo.
echo [DV-006] Vercel edge region...
for /f %%i in ('curl -sI https://limsy.bnlvconsulting.com ^| findstr /I "x-vercel-id"') do set DV006_VID=%%i
echo   !DV006_VID!
echo   DV-006: !DV006_VID! >> %REPORT_FILE%
echo   [INFO] DV-006: Check for bom1 or sin1 in x-vercel-id

REM ═══════════════════════════════════════════════════════════════════════════
REM SECTION 5: AI ENDPOINTS
REM ═══════════════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════
echo  SECTION 5: AI ENDPOINTS
echo ════════════════════════════════════════
echo. >> %REPORT_FILE%
echo SECTION 5: AI ENDPOINTS >> %REPORT_FILE%

if "%LIMSY_TOKEN%"=="MISSING" (
    echo   [SKIP] AI tests - LIMSY_TOKEN not set
    set /a SKIP_COUNT+=2
    goto :SUMMARY
)

REM Synopsis endpoint
echo.
echo [AI-001] AI Synopsis endpoint...
for /f %%i in ('curl -sI -X POST https://limsy.bnlvconsulting.com/api/limsy/synopsis -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"petitioner\":\"Test Corp\",\"respondent\":\"State of CG\",\"courtName\":\"Supreme Court\",\"caseType\":\"slp\",\"subjectMatter\":\"Constitutional challenge to executive order\"}" ^| findstr /B "HTTP/"') do set AI001_STATUS=%%i
echo   Status: !AI001_STATUS!
if "!AI001_STATUS!"=="HTTP/1.1 200 OK" (
    echo   PASS - Synopsis generated >> %REPORT_FILE%
    echo   [PASS] AI-001: Synopsis endpoint returns 200
    set /a PASS_COUNT+=1
) else (
    echo   FAIL - Expected 200, got: !AI001_STATUS! >> %REPORT_FILE%
    echo   [FAIL] AI-001: Unexpected status !AI001_STATUS!
    set /a FAIL_COUNT+=1
)

REM Orchestration endpoint
echo.
echo [AI-002] AI Orchestration endpoint...
for /f %%i in ('curl -sI -X POST https://limsy.bnlvconsulting.com/api/ai/orchestrate -H "Content-Type: application/json" -H "Cookie: bms_session=%LIMSY_TOKEN%" -d "{\"task\":\"Assess the legal strength of the Article 356 SLP and whether interim stay is warranted.\"}" ^| findstr /B "HTTP/"') do set AI002_STATUS=%%i
echo   Status: !AI002_STATUS!
if "!AI002_STATUS!"=="HTTP/1.1 200 OK" (
    echo   PASS - Orchestration endpoint returns 200 >> %REPORT_FILE%
    echo   [PASS] AI-002: Orchestration endpoint live
    set /a PASS_COUNT+=1
) else if "!AI002_STATUS!"=="HTTP/1.1 404 Not Found" (
    echo   SKIP - Track C not yet deployed >> %REPORT_FILE%
    echo   [SKIP] AI-002: Deploy Track C first ^(copy agents.ts + orchestrate/route.ts^)
    set /a SKIP_COUNT+=1
) else (
    echo   FAIL - Expected 200/404, got: !AI002_STATUS! >> %REPORT_FILE%
    echo   [FAIL] AI-002: Unexpected status !AI002_STATUS!
    set /a FAIL_COUNT+=1
)

:SUMMARY
REM ═══════════════════════════════════════════════════════════════════════════
REM SUMMARY
REM ═══════════════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════
echo  AUDIT SUMMARY
echo ════════════════════════════════════════
echo.
echo   PASS  : %PASS_COUNT%
echo   FAIL  : %FAIL_COUNT%
echo   SKIP  : %SKIP_COUNT%
echo.
echo   Report: %REPORT_FILE%
echo.
echo. >> %REPORT_FILE%
echo ════════════════════════════════════════ >> %REPORT_FILE%
echo SUMMARY: PASS=%PASS_COUNT%  FAIL=%FAIL_COUNT%  SKIP=%SKIP_COUNT% >> %REPORT_FILE%
echo Generated: %date% %time% >> %REPORT_FILE%

if "%FAIL_COUNT%"=="0" (
    echo   ✅ ALL TESTS PASSED
    echo   STATUS: ALL PASS >> %REPORT_FILE%
) else (
    echo   ❌ %FAIL_COUNT% TEST(S) FAILED - Review AUDIT_API_RESULTS.txt
    echo   STATUS: %FAIL_COUNT% FAILURE^(S^) >> %REPORT_FILE%
)

echo.
echo ════════════════════════════════════════
echo  NEXT: Run audit-neon.sql in Neon editor
echo ════════════════════════════════════════
echo.

endlocal
