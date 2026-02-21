/**
 * rsvp.js  —  Formulario RSVP con Supabase
 *
 * Tabla requerida en Supabase (SQL):
 *   create table rsvps (
 *     id         bigint generated always as identity primary key,
 *     name       text    not null,
 *     attendance text    not null,   -- 'si' | 'no'
 *     guests     int     default 1,
 *     notes      text,
 *     created_at timestamptz default now()
 *   );
 *   alter table rsvps enable row level security;
 *   create policy "public read"  on rsvps for select using (true);
 *   create policy "public write" on rsvps for insert with check (true);
 */

import { supabase } from './supabase.js';

const TABLE = 'rsvps';

// ──────────────────────────────────────────────────────────────
// Inicialización — llamado desde navigation.js → onInvitationLoaded()
// ──────────────────────────────────────────────────────────────
export function initRsvp() {
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpBtn = document.getElementById('rsvp-submit');
    if (!rsvpForm) return;

    // Evitar doble binding
    rsvpForm.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('rsvp-name')?.value.trim();
        const attendance = document.querySelector('input[name="attendance"]:checked')?.value || 'si';
        const guests = parseInt(document.getElementById('rsvp-guests')?.value || '1', 10);
        const notes = document.getElementById('rsvp-notes')?.value.trim() || '';

        if (!name) return;

        rsvpBtn.disabled = true;
        rsvpBtn.innerText = 'PROCESANDO...';

        const { error } = await supabase
            .from(TABLE)
            .insert({ name, attendance, guests, notes });

        if (error) {
            console.error('Error al enviar RSVP:', error.message);
            alert('Hubo un error al enviar tu confirmación. Por favor intenta más tarde.');
            rsvpBtn.disabled = false;
            rsvpBtn.innerText = 'CONFIRMAR ASISTENCIA';
            return;
        }

        // Feedback visual de éxito
        rsvpBtn.style.backgroundColor = '#10B981';
        rsvpBtn.innerText = '¡CONFIRMACIÓN ENVIADA!';

        setTimeout(() => {
            e.target.reset();
            rsvpBtn.style.backgroundColor = '';
            rsvpBtn.innerText = 'CONFIRMAR ASISTENCIA';
            rsvpBtn.disabled = false;
        }, 3000);
    };
}

// Exponer en window para navigation.js (que no es módulo ES)
window.initRsvp = initRsvp;
