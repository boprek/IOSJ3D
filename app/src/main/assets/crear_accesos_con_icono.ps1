# Script para crear acceso directo con icono personalizado
# Cambiar la ruta del icono por la ubicación de tu archivo .ico

param(
    [string]$IconoPath = "C:\J3D\Dashboard\Dashboard.ico",
    [string]$DesktopPath = [Environment]::GetFolderPath("Desktop")
)

Write-Host "🎨 Creando acceso directo con icono personalizado..." -ForegroundColor Green

# Crear objeto COM para accesos directos
$WshShell = New-Object -comObject WScript.Shell

# Crear acceso directo principal
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\J3D Dashboard.lnk")
$Shortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut.Arguments = "--kiosk --disable-web-security --start-fullscreen http://172.25.16.63:8081"
$Shortcut.WorkingDirectory = "C:\J3D\Dashboard"
$Shortcut.IconLocation = $IconoPath
$Shortcut.Description = "J3D Dashboard - Acceso directo con icono personalizado"
$Shortcut.Save()

Write-Host "✅ Acceso directo creado: $DesktopPath\J3D Dashboard.lnk" -ForegroundColor Green

# Crear acceso directo para modo búsqueda
$ShortcutSearch = $WshShell.CreateShortcut("$DesktopPath\J3D Dashboard - Búsqueda.lnk")
$ShortcutSearch.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$ShortcutSearch.Arguments = "--kiosk --disable-web-security --start-fullscreen http://172.25.16.63:8081/J3DDashBoard.html#search"
$ShortcutSearch.WorkingDirectory = "C:\J3D\Dashboard"
$ShortcutSearch.IconLocation = $IconoPath
$ShortcutSearch.Description = "J3D Dashboard - Modo Búsqueda Directo"
$ShortcutSearch.Save()

Write-Host "✅ Acceso directo búsqueda creado: $DesktopPath\J3D Dashboard - Búsqueda.lnk" -ForegroundColor Green

Write-Host "`n🎯 Instrucciones:" -ForegroundColor Yellow
Write-Host "1. Cambia la ruta del icono en este script" -ForegroundColor White
Write-Host "2. Ejecuta: .\crear_accesos_con_icono.ps1 -IconoPath 'C:\ruta\a\tu\icono.ico'" -ForegroundColor White
Write-Host "3. Los accesos directos aparecerán en el escritorio con tu icono" -ForegroundColor White

# Mostrar información del icono
if (Test-Path $IconoPath) {
    Write-Host "✅ Icono encontrado: $IconoPath" -ForegroundColor Green
} else {
    Write-Host "⚠️ Icono no encontrado en: $IconoPath" -ForegroundColor Yellow
    Write-Host "📝 Cambia la ruta del icono y vuelve a ejecutar" -ForegroundColor Yellow
}