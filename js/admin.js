/**
 * admin.js  —  Panel de control con Supabase
 * Contrasena: boda26
 */

import { supabase } from './supabase.js';

const RSVP_TABLE = 'rsvps';
const GUESTBOOK_TABLE = 'guestbook';
const PHOTOS_TABLE = 'album_photos';
const STORAGE_BUCKET = 'album';
const ADMIN_PASSWORD = 'boda26';

let allRsvps = [];
let allMessages = [];
let allPhotos = [];
let selectedIds = new Set(); // IDs de fotos seleccionadas

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function escapeHtml(t) {
    const m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(t || '').replace(/[&<>"']/g, c => m[c]);
}

// ──────────────────────────────────────────────────────────────
// Modal abrir / cerrar
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────────────────
window.checkAdminPassword = async function () {
    const pwd = document.getElementById('admin-password')?.value;
    if (pwd !== ADMIN_PASSWORD) { alert('Contrasena incorrecta'); return; }
    document.getElementById('admin-login-box').style.display = 'none';
    document.getElementById('admin-panel').classList.remove('hidden');
    await loadAllData();
};

async function loadAllData() {
    await Promise.all([loadRsvps(), loadMessages(), loadPhotosAdmin()]);
    renderDashboard();
    renderAgenda();
}

// ──────────────────────────────────────────────────────────────
// RSVP
// ──────────────────────────────────────────────────────────────
async function loadRsvps() {
    const { data, error } = await supabase
        .from(RSVP_TABLE).select('*').order('created_at', { ascending: false });
    if (!error) allRsvps = data || [];
    renderRsvpTable(allRsvps);
}

function renderRsvpTable(rows) {
    const tbody = document.getElementById('rsvp-table-body');
    if (!tbody) return;
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-white/30 text-sm italic">Sin datos aun.</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(d => {
        const si = d.attendance === 'si';
        const badge = si ? '<span class="badge-si">SI</span>' : '<span class="badge-no">NO</span>';
        const fecha = d.created_at ? new Date(d.created_at).toLocaleDateString('es-CL') : '—';
        return `<tr>
            <td>${escapeHtml(d.name)}</td>
            <td>${badge}</td>
            <td>${si ? d.guests : '—'}</td>
            <td class="text-white/50 text-xs">${escapeHtml(d.notes)}</td>
            <td class="text-white/40 text-xs">${fecha}</td>
            <td><button class="btn-delete" onclick="deleteRsvp(${d.id})">x</button></td>
        </tr>`;
    }).join('');
}

window.filterRsvp = function () {
    const q = document.getElementById('rsvp-search')?.value.toLowerCase() || '';
    const fil = document.getElementById('rsvp-filter')?.value || 'all';
    renderRsvpTable(allRsvps.filter(r =>
        r.name.toLowerCase().includes(q) && (fil === 'all' || r.attendance === fil)
    ));
};

window.deleteRsvp = async function (id) {
    if (!confirm('Eliminar este RSVP?')) return;
    await supabase.from(RSVP_TABLE).delete().eq('id', id);
    await loadRsvps();
    renderDashboard();
};

// ──────────────────────────────────────────────────────────────
// Mensajes / Guestbook
// ──────────────────────────────────────────────────────────────
async function loadMessages() {
    const { data, error } = await supabase
        .from(GUESTBOOK_TABLE).select('*').order('created_at', { ascending: false });
    if (!error) allMessages = data || [];
    renderGuestbookAdmin(allMessages);
}

