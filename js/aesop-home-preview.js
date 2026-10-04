(() => {
    const element = document.querySelector('.aesop-home-banner-swiper');
    if (!element || typeof Swiper === 'undefined') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slider = new Swiper(element, {
        initialSlide: 0,
        slidesPerView: 1,
        loop: true,
        speed: 800,
        grabCursor: true,
        autoplay: { delay: 2400, disableOnInteraction: false },
        a11y: { enabled: true }
    });
    let visible = false;
    const sync = () => visible && !motion.matches ? slider.autoplay.start() : slider.autoplay.stop();
    slider.autoplay.stop();
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
    }).observe(element);
    motion.addEventListener('change', sync);
})();
