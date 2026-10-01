/* Reveal the three introductory words in reading order. */
(() => {
    const title = document.querySelector('.about-heading > .about-title');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!title || motion.matches || !('IntersectionObserver' in window)) return;
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const content = document.createDocumentFragment();
    text.split(/\s+/).forEach((word, index) => {
        if (index) content.append(document.createTextNode(' '));
        const span = document.createElement('span');
        span.className = 'about-title-word';
        span.textContent = word;
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--word-delay', `${index * .85}s`);
        content.append(span);
    });
    title.replaceChildren(content);
    title.classList.add('words-ready');
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        title.classList.add('words-visible');
        observer.disconnect();
    }, { threshold: .25, rootMargin: '0px 0px -8% 0px' });
    observer.observe(title);
    motion.addEventListener('change', () => {
        if (motion.matches) {
            title.classList.add('words-visible');
            observer.disconnect();
        }
    });
})();
