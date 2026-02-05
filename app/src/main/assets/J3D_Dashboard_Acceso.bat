@echo off
REM Acceso directo al J3D Dashboard con icono personalizado
REM Ejecutar en TC22 para abrir dashboard web
title J3D Dashboard - Iniciando...

echo.
echo ========================================
echo        J3D DASHBOARD LAUNCHER
echo ========================================
echo.
echo 🚀 Iniciando J3D Dashboard...
echo 🎨 Icono: Dashboard.ico
echo 🌐 URL: http://172.25.16.63:8081
echo 📱 Optimizado para TC22
echo.

REM Buscar Chrome o Edge o Firefox
set BROWSER=""

REM Intentar con Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
    goto :OPEN
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    goto :OPEN
)

REM Intentar con Edge
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    goto :OPEN
)

REM Usar navegador por defecto
set BROWSER=start

:OPEN
echo Abriendo navegador...
if "%BROWSER%"=="start" (
    start http://172.25.16.63:8081
) else (
    %BROWSER% --kiosk --disable-web-security --disable-features=TranslateUI --start-fullscreen http://172.25.16.63:8081
)

echo J3D Dashboard iniciado!
timeout /t 3 /nobreak >nul