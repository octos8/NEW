(() => {
    const element = document.querySelector('.aesop-demo-swiper');
    if (!element || typeof Swiper === 'undefined') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slider = new Swiper(element, {
        slidesPerView: 3.4,
        spaceBetween: 24,
        speed: 700,
        rewind: true,
        grabCursor: true,
        autoplay: { delay: 1600, disableOnInteraction: false, pauseOnMouseEnter: false },
        scrollbar: { el: element.querySelector('.aesop-demo-scrollbar'), draggable: true },
        a11y: { enabled: true, containerMessage: '이솝 베스트셀러 제품 슬라이드' }
    });
    let visible = false;
    const sync = () => {
        if (visible && !motion.matches) slider.autoplay.start();
        else slider.autoplay.stop();
    };
    slider.autoplay.stop();
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
    }, { threshold: 0 }).observe(element);
    motion.addEventListener('change', sync);
    element.addEventListener('focusin', () => slider.autoplay.stop());
    element.addEventListener('focusout', sync);
})();
