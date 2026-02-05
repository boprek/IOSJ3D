# J3D Dashboard Launcher
# Script para abrir el dashboard web en TC22

param(
    [string]$URL = "http://172.25.16.63:8081",
    [switch]$FullScreen = $true
)

Write-Host "🚀 J3D Dashboard Launcher" -ForegroundColor Green
Write-Host "📱 Configurado para TC22" -ForegroundColor Yellow
Write-Host "🌐 Conectando a: $URL" -ForegroundColor Cyan

# Verificar conectividad
Write-Host "🔍 Verificando conectividad..."
try {
    $ping = Test-NetConnection -ComputerName "172.25.16.63" -Port 8081 -WarningAction SilentlyContinue
    if ($ping.TcpTestSucceeded) {
        Write-Host "✅ Servidor accesible" -ForegroundColor Green
    } else {
        Write-Host "❌ No se puede conectar al servidor" -ForegroundColor Red
        Write-Host "📝 Verifique que el servidor esté ejecutándose" -ForegroundColor Yellow
        pause
        exit 1
    }
} catch {
    Write-Host "⚠️ No se pudo verificar la conectividad" -ForegroundColor Yellow
}

# Buscar navegadores disponibles
$browsers = @()

$chromePath = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
)

$edgePath = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)

foreach ($path in $chromePath) {
    if (Test-Path $path) {
        $browsers += @{Name="Chrome"; Path=$path; Args="--kiosk --disable-web-security --start-fullscreen"}
        break
    }
}

foreach ($path in $edgePath) {
    if (Test-Path $path) {
        $browsers += @{Name="Edge"; Path=$path; Args="--kiosk --disable-web-security --start-fullscreen"}
        break
    }
}

if ($browsers.Count -eq 0) {
    Write-Host "🌐 Usando navegador por defecto" -ForegroundColor Yellow
    Start-Process $URL
} else {
    $browser = $browsers[0]
    Write-Host "🚀 Abriendo con $($browser.Name)..." -ForegroundColor Green
    
    if ($FullScreen) {
        Start-Process -FilePath $browser.Path -ArgumentList "$($browser.Args) $URL"
    } else {
        Start-Process -FilePath $browser.Path -ArgumentList $URL
    }
}

Write-Host "✅ J3D Dashboard iniciado!" -ForegroundColor Green
Write-Host "📱 Optimizado para TC22 en modo horizontal" -ForegroundColor Cyan

# Esperar un poco antes de cerrar
Start-Sleep -Seconds 3