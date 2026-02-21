/**
 * rsvp.js
 * Formulario de confirmación de asistencia (RSVP).
 * Guarda los datos en Firestore bajo la colección 'rsvps'.
 */

import { db, APP_ID, currentUser } from './firebase.js';
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// Referencia a la colección
// ──────────────────────────────────────────────────────────────
const getRsvpCol = () =>
    collection(db, 'artifacts', APP_ID, 'public', 'data', 'rsvps');

// ──────────────────────────────────────────────────────────────
// Manejo del formulario
// ──────────────────────────────────────────────────────────────
const rsvpForm = document.getElementById('rsvp-form');
const rsvpBtn = document.getElementById('rsvp-submit');

rsvpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('Conectando con el servidor, intenta de nuevo en unos segundos...');
        return;
    }

    // Leer valores del formulario
    const name = document.getElementById('rsvp-name').value.trim();
    const attendance = document.querySelector('input[name="attendance"]:checked')?.value || 'si';
    const guests = document.getElementById('rsvp-guests').value;
    const notes = document.getElementById('rsvp-notes').value.trim();

    if (!name) return;

    // Estado de carga
    rsvpBtn.disabled = true;
    rsvpBtn.innerText = 'PROCESANDO...';

    try {
        await addDoc(getRsvpCol(), {
            name,
            attendance,
            guests: parseInt(guests, 10),
            notes,
            createdAt: serverTimestamp()
        });

        // Éxito visual
        rsvpBtn.style.backgroundColor = '#10B981'; // Verde
        rsvpBtn.innerText = '¡CONFIRMACIÓN ENVIADA!';

        setTimeout(() => {
            e.target.reset();
            rsvpBtn.style.backgroundColor = '';
            rsvpBtn.innerText = 'CONFIRMAR ASISTENCIA';
            rsvpBtn.disabled = false;
        }, 3000);

    } catch (err) {
        console.error('Error al enviar RSVP:', err);
        alert('Hubo un error al enviar tu confirmación. Por favor intenta más tarde.');
        rsvpBtn.disabled = false;
        rsvpBtn.innerText = 'CONFIRMAR ASISTENCIA';
    }
});
