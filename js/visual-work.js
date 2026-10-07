document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.work-gallery')) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* POSTER SCROLL ANIMATION */
    (() => {
        if (reducedMotion || !('IntersectionObserver' in window)) return;

        const posterBody = document.querySelector('.poster-body');
        if (!posterBody) return;

        const posterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-poster-visible', entry.isIntersecting);
            });
        }, {
            threshold: 0,
            rootMargin: '0px 0px -24px 0px'
        });

        posterBody.classList.add('poster-motion-ready');
        posterObserver.observe(posterBody);

        /* 항목의 위치는 유지하고 내부 이미지와 설명만 이동 */
        posterBody.querySelectorAll('.poster-list > .poster-item').forEach(item => {
            item.classList.add('poster-motion-ready');
            posterObserver.observe(item);
        });
    })();

    /* POPUP IMAGE SWIPER */
    const popupImageSwiper = new Swiper('.popup-image-swiper', {
        loop: true,
        initialSlide: 0,
        centeredSlides: false,
        speed: reducedMotion ? 0 : 4500,
        slidesPerView: 1.15,
        spaceBetween: 24,
        breakpoints: {
            402: { slidesPerView: 1.4, spaceBetween: 28 },
            768: { slidesPerView: 2.2, spaceBetween: 36 },
            1024: { slidesPerView: 3, spaceBetween: 48 }
        },
        grabCursor: true,
        slideToClickedSlide: false,
        autoplay: reducedMotion ? false : {
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        }
    });
    const bannerSwiper = new Swiper('.banner-swiper', {
        direction: 'horizontal',
        effect: 'slide',
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 24,
        roundLengths: true,
        loop: true,
        speed: reducedMotion ? 0 : 1100,
        grabCursor: true,
        noSwiping: false,
        autoplay: reducedMotion ? false : {
            delay: 2500,
            reverseDirection: false,
            disableOnInteraction: false,
            pauseOnMouseEnter: false
        },
        pagination: {
            el: '.banner-swiper .swiper-pagination',
            clickable: true,
        },
    });

    // Anchor pagination below the image, above the two-column caption.
    const bannerStation = document.querySelector('.banner-swiper');
    const positionBannerPagination = () => {
        const image = bannerSwiper.slides[bannerSwiper.activeIndex]?.querySelector('img');
        if (image && bannerStation) {
            bannerStation.style.setProperty('--banner-photo-height', `${image.getBoundingClientRect().height}px`);
        }
    };
    bannerSwiper.on('slideChange', positionBannerPagination);
    bannerSwiper.on('resize', positionBannerPagination);
    bannerStation?.querySelectorAll('img').forEach(image => {
        image.addEventListener('load', positionBannerPagination);
        if ('ResizeObserver' in window) new ResizeObserver(positionBannerPagination).observe(image);
    });
    positionBannerPagination();

    // Keep the first banner in place until the carousel enters the viewport.
    if (!reducedMotion && 'IntersectionObserver' in window) {
        bannerSwiper.autoplay.stop();
        const bannerObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) bannerSwiper.autoplay.start();
            else bannerSwiper.autoplay.stop();
        }, { threshold: 0.15 });
        bannerObserver.observe(document.querySelector('.banner-swiper'));
    }

});

/* Source: popup-details.js */
﻿/* Show descriptions directly over the selected photo. */
(() => {
    const station = document.querySelector('.popup-image-swiper');
    let active = null;
    let pausedSwiper = null;
    let resumeAutoplay = false;
    let allowTouchMove;
    const pauseMotion = () => {
        if (pausedSwiper || !station?.swiper) return;
        pausedSwiper = station.swiper;
        resumeAutoplay = pausedSwiper.autoplay?.running;
        allowTouchMove = pausedSwiper.allowTouchMove;
        const translate = pausedSwiper.getTranslate();
        pausedSwiper.autoplay?.stop();
        pausedSwiper.setTransition(0);
        pausedSwiper.setTranslate(translate);
        pausedSwiper.animating = false;
        pausedSwiper.allowTouchMove = false;
    };
    const close = (restoreFocus = false) => {
        if (!active) return;
        const previous = active;
        previous.frame.classList.remove('is-open');
        previous.overlay.hidden = true;
        previous.button.setAttribute('aria-expanded', 'false');
        active = null;
        if (pausedSwiper) {
            pausedSwiper.allowTouchMove = allowTouchMove;
            if (resumeAutoplay) pausedSwiper.autoplay?.start();
            pausedSwiper = null;
        }
        document.dispatchEvent(new Event('project-description-change'));
        if (restoreFocus) previous.button.focus({ preventScroll: true });
    };
    document.querySelectorAll('.popup-image-button, .poster-image-button').forEach((button, index) => {
        const caption = button.closest('.popup-slide')?.querySelector('figcaption') ||
            button.closest('.poster-item')?.querySelector('.poster-content');
        if (!caption) return;
        const frame = document.createElement('div');
        frame.className = 'project-photo';
        button.before(frame);
        frame.append(button);
        if (button.matches('.poster-image-button')) {
            const image = button.querySelector('img');
            const syncRatio = () => {
                if (image.naturalWidth && image.naturalHeight) {
                    frame.style.setProperty('--poster-image-ratio', image.naturalWidth / image.naturalHeight);
                }
            };
            image.addEventListener('load', syncRatio);
            syncRatio();
        }
        const overlay = document.createElement('div');
        overlay.className = 'project-photo-description';
        overlay.id = `project-photo-description-${index}`;
        overlay.hidden = true;
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'project-photo-close';
        dismiss.textContent = '×';
        dismiss.setAttribute('aria-label', '설명 닫기');
        const copy = document.createElement('div');
        copy.className = 'project-photo-copy';
        copy.append(...Array.from(caption.children, node => node.cloneNode(true)));
        overlay.append(dismiss, copy);
        frame.append(overlay);
        button.removeAttribute('aria-haspopup');
        button.setAttribute('aria-controls', overlay.id);
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', () => {
            if (button.closest('.popup-slide') && station?.swiper?.allowClick === false) return;
            if (active?.button === button) return close();
            close();
            pauseMotion();
            active = { button, frame, overlay };
            frame.classList.add('is-open');
            overlay.hidden = false;
            copy.scrollTop = 0;
            button.setAttribute('aria-expanded', 'true');
            document.dispatchEvent(new Event('project-description-change'));
            dismiss.focus({ preventScroll: true });
        });
        dismiss.addEventListener('click', () => close(true));
        button.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'touch') button.classList.add('is-hovered');
        });
        button.addEventListener('pointerleave', () => button.classList.remove('is-hovered'));
        button.addEventListener('pointercancel', () => button.classList.remove('is-hovered'));
    });
    document.addEventListener('click', event => {
        if (active && !active.frame.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && active) {
            event.preventDefault();
            close(true);
        }
    });
})();


