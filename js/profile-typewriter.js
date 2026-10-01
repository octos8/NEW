/* Reveal each line once, preserving the full text for assistive technology. */
(() => {
    const summary = document.querySelector('.profile-typewriter');
    if (!summary || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const characters = [];
    const originals = [];
    let timer;
    let started = false;
    summary.querySelectorAll('p').forEach(line => {
        const text = line.textContent;
        originals.push({ line, text });
        const accessible = document.createElement('span');
        accessible.className = 'typing-accessible';
        accessible.textContent = text;
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        for (const character of text) {
            const span = document.createElement('span');
            span.className = 'typing-character';
            span.textContent = character;
            visual.append(span);
            characters.push(span);
        }
        line.replaceChildren(accessible, visual);
    });
    const finish = () => {
        clearTimeout(timer);
        originals.forEach(({ line, text }) => { line.textContent = text; });
        summary.classList.add('typing-complete');
    };
    const type = index => {
        if (motion.matches || index >= characters.length) { finish(); return; }
        characters[index].style.opacity = '1';
        timer = setTimeout(() => type(index + 1), characters[index].textContent === ' ' ? 45 : 85);
    };
    const observer = new IntersectionObserver(entries => {
        if (started || !entries.some(entry => entry.isIntersecting)) return;
        started = true;
        type(0);
        observer.disconnect();
    }, { threshold: .5 });
    observer.observe(summary);
    motion.addEventListener('change', () => {
        if (motion.matches) { observer.disconnect(); finish(); }
    });
})();
