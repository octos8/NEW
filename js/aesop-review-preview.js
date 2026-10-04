(() => {
    const screen = document.querySelector('.aesop-review-screen');
    const image = screen?.querySelector('.aesop-review-content');
    if (!image || !image.animate) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let animation;
    const update = () => {
        animation?.cancel();
        if (motion.matches) return;
        const distance = Math.max(0, image.clientHeight - screen.clientHeight);
        if (!distance) return;
        animation = image.animate([
            { transform: 'translateY(0)', offset: 0 },
            { transform: 'translateY(0)', offset: 0.1 },
            { transform: `translateY(-${distance}px)`, offset: 0.9 },
            { transform: `translateY(-${distance}px)`, offset: 1 }
        ], { duration: Math.max(5000, distance / 45 * 1000), iterations: Infinity, easing: 'linear' });
        if (!visible) animation.pause();
    };
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) animation?.play();
        else animation?.pause();
    }).observe(screen);
    new ResizeObserver(update).observe(screen);
    new ResizeObserver(update).observe(image);
    motion.addEventListener('change', update);
    update();
})();
