/* Type the heading once without shifting its centered position. */
(() => {
    const title = document.querySelector('#detail .detail-heading h2');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!title || motion.matches || !('IntersectionObserver' in window)) return;
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const letters = Array.from(text, character => {
        const span = document.createElement('span');
        span.className = 'detail-typing-letter';
        span.textContent = character;
        span.setAttribute('aria-hidden', 'true');
        return span;
    });
    title.replaceChildren(...letters);
    let timer;
    let started = false;
    const finish = () => {
        clearTimeout(timer);
        letters.forEach(letter => letter.classList.add('is-written'));
    };
    const type = index => {
        if (motion.matches || index >= letters.length) { finish(); return; }
        letters[index].classList.add('is-written');
        timer = setTimeout(() => type(index + 1), letters[index].textContent === ' ' ? 120 : 240);
    };
    const observer = new IntersectionObserver(entries => {
        if (started || !entries.some(entry => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();
        type(0);
    }, { threshold: 1, rootMargin: '0px 0px -10% 0px' });
    observer.observe(title);
    motion.addEventListener('change', () => {
        if (motion.matches) { observer.disconnect(); finish(); }
    });
})();
