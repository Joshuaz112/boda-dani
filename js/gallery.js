/**
 * gallery.js  —  Álbum colaborativo con Supabase Storage
 *
 * Flujo:
 *  1. El invitado selecciona una o varias imágenes.
 *  2. Cada imagen se comprime con Canvas antes de subir.
 *  3. Se sube al bucket "album" de Supabase Storage.
 *  4. Se guarda una fila en la tabla "album_photos" con la URL pública.
 *  5. La galería se recarga al abrir la vista (con skeletons de carga).
 *  6. Al hacer clic en una foto se abre un lightbox con flechas de navegación.
 *
 * Tabla requerida en Supabase (ver SUPABASE_SETUP.md)
 */

import { supabase } from './supabase.js';

// ──────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────
const BUCKET = 'album';
const TABLE = 'album_photos';
const MAX_DIM = 1400;   // px máximo por lado antes de comprimir
const JPEG_QUALITY = 0.82;   // 82% — buen balance calidad/peso

// Lista de fotos cargadas (para el lightbox con navegación)
let photoUrls = [];

// ──────────────────────────────────────────────────────────────
// 1. Comprimir imagen con Canvas
// ──────────────────────────────────────────────────────────────
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > MAX_DIM) {
                    height = Math.round(height * MAX_DIM / width);
                    width = MAX_DIM;
                } else if (height > MAX_DIM) {
                    width = Math.round(width * MAX_DIM / height);
                    height = MAX_DIM;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
                    'image/jpeg',
                    JPEG_QUALITY
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ──────────────────────────────────────────────────────────────
// 2. Subir una imagen al bucket y registrar la URL en la tabla
// ──────────────────────────────────────────────────────────────
async function uploadPhoto(file) {
    const blob = await compressImage(file);
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    const { error: dbError } = await supabase
        .from(TABLE)
        .insert({ url: publicUrl });

    if (dbError) throw dbError;

    return publicUrl;
}

// ──────────────────────────────────────────────────────────────
// 3. Lightbox con navegación por flechas
// ──────────────────────────────────────────────────────────────
let currentLbIndex = 0;

function openLightbox(index) {
    currentLbIndex = index;
    let lb = document.getElementById('gallery-lightbox');

    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'gallery-lightbox';
        document.body.appendChild(lb);
    }

    renderLightbox(lb);

    // Cerrar con Escape
    document.onkeydown = (e) => {
        if (e.key === 'Escape') lb.remove(), document.onkeydown = null;
        if (e.key === 'ArrowLeft') navigateLightbox(lb, -1);
        if (e.key === 'ArrowRight') navigateLightbox(lb, +1);
    };
}

function renderLightbox(lb) {
    const total = photoUrls.length;
    lb.innerHTML = `
        <button class="lb-close" title="Cerrar (Esc)">✕</button>

        ${total > 1 ? `
        <button class="lb-arrow lb-prev" title="Anterior (←)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
            </svg>
        </button>
        <button class="lb-arrow lb-next" title="Siguiente (→)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </button>` : ''}

        <img src="${photoUrls[currentLbIndex]}" alt="Foto boda Felipe & Daniela">

        ${total > 1 ? `<div class="lb-counter">${currentLbIndex + 1} / ${total}</div>` : ''}
    `;

    // Eventos
    lb.querySelector('.lb-close')?.addEventListener('click', () => {
        lb.remove();
        document.onkeydown = null;
    });
    lb.querySelector('.lb-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(lb, -1);
    });
    lb.querySelector('.lb-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(lb, +1);
    });

    // Clic en fondo cierra
    lb.addEventListener('click', (e) => {
        if (e.target === lb) { lb.remove(); document.onkeydown = null; }
    });
}

function navigateLightbox(lb, dir) {
    currentLbIndex = (currentLbIndex + dir + photoUrls.length) % photoUrls.length;
    renderLightbox(lb);
}

// ──────────────────────────────────────────────────────────────
// 4. Crear tarjeta de foto con ícono zoom
// ──────────────────────────────────────────────────────────────
function createPhotoCard(url, index) {
    const div = document.createElement('div');
    div.className = 'photo-card';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Foto boda Felipe & Daniela';
    img.loading = 'lazy';
    img.decoding = 'async';

    // Ícono de zoom
    const zoomIcon = document.createElement('div');
    zoomIcon.className = 'photo-zoom-icon';
    zoomIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="22" y2="22"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
        </svg>`;

    div.appendChild(img);
    div.appendChild(zoomIcon);

    div.addEventListener('click', () => openLightbox(index));
    return div;
}

