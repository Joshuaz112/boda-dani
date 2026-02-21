/**
 * guestbook.js  —  Muro de Deseos con Supabase
 *
 * Tabla requerida en Supabase (SQL):
 *   create table guestbook (
 *     id         bigint generated always as identity primary key,
 *     name       text      not null,
 *     message    text      not null,
 *     created_at timestamptz default now()
 *   );
 *   alter table guestbook enable row level security;
 *   create policy "public read"  on guestbook for select using (true);
 *   create policy "public write" on guestbook for insert with check (true);
 */

import { supabase } from './supabase.js';

const TABLE = 'guestbook';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

function renderMessage(data) {
    const div = document.createElement('div');
    div.className = 'bg-white p-5 rounded-xl shadow-sm border border-gray-100';
    div.innerHTML = `
        <p class="text-gray-600 font-light text-sm mb-3 leading-relaxed">"${escapeHtml(data.message)}"</p>
        <p class="text-right text-[10px] uppercase tracking-widest font-semibold text-gold">${escapeHtml(data.name)}</p>
    `;
    return div;
}

// ──────────────────────────────────────────────────────────────
// Cargar mensajes
// ──────────────────────────────────────────────────────────────
export async function loadGuestbook() {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const { data, error } = await supabase
        .from(TABLE)
        .select('name, message, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar mensajes:', error.message);
        return;
    }

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

// ──────────────────────────────────────────────────────────────
// Inicialización — llamado desde navigation.js → onHomeLoaded()
// ──────────────────────────────────────────────────────────────
export function initGuestbook() {
    // Cargar mensajes existentes
    loadGuestbook();

    // Manejar envío del formulario
    const form = document.getElementById('guestbook-form');
    const gbBtn = document.getElementById('gb-submit');
    if (!form) return;

    // Evitar doble binding si se llama varias veces
    form.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('gb-name')?.value.trim();
        const message = document.getElementById('gb-message')?.value.trim();
        if (!name || !message) return;

        const original = gbBtn.innerText;
        gbBtn.disabled = true;
        gbBtn.innerText = 'ENVIANDO...';

        const { error } = await supabase.from(TABLE).insert({ name, message });

        if (error) {
            console.error('Error al enviar mensaje:', error.message);
            alert('Hubo un error al enviar tu mensaje. Intenta de nuevo.');
        } else {
            form.reset();
            await loadGuestbook();
        }

        gbBtn.disabled = false;
        gbBtn.innerText = original;
    };
}

// Exponer en window para navigation.js (que no es módulo ES)
window.initGuestbook = initGuestbook;
