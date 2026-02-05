// js/ui/UIController.js
import WS from "../net/j3dWebSocket.js";
import { sleep } from "../utils/sleep.js";
import {t} from "../language/language.js"

// variables globales compartidas
window.uiValue = window.uiValue ?? undefined;
window.isLoggedIn = window.isLoggedIn ?? false;
window.users = window.users ?? [];

// ---------- UI básica ----------

export function displayLogin() {
    // Bypass login: mark as logged and open dashboard directly
    window.isLoggedIn = true;
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.style.display = "none";
    OpenDashboard();
}

export function CloseDashboard() {
    window.isLoggedIn = false;
    window.hasSelectedUI = false;
    const botonUser = document.getElementById("boton_user");
    if (botonUser) {
        botonUser.style.display = "none";
    }

    const admin = document.getElementById("AdminUI");
    const reports = document.getElementById("Reports");
    const editor = document.getElementById("UIEditor");
    if (admin) admin.style.display = "none";
    if (reports) reports.style.display = "none";
    if (editor) editor.style.display = "none";
    const buscador = document.getElementById("buscador");
    if (buscador) {
        buscador.style.display = "none";
    }
    const resultados = document.getElementById("resultados");
    if (resultados) {
        resultados.style.display = "none";
    }
    const MostrarBuscador = document.getElementById("MuestraBuscador");
    if (MostrarBuscador) {
        MostrarBuscador.style.display = "none";
    }
    const puestos = document.getElementById("PuestosGrid");
    if (puestos) puestos.style.display = "none";

    // Keep login hidden in no-login mode
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.style.display = "none";

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const dropdownUsername = document.getElementById("dropdownUsername");
    const userDropdown = document.getElementById("userDropdown");
    if (username) username.value = "";
    if (password) password.value = "";
    if (dropdownUsername) dropdownUsername.innerText = "";
    if (userDropdown) userDropdown.style.display = "none";
}



export async function OpenDashboard() {
    window.isLoggedIn = true;
    const botonUser = document.getElementById("boton_user");
    if (botonUser) botonUser.style.display = "none";

    const uiDisplay = document.getElementById("UIDisplay");
    if (uiDisplay) {
        uiDisplay.style.display = "none"; 
    }

    const admin = document.getElementById("AdminUI");
    const reports = document.getElementById("Reports");
    const editor = document.getElementById("UIEditor");
    if (admin) admin.style.display = "none";
    if (reports) reports.style.display = "none";
    if (editor) editor.style.display = "none";
    const buscador = document.getElementById("MuestraBuscador");
    if(buscador)  buscador.style.display = "block";
    const puestos = document.getElementById("PuestosGrid");
    if (puestos) puestos.style.display = "flex";

    // Ensure user table/admin widgets are hidden on dashboard
    const table = document.getElementById("table-container");
    if (table) table.style.display = "none";
    const addUser = document.getElementById("addUser");
    if (addUser) addUser.style.display = "none";
    const refreshTable = document.getElementById("refreshTable");
    if (refreshTable) refreshTable.style.display = "none";
    const addUserForm = document.getElementById("addUserForm");
    if (addUserForm) addUserForm.style.display = "none";


    await sleep(100);

    Keyboard.removeKeyboard();
    Keyboard.init();
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.style.display = "none";
}


// ---------- UI de HTML remoto ----------

export function handleGetUIHtml(data) {
    const iframe = document.getElementById(`ui${window.uiValue}`);

    if (iframe) {
        const html = rewriteWindowsPathsToHttp(data.htmlContent);
        iframe.srcdoc = html;
    } else {
        console.warn(`No se encontró iframe ui${window.uiValue}`);
    }
}

export function handleReadFileCfg(data) {
    if (data.type === "cfg") {
        // FillParams y DecodeBase64 vienen de util.js (global)
        window.paramsDas = FillParams(DecodeBase64(data.content));
    }
}

export function handleUI(data)
{
    const selectedIframe = document.getElementById(`ui${window.uiValue}`);
    const html = rewriteWindowsPathsToHttp(data.data);
    selectedIframe.srcdoc = html;

}

// ---------- UI Display + fetch UI ----------

