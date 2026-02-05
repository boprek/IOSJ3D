// js/ui/LoginController.js
import WS from "../net/j3dWebSocket.js";
import * as UIController from "./UIController.js";
import {t} from "../language/language.js"

window.username = window.username ?? "";
window.fastLoginUsers = window.fastLoginUsers ?? [];
window.users = window.users ?? [];
window.isLoggedIn = window.isLoggedIn ?? false;

export function initLoginEvents() {
    window.handleLogin = handleLogin;
    window.logout = logout;
    window.fastLogin = fastLogin;
    window.toggleUserDropdown = toggleUserDropdown;

    // eventos de password / icono ojo
    const passwordField = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");

    if (passwordField && togglePassword) {
        passwordField.addEventListener("input", () => {
            togglePassword.style.display =
                passwordField.value.length > 0 ? "block" : "none";
        });

        togglePassword.addEventListener("click", () => {
            if (passwordField.type === "password") {
                passwordField.type = "text";
                togglePassword.src = "images/OjoH.png";
            } else {
                passwordField.type = "password";
                togglePassword.src = "images/Ojo.png";
            }
        });
    }
}

// ---------- handlers WS ----------

export function handleUserAction(data) {
    if (data.result === "NOK") {
        if (data.action === "4") {
            PrintMessage("LOGIN_ERROR", "#e92d3a", 2000);

           // document.getElementById("boton_user").style.display = "none";
            document.getElementById("loginForm").style.display = "block";
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            document.getElementById("togglePassword").style.display = "none"

            const btnUsers   = document.getElementById("pUsers");
            const btnAdminUI = document.getElementById("pAdminUI");
            const btnReports = document.getElementById("pReports");

            if (btnUsers)   btnUsers.style.display = "none";
            if (btnAdminUI) btnAdminUI.style.display = "none";
            if (btnReports) btnReports.style.display = "none";


            Keyboard.close();
        } else {
            PrintMessage("USER_EXISTS", "#e92d3a", 2000);
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        }
        return;
    }

    if (data.action === "4" && data.result === "OK") {
        if (data.rol === "0") {
            document.getElementById("userRole").innerText = "Usuario";
            const btnUsers   = document.getElementById("pUsers");
            const btnAdminUI = document.getElementById("pAdminUI");
            const btnReports = document.getElementById("pReports");

            if (btnUsers)   btnUsers.style.display = "none";
            if (btnAdminUI) btnAdminUI.style.display = "none";
            if (btnReports) btnReports.style.display = "none";

        } else {
            document.getElementById("userRole").innerText = "Administrador";

            const btnUsers   = document.getElementById("pUsers");
            const btnAdminUI = document.getElementById("pAdminUI");
            const btnReports = document.getElementById("pReports");

            if (btnUsers)   btnUsers.style.visibility = "hidden";
            if (btnAdminUI) btnAdminUI.style.visibility = "hidden";
            if (btnReports) btnReports.style.visibility = "hidden";


            document.getElementById("pUsers").click();
        }

        PrintMessage("LOGIN_SUCCESS", "#4fdb7c", 2000);

        Keyboard.close();
        UIController.showUI();
        window.isLoggedIn = true;

        document.getElementById("dropdownUsername").innerText = window.username;
       // document.getElementById("boton_user").style.display = "inline-flex";
        document.getElementById("loginForm").style.display = "none";

        UIController.OpenDashboard();
        window.users = data.users || window.users;
    }
}

export function handleFastLoginList(data) {
    if (!Array.isArray(data.lastUsers)) return;
    window.fastLoginUsers = data.lastUsers;
    UIController.showFastLoginDropdown(data.lastUsers);
}

// ---------- acciones de usuario ----------

export function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert(t("EMPTY_ERROR"));
        return;
    }

    window.username = username;
    localStorage.setItem("username", username);

    const res = WS.send({
        info: "UserAction",
        action: "4",
        username,
        password,
        uiValue: window.uiValue
    });

    if (res === -1) {
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("togglePassword").style.display = "none";
        PrintMessage("RELOAD", "#e92d3a", 1500);
        console.log("Error websocket cerrado");
    }
}

export function logout() {
    UIController.CloseDashboard();

    WS.send({
        info: "UserAction",
        action: "5",
        username: window.username,
        uiValue: window.uiValue
    });

    PrintMessage("SESSION_CLOSE","#B5B2B2",2000)
    UIController.hideUI();
}

// ---------- fast login & dropdown ----------

export function fastLogin() {
    WS.send({
        info: "getlastusersmini",
        uiValue: window.uiValue
    });
}

export const botonUser = document.getElementById("boton_user");
export function toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
  //  const botonUser = document.getElementById("boton_user");

    Keyboard.close();
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
        botonUser.classList.add("active");
        fastLogin();
    } else {
        dropdown.style.display = "none";
        botonUser.classList.remove("active");
    }
}

