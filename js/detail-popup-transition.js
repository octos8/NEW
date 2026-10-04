/* Reveal the popup through a growing circle while the detail remains still. */
(() => {
    const group = document.querySelector('.detail-popup-transition');
    const detail = group?.querySelector('#detail');
    const popup = group?.querySelector('#popup');
    if (!detail || !popup) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let displayedProgress = 0;
    let lastTime = 0;
    const update = () => {
        frame = 0;
        if (motion.matches) return;
        const now = performance.now();
        const elapsed = Math.min(64, lastTime ? now - lastTime : 16);
        lastTime = now;
        const height = window.innerHeight;
        // Measure the layout position, unaffected by the reveal's transform.
        const top = group.getBoundingClientRect().top + popup.offsetTop;
        const targetProgress = Math.max(0, Math.min(1, 1 - top / height));
        displayedProgress += (targetProgress - displayedProgress) * (1 - Math.exp(-elapsed / 140));
        if (Math.abs(targetProgress - displayedProgress) < .0005) displayedProgress = targetProgress;
        const progress = displayedProgress;
        // Blur first; gently fade in the circle as its radius begins to grow.
        const smooth = value => value * value * (3 - 2 * value);
        const blurProgress = Math.min(1, progress / .45);
        const revealProgress = Math.max(0, (progress - .14) / .86);
        const eased = smooth(revealProgress);
        group.style.setProperty('--iris-blur', `${10 * smooth(blurProgress)}px`);
        group.style.setProperty('--iris-opacity', String(smooth(Math.min(1, revealProgress / .3))));
        const radius = Math.hypot(document.documentElement.clientWidth, height) / 2 + 2;
        group.style.setProperty('--iris-offset', `${-Math.max(0, Math.min(height, top))}px`);
        group.style.setProperty('--iris-clip', progress >= 1
            ? 'none'
            : `circle(${radius * eased}px at 50% ${height / 2}px)`);
        if (progress !== targetProgress) schedule();
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
        group.classList.toggle('is-iris-ready', !motion.matches);
        group.style.setProperty('--detail-pin-top', `${Math.min(0, innerHeight - detail.offsetHeight)}px`);
        schedule();
    };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(detail);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    motion.addEventListener('change', measure);
    measure();
})();
