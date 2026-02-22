/**
 * guestbook.js  —  Muro de Deseos con Supabase + toast notifications
 */

import { supabase } from './supabase.js';

const TABLE = 'guestbook';

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

function renderMessage(data) {
    const div = document.createElement('div');
    div.className = 'message-card';
    div.innerHTML = `
        <p class="text-gray-600 font-light text-sm mb-3 leading-relaxed mt-6">"${escapeHtml(data.message)}"</p>
        <p class="text-right text-[10px] uppercase tracking-widest font-semibold text-gold">${escapeHtml(data.name)}</p>
    `;
    return div;
}

export async function loadGuestbook() {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const { data, error } = await supabase
        .from(TABLE)
        .select('name, message, created_at')
        .order('created_at', { ascending: false });

    if (error) { console.error('Error al cargar mensajes:', error.message); return; }

    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-32">
                <p class="text-center text-gray-400 text-sm italic">Sé el primero en dejar un deseo.</p>
            </div>`;
        return;
    }
    data.forEach(row => container.appendChild(renderMessage(row)));
}

export function initGuestbook() {
    loadGuestbook();

    const form = document.getElementById('guestbook-form');
    const gbBtn = document.getElementById('gb-submit');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('gb-name')?.value.trim();
        const message = document.getElementById('gb-message')?.value.trim();

        if (!name || !message) {
            window.showToast?.('Por favor completa tu nombre y mensaje.', 'warning');
            return;
        }

        const original = gbBtn.innerText;
        gbBtn.disabled = true;
        gbBtn.innerText = 'ENVIANDO...';

        const { error } = await supabase.from(TABLE).insert({ name, message });

        if (error) {
            console.error('Error guestbook:', error.message);
            window.showToast?.('Hubo un error al enviar tu mensaje. Intenta de nuevo.', 'error');
        } else {
            window.showToast?.('¡Tu deseo fue enviado! 💌', 'success');
            form.reset();
            await loadGuestbook();
        }

        gbBtn.disabled = false;
        gbBtn.innerText = original;
    };
}

window.initGuestbook = initGuestbook;
