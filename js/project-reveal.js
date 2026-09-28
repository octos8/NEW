/* Replay project content entrances whenever it returns to the viewport. */
(() => {
    const project = document.querySelector('#project');
    if (!project || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const targets = new Map();
    const animations = new Map();
    const visible = new Set();

    const register = (selector, direction, stagger = 0) => {
        const groupIndexes = new Map();
        project.querySelectorAll(selector).forEach(element => {
            const group = element.parentElement;
            const index = groupIndexes.get(group) ?? 0;
            targets.set(element, { direction, delay: index * stagger });
            groupIndexes.set(group, index + 1);
        });
    };

    register('.aesop-opening-copy > *, .lune-intro-copy > *', 'left', 110);
    register('.aesop-facts > div, .lune-facts > div', 'up', 110);
    register('.aesop-typography > h3, .aesop-colors > h3, .lune-system-details > h3', 'down');
    register('.aesop-type-intro', 'left');
    register('.aesop-color-description', 'right');
    register('.aesop-main-color', 'left');
    register('.aesop-palette-content', 'up');
    register('.aesop-responsive-copy > *, .aesop-responsive-detail > *', 'up', 130);
    register('.aesop-responsive-finale > h3, .lune-finale > h3', 'down');
    register('.aesop-responsive-finale > p, .lune-finale > p', 'up');
    register('.aesop-type-row, .lune-type-body .lune-type-row', 'up', 100);

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const element = entry.target;
            if (!entry.isIntersecting) {
                visible.delete(element);
                animations.get(element)?.cancel();
                animations.delete(element);
                return;
            }
            if (visible.has(element)) return;
            visible.add(element);
            if (reducedMotion.matches || element.contains(document.activeElement)) return;

            const { direction, delay } = targets.get(element);
            // Keep sideways movement inside the existing page gutters.
            const distance = window.innerWidth <= 768 ? 6 : 16;
            const offsets = {
                left: [-distance, 24], right: [distance, 24],
                up: [0, 32], down: [0, -24]
            };
            const [x, y] = offsets[direction];
            const animation = element.animate([
                { opacity: 0, translate: `${x}px ${y}px` },
                { opacity: 1, translate: '0px 0px' }
            ], {
                duration: 1400,
                delay,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'backwards'
            });
            animations.set(element, animation);
            animation.onfinish = () => {
                if (animations.get(element) === animation) animations.delete(element);
            };
        });
    }, { threshold: 0 });

    targets.forEach((_, element) => observer.observe(element));

    reducedMotion.addEventListener('change', () => {
        animations.forEach(animation => animation.cancel());
        animations.clear();
    });

    // Keyboard navigation should reveal a focused element immediately.
    project.addEventListener('focusin', event => {
        animations.forEach((animation, element) => {
            if (element.contains(event.target)) {
                animation.cancel();
                animations.delete(element);
            }
        });
    });
})();
