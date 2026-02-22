/**
 * confetti.js — Lluvia de confetti dorado
 * Uso: window.launchConfetti()
 */

(function () {
    const COLORS = [
        '#d4af6a', '#e8cc8e', '#b8913f',  // dorados
        '#ffffff', '#f5f1ea',              // blancos/crema
        '#c8a96e', '#f0d9a0',             // oro claro
    ];

    window.launchConfetti = function (duration = 3200) {
        // Canvas temporal que cubre toda la pantalla
        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'fixed', inset: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: '999998',
        });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Generar partículas
        const particles = Array.from({ length: 130 }, () => ({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 200,
            r: Math.random() * 6 + 3,
            d: Math.random() * 1.5 + .5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            tilt: Math.random() * 10 - 10,
            tiltSpeed: Math.random() * .15 + .05,
            opacity: 1,
            shape: Math.random() > .4 ? 'rect' : 'circle',
        }));

        let start = null;
        let rafId;

        function draw(ts) {
            if (!start) start = ts;
            const elapsed = ts - start;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const fadeStart = duration - 800;
            particles.forEach(p => {
                // Fade out al final
                if (elapsed > fadeStart)
                    p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / 800);

                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                ctx.rotate((p.tilt * Math.PI) / 180);

                if (p.shape === 'rect') {
                    ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();

                // Física
                p.y += p.d * 3.5;
                p.x += Math.sin(elapsed * 0.003 + p.r) * 1.2;
                p.tilt += p.tiltSpeed;
            });

            if (elapsed < duration) {
                rafId = requestAnimationFrame(draw);
            } else {
                canvas.remove();
            }
        }

        rafId = requestAnimationFrame(draw);

        // Limpiar si la ventana cambia de tamaño
        const cleanup = () => { cancelAnimationFrame(rafId); canvas.remove(); };
        setTimeout(cleanup, duration + 100);
    };
})();
