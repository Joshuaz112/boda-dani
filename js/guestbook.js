/**
 * guestbook.js
 * Muro de deseos:
 *  - Envío de mensajes a Firestore
 *  - Escucha en tiempo real y renderizado de mensajes
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
// Referencia a la colección en Firestore
// ──────────────────────────────────────────────────────────────
const getGuestbookCol = () =>
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'guestbook');

// ──────────────────────────────────────────────────────────────
// Renderizar un mensaje individual
// ──────────────────────────────────────────────────────────────
function renderMessage(data) {
    const div = document.createElement('div');
    div.className = 'bg-white p-5 rounded-xl shadow-sm border border-gray-100';
    div.innerHTML = `
        <p class="text-gray-600 font-light text-sm mb-3 leading-relaxed">"${escapeHtml(data.message)}"</p>
        <p class="text-right text-[10px] uppercase tracking-widest font-semibold text-gold">${escapeHtml(data.name)}</p>
    `;
    return div;
}

/** Escapa caracteres especiales para evitar XSS. */
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ──────────────────────────────────────────────────────────────
// Cargar y escuchar mensajes en tiempo real
// ──────────────────────────────────────────────────────────────
export function loadGuestbook() {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const q = query(getGuestbookCol(), orderBy('createdAt', 'desc'));

    onSnapshot(q, (snapshot) => {
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <p class="text-center text-gray-400 text-sm italic">Sé el primero en dejar un deseo.</p>
                </div>`;
            return;
        }

        snapshot.forEach(doc => {
            container.appendChild(renderMessage(doc.data()));
        });
    }, (error) => {
        console.error('Error al cargar el muro de deseos:', error);
    });
}

// ──────────────────────────────────────────────────────────────
// Enviar mensaje
// ──────────────────────────────────────────────────────────────
const form = document.getElementById('guestbook-form');
const gbBtn = document.getElementById('gb-submit');

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // currentUser puede ser null si Firebase aún no autenticó
    if (!currentUser) {
        alert('Conectando con el servidor, intenta de nuevo en unos segundos...');
        return;
    }

    const name = document.getElementById('gb-name').value.trim();
    const message = document.getElementById('gb-message').value.trim();
    if (!name || !message) return;

    const originalText = gbBtn.innerText;
    gbBtn.disabled = true;
    gbBtn.innerText = 'ENVIANDO...';

    try {
        await addDoc(getGuestbookCol(), {
            name,
            message,
            createdAt: serverTimestamp()
        });
        e.target.reset();
    } catch (err) {
        console.error('Error al enviar mensaje:', err);
        alert('Hubo un error al enviar tu mensaje. Intenta de nuevo.');
    } finally {
        gbBtn.disabled = false;
        gbBtn.innerText = originalText;
    }
});

// Iniciar escucha cuando Firebase esté listo
document.addEventListener('firebase:ready', () => {
    loadGuestbook();
});
