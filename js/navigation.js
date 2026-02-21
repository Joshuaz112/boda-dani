/**
 * navigation.js
 * Lógica de navegación SPA (Single Page Application):
 *  - Carga dinámica de vistas desde pages/*.html (fetch)
 *  - Cambiar entre vistas (home, album, invitation)
 *  - Mostrar/ocultar menú móvil
 *  - Pantalla de bienvenida
 *  - Control de música de fondo
 */

// ──────────────────────────────────────────────────────────────
// Referencias DOM
// ──────────────────────────────────────────────────────────────
const mainNav = document.getElementById('main-nav');
const welcomeScreen = document.getElementById('welcome-screen');
const openBtn = document.getElementById('open-invitation');
const bgMusic = document.getElementById('bg-music');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const musicToggleDesktop = document.getElementById('music-toggle');
const musicToggleMobile = document.getElementById('mobile-music-toggle');
const musicAnimation = document.getElementById('music-animation');

let isPlaying = false;

// Mapa de vistas → archivo en pages/
const PAGE_MAP = {
    home: 'pages/home.html',
    album: 'pages/album.html',
    invitation: 'pages/invitation.html',
};

// Caché: evita volver a hacer fetch si ya se cargó
const loadedPages = {};

// ──────────────────────────────────────────────────────────────
// 1. Carga dinámica de contenido
// ──────────────────────────────────────────────────────────────

/**
 * Carga el fragmento HTML de una vista desde pages/*.html
 * si aún no ha sido cargado, y lo inyecta en el contenedor.
 * @param {string} viewId - 'home' | 'album' | 'invitation'
 */
async function loadPage(viewId) {
    // Si ya está cargado, no hacer nada
    if (loadedPages[viewId]) return;

    const url = PAGE_MAP[viewId];
    if (!url) return;

    try {
        const res = await fetch(url);
        const html = await res.text();
        const container = document.getElementById('view-' + viewId);
        if (container) {
            container.innerHTML = html;
            loadedPages[viewId] = true;

            // Disparar scripts de inicialización que dependen del DOM
            // de esta vista (p.ej. countdown, Firebase, reveal observer)
            if (viewId === 'home') onHomeLoaded();
            if (viewId === 'album') onAlbumLoaded();
            if (viewId === 'invitation') onInvitationLoaded();
        }
    } catch (err) {
        console.warn(`No se pudo cargar pages/${viewId}.html`, err);
    }
}

/**
 * Hooks llamados después de que cada página es inyectada en el DOM.
 * Aquí se pueden re-inicializar cosas que dependan del contenido.
 */
function onHomeLoaded() {
    // Reiniciar observer de scroll reveal si existe
    if (typeof initReveal === 'function') initReveal();
    // Reiniciar countdown si existe
    if (typeof initCountdown === 'function') initCountdown();
    // Reiniciar guestbook si existe
    if (typeof initGuestbook === 'function') initGuestbook();
}

function onAlbumLoaded() {
    // Reiniciar galería de fotos si existe
    if (typeof initGallery === 'function') initGallery();
    if (typeof loadPhotos === 'function') loadPhotos();
}

function onInvitationLoaded() {
    // Reiniciar formulario RSVP si existe
    if (typeof initRsvp === 'function') initRsvp();
}

// ──────────────────────────────────────────────────────────────
// 2. Cambio de Vista (SPA)
// ──────────────────────────────────────────────────────────────

/**
 * Carga (si es necesario) y muestra la vista solicitada.
 * @param {string} viewId - 'home' | 'album' | 'invitation'
 */
window.switchView = async function (viewId) {
    // Primero cargar el contenido si aún no está
    await loadPage(viewId);

    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
        setTimeout(() => {
            if (!el.classList.contains('active')) el.style.display = 'none';
        }, 600);
    });

    // Quitar clase activa del nav
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // Mostrar la vista solicitada
    const targetView = document.getElementById('view-' + viewId);
    if (!targetView) return;
    targetView.style.display = 'block';

    // Pequeño delay para que la transición CSS funcione
    requestAnimationFrame(() => {
        targetView.classList.add('active');
    });

    // Marcar enlace activo en el nav
    document.querySelectorAll(`.nav-link[data-target="${viewId}"]`).forEach(el => {
        el.classList.add('active');
    });

    // Scroll al tope de la vista
    targetView.scrollTo(0, 0);
};

// ──────────────────────────────────────────────────────────────
// 3. Carga inicial — precargar la vista "home" al arrancar
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadPage('home');
});

// ──────────────────────────────────────────────────────────────
// 4. Pantalla de bienvenida
// ──────────────────────────────────────────────────────────────
openBtn.addEventListener('click', () => {
    // Fade-out pantalla de bienvenida
    welcomeScreen.classList.add('opened');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
        mainNav.classList.remove('translate-y-[-100%]'); // Bajar nav
    }, 1000);

    // Intentar reproducir música
    bgMusic.volume = 0.4;
    bgMusic.play()
        .then(() => { isPlaying = true; })
        .catch(() => { /* El usuario bloqueó el audio automático */ });
});

// ──────────────────────────────────────────────────────────────
// 5. Menú Móvil
// ──────────────────────────────────────────────────────────────
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
});

/** Cierra el menú móvil (llamado desde los botones del menú). */
window.closeMobileMenu = () => {
    mobileMenu.classList.remove('open');
};

// ──────────────────────────────────────────────────────────────
// 6. Control de Música
// ──────────────────────────────────────────────────────────────
function toggleMusic() {
    if (isPlaying) {
        bgMusic.pause();
        if (musicAnimation) musicAnimation.style.opacity = '0.3';
        isPlaying = false;
    } else {
        bgMusic.play().catch(() => { });
        if (musicAnimation) musicAnimation.style.opacity = '1';
        isPlaying = true;
    }
}

musicToggleDesktop?.addEventListener('click', toggleMusic);
musicToggleMobile?.addEventListener('click', toggleMusic);