/* Source: popup-title.js */
(() => {
    const title = document.querySelector('.popup-animated-title');
    if (!title || !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    title.classList.add('is-bounce-ready');
    const summary = document.querySelector('.popup-heading .section-summary');
    summary?.classList.add('popup-summary-ready');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const visibleClass = entry.target === title ? 'is-bouncing' : 'popup-summary-visible';
            entry.target.classList.toggle(visibleClass, entry.isIntersecting);
        });
    }, { threshold: .2, rootMargin: '0px 0px -24px 0px' });
    observer.observe(title);
    if (summary) observer.observe(summary);
})();


/* Source: poster-orbit.js */
/* Keep the posters aligned in one vertical stream moving upward. */
(() => {
    const section = document.querySelector('#poster');
    const stage = section?.querySelector('.poster-inner');
    const cards = [...(section?.querySelectorAll('.poster-item') ?? [])];
    if (!stage || !cards.length) return;

    const compact = window.matchMedia('(max-width: 1023px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let enabled = false;
    let frame = 0;
    let geometry;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const draw = () => {
        frame = 0;
        if (!enabled || !geometry || document.querySelector('.project-photo.is-open')) return;
        const { width, height, travel, sizes, centers, gutter } = geometry;
        const progress = clamp(-section.getBoundingClientRect().top / travel, 0, 1);
        cards.forEach((card, index) => {
            const size = sizes[index];
            const offset = centers[index] - progress * travel;
            const y = height * 0.54 + offset - size.height / 2;
            const visible = y < height && y + size.height > 0;
            card.style.visibility = visible ? 'visible' : 'hidden';
            // All posters share the same column and move only vertically.
            const x = Math.max(gutter, (width * 0.55 - size.width) / 2);
            card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    };

    const schedule = () => {
        if (enabled && !frame) frame = requestAnimationFrame(draw);
    };

    const measure = () => {
        enabled = !reducedMotion.matches;
        section.classList.toggle('poster-orbit-active', enabled);
        if (!enabled) {
            section.style.removeProperty('--poster-orbit-height');
            cards.forEach(card => {
                card.style.removeProperty('transform');
                card.style.removeProperty('visibility');
            });
            geometry = null;
            return;
        }
        const height = stage.clientHeight;
        const sizes = cards.map(card => ({ width: card.offsetWidth, height: card.offsetHeight }));
        const gap = compact.matches ? 56 : 100;
        // Start with the first poster just below the stage; scrolling brings
        // it into view before the rest of the continuous stream follows.
        const centers = [height * 0.46 + sizes[0].height / 2 + gap];
        sizes.slice(1).forEach((size, index) => {
            centers.push(centers[index] + sizes[index].height / 2 + gap + size.height / 2);
        });
        const travel = Math.max(1, centers[centers.length - 1]);
        section.style.setProperty('--poster-orbit-height', `${height + travel}px`);
        geometry = {
            width: stage.clientWidth,
            height,
            travel,
            centers,
            gutter: compact.matches ? 16 : Math.max(24, stage.clientWidth * 0.035),
            sizes
        };
        schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('project-description-change', schedule);
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { once: true });
    compact.addEventListener('change', measure);
    reducedMotion.addEventListener('change', measure);
    document.fonts?.ready.then(measure);
    section.querySelectorAll('img').forEach(img => img.addEventListener('load', measure, { once: true }));
    measure();
})();


/* Source: detail-typewriter.js */
/* Type the heading once without shifting its centered position. */
(() => {
    const title = document.querySelector('#detail .detail-heading h2');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!title || motion.matches || !('IntersectionObserver' in window)) return;
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const letters = Array.from(text, character => {
        const span = document.createElement('span');
        span.className = 'detail-typing-letter';
        span.textContent = character;
        span.setAttribute('aria-hidden', 'true');
        return span;
    });
    title.replaceChildren(...letters);
    let timer;
    let started = false;
    const finish = () => {
        clearTimeout(timer);
        letters.forEach(letter => letter.classList.add('is-written'));
    };
    const type = index => {
        if (motion.matches || index >= letters.length) { finish(); return; }
        letters[index].classList.add('is-written');
        timer = setTimeout(() => type(index + 1), letters[index].textContent === ' ' ? 120 : 240);
    };
    const observer = new IntersectionObserver(entries => {
        if (started || !entries.some(entry => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();
        type(0);
    }, { threshold: 1, rootMargin: '0px 0px -10% 0px' });
    observer.observe(title);
    motion.addEventListener('change', () => {
        if (motion.matches) { observer.disconnect(); finish(); }
    });
})();


/* Source: detail-popup-transition.js */
/* Reveal the popup through a growing circle while the detail remains still. */
(() => {
    const group = document.querySelector('.detail-popup-transition');
    const detail = group?.querySelector('#detail');
    const popup = group?.querySelector('#popup');
    if (!detail || !popup) return;
    if (detail.classList.contains('editorial-visual')) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let displayedProgress = 0;
    let lastTime = 0;
    const update = () => {
        frame = 0;
        if (motion.matches) return;
        const now = performance.now();
        const elapsed = Math.min(64, lastTime ? now - lastTime : 16);
        lastTime = now;
        const height = window.innerHeight;
        // Measure the layout position, unaffected by the reveal's transform.
        const top = group.getBoundingClientRect().top + popup.offsetTop;
        const targetProgress = Math.max(0, Math.min(1, 1 - top / height));
        displayedProgress += (targetProgress - displayedProgress) * (1 - Math.exp(-elapsed / 140));
        if (Math.abs(targetProgress - displayedProgress) < .0005) displayedProgress = targetProgress;
        const progress = displayedProgress;
        // Blur first; gently fade in the circle as its radius begins to grow.
        const smooth = value => value * value * (3 - 2 * value);
        const blurProgress = Math.min(1, progress / .45);
        const revealProgress = Math.max(0, (progress - .14) / .86);
        const eased = smooth(revealProgress);
        group.style.setProperty('--iris-blur', `${10 * smooth(blurProgress)}px`);
        group.style.setProperty('--iris-opacity', String(smooth(Math.min(1, revealProgress / .3))));
        const radius = Math.hypot(document.documentElement.clientWidth, height) / 2 + 2;
        group.style.setProperty('--iris-offset', `${-Math.max(0, Math.min(height, top))}px`);
        group.style.setProperty('--iris-clip', progress >= 1
            ? 'none'
            : `circle(${radius * eased}px at 50% ${height / 2}px)`);
        if (progress !== targetProgress) schedule();
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
        group.classList.toggle('is-iris-ready', !motion.matches);
        group.style.setProperty('--detail-pin-top', `${Math.min(0, innerHeight - detail.offsetHeight)}px`);
        schedule();
    };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(detail);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    motion.addEventListener('change', measure);
    measure();
})();


/* Source: banner-page-turn.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
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

});

/* Highlight a representative image when its category menu is selected. */
(() => {
    const section = document.querySelector('#visual-works');
    const nav = section?.querySelector('.editorial-visual-nav');
    const gallery = section?.querySelector('.editorial-visual-gallery');
    if (!nav || !gallery) return;
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            nav.classList.add('has-selection');
            gallery.classList.add('has-selection');
            nav.querySelectorAll('a').forEach(item => {
                const selected = item === link;
                item.classList.toggle('is-active', selected);
                if (selected) item.setAttribute('aria-current', 'true');
                else item.removeAttribute('aria-current');
            });
            gallery.querySelectorAll(':scope > a').forEach(item => {
                item.classList.toggle('is-active', item.getAttribute('href') === link.getAttribute('href'));
            });
        });
    });
})();
/* Visual works: representative image with category-specific thumbnails. */
document.addEventListener('DOMContentLoaded', () => {
 document.querySelectorAll('.work-gallery').forEach(gallery => {
  if (gallery.id === 'popup' || gallery.id === 'detail' || gallery.classList.contains('banner-mosaic')) return;
  const choices = [...gallery.querySelectorAll('.work-gallery-choice')];
  let selected = Math.max(0, choices.findIndex(choice => choice.classList.contains('is-selected')));
  const select = index => {
   selected = (index + choices.length) % choices.length;
   const choice = choices[selected];
   const image = gallery.querySelector('.work-gallery-main');
   image.src = choice.dataset.src; image.alt = choice.dataset.title;
   if (gallery.id === 'banner') {
    const tones = ['#eee7df', '#eee2d0', '#e5ecd8', '#e9e3d9'];
    gallery.style.setProperty('--banner-caption-color', tones[selected] || tones[0]);
    const bannerNumber = gallery.querySelector('[data-banner-number]');
    if (bannerNumber) bannerNumber.textContent = String(selected + 1).padStart(2, '0') + ' / ' + String(choices.length).padStart(2, '0');
    const moods = ['ELEGANT / LUMINOUS', 'DARK / PREMIUM', 'ENERGETIC / SPORTY', 'CALM / PREMIUM'];
    const focuses = ['PRODUCT / FABRIC', 'PRODUCT / LIGHT', 'TYPOGRAPHY / MOVEMENT', 'PRODUCT / TEXTURE'];
    const mood = gallery.querySelector('[data-banner-mood]');
    if (mood) {
     mood.textContent = moods[selected];
     gallery.querySelector('[data-banner-focus]').textContent = focuses[selected];
    }
   }
   gallery.querySelector('.work-gallery-caption h3').textContent = choice.dataset.title;
   gallery.querySelector('.work-gallery-caption p').innerHTML = choice.dataset.description;
   if (gallery.id === 'poster') {
    const caption = gallery.querySelector('.work-gallery-caption');
    const brand = caption.querySelector('[data-poster-brand]');
    if (brand) {
     brand.textContent = choice.dataset.title.split(' ')[0] === 'Mango' ? 'Mango Sorbet' : choice.dataset.title.split(' ')[0];
     caption.querySelector('[data-poster-number]').textContent = String(selected + 1).padStart(2, '0');
     const purposes = ['욕실 수납 제품 홍보', '여름 시즌 제품 프로모션', '스트리트 라이프스타일 제품 홍보', '뷰티 제품 이미지 홍보', '망고 소르베 여름 메뉴 홍보'];
     const designPoints = ['패턴 대비를 활용한 제품 시선 집중', '블루 배경과 대형 타이포그래피로 시즌 주목도 강화', '도심의 빈티지한 질감과 제품을 연결한 스트리트 무드', '핑크 톤과 곡선의 흐름으로 제품의 섬세함 강조', '옐로·블루 대비와 유기적 구도로 시원한 계절감 표현'];
     caption.querySelector('[data-poster-purpose]').textContent = purposes[selected] || '';
     caption.querySelector('[data-poster-design-point]').textContent = designPoints[selected] || '';
     const keywords = ['Interior / Lifestyle / Practical', 'Summer / Energy / Promotion', 'Street / Vintage / Lifestyle', 'Beauty / Soft / Curves', 'Summer / Fresh / Dessert'];
     caption.querySelector('[data-poster-keyword]').textContent = keywords[selected] || 'Design / Visual / Brand';
    }
   }
   const link = gallery.querySelector('.work-gallery-detail-link');
   if (link) link.href = choice.dataset.href;
   const count = gallery.querySelector('.work-gallery-count');
   if (count) count.textContent = (selected + 1) + ' / ' + choices.length;
   choices.forEach((item, i) => { item.classList.toggle('is-selected', i === selected); item.setAttribute('aria-pressed', String(i === selected)); });
  };
  choices.forEach((choice, i) => choice.addEventListener('click', () => select(i)));
  gallery.querySelector('.work-gallery-prev')?.addEventListener('click', () => select(selected - 1));
  gallery.querySelector('.work-gallery-next')?.addEventListener('click', () => select(selected + 1));
  if (gallery.id === 'banner') {
   gallery.addEventListener('banner-center-change', event => select(event.detail));
  }
 });
});

