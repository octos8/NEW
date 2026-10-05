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
  if (gallery.id === 'popup' || gallery.id === 'detail') return;
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
   }
   gallery.querySelector('.work-gallery-caption h3').textContent = choice.dataset.title;
   gallery.querySelector('.work-gallery-caption p').innerHTML = choice.dataset.description;
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
 const choices = document.querySelector('#banner .work-gallery-choices');
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
 const strip = document.querySelector('#banner .work-gallery-choices');
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
 const strip = gallery?.querySelector('.work-gallery-choices');
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

/* Popup: click the artwork, then VIEW MORE to read its description. */
document.addEventListener('DOMContentLoaded', () => {
 const gallery = document.querySelector('#popup');
 if (!gallery) return;
 const layout = gallery.querySelector('.work-gallery-layout');
 const choices = [...gallery.querySelectorAll('.work-gallery-choice')];
 const carousel = document.createElement('div');
 carousel.className = 'swiper popup-art-carousel';
 const track = document.createElement('div');
 track.className = 'swiper-wrapper';
 carousel.append(track);
 const dialog = document.createElement('dialog');
 dialog.className = 'popup-art-dialog';
 dialog.setAttribute('aria-label', '팝업 디자인 설명');
 const close = document.createElement('button');
 close.className = 'popup-art-dialog-close'; close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', '설명 닫기');
 const title = document.createElement('h3');
 const description = document.createElement('p');
 dialog.append(close, title, description);
 gallery.append(dialog);
 let slider;
 const pausePopup = () => {
  if (!slider) return;
  slider.autoplay.stop();
  const position = slider.getTranslate();
  slider.setTransition(0);
  slider.setTranslate(position);
  slider.updateProgress(position);
  slider.updateActiveIndex();
  slider.updateSlidesClasses();
  slider.animating = false;
 };
 const resumePopup = (force = false) => {
  if (reduced || track.querySelector('.popup-art-description') || (!force && track.querySelector('.popup-art-frame:hover'))) return;
  slider.autoplay.start();
 };
 choices.forEach(choice => {
  const card = document.createElement('div'); card.className = 'swiper-slide popup-art-card';
  const photo = document.createElement('button'); photo.type = 'button'; photo.className = 'popup-art-photo'; photo.setAttribute('aria-label', choice.dataset.title + ' 자세히 보기');
  const image = document.createElement('img'); image.src = choice.dataset.src; image.alt = choice.dataset.title;
    photo.append(image);
  const frame = document.createElement('div'); frame.className = 'popup-art-frame';
  const syncFrame = () => {
   if (!image.naturalWidth) return;
   const cap = innerWidth <= 600 ? 460 : Math.min(650, Math.max(360, innerWidth * .46));
   frame.style.width = Math.min(card.clientWidth || cap, cap * image.naturalWidth / image.naturalHeight) + 'px';
  };
  image.addEventListener('load', syncFrame);
  new ResizeObserver(syncFrame).observe(card);
  const more = document.createElement('button'); more.type = 'button'; more.className = 'popup-art-more'; more.textContent = 'VIEW MORE'; more.hidden = true; more.setAttribute('aria-haspopup', 'dialog');
  photo.addEventListener('click', () => {
   if (slider?.touchEventsData?.isMoved) return;
   if (matchMedia('(max-width: 767px)').matches) {
    more.click();
    return;
   }
   track.querySelectorAll('.popup-art-more').forEach(button => { button.hidden = true; });
   track.querySelectorAll('.is-preview').forEach(item => item.classList.remove('is-preview'));
   more.hidden = false; card.classList.add('is-preview'); pausePopup(); more.focus({preventScroll: true});
  });
  more.addEventListener('click', event => {
   event.stopPropagation();
   pausePopup();
   if (frame.querySelector('.popup-art-description')) return;
   title.textContent = choice.dataset.title; description.innerHTML = choice.dataset.description;
   const mobilePopupTitle = matchMedia('(max-width: 767px)').matches;
   title.classList.toggle('popup-title-twosome', mobilePopupTitle && choice.dataset.title.startsWith('TWOSOME PLACE'));
   if (title.classList.contains('popup-title-twosome')) {
    title.replaceChildren(document.createTextNode('TWOSOME PLACE'), document.createElement('br'), document.createTextNode('시즌 프로모션'));
   }
   if (mobilePopupTitle && choice.dataset.title.startsWith('OLIVE YOUNG')) {
    title.replaceChildren(document.createTextNode('OLIVE YOUNG'), document.createElement('br'), document.createTextNode(choice.dataset.title.slice('OLIVE YOUNG'.length).trim()));
   }
      card.classList.remove('is-preview');
   more.hidden = true;
   const overlay = document.createElement('div'); overlay.className = 'popup-art-description';
   const dismiss = close.cloneNode(true);
   overlay.append(dismiss, title.cloneNode(true), description.cloneNode(true));
   frame.append(overlay);
   dismiss.addEventListener('click', () => { overlay.remove(); card.classList.remove('is-preview'); more.hidden = true; resumePopup(true); });
   overlay.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); dismiss.click(); } });
   dismiss.focus({preventScroll:true});
  });
  frame.addEventListener('pointerenter', event => {
   if (event.pointerType === 'touch') return;
   pausePopup();
   if (!frame.querySelector('.popup-art-description')) { more.hidden = false; card.classList.add('is-preview'); }
  });
  frame.addEventListener('pointerleave', event => {
   if (event.pointerType === 'touch') return;
   more.hidden = true; card.classList.remove('is-preview'); resumePopup();
  });
  frame.append(photo, more); card.append(frame); track.append(card);
 });
 const prev = gallery.querySelector('.work-gallery-prev');
 const next = gallery.querySelector('.work-gallery-next');
 gallery.querySelector('.work-gallery-choices').remove();
 layout.append(carousel, prev, next);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 slider = new Swiper(carousel, {
  loop: true, slidesPerView: 1, spaceBetween: 32, speed: reduced ? 0 : 7000,
  breakpoints: {768: {slidesPerView: 2, spaceBetween: 36}, 1100: {slidesPerView: 3, spaceBetween: 48}},
  autoplay: reduced ? false : {delay: 0, reverseDirection: true, disableOnInteraction: false, pauseOnMouseEnter: false},
  preventClicks: false, preventClicksPropagation: false,
  grabCursor: true
 });
 prev.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5L8 12L15 19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 next.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5L16 12L9 19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const movePopup = direction => {
  pausePopup();
  track.querySelectorAll('.popup-art-more').forEach(button => { button.hidden = true; });
  track.querySelectorAll('.is-preview').forEach(item => item.classList.remove('is-preview'));
  track.querySelectorAll('.popup-art-description').forEach(item => item.remove());
  // Advancing translates the artwork to the left; going back moves it right.
  slider.params.autoplay.reverseDirection = direction === 'right';
  slider.once('transitionEnd', () => resumePopup());
  if (direction === 'left') slider.slideNext(reduced ? 0 : 650);
  else slider.slidePrev(reduced ? 0 : 650);
 };
 prev.addEventListener('click', () => movePopup('left'));
 next.addEventListener('click', () => movePopup('right'));
 close.addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
 });
 dialog.addEventListener('close', () => {
  track.querySelectorAll('.popup-art-more').forEach(button => { button.hidden = true; });
   track.querySelectorAll('.is-preview').forEach(item => item.classList.remove('is-preview'));
  if (!reduced) slider.autoplay.start();
 });
 slider.on('slideChange', () => track.querySelectorAll('.popup-art-more').forEach(button => { button.hidden = true; }));
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
 const cards = [...gallery.querySelectorAll('.work-gallery-choice')].map(choice => {
  const article = document.createElement('article');
  const link = document.createElement('a'); link.href = choice.dataset.href;
  const image = document.createElement('img'); image.src = choice.dataset.src; image.alt = choice.dataset.title; image.loading = 'lazy';
  const title = document.createElement('h3'); title.textContent = choice.dataset.title;
  const copy = document.createElement('p'); copy.textContent = choice.dataset.description;
  link.className = 'detail-preview';
  link.addEventListener('click', event => {
   if (!matchMedia('(hover: none)').matches || link.classList.contains('is-preview')) return;
   event.preventDefault();
   layout.querySelectorAll('.detail-preview.is-preview').forEach(item => item.classList.remove('is-preview'));
   link.classList.add('is-preview');
  });
  const overlay = document.createElement('span'); overlay.className = 'detail-preview-overlay'; overlay.setAttribute('aria-hidden', 'true');
  const label = document.createElement('strong'); label.textContent = 'CLICK'; overlay.append(label);
  link.append(image, overlay); article.append(link, title, copy); return article;
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
 const strip = document.querySelector('#banner .work-gallery-choices');
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
   const delay = matchMedia('(min-width: 769px)').matches ? index * 240 : 0;
   card.querySelectorAll(':scope > h3, :scope > p').forEach(element => {
    const animation = element.animate([
     { opacity: 0, transform: 'translateY(32px)' },
     { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 750, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
   });
  });
 }, { threshold: .2, rootMargin: '0px 0px -32px 0px' });
 cards.forEach(card => { const title = card.querySelector(':scope > h3'); if (title) observer.observe(title); });
 motion.addEventListener('change', () => { if (motion.matches) animations.forEach(animation => animation.cancel()); });
});
