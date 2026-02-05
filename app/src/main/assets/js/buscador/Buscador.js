// js/ui/Buscador.js

import WS from "../net/j3dWebSocket.js";
import { showUI as showDashboardUI } from "../ui/UIController.js";

// --- Estado ---
let coches_encontrados = [];
let info_coches = {};
let n_pagina_coches = 0;
const coches_por_pagina = 5;

// Templates heredados del AdminUI (Busqueda, Resultados, etc.)
const AdmTemplates = {};
// También exponerlos globalmente para que otras capas (abreZoom) puedan usarlos
if (!window.AdmTemplates) window.AdmTemplates = AdmTemplates;

// --- Helpers ---

// Rellena un template del AdminUI con los datos del coche: %%campo%%
function FillTemplate(car, tmpl) {
    if (!tmpl) return "";

    let out = tmpl;
    const parts = tmpl.split("%%");

    // partes impares: nombres de campos
    for (let i = 1; i < parts.length; i += 2) {
        const key = parts[i];

        // Manejo especial de SVGs igual que AdminUI
        if (key.startsWith("svg")) {
            let zonaIdx = 0;
            // svg1..svg7 -> índice 0..6
            const numMatch = key.match(/^svg(\d+)/);
            if (numMatch) {
                zonaIdx = Math.max(0, parseInt(numMatch[1], 10) - 1);
            } else if (key === "svg_zona" && typeof window.zona_zoom === "number") {
                zonaIdx = Math.max(0, window.zona_zoom - 1);
            }

            let svgContent = "";
            if (car && Array.isArray(car.svgs) && car.svgs[zonaIdx]) {
                try {
                    svgContent = window.DecodeBase64 ? window.DecodeBase64(car.svgs[zonaIdx]) : car.svgs[zonaIdx];
                } catch {}
            }

            const token = "%%" + key + "%%";
            while (out.indexOf(token) !== -1) {
                out = out.replace(token, svgContent || "");
            }
            continue;
        }

        const value = car && car[key] != null ? car[key] : "--";
        const token = "%%" + key + "%%";
        while (out.indexOf(token) !== -1) {
            out = out.replace(token, value);
        }
    }

    out = rewriteWindowsPathsToHttp(out);
    // Reescribe rutas Windows (C:/...) a http://ipServer/... para evitar ERR_UNKNOWN_URL_SCHEME
    return rewriteWindowsPathsToHttp(out);
}

// Exponer helper para que AdminUI.abreZoom pueda renderizar templates
if (!window.FillTemplate) window.FillTemplate = FillTemplate;

// --- Registro de tipos y handlers WS ---

function registerWsHandlers() {
    WS.defineType("ResultadoBusqueda");
    WS.defineType("ResultadoActualizaPaginaResultados");
    WS.defineType("ResultadoGetTemplatesAdminUI");

    WS.on("ResultadoBusqueda", handleResultadoBusqueda);
    WS.on("ResultadoActualizaPaginaResultados", handleResultadoPagina);
    WS.on("ResultadoGetTemplatesAdminUI", handleTemplates);
}

// Templates del AdminUI (incluye "Resultados")
function handleTemplates(data) {
    // data viene con claves tipo "Resultados.html" en base64
    for (const key in data) {
        if (key === "info") continue;

        const baseName = key.split(".")[0]; // "Resultados"
        const b64 = data[key];

        if (typeof window.DecodeBase64 === "function") {
            AdmTemplates[baseName] = window.DecodeBase64(b64);
            // Reflejar en el espacio global
            if (!window.AdmTemplates) window.AdmTemplates = {};
            window.AdmTemplates[baseName] = AdmTemplates[baseName];
        } else {
            console.warn("[Buscador] DecodeBase64 no disponible, no puedo cargar template:", key);
        }
    }
}

// --- Handlers de resultados ---

function handleResultadoBusqueda(data) {
    coches_encontrados = Array.isArray(data.data) ? data.data : [];
    n_pagina_coches = 0;

    if (coches_encontrados.length === 0) {
        info_coches = {};
        actualizarPaginaResultados();
        mostrarResultados();   // esto ocultará el loading y mostrará "Sin resultados"
        return;
    }

    getInfoPaginaResultados();
}


