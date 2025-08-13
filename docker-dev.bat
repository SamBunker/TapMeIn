@echo off
REM TapMeIn Docker Development Helper Script
REM This script provides easy commands for Docker-based development

if "%1"=="start" goto start
if "%1"=="dev" goto dev
if "%1"=="test" goto test
if "%1"=="install" goto install
if "%1"=="clean" goto clean
if "%1"=="logs" goto logs
if "%1"=="shell" goto shell
goto help

:start
echo Starting TapMeIn development environment...
docker run -v "D:/Development Projects/TapMeIn/:/app" -w /app -p 3000:3000 node:18-slim bash -c "npm install && node app.js"
goto end

:dev
echo Starting persistent development container...
docker run -d --name tapmeIn-dev -v "D:/Development Projects/TapMeIn/:/app" -w /app -p 3000:3000 node:18-slim tail -f /dev/null
echo Container started. Use 'docker-dev shell' to enter interactive mode.
goto end

:test
echo Running tests in container...
docker run --rm -v "D:/Development Projects/TapMeIn/:/app" -w /app node:18-slim npm test
goto end

:install
echo Installing dependencies in container...
docker run --rm -v "D:/Development Projects/TapMeIn/:/app" -w /app node:18-slim npm install
goto end

:clean
echo Stopping and removing development container...
docker stop tapmeIn-dev 2>nul
docker rm tapmeIn-dev 2>nul
echo Cleanup complete.
goto end

:logs
echo Showing container logs...
docker logs tapmeIn-dev
goto end

:shell
echo Entering interactive shell...
docker exec -it tapmeIn-dev bash
goto end

:help
echo TapMeIn Docker Development Helper
echo.
echo Usage: docker-dev [command]
echo.
echo Commands:
echo   start    - Start development environment (one-time run)
echo   dev      - Start persistent development container
echo   test     - Run tests in container
echo   install  - Install npm dependencies
echo   shell    - Enter interactive shell (requires 'dev' first)
echo   logs     - Show container logs
echo   clean    - Stop and remove development container
echo.
echo Examples:
echo   docker-dev start     (Start development server)
echo   docker-dev dev       (Start persistent container)
echo   docker-dev shell     (Enter container shell)
echo   docker-dev test      (Run tests)
echo   docker-dev clean     (Cleanup)
echo.

:end