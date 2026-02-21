/**
 * firebase.js
 * Inicializa Firebase y exporta las instancias de auth y db.
 *
 * IMPORTANTE: Reemplaza el objeto firebaseConfig con tus propias
 * credenciales del proyecto Firebase antes de publicar.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// 1. Configuración del proyecto Firebase
//    Reemplaza estos valores con los de tu consola Firebase:
//    https://console.firebase.google.com/
// ──────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// ID de la aplicación (usado como namespace en Firestore)
export const APP_ID = "boda-felipe-daniela-2026";

// ──────────────────────────────────────────────────────────────
// 2. Inicialización
// ──────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ──────────────────────────────────────────────────────────────
// 3. Autenticación anónima
//    Permite leer/escribir en Firestore sin cuenta de usuario.
//    Asegúrate de habilitarla en Firebase Console → Auth → Sign-in.
// ──────────────────────────────────────────────────────────────
export let currentUser = null;

export const initAuth = async () => {
    try {
        // Si hay un token personalizado inyectado (entorno Canvas/Studio)
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Error de autenticación Firebase:", error);
    }
};

// Observador de estado de sesión
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Disparamos un evento global para que los módulos sepan que auth está listo
        document.dispatchEvent(new CustomEvent('firebase:ready', { detail: { user } }));
    }
});

// Iniciar autenticación al cargar
initAuth();
