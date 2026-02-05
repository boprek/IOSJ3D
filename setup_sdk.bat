@echo off
echo =================================
echo Configurando Android SDK para J3D
echo =================================

REM Crear directorio del SDK
mkdir "C:\Android\Sdk" 2>nul
mkdir "C:\Android\Sdk\platforms" 2>nul
mkdir "C:\Android\Sdk\platform-tools" 2>nul
mkdir "C:\Android\Sdk\build-tools" 2>nul

REM Configurar local.properties
echo sdk.dir=C:\\Android\\Sdk > local.properties

REM Configurar variables de entorno
setx ANDROID_HOME "C:\Android\Sdk"
setx ANDROID_SDK_ROOT "C:\Android\Sdk"

echo.
echo SDK configurado en: C:\Android\Sdk
echo.
echo IMPORTANTE: 
echo 1. Abre Android Studio
echo 2. Ve a File > Settings > System Settings > Android SDK
echo 3. Instala Android SDK Platform 30 (API Level 30)
echo 4. Instala Android SDK Build-Tools 30.0.3
echo 5. Vuelve a ejecutar: gradlew assembleDebug
echo.
echo Presiona cualquier tecla para abrir Android Studio...
pause >nul

start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe"

echo.
echo Android Studio abierto. Configura el SDK y luego ejecuta:
echo gradlew assembleDebug