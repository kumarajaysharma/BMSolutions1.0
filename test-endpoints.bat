@echo off
setlocal

set /p ARCH="Paste LIMSY_TOKEN (architect): "
set /p DEV="Paste DEV_TOKEN (developer): "

echo [ZT-001] Testing bnlvconsulting.com redirect...
curl -I "https://www.bnlvconsulting.com"

echo [ZT-004] Testing unauthorized cases endpoint...
curl -I "https://bms.bnlvconsulting.com/api/limsy/cases"

echo [DV-001-bms] Testing BMS domain...
curl -I "https://bms.bnlvconsulting.com"

echo Done.
endlocal
pause