function handleResultadoPagina(data) {
    const res = Array.isArray(data.infoCars) ? data.infoCars : [];

    res.forEach((coche) => {
        info_coches[coche.id_inspeccion] = coche;
    });

    // Exponer para que AdminUI.abreZoom acceda al coche seleccionado
    window.info_coches = info_coches;

    actualizarPaginaResultados();
    mostrarResultados();
}

// --- UI del buscador ---

function MuestraBuscador() {
    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");
    if (!buscador) return;

    const isHidden = buscador.style.display === "" || buscador.style.display === "none";

    if (isHidden) {
        buscador.style.display = "block";
        if (resultados) resultados.style.display = "none";
    } else {
        buscador.style.display = "none";
    }
}

// --- Resultados: mismos estilos que AdminUI ---

function actualizarPaginaResultados() {
    const resultados = document.getElementById("resultados");
    const cont = document.getElementById("Busquedas");
    if (!cont || !resultados) return;

    cont.innerHTML = "";

    for (let seccion = 0; seccion < coches_por_pagina; seccion++) {
        const idx = seccion + n_pagina_coches * coches_por_pagina;
        if (idx >= coches_encontrados.length) continue;

        const idInsp = coches_encontrados[idx];
        const coche_aux = info_coches[idInsp];
        if (!coche_aux) continue;

        if (AdmTemplates["Resultados"]) {
            // Usamos exactamente el template del AdminUI
            const wrapper = document.createElement("span"); // AdminUI usaba <scan>, esto es más correcto
            wrapper.innerHTML = FillTemplate(coche_aux, AdmTemplates["Resultados"]);
            const nodo = wrapper.firstChild;

            // Dejamos que los onclick del template funcionen (AdminUI.abreZoom)
            if (nodo) {
                cont.appendChild(nodo);
            }
        } else {
            // Fallback simple si no se han cargado templates
            const div = document.createElement("div");
            div.className = "Seccion";
            div.innerHTML = `
                <div class="InfoInspeccionRes">
                    <span class="DatoResultadosBold">RELAI: ${coche_aux.relai || "-"}</span><br/>
                    <span class="DatoResultados">PJI: ${coche_aux.pji || "-"}</span><br/>
                    <span class="DatoResultados">Modelo: ${coche_aux.halfmodel || "-"}</span><br/>
                </div>
            `;
            // Fallback sin oyentes para que no interfiera
            cont.appendChild(div);
        }
    }

    // Actualiza los botones de paginación según total de páginas
    updatePaginationButtons();
}

function mostrarResultados() {
    const resultados = document.getElementById("resultados");
    const num_res    = document.getElementById("NumRes");
    const botones    = document.getElementById("botones");
    const infoIcon   = document.getElementById("info_icon");
    const busquedas  = document.getElementById("Busquedas");
    const loading    = document.getElementById("imagen_cargando");

    if (!resultados || !num_res || !botones) return;

    num_res.style.visibility = "visible";

    if (coches_encontrados.length > 0) {
        num_res.innerHTML = `${coches_encontrados.length} resultados`;
        botones.style.display = "block";
    } else {
        num_res.innerHTML = "Sin resultados";
        botones.style.display = "none";
    }

    if (busquedas) busquedas.style.display = "block";
    if (infoIcon)  infoIcon.style.visibility = "visible";
    if (loading)   loading.style.visibility = "hidden";

    resultados.style.display = "block";

    // Refresca numeración/visibilidad de botones al mostrar el bloque
    updatePaginationButtons();
}


function CerrarResultados() {
    const res = document.getElementById("resultados");
    const buscador = document.getElementById("buscador");
    if (res) res.style.display = "none";
    if (buscador) buscador.style.display = "block";
}

// --- Navegación de páginas (usa la misma idea que AdminUI) ---

