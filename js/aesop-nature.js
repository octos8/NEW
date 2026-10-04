(() => {
    const element = document.querySelector('.aesop-nature-swiper');
    if (!element || typeof Swiper === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slider = new Swiper(element, {
        slidesPerView: 1,
        speed: 900,
        rewind: true,
        grabCursor: true,
        autoplay: { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination: { el: element.querySelector('.swiper-pagination'), clickable: true }
    });
    slider.autoplay.stop();
    let visible = false;
    const update = () => visible && !reducedMotion.matches ? slider.autoplay.start() : slider.autoplay.stop();
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        update();
    }, { threshold: .2 }).observe(element);
    reducedMotion.addEventListener('change', update);
})();
