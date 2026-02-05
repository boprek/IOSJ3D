export const config = {
    version: null,
    ipServer: null,
    uiEditorEnabled: false,
    lang: "en",
    // Factor opcional para ampliar el contenido de los UI en el iframe
    // Útil si el HTML natural mide mucho y se ve "pequeño" tras autoescalar
    uiScaleBoost: 1,
};


export async function loadConfig() {
    const ruta = "Dash.cfg";

    async function parseText(txt){
        const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const raw of lines) {
            // remove comment-only lines and inline comments (# or ;)
            if (/^\s*[#;]/.test(raw)) continue;
            const eq = raw.indexOf('=');
            if (eq === -1) continue;
            const k = raw.slice(0, eq).trim().toLowerCase();
            const v = raw.slice(eq + 1).trim();
            if (k === 'version') config.version = v;
            if (k === 'ip_server') config.ipServer = v;
            if (k === 'uieditor') config.uiEditorEnabled = (v === '1');
            if (k === 'lang') config.lang = v || 'en';
        }
        console.log("[Config] Cargado Dash.cfg:", config);
        return true;
    }

    const isFile = typeof location !== 'undefined' && location.protocol === 'file:';

    // 1) Usar XHR directamente si estamos en file:// para evitar el error ruidoso de fetch
    if (isFile) {
        try {
            const txt = await new Promise((resolve, reject)=>{
                const xhr = new XMLHttpRequest();
                xhr.open('GET', ruta, true);
                xhr.onreadystatechange = function(){
                    if (xhr.readyState === 4){
                        if (xhr.status === 200 || xhr.status === 0){
                            resolve(xhr.responseText||'');
                        } else {
                            reject(new Error('XHR status '+xhr.status));
                        }
                    }
                };
                xhr.onerror = ()=>reject(new Error('XHR error'));
                xhr.send();
            });
            if (txt && txt.length) return parseText(txt);
        } catch(e) {
            console.warn("[Config] XHR(file) falló", e);
        }
    } else {
        // 1b) Intento con fetch en entornos http(s)
        try {
            const response = await fetch(ruta);
            if (response && (response.ok || response.status === 0)) {
                const txt = await response.text();
                if (txt && txt.length) return parseText(txt);
            }
        } catch(e) {
            // Silenciar error: probaremos XHR
        }
    }

    // 2) Intento XHR genérico si aún no cargó (http/https)
    try {
        const txt = await new Promise((resolve, reject)=>{
            const xhr = new XMLHttpRequest();
            xhr.open('GET', ruta, true);
            xhr.onreadystatechange = function(){
                if (xhr.readyState === 4){
                    // Con file:// a veces status es 0 pero hay respuesta
                    if (xhr.status === 200 || xhr.status === 0){
                        resolve(xhr.responseText||'');
                    } else {
                        reject(new Error('XHR status '+xhr.status));
                    }
                }
            };
            xhr.onerror = ()=>reject(new Error('XHR error'));
            xhr.send();
        });
        if (txt && txt.length) return parseText(txt);
    } catch(e) {
        // Última oportunidad más abajo
    }

    // 3) Fallback por defecto o localStorage
    try {
        const ip = localStorage.getItem('ipServer');
        if (ip) config.ipServer = ip;
    } catch {}
    config.version = config.version || 'local';
    config.lang = config.lang || 'en';
    // Último recurso: IP conocida de pruebas (ajústala si procede)
    if (!config.ipServer) config.ipServer = '172.25.16.63:8192';
    console.warn('[Config] Usando valores por defecto:', config);
    return true;
}
