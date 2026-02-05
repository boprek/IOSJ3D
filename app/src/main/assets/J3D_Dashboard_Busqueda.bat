@echo off
REM J3D Dashboard - Modo Búsqueda Directo
title J3D Dashboard - Busqueda

echo.
echo ========================================
echo    J3D DASHBOARD - MODO BUSQUEDA
echo ========================================
echo.
echo 🔍 Iniciando modo búsqueda directamente...
echo 📱 Optimizado para TC22 horizontal
echo 🌐 Conectando a: http://172.25.16.63:8081
echo.

REM Buscar Chrome
set BROWSER=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else (
    set BROWSER=start
)

REM Abrir con parámetros específicos para modo búsqueda
echo Abriendo dashboard en modo búsqueda...
if "%BROWSER%"=="start" (
    start "J3D Dashboard" http://172.25.16.63:8081/J3DDashBoard.html#search
) else (
    %BROWSER% --new-window --disable-web-security --start-fullscreen http://172.25.16.63:8081/J3DDashBoard.html#search
)

echo.
echo ✅ Dashboard iniciado en modo búsqueda!
echo 💡 Selecciona modo búsqueda (2) después del login
echo.
timeout /t 5 /nobreak >nul