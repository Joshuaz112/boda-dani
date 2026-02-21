/**
 * countdown.js
 * Cuenta regresiva hasta la fecha de la boda.
 * Expone `initCountdown()` para ser llamado desde navigation.js
 * una vez que pages/home.html haya sido inyectado en el DOM.
 */

// Fecha y hora de la boda (ajusta si cambia)
const WEDDING_DATE = new Date('October 25, 2026 17:00:00').getTime();

let countdownInterval = null;

function updateCountdown() {
    const elDays = document.getElementById('days');
    const elHours = document.getElementById('hours');
    const elMinutes = document.getElementById('minutes');

    // Si los elementos aún no están en el DOM, salir silenciosamente
    if (!elDays || !elHours || !elMinutes) return;

    const now = Date.now();
    const gap = WEDDING_DATE - now;

    if (gap <= 0) {
        elDays.innerText = '00';
        elHours.innerText = '00';
        elMinutes.innerText = '00';
        clearInterval(countdownInterval);
        return;
    }

    const days = Math.floor(gap / 86_400_000);
    const hours = Math.floor((gap % 86_400_000) / 3_600_000);
    const minutes = Math.floor((gap % 3_600_000) / 60_000);

    elDays.innerText = String(days).padStart(2, '0');
    elHours.innerText = String(hours).padStart(2, '0');
    elMinutes.innerText = String(minutes).padStart(2, '0');
}

/**
 * Inicia (o reinicia) la cuenta regresiva.
 * Llamado desde navigation.js → onHomeLoaded() cada vez que
 * pages/home.html es inyectado en el contenedor.
 */
window.initCountdown = function () {
    // Limpiar cualquier intervalo previo para evitar duplicados
    if (countdownInterval) clearInterval(countdownInterval);

    // Primera actualización inmediata
    updateCountdown();

    // Actualizaciones cada segundo
    countdownInterval = setInterval(updateCountdown, 1000);
};
