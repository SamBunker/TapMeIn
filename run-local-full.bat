@echo off
echo ========================================
echo TapMeIn - Full Local Stack (App + DB)
echo ========================================
echo.
echo Starting local development stack...
echo This includes MongoDB, Redis, and the app
echo.

docker-compose -f docker-compose.local.yml up

echo.
echo Stack stopped.
pause
