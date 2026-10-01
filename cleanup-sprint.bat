@echo off
setlocal EnableDelayedExpansion

:: 1. Setup Working Directory
set "PROJECT_ROOT=%~dp0"
if not exist "%PROJECT_ROOT%package.json" set "PROJECT_ROOT=%CD%\"
echo.
echo [BNLV Cleanup] Working directory: %PROJECT_ROOT%
echo.

:: ============================================================
:: SECTION 0: SEC-001 Credential File Removal
:: ============================================================
echo === SECTION 0: SEC-001 Credential File Removal ===
for %%f in (".env.local.admin" ".env.vercel-prod") do (
    if exist "%PROJECT_ROOT%%%~f" (
        git -C "%PROJECT_ROOT:~0,-1%" rm --cached "%%~f" >nul 2>&1
        del /F /Q "%PROJECT_ROOT%%%~f"
        echo   [REMOVED] %%~f
    ) else (
        echo   [SKIP] %%~f not found
    )
)

findstr /C:".env.local.admin" "%PROJECT_ROOT%.gitignore" >nul 2>&1
if errorlevel 1 (
    echo.>> "%PROJECT_ROOT%.gitignore"
    echo # BNLV - Credential files (SEC-001)>> "%PROJECT_ROOT%.gitignore"
    echo .env.local.admin>> "%PROJECT_ROOT%.gitignore"
    echo .env.vercel-prod>> "%PROJECT_ROOT%.gitignore"
    echo .env.*.admin>> "%PROJECT_ROOT%.gitignore"
    echo .env.*.prod>> "%PROJECT_ROOT%.gitignore"
    echo *.env.backup>> "%PROJECT_ROOT%.gitignore"
    echo   [PATCHED] .gitignore updated
) else (
    echo   [SKIP] .gitignore already blocks files
)
echo.

:: ============================================================
:: SECTION 1: Root Junk File Removal
:: ============================================================
echo === SECTION 1: Root Junk File Removal ===
set junk="migrate.mjs.js" "LLM_Context_PostMerge.md" "System_State_PostMerge.json" "bnlv-enterprise-context.md" "project-summary.txt" "repomix.config.json" "10_DAY_SPRINT_CHECKLIST.md" "AUDIT_API_RESULTS.txt" "neo001-schema.sql" "neo001-seed.sql" "neo001-rls.sql" "neo001-migrations.sql"

for %%f in (%junk%) do (
    if exist "%PROJECT_ROOT%%%~f" (
        git -C "%PROJECT_ROOT:~0,-1%" rm --cached "%%~f" >nul 2>&1
        del /F /Q "%PROJECT_ROOT%%%~f"
        echo   [REMOVED] %%~f
    ) else (
        echo   [SKIP] %%~f
    )
)

if exist "%PROJECT_ROOT%-p" (
    git -C "%PROJECT_ROOT:~0,-1%" rm -rf --cached "-p/" >nul 2>&1
    rmdir /S /Q "%PROJECT_ROOT%-p"
    echo   [REMOVED] -p/ directory
)
echo.

:: ============================================================
:: SECTION 2: Double-Extension Script Renames
:: ============================================================
echo === SECTION 2: Double-Extension Script Renames ===
call :RenameFile "scripts\migrate.ts.ts" "scripts\migrate.ts"
call :RenameFile "scripts\seed.ts.ts" "scripts\seed.ts"
call :RenameFile "scripts\create-middleware-nft.mjs.mjs" "scripts\create-middleware-nft.mjs"
call :RenameFile "scripts\generate-schema.ts.ts" "scripts\generate-schema.ts"
call :RenameFile "scripts\validate-env.ts.ts" "scripts\validate-env.ts"
call :RenameFile "scripts\check-db.ts.ts" "scripts\check-db.ts"
goto :SkipRenameFunc

:RenameFile
if exist "%PROJECT_ROOT%%~1" (
    git -C "%PROJECT_ROOT:~0,-1%" mv "%~1" "%~2" >nul 2>&1
    echo   [RENAMED] %~1 -^> %~2
) else (
    echo   [SKIP] %~1 not found
)
exit /b
:SkipRenameFunc
echo.

:: ============================================================
:: SECTION 3 & 4: Remove Duplicates & Nested Layout
:: ============================================================
echo === SECTION 3: Remove Directory (CODE-002) ===
if exist "%PROJECT_ROOT%src\db\migrations" (
    git -C "%PROJECT_ROOT:~0,-1%" rm -rf --cached "src/db/migrations/" >nul 2>&1
    rmdir /S /Q "%PROJECT_ROOT%src\db\migrations"
    echo   [REMOVED] src\db\migrations\
)

