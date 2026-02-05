# Configuración del Servidor Web para Dashboard Móvil

## Configuración del Servidor C++

Para que tu dashboard funcione correctamente en dispositivos móviles, tu servidor C++ debe servir archivos estáticos correctamente. Aquí están las configuraciones necesarias:

### 1. Headers HTTP Requeridos

Tu servidor debe incluir estos headers en las respuestas:

```cpp
// Headers para archivos HTML
"Content-Type: text/html; charset=utf-8"
"Cache-Control: no-cache, no-store, must-revalidate"
"Pragma: no-cache"
"Expires: 0"

// Headers para archivos CSS
"Content-Type: text/css; charset=utf-8"
"Cache-Control: public, max-age=3600"

// Headers para archivos JavaScript
"Content-Type: application/javascript; charset=utf-8"
"Cache-Control: public, max-age=3600"

// Headers para imágenes PNG
"Content-Type: image/png"
"Cache-Control: public, max-age=86400"

// Headers para permitir acceso desde otros dispositivos
"Access-Control-Allow-Origin: *"
"Access-Control-Allow-Methods: GET, POST, OPTIONS"
"Access-Control-Allow-Headers: Content-Type"
```

### 2. Configuración de Red

1. **Puerto**: Tu servidor ya está en el puerto 8192 ✓
2. **IP**: Debe escuchar en todas las interfaces (0.0.0.0:8192) no solo localhost
3. **Firewall**: Asegurar que el puerto 8192 esté abierto en Windows

```bash
# Comando PowerShell para abrir puerto en firewall de Windows
New-NetFirewallRule -DisplayName "J3D Dashboard" -Direction Inbound -Protocol TCP -LocalPort 8192 -Action Allow
```

### 3. Tipos MIME Requeridos

Tu servidor debe reconocer estos tipos de archivo:

```cpp
std::map<std::string, std::string> mimeTypes = {
    {".html", "text/html; charset=utf-8"},
    {".css", "text/css; charset=utf-8"},
    {".js", "application/javascript; charset=utf-8"},
    {".png", "image/png"},
    {".jpg", "image/jpeg"},
    {".gif", "image/gif"},
    {".ico", "image/x-icon"},
    {".ttf", "font/ttf"},
    {".woff", "font/woff"},
    {".woff2", "font/woff2"}
};
```

### 4. Estructura de Archivos

Asegurar que tu servidor sirva archivos desde el directorio Dashboard:

```
/Dashboard/
├── J3DDashBoard.html (archivo principal)
├── css/
│   ├── Dashboard_estilo.css
│   └── mobile.css
├── js/
│   ├── Dashboard.js
│   └── util.js
├── images/
│   └── (todas las imágenes)
└── Apps/
    └── (aplicaciones)
```

### 5. WebSocket para Móviles

Tu WebSocket ya está configurado, pero asegurar:

```javascript
// En Dashboard.js, cambiar localhost por IP real del servidor
var ip_server = "192.168.1.XXX:8192"; // Usar IP real de tu servidor
```

## Cómo Encontrar la IP del Servidor

En PowerShell ejecutar:
```powershell
ipconfig | findstr "IPv4"
```

## Testing desde Android

1. Conectar el dispositivo Android a la misma red WiFi
2. Abrir navegador (Chrome recomendado)
3. Navegar a: `http://IP_DEL_SERVIDOR:8192/Dashboard/J3DDashBoard.html`

Ejemplo: `http://192.168.1.100:8192/Dashboard/J3DDashBoard.html`