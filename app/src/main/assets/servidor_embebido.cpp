/*
 * MINI SERVIDOR WEB EMBEBIDO PARA C++
 * Agrega esta funcionalidad a tu aplicación C++ existente
 * para servir archivos estáticos del dashboard desde el mismo puerto 8192
 */

#include <string>
#include <map>
#include <fstream>
#include <filesystem>

class J3DWebServer {
private:
    std::string dashboardPath;
    std::map<std::string, std::string> mimeTypes;
    
public:
    J3DWebServer(const std::string& path) : dashboardPath(path) {
        // MIME types para diferentes archivos
        mimeTypes[".html"] = "text/html; charset=utf-8";
        mimeTypes[".css"] = "text/css; charset=utf-8";
        mimeTypes[".js"] = "application/javascript; charset=utf-8";
        mimeTypes[".png"] = "image/png";
        mimeTypes[".jpg"] = "image/jpeg";
        mimeTypes[".gif"] = "image/gif";
        mimeTypes[".ico"] = "image/x-icon";
        mimeTypes[".ttf"] = "font/ttf";
        mimeTypes[".woff"] = "font/woff";
        mimeTypes[".woff2"] = "font/woff2";
        mimeTypes[".json"] = "application/json";
    }
    
    // Función para manejar peticiones HTTP GET
    std::string handleHTTPRequest(const std::string& request) {
        std::string method, path, version;
        std::istringstream iss(request);
        iss >> method >> path >> version;
        
        if (method != "GET") {
            return createHTTPResponse(405, "Method Not Allowed", "text/plain", "Method Not Allowed");
        }
        
        // Ruta por defecto
        if (path == "/" || path == "/dashboard") {
            path = "/J3DDashBoard.html";
        }
        
        // Construir ruta completa del archivo
        std::string filePath = dashboardPath + path;
        
        // Verificar si el archivo existe
        if (!std::filesystem::exists(filePath)) {
            return createHTTPResponse(404, "Not Found", "text/html", 
                "<html><body><h1>404 - Archivo no encontrado</h1><p>Dashboard no disponible</p></body></html>");
        }
        
        // Leer archivo
        std::ifstream file(filePath, std::ios::binary);
        if (!file.is_open()) {
            return createHTTPResponse(500, "Internal Server Error", "text/plain", "Error al leer archivo");
        }
        
        std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        file.close();
        
        // Obtener tipo MIME
        std::string extension = std::filesystem::path(filePath).extension().string();
        std::string mimeType = mimeTypes.count(extension) ? mimeTypes[extension] : "application/octet-stream";
        
        return createHTTPResponse(200, "OK", mimeType, content);
    }
    
private:
    std::string createHTTPResponse(int statusCode, const std::string& statusText, 
                                 const std::string& contentType, const std::string& content) {
        std::ostringstream response;
        response << "HTTP/1.1 " << statusCode << " " << statusText << "\r\n";
        response << "Content-Type: " << contentType << "\r\n";
        response << "Content-Length: " << content.length() << "\r\n";
        response << "Access-Control-Allow-Origin: *\r\n";
        response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
        response << "Access-Control-Allow-Headers: Content-Type\r\n";
        response << "Cache-Control: no-cache, no-store, must-revalidate\r\n";
        response << "Connection: close\r\n";
        response << "\r\n";
        response << content;
        
        return response.str();
    }
};

/*
 * INTEGRACIÓN CON TU SERVIDOR EXISTENTE
 * 
 * 1. En tu función principal de manejo de conexiones:
 */

void handleClientConnection(int clientSocket) {
    char buffer[4096];
    int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    
    if (bytesReceived > 0) {
        buffer[bytesReceived] = '\0';
        std::string request(buffer);
        
        // Detectar si es una petición HTTP (no WebSocket)
        if (request.find("GET ") == 0 && request.find("Upgrade: websocket") == std::string::npos) {
            // Es una petición HTTP para archivos estáticos
            J3DWebServer webServer("C:\\J3D\\Dashboard"); // Ruta a tu dashboard
            std::string response = webServer.handleHTTPRequest(request);
            
            send(clientSocket, response.c_str(), response.length(), 0);
            closesocket(clientSocket);
            return;
        }
        
        // Si no es HTTP, manejar como WebSocket (tu código existente)
        handleWebSocketConnection(clientSocket, request);
    }
}

/*
 * 2. VENTAJAS DE ESTE ENFOQUE:
 * 
 * ✅ Un solo puerto (8192) para todo
 * ✅ No necesitas servidores adicionales
 * ✅ Más fácil configuración para clientes
 * ✅ Menor superficie de ataque
 * ✅ Dashboard y datos en el mismo lugar
 * 
 * 3. CONFIGURACIÓN RECOMENDADA:
 * 
 * - Puerto 8192: WebSocket + HTTP estático
 * - Acceso móvil: http://IP_SERVIDOR:8192/
 * - WebSocket: ws://IP_SERVIDOR:8192/websocket
 * 
 * 4. COMPILACIÓN:
 * 
 * Agregar a tu CMakeLists.txt o Makefile:
 * - std::filesystem (C++17)
 * - Winsock2 (Windows) o sys/socket.h (Linux)
 */