/* Duplicate banner thumbnails for a seamless right-to-left loop. */
document.addEventListener('DOMContentLoaded', () => {
 const choices = document.querySelector('#banner:not(.banner-mosaic) .work-gallery-choices');
 if (!choices) return;
 const originals = [...choices.querySelectorAll('.work-gallery-choice')];
 const track = document.createElement('div');
 track.className = 'banner-filmstrip-track';
 originals.forEach(button => track.append(button));
 originals.forEach(button => {
  const clone = button.cloneNode(true);
  clone.tabIndex = -1;
  clone.setAttribute('aria-hidden', 'true');
  clone.addEventListener('click', () => button.click());
  new MutationObserver(() => {
   clone.classList.toggle('is-selected', button.classList.contains('is-selected'));
  }).observe(button, { attributes: true, attributeFilter: ['class'] });
  track.append(clone);
 });
 choices.append(track);
});

/* Pause the thumbnail loop briefly when a banner is chosen. */
document.addEventListener('DOMContentLoaded', () => {
 const strip = document.querySelector('#banner:not(.banner-mosaic) .work-gallery-choices');
 if (!strip) return;
 let resumeTimer;
 strip.addEventListener('click', event => {
  if (!event.target.closest('.work-gallery-choice')) return;
  clearTimeout(resumeTimer);
  strip.classList.add('is-temporarily-paused');
  resumeTimer = setTimeout(() => strip.classList.remove('is-temporarily-paused'), 2500);
 });
});