echo === SECTION 4: Remove Nested Layout (CODE-003) ===
if exist "%PROJECT_ROOT%src\app\studio\nidhivan\layout.tsx" (
    git -C "%PROJECT_ROOT:~0,-1%" rm --cached "src/app/studio/nidhivan/layout.tsx" >nul 2>&1
    del /F /Q "%PROJECT_ROOT%src\app\studio\nidhivan\layout.tsx"
    echo   [REMOVED] nidhivan/layout.tsx
)
echo.

:: ============================================================
:: SECTION 5: Legacy Route Redirects
:: ============================================================
echo === SECTION 5: Legacy Route Redirects ===
call :WriteRedirect "/studio/bms-studio" "/studio/bms"
call :WriteRedirect "/studio/bms-studio/agentic" "/studio/bms/agentic"
call :WriteRedirect "/studio/bms-studio/builder" "/studio/bms/builder"
call :WriteRedirect "/studio/bms-studio/clients" "/studio/bms/clients"
call :WriteRedirect "/studio/bms-studio/projects" "/studio/bms/projects"
call :WriteRedirect "/studio/bms-studio/team" "/studio/bms/team"
call :WriteRedirect "/studio/bms-studio/workflows" "/studio/bms/workflows"
call :WriteRedirect "/studio/bms-studio/documents" "/studio/bms/documents"
call :WriteRedirect "/studio/bms-academy" "/studio/bms/academy"
call :WriteRedirect "/studio/bms-academy/my-learning" "/studio/bms/academy"
call :WriteRedirect "/studio/bms-academy/paths" "/studio/bms/academy"
call :WriteRedirect "/studio/nidhivan/connectors" "/studio/nidhivan"
call :WriteRedirect "/studio/nidhivan/counsel" "/studio/nidhivan"
call :WriteRedirect "/studio/limsy/connectors" "/studio/limsy"
call :WriteRedirect "/studio/limsy/frameworks" "/studio/limsy"
call :WriteRedirect "/studio/limsy/counsel" "/studio/limsy/trial"
call :WriteRedirect "/home" "/studio"
call :WriteRedirect "/app" "/studio"
call :WriteRedirect "/builder" "/studio/bms/builder"
call :WriteRedirect "/ai-engine" "/studio/ai-engine"
call :WriteRedirect "/audit" "/studio/audit"
call :WriteRedirect "/deployments" "/studio/bms/deployments"
goto :SkipRedirectFunc

:WriteRedirect
set "oldRoute=%~1"
set "newRoute=%~2"
set "dirPath=%PROJECT_ROOT%src\app%oldRoute:/=\%"
if not exist "%dirPath%" mkdir "%dirPath%"

echo // REDIRECT: %oldRoute% -^> %newRoute%> "%dirPath%\page.tsx"
echo // Legacy route - kept for backward compatibility.>> "%dirPath%\page.tsx"
echo // Remove this file after 30-day deprecation window.>> "%dirPath%\page.tsx"
echo import { redirect } from 'next/navigation';>> "%dirPath%\page.tsx"
echo.>> "%dirPath%\page.tsx"
echo export const dynamic = 'force-dynamic';>> "%dirPath%\page.tsx"
echo.>> "%dirPath%\page.tsx"
echo export default function LegacyRedirect() {>> "%dirPath%\page.tsx"
echo   redirect('%newRoute%');>> "%dirPath%\page.tsx"
echo }>> "%dirPath%\page.tsx"
echo   [REDIRECT] %oldRoute% -^> %newRoute%
exit /b
:SkipRedirectFunc
echo.

:: ============================================================
:: SECTION 6: Create Academy Canonical Route Directory
:: ============================================================
echo === SECTION 6: Academy Canonical Route Setup ===
if not exist "%PROJECT_ROOT%src\app\studio\bms\academy" (
    mkdir "%PROJECT_ROOT%src\app\studio\bms\academy"
    echo   [CREATED] src/app/studio/bms/academy/
)
echo.

:: ============================================================
:: SECTION 7: Shell.tsx Nav Patch
:: ============================================================
echo === SECTION 7: Shell.tsx Academy Nav Patch ===
if exist "%PROJECT_ROOT%src\components\Shell.tsx" (
    findstr /C:"studio/bms/academy" "%PROJECT_ROOT%src\components\Shell.tsx" >nul 2>&1
    if not errorlevel 1 (
        echo   [SKIP] Academy nav item already present in Shell.tsx
    ) else (
        :: Utilizing powershell inline here just for regex text replacement because native cmd lacks regex capabilities.
        powershell -NoProfile -Command "(Get-Content '%PROJECT_ROOT%src\components\Shell.tsx') -replace '(\{.*?href:\s*[''\""]/studio/bms/agentic[''\""].*?\})', \"`$1,`n    { href: '/studio/bms/academy', label: 'BMS Academy', icon: '◎', hint: 'Executive LMS and certifications' }\" | Set-Content '%PROJECT_ROOT%src\components\Shell.tsx' -Encoding UTF8"
        echo   [PATCHED] Shell.tsx - BMS Academy nav item added
    )
)
echo.

