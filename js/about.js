document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* ==== ABOUT INTRO SCROLL ANIMATION 다른 JS와 충돌하지 않도록 독립 실행   ======================== */
    (() => {

        const aboutIntro = document.querySelector('.about-intro');
        if (!aboutIntro) return;
        const aboutIntroObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle('is-visible', entry.isIntersecting);
                });
            },
            {
                threshold: 0,
                rootMargin: '0px 0px -24px 0px'
            }
        );
        aboutIntroObserver.observe(aboutIntro);
    })();

    /* Fade history content before it scrolls into its pinned heading. */
    (() => {
        const headings = [...document.querySelectorAll('.profile-timeline > article > h3')];
        if (!headings.length) return;
        const entries = headings.map(heading => ({
            heading,
            items: [...heading.parentElement.querySelectorAll(
                ':scope > ul > li > div > *, :scope > ul > li > span, :scope > div > *, :scope > span'
            )],
            dividers: [...heading.parentElement.querySelectorAll(':scope > ul > li')]
        }));
        let frame = 0;
        const update = () => {
            frame = 0;
            entries.forEach(({ heading, items, dividers }) => {
                const headingStyle = getComputedStyle(heading);
                const stickyTop = parseFloat(headingStyle.top);
                const rect = heading.getBoundingClientRect();
                const pinned = Number.isFinite(stickyTop) && rect.top <= stickyTop + 1;
                heading.classList.toggle('is-timeline-pinned',
                    pinned && rect.bottom > 0);
                // Exclude heading padding: readable rows should not fade in the normal gap.
                const edge = rect.bottom - (parseFloat(headingStyle.paddingBottom) || 0) + 4;
                items.forEach(item => {
                    const progress = pinned ? Math.max(0, Math.min(1,
                        (item.getBoundingClientRect().top - edge) / 32)) : 1;
                    const opacity = progress * progress * (3 - 2 * progress);
                    item.style.filter = `opacity(${opacity})`;
                });
                dividers.forEach(item => {
                    const progress = pinned ? Math.max(0, Math.min(1,
                        (item.getBoundingClientRect().bottom - edge) / 32)) : 1;
                    const opacity = progress * progress * (3 - 2 * progress);
                    item.style.setProperty('--divider-opacity', `${opacity * 100}%`);
                });
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('pageshow', schedule);
        window.addEventListener('load', schedule, { once: true });
        document.fonts?.ready.then(schedule);
        update();
    })();

    /* TOOLS & SKILLS */
    const skillMenus = document.querySelectorAll('.skill-menu');
    const skillPanels = document.querySelectorAll('.skill-detail');
    const skillDot = document.querySelector('.skills-dot');
    const skillOrbit = document.querySelector('.skills-orbit');
    const compactSkills = window.matchMedia('(max-width: 768px)');
    const tabSkills = window.matchMedia('(max-width: 402px)');

    // Fit the complete panel into a rectangle inscribed inside the circle.
    const fitSkillPanels = () => {
        if (!skillOrbit) return;
        const safeSize = skillOrbit.clientWidth * 0.68;
        skillPanels.forEach(panel => {
            if (tabSkills.matches) {
                panel.style.setProperty('--skill-copy-size', '1');
                panel.style.setProperty('--skill-panel-scale', '1');
                return;
            }
            if (compactSkills.matches) {
                // Resize type at the available width, instead of shrinking the whole layout.
                let low = 0.3;
                let high = 1;
                panel.style.setProperty('--skill-copy-size', '1');
                const safeHeight = skillOrbit.clientWidth * 0.62;
                if (panel.scrollHeight > safeHeight) {
                    for (let step = 0; step < 8; step++) {
                        const factor = (low + high) / 2;
                        panel.style.setProperty('--skill-copy-size', String(factor));
                        if (panel.scrollHeight <= safeHeight) low = factor;
                        else high = factor;
                    }
                    panel.style.setProperty('--skill-copy-size', String(low));
                }
                panel.style.setProperty('--skill-panel-scale', '1');
                return;
            }
            const scale = compactSkills.matches ? 1 : Math.min(1, safeSize / Math.max(1, panel.scrollWidth),
                safeSize / Math.max(1, panel.scrollHeight));
            panel.style.setProperty('--skill-panel-scale', String(scale));
        });
    };
    if (skillOrbit && 'ResizeObserver' in window) {
        const skillResizeObserver = new ResizeObserver(fitSkillPanels);
        skillResizeObserver.observe(skillOrbit);
    }
    document.fonts?.ready.then(fitSkillPanels);
    window.addEventListener('load', fitSkillPanels, { once: true });
    window.addEventListener('resize', fitSkillPanels, { passive: true });
    fitSkillPanels();

    let activeSkill = null;

    const syncSkillTabs = () => {
        const menuList = document.querySelector('.skill-menu-list');
        if (tabSkills.matches) menuList?.setAttribute('role', 'tablist');
        else menuList?.removeAttribute('role');
        skillMenus.forEach(menu => {
            const selected = menu === activeSkill;
            menu.id = `skill-tab-${menu.dataset.skill}`;
            menu.setAttribute('aria-controls', `skill-panel-${menu.dataset.skill}`);
            if (tabSkills.matches) {
                menu.setAttribute('role', 'tab');
                menu.setAttribute('aria-selected', String(selected));
                menu.removeAttribute('aria-pressed');
                menu.tabIndex = selected ? 0 : -1;
            } else {
                menu.removeAttribute('role');
                menu.removeAttribute('aria-selected');
                menu.setAttribute('aria-pressed', String(selected));
                menu.tabIndex = 0;
            }
        });
        skillPanels.forEach(panel => {
            panel.id = `skill-panel-${panel.dataset.panel}`;
            panel.setAttribute('role', tabSkills.matches ? 'tabpanel' : 'region');
            panel.setAttribute('aria-labelledby', `skill-tab-${panel.dataset.panel}`);
        });
    };

    const moveSkillDot = menu => {
        if (!skillDot || !menu) return;
        skillDot.style.left = `${menu.dataset.x}%`;
        skillDot.style.top = `${menu.dataset.y}%`;
    };

    const showSkill = menu => {
        const target = menu.dataset.skill;

        skillMenus.forEach(item => item.classList.remove('is-active'));
        skillPanels.forEach(panel => panel.classList.remove('is-active'));

        menu.classList.add('is-active');
        skillMenus.forEach(item => item.setAttribute('aria-pressed', String(item === menu)));

        const selectedPanel = document.querySelector(`.skill-detail[data-panel="${target}"]`);
        selectedPanel?.classList.add('is-active');

        activeSkill = menu;
        syncSkillTabs();
        moveSkillDot(menu);
        fitSkillPanels();
    };

    skillMenus.forEach(menu => {
        menu.addEventListener('keydown', event => {
            if (!tabSkills.matches) return;
            const menus = [...skillMenus];
            let index = menus.indexOf(menu);
            if (event.key === 'ArrowRight') index = (index + 1) % menus.length;
            else if (event.key === 'ArrowLeft') index = (index + menus.length - 1) % menus.length;
            else if (event.key === 'Home') index = 0;
            else if (event.key === 'End') index = menus.length - 1;
            else return;
            event.preventDefault();
            showSkill(menus[index]);
            menus[index].focus();
        });
        menu.addEventListener('mouseenter', () => {
            moveSkillDot(menu);
        });

        menu.addEventListener('mouseleave', () => {
            if (activeSkill) {
                moveSkillDot(activeSkill);
            } else {
                skillDot.style.left = '50%';
                skillDot.style.top = '0%';
            }
        });

        menu.addEventListener('click', () => {
            showSkill(menu);
        });
    });

    if (compactSkills.matches && skillMenus.length) showSkill(skillMenus[0]);
    compactSkills.addEventListener('change', () => {
        if (compactSkills.matches && !activeSkill && skillMenus.length) showSkill(skillMenus[0]);
        fitSkillPanels();
    });
    tabSkills.addEventListener('change', () => {
        if (!activeSkill && skillMenus.length) showSkill(skillMenus[0]);
        syncSkillTabs();
        fitSkillPanels();
    });
    syncSkillTabs();
    if ('IntersectionObserver' in window && skillOrbit) {
        const skillRevealObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            if (!activeSkill && skillMenus.length) showSkill(skillMenus[0]);
            skillRevealObserver.disconnect();
        }, { threshold: 0.15 });
        skillRevealObserver.observe(skillOrbit);
    } else if (!activeSkill && skillMenus.length) showSkill(skillMenus[0]);


});

