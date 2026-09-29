/* Scroll the image/copy pairs around the same center as the right semicircle. */
(() => {
    const section = document.querySelector('#poster');
    const stage = section?.querySelector('.poster-inner');
    const cards = [...(section?.querySelectorAll('.poster-item') ?? [])];
    if (!stage || !cards.length) return;

    const compact = window.matchMedia('(max-width: 1023px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let enabled = false;
    let frame = 0;
    let geometry;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const draw = () => {
        frame = 0;
        if (!enabled || !geometry) return;
        const { width, height, travel, sizes, gutter } = geometry;
        const progress = clamp(-section.getBoundingClientRect().top / travel, 0, 1);
        if (compact.matches) {
            // Sweep around the right-hand center, just like the desktop orbit.
            // Separate turns keep the taller image/copy stacks from overlapping.
            const turn = progress * cards.length;
            cards.forEach((card, index) => {
                const phase = turn - index;
                const visible = phase >= 0 && phase < 1;
                card.style.visibility = visible ? 'visible' : 'hidden';
                if (!visible) return;
                const size = sizes[index];
                let degrees = 0;
                if (phase < 0.42) degrees = (phase / 0.42 - 1) * 90;
                else if (phase > 0.58) degrees = (phase - 0.58) / 0.42 * 90;
                const angle = degrees * Math.PI / 180;
                const radiusX = width - size.width / 2 - gutter;
                const radiusY = Math.max(radiusX, (height + size.height) / 2 + 64);
                const x = width - radiusX * Math.cos(angle) - size.width / 2;
                const y = height * 0.54 - radiusY * Math.sin(angle) - size.height / 2;
                card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            });
            return;
        }
        const position = progress * (cards.length + 0.6) - 0.8;

        cards.forEach((card, index) => {
            const phase = position - index;
            const visible = phase >= -0.8 && phase <= 0.8;
            card.style.visibility = visible ? 'visible' : 'hidden';
            if (!visible) return;

            // A short reading interval at the leftmost point of the arc.
            let degrees = 0;
            if (phase < -0.18) degrees = ((phase + 0.18) / 0.62) * 65;
            else if (phase > 0.18) degrees = ((phase - 0.18) / 0.62) * 50;
            const angle = degrees * Math.PI / 180;
            const size = sizes[index];
            const radius = width - size.width / 2 - gutter;
            const x = width - radius * Math.cos(angle) - size.width / 2;
            const y = height * 0.54 - radius * Math.sin(angle) - size.height / 2;
            card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    };

    const schedule = () => {
        if (enabled && !frame) frame = requestAnimationFrame(draw);
    };

    const measure = () => {
        enabled = !reducedMotion.matches;
        section.classList.toggle('poster-orbit-active', enabled);
        if (!enabled) {
            section.style.removeProperty('--poster-orbit-height');
            cards.forEach(card => {
                card.style.removeProperty('transform');
                card.style.removeProperty('visibility');
            });
            geometry = null;
            return;
        }
        const height = stage.clientHeight;
        const sizes = cards.map(card => ({ width: card.offsetWidth, height: card.offsetHeight }));
        const travel = compact.matches
            ? sizes.reduce((total, size) => total + Math.max(height, size.height) * 2, 0)
            : height * (cards.length + 0.6) * 1.35;
        section.style.setProperty('--poster-orbit-height', `${height + travel}px`);
        geometry = {
            width: stage.clientWidth,
            height,
            travel,
            gutter: compact.matches ? 16 : Math.max(24, stage.clientWidth * 0.035),
            sizes
        };
        schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { once: true });
    compact.addEventListener('change', measure);
    reducedMotion.addEventListener('change', measure);
    document.fonts?.ready.then(measure);
    section.querySelectorAll('img').forEach(img => img.addEventListener('load', measure, { once: true }));
    measure();
})();
