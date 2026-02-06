// js/Dashboard.js
import { config, loadConfig } from "./utils/config.js";
import WS from "./net/j3dWebSocket.js";
import { registerHandlers } from "./net/WebSocketHandlers.js";
import * as UIController from "./ui/UIController.js";
import * as LoginController from "./ui/LoginController.js";
import Keyboard from "./ui/Keyboard.js";
import { sleep } from "./utils/sleep.js";
import { setLang, translateDOM } from "./language/language.js";
import { initBuscador } from "./buscador/Buscador.js";

// globales
window.uiValue = window.uiValue ?? undefined;
window.isLoggedIn = window.isLoggedIn ?? false;
window.users = window.users ?? [];

// detectar táctil
window.IsTactil = false;
window.addEventListener("touchstart", function setHasTouch() {
    window.IsTactil = true;
    window.removeEventListener("touchstart", setHasTouch);
});

// compatibilidad
window.Keyboard = Keyboard;

// Implementar AdminUI.abreZoom como en "das": mostrar Zoom_Inspecciones con template
window.AdminUI = window.AdminUI || {};
window.AdminUI.abreZoom = function(zona, id_inspeccion, enable) {
    try {
        console.log("[AdminUI.abreZoom] called:", { zona, id_inspeccion, enable });
        if (enable === 'none') return;

        const info = window.info_coches || {};
        const coche = info[id_inspeccion];
        if (!coche) {
            console.log("[AdminUI.abreZoom] no car found for id_inspeccion", id_inspeccion);
            return;
        }
        if (!Array.isArray(coche.svgs) || !coche.svgs[Math.max(0, (zona|0) - 1)]) return;

        const zoomHost = document.getElementById("Zoom_Inspecciones");
        if (!zoomHost) return;

        // contexto global para navegación
        window.coche_zoom = coche;
        window.zona_zoom = zona|0;

        const borroso = document.getElementById("borroso");
        if (borroso) {
            // No aplicar efecto borroso al abrir zoom
            borroso.style.display = 'none';
            borroso.style.zIndex = '1';
        }

        zoomHost.style.visibility = 'visible';
    console.log("[AdminUI.abreZoom] showing Zoom_Inspecciones; zona=", zona);

        // Render inicial
        if (typeof window.ActualizaZoom !== 'function') {
            window.ActualizaZoom = function(incremento) {
                try {
                    if (!window.coche_zoom) return;
                    let z = (window.zona_zoom|0) + (incremento|0);
                    const total = Array.isArray(window.coche_zoom.svgs) ? window.coche_zoom.svgs.length : 0;
                    if (!total) return;
                    if (z < 1) z = total; else if (z > total) z = 1;
                    // saltar zonas vacías en la dirección solicitada (hacia delante o hacia atrás)
                    const dir = (incremento|0) >= 0 ? 1 : -1;
                    let guard = 0;
                    while (guard < total && (!window.coche_zoom.svgs[z-1] || window.coche_zoom.svgs[z-1].length === 0)) {
                        z = z + dir;
                        if (z < 1) z = total; else if (z > total) z = 1;
                        guard++;
                    }
                    window.zona_zoom = z;

                    const tmpl = window.AdmTemplates && (window.AdmTemplates["ZoomInspeccion"] || window.AdmTemplates["Zoom"] || window.AdmTemplates["Zoom_Inspeccion"]);
                    if (tmpl && typeof window.FillTemplate === 'function') {
                        // Render template HTML
                        zoomHost.innerHTML = window.FillTemplate(window.coche_zoom, tmpl);
                        // Ensure inline <script> blocks inside templates execute
                        try {
                            const scripts = Array.from(zoomHost.querySelectorAll('script'));
                            for (const s of scripts) {
                                const newScript = document.createElement('script');
                                // copy attributes type/src if present
                                if (s.src) {
                                    newScript.src = s.src;
                                }
                                if (s.type) {
                                    newScript.type = s.type;
                                }
                                // inline content
                                if (s.textContent && !s.src) {
                                    newScript.textContent = s.textContent;
                                }
                                // replace to trigger execution
                                s.parentNode.replaceChild(newScript, s);
                            }
                        } catch (se) {
                            console.warn('[AdminUI.abreZoom] script execution fallback failed', se);
                        }
                        console.log('[AdminUI.abreZoom] Zoom template rendered for zona', window.zona_zoom);
                        // Adjuntar handler de VIS post-render
                        try { attachZoomVisHandler(zoomHost); } catch(_){ }
                    } else {
                        // Fallback: solo SVG de la zona actual
                        const svg = window.DecodeBase64 ? window.DecodeBase64(window.coche_zoom.svgs[z-1]) : window.coche_zoom.svgs[z-1];
                        zoomHost.innerHTML = '<div class="ImagenZoom">' + (svg || '') + '</div>';
                        console.log('[AdminUI.abreZoom] Rendered fallback SVG for zona', window.zona_zoom);
                        // Adjuntar handler de VIS post-render
                        try { attachZoomVisHandler(zoomHost); } catch(_){ }
                    }
                } catch (e) {
                    console.warn('ActualizaZoom error:', e);
                }
            };
            // Asegurar alias para llamadas inline desde templates (onclick="AdminUI.ActualizaZoom(..)")
            window.AdminUI.ActualizaZoom = window.ActualizaZoom;
        }
        // Si ya existía la función global pero el alias no, créalo
        if (typeof window.ActualizaZoom === 'function' && (!window.AdminUI.ActualizaZoom || window.AdminUI.ActualizaZoom !== window.ActualizaZoom)) {
            window.AdminUI.ActualizaZoom = window.ActualizaZoom;
        }

        // Helper local para mostrar VIS en click (independiente del template)
        function attachZoomVisHandler(host){
            if (!host) return;
            const target = host.querySelector('.ImagenZoom svg') || host.querySelector('.ImagenZoom');
            if (!target) return;
            // Evitar duplicados accidentalmente si algún template añade también listeners
            target.__visHandlerBound && target.removeEventListener('click', target.__visHandlerBound);
            const handler = async function(e){
                try{
                    // Obtener VIS del Zoom actual
                    const el = host.querySelector('#UltVis');
                    const visRaw = el ? (el.textContent || '') : '';
                    const vis = (visRaw||'').replace(/^\s*Vis\s*/i,'').trim();
                    if (!vis) { console.warn('[Zoom] No VIS found in zoom'); return; }

                    // UI target and visibility
                    const uiHost = document.getElementById('UIDisplay');
                    const selectedIframe = document.getElementById('ui15');
                    if (!selectedIframe) { console.warn('[Zoom] iframe #ui15 not found'); return; }

                    // Configurar uiValue = 15 y pedir UI por HTTP (UI de búsqueda)
                    try { window.uiValue = 15; } catch(_) {}
                    const base = (window.config && window.config.ipServer) ? window.config.ipServer : '10.3.29.30:8192';
                    const url = `http://${base}/UI?vis=${encodeURIComponent(vis)}&uivalue=15`;
                    console.log('[Zoom] Fetching UI via', url);
                    const response = await fetch(url);
                    if (!response.ok) { console.error('[Zoom] UI fetch failed:', response.status); return; }
                    const data = await response.text();
                    if (!data) { console.warn('[Zoom] Empty UI response'); return; }

                    // Mostrar overlay UI15Host en lugar de UIDisplay
                    const ui15Host = document.getElementById('UI15Host');
                    if (ui15Host) ui15Host.style.display = 'block';
                    // Cargar contenido en #ui15 y mostrarlo
                    selectedIframe.srcdoc = data;
                    selectedIframe.style.visibility = 'visible';
                    selectedIframe.style.zIndex = '2';
                }catch(err){ console.error('[Zoom] VIS UI load error', err); }
            };
            target.addEventListener('click', handler, false);
            target.__visHandlerBound = handler;
        }

        window.ActualizaZoom(0);
    } catch (e) {
        console.warn("AdminUI.abreZoom error:", e);
    }
};

