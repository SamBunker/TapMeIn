@echo off
echo Testing TapMeIn API...
echo ==========================

REM Test registration
echo.
echo 1. Registering new user...
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"testuser@example.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"

echo.
echo.
echo 2. Login as admin to get token...
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@tapmeinnfc.com\",\"password\":\"admin123\"}"

echo.
echo.
echo NOTE: Copy the accessToken from above and use it to activate a card:
echo.
echo curl -X POST http://localhost:3000/api/cards/activate -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"activationCode\":\"ACTIVATE1\"}"
echo.
echo Then test the tap endpoint:
echo curl http://localhost:3000/tap/TEST0001
echo.