// ──────────────────────────────────────────────────────────────
// 5. Mostrar skeletons mientras cargan las fotos
// ──────────────────────────────────────────────────────────────
function showSkeletons(gallery, count = 8) {
    gallery.innerHTML = '';
    const heights = [180, 240, 200, 280, 160, 220, 260, 190];
    for (let i = 0; i < count; i++) {
        const sk = document.createElement('div');
        sk.className = 'photo-skeleton';
        sk.style.height = heights[i % heights.length] + 'px';
        gallery.appendChild(sk);
    }
}

// ──────────────────────────────────────────────────────────────
// 6. Cargar fotos desde Supabase
// ──────────────────────────────────────────────────────────────
export async function loadPhotos() {
    const gallery = document.getElementById('photo-gallery');
    if (!gallery) return;

    showSkeletons(gallery);

    const { data, error } = await supabase
        .from(TABLE)
        .select('url, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar el álbum:', error.message);
        gallery.innerHTML = '';
        return;
    }

    gallery.innerHTML = '';

    if (!data || data.length === 0) {
        // Estado vacío elegante
        gallery.innerHTML = `
            <div class="gallery-empty" style="column-span:all;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p class="text-sm font-light">Sé el primero en subir una foto 📸</p>
                <p class="text-xs" style="color:#c8beae;">Las fotos que compartas aparecerán aquí</p>
            </div>`;
        return;
    }

    // Guardar URLs para el lightbox
    photoUrls = data.map(r => r.url);

    data.forEach((row, i) => {
        gallery.appendChild(createPhotoCard(row.url, i));
    });
}

// ──────────────────────────────────────────────────────────────
// 7. Inicialización — llamado desde navigation.js → onAlbumLoaded()
// ──────────────────────────────────────────────────────────────
export function initGallery() {
    const fileInput = document.getElementById('file-upload');
    const overlay = document.getElementById('upload-overlay');
    const overlayText = overlay?.querySelector('p');
    const spinner = overlay?.querySelector('.spinner');

    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        overlay?.classList.add('active');
        if (spinner) spinner.style.display = 'block';

        let uploaded = 0;
        for (let i = 0; i < files.length; i++) {
            if (overlayText) overlayText.innerText = `Subiendo ${i + 1} de ${files.length}...`;
            try {
                await uploadPhoto(files[i]);
                uploaded++;
            } catch (err) {
                console.error(`Error imagen ${i + 1}:`, err.message);
            }
        }

        if (overlayText) overlayText.innerText = uploaded > 0
            ? `¡${uploaded} foto${uploaded > 1 ? 's' : ''} subida${uploaded > 1 ? 's' : ''} con éxito! 🎉`
            : 'Hubo un error al subir las fotos.';
        if (spinner) spinner.style.display = 'none';

        setTimeout(async () => {
            overlay?.classList.remove('active');
            setTimeout(() => {
                if (overlayText) overlayText.innerText = 'Procesando fotos...';
                if (spinner) spinner.style.display = 'block';
                fileInput.value = '';
            }, 400);
            await loadPhotos();
        }, 2000);
    });

    loadPhotos();
}

// Exponer en window para navigation.js (que no es módulo ES)
window.initGallery = initGallery;
window.loadPhotos = loadPhotos;
