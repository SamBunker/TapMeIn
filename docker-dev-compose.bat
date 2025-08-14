@echo off
echo TapMeIn NFC - Docker Compose Development Environment
echo.

if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="shell" goto shell
if "%1"=="clean" goto clean
if "%1"=="rebuild" goto rebuild
goto help

:start
echo Starting TapMeIn development environment...
docker-compose up -d
echo.
echo ✅ Environment started!
echo 📱 Application: http://localhost:3000
echo 🍃 MongoDB: localhost:27017
echo 🔴 Redis: localhost:6379
echo.
echo Use 'docker-dev-compose logs' to view logs
goto end

:stop
echo Stopping TapMeIn development environment...
docker-compose down
echo ✅ Environment stopped!
goto end

:restart
echo Restarting TapMeIn development environment...
docker-compose restart
echo ✅ Environment restarted!
goto end

:logs
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto end

:shell
echo Entering application shell...
docker-compose exec app bash
goto end

:clean
echo Cleaning up TapMeIn environment...
docker-compose down -v
docker-compose down --rmi local
echo ✅ Environment cleaned!
goto end

:rebuild
echo Rebuilding TapMeIn environment...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo ✅ Environment rebuilt!
goto end

:help
echo Usage: docker-dev-compose [command]
echo.
echo Commands:
echo   start     Start the development environment
echo   stop      Stop the development environment  
echo   restart   Restart all services
echo   logs      View logs (optional: specify service name)
echo   shell     Enter the application shell
echo   clean     Clean up containers and volumes
echo   rebuild   Rebuild and restart everything
echo.
echo Examples:
echo   docker-dev-compose start
echo   docker-dev-compose logs app
echo   docker-dev-compose shell

:end