@echo off
title Lavalink Server
color 0B
echo.
echo ========================================================
echo    LAVALINK v4 SERVER
echo ========================================================
echo.
echo [CONFIG] Host: 127.0.0.1
echo [CONFIG] Port: 2333
echo [CONFIG] Password: youshallnotpass
echo.

REM Check for Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Java not found!
    echo [INFO] Please install Java 17 or higher from https://adoptium.net/
    echo.
    pause
    exit /b 1
)

REM Get Java version
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    echo [INFO] Java Version: %%g
)

echo.
echo [STATUS] Starting Lavalink...
echo [INFO] Press Ctrl+C to stop
echo ========================================================
echo.

REM Start Lavalink with proper memory settings
java -Xmx1G -jar Lavalink_v4.jar

echo.
echo [INFO] Lavalink server stopped
pause