function renderGuestbookAdmin(rows) {
    const list = document.getElementById('gb-admin-list');
    if (!list) return;
    if (!rows.length) {
        list.innerHTML = '<p class="text-white/30 text-sm italic text-center py-8">Sin mensajes aun.</p>';
        return;
    }
    list.innerHTML = rows.map(d => `
        <div class="gb-admin-card">
            <div class="flex justify-between items-start">
                <p class="text-white/80 text-sm font-semibold mb-1">${escapeHtml(d.name)}</p>
                <button class="btn-delete" onclick="deleteMessage(${d.id})">x</button>
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
    if (!confirm('Eliminar este mensaje?')) return;
    await supabase.from(GUESTBOOK_TABLE).delete().eq('id', id);
    await loadMessages();
    renderDashboard();
};

// ──────────────────────────────────────────────────────────────
// FOTOS — con borrado individual + seleccion multiple
// ──────────────────────────────────────────────────────────────
async function loadPhotosAdmin() {
    const { data, error } = await supabase
        .from(PHOTOS_TABLE).select('*').order('created_at', { ascending: false });
    if (!error) allPhotos = data || [];
    selectedIds.clear();
    renderPhotosAdmin(allPhotos);
}

function renderPhotosAdmin(rows) {
    const grid = document.getElementById('admin-photo-grid');
    const count = document.getElementById('photo-count');
    if (count) count.innerText = rows.length;
    if (!grid) return;

    // Estado vacio
    if (!rows.length) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:48px 20px;">
                <svg style="width:48px;height:48px;opacity:.2;color:var(--color-gold);margin:0 auto 12px;display:block;"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <p style="color:rgba(255,255,255,.3);font-size:13px;font-style:italic;">Sin fotos aun.</p>
            </div>`;
        _updateSelectionBar();
        return;
    }

    // Renderizar tarjetas
    grid.innerHTML = rows.map(d => {
        const fecha = d.created_at
            ? new Date(d.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
            : '';
        const sel = selectedIds.has(d.id);
        return `
        <div class="admin-photo-item${sel ? ' selected' : ''}" data-pid="${d.id}" data-purl="${d.url}">
            <img src="${d.url}" loading="lazy" alt="foto">

            <!-- Checkbox superior izquierdo -->
            <div class="apc-checkbox-wrap js-toggle-sel" data-pid="${d.id}" title="Seleccionar">
                <span class="apc-checkbox${sel ? ' checked' : ''}">
                    ${sel ? '<svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5"><polyline points="1.5,6 4.5,9 10.5,3"/></svg>' : ''}
                </span>
            </div>

            <!-- Boton borrar individual (esquina superior derecha) — siempre visible -->
            <button class="apc-delete-btn js-del-one" data-pid="${d.id}" data-purl="${d.url}" title="Eliminar esta foto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
            </button>

            <!-- Fecha inferior -->
            <span class="apc-date">${fecha}</span>
        </div>`;
    }).join('');

    // Un solo listener de clicks en todo el grid
    grid.onclick = async function (e) {
        // Borrar individual
        const delBtn = e.target.closest('.js-del-one');
        if (delBtn) {
            const id = Number(delBtn.dataset.pid);
            const url = delBtn.dataset.purl;
            if (!confirm('Eliminar esta foto?')) return;
            const card = delBtn.closest('.admin-photo-item');
            if (card) { card.style.opacity = '0.3'; card.style.pointerEvents = 'none'; }
            await _deletePhotoById(id, url);
            await loadPhotosAdmin();
            renderDashboard();
            return;
        }
        // Toggle seleccion
        const toggle = e.target.closest('.js-toggle-sel');
        if (toggle) {
            const id = Number(toggle.dataset.pid);
            const card = toggle.closest('.admin-photo-item');
            if (selectedIds.has(id)) {
                selectedIds.delete(id);
                card.classList.remove('selected');
            } else {
                selectedIds.add(id);
                card.classList.add('selected');
            }
            // Refresca solo el checkbox
            const box = toggle.querySelector('.apc-checkbox');
            if (box) {
                const checked = selectedIds.has(id);
                box.className = 'apc-checkbox' + (checked ? ' checked' : '');
                box.innerHTML = checked
                    ? '<svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5"><polyline points="1.5,6 4.5,9 10.5,3"/></svg>'
                    : '';
            }
            _updateSelectionBar();
            return;
        }
    };

    _updateSelectionBar();
}

// Barra inferior de seleccion multiple
function _updateSelectionBar() {
    const photosTab = document.getElementById('tab-photos');
    if (!photosTab) return;

    let bar = document.getElementById('photo-sel-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'photo-sel-bar';
        Object.assign(bar.style, {
            position: 'sticky', bottom: '0', marginTop: '16px',
            background: 'rgba(10,10,20,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 16px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            gap: '10px', transition: 'opacity .25s, transform .25s',
            borderRadius: '0 0 16px 16px',
        });
        photosTab.appendChild(bar);
    }

    const n = selectedIds.size;

    if (n === 0) {
        bar.style.opacity = '0';
        bar.style.transform = 'translateY(6px)';
        bar.style.pointerEvents = 'none';
        return;
    }

    bar.style.opacity = '1';
    bar.style.transform = 'translateY(0)';
    bar.style.pointerEvents = 'auto';

    bar.innerHTML = `
        <span style="font-size:12px;color:rgba(255,255,255,.65);">
            <strong style="color:var(--color-gold);">${n}</strong>
            foto${n > 1 ? 's' : ''} seleccionada${n > 1 ? 's' : ''}
        </span>
        <div style="display:flex;gap:8px;">
            <button id="apc-cancel" style="
                background:transparent;border:1px solid rgba(255,255,255,.2);
                color:rgba(255,255,255,.5);border-radius:8px;padding:5px 14px;
                font-size:10px;letter-spacing:.1em;text-transform:uppercase;
                cursor:pointer;font-family:Montserrat,sans-serif;">
                Cancelar
            </button>
            <button id="apc-del-sel" style="
                background:rgba(220,38,38,.9);border:none;color:#fff;
                border-radius:8px;padding:5px 16px;font-size:10px;font-weight:700;
                letter-spacing:.1em;text-transform:uppercase;cursor:pointer;
                font-family:Montserrat,sans-serif;">
                Eliminar ${n}
            </button>
        </div>`;

    document.getElementById('apc-cancel').onclick = () => {
        selectedIds.clear();
        renderPhotosAdmin(allPhotos);
    };

    document.getElementById('apc-del-sel').onclick = async () => {
        if (!confirm(`Eliminar las ${n} fotos seleccionadas?`)) return;
        const list = allPhotos.filter(p => selectedIds.has(p.id));
        for (const p of list) await _deletePhotoById(p.id, p.url);
        selectedIds.clear();
        await loadPhotosAdmin();
        renderDashboard();
    };
}

async function _deletePhotoById(id, url) {
    try {
        const parts = new URL(url).pathname.split('/');
        const fileName = parts[parts.length - 1];
        const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
        if (error) console.warn('[admin] storage remove:', error.message);
    } catch (e) {
        console.warn('[admin] no se pudo borrar archivo:', e);
    }
    await supabase.from(PHOTOS_TABLE).delete().eq('id', id);
}

window.deletePhoto = async function (id, url) {
    if (!confirm('Eliminar esta foto?')) return;
    await _deletePhotoById(id, url);
    await loadPhotosAdmin();
    renderDashboard();
};

window.deleteAllPhotos = async function () {
    if (!confirm('Eliminar TODAS las fotos? Esta accion no se puede deshacer.')) return;
    const filenames = allPhotos.map(p => { try { const pts = new URL(p.url).pathname.split('/'); return pts[pts.length - 1]; } catch (e) { return p.url.split('/').pop(); } });
    if (filenames.length) await supabase.storage.from(STORAGE_BUCKET).remove(filenames);
    await supabase.from(PHOTOS_TABLE).delete().neq('id', 0);
    selectedIds.clear();
    await loadPhotosAdmin();
    renderDashboard();
};

// ──────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────────────────────
window.switchAdminTab = function (tab, btn) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
    const el = document.getElementById('tab-' + tab);
    if (el) el.classList.remove('hidden');
    if (btn) btn.classList.add('active');
};