/* Drive the representative banner from the thumbnail nearest the visible center. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.getElementById('banner');
 const strip = gallery?.classList.contains('banner-mosaic') ? null : gallery?.querySelector('.work-gallery-choices');
 const track = strip?.querySelector('.banner-filmstrip-track');
 if (!track) return;
 const thumbnails = [...track.querySelectorAll('.work-gallery-choice')];
 const originalCount = thumbnails.length / 2;
 let lastIndex = -1;
 let firstViewUntil = null;
 function syncCenter() {
  const featureBounds = gallery.querySelector('.work-gallery-feature').getBoundingClientRect();
  const featureVisible = featureBounds.top < innerHeight * .85 && featureBounds.bottom > 0;
  if (featureVisible && firstViewUntil === null) firstViewUntil = performance.now() + 2500;
  if (featureVisible && performance.now() >= firstViewUntil && !document.hidden && !strip.classList.contains('is-temporarily-paused') && !strip.classList.contains('is-dragging')) {
   const bounds = strip.getBoundingClientRect();
   const center = bounds.left + bounds.width / 2;
   let closest = -1;
   let distance = Infinity;
   thumbnails.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const currentDistance = Math.abs(rect.left + rect.width / 2 - center);
    if (currentDistance < distance) { distance = currentDistance; closest = index % originalCount; }
   });
   const currentSource = gallery.querySelector('.work-gallery-main').getAttribute('src');
   if (closest >= 0 && (closest !== lastIndex || currentSource !== thumbnails[closest].dataset.src)) {
    lastIndex = closest;
    gallery.dispatchEvent(new CustomEvent('banner-center-change', { detail: closest }));
   }
  }
  requestAnimationFrame(syncCenter);
 }
 requestAnimationFrame(syncCenter);
});

/* Compact popup artworks in one centered horizontal row. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.getElementById('popup');
 if (!gallery) return;
 const choices = [...gallery.querySelectorAll('.work-gallery-choice')];
 const dessertIndex = choices.findIndex(choice => choice.dataset.src.includes('디저트-팝업-디자인'));
 if (dessertIndex > 0) [choices[0], choices[dessertIndex]] = [choices[dessertIndex], choices[0]];
 gallery.classList.add('popup-inline-gallery');
 const layout = gallery.querySelector('.work-gallery-layout');
 const row = document.createElement('div'); row.className = 'popup-inline-row'; row.setAttribute('aria-label', '팝업 작업 선택');
 row.style.setProperty('--popup-artwork-count', choices.length);
 const copy = document.createElement('div'); copy.className = 'popup-inline-copy'; copy.setAttribute('aria-live', 'polite');
 const title = document.createElement('h3'); const description = document.createElement('p'); copy.append(title, description);
 let selected = 0, timer = null, visible = false;
 const stop = () => { clearInterval(timer); timer = null; };
 const start = () => { stop(); if (visible && !document.hidden) timer = setInterval(() => select((selected + 1) % choices.length), 2500); };
 const select = index => {
  selected = index;
  gallery.classList.add('has-popup-selection');
  copy.hidden = false;
  title.textContent = choices[index].dataset.title;
  description.innerHTML = choices[index].dataset.description;
  row.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  if (matchMedia('(max-width: 768px)').matches) {
   const artwork = row.children[index];
   const viewport = row.getBoundingClientRect();
   const bounds = artwork.getBoundingClientRect();
   row.scrollTo({
    left: row.scrollLeft + bounds.left - viewport.left - (row.clientWidth - bounds.width) / 2,
    behavior: 'instant'
   });
  }
 };
 choices.forEach((choice, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'popup-inline-art';
  button.setAttribute('aria-label', choice.dataset.title + ' 설명 보기');
  const image = document.createElement('img'); image.src = choice.dataset.src; image.alt = choice.dataset.title;
  image.width = 500; image.height = 750; button.append(image); button.addEventListener('click', () => { select(index); start(); });
  row.append(button);
 });
 layout.replaceChildren(row, copy); select(0);
 const observer = new IntersectionObserver(([entry]) => {
  const wasVisible = visible;
  visible = entry.isIntersecting;
  if (visible) { if (!wasVisible) select(0); start(); } else stop();
 }, { threshold: .25 });
 observer.observe(row);
 document.addEventListener('visibilitychange', start);
});
document.addEventListener('click', event => {
 const link = event.target.closest('#detail a[href], .work-gallery-detail-link');
 if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
 if (!/detail-(meltroom|novera|lune)\.html$/.test(new URL(link.href).pathname)) return;
 try {
  sessionStorage.setItem('detail-return-position', JSON.stringify({ y: window.scrollY, url: location.href }));
 } catch (_) {}
}, true);
// Show all three detail designs together, each linking to its full page.
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.querySelector('#detail');
 if (!gallery) return;
 const layout = gallery.querySelector('.work-gallery-layout');
 const choices = [...gallery.querySelectorAll('.work-gallery-choice')];
 const cards = [choices[2], choices[1], choices[0]].filter(Boolean).map((choice, index) => {
  const article = document.createElement('article');
  const link = document.createElement('a'); link.href = choice.dataset.href;
  const image = document.createElement('img'); image.src = choice.dataset.src; image.alt = choice.dataset.title; image.loading = 'lazy';
  const title = document.createElement('h3'); title.textContent = choice.dataset.title;
  const copy = document.createElement('p'); copy.innerHTML = choice.dataset.description;
  link.className = 'detail-preview';
  link.addEventListener('click', event => {
   if (!matchMedia('(hover: none)').matches || link.classList.contains('is-preview')) return;
   event.preventDefault();
   layout.querySelectorAll('.detail-preview.is-preview').forEach(item => item.classList.remove('is-preview'));
   link.classList.add('is-preview');
  });
  const overlay = document.createElement('span'); overlay.className = 'detail-preview-overlay'; overlay.setAttribute('aria-hidden', 'true');
  const label = document.createElement('strong'); label.textContent = 'CLICK'; overlay.append(label);
  const number = document.createElement('span'); number.className = 'detail-work-number';
  number.textContent = String(index + 1).padStart(2, '0');
  link.append(image, overlay); article.append(number, link, title, copy); return article;
 });
 layout.replaceChildren(...cards); layout.classList.add('detail-three-up');
});
/* Animate each category heading once when it comes into view. */
document.addEventListener('DOMContentLoaded', () => {
 if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
 const titles = document.querySelectorAll('#poster .work-gallery-header h2, #banner .work-gallery-header h2, #popup .work-gallery-header h2, #detail .work-gallery-header h2');
 const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   entry.target.querySelector('h2')?.classList.toggle('is-title-visible', entry.isIntersecting);
  });
 }, {threshold: .15});
 titles.forEach(title => { title.classList.add('is-title-reveal-ready'); observer.observe(title.parentElement); });
});
/* Limit the poster to the height of its thumbnail list. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.querySelector('#poster');
 const list = gallery?.querySelector('.work-gallery-choices');
 const image = gallery?.querySelector('.work-gallery-main');
 if (!list || !image) return;
 const sync = () => {
  const height = list.getBoundingClientRect().height;
  if (height > 0) { gallery.style.setProperty('--poster-list-height', height + 'px'); if (image.naturalHeight) gallery.style.setProperty('--poster-photo-width', (height * image.naturalWidth / image.naturalHeight) + 'px'); }
 };
 image.addEventListener('load', sync);
 new ResizeObserver(sync).observe(list);
 sync();
});
/* Move poster thumbnails upward together in a single straight column. */
document.addEventListener('DOMContentLoaded', () => {
 const orbit = document.querySelector('#poster .work-gallery-choices');
 if (!orbit) return;
 const items = [...orbit.querySelectorAll('.work-gallery-choice')];
 if (!items.length) return;
 const track = document.createElement('div');
 track.className = 'poster-thumbnail-track';
 items.forEach(item => { item.style.removeProperty('transform'); track.append(item); });
 items.forEach(item => {
  const clone = item.cloneNode(true);
  clone.tabIndex = -1; clone.setAttribute('aria-hidden', 'true');
  clone.addEventListener('click', () => item.click());
  track.append(clone);
 });
 orbit.append(track);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 let phase = 0, previous = 0, frame = 0, visible = false, pauseUntil = 0;
 let drag = null, suppressClickUntil = 0;
 const draw = () => {
  const gap = parseFloat(getComputedStyle(track).rowGap) || 0;
  const cycle = (track.scrollHeight + gap) / 2;
  if (cycle > 0) phase = ((phase % cycle) + cycle) % cycle;
  track.style.transform = 'translateY(' + (-phase) + 'px)';
 };
 const tick = time => {
  frame = 0;
  if (!visible || reduced.matches) { previous = 0; return; }
  if (previous && !drag && time >= pauseUntil) phase += Math.min(time - previous, 50) * .025;
  previous = time; draw(); frame = requestAnimationFrame(tick);
 };
 const start = () => { if (!frame && visible && !reduced.matches) frame = requestAnimationFrame(tick); };
 orbit.addEventListener('click', event => {
  if (event.target.closest('.work-gallery-choice')) pauseUntil = performance.now() + 1000;
 });
 orbit.addEventListener('dragstart', event => event.preventDefault());
 orbit.addEventListener('click', event => {
  if (performance.now() < suppressClickUntil) {
   event.preventDefault();
   event.stopImmediatePropagation();
  }
 }, true);
 orbit.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.pointerType !== 'mouse') return;
  drag = { id: event.pointerId, y: event.clientY, phase, moved: false };
 });
 orbit.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const delta = event.clientY - drag.y;
  if (!drag.moved && Math.abs(delta) > 5) {
   drag.moved = true;
   orbit.setPointerCapture(event.pointerId);
   orbit.classList.add('is-dragging');
  }
  if (!drag.moved) return;
  phase = drag.phase - delta;
  draw();
 });
 const finishDrag = event => {
  if (!drag || event.pointerId !== drag.id) return;
  if (drag.moved) suppressClickUntil = performance.now() + 300;
  drag = null;
  orbit.classList.remove('is-dragging');
  pauseUntil = performance.now() + 1000;
  if (orbit.hasPointerCapture(event.pointerId)) orbit.releasePointerCapture(event.pointerId);
 };
 window.addEventListener('pointerup', finishDrag);
 window.addEventListener('pointercancel', finishDrag);
 orbit.addEventListener('lostpointercapture', finishDrag);
 new ResizeObserver(draw).observe(orbit);
 new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; previous = 0; } }).observe(orbit);
 reduced.addEventListener('change', () => { if (reduced.matches) { cancelAnimationFrame(frame); frame = 0; previous = 0; phase = 0; draw(); } else start(); });
 draw();
});

