/* Fit text to its available width while preserving explicit <br> breaks. */
(() => {
    const start = () => {
        const excluded = 'script, style, noscript, svg, textarea, input, [aria-hidden="true"], .poster-content > p';
        const elements = [...document.body.querySelectorAll('*')].filter(element =>
            !element.closest(excluded) &&
            [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
        );
        const originals = new Map(elements.map(element => [element, {
            size: element.style.getPropertyValue('font-size'),
            priority: element.style.getPropertyPriority('font-size')
        }]));

        elements.forEach(element => {
            element.style.setProperty('white-space', 'nowrap', 'important');
            element.style.setProperty('overflow-wrap', 'normal', 'important');
            element.style.setProperty('word-break', 'normal', 'important');
            element.style.setProperty('min-width', '0');
        });

        const fit = () => {
            // Restore stylesheet sizes first so resizing never compounds a reduction.
            elements.forEach(element => {
                const original = originals.get(element);
                if (original.size) element.style.setProperty('font-size', original.size, original.priority);
                else element.style.removeProperty('font-size');
            });

            elements.forEach(element => {
                if (!element.getClientRects().length) return;
                const computed = getComputedStyle(element);
                if (computed.writingMode !== 'horizontal-tb' || computed.clipPath === 'inset(50%)') return;
                const inline = computed.display === 'inline';
                let container = inline ? element.parentElement : element;
                while (container && getComputedStyle(container).display === 'inline') container = container.parentElement;
                if (!container || !container.clientWidth) return;
                const containerStyle = getComputedStyle(container);
                const available = container.clientWidth - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight);
                if (available <= 1) return;

                const range = document.createRange();
                range.selectNodeContents(element);
                const width = () => range.getBoundingClientRect().width;
                if (width() <= available + .5) return;
                let low = 0;
                let high = parseFloat(computed.fontSize);
                for (let step = 0; step < 12; step++) {
                    const middle = (low + high) / 2;
                    element.style.setProperty('font-size', `${middle}px`, 'important');
                    if (width() > available) high = middle;
                    else low = middle;
                }
                element.style.setProperty('font-size', `${low}px`, 'important');
            });

        };

        let frame;
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(fit);
        };
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('load', schedule, { once: true });
        document.fonts.ready.then(schedule);
        // Hidden slides and skill panels are fitted when their state changes.
        new MutationObserver(schedule).observe(document.body, {
            subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'open']
        });
        schedule();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
