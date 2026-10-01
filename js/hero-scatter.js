/* Pin HOME until its photographed wood blocks finish scattering. */
(() => {
    const home = document.querySelector('#home');
    const photo = home?.querySelector('.hero-visual img');
    const stage = home?.querySelector('.hero-stage');
    if (!photo || !stage) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const layer = document.createElement('div');
    layer.className = 'hero-wood-scatter';
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    stage.append(layer);
    const fill = document.createElement('div');
    fill.className = 'hero-wood-fill';
    layer.append(fill);

    // Outlines in the original 1066 × 633 photo; no black background tiles.
    const outlines = [
        [[274,519],[298,505],[352,505],[355,596],[277,594]],
        [[353,518],[436,517],[438,597],[354,596]],
        [[437,519],[518,517],[520,597],[438,597]],
        [[520,518],[602,518],[604,599],[520,597]],
        [[604,519],[687,518],[688,599],[605,599]],
        [[689,520],[769,519],[770,600],[689,599]],
        [[772,520],[853,520],[854,600],[771,600]],
        [[855,521],[935,519],[934,599],[855,600]],
        [[353,436],[365,426],[434,428],[435,517],[354,517]],
        [[436,439],[518,436],[519,517],[436,517]],
        [[520,437],[602,436],[603,517],[520,518]],
        [[604,438],[687,437],[688,517],[604,518]],
        [[689,438],[770,437],[771,517],[689,519]],
        [[772,437],[794,430],[852,430],[854,518],[772,518]],
        [[855,439],[940,438],[938,519],[855,519]],
        [[435,357],[450,350],[516,350],[518,436],[435,438]],
        [[519,354],[601,353],[602,434],[519,436]],
        [[604,357],[687,354],[688,435],[604,437]],
        [[689,355],[770,354],[771,436],[689,437]],
        [[854,353],[940,353],[941,436],[855,437]],
        [[519,271],[526,265],[604,268],[601,352],[517,352]],
        [[606,274],[687,272],[687,353],[604,355]],
        [[689,272],[765,269],[771,274],[771,352],[689,353]]
    ];
    // Fixed seed keeps the chaotic paths stable when resizing or scrolling back.
    let seed = 73421;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const blocks = outlines.map(points => {
        const x = Math.min(...points.map(point => point[0]));
        const y = Math.min(...points.map(point => point[1]));
        const width = Math.max(...points.map(point => point[0])) - x;
        const height = Math.max(...points.map(point => point[1])) - y;
        const element = document.createElement('span');
        element.className = 'hero-wood-fragment';
        element.style.clipPath = `polygon(${points.map(point =>
            `${(point[0] - x) / width * 100}% ${(point[1] - y) / height * 100}%`).join(',')})`;
        layer.append(element);
        return {
            element, x, y, width, height,
            targetX: (random() - .5) * 2,
            targetY: random() * 1.4 - 1,
            bendX: (random() - .5) * .06,
            bendY: (random() - .5) * .06,
            spin: (random() - .5) * 64,
            delay: random() * .1,
            duration: .58 + random() * .16,
            fadeStart: .3 + random() * .12,
            depth: .9 + random() * .14
        };
    });
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
    const driftEase = value => {
        const p = clamp(value);
        return p * p * p * (p * (p * 6 - 15) + 10);
    };
    let geometry;
    let frame = 0;
    const render = () => {
        frame = 0;
        if (!geometry || preference.matches) {
            layer.hidden = true;
            photo.style.removeProperty('opacity');
            return;
        }
        const scroll = -home.getBoundingClientRect().top;
        const progress = clamp(scroll / geometry.distance);
        // Finish on a full white screen before releasing HOME to the introduction.
        const active = scroll > 0 && home.getBoundingClientRect().bottom > 0;
        layer.hidden = !active;
        photo.style.opacity = String(1 - smooth(progress / .18));
        if (!active) return;
        layer.style.opacity = String(smooth(progress / .055));
        fill.style.opacity = String(smooth((progress - .22) / .76));
        fill.style.setProperty('--hero-about-blend', String(smooth((scroll - geometry.release * .48) / (geometry.release * .3))));
        blocks.forEach(block => {
            const p = driftEase((progress - .025 - block.delay) / block.duration);
            const startX = geometry.left + block.x * geometry.scale;
            const startY = geometry.top + block.y * geometry.scale;
            const targetX = startX + block.targetX * Math.min(180, geometry.width * .2);
            const targetY = startY + block.targetY * Math.min(140, geometry.height * .18);
            const arc = Math.sin(p * Math.PI);
            const x = startX + (targetX - startX) * p + arc * block.bendX * geometry.width;
            const y = startY + (targetY - startY) * p + arc * block.bendY * geometry.height;
            const size = 1 + p * (block.depth - 1);
            block.element.style.opacity = String(1 - smooth((progress - block.fadeStart) / .48));
            const turn = driftEase((progress - block.delay - .07) / (block.duration + .08));
            block.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${block.spin * turn}deg) scale(${size})`;
        });
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(render);
    };
    const measure = () => {
        const enabled = !!photo.naturalWidth && !preference.matches;
        home.classList.toggle('hero-scatter-active', enabled);
        if (!enabled) {
            home.style.removeProperty('--hero-scatter-distance');
            geometry = null;
            schedule();
            return;
        }
        home.style.setProperty('--hero-scatter-distance', `${Math.round(Math.max(380, Math.min(680, window.innerHeight * .72)) * 1.9)}px`);
        const rect = photo.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const scale = rect.width / 1066;
        geometry = {
            left: rect.left - stageRect.left, top: rect.top - stageRect.top, scale,
            width: stage.clientWidth, height: stage.clientHeight,
            release: Math.max(1, home.offsetHeight - stage.offsetHeight),
            // Reserve the final stretch for a completely white viewport.
            distance: Math.max(1, (home.offsetHeight - stage.offsetHeight) * .65)
        };
        blocks.forEach(block => {
            block.element.style.width = `${block.width * scale}px`;
            block.element.style.height = `${block.height * scale}px`;
            block.element.style.backgroundImage = `url("${photo.currentSrc || photo.src}")`;
            block.element.style.backgroundSize = `${1066 * scale}px ${633 * scale}px`;
            block.element.style.backgroundPosition = `${-block.x * scale}px ${-block.y * scale}px`;
        });
        schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pageshow', measure);
    photo.addEventListener('load', measure);
    preference.addEventListener('change', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(home);
    measure();
})();
