@echo off
echo ========================================================
echo BNLV Studio - Zero-Trust Security Tests (DOS/Windows)
echo ========================================================
echo.

:: ----------------------------------------------------------
:: CONFIGURATION: REPLACE THESE WITH YOUR ACTUAL TEST TOKENS
:: ----------------------------------------------------------
set "EXPIRED_JWT=paste_your_expired_token_here"
set "CORRUPT_JWT=paste.header.payload.corruptedsig"
set "DEVELOPER_JWT=paste_your_valid_developer_token_here"

:: ----------------------------------------------------------
:: EXECUTION
:: ----------------------------------------------------------

echo [ZT-006]: Use an old captured token
echo Expected: HTTP/2 401
curl -sI -H "Cookie: bms_session=%EXPIRED_JWT%" https://bms.bnlvconsulting.com/studio | powershell -Command "$input | Select-Object -First 2"
echo.

echo [ZT-007]: Corrupt last 3 chars of valid token signature
echo Expected: HTTP/2 401
curl -sI -H "Cookie: bms_session=%CORRUPT_JWT%" https://bms.bnlvconsulting.com/studio | powershell -Command "$input | Select-Object -First 2"
echo.

echo [RBAC Test]: Authenticate as developer-role user and POST to architect endpoint
echo Expected JSON: {"error":"Forbidden - Insufficient privileges"} (HTTP 403)
curl -s -X POST https://limsy.bnlvconsulting.com/api/limsy/cases ^
  -H "Cookie: bms_session=%DEVELOPER_JWT%" ^
  -H "Content-Type: application/json" ^
  -d "{\"internalRef\":\"test\",\"courtLevel\":\"supreme_court\",\"courtName\":\"test\",\"caseType\":\"slp\",\"petitioner\":\"A\",\"respondent\":\"B\",\"subjectMatter\":\"test\"}" ^
  | python3 -m json.tool
echo.

echo [No Auth 1]: Unauthenticated GET to API
echo Expected: HTTP/2 401
curl -sI https://bms.bnlvconsulting.com/api/limsy/cases | powershell -Command "$input | Select-Object -First 2"
echo.

echo [No Auth 2]: Unauthenticated GET to Studio frontend
echo Expected: HTTP/2 401
curl -sI https://bms.bnlvconsulting.com/studio | powershell -Command "$input | Select-Object -First 2"
echo.

echo ========================================================
echo Tests Complete.
pause