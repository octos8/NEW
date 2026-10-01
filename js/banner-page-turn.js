/* A flexible sheet: the top edge stays attached while the bottom curls up. */
document.addEventListener('DOMContentLoaded', () => {
    const station = document.querySelector('.banner-swiper');
    const swiper = station?.swiper;
    if (!swiper) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const activeImage = () => swiper.slides[swiper.activeIndex]?.querySelector('img');
    let previous = activeImage();
    let frame = 0;
    let canvas;
    const clear = () => {
        cancelAnimationFrame(frame);
        canvas?.remove();
        canvas = null;
    };
    swiper.on('slideChange', () => {
        const image = previous;
        previous = activeImage();
        clear();
        if (motion.matches || !image?.complete || !image.naturalWidth || !previous) return;
        const rect = previous.getBoundingClientRect();
        const parent = station.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        canvas = document.createElement('canvas');
        canvas.className = 'banner-page-curl';
        canvas.setAttribute('aria-hidden', 'true');
        const width = rect.width;
        const height = rect.height;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(width * dpr);
        canvas.height = Math.ceil(height * dpr);
        Object.assign(canvas.style, {
            width: `${width}px`, height: `${height}px`,
            left: `${rect.left - parent.left}px`, top: `${rect.top - parent.top}px`,
        });
        station.append(canvas);
        const context = canvas.getContext('2d');
        if (!context) { clear(); return; }
        context.scale(dpr, dpr);
        const started = performance.now();
        const rows = 96;
        const strip = height / rows;
        const render = now => {
            const time = Math.min(1, (now - started) / 1700);
            const progress = time * time * (3 - 2 * time);
            context.clearRect(0, 0, width, height);
            let y = 0;
            for (let row = 0; row < rows; row++) {
                const fraction = (row + .5) / rows;
                const angle = Math.min(Math.PI, Math.PI * progress * progress +
                    1.15 * Math.sin(Math.PI * progress) * fraction);
                const nextY = y + Math.cos(angle) * strip;
                const top = Math.min(y, nextY);
                const thickness = Math.abs(nextY - y) + .65;
                if (top + thickness > 0) {
                    if (angle < Math.PI / 2) {
                        context.drawImage(image, 0, row * image.naturalHeight / rows,
                            image.naturalWidth, image.naturalHeight / rows,
                            0, top, width, thickness);
                        context.fillStyle = `rgba(0,0,0,${Math.sin(angle) * .22})`;
                    } else {
                        context.fillStyle = '#f5f1eb';
                        context.fillRect(0, top, width, thickness);
                        context.fillStyle = `rgba(77,61,44,${.08 + Math.sin(angle) * .2})`;
                    }
                    context.fillRect(0, top, width, thickness);
                }
                y = nextY;
            }
            if (time < 1) frame = requestAnimationFrame(render);
            else clear();
        };
        render(started);
    });
    window.addEventListener('resize', clear);
    motion.addEventListener('change', () => {
        clear();
        if (motion.matches) swiper.autoplay?.stop();
    });
});