function retrasa(n) {
    if (n_pagina_coches - n >= 0) {
        n_pagina_coches -= n;
        getInfoPaginaResultados();
    }
}

function adelanta(n) {
    if ((n_pagina_coches + n) * coches_por_pagina < coches_encontrados.length) {
        n_pagina_coches += n;
        getInfoPaginaResultados();
    }
}

// --- Peticiones WS ---

// Buscar por RELAI y PJI (solo estos dos filtros)
function PideResultados() {
    n_pagina_coches = 0;

    const relaiInput = document.getElementById("p_relai");
    const pjiInput   = document.getElementById("p_val1");

    const relai = relaiInput ? relaiInput.value.trim() : "";
    const pji   = pjiInput   ? pjiInput.value.trim()   : "";

    // YA NO obligamos a tener relai o pji
    // Se puede buscar con ambos vacíos → el backend devolverá “todo” (o lo que tenga por defecto)

    // Mostrar loading y ocultar resultados mientras se carga
    const loading    = document.getElementById("imagen_cargando");
    const busquedas  = document.getElementById("Busquedas");
    const resultados = document.getElementById("resultados");

    if (loading)    loading.style.visibility = "visible";
    if (busquedas)  busquedas.style.display = "none";
    if (resultados) resultados.style.display = "block";

    const json = { info: "Busqueda" };

    // Solo añadimos estos filtros si el usuario los ha puesto
    if (relai) json["s-relai"] = relai;
    // Backend espera "s-vis" en lugar de "s-pji"
    if (pji)   json["s-vis"]   = pji;

    console.log(json);
    WS.send(json);
}


// Pide la información de los coches de la página actual
function getInfoPaginaResultados() {
    const ids = [];

    for (let seccion = 0; seccion < coches_por_pagina; seccion++) {
        const idx = seccion + n_pagina_coches * coches_por_pagina;
        if (coches_encontrados[idx]) {
            ids.push(coches_encontrados[idx]);
        }
    }

    // Si no hay IDs (p.ej. página vacía), solo refrescamos la UI
    if (!ids.length) {
        actualizarPaginaResultados();
        mostrarResultados();
        return;
    }

    WS.send({
        info: "ActualizaPaginaResultados",
        idsInsp: ids.join(","),
    });
}

// Validar UI (si quieres seguir usando este mensaje)
function ValSearchUI() {
    const relaiInput = document.getElementById("p_relai");
    const pjiInput   = document.getElementById("p_val1");

    const relai = relaiInput ? relaiInput.value.trim() : "";
    const pji   = pjiInput   ? pjiInput.value.trim()   : "";

    if (!relai && !pji) {
        if (window.PrintMessage) {
            window.PrintMessage("ERROR_UIVALUE", "#e92d3a", 2000);
        } else {
            alert("Introduce RELAI o PJI");
        }
        return;
    }

    const payload = {
        info: "ValSearchUI",
        UI2Generate: "10.0",
    };

    if (relai) payload.relai = relai;
    if (pji)   payload.pji   = pji;

    WS.send(payload);
}

// Abrir UI explícitamente (si lo llamas desde un botón)
function showUI() {
    window.hasSelectedUI = true;
    showDashboardUI();

    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");
    if (buscador) buscador.style.display = "none";
    if (resultados) resultados.style.display = "none";
}

function Exit() {
    const buscador = document.getElementById("buscador");
    const resultados = document.getElementById("resultados");
    if (buscador) buscador.style.display = "none";
    if (resultados) resultados.style.display = "none";
}

// --- init público ---

function initBuscador() {
    registerWsHandlers();

    // Pedimos los templates del AdminUI cuando el WS esté conectado
    if (typeof WS.onOpen === "function") {
        WS.onOpen(() => {
            WS.send({ info: "GetTemplatesAdminUI" });
        });
    } else {
        // fallback: lo mandamos directamente
        WS.send({ info: "GetTemplatesAdminUI" });
    }

    // API global para los onclick del HTML
    window.Buscador = {
        initBuscador,
        MuestraBuscador,
        PideResultados,
        ValSearchUI,
        showUI,
        Exit,
        retrasa,
        adelanta,
        CerrarResultados,
    };
}

