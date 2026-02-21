/**
 * countdown.js
 * Cuenta regresiva hasta la fecha de la boda.
 * Actualiza los elementos #days, #hours y #minutes cada segundo.
 */

// Fecha y hora de la boda (ajusta si cambia)
const WEDDING_DATE = new Date("October 25, 2026 17:00:00").getTime();

const elDays = document.getElementById('days');
const elHours = document.getElementById('hours');
const elMinutes = document.getElementById('minutes');

function updateCountdown() {
    const now = Date.now();
    const gap = WEDDING_DATE - now;

    if (gap <= 0) {
        // La boda ya ocurrió
        if (elDays) elDays.innerText = '00';
        if (elHours) elHours.innerText = '00';
        if (elMinutes) elMinutes.innerText = '00';
        return;
    }

    const days = Math.floor(gap / 86_400_000);
    const hours = Math.floor((gap % 86_400_000) / 3_600_000);
    const minutes = Math.floor((gap % 3_600_000) / 60_000);

    if (elDays) elDays.innerText = String(days).padStart(2, '0');
    if (elHours) elHours.innerText = String(hours).padStart(2, '0');
    if (elMinutes) elMinutes.innerText = String(minutes).padStart(2, '0');
}

// Ejecutar de inmediato y luego cada segundo
updateCountdown();
setInterval(updateCountdown, 1000);
