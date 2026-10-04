document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* AESOP: 화면에 보이는 동안 아래로 스크롤하면 내부 휴대폰만 가볍게 흔들림 */
    (() => {
        const visual = document.querySelector('.aesop-opening-visual');
        const phone = visual?.querySelector('.aesop-opening-phone');
        if (!phone || !phone.animate) return;
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const shakeAngle = 1.2;
        const shakeDuration = 800;
        let visible = false;
        let lastScrollY = window.scrollY;
        let shakeAnimation = null;
        const visibilityObserver = new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            if (!visible) {
                shakeAnimation?.cancel();
                shakeAnimation = null;
            }
        });
        visibilityObserver.observe(visual);
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const scrollingDown = currentScrollY > lastScrollY;
            lastScrollY = currentScrollY;
            if (!visible || !scrollingDown || motionPreference.matches || shakeAnimation) return;
            shakeAnimation = phone.animate([
                { rotate: '0deg' },
                { rotate: `${shakeAngle}deg` },
                { rotate: `${-shakeAngle}deg` },
                { rotate: `${shakeAngle * 0.5}deg` },
                { rotate: '0deg' }
            ], { duration: shakeDuration, easing: 'ease-in-out' });
            shakeAnimation.onfinish = () => { shakeAnimation = null; };
        }, { passive: true });
        motionPreference.addEventListener('change', () => {
            if (motionPreference.matches) {
                shakeAnimation?.cancel();
                shakeAnimation = null;
            }
        });
    })();

});

/* Source: device-mockups.js */
/* Project the original screenshots onto the four screen corners of each render. */
(() => {
    const layouts = [
        {
            selector: '.lune-monitor:not(.lune-monitor--straight), .lune-hero-monitor .lune-monitor-body',
            size: [1536, 1024],
            corners: [[170, 99], [1382, 65], [1383, 744], [174, 728]],
            radius: '0'
        },
        {
            selector: '.responsive-stage-tablet, .lune-finale .lune-tablet',
            size: [1448, 1086],
            corners: [[198, 166], [1293, 182], [1294, 914], [198, 924]],
            radius: '1.2% / 1.8%'
        },
        {
            selector: '.aesop-responsive-phones > .aesop-device--phone, .lune-phone-fan > .lune-phone',
            size: [1024, 1536],
            corners: [[247, 119], [760, 66], [760, 1455], [247, 1415]],
            radius: '13% / 5.2%'
        }
    ];

    // Homography from a unit square to a quadrilateral (TL, TR, BR, BL).
    function project(points, width, height) {
        const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
        const dx1 = x1 - x2, dx2 = x3 - x2;
        const dy1 = y1 - y2, dy2 = y3 - y2;
        const dx3 = x0 - x1 + x2 - x3;
        const dy3 = y0 - y1 + y2 - y3;
        const denominator = dx1 * dy2 - dx2 * dy1;
        if (Math.abs(denominator) < 1e-8) return null;
        const g = (dx3 * dy2 - dx2 * dy3) / denominator;
        const h = (dx1 * dy3 - dx3 * dy1) / denominator;
        return [
            (x1 - x0 + g * x1) / width, (y1 - y0 + g * y1) / width, 0, g / width,
            (x3 - x0 + h * x3) / height, (y3 - y0 + h * y3) / height, 0, h / height,
            0, 0, 1, 0,
            x0, y0, 0, 1
        ];
    }

    const devices = new Map();
    for (const layout of layouts) {
        document.querySelectorAll(layout.selector).forEach(device => {
            const screen = device.querySelector(':scope > .lune-screen, :scope > .aesop-device-screen');
            if (screen) devices.set(device, { layout, screen });
        });
    }

    const observer = new ResizeObserver(entries => {
        for (const { target, contentRect } of entries) {
            const { layout, screen } = devices.get(target);
            const { width, height } = contentRect;
            if (!width || !height) continue;
            const points = layout.corners.map(([x, y]) => [x / layout.size[0] * width, y / layout.size[1] * height]);
            const screenWidth = (points[1][0] + points[2][0] - points[0][0] - points[3][0]) / 2;
            const screenHeight = (points[2][1] + points[3][1] - points[0][1] - points[1][1]) / 2;
            const matrix = project(points, screenWidth, screenHeight);
            if (!matrix) continue;
            Object.assign(screen.style, {
                left: '0px', top: '0px',
                width: `${screenWidth}px`, height: `${screenHeight}px`,
                clipPath: 'none', borderRadius: layout.radius,
                transformOrigin: '0 0',
                transform: `matrix3d(${matrix.join(',')})`
            });
        }
    });
    devices.forEach((_, device) => observer.observe(device));
})();


