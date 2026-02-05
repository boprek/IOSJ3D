@echo off
echo ===========================================
echo    J3D Dashboard - Servidor Node.js
echo ===========================================

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    echo Descarga Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

REM Obtener IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)
:found

echo Tu IP local es: %LOCAL_IP%
echo Dashboard disponible en: http://%LOCAL_IP%:8080/J3DDashBoard.html
echo.

REM Cambiar al directorio del dashboard
cd /d "%~dp0"

REM Crear servidor simple si no existe
if not exist server.js (
    echo Creando servidor Node.js...
    echo const express = require('express'^); > server.js
    echo const path = require('path'^); >> server.js
    echo const app = express('^); >> server.js
    echo const PORT = 8080; >> server.js
    echo. >> server.js
    echo app.use(express.static(__dirname'^)'^); >> server.js
    echo. >> server.js
    echo app.get('/', (req, res^) =^> { >> server.js
    echo   res.sendFile(path.join(__dirname, 'J3DDashBoard.html'^)'^); >> server.js
    echo }^); >> server.js
    echo. >> server.js
    echo app.listen(PORT, '0.0.0.0', ('^) =^> { >> server.js
    echo   console.log(`Servidor corriendo en http://${LOCAL_IP}:${PORT}`^); >> server.js
    echo }^); >> server.js
)

REM Instalar express si no existe
if not exist node_modules (
    echo Instalando dependencias...
    npm init -y >nul 2>&1
    npm install express >nul 2>&1
)

REM Iniciar servidor
echo Iniciando servidor...
node server.js