export async function getUIValue() {
    try {
        // In Android WebView, Fetch API cannot read file:///android_asset.
        // Skip reading UIDisplay.cfg and use a safe default or existing value.
        if (!window.uiValue) {
            window.uiValue = "1";
        }
        console.log(`[UIController] getUIValue -> using uiValue=`, window.uiValue);
        return window.uiValue;
    } catch (error) {
        console.error("getUIValue fallback error:", error);
        if (!window.uiValue) window.uiValue = "1";
        return window.uiValue;
    }
}

// --- UI polling control (stop fetch loops when UI is hidden) ---
if (!window.__uiPolling) {
    window.__uiPolling = { enabled: true, timers: new Set() };
}
function __addPollTimer(id) {
    try { window.__uiPolling.timers.add(id); } catch (_) {}
}
function __clearAllPollTimers() {
    try {
        const timers = window.__uiPolling && window.__uiPolling.timers ? Array.from(window.__uiPolling.timers) : [];
        for (const id of timers) { clearTimeout(id); window.__uiPolling.timers.delete(id); }
    } catch (_) {}
}
function __enablePolling() { if (window.__uiPolling) window.__uiPolling.enabled = true; }
function __disablePolling() { if (window.__uiPolling) window.__uiPolling.enabled = false; }

export async function showUI(uiVal) {
    // uiVal llega como puesto seleccionado. Mapear a UI según reglas nuevas.
    const puesto = uiVal ? String(uiVal) : (window.puestoSeleccionado ? String(window.puestoSeleccionado) : '1');
    const mapPuestoToUI = { '2': '6', '3': '8', '4': '10', '5': '12', '6': '14' };
    let targetUI = puesto;
    let split = null;
    if (puesto === '1') {
        split = ['2', '4'];
        targetUI = '2'; // valor de referencia para logs/estado
    } else if (mapPuestoToUI[puesto]) {
        targetUI = mapPuestoToUI[puesto];
    }

    window.uiValue = String(targetUI);
    console.log(`[UIController] showUI puesto=`, puesto, `→ ui=`, window.uiValue, split ? `(split ${split.join('+')})` : '');
    try {
        if (WS && typeof WS.send === "function") {
            WS.send({ info: "ShowUI", ui: window.uiValue, puesto });
            console.log(`[UIController] WS.send ShowUI -> puesto`, puesto, `ui`, window.uiValue);
        }
    } catch (e) {
        console.warn(`[UIController] WS.send ShowUI error:`, e);
    }
    
    const uiDisplay = document.getElementById("UIDisplay");
    if (uiDisplay) {
        // Dejar que el CSS maneje tamaño/posicion; solo aseguramos visibilidad y stacking
        uiDisplay.classList.add("ui-display-active");
        uiDisplay.style.setProperty("display", "block", "important");
        uiDisplay.style.setProperty("z-index", "9999", "important");
        uiDisplay.style.setProperty("pointer-events", "auto", "important");
        uiDisplay.style.setProperty("background", "#000", "important");
        console.log(`[UIController] UIDisplay visible (z-index=`, uiDisplay.style.zIndex, `)`);
    }

    const selectedIframe = document.getElementById(`ui${window.uiValue}`);
    if (selectedIframe) {
        // Dejar que CSS gobierne tamaño/posición; solo visibilidad y stacking
        selectedIframe.classList.add("ui-frame");
        selectedIframe.style.removeProperty("width");
        selectedIframe.style.removeProperty("height");
        selectedIframe.style.removeProperty("position");
        selectedIframe.style.removeProperty("inset");
        selectedIframe.style.removeProperty("transform");
        selectedIframe.style.setProperty("display", "block");
        selectedIframe.style.setProperty("visibility", "visible");
        selectedIframe.style.setProperty("z-index", "10000");
        selectedIframe.style.setProperty("background", "transparent");
        selectedIframe.style.setProperty("border", "0");
        console.log(`[UIController] iframe ui${window.uiValue} visible (class=ui-frame)`);
    } else {
        console.warn(`No se encontró el iframe con ID "ui${window.uiValue}"`);
        return;
    }

    const puestos = document.getElementById("PuestosGrid");
    if (puestos) puestos.style.display = "none";

    // Rehabilitar polling
    __enablePolling();
    await fetch(`http://${window.config.ipServer}/1`);
    // Si es puesto 1, mostrar split: ahora ui2 y ui4 solapadas
    if (split) {
        await showSplitPair(split[0], split[1]);
    } else {
        fetchUIFor(window.uiValue);
    }
}

