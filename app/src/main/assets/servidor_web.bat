@echo off
echo ===========================================
echo    J3D Dashboard - Servidor Web Mobile
echo ===========================================
echo.

REM Obtener la IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)
:found

echo Tu IP local es: %LOCAL_IP%
echo.
echo El dashboard estará disponible en:
echo   http://%LOCAL_IP%:8081/J3DDashBoard.html
echo.
echo Para acceder desde móviles Android:
echo   1. Conecta el móvil a la misma red WiFi
echo   2. Abre Chrome y navega a: http://%LOCAL_IP%:8080/J3DDashBoard.html
echo   3. El sistema se conectará automáticamente al servidor C++ en puerto 8192
echo.
echo Presiona Ctrl+C para detener el servidor
echo ===========================================

REM Cambiar al directorio del dashboard
cd /d "%~dp0"

REM Iniciar servidor Python simple
python -m http.server 8081 2>nul || (
    python3 -m http.server 8081 2>nul || (
        powershell -Command "& {Import-Module WebAdministration; New-WebApplication -Name 'J3DDashboard' -Site 'Default Web Site' -PhysicalPath '%CD%' -ApplicationPool 'DefaultAppPool'}" 2>nul || (
            echo ERROR: No se encontró Python instalado.
            echo.
            echo SOLUCIONES:
            echo 1. Instalar Python desde python.org
            echo 2. O usar el archivo "servidor_nodejs.bat" si tienes Node.js
            echo 3. O configurar IIS/Apache manualmente
            pause
            exit /b 1
        )
    )
)