/* Source: profile-typewriter.js */
/* Reveal each line once, preserving the full text for assistive technology. */
(() => {
    const summary = document.querySelector('.profile-typewriter');
    if (!summary || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const characters = [];
    const originals = [];
    let timer;
    let started = false;
    summary.querySelectorAll('p').forEach(line => {
        const text = line.textContent;
        originals.push({ line, text });
        const accessible = document.createElement('span');
        accessible.className = 'typing-accessible';
        accessible.textContent = text;
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        for (const character of text) {
            const span = document.createElement('span');
            span.className = 'typing-character';
            span.textContent = character;
            visual.append(span);
            characters.push(span);
        }
        line.replaceChildren(accessible, visual);
    });
    const finish = () => {
        clearTimeout(timer);
        originals.forEach(({ line, text }) => { line.textContent = text; });
        summary.classList.add('typing-complete');
    };
    const type = index => {
        if (motion.matches || index >= characters.length) { finish(); return; }
        characters[index].style.opacity = '1';
        timer = setTimeout(() => type(index + 1), characters[index].textContent === ' ' ? 45 : 85);
    };
    const observer = new IntersectionObserver(entries => {
        if (started || !entries.some(entry => entry.isIntersecting)) return;
        started = true;
        type(0);
        observer.disconnect();
    }, { threshold: .5 });
    observer.observe(summary);
    motion.addEventListener('change', () => {
        if (motion.matches) { observer.disconnect(); finish(); }
    });
})();


/* Source: profile-ribbons.js */
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


/* Source: about-title.js */
/* Reveal the three introductory words in reading order. */
(() => {
    const title = document.querySelector('.about-heading > .about-title');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!title || motion.matches || !('IntersectionObserver' in window)) return;
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const content = document.createDocumentFragment();
    text.split(/\s+/).forEach((word, index) => {
        if (index) content.append(document.createTextNode(' '));
        const span = document.createElement('span');
        span.className = 'about-title-word';
        span.textContent = word;
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--word-delay', `${index * .85}s`);
        content.append(span);
    });
    title.replaceChildren(content);
    title.classList.add('words-ready');
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        title.classList.add('words-visible');
        observer.disconnect();
    }, { threshold: .25, rootMargin: '0px 0px -8% 0px' });
    observer.observe(title);
    motion.addEventListener('change', () => {
        if (motion.matches) {
            title.classList.add('words-visible');
            observer.disconnect();
        }
    });
})();


