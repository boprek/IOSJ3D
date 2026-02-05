// J3DWebSocket.js
// ------------------------------------------------------------
// WebSocket Singleton con:
//  - Reconexión automática
//  - Router basado en "info"
//  - Handlers por tipo
//  - Envío con ID automático (BigInt)
//  - Mensaje visual "Intentando reconectar"
//  - Compatible con tu servidor actual
// ------------------------------------------------------------
//import * as UIController from "../ui/UIController.js";
let socket = null;
let reconnectTimer = null;
let reconnectInterval = 3000;  // ms
let serverUrl = null;
let idDash = 0n; // ID auto incrementado

// Tipos permitidos
const allowedTypes = new Set();
const handlers = new Map();

/* ------------------------------------------------------------
   Registrar un tipo
------------------------------------------------------------ */
function defineType(typeName) {
    if (!handlers.has(typeName)) {
        handlers.set(typeName, []);
    }
    allowedTypes.add(typeName);
}

/* ------------------------------------------------------------
   Registrar handler
------------------------------------------------------------ */
function on(typeName, callback) {
    if (!allowedTypes.has(typeName)) {
        throw new Error(`[WS] El tipo '${typeName}' no está registrado.`);
    }
    handlers.get(typeName).push(callback);
}

/* ------------------------------------------------------------
   Enviar mensaje
------------------------------------------------------------ */
function send(req) {
    if (!req.info) {
        throw new Error("[WS] Todo mensaje enviado debe incluir 'info'");
    }

    const json = {
        id: idDash.toString(),
        ...req
    };

    idDash = (idDash + 1n) & 0xFFFFFFFFn;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("[WS] No conectado. No puedo enviar.");
        return -1;
    }

    socket.send(JSON.stringify(json));
    return 0;
}

/* ------------------------------------------------------------
   Procesar mensaje recibido
------------------------------------------------------------ */
function processIncoming(rawMsg) {
    let response;
    try {
        response = JSON.parse(rawMsg);
    } catch {
        console.warn("[WS] Mensaje recibido no es JSON.");
        return;
    }

    let data;
    try {
        data = JSON.parse(DecodeResponse(response.data));
    } catch {
        console.warn("[WS] Error decodificando data del servidor.");
        return;
    }

    const type = data.info;

    if (!allowedTypes.has(type)) {
        console.warn("[WS] Tipo no permitido:", type);
        return;
    }

    // Ejecutar handlers
    for (const cb of handlers.get(type)) {
        cb(data);
    }
}

/* ------------------------------------------------------------
   Conexión
------------------------------------------------------------ */
function connect(url) {

    if (url) {
        serverUrl = "ws://" + url;
    }

    if (!serverUrl) {
        throw new Error("[WS] No se ha especificado servidor");
    }

    // Evitar duplicar conexiones
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        console.warn("[WS] Ya existe un WebSocket activo.");
        return socket;
    }

    console.log("[WS] Conectando a", serverUrl);
    socket = new WebSocket(serverUrl);
    
    socket.onopen = () => {
        console.log("[WS] Conectado a ", serverUrl);
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
	if (window.isLoggedIn == true){
		//UIController.showUI();
		}
			
    };

    socket.onmessage = evt => processIncoming(evt.data);

    socket.onerror = err => {
        console.error("[WS] Error:", err);

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };


    socket.onclose = () => {
        console.warn("[WS] Desconectado. Intentando reconectar... ");
        attemptReconnect();
    };

    return socket;
}


/* ------------------------------------------------------------
   Reintento automático con mensaje visual
------------------------------------------------------------ */
function attemptReconnect() {
    // SIEMPRE limpia el timer viejo antes de poner uno nuevo
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    PrintMessage(
        "Intentando reconectar...",
        "#e92d3a",
        2500
    );

    reconnectTimer = setTimeout(() => {
        console.log("[WS] Reintentando conexión...");
        connect(); 
    }, reconnectInterval);
}


/* ------------------------------------------------------------
   Desconexión manual
------------------------------------------------------------ */
function disconnect() {
    if (socket) {
        console.log("[WS] Desconectando manualmente...");
        socket.close();
    }
}

/* ------------------------------------------------------------
   Ajustar tiempo de reconexión
------------------------------------------------------------ */
function setReconnect(ms) {
    reconnectInterval = ms;
}


function getServerUrl() {
    return serverUrl;
}

function getIdDash() {
    return idDash;
}


export default {
    defineType,
    on,
    send,
    connect,
    disconnect,
    setReconnect,
    getServerUrl,
    getIdDash
};