// Cierre del zoom (similar a das)
if (typeof window.AdminUI.cerrarZoom !== 'function') {
    window.AdminUI.cerrarZoom = function() {
        const zoom = document.getElementById('Zoom_Inspecciones');
        if (zoom) {
            zoom.style.visibility = 'hidden';
            zoom.innerHTML = '';
        }
        const borroso = document.getElementById('borroso');
        if (borroso) {
            if (document.getElementById('resultados')?.style.display !== 'none') {
                // si resultados está visible, mantener borroso según flujo original
                borroso.style.zIndex = '1';
            } else {
                borroso.style.display = 'none';
                borroso.style.zIndex = '1';
            }
        }
    };
}

// Alias por compatibilidad si los templates llaman AdminUI.ActualizaZoom
if (!window.AdminUI.ActualizaZoom && typeof window.ActualizaZoom === 'function') {
    window.AdminUI.ActualizaZoom = window.ActualizaZoom;
}

async function initDashboard() {
    console.log("[Dashboard] Arrancando Dashboard; href=", typeof location!=='undefined'?location.href:'<no-location>');

    // cargar Dash.cfg
    const ok = await loadConfig();
    if (!ok || !config.ipServer) {
        window.PrintMessage("ERROR_CFG", "#e92d3a", 4000);
        return;
    }

    setLang(config.lang);

    console.log("[Dashboard] Idioma cargado:", config.lang);
    console.log("[Dashboard] IP cargada:", config.ipServer);

    // conectar WebSocket
    try {
        console.log("[Dashboard] WS.connect ->", config.ipServer);
        WS.connect(config.ipServer);
    } catch (e) {
        console.error("[Dashboard] WS.connect error", e);
    }

    // UI básica
    UIController.displayLogin();

    // registrar handlers
    registerHandlers();
}

initDashboard();

// ======== DOMContentLoaded ========
document.addEventListener("DOMContentLoaded", async () => {

    console.log("DOMContentLoaded()", { href: typeof location!=='undefined'?location.href:'<no-location>' });

    Keyboard.init();
    LoginController.initLoginEvents();
    UIController.initUIEvents();

    // compatibilidad global
    window.handleLogin = LoginController.handleLogin;
    window.logout = LoginController.logout;
    window.toggleUserDropdown = LoginController.toggleUserDropdown;

    window.showTable = UIController.showTable;
    window.hideTable = UIController.hideTable;
    window.OpenDashboard = UIController.OpenDashboard;
    window.CloseDashboard = UIController.CloseDashboard;
    window.exit = UIController.exit;  // FIX
    // Expose UIController for HTML inline handlers (e.g., PuestosGrid)
    window.UIController = UIController;
    window.config = config;
    window.WS = WS;
    initBuscador();
    translateDOM();
    // leer UIValue
    await UIController.getUIValue();

    if (!window.uiValue) {
        window.PrintMessage("ERROR_UIVALUE", "#e92d3a", 6000);
        await sleep(6500);
        try { window.close(); } catch(e) {}
    }
});
