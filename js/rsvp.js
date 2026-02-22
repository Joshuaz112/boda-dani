/**
 * rsvp.js  —  Formulario RSVP con Supabase + toast + confetti
 */

import { supabase } from './supabase.js';

const TABLE = 'rsvps';

export function initRsvp() {
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpBtn = document.getElementById('rsvp-submit');
    if (!rsvpForm) return;

    rsvpForm.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('rsvp-name')?.value.trim();
        const attendance = document.querySelector('input[name="attendance"]:checked')?.value || 'si';
        const guests = parseInt(document.getElementById('rsvp-guests')?.value || '1', 10);
        const notes = document.getElementById('rsvp-notes')?.value.trim() || '';

        if (!name) {
            window.showToast?.('Por favor ingresa tu nombre completo.', 'warning');
            return;
        }

        rsvpBtn.disabled = true;
        rsvpBtn.innerText = 'PROCESANDO...';

        const { error } = await supabase.from(TABLE).insert({ name, attendance, guests, notes });

        if (error) {
            console.error('Error RSVP:', error.message);
            window.showToast?.('Hubo un error al enviar tu confirmación. Intenta más tarde.', 'error');
            rsvpBtn.disabled = false;
            rsvpBtn.innerText = 'CONFIRMAR ASISTENCIA';
            return;
        }

        if (attendance === 'si') {
            // ¡Confetti dorado y toast de celebración!
            window.launchConfetti?.();
            window.showToast?.(`¡Gracias ${name}! Te esperamos el 25 de Octubre 🎉`, 'success', 6000);
        } else {
            window.showToast?.(`Gracias ${name} por avisarnos. ¡Te echamos de menos!`, 'info', 5000);
        }

        rsvpBtn.style.background = attendance === 'si' ? '#10B981' : '#6b7280';
        rsvpBtn.innerText = attendance === 'si' ? '¡CONFIRMADO! 🎉' : 'RESPUESTA ENVIADA';

        setTimeout(() => {
            e.target.reset();
            rsvpBtn.style.background = '';
            rsvpBtn.innerText = 'CONFIRMAR ASISTENCIA';
            rsvpBtn.disabled = false;
        }, 4000);
    };
}

window.initRsvp = initRsvp;
