@echo off
REM Script para crear accesos directos con icono Dashboard.ico
title J3D Dashboard - Creador de accesos directos

echo.
echo ========================================
echo   J3D DASHBOARD - CREADOR DE ICONOS
echo ========================================
echo.
echo 🎨 Usando icono: Dashboard.ico
echo 📍 Ubicación: C:\J3D\Dashboard\Dashboard.ico
echo 🖥️ Creando accesos directos en el escritorio...
echo.

REM Crear acceso directo usando PowerShell
powershell -ExecutionPolicy Bypass -Command ^
"$WshShell = New-Object -comObject WScript.Shell; ^
$Desktop = [Environment]::GetFolderPath('Desktop'); ^
$Shortcut = $WshShell.CreateShortcut('$Desktop\J3D Dashboard.lnk'); ^
$Shortcut.TargetPath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; ^
$Shortcut.Arguments = '--kiosk --disable-web-security --start-fullscreen http://172.25.16.63:8081'; ^
$Shortcut.WorkingDirectory = 'C:\J3D\Dashboard'; ^
$Shortcut.IconLocation = 'C:\J3D\Dashboard\Dashboard.ico'; ^
$Shortcut.Description = 'J3D Dashboard - Industrial Interface'; ^
$Shortcut.Save(); ^
Write-Host '✅ Acceso directo principal creado' -ForegroundColor Green"

REM Crear acceso directo para búsqueda
powershell -ExecutionPolicy Bypass -Command ^
"$WshShell = New-Object -comObject WScript.Shell; ^
$Desktop = [Environment]::GetFolderPath('Desktop'); ^
$Shortcut = $WshShell.CreateShortcut('$Desktop\J3D Dashboard - Búsqueda.lnk'); ^
$Shortcut.TargetPath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; ^
$Shortcut.Arguments = '--kiosk --disable-web-security --start-fullscreen http://172.25.16.63:8081/J3DDashBoard.html#search'; ^
$Shortcut.WorkingDirectory = 'C:\J3D\Dashboard'; ^
$Shortcut.IconLocation = 'C:\J3D\Dashboard\Dashboard.ico'; ^
$Shortcut.Description = 'J3D Dashboard - Modo Búsqueda Directo'; ^
$Shortcut.Save(); ^
Write-Host '✅ Acceso directo búsqueda creado' -ForegroundColor Green"

echo.
echo ✅ ACCESOS DIRECTOS CREADOS CON ÉXITO!
echo.
echo 📋 Se han creado en el escritorio:
echo    📌 J3D Dashboard.lnk
echo    🔍 J3D Dashboard - Búsqueda.lnk
echo.
echo 🎨 Ambos usan el icono: Dashboard.ico
echo 📱 Optimizados para TC22 en modo horizontal
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo 🚀 ¡Listo! Ya puedes usar los accesos directos.
echo.
timeout /t 3 /nobreak >nul