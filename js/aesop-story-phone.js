(() => {
    const screen = document.querySelector('.aesop-story-phone-screen');
    const content = screen?.querySelector('.aesop-story-phone-content');
    if (!content || !content.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation;
    let visible = false;
    const update = () => {
        animation?.cancel();
        if (preference.matches) return;
        const distance = Math.max(0, content.clientHeight - screen.clientHeight);
        if (!distance) return;
        animation = content.animate([
            { transform: 'translateY(0)', offset: 0 },
            { transform: 'translateY(0)', offset: .06 },
            { transform: `translateY(-${distance}px)`, offset: .94 },
            { transform: `translateY(-${distance}px)`, offset: 1 }
        ], { duration: Math.max(18000, distance / 55 * 1000), iterations: Infinity, easing: 'linear' });
        if (!visible) animation.pause();
    };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? animation?.play() : animation?.pause(); }).observe(screen);
    new ResizeObserver(update).observe(content);
    new ResizeObserver(update).observe(screen);
    preference.addEventListener('change', update);
    update();
})();