/* Allow the moving banner strip to be dragged in either direction. */
document.addEventListener('DOMContentLoaded', () => {
 const strip = document.querySelector('#banner:not(.banner-mosaic) .work-gallery-choices');
 const track = strip?.querySelector('.banner-filmstrip-track');
 if (!track) return;
 let drag = null, suppressClick = false;
 strip.addEventListener('dragstart', event => event.preventDefault());
 strip.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const animation = track.getAnimations()[0];
  const matrix = new DOMMatrixReadOnly(getComputedStyle(track).transform);
  drag = { id: event.pointerId, x: event.clientX, time: Number(animation?.currentTime) || 0, offset: matrix.m41, animation, moved: false };
  animation?.pause();
  strip.classList.add('is-dragging');
 });
 strip.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const delta = event.clientX - drag.x;
  if (!drag.moved && Math.abs(delta) > 5) { drag.moved = true; strip.setPointerCapture(event.pointerId); }
  if (!drag.moved) return;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const distance = (track.scrollWidth + gap) / 2;
  if (drag.animation && distance > 0) {
   const duration = Number(drag.animation.effect.getTiming().duration);
   drag.animation.currentTime = ((drag.time - delta / distance * duration) % duration + duration) % duration;
  } else track.style.transform = 'translateX(' + Math.min(0, Math.max(strip.clientWidth - track.scrollWidth, drag.offset + delta)) + 'px)';
 });
 const finish = event => {
  if (!drag || event.pointerId !== drag.id) return;
  suppressClick = drag.moved;
  if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId);
  strip.classList.remove('is-dragging');
  if (drag.moved) strip.classList.remove('is-temporarily-paused');
  drag.animation?.play();
  drag = null;
  setTimeout(() => { suppressClick = false; }, 0);
 };
 window.addEventListener('pointerup', finish);
 window.addEventListener('pointercancel', finish);
 strip.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
});

