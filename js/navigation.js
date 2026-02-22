/**
 * navigation.js
 * SPA navigation + música + FAB móvil + bottom nav sync
 */

// ──────────────────────────────────────────────────────────────
// Referencias DOM
// ──────────────────────────────────────────────────────────────
const mainNav = document.getElementById('main-nav');
const welcomeScreen = document.getElementById('welcome-screen');
const openBtn = document.getElementById('open-invitation');
const bgMusic = document.getElementById('bg-music');
const musicToggleDesktop = document.getElementById('music-toggle');
const musicAnimation = document.getElementById('music-animation');

// FAB música (móvil)
const musicFab = document.getElementById('music-fab');
const fabIconNote = document.getElementById('fab-icon-note');
const fabMusicBars = document.getElementById('fab-music-bars');

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
async function loadPage(viewId) {
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
 */
function onHomeLoaded() {
    // Countdown
    if (typeof initCountdown === 'function') initCountdown();
    // Guestbook
    if (typeof window.initGuestbook === 'function') window.initGuestbook();

    // Reveal animation observer
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
            { threshold: 0.15 }
        );
        revealEls.forEach(el => obs.observe(el));
    }
}

function onAlbumLoaded() {
    if (typeof window.initGallery === 'function') window.initGallery();
}

function onInvitationLoaded() {
    if (typeof window.initRsvp === 'function') window.initRsvp();
}

// ──────────────────────────────────────────────────────────────
// 2. Cambio de Vista (SPA)
// ──────────────────────────────────────────────────────────────
window.switchView = async function (viewId) {
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
    requestAnimationFrame(() => targetView.classList.add('active'));

    // Marcar enlace activo (top nav desktop)
    document.querySelectorAll(`.nav-link[data-target="${viewId}"]`).forEach(el => el.classList.add('active'));

    // ★ Sincronizar bottom nav activo
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    targetView.scrollTo(0, 0);

    // Actualizar hash en URL sin recargar para compartir enlace
    if (window.location.hash !== `#${viewId}`) {
        history.pushState(null, '', `#${viewId}`);
    }

};

// ──────────────────────────────────────────────────────────────
// 3. Carga inicial + enrutamiento por URL
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Leer vista desde URL: ?view=album  o  #album
    const params = new URLSearchParams(window.location.search);
    const hashView = window.location.hash.replace('#', '');
    const VALID = ['home', 'album', 'invitation'];
    const startView = VALID.includes(params.get('view')) ? params.get('view')
        : VALID.includes(hashView) ? hashView
            : 'home';

    loadPage(startView).then(() => switchView(startView));

    // Back-to-top: escuchar scroll en todas las view-sections
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        document.querySelectorAll('.view-section').forEach(section => {
            section.addEventListener('scroll', () => {
                backToTop.classList.toggle('visible', section.scrollTop > 300);
            }, { passive: true });
        });
    }
});

// ──────────────────────────────────────────────────────────────
// 4. Pantalla de bienvenida
// ──────────────────────────────────────────────────────────────
openBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('opened');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        document.body.style.overflow = '';
        mainNav.classList.remove('translate-y-[-100%]');
    }, 1000);

    // Intentar reproducir música
    bgMusic.volume = 0.4;
    bgMusic.play()
        .then(() => { isPlaying = true; updateMusicUI(); })
        .catch(() => { /* autoplay bloqueado */ });
});

// ──────────────────────────────────────────────────────────────
// 5. Menú Móvil — ya no se usa (bottom-nav lo reemplaza)
//    Mantenemos la función para no romper posibles referencias.
// ──────────────────────────────────────────────────────────────
window.closeMobileMenu = () => { /* no-op */ };

// ──────────────────────────────────────────────────────────────
// 6. Control de Música
// ──────────────────────────────────────────────────────────────

/** Actualiza TODOS los indicadores visuales de música */
function updateMusicUI() {
    // ── Desktop: barras animadas en el nav ──
    if (musicAnimation) {
        musicAnimation.style.opacity = isPlaying ? '1' : '0.3';
    }

    // ── Móvil FAB: alterna nota ↔ barras ──
    if (fabIconNote && fabMusicBars) {
        if (isPlaying) {
            fabIconNote.classList.add('hidden');
            fabMusicBars.classList.remove('hidden');
        } else {
            fabIconNote.classList.remove('hidden');
            fabMusicBars.classList.add('hidden');
        }
    }

    // ── Clases en el FAB ──
    if (musicFab) {
        musicFab.classList.toggle('playing', isPlaying);
    }
}

function toggleMusic() {
    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
    } else {
        bgMusic.play().catch(() => { });
        isPlaying = true;
    }
    updateMusicUI();
}

// Conectar botón desktop
musicToggleDesktop?.addEventListener('click', toggleMusic);

// Conectar FAB móvil
musicFab?.addEventListener('click', toggleMusic);
