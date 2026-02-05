export const availableLangs = ["es", "ro", "en", "fr"];

export let lang = "es"; 

export function translateDOM() {
	document.querySelectorAll("[language]").forEach(el => {
		const key = el.getAttribute("language");
		if (langs[lang][key]) {
			el.innerText = langs[lang][key];
		}
	});
}

export function setLang(newLang) {
	if (!availableLangs.includes(newLang)) return;
	lang = newLang;
	translateDOM();
}

export function t(key) {
	return langs[lang][key] ?? key;
}
window.t = t;

export const langs = {
	es: {
		USER_LABEL: "Usuario",
		ROLE_LABEL: "Rol",
		LOGIN_TITLE: "Iniciar Sesión",
		PASSWORD_LABEL: "Contraseña",
		LOGIN_BUTTON: "Acceder",
		LOGOUT_BUTTON: "Cerrar sesión",
		TABLE_USER: "Usuario",
		TABLE_PASSWORD: "Contraseña",
		TABLE_ROLE: "Rol",
		TABLE_LAST_LOGIN: "Último Login",
		EDIT: "Editar",
		DELETE: "Borrar",
		OPERARIO_TEXT: "Operario",
		ADMIN_TEXT: "Administrador",
		REGISTRAR_BUTTON: "Registrar",
		CANCELAR_BUTTON: "Cancelar",
		CREATE_TITLE: "Crear Usuario",

		// Mensajes de autenticación
		LOGIN_ERROR: "Usuario/Contraseña Incorrectos",
		USER_EXISTS: "Ya existe este usuario",
		LOGIN_SUCCESS: "SESIÓN INICIADA",
		SESSION_CLOSE : "SESIÓN CERRADA",

		// WebSocket + UI CFG
		ERROR_CFG: "Error leyendo Dash.cfg",
		ERROR_UIVALUE: "No se encontró el UIValue",

		// Confirmaciones & errores
		CONFIRM_EXIT: "¿Seguro que quieres salir?",
		EMPTY_ERROR: "Por favor, ingresa tanto el nombre de usuario como la contraseña.",
		RELOAD: "No hay conexión F5",
		RECONNECTING :"Intentando reconectar..."
	},

	ro: {
		USER_LABEL: "Utilizator",
		ROLE_LABEL: "Rol",
		LOGIN_TITLE: "Autentificare",
		PASSWORD_LABEL: "Parolă",
		LOGIN_BUTTON: "Acces",
		LOGOUT_BUTTON: "Deconectare",
		TABLE_USER: "Utilizator",
		TABLE_PASSWORD: "Parolă",
		TABLE_ROLE: "Rol",
		TABLE_LAST_LOGIN: "Ultima autentificare",
		EDIT: "Editare",
		DELETE: "Ștergere",
		OPERARIO_TEXT: "Operator",
		ADMIN_TEXT: "Administrator",
		REGISTRAR_BUTTON: "Înregistrare",
		CANCELAR_BUTTON: "Anulare",
		CREATE_TITLE: "Creare Utilizator",

		LOGIN_ERROR: "Utilizator/Parolă incorecte",
		USER_EXISTS: "Acest utilizator există deja",
		LOGIN_SUCCESS: "Autentificare reușită",
		SESSION_CLOSE : "Sesiune închisă",

		ERROR_CFG: "Eroare la citirea fișierului Dash.cfg",
		ERROR_UIVALUE: "Nu s-a găsit valoarea UIValue",

		CONFIRM_EXIT: "Sigur vrei să ieși?",
		EMPTY_ERROR: "Introduceți numele utilizatorului și parola.",
		RELOAD: "Nu există conexiune — F5",
		RECONNECTING :"Se încearcă reconectarea..."
	},

	en: {
		USER_LABEL: "User",
		ROLE_LABEL: "Role",
		LOGIN_TITLE: "Login",
		PASSWORD_LABEL: "Password",
		LOGIN_BUTTON: "Sign in",
		LOGOUT_BUTTON: "Logout",
		TABLE_USER: "User",
		TABLE_PASSWORD: "Password",
		TABLE_ROLE: "Role",
		TABLE_LAST_LOGIN: "Last Login",
		EDIT: "Edit",
		DELETE: "Delete",
		OPERARIO_TEXT: "Operator",
		ADMIN_TEXT: "Admin",
		REGISTRAR_BUTTON: "Register",
		CANCELAR_BUTTON: "Cancel",
		CREATE_TITLE: "Create User",

		LOGIN_ERROR: "Incorrect Username/Password",
		USER_EXISTS: "This user already exists",
		LOGIN_SUCCESS: "LOGIN SUCCESS",
		SESSION_CLOSE : "SESSION CLOSED",

		ERROR_CFG: "Error reading Dash.cfg",
		ERROR_UIVALUE: "UIValue not found",

		CONFIRM_EXIT: "Are you sure you want to exit?",
		EMPTY_ERROR: "Please enter both username and password.",
		RELOAD: "No connection — press F5",
		RECONNECTING :"Attempting to reconnect..."
	},

	fr: {
		USER_LABEL: "Utilisateur",
		ROLE_LABEL: "Rôle",
		LOGIN_TITLE: "Connexion",
		PASSWORD_LABEL: "Mot de passe",
		LOGIN_BUTTON: "Se connecter",
		LOGOUT_BUTTON: "Déconnexion",
		TABLE_USER: "Utilisateur",
		TABLE_PASSWORD: "Mot de passe",
		TABLE_ROLE: "Rôle",
		TABLE_LAST_LOGIN: "Dernière connexion",
		EDIT: "Modifier",
		DELETE: "Supprimer",
		OPERARIO_TEXT: "Opérateur",
		ADMIN_TEXT: "Administrateur",
		REGISTRAR_BUTTON: "Enregistrer",
		CANCELAR_BUTTON: "Annuler",
		CREATE_TITLE: "Créer un utilisateur",

		LOGIN_ERROR: "Nom d’utilisateur/Mot de passe incorrect",
		USER_EXISTS: "Cet utilisateur existe déjà",
		LOGIN_SUCCESS: "SESSION OUVERTE",
		SESSION_CLOSE : "SESSION FERMÉE",

		ERROR_CFG: "Erreur lors de la lecture de Dash.cfg",
		ERROR_UIVALUE: "UIValue introuvable",

		CONFIRM_EXIT: "Êtes-vous sûr de vouloir quitter ?",
		EMPTY_ERROR: "Veuillez saisir un nom d’utilisateur et un mot de passe.",
		RELOAD: "Pas de connexion — F5",
		RECONNECTING :"Tentative de reconnexion..."
	}
};
