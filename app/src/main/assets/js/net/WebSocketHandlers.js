// js/net/WebSocketHandlers.js
import WS from "./j3dWebSocket.js";
import * as LoginController from "../ui/LoginController.js";
import * as UIController from "../ui/UIController.js";

export function registerHandlers() {
    // UserAction
    WS.defineType("UserAction");
    WS.on("UserAction", LoginController.handleUserAction);

    // HTML UI
    WS.defineType("GetUIHtml");
    WS.on("GetUIHtml", UIController.handleGetUIHtml);

    // Fast login lista
    WS.defineType("ResultadoGetLastUsersMini");
    WS.on("ResultadoGetLastUsersMini", LoginController.handleFastLoginList);

    // ReadFile cfg
    WS.defineType("ResultadoReadFile");
    WS.on("ResultadoReadFile", UIController.handleReadFileCfg);

}
