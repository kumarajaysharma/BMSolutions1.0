@echo off
setlocal enabledelayedexpansion

echo [1/3] Logging in and capturing cookies...
curl -k -X POST "https://YOUR_ACTUAL_API_URL/v1/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"YOUR_USERNAME\", \"password\": \"YOUR_PASSWORD\"}" ^
  -c cookies.txt

if not exist cookies.txt (
    echo [Error] cookies.txt was not created. Login may have failed.
    pause
    exit /b 1
)

echo [2/3] Extracting tokens from cookies.txt...
for /f "tokens=6,7" %%i in (cookies.txt) do (
    if "%%i"=="LIMSY_TOKEN" set "LIMSY_TOKEN=%%j"
    if "%%i"=="DEV_TOKEN" set "DEV_TOKEN=%%j"
    if "%%i"=="BMS_TOKEN" set "BMS_TOKEN=%%j"
)

echo.
echo Tokens extracted successfully.
echo ----------------------------------------

echo [3/3] Running test battery...
curl -k -X GET "https://YOUR_ACTUAL_API_URL/v1/test-battery/run" ^
  -b "LIMSY_TOKEN=%LIMSY_TOKEN%; DEV_TOKEN=%DEV_TOKEN%; BMS_TOKEN=%BMS_TOKEN%" ^
  -H "Accept: application/json"

echo.
echo ----------------------------------------
echo Test battery execution completed.
endlocal
pause