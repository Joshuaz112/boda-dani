/**
 * admin.js  —  Panel de control con Supabase
 *
 * Acceso: botón invisible esquina inferior derecha
 * Contraseña: boda26
 *
 * Módulos cargados:
 *  - Dashboard (stats)
 *  - RSVP table
 *  - Guestbook list
 *  - Photos admin
 *  - Agenda (localStorage)
 */

import { supabase } from './supabase.js';

const RSVP_TABLE = 'rsvps';
const GUESTBOOK_TABLE = 'guestbook';
const PHOTOS_TABLE = 'album_photos';
const STORAGE_BUCKET = 'album';
const ADMIN_PASSWORD = 'boda26';

// ─── Cache ───────────────────────────────────────────────────
let allRsvps = [];
let allMessages = [];
let allPhotos = [];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function escapeHtml(t) {
    const m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(t || '').replace(/[&<>"']/g, c => m[c]);
}

// ─────────────────────────────────────────────────────────────
// Abrir / Cerrar modal
// ─────────────────────────────────────────────────────────────
window.openAdminPanel = function () {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.getElementById('admin-password')?.focus();
};

window.closeAdminPanel = function () {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-login-box').style.display = '';
    document.getElementById('admin-panel').classList.add('hidden');
};

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────
window.checkAdminPassword = async function () {
    const pwd = document.getElementById('admin-password')?.value;
    if (pwd !== ADMIN_PASSWORD) {
        alert('Contraseña incorrecta');
        return;
    }
    document.getElementById('admin-login-box').style.display = 'none';
    document.getElementById('admin-panel').classList.remove('hidden');
    await loadAllData();
};

// ─────────────────────────────────────────────────────────────
// Cargar todos los datos
// ─────────────────────────────────────────────────────────────
async function loadAllData() {
    await Promise.all([loadRsvps(), loadMessages(), loadPhotosAdmin()]);
    renderDashboard();
    renderAgenda();
}

// ── RSVP ─────────────────────────────────────────────────────
async function loadRsvps() {
    const { data, error } = await supabase
        .from(RSVP_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
    if (!error) allRsvps = data || [];
    renderRsvpTable(allRsvps);
}

function renderRsvpTable(rows) {
    const tbody = document.getElementById('rsvp-table-body');
    if (!tbody) return;
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-white/30 text-sm italic">Sin datos aún.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(d => {
        const si = d.attendance === 'si';
        const badge = si
            ? '<span class="badge-si">SÍ</span>'
            : '<span class="badge-no">NO</span>';
        const fecha = d.created_at ? new Date(d.created_at).toLocaleDateString('es-CL') : '—';
        return `<tr>
            <td>${escapeHtml(d.name)}</td>
            <td>${badge}</td>
            <td>${si ? d.guests : '—'}</td>
            <td class="text-white/50 text-xs">${escapeHtml(d.notes)}</td>
            <td class="text-white/40 text-xs">${fecha}</td>
            <td><button class="btn-delete" onclick="deleteRsvp(${d.id})">✕</button></td>
        </tr>`;
    }).join('');
}

window.filterRsvp = function () {
    const q = document.getElementById('rsvp-search')?.value.toLowerCase() || '';
    const fil = document.getElementById('rsvp-filter')?.value || 'all';
    const filtered = allRsvps.filter(r => {
        const matchName = r.name.toLowerCase().includes(q);
        const matchFil = fil === 'all' || r.attendance === fil;
        return matchName && matchFil;
    });
    renderRsvpTable(filtered);
};

window.deleteRsvp = async function (id) {
    if (!confirm('¿Eliminar este RSVP?')) return;
    await supabase.from(RSVP_TABLE).delete().eq('id', id);
    await loadRsvps();
    renderDashboard();
};

// ── Mensajes ──────────────────────────────────────────────────
async function loadMessages() {
    const { data, error } = await supabase
        .from(GUESTBOOK_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
    if (!error) allMessages = data || [];
    renderGuestbookAdmin(allMessages);
}

function renderGuestbookAdmin(rows) {
    const list = document.getElementById('gb-admin-list');
    if (!list) return;
    if (!rows.length) {
        list.innerHTML = '<p class="text-white/30 text-sm italic text-center py-8">Sin mensajes aún.</p>';
        return;
    }
    list.innerHTML = rows.map(d => `
        <div class="gb-admin-card">
            <div class="flex justify-between items-start">
                <p class="text-white/80 text-sm font-semibold mb-1">${escapeHtml(d.name)}</p>
                <button class="btn-delete" onclick="deleteMessage(${d.id})">✕</button>
            </div>
            <p class="text-white/50 text-xs leading-relaxed">"${escapeHtml(d.message)}"</p>
        </div>`).join('');
}

window.filterGuestbook = function () {
    const q = document.getElementById('gb-search')?.value.toLowerCase() || '';
    renderGuestbookAdmin(allMessages.filter(m =>
        m.name.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
    ));
};

window.deleteMessage = async function (id) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    await supabase.from(GUESTBOOK_TABLE).delete().eq('id', id);
    await loadMessages();
    renderDashboard();
};

// ── Fotos ─────────────────────────────────────────────────────
async function loadPhotosAdmin() {
    const { data, error } = await supabase
        .from(PHOTOS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
    if (!error) allPhotos = data || [];
    renderPhotosAdmin(allPhotos);
}

function renderPhotosAdmin(rows) {
    const grid = document.getElementById('admin-photo-grid');
    const count = document.getElementById('photo-count');
    if (count) count.innerText = rows.length;
    if (!grid) return;
    if (!rows.length) {
        grid.innerHTML = '<p class="text-white/30 text-sm italic col-span-full text-center py-8">Sin fotos aún.</p>';
        return;
    }
    grid.innerHTML = rows.map(d => `
        <div class="admin-photo-item">
            <img src="${escapeHtml(d.url)}" loading="lazy">
            <button class="photo-delete-btn" onclick="deletePhoto(${d.id}, '${escapeHtml(d.url)}')">✕</button>
        </div>`).join('');
}

window.deletePhoto = async function (id, url) {
    if (!confirm('¿Eliminar esta foto?')) return;
    // Extraer filename del Storage del URL público
    try {
        const fileName = url.split('/').pop();
        await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
    } catch (_) { /* si falla el storage igual borramos la fila */ }
    await supabase.from(PHOTOS_TABLE).delete().eq('id', id);
    await loadPhotosAdmin();
    renderDashboard();
};

window.deleteAllPhotos = async function () {
    if (!confirm('¿Eliminar TODAS las fotos? Esta acción no se puede deshacer.')) return;
    const filenames = allPhotos.map(p => p.url.split('/').pop());
    if (filenames.length) {
        await supabase.storage.from(STORAGE_BUCKET).remove(filenames);
    }
    await supabase.from(PHOTOS_TABLE).delete().neq('id', 0);
    await loadPhotosAdmin();
    renderDashboard();
};

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard() {
    const confirmados = allRsvps.filter(r => r.attendance === 'si').length;
    const noAsisten = allRsvps.filter(r => r.attendance === 'no').length;
    const totalPases = allRsvps.filter(r => r.attendance === 'si')
        .reduce((s, r) => s + (parseInt(r.guests) || 0), 0);
    const total = allRsvps.length;
    const pct = total > 0 ? Math.round((confirmados / total) * 100) : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('stat-confirmados', confirmados);
    set('stat-no-asisten', noAsisten);
    set('stat-pases', totalPases);
    set('stat-mensajes', allMessages.length);
    set('attend-pct', pct + '%');

    const bar = document.getElementById('attend-bar');
    if (bar) bar.style.width = pct + '%';
}

// ── Tabs ──────────────────────────────────────────────────────
window.switchAdminTab = function (tab, btn) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('tab-' + tab);
    if (el) el.classList.remove('hidden');
    if (btn) btn.classList.add('active');
};

// ── Exportar CSV ──────────────────────────────────────────────
window.exportCSV = function () {
    const rows = [['Nombre', 'Asiste', 'Pases', 'Notas', 'Fecha'],
    ...allRsvps.map(r => [r.name, r.attendance, r.guests, r.notes || '',
    r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : ''])
    ];
    downloadCSV(rows, 'rsvp_boda.csv');
};

window.exportMensajes = function () {
    const rows = [['Nombre', 'Mensaje', 'Fecha'],
    ...allMessages.map(m => [m.name, m.message,
    m.created_at ? new Date(m.created_at).toLocaleDateString('es-CL') : ''])
    ];
    downloadCSV(rows, 'mensajes_boda.csv');
};

function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = filename;
    a.click();
}

