/* Keep the title pinned while scrolling through three reading panels. */
(() => {
    const story = document.querySelector('.profile-story');
    if (!story) return;
    const stage = story.querySelector('.profile-story-stage');
    const panels = [...story.querySelectorAll('.profile-collaboration-cards article')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = value => Math.max(0, Math.min(1, value));
    let frame = 0;
    const update = () => {
        frame = 0;
        const enabled = !motion.matches && window.innerHeight >= 560;
        story.classList.toggle('is-scroll-story', enabled);
        const distance = story.offsetHeight - stage.offsetHeight;
        const progress = enabled ? clamp(-story.getBoundingClientRect().top / Math.max(1, distance)) : 0;
        const position = progress * panels.length;
        const active = Math.min(panels.length - 1, Math.floor(position));
        panels.forEach((panel, index) => {
            if (!enabled) {
                panel.style.removeProperty('transform');
                panel.style.removeProperty('opacity');
                panel.style.removeProperty('visibility');
                panel.removeAttribute('aria-hidden');
                return;
            }
            panel.style.transform = 'none';
            panel.style.opacity = index === active ? '1' : '0';
            panel.style.visibility = index === active ? 'visible' : 'hidden';
            panel.setAttribute('aria-hidden', String(index !== active));
        });
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('load', schedule, { once: true });
    motion.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule);
    update();
})();
