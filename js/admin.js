/**
 * admin.js
 * Panel de control oculto para la pareja.
 * Acceso: clic en el botón invisible (esquina inferior derecha)
 * Contraseña: boda26
 *
 * Muestra una tabla con todos los RSVP y el total de pases confirmados.
 */

import { db, APP_ID, currentUser } from './firebase.js';
import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// Referencias DOM
// ──────────────────────────────────────────────────────────────
const adminModal = document.getElementById('admin-modal');
const adminContent = document.getElementById('admin-content');
const adminPwd = document.getElementById('admin-pwd');

/**
 * Verifica la contraseña y carga la tabla de RSVP.
 * Expuesta como global para el onclick del HTML.
 */
window.loginAdmin = function () {
    if (!currentUser) {
        alert('Conectando con el servidor, intenta de nuevo...');
        return;
    }

    const ADMIN_PASSWORD = 'boda26'; // Cambia esta contraseña antes de publicar

    if (adminPwd.value !== ADMIN_PASSWORD) {
        alert('Contraseña incorrecta');
        return;
    }

    // Mostrar sección de contenido
    adminContent.classList.remove('hidden');
    adminContent.innerHTML = "<p class='text-center text-gray-400 text-sm'>Cargando datos...</p>";

    const rsvpCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'rsvps');

    onSnapshot(rsvpCol, (snapshot) => {
        let totalPases = 0;
        let totalAsisten = 0;

        // Construir tabla
        let html = `
            <table class="w-full text-left mt-4 border-collapse text-sm">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="p-2 font-semibold">Nombre</th>
                        <th class="p-2 font-semibold">Asiste</th>
                        <th class="p-2 font-semibold">Pases</th>
                        <th class="p-2 font-semibold">Notas</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const rows = [];
        snapshot.forEach(doc => rows.push(doc.data()));

        // Ordenar: los que asisten primero
        rows.sort((a, b) => {
            if (a.attendance === b.attendance) return 0;
            return a.attendance === 'si' ? -1 : 1;
        });

        rows.forEach(d => {
            const asiste = d.attendance === 'si';
            if (asiste) {
                totalPases += parseInt(d.guests || 0, 10);
                totalAsisten++;
            }
            const badge = asiste
                ? '<span class="text-green-600 font-bold">SÍ</span>'
                : '<span class="text-red-400 font-bold">NO</span>';

            html += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-2 font-medium">${escapeHtml(d.name)}</td>
                    <td class="p-2">${badge}</td>
                    <td class="p-2">${asiste ? d.guests : '—'}</td>
                    <td class="p-2 text-gray-400 text-xs">${escapeHtml(d.notes || '')}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div class="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <p class="font-bold text-gray-800">
                    Total Pases Confirmados:
                    <span class="text-gold text-xl ml-1">${totalPases}</span>
                </p>
                <p class="text-xs text-gray-400 mt-1">
                    ${totalAsisten} invitación${totalAsisten !== 1 ? 'es' : ''} confirmada${totalAsisten !== 1 ? 's' : ''} |
                    ${rows.length - totalAsisten} declinada${rows.length - totalAsisten !== 1 ? 's' : ''}
                </p>
            </div>
        `;

        adminContent.innerHTML = html;
    }, (error) => {
        console.error('Error al cargar RSVPs:', error);
        adminContent.innerHTML = "<p class='text-center text-red-400'>Error de permisos.</p>";
    });
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}