/* Source: about-copy-typewriter.js */
/* Type the left sentence, then the right, without shifting the layout. */
(() => {
    const copy = document.querySelector('.about-copy-typewriter');
    if (!copy || !('IntersectionObserver' in window)) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const characters = [];
    copy.querySelectorAll('p').forEach(line => {
        const accessible = document.createElement('span');
        accessible.className = 'about-copy-accessible';
        accessible.textContent = line.textContent;
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        visual.innerHTML = line.innerHTML;
        const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            const fragment = document.createDocumentFragment();
            for (const character of node.textContent) {
                const span = document.createElement('span');
                span.className = 'about-copy-character';
                span.textContent = character;
                fragment.append(span);
                characters.push(span);
            }
            node.replaceWith(fragment);
        });
        line.replaceChildren(accessible, visual);
    });
    let timer;
    const finish = () => {
        clearTimeout(timer);
        characters.forEach(character => character.classList.add('is-typed'));
    };
    function type(index) {
        if (motion.matches || index >= characters.length) { finish(); return; }
        characters[index].classList.add('is-typed');
        timer = setTimeout(() => type(index + 1), 65);
    }
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        type(0);
    }, { threshold: .4 });
    observer.observe(copy);
    motion.addEventListener('change', () => {
        if (motion.matches) { observer.disconnect(); finish(); }
    });
})();


/* Source: about-note.js */
/* Draw the curly annotation once when it enters view. */
(() => {
    const arrow = document.querySelector('.about-note-arrow');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!arrow || motion.matches || !('IntersectionObserver' in window)) return;
    arrow.classList.add('is-draw-ready');
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        arrow.classList.add('is-drawn');
        observer.disconnect();
    }, { threshold: .3 });
    observer.observe(arrow);
    motion.addEventListener('change', () => {
        if (motion.matches) {
            arrow.classList.remove('is-draw-ready');
            observer.disconnect();
        }
    });
})();


/* Source: about-monitor.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
/* A shallow, tilted orbit carries each word behind and in front of the monitor. */
(() => {
    const scene = document.querySelector('.about-workspace-scene');
    const labels = [...document.querySelectorAll('.about-word-orbit li')];
    if (!scene || !labels.length) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = scene.clientWidth;
    new ResizeObserver(() => { width = scene.clientWidth; }).observe(scene);
    let phase = 0;
    let lastTime = 0;
    const tilt = -10 * Math.PI / 180;
    function draw() {
        labels.forEach((label, index) => {
            const angle = phase + index * Math.PI * 2 / labels.length;
            const depth = Math.sin(angle);
            const x = Math.cos(angle) * width * .4;
            const y = depth * width * .095;
            const tiltedX = x * Math.cos(tilt) - y * Math.sin(tilt);
            const tiltedY = x * Math.sin(tilt) + y * Math.cos(tilt);
            label.style.transform = `translate(${tiltedX}px, ${tiltedY}px) scale(${.92 + depth * .12})`;
            label.style.zIndex = depth >= 0 ? '3' : '0';
            label.style.opacity = depth >= 0 ? '1' : '.65';
        });
    }
    function animate(time) {
        const elapsed = lastTime ? Math.min(time - lastTime, 64) : 0;
        lastTime = time;
        if (!document.hidden && !reducedMotion.matches) phase += elapsed * Math.PI * 2 / 28000;
        draw();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
})();
});

