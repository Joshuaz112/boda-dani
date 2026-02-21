/**
 * gallery.js
 * Álbum colaborativo:
 *  - Comprime imágenes antes de subirlas
 *  - Sube imágenes a Firestore (base64)
 *  - Muestra el álbum en tiempo real con layout masonry
 */

import { db, APP_ID, currentUser } from './firebase.js';
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// Referencias DOM
// ──────────────────────────────────────────────────────────────
const fileInput = document.getElementById('file-upload');
const overlay = document.getElementById('upload-overlay');
const overlayText = overlay?.querySelector('p');
const spinner = overlay?.querySelector('.spinner');
const gallery = document.getElementById('photo-gallery');

// ──────────────────────────────────────────────────────────────
// Referencia a la colección
// ──────────────────────────────────────────────────────────────
const getPhotosCol = () =>
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'photos');

// ──────────────────────────────────────────────────────────────
// 1. Comprimir imagen antes de guardar
// ──────────────────────────────────────────────────────────────
const MAX_DIMENSION = 800; // px — equilibrio entre calidad y tamaño
const JPEG_QUALITY = 0.70; // 70%

/**
 * Convierte un File de imagen a base64 JPEG comprimido.
 * @param {File} file
 * @returns {Promise<string>} dataURL base64
 */
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Reducir dimensiones si supera el máximo
                if (width > height && width > MAX_DIMENSION) {
                    height = Math.round(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                } else if (height > MAX_DIMENSION) {
                    width = Math.round(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
            };

            img.onerror = reject;
        };

        reader.onerror = reject;
    });
}

// ──────────────────────────────────────────────────────────────
// 2. Subida de múltiples imágenes
// ──────────────────────────────────────────────────────────────
fileInput?.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length || !currentUser) return;

    // Mostrar overlay
    overlay.classList.add('active');
    if (overlayText) overlayText.innerText = 'Procesando fotos...';
    if (spinner) spinner.style.display = 'block';

    const col = getPhotosCol();

    for (let i = 0; i < files.length; i++) {
        if (overlayText)
            overlayText.innerText = `Subiendo ${i + 1} de ${files.length}...`;
        try {
            const base64 = await compressImage(files[i]);
            await addDoc(col, {
                url: base64,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error(`Error al procesar imagen ${i + 1}:`, err);
        }
    }

    // Feedback de éxito
    if (overlayText) overlayText.innerText = '¡Fotos subidas con éxito!';
    if (spinner) spinner.style.display = 'none';

    setTimeout(() => {
        overlay.classList.remove('active');
        // Resetear overlay para la próxima subida
        setTimeout(() => {
            if (overlayText) overlayText.innerText = 'Procesando fotos...';
            if (spinner) spinner.style.display = 'block';
            fileInput.value = '';
        }, 400);
    }, 1500);
});

// ──────────────────────────────────────────────────────────────
// 3. Cargar y escuchar fotos en tiempo real
// ──────────────────────────────────────────────────────────────

/** Crea un elemento tarjeta de foto. */
function createPhotoCard(data) {
    const div = document.createElement('div');
    div.className = 'photo-card';
    const img = document.createElement('img');
    img.src = data.url;
    img.alt = 'Boda Felipe y Daniela';
    img.loading = 'lazy';
    div.appendChild(img);
    return div;
}

export function loadPhotos() {
    if (!gallery) return;

    const q = query(getPhotosCol(), orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return; // Mantener los placeholders si no hay fotos

        gallery.innerHTML = ''; // Reemplazar placeholders con fotos reales
        snapshot.forEach(doc => {
            gallery.appendChild(createPhotoCard(doc.data()));
        });
    }, (error) => {
        console.error('Error al cargar el álbum:', error);
    });
}

// Iniciar cuando Firebase esté listo
document.addEventListener('firebase:ready', () => {
    loadPhotos();
});
