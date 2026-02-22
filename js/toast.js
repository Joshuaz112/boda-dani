/**
 * toast.js — Sistema de notificaciones elegante
 * Reemplaza todos los alert() con toasts animados en la parte inferior.
 * Uso: window.showToast('Mensaje', 'success' | 'error' | 'info')
 */

(function () {
    // Inyectar estilos
    const style = document.createElement('style');
    style.textContent = `
        #toast-container {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
            width: min(90vw, 420px);
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 12px;
            background: white;
            border-radius: 14px;
            padding: 14px 18px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            font-weight: 500;
            color: #2e2a25;
            width: 100%;
            pointer-events: auto;
            border-left: 4px solid var(--color-gold);
            opacity: 0;
            transform: translateY(20px) scale(0.96);
            transition: opacity 0.35s cubic-bezier(.22,1,.36,1),
                        transform 0.35s cubic-bezier(.22,1,.36,1);
        }

        .toast.show {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .toast.toast-error  { border-left-color: #ef4444; }
        .toast.toast-info   { border-left-color: #3b82f6; }
        .toast.toast-warning{ border-left-color: #f59e0b; }

        .toast-icon {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .toast-success .toast-icon { background: rgba(212,175,106,0.15); color: var(--color-gold-dark); }
        .toast-error   .toast-icon { background: rgba(239,68,68,0.12);  color: #ef4444; }
        .toast-info    .toast-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .toast-warning .toast-icon { background: rgba(245,158,11,0.12); color: #f59e0b; }

        .toast-msg { flex: 1; line-height: 1.4; }

        .toast-close {
            flex-shrink: 0;
            background: none;
            border: none;
            color: #b0a898;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 0 2px;
        }
    `;
    document.head.appendChild(style);

    const ICONS = {
        success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    };

    function getContainer() {
        let c = document.getElementById('toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    }

    window.showToast = function (message, type = 'success', duration = 4000) {
        const container = getContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${ICONS[type] || ICONS.success}</span>
            <span class="toast-msg">${message}</span>
            <button class="toast-close" title="Cerrar">×</button>`;

        toast.querySelector('.toast-close').onclick = () => dismiss(toast);
        container.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

        if (duration > 0) setTimeout(() => dismiss(toast), duration);
        return toast;
    };

    function dismiss(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }
})();
