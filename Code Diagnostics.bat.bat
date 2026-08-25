rem 1. Check Neon Driver & Transaction Logic
findstr /n "SET LOCAL\|current_tenant\|transaction\|execute" src\db\index.ts
findstr /n "neon\|Pool\|Client\|DATABASE_URL" src\db\index.ts | findstr /v "UNPOOLED\|//"

rem 2. Diagnose the 500 Error (Context Property Mismatch)
findstr /n "userRole\|\.role\b\|return {" src\lib\request-context.ts
findstr /n "ctx\." src\app\api\limsy\cases\route.ts | findstr /i "role"

rem 3. Pinpoint the DV-007 TypeScript Build Error
npx tsc --noEmit > tsc-errors.txt 2>&1
powershell -Command "Get-Content tsc-errors.txt -TotalCount 30"