:: ============================================================
:: SECTION 8: docs/ Directory Setup
:: ============================================================
echo === SECTION 8: docs/ Directory Setup ===
if not exist "%PROJECT_ROOT%docs\adrs" mkdir "%PROJECT_ROOT%docs\adrs"

echo # BNLV Group - Architecture Decision Records> "%PROJECT_ROOT%docs\adrs\README.md"
echo.>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR ^| Title ^| Status ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^|-----^|-------^|--------^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-001 ^| Zero Trust Row-Level Security ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-002 ^| Migration Management Protocol ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-003 ^| Multi-Tenant Schema Architecture ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-004 ^| Financial Precision - BIGINT Paise ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-005 ^| RBAC Hierarchy and Role Definitions ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-006 ^| AI Model Routing - Anthropic-Only for Legal/Financial ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo ^| ADR-007 ^| DPDP Act 2023 Compliance Controls ^| Accepted ^|>> "%PROJECT_ROOT%docs\adrs\README.md"
echo.>> "%PROJECT_ROOT%docs\adrs\README.md"
echo See individual ADR-00X.md files for full decision records.>> "%PROJECT_ROOT%docs\adrs\README.md"
echo   [CREATED] docs/adrs/README.md

echo # BNLV Group - Platform Documentation> "%PROJECT_ROOT%docs\README.md"
echo.>> "%PROJECT_ROOT%docs\README.md"
echo ## Structure>> "%PROJECT_ROOT%docs\README.md"
echo - `adrs/` - Architecture Decision Records>> "%PROJECT_ROOT%docs\README.md"
echo - `api/` - API reference>> "%PROJECT_ROOT%docs\README.md"
echo - `runbooks/` - Operational runbooks>> "%PROJECT_ROOT%docs\README.md"
echo - `security/` - Security policies>> "%PROJECT_ROOT%docs\README.md"
echo.>> "%PROJECT_ROOT%docs\README.md"
echo ## Quick Reference>> "%PROJECT_ROOT%docs\README.md"
echo - Migrations: always via DATABASE_URL_UNPOOLED>> "%PROJECT_ROOT%docs\README.md"
echo - Financial values: BIGINT paise in DB>> "%PROJECT_ROOT%docs\README.md"
echo - AI routing: Anthropic-only for LIMSY/Nidhivan>> "%PROJECT_ROOT%docs\README.md"
echo - Tenant isolation: withTenant() wrapper mandatory>> "%PROJECT_ROOT%docs\README.md"
echo   [CREATED] docs/README.md
echo.

:: ============================================================
:: SECTION 9: Git Commit
:: ============================================================
echo === SECTION 9: Git Stage and Commit ===
git -C "%PROJECT_ROOT:~0,-1%" add -A

set "MSG_FILE=%TEMP%\bnlv_commit.txt"
echo chore(cleanup): enterprise go-live sprint - code hygiene and security> "%MSG_FILE%"
echo.>> "%MSG_FILE%"
echo SEC-001: remove credential files from tracking; block via .gitignore>> "%MSG_FILE%"
echo CODE-001: advisory - rename duplicate 0016a/0017a migrations (manual)>> "%MSG_FILE%"
echo CODE-002: remove src/db/migrations/ duplicate directory>> "%MSG_FILE%"
echo CODE-003: remove src/app/studio/nidhivan/layout.tsx nested layout conflict>> "%MSG_FILE%"
echo CODE-004: remove -p/ phantom directory>> "%MSG_FILE%"
echo ROUTES: add 22 legacy redirect stubs for backward compatibility>> "%MSG_FILE%"
echo SCRIPTS: fix 6 double-extension script filenames>> "%MSG_FILE%"
echo DOCS: scaffold docs/adrs/ directory with ADR index>> "%MSG_FILE%"
echo SHELL: patch BMS Academy nav item into Build group>> "%MSG_FILE%"
echo ROOT: remove 12 junk/context-dump files from project root>> "%MSG_FILE%"

git -C "%PROJECT_ROOT:~0,-1%" commit -F "%MSG_FILE%"
del "%MSG_FILE%"
echo   [COMMITTED] Enterprise cleanup committed
echo.

:: ============================================================
:: FINALE: Checklist
:: ============================================================
echo ============================================================
echo  BNLV Enterprise Go-Live - Remaining Manual Actions
echo ============================================================
echo.
echo  P0 - DO BEFORE git push:
echo   [ ] Rotate ALL secrets in Neon, Vercel, Stripe, etc.
echo   [ ] Apply 0019_final_platform_consolidation.sql in Neon
echo   [ ] Copy page stubs for academy, agentic, and limsy trial.
echo.
echo  PUSH COMMAND (after all P0 items cleared):
echo   git push origin main
echo.
echo ============================================================
pause