/* Reveal visual-work titles and descriptions in numbered order on scroll. */
document.addEventListener('DOMContentLoaded', () => {
 const cards = [...document.querySelectorAll('.works-showcase-card')];
 if (!cards.length || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const animations = new Set();
 const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (!entry.isIntersecting) return;
   observer.unobserve(entry.target);
   if (motion.matches) return;
   const card = entry.target.closest('.works-showcase-card');
   const index = cards.indexOf(card);
   const delay = matchMedia('(min-width: 769px)').matches ? index * 1000 : 0;
   card.querySelectorAll(':scope > h3, :scope > p').forEach(element => {
    const animation = element.animate([
     { opacity: 0, transform: 'translateY(32px)' },
     { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 900, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
   });
  });
 }, { threshold: .2, rootMargin: '0px 0px -32px 0px' });
 cards.forEach(card => { const title = card.querySelector(':scope > h3'); if (title) observer.observe(title); });
 motion.addEventListener('change', () => { if (motion.matches) animations.forEach(animation => animation.cancel()); });
});

/* Editorial information panel for the selected poster. */
document.addEventListener('DOMContentLoaded', () => {
 const caption = document.querySelector('#poster .work-gallery-caption');
 if (!caption) return;
 const header = document.createElement('div');
 header.className = 'poster-caption-top';
 header.innerHTML = '<span data-poster-number>01</span>';
 caption.prepend(header);
 const rule = document.createElement('span');
 rule.className = 'poster-caption-rule'; rule.setAttribute('aria-hidden', 'true');
 caption.querySelector('h3').after(rule);
 const facts = document.createElement('dl');
 facts.className = 'poster-caption-facts';
 facts.innerHTML = '<div><dt>BRAND</dt><dd data-poster-brand>IKEA</dd></div><div><dt>PURPOSE</dt><dd data-poster-purpose>욕실 수납 제품 홍보</dd></div><div><dt>DESIGN POINT</dt><dd data-poster-design-point>패턴 대비를 활용한 제품 시선 집중</dd></div><div><dt>KEYWORD</dt><dd data-poster-keyword>Interior / Lifestyle / Practical</dd></div>';
 caption.append(facts);
});
/* Shared Selected Works rail across the visual-work pages. */
document.addEventListener('DOMContentLoaded', () => {

 ['poster', 'banner', 'popup', 'detail'].forEach((id, index) => {
  const gallery = document.getElementById(id);
  if (!gallery) return;
  const marker = document.createElement('div');
  marker.className = 'poster-selected-works';
  marker.setAttribute('role', 'navigation');
  marker.setAttribute('aria-label', '비주얼 작업 페이지 이동');
  marker.innerHTML = '<span>SELECTED WORKS</span><i class="poster-selected-line"></i><div class="poster-selected-dots">' +
   ['poster', 'banner', 'popup', 'detail'].map((target, dot) => '<a href="#' + target + '" aria-label="' + ['포스터', '배너', '팝업', '디테일'][dot] + ' 페이지로 이동"' + (dot === index ? ' class="is-active" aria-current="location"' : '') + '></a>').join('') + '</div>';
  gallery.append(marker);
 });
});
/* Editorial hierarchy for the banner explanation panel. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.getElementById('banner');
 const caption = gallery?.classList.contains('banner-mosaic') ? null : gallery?.querySelector('.work-gallery-caption');
 if (!caption) return;
 const choices = [...gallery.querySelectorAll('.work-gallery-choice')].filter(choice => choice.getAttribute('aria-hidden') !== 'true');
 const selected = Math.max(0, choices.findIndex(choice => choice.classList.contains('is-selected')));
 const number = document.createElement('span');
 number.className = 'banner-caption-number'; number.setAttribute('data-banner-number', '');
 number.textContent = String(selected + 1).padStart(2, '0') + ' / ' + String(choices.length).padStart(2, '0');
 caption.prepend(number);
 const rule = document.createElement('span');
 rule.className = 'banner-caption-rule'; rule.setAttribute('aria-hidden', 'true');
 caption.querySelector('h3').after(rule);
 const footer = document.createElement('div');
 footer.className = 'banner-caption-footer';
 footer.innerHTML = '<div><span>MOOD</span><span data-banner-mood></span></div><div><span>FOCUS</span><span data-banner-focus></span></div>';
 caption.append(footer);
 const moods = ['ELEGANT / LUMINOUS', 'DARK / PREMIUM', 'ENERGETIC / SPORTY', 'CALM / PREMIUM'];
 const focuses = ['PRODUCT / FABRIC', 'PRODUCT / LIGHT', 'TYPOGRAPHY / MOVEMENT', 'PRODUCT / TEXTURE'];
 footer.querySelector('[data-banner-mood]').textContent = moods[selected];
 footer.querySelector('[data-banner-focus]').textContent = focuses[selected];
 const image = gallery.querySelector('.work-gallery-main');
 const syncHeight = () => gallery.style.setProperty('--banner-image-height', image.getBoundingClientRect().height + 'px');
 image.addEventListener('load', syncHeight);
 new ResizeObserver(syncHeight).observe(image);
 syncHeight();
});
/* Two staggered banner rows, with translucent artwork descriptions. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.querySelector('#banner.banner-mosaic');
 if (!gallery) return;
 const choices = [...gallery.querySelectorAll('.work-gallery-choice')];
 const layout = gallery.querySelector('.work-gallery-layout');
 const viewport = document.createElement('div'); viewport.className = 'banner-mosaic-viewport';
 const dialog = document.createElement('dialog'); dialog.className = 'banner-mosaic-dialog';
 dialog.setAttribute('aria-label', '배너 디자인 설명');
 const close = document.createElement('button'); close.type = 'button'; close.className = 'banner-mosaic-close';
 close.textContent = '×'; close.setAttribute('aria-label', '설명 닫기');
 const title = document.createElement('h3'); const text = document.createElement('p');
 const facts = document.createElement('dl'); facts.className = 'banner-mosaic-facts';
 dialog.append(close, title, text, facts); gallery.append(dialog);
 const moods = ['ELEGANT / LUMINOUS', 'DARK / PREMIUM', 'ENERGETIC / SPORTY', 'CALM / PREMIUM'];
 const focuses = ['PRODUCT / FABRIC', 'PRODUCT / LIGHT', 'TYPOGRAPHY / MOVEMENT', 'PRODUCT / TEXTURE'];
 let opener;
 const initial = [2, 0, 1, 3].filter(index => choices[index]);
 for (let row = 0; row < 2; row++) {
  const track = document.createElement('div'); track.className = 'banner-mosaic-track';
  const order = row === 0 ? initial : [...initial.slice(2), ...initial.slice(0, 2)];
  for (let copy = 0; copy < 2; copy++) {
   const group = document.createElement('div'); group.className = 'banner-mosaic-group';
   order.forEach(index => {
    const choice = choices[index];
    const button = document.createElement('button'); button.type = 'button'; button.className = 'banner-mosaic-art';
    button.setAttribute('aria-label', choice.dataset.title + ' 설명 보기'); button.setAttribute('aria-haspopup', 'dialog');
    if (copy) { button.tabIndex = -1; button.setAttribute('aria-hidden', 'true'); }
    const image = document.createElement('img'); image.src = choice.dataset.src; image.alt = choice.dataset.title;
    image.width = 1920; image.height = 970; image.loading = 'lazy'; button.append(image);
    button.addEventListener('click', () => {
     opener = button; title.textContent = choice.dataset.title; text.innerHTML = choice.dataset.description;
     facts.innerHTML = '<div><dt>MOOD</dt><dd>' + moods[index] + '</dd></div><div><dt>FOCUS</dt><dd>' + focuses[index] + '</dd></div>';
     gallery.classList.add('is-description-open'); dialog.showModal();
    });
    group.append(button);
   });
   track.append(group);
  }
  viewport.append(track);
 }
 const advance = document.createElement('button');
 advance.type = 'button'; advance.className = 'banner-mosaic-advance';
 advance.setAttribute('aria-label', '배너를 왼쪽으로 조금 이동');
 advance.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>';
 layout.replaceChildren(viewport, advance);
 const tracks = [...viewport.querySelectorAll('.banner-mosaic-track')];
 let offset = 0, moving = false;

 const paint = instant => tracks.forEach(track => {
  track.style.transition = instant ? 'none' : '';
  track.style.transform = 'translateX(' + (-offset) + 'px)';
 });
 advance.addEventListener('click', () => {
  if (moving) return;
  moving = true;
  const card = viewport.querySelector('.banner-mosaic-art');
  const group = viewport.querySelector('.banner-mosaic-group');
  const gap = parseFloat(getComputedStyle(group).columnGap) || 0;
  offset += (card.getBoundingClientRect().width + gap) / 2;
  paint(false);
 });
 tracks[0].addEventListener('transitionend', event => {
  if (event.propertyName !== 'transform') return;
  const cycle = tracks[0].firstElementChild.getBoundingClientRect().width;
  if (cycle > 0 && offset >= cycle - 1) { offset %= cycle; paint(true); }
  moving = false;
 }); close.addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
 });
 dialog.addEventListener('close', () => { gallery.classList.remove('is-description-open'); opener?.focus({preventScroll:true}); });
 const observer = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) { offset = 0; moving = false; paint(true); }
 });
 observer.observe(viewport);
});
/* Reserve the full selected artwork and description height in the Popup page. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.querySelector('#popup.popup-selection');
 const feature = gallery?.querySelector('.popup-selection-feature');
 if (!feature) return;
 const heading = gallery.querySelector('.work-gallery-header h2');
 const sync = () => {
  const headingTransform = getComputedStyle(heading).transform;
  const revealOffset = headingTransform === 'none' ? 0 : new DOMMatrixReadOnly(headingTransform).m42;
  const titleTop = heading.getBoundingClientRect().top - gallery.getBoundingClientRect().top - revealOffset;
  gallery.style.setProperty('--popup-title-top', titleTop + 'px');
  gallery.style.setProperty('--popup-feature-height', (titleTop + feature.getBoundingClientRect().height + 64) + 'px');
 };
 const observer = new ResizeObserver(sync);
 observer.observe(feature);
 observer.observe(heading.parentElement);
 window.addEventListener('resize', sync);
 sync();
});