export { initBuscador };

// ------ Helper: Rewrite C:\ paths in template HTML to http -------
function rewriteWindowsPathsToHttp(html) {
    try {
        const ip = window?.config?.ipServer;
        if (!ip || typeof html !== "string") return html;

        const toHttp = (p) => `http://${ip}/` + p.replace(/\\/g, "/");

        // Replace src/href with Windows paths
        html = html.replace(/\b(src|href)\s*=\s*(["']?)([cC]:[\\\/][^"'>\s)]+)\2/g, (m, attr, q, p) => {
            return `${attr}=${q}${toHttp(p)}${q}`;
        });
        // Replace CSS url(...) occurrences
        html = html.replace(/url\(\s*(["']?)([cC]:[\\\/][^)"']+)\1\s*\)/g, (m, q, p) => {
            return `url(${q}${toHttp(p)}${q})`;
        });
        // Collapse accidental double slashes after host
        const escIp = ip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const hostSlashRegex = new RegExp(`http://${escIp}/+`, "g");
        html = html.replace(hostSlashRegex, `http://${ip}/`);

        return html;
    } catch (e) {
        console.warn("[Buscador] rewriteWindowsPathsToHttp error:", e);
        return html;
    }
}

// ------ Paginación dinámica ------
function totalPages() {
    return Math.max(0, Math.ceil(coches_encontrados.length / coches_por_pagina));
}

function goToPage(pageIndex) {
    const tp = totalPages();
    const idx = Math.max(0, Math.min(tp - 1, pageIndex|0));
    if (idx === n_pagina_coches) return;
    n_pagina_coches = idx;
    getInfoPaginaResultados();
}

function updatePaginationButtons() {
    const cont = document.getElementById("botones");
    if (!cont) return;
    const all = Array.from(cont.querySelectorAll("input.Boton_resultados"));
    if (!all.length) return;

    const firstBtn = cont.querySelector("#pagina_inicial");
    const lastBtn  = cont.querySelector("#pagina_final");
    const center   = all.filter(b => b !== firstBtn && b !== lastBtn);

    const tp = totalPages();
    if (tp <= 1) {
        // Una sola página: ocultar todos los botones
        all.forEach(b => b.style.visibility = "hidden");
        return;
    }

    const current = n_pagina_coches + 1; // 1-based

    // Configurar extremos 1 y tp
    if (firstBtn) {
        firstBtn.style.visibility = "visible";
        firstBtn.value = "1";
        firstBtn.disabled = (current === 1);
        firstBtn.onclick = () => goToPage(0);
    }
    if (lastBtn) {
        lastBtn.style.visibility = "visible";
        lastBtn.value = String(tp);
        lastBtn.disabled = (current === tp);
        lastBtn.onclick = () => goToPage(tp - 1);
    }

    // Si hay 2 páginas, oculta todos los centrales
    if (tp <= 2) {
        center.forEach(btn => btn.style.visibility = "hidden");
        return;
    }

    // Para más de 2 páginas: muestra una ventana centrada alrededor de la actual, sin duplicar 1 ni tp
    const windowSize = center.length;        // número de botones centrales disponibles
    const innerMax   = Math.max(0, tp - 2);  // páginas válidas en centro: 2..tp-1
    const useLen     = Math.min(windowSize, innerMax);
    if (useLen === 0) {
        center.forEach(btn => btn.style.visibility = "hidden");
        return;
    }

    let start = current - Math.floor(useLen / 2);
    start = Math.max(2, start);
    const maxStart = (tp - 1) - useLen + 1; // última posición para no invadir tp
    start = Math.min(start, maxStart);

    center.forEach((btn, i) => {
        if (i < useLen) {
            const page = start + i;
            btn.style.visibility = "visible";
            btn.value = String(page);
            btn.disabled = (page === current);
            btn.onclick = () => goToPage(page - 1);
        } else {
            btn.style.visibility = "hidden";
        }
    });
}