// ──────────────────────────────────────────────────────────────
// Exportar CSV
// ──────────────────────────────────────────────────────────────
window.exportCSV = function () {
    const rows = [
        ['Nombre', 'Asiste', 'Pases', 'Notas', 'Fecha'],
        ...allRsvps.map(r => [r.name, r.attendance, r.guests, r.notes || '',
        r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : ''])
    ];
    downloadCSV(rows, 'rsvp_boda.csv');
};

window.exportMensajes = function () {
    const rows = [
        ['Nombre', 'Mensaje', 'Fecha'],
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

// ──────────────────────────────────────────────────────────────
// Agenda (localStorage)
// ──────────────────────────────────────────────────────────────
function renderAgenda() {
    const tasks = JSON.parse(localStorage.getItem('boda-agenda') || '[]');
    const list = document.getElementById('agenda-list');
    if (!list) return;
    list.innerHTML = tasks.length === 0
        ? '<p class="text-white/30 text-xs text-center py-4 italic">Sin tareas aun.</p>'
        : tasks.map((t, i) => `
            <div class="agenda-task ${t.done ? 'done' : ''}">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleAgendaTask(${i})">
                <span>${escapeHtml(t.text)}</span>
                <button class="btn-delete ml-auto" onclick="removeAgendaTask(${i})">x</button>
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
