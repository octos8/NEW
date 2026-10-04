/* Pull each complete sheet out of the shadow, and return it on a second click. */
(() => {
    const chapter = document.querySelector('#about-me');
    const profile = document.getElementById('profile-story-page');
    const tools = document.getElementById('tools-skills-page');
    const menu = chapter?.querySelector('.profile-ribbon-menu');
    if (!chapter || !profile || !tools || !menu) return;
    const buttons = [...document.querySelectorAll('[data-ribbon-target]')];
    const ribbons = buttons.filter(button => button.classList.contains('page-memo-ribbon'));
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    chapter.classList.add('ribbons-ready');
    tools.inert = true;
    const profileSpacer = document.createElement('div');
    profileSpacer.className = 'profile-sheet-spacer';
    profileSpacer.setAttribute('aria-hidden', 'true');
    profile.before(profileSpacer);
    let active = null;
    let timer;
    let entrance;
    let returnFrame = 0;
    const restore = () => {
        cancelAnimationFrame(returnFrame);
        returnFrame = 0;
        [profile, tools].forEach(panel => panel.style.removeProperty('transform'));
        chapter.classList.remove('is-scroll-return');
        chapter.classList.remove('is-tools-raised', 'is-profile-raised', 'is-sheet-lowering', 'is-sheet-opening');
        profile.inert = false;
        profile.removeAttribute('aria-hidden');
        tools.inert = true;
        ribbons.forEach(button => menu.append(button));
        [profile, tools].forEach(panel => [...panel.children].forEach(child => {
            child.inert = false;
            child.removeAttribute('aria-hidden');
        }));
        buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
        active = null;
    };
    const lowerSheet = (showAbout = false) => {
        if (!active || chapter.classList.contains('is-sheet-lowering')) return;
        entrance?.cancel();
        chapter.classList.remove('is-sheet-opening');
        chapter.classList.add('is-sheet-lowering');
        clearTimeout(timer);
        if (showAbout) {
            chapter.classList.add('is-scroll-return');
            const from = scrollY;
            const to = chapter.getBoundingClientRect().top + from;
            const distance = parseFloat(getComputedStyle(chapter).getPropertyValue('--tools-sheet-start')) || innerHeight;
            const started = performance.now();
            const tick = now => {
                const p = motion.matches ? 1 : Math.min(1, (now - started) / 700);
                const eased = p * p * (3 - 2 * p);
                [profile, tools].forEach(sheet => {
                    sheet.style.transform = `translateY(${distance * eased}px)`;
                });
                scrollTo({top: from + (to - from) * eased, behavior: 'instant'});
                if (p < 1) returnFrame = requestAnimationFrame(tick);
                else restore();
            };
            returnFrame = requestAnimationFrame(tick);
            return;
        }
        timer = setTimeout(restore, motion.matches ? 0 : 700);
    };
    const canReturn = () => (active === tools || active === profile) && !chapter.classList.contains('is-sheet-opening');
    addEventListener('wheel', event => {
        if (event.deltaY < -2 && canReturn()) lowerSheet(true);
    }, {passive: true});
    let previousScroll = scrollY;
    addEventListener('scroll', () => {
        const current = scrollY;
        if (current < previousScroll - 2 && canReturn()) lowerSheet(true);
        previousScroll = current;
    }, {passive: true});
    buttons.forEach(button => button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.ribbonTarget);
        if (!target) return;
        if (active === target) {
            lowerSheet();
            return;
        }
        clearTimeout(timer);
        cancelAnimationFrame(returnFrame);
        chapter.classList.remove('is-scroll-return');
        [profile, tools].forEach(panel => panel.style.removeProperty('transform'));
        if (!active) {
            profileSpacer.style.height = profile.offsetHeight + 'px';
            const top = Math.max(0, -chapter.getBoundingClientRect().top);
            chapter.style.setProperty('--tools-page-top', top + 'px');
            chapter.style.setProperty('--tools-sheet-start', Math.max(1, menu.offsetTop - 56 - top) + 'px');
        }
        chapter.classList.remove('is-sheet-lowering');
        chapter.classList.toggle('is-tools-raised', target === tools);
        chapter.classList.toggle('is-profile-raised', target === profile);
        tools.inert = false;
        ribbons.forEach(ribbon => document.getElementById(ribbon.dataset.ribbonTarget).prepend(ribbon));
        [profile, tools].forEach(panel => {
            [...panel.children].filter(child => !child.classList.contains('page-memo-ribbon')).forEach(child => {
                child.inert = panel !== target;
                child.setAttribute('aria-hidden', String(panel !== target));
            });
        });
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.ribbonTarget === target.id)));
        active = target;
        if (!motion.matches) {
            entrance?.cancel();
            target.getAnimations().forEach(animation => animation.cancel());
            chapter.classList.add('is-sheet-opening');
            const start = getComputedStyle(chapter).getPropertyValue('--tools-sheet-start').trim();
            entrance = target.animate([
                {transform: `translateY(${start})`},
                {transform: 'translateY(0)'},
            ], {duration: 1100, easing: 'cubic-bezier(.42, 0, .25, 1)'});
            entrance.finished.then(() => chapter.classList.remove('is-sheet-opening')).catch(() => {});
        }
    }));
})();
