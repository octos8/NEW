(() => {
    const screen = document.querySelector('.aesop-home-live-screen');
    const target = screen?.querySelector('.aesop-preview-menu span:nth-child(5)');
    if (!target || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const page = document.createElement('div');
    page.className = 'aesop-promotion-demo-page';
    const frame = document.createElement('img');
    frame.src = './img/aesop-promotion-desktop.jpg';
    frame.alt = '이솝 프로모션 페이지 전체 화면';
    page.append(frame);
    const cursor = document.createElement('div');
    cursor.className = 'aesop-promotion-demo-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<svg viewBox="0 0 24 32"><path d="M2 2v24l6-6 5 10 4-2-5-10h9Z" fill="white" stroke="#252525" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    screen.append(page, cursor);
    let visible = false;
    let animations = [];
    const update = () => {
        animations.forEach(animation => animation.cancel());
        animations = [];
        if (!visible || preference.matches) return;
        const bounds = screen.getBoundingClientRect();
        // Promotion 02 starts about 51.2% down this captured page.
        const promotionOneHeight = frame.clientHeight * .512;
        const distance = Math.max(0, promotionOneHeight - screen.clientHeight);
        const menu = target.getBoundingClientRect();
        const start = `translate(${bounds.width * .62}px, ${bounds.height * .58}px)`;
        const end = `translate(${menu.left - bounds.left + menu.width * .6}px, ${menu.top - bounds.top + menu.height * .6}px)`;
        const options = { duration: 6000, fill: 'forwards', easing: 'linear' };
        animations.push(cursor.animate([
            { transform: start, opacity: 0, offset: 0 },
            { transform: start, opacity: 1, offset: .07, easing: 'ease-in-out' },
            { transform: end, opacity: 1, offset: .2 },
            { transform: end, opacity: 1, offset: .24 },
            { transform: `${end} scale(.8)`, opacity: 1, offset: .27 },
            { transform: end, opacity: 1, offset: .3 },
            { transform: end, opacity: 1, offset: .34 },
            { transform: end, opacity: 0, offset: .4 },
            { transform: end, opacity: 0, offset: 1 }
        ], options));
        animations.push(page.animate([
            { opacity: 0, visibility: 'hidden', offset: 0 },
            { opacity: 0, visibility: 'hidden', offset: .34 },
            { opacity: 1, visibility: 'visible', offset: .4 },
            { opacity: 1, visibility: 'visible', offset: 1 }
        ], { duration: 6000, fill: 'forwards', easing: 'linear' }));
        if (distance > 0) animations.push(frame.animate([
            { transform: 'translateY(0)', offset: 0 },
            { transform: 'translateY(0)', offset: .12 },
            { transform: `translateY(-${distance}px)`, offset: .9 },
            { transform: `translateY(-${distance}px)`, offset: 1 }
        ], { delay: 2600, duration: 10000, easing: 'linear', fill: 'both' }));
        const startTime = document.timeline.currentTime;
        animations.forEach(animation => { animation.startTime = startTime; });
    };
    frame.addEventListener('load', update);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .2 }).observe(screen);
    new ResizeObserver(update).observe(screen);
    preference.addEventListener('change', update);
})();