/* Source: aesop-bestseller.js */
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


/* Source: aesop-story-connector.js */
(() => {
    const section = document.querySelector('.aesop-story-details');
    if (!section) return;
    const phone = section.querySelector('.aesop-story-selection');
    const panel = section.querySelector('.aesop-story-detail-header');
    const svg = section.querySelector('.aesop-story-connector');
    const update = () => {
        const base = section.getBoundingClientRect();
        const a = phone.getBoundingClientRect();
        const b = panel.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
        const x1 = a.left + a.width / 2 - base.left;
        const x2 = b.left - base.left - 20;
        const y = a.top - base.top;
        const endY = b.top + b.height / 2 - base.top;
        const bend = (a.right - base.left + x2) / 2;
        const lineY = y - 24;
        const direction = endY >= lineY ? 1 : -1;
        const radius = Math.max(0, Math.min(12, (bend - x1) / 2, (x2 - bend) / 2, Math.abs(endY - lineY) / 2));
        svg.querySelector('path').setAttribute('d',
            `M ${x1} ${y} V ${lineY + radius} Q ${x1} ${lineY} ${x1 + radius} ${lineY} H ${bend - radius} Q ${bend} ${lineY} ${bend} ${lineY + direction * radius} V ${endY - direction * radius} Q ${bend} ${endY} ${bend + radius} ${endY} H ${x2}`);
    };
    const observer = new ResizeObserver(update);
    [section, phone, panel].forEach(el => observer.observe(el));
    update();
})();


/* Source: aesop-review-preview.js */
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


/* Source: aesop-promotion-demo.js */
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


