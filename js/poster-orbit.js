/* Keep the posters in one continuous stream around the right semicircle. */
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
        const { width, height, travel, sizes, centers, radiusY, gutter } = geometry;
        const progress = clamp(-section.getBoundingClientRect().top / travel, 0, 1);
        cards.forEach((card, index) => {
            const size = sizes[index];
            const offset = centers[index] - progress * travel;
            const y = height * 0.54 + offset - size.height / 2;
            const visible = y < height && y + size.height > 0;
            card.style.visibility = visible ? 'visible' : 'hidden';
            // Adjacent images stay one image-height apart, without a pause or
            // a separate visibility window for each poster.
            const arc = clamp(offset / radiusY, -1, 1);
            const radiusX = Math.max(0, width - size.width / 2 - gutter);
            const x = gutter + radiusX * (1 - Math.sqrt(1 - arc * arc));
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
        const gap = compact.matches ? 24 : 40;
        // Start with the first poster just below the stage; scrolling brings
        // it into view before the rest of the continuous stream follows.
        const centers = [height * 0.46 + sizes[0].height / 2 + gap];
        sizes.slice(1).forEach((size, index) => {
            centers.push(centers[index] + sizes[index].height / 2 + gap + size.height / 2);
        });
        const travel = Math.max(1, centers[centers.length - 1]);
        section.style.setProperty('--poster-orbit-height', `${height + travel}px`);
        geometry = {
            width: stage.clientWidth,
            height,
            travel,
            centers,
            radiusY: (height + Math.max(...sizes.map(size => size.height))) / 2 + 64,
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