// Fetch and inject remote UI HTML into the selected iframe
async function fetchUI() {
    try {
        if (window.__uiPolling && window.__uiPolling.enabled === false) return;
        const selectedIframe = document.getElementById(`ui${window.uiValue}`);
        if (!selectedIframe) return;
        const url = `http://${window.config.ipServer}/C:/J3D/UI/ui_${window.uiValue}.0.html`;
        console.log(`[UIController] fetchUI -> requesting`, url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        const data = await response.text();
        if (data) {
            const rewritten = rewriteWindowsPathsToHttp(data);
            const html = injectFullscreenStyle(rewritten);
            selectedIframe.srcdoc = html;
            console.log(`[UIController] iframe ui${window.uiValue} srcdoc length=`, html.length);
        }
    } catch (e) {
        console.warn(`[UIController] fetchUI error:`, e);
    } finally {
        if (window.__uiPolling && window.__uiPolling.enabled === true) {
            const t = setTimeout(fetchUI, 1000);
            __addPollTimer(t);
        }
    }
}

export function hideUI() {
    // Deshabilitar y limpiar polling antes de ocultar
    __disablePolling();
    __clearAllPollTimers();
    // Ocultar TODOS los iframes de UI (incluidos los del modo split)
    try {
        const iframes = Array.from(document.querySelectorAll('#UIDisplay iframe[id^="ui"]'));
        for (const f of iframes) {
            f.style.display = 'none';
            f.style.visibility = 'hidden';
            f.style.zIndex = '';
            f.style.left = '';
            f.style.top = '';
            f.style.position = '';
            f.style.width = '';
            f.style.height = '';
            f.style.background = '';
            f.style.border = '';
        }
    } catch (_) {}
    const displayHost = document.getElementById("UIDisplay");
    if (displayHost) {
        displayHost.style.display = "none";
        displayHost.style.zIndex = "";
        displayHost.classList.remove('ui-display-active');
        displayHost.style.pointerEvents = '';
        displayHost.style.background = '';
    }
    // Return to puesto selection
    const puestos = document.getElementById("PuestosGrid");
    if (puestos) puestos.style.display = "flex";
    const fixed = document.getElementById("fixed");
    if (fixed) fixed.style.display = "block";
    const btnSalir = document.getElementById("boton_salir");
    if (btnSalir) btnSalir.style.display = "block";
    // Keep admin/user table hidden unless explicitly opened
    const table = document.getElementById("table-container");
    if (table) table.style.display = "none";
    const addUser = document.getElementById("addUser");
    if (addUser) addUser.style.display = "none";
    const refreshTable = document.getElementById("refreshTable");
    if (refreshTable) refreshTable.style.display = "none";
    const addUserForm = document.getElementById("addUserForm");
    if (addUserForm) addUserForm.style.display = "none";
}

// Expose hideUI to global for legacy callers (e.g., J3DDashBoard.html onclick)
if (typeof window !== 'undefined') {
    window.hideUI = hideUI;
}

// Helper to rewrite Windows file paths in HTML to http URLs through ipServer
function rewriteWindowsPathsToHttp(html) {
    try {
        const ip = window.config && window.config.ipServer ? window.config.ipServer : '';
        if (!ip) return html;
        function toHttp(path) {
            return `http://${ip}/${path.replace(/^[aA]:\\/,'A:/').replace(/^[cC]:\\/,'C:/').replace(/\\/g,'/')}`;
        }
        html = html.replace(/src\s*=\s*\"(file:\/\/\/[^\"]+)\"/gi, (m, p) => `src="${p.replace('file:///', `http://${ip}/`)}"`);
        html = html.replace(/url\(\s*(["']?)([a-zA-Z]:[\\\/][^\)"']+)\1\s*\)/g, (m, q, p) => `url(${q}${toHttp(p)}${q})`);
        // collapse accidental multiple slashes after host
        const escIp = ip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const hostSlashRegex = new RegExp(`http://${escIp}/+`, 'g');
        html = html.replace(hostSlashRegex, `http://${ip}/`);
        return html;
    } catch (e) {
        console.warn('rewriteWindowsPathsToHttp error:', e);
        return html;
    }
}

export function hideTable() {
    document.getElementById("table-container").style.display = "none";
    document.getElementById("addUser").style.display = "none";
    document.getElementById("addUserForm").style.display = "block";
    document.getElementById("refreshTable").style.display = "none";
}

// Some callers expect UIController.initUIEvents to exist. Provide a no-op initializer
// that wires any future event bindings safely.
export function initUIEvents() {
    try {
        // Placeholder: ensure required DOM nodes exist and bind if needed.
        const displayHost = document.getElementById("UIDisplay");
        if (displayHost) {
            // Example: prevent background scroll when active
            displayHost.addEventListener("wheel", (e) => {
                if (displayHost.style.display === "block") e.preventDefault();
            }, { passive: false });
        }
        console.log("[UIController] initUIEvents initialized");
    } catch (e) {
        console.warn("[UIController] initUIEvents error:", e);
    }
}
async function fetchUIFor(val) {
    try {
        if (window.__uiPolling && window.__uiPolling.enabled === false) return;
        const iframe = document.getElementById(`ui${val}`);
        if (!iframe) return;
        const url = `http://${window.config.ipServer}/C:/J3D/UI/ui_${val}.0.html`;
        const res = await fetch(url);
        // Si el servidor responde 204 No Content o cuerpo vacío, no sobreescribir
        if (res.status === 204) {
            console.log('[UIController] fetchUIFor', val, '-> 204 No Content, manteniendo iframe');
            return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let html = await res.text();
        if (!html || html.trim().length === 0) {
            console.log('[UIController] fetchUIFor', val, '-> cuerpo vacío, manteniendo iframe');
            return;
        }
        // Evitar sobrescribir si el contenido no ha cambiado
        window.__lastUIHtml = window.__lastUIHtml || {};
        const prev = window.__lastUIHtml[val];
        if (typeof prev === 'string' && prev === html) {
            // Igual contenido: no tocar el iframe
            return;
        }
        const rewritten = rewriteWindowsPathsToHttp(html);
        const finalHtml = injectFullscreenStyle(rewritten);
        iframe.srcdoc = finalHtml;
        window.__lastUIHtml[val] = html;

        iframe.onload = function () {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc) return;
                if (String(val) === '3') {
                    const zone4 = doc.querySelector('svg g.zone04');
                    if (zone4) {
                        const t = zone4.getAttribute('transform') || '';
                        const adjust = ' translate(0,24)';
                        zone4.setAttribute('transform', (t || '') + adjust);
                        console.log('[UIController] Applied translateY to zone04 in UI3');
                    }
                }
            } catch (e) {
                console.warn('Zone adjustment error:', e);
            }
        };
    } catch (e) {
        console.warn("fetchUIFor error:", e);
    } finally {
        // Reintento cada segundo como en Dashboard legacy
        try {
            if (window.__uiPolling && window.__uiPolling.enabled === true) {
                const t = setTimeout(() => fetchUIFor(val), 1000);
                __addPollTimer(t);
            }
        } catch (_) {}
    }
}

// Mostrar split para un par arbitrario: leftId a la izquierda, rightId empezando a mitad
async function showSplitPair(leftId, rightId) {
    try {
        const leftIframe = document.getElementById('ui' + leftId);
        const rightIframe = document.getElementById('ui' + rightId);
        if (!leftIframe || !rightIframe) {
            console.warn('SplitUI: faltan iframes ui' + leftId + '/ui' + rightId);
            return;
        }
        // Posicionar: ui1 a la izquierda, ui3 arrancando a mitad de ancho
        leftIframe.classList.add('ui-frame');
        leftIframe.style.removeProperty('width');
        leftIframe.style.removeProperty('height');
        leftIframe.style.position = 'absolute';
        leftIframe.style.left = '0';
        leftIframe.style.top = '0';
        leftIframe.style.zIndex = '10000';
        leftIframe.style.display = 'block';
        leftIframe.style.visibility = 'visible';
        leftIframe.style.background = 'transparent';
        leftIframe.style.border = '0';

        rightIframe.classList.add('ui-frame');
        rightIframe.style.removeProperty('width');
        rightIframe.style.removeProperty('height');
        rightIframe.style.position = 'absolute';
        rightIframe.style.left = '130vw';
        rightIframe.style.top = '0';
        rightIframe.style.zIndex = '10001';
        rightIframe.style.display = 'block';
        rightIframe.style.visibility = 'visible';
        rightIframe.style.background = 'transparent';
        rightIframe.style.border = '0';

        await Promise.all([
            fetchUIFor(leftId),
            fetchUIFor(rightId)
        ]);
        console.log('Split UI loaded: ui' + leftId + ' left 0, ui' + rightId + ' left 50vw');
    } catch (e) {
        console.warn('showSplitPair error:', e);
    }
}

// Inject CSS inside the iframe HTML so its content fills the viewport
function injectFullscreenStyle(html) {
    try {
        // Inject styles to reset viewport and prepare a scaling wrapper
        const style = `\n<style id="j3d-fit-style">\n  html, body { margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; background:transparent !important; overflow:hidden !important; }\n  *, *::before, *::after { box-sizing:border-box; }\n  #j3d-scale-root { position:absolute; top:0; left:0; transform-origin: top left; will-change: transform; }\n</style>\n`;

        // Wrap body content into a scalable root
        if (/<body[\s\S]*?>/i.test(html)) {
            html = html.replace(/<body([\s\S]*?)>/i, '<body$1><div id="j3d-scale-root">');
            html = html.replace(/<\/body>/i, '</div></body>');
        } else {
            // If no body tag found, create one to ensure scaling
            html = `<body><div id="j3d-scale-root">${html}</div></body>`;
        }

        // Attach autoscale script using COVER strategy to fill viewport fully
        const script = `\n<script id="j3d-fit-script">(function(){\n  function applyScale(){\n    var root = document.getElementById('j3d-scale-root');\n    if(!root){return;}\n    var vw = window.innerWidth || document.documentElement.clientWidth;\n    var vh = window.innerHeight || document.documentElement.clientHeight;\n    root.style.transform = 'none';\n    // Measure natural content size using body to include absolutely-positioned children\n    var cw = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);\n    var ch = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);\n    if(!cw || !ch){ return; }\n    // COVER: uniform scale to fill both axes (may crop), then center\n    var s = Math.max(vw / cw, vh / ch);\n    // Optional boost to counter over-large natural sizes coming from templates\n    try {\n      var boost = (window.top && window.top.config && window.top.config.uiScaleBoost) ? Number(window.top.config.uiScaleBoost) : 1;\n      if (!isNaN(boost) && boost > 0) { s = s * boost; }\n    } catch(e){}\n    root.style.transformOrigin = 'top left';\n    root.style.transform = 'scale(' + s + ')';\n    var scaledW = cw * s;\n    var scaledH = ch * s;\n    var offsetX = Math.max(0, (vw - scaledW) / 2);\n    var offsetY = Math.max(0, (vh - scaledH) / 2);\n    root.style.left = offsetX + 'px';\n    root.style.top = offsetY + 'px';\n    document.documentElement.style.background = '#000';\n    document.body.style.background = '#000';\n  }\n  window.addEventListener('load', applyScale);\n  window.addEventListener('resize', applyScale);\n  // Reflows for dynamic content/images\n  setTimeout(applyScale, 0);\n  setTimeout(applyScale, 300);\n  setTimeout(applyScale, 1000);\n})();</script>\n`;

        if (/<head[\s\S]*?>/i.test(html)) {
            html = html.replace(/<head[\s\S]*?>/i, (m) => m + style);
        } else {
            html = style + html;
        }

        // Append script just before closing body
        if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, script + '</body>');
        } else {
            html += script;
        }
        return html;
    } catch (e) {
        console.warn("injectFullscreenStyle error:", e);
        return html;
    }
}

// End of helpers