/* Source: project-links.js */
(() => {
    const links = [...document.querySelectorAll('.aesop-links, .lune-links')].map(nav => ({
        nav,
        project: nav.closest('.aesop-case, .lune-case'),
        placeholder: null,
    })).filter(item => item.project);
    const header = document.querySelector('.site-header');
    let frame = 0;

    function update() {
        frame = 0;
        const top = Math.max(16, (header?.getBoundingClientRect().bottom ?? 0) + 12);

        links.forEach(item => {
            const { nav, project } = item;
            // Keep project links available at every viewport size.
            const anchor = (item.placeholder ?? nav).getBoundingClientRect();

            if (anchor.top >= top) {
                if (item.placeholder) {
                    nav.classList.remove('project-links-sticky');
                    ['top', 'left', 'width'].forEach(key => nav.style.removeProperty(`--project-links-${key}`));
                    item.placeholder.remove();
                    item.placeholder = null;
                }
                return;
            }

            if (!item.placeholder) {
                const style = getComputedStyle(nav);
                const placeholder = document.createElement('div');
                placeholder.setAttribute('aria-hidden', 'true');
                placeholder.style.height = `${anchor.height}px`;
                placeholder.style.marginTop = style.marginTop;
                placeholder.style.marginBottom = style.marginBottom;
                nav.before(placeholder);
                item.placeholder = placeholder;
                nav.classList.add('project-links-sticky');
            }

            const slot = item.placeholder.getBoundingClientRect();
            nav.style.setProperty('--project-links-left', `${slot.left}px`);
            nav.style.setProperty('--project-links-width', `${slot.width}px`);
            const height = nav.getBoundingClientRect().height;
            item.placeholder.style.height = `${height}px`;
            nav.style.setProperty('--project-links-top', `${Math.min(top, project.getBoundingClientRect().bottom - height)}px`);
        });
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    window.addEventListener('pageshow', schedule);
    const observer = new ResizeObserver(schedule);
    links.forEach(({ project }) => observer.observe(project));
    if (header) observer.observe(header);
    document.fonts.ready.then(schedule);
    schedule();
})();


/* Source: project-reveal.js */
/* Replay project content entrances whenever it returns to the viewport. */
(() => {
    const project = document.querySelector('#project');
    if (!project || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const targets = new Map();
    const animations = new Map();
    const visible = new Set();

    const phoneFan = project.querySelector('.lune-phone-fan');
    if (phoneFan) {
        phoneFan.classList.add('phone-fan-ready');
        const fanObserver = new IntersectionObserver(([entry]) => {
            phoneFan.classList.toggle('phone-fan-visible', entry.isIntersecting);
        }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
        fanObserver.observe(phoneFan);
    }

    const heroPhone = project.querySelector('.lune-hero-phone');
    if (heroPhone) {
        const phoneObserver = new IntersectionObserver(([entry]) => {
            heroPhone.classList.toggle('is-ringing', entry.isIntersecting && entry.intersectionRatio >= 0.25 && !reducedMotion.matches);
        }, { threshold: [0, 0.25] });
        phoneObserver.observe(heroPhone);
        reducedMotion.addEventListener('change', () => {
            if (reducedMotion.matches) heroPhone.classList.remove('is-ringing');
        });
    }

    const register = (selector, direction, stagger = 0) => {
        const groupIndexes = new Map();
        project.querySelectorAll(selector).forEach(element => {
            const group = element.parentElement;
            const index = groupIndexes.get(group) ?? 0;
            targets.set(element, { direction, delay: index * stagger });
            groupIndexes.set(group, index + 1);
        });
    };

    register('.aesop-bestseller-demo .aesop-demo-copy-content, .aesop-detail-demo .aesop-demo-copy-content', 'left');
    register('.aesop-home-demo .aesop-demo-copy-content', 'right');
    const improvements = project.querySelector('.aesop-improvements-grid');
    if (improvements) {
        const pointsObserver = new IntersectionObserver(([entry]) => {
            const contents = improvements.querySelectorAll('.aesop-improvement-content');
            if (!entry.isIntersecting) {
                contents.forEach(content => content.getAnimations().forEach(animation => animation.cancel()));
                return;
            }
            if (reducedMotion.matches) return;
            contents.forEach((content, index) => {
                content.animate([
                    { opacity: 0, translate: '0px 32px' },
                    { opacity: 1, translate: '0px 0px' }
                ], {
                    duration: 800,
                    delay: index * 1100,
                    easing: 'cubic-bezier(.22,1,.36,1)',
                    fill: 'backwards'
                });
            });
        }, { threshold: 0.15 });
        pointsObserver.observe(improvements);
        reducedMotion.addEventListener('change', () => {
            if (reducedMotion.matches) improvements.querySelectorAll('.aesop-improvement-content').forEach(content => {
                content.getAnimations().forEach(animation => animation.cancel());
            });
        });
    }

    const gaugeObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const fill = entry.target;
            if (!entry.isIntersecting) {
                fill.getAnimations().forEach(animation => animation.cancel());
                return;
            }
            if (reducedMotion.matches) return;
            fill.animate([
                { transform: 'scaleX(0)' },
                { transform: 'scaleX(1)' }
            ], { duration: 1200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
        });
    }, { threshold: .25 });
    project.querySelectorAll('.aesop-contribution-track > span').forEach(fill => {
        fill.style.transformOrigin = 'left center';
        gaugeObserver.observe(fill);
    });
    register('.aesop-responsive-copy > *, .aesop-responsive-detail > *', 'up', 130);
    register('.aesop-responsive-finale > h3', 'down');
    register('.aesop-responsive-finale > p', 'up');

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
            const isMockupCopy = element.classList.contains('aesop-demo-copy-content');
            const entranceX = isMockupCopy ? (direction === 'left' ? -48 : 48) : x;
            const entranceY = isMockupCopy ? 0 : y;
            const animation = element.animate([
                { opacity: 0, translate: `${entranceX}px ${entranceY}px` },
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


/* Source: detail-view.js */
(() => {
const closeLink = document.querySelector('.back-link');
closeLink?.setAttribute('aria-label', '상세페이지 목록으로 돌아가기');
closeLink?.addEventListener('click', event => {
    event.preventDefault();
    const returnUrl = new URL(event.currentTarget.href);
    returnUrl.searchParams.set('return', 'detail-position');
    window.location.replace(returnUrl.href);
});

})();

/* Source: aesop-home-preview.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
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

});

/* Source: aesop-nature.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
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

});

/* Source: aesop-story-phone.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
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

});