/* Source: profile-story.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
﻿/* Keep the title pinned while scrolling through three reading panels. */
(() => {
    const story = document.querySelector('.profile-story');
    if (!story) return;
    const stage = story.querySelector('.profile-story-stage');
    const panels = [...story.querySelectorAll('.profile-collaboration-cards article')];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = value => Math.max(0, Math.min(1, value));
    let frame = 0;
    const update = () => {
        frame = 0;
        const enabled = !motion.matches && window.innerHeight >= 560;
        story.classList.toggle('is-scroll-story', enabled);
        const distance = story.offsetHeight - stage.offsetHeight;
        const progress = enabled ? clamp(-story.getBoundingClientRect().top / Math.max(1, distance)) : 0;
        const position = progress * panels.length;
        const active = Math.min(panels.length - 1, Math.floor(position));
        panels.forEach((panel, index) => {
            if (!enabled) {
                panel.style.removeProperty('transform');
                panel.style.removeProperty('opacity');
                panel.style.removeProperty('visibility');
                panel.removeAttribute('aria-hidden');
                return;
            }
            panel.style.transform = 'none';
            panel.style.opacity = index === active ? '1' : '0';
            panel.style.visibility = index === active ? 'visible' : 'hidden';
            panel.setAttribute('aria-hidden', String(index !== active));
        });
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('load', schedule, { once: true });
    motion.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule);
    update();
})();

});

/* Source: profile-overlap.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
/* Let tall profiles finish scrolling before the skills page covers them. */
(() => {
    const profile = document.querySelector('#about-me > .profile-story');
    if (!profile) return;
    const measure = () => {
        const top = Math.min(0, window.innerHeight - profile.offsetHeight);
        profile.style.setProperty('--profile-pin-top', `${top}px`);
    };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(profile);
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    measure();
})();

});

/* Open the existing skills content as an accessible modal. */
(() => {
    const dialog = document.getElementById('profile-skills-dialog');
    const opener = document.querySelector('.profile-skills-open');
    if (!dialog || !opener) return;
    let previousOverflow;
    opener.addEventListener('click', () => {
        previousOverflow = document.documentElement.style.overflow;
        dialog.showModal();
        document.documentElement.style.overflow = 'hidden';
        window.dispatchEvent(new Event('resize'));
    });
    dialog.querySelector('.profile-skills-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
        document.documentElement.style.overflow = previousOverflow ?? '';
        opener.focus();
    });
})();
/* Animate the profile facts independently of the rest of About Me. */
document.addEventListener('DOMContentLoaded', () => {
 const facts = document.querySelector('#about-me .editorial-profile-facts');
 if (!facts || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
 const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   facts.classList.toggle('is-facts-visible', entry.isIntersecting);
  });
 }, {threshold: .15});
 facts.classList.add('is-facts-reveal-ready');
 observer.observe(facts);
});
/* Staged motion for the introduction title, copy and design principles. */
document.addEventListener('DOMContentLoaded', () => {
 const section = document.querySelector('#about-header');
 if (!section || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
 const preference = matchMedia('(prefers-reduced-motion: reduce)');
 const running = new Set();
 const reveal = (element, frames, delay, duration = 1600) => {
  if (preference.matches) return;
  const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  running.add(animation);
  animation.finished.then(() => running.delete(animation)).catch(() => running.delete(animation));
 };
 const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (!entry.isIntersecting) {
    entry.target.getAnimations().forEach(animation => animation.cancel());
    entry.target.querySelectorAll('*').forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
    if (entry.target.matches('.about-monitor-title')) section.classList.remove('is-intro-prism-lit');
    entry.target.classList.remove('is-principle-revealed');
    return;
   }
   if (preference.matches) return;
   if (entry.target.matches('.about-monitor-title')) {
    entry.target.querySelectorAll('.about-monitor-title-line').forEach((line,index) => {
     reveal(line,[{opacity:0,transform:'translateY(40px)',filter:'blur(8px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],index*350,1900);
    });
    section.classList.add('is-intro-prism-lit');
   } else if (entry.target.matches('.about-intro-korean')) {
    entry.target.querySelectorAll(':scope > p').forEach((p,index) => {
     reveal(p,[{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],index*300);
    });
   } else {
    const index = [...section.querySelectorAll('.about-principles article')].indexOf(entry.target);
    const delay = innerWidth > 768 ? index*280 : 0;
    entry.target.classList.add('is-principle-revealed');
    entry.target.querySelectorAll('small,h4,p').forEach((element,i) => {
     reveal(element,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],delay+i*200);
    });
   }
  });
 }, {threshold:.15});
 section.querySelectorAll('.about-monitor-title,.about-intro-korean,.about-principles article').forEach(element=>observer.observe(element));
 preference.addEventListener('change',()=> { if(preference.matches) running.forEach(animation=>animation.cancel()); });
});