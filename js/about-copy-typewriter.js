/* Type the left sentence, then the right, without shifting the layout. */
(() => {
    const copy = document.querySelector('.about-copy-typewriter');
    if (!copy || !('IntersectionObserver' in window)) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const characters = [];
    copy.querySelectorAll('p').forEach(line => {
        const accessible = document.createElement('span');
        accessible.className = 'about-copy-accessible';
        accessible.textContent = line.textContent;
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        visual.innerHTML = line.innerHTML;
        const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            const fragment = document.createDocumentFragment();
            for (const character of node.textContent) {
                const span = document.createElement('span');
                span.className = 'about-copy-character';
                span.textContent = character;
                fragment.append(span);
                characters.push(span);
            }
            node.replaceWith(fragment);
        });
        line.replaceChildren(accessible, visual);
    });
    let timer;
    const finish = () => {
        clearTimeout(timer);
        characters.forEach(character => character.classList.add('is-typed'));
    };
    function type(index) {
        if (motion.matches || index >= characters.length) { finish(); return; }
        characters[index].classList.add('is-typed');
        timer = setTimeout(() => type(index + 1), 65);
    }
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        type(0);
    }, { threshold: .4 });
    observer.observe(copy);
    motion.addEventListener('change', () => {
        if (motion.matches) { observer.disconnect(); finish(); }
    });
})();
