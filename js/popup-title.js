(() => {
    const title = document.querySelector('.popup-animated-title');
    if (!title || !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    title.classList.add('is-bounce-ready');
    const summary = document.querySelector('.popup-heading .section-summary');
    summary?.classList.add('popup-summary-ready');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const visibleClass = entry.target === title ? 'is-bouncing' : 'popup-summary-visible';
            entry.target.classList.toggle(visibleClass, entry.isIntersecting);
        });
    }, { threshold: .2, rootMargin: '0px 0px -24px 0px' });
    observer.observe(title);
    if (summary) observer.observe(summary);
})();
