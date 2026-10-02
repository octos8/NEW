/* Draw the curly annotation once when it enters view. */
(() => {
    const arrow = document.querySelector('.about-note-arrow');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!arrow || motion.matches || !('IntersectionObserver' in window)) return;
    arrow.classList.add('is-draw-ready');
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        arrow.classList.add('is-drawn');
        observer.disconnect();
    }, { threshold: .3 });
    observer.observe(arrow);
    motion.addEventListener('change', () => {
        if (motion.matches) {
            arrow.classList.remove('is-draw-ready');
            observer.disconnect();
        }
    });
})();