// ── Agenda (localStorage) ─────────────────────────────────────
function renderAgenda() {
    const tasks = JSON.parse(localStorage.getItem('boda-agenda') || '[]');
    const list = document.getElementById('agenda-list');
    if (!list) return;
    list.innerHTML = tasks.length === 0
        ? '<p class="text-white/30 text-xs text-center py-4 italic">Sin tareas aún.</p>'
        : tasks.map((t, i) => `
            <div class="agenda-task ${t.done ? 'done' : ''}">
                <input type="checkbox" ${t.done ? 'checked' : ''}
                    onchange="toggleAgendaTask(${i})">
                <span>${escapeHtml(t.text)}</span>
                <button class="btn-delete ml-auto" onclick="removeAgendaTask(${i})">✕</button>
            </div>`).join('');
}

window.addAgendaTask = function () {
    const input = document.getElementById('new-task-input');
    const text = input?.value.trim();
    if (!text) return;
    const tasks = JSON.parse(localStorage.getItem('boda-agenda') || '[]');
    tasks.push({ text, done: false });
    localStorage.setItem('boda-agenda', JSON.stringify(tasks));
    input.value = '';
    renderAgenda();
};

window.toggleAgendaTask = function (i) {
    const tasks = JSON.parse(localStorage.getItem('boda-agenda') || '[]');
    tasks[i].done = !tasks[i].done;
    localStorage.setItem('boda-agenda', JSON.stringify(tasks));
    renderAgenda();
};

window.removeAgendaTask = function (i) {
    const tasks = JSON.parse(localStorage.getItem('boda-agenda') || '[]');
    tasks.splice(i, 1);
    localStorage.setItem('boda-agenda', JSON.stringify(tasks));
    renderAgenda();
};
