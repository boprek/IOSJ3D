@echo off
echo =================================
echo J3D Android APK Builder
echo =================================

REM Configurar variables de entorno
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%

echo Configurando proyecto Android...

REM Crear directorios necesarios si no existen
if not exist "app\src\main\res\mipmap-mdpi" mkdir "app\src\main\res\mipmap-mdpi"
if not exist "app\src\main\res\mipmap-hdpi" mkdir "app\src\main\res\mipmap-hdpi"
if not exist "app\src\main\res\mipmap-xhdpi" mkdir "app\src\main\res\mipmap-xhdpi"
if not exist "app\src\main\res\mipmap-xxhdpi" mkdir "app\src\main\res\mipmap-xxhdpi"
if not exist "app\src\main\res\mipmap-xxxhdpi" mkdir "app\src\main\res\mipmap-xxxhdpi"

REM Copiar iconos a todas las resoluciones
copy "app\src\main\res\mipmap-hdpi\ic_launcher.png" "app\src\main\res\mipmap-mdpi\ic_launcher.png" >nul 2>&1
copy "app\src\main\res\mipmap-hdpi\ic_launcher.png" "app\src\main\res\mipmap-xhdpi\ic_launcher.png" >nul 2>&1
copy "app\src\main\res\mipmap-hdpi\ic_launcher.png" "app\src\main\res\mipmap-xxhdpi\ic_launcher.png" >nul 2>&1
copy "app\src\main\res\mipmap-hdpi\ic_launcher.png" "app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" >nul 2>&1

echo Archivos del proyecto preparados.
echo.
echo INSTRUCCIONES:
echo 1. Android Studio se esta abriendo automaticamente
echo 2. Cuando Android Studio abra:
echo    - Acepta instalar componentes faltantes del SDK
echo    - Ve a Build > Build Bundle(s) / APK(s) > Build APK(s)
echo    - La APK se generara en: app/build/outputs/apk/debug/
echo.
echo 3. Copia la APK generada a tu TC22 e instalala
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo =================================
echo APK LISTA PARA USAR:
echo =================================
echo La APK contiene:
echo - Dashboard completo integrado
echo - Conexion WebSocket nativa
echo - Interfaz optimizada para movil
echo - Todas las aplicaciones J3D incluidas
echo.
echo IP por defecto: 10.240.25.2:8192
echo Usuario: admin / Contraseña: admin
echo =================================