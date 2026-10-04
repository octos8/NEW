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
    const heroName = document.querySelector('.hero-name');
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const title = heroTitle.textContent.trim();
        heroTitle.setAttribute('aria-label', title);
        const ns = 'http://www.w3.org/2000/svg';
        const make = (tag, attributes) => {
            const node = document.createElementNS(ns, tag);
            Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
            return node;
        };
        const drawing = make('svg', {
            viewBox: '0 0 940 170', class: 'structure-blueprint',
            'aria-hidden': 'true', focusable: 'false'
        });
        const grid = make('g', { class: 'structure-guides' });
        [14, 32, 136, 156].forEach(y => {
            grid.append(make('line', { x1: 10, y1: y, x2: 930, y2: y }));
        });
        for (let index = 0; index <= title.length; index++) {
            const x = 20 + index * 100;
            grid.append(make('line', { x1: x, y1: 0, x2: x, y2: 170 }));
            [14, 136].forEach(y => grid.append(make('circle', { cx: x, cy: y, r: 1.9 })));
            if (index < title.length) {
                grid.append(make('line', { x1: x + 50, y1: 0, x2: x + 50, y2: 170, class: 'structure-guide-minor' }));
            }
        }
        // Geometric letter outlines: broad stems, squared counters, bevelled corners.
        const glyphs = {
            S: 'M18 0H88V27H34V38H68L88 55V86L70 104H0V77H54V65H20L0 48V18Z',
            T: 'M0 0H88V28H61V104H27V28H0Z',
            R: 'M0 0H66L88 21V49L69 67L90 104H52L34 72V104H0ZM34 27V46H53V27Z',
            U: 'M0 0H34V73H54V0H88V83L69 104H19L0 83Z',
            C: 'M20 0H88V31H55V27H34V77H55V73H88V104H20L0 84V20Z',
            E: 'M0 0H88V27H34V39H80V65H34V77H88V104H0Z'
        };
        drawing.append(grid);
        Array.from(title).forEach((letter, index) => {
            const placement = make('g', { transform: `translate(${26 + index * 100} 32)` });
            const block = make('path', {
                d: glyphs[letter], class: 'structure-letter', 'fill-rule': 'evenodd'
            });
            block.style.setProperty('--letter-index', index);
            placement.append(block);
            drawing.append(placement);
        });
        heroTitle.replaceChildren(drawing);
    }
    const playHeroName = () => {
        if (!heroName || reducedMotion) return;
        heroName.classList.remove('is-entering');
        heroTitle?.classList.remove('is-entering');
        void heroName.offsetWidth;
        heroName.classList.add('is-entering');
        heroTitle?.classList.add('is-entering');
    };
    playHeroName();

    // Replay once HOME has scrolled back into view, including long scrolls.
    let heroScrollFrame;
    const replayHeroOnHome = target => {
        cancelAnimationFrame(heroScrollFrame);
        const startedAt = performance.now();
        const waitForHome = () => {
            if (Math.abs(target.getBoundingClientRect().top) <= 2 || window.scrollY <= 2) {
                playHeroName();
                return;
            }
            if (performance.now() - startedAt > 2500) return;
            heroScrollFrame = requestAnimationFrame(waitForHome);
        };
        heroScrollFrame = requestAnimationFrame(waitForHome);
    };

    /* Collapse the header after HOME; expand the same navigation sideways. */
    const header = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');
    const homeSection = document.querySelector('#home');
    const mobileMenu = window.matchMedia('(max-width: 768px)');
    let navOpen = false;
    let navCompact = false;
    let navFrame = 0;

    const renderNav = () => {
        header?.classList.toggle('is-compact', navCompact);
        header?.classList.toggle('is-menu-open', navOpen);
        const visible = !navCompact || navOpen;
        if (siteNav) {
            siteNav.inert = !visible;
            siteNav.setAttribute('aria-hidden', String(!visible));
        }
        navToggle?.setAttribute('aria-expanded', String(visible));
        navToggle?.setAttribute('aria-label', navOpen ? '메뉴 닫기' : '메뉴 열기');
    };
    const closeNav = () => {
        if (navCompact && siteNav?.contains(document.activeElement)) {
            navToggle?.focus({ preventScroll: true });
        }
        navOpen = false;
        renderNav();
    };
    const syncNavLayout = () => {
        navFrame = 0;
        const onHome = (document.querySelector('#about')?.getBoundingClientRect().top ?? 0) > 80;
        header?.classList.toggle('is-home-hidden', onHome);
        if (header) header.inert = onHome;
        if (onHome && navOpen) closeNav();
        const nextCompact = true;
        if (nextCompact !== navCompact) {
            navCompact = nextCompact;
            closeNav();
            if (!navCompact && document.activeElement === navToggle) {
                siteNav?.querySelector('a')?.focus({ preventScroll: true });
            }
        }
        renderNav();
    };
    const scheduleNav = () => {
        if (!navFrame) navFrame = requestAnimationFrame(syncNavLayout);
    };
    navToggle?.addEventListener('click', () => {
        navOpen = !navOpen;
        renderNav();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navOpen) {
            closeNav();
            navToggle?.focus({ preventScroll: true });
        }
    });
    document.addEventListener('pointerdown', event => {
        if (navOpen && !header?.contains(event.target)) closeNav();
    });
    header?.addEventListener('focusout', event => {
        if (navOpen && !header.contains(event.relatedTarget)) closeNav();
    });
    window.addEventListener('scroll', scheduleNav, { passive: true });
    window.addEventListener('resize', scheduleNav);
    window.addEventListener('pageshow', scheduleNav);
    mobileMenu.addEventListener('change', syncNavLayout);
    syncNavLayout();

    /* HEADER NAV */
    const navLinks = document.querySelectorAll('.nav-list a');
    const sections = [...navLinks]
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    // Sticky positioning and reveal transforms change the visible rectangle.
    // Follow layout offsets so navigation always reaches the section's start.
    const getSectionTop = target => {
        let top = 0;
        for (let element = target; element; element = element.offsetParent) {
            top += element.offsetTop;
        }
        return top;
    };

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            closeNav();
            cancelAnimationFrame(heroScrollFrame);
            window.scrollTo({
                top: getSectionTop(target),
                behavior: reducedMotion ? 'auto' : 'smooth',
            });
            if (target.id === 'home') replayHeroOnHome(target);
        });
    });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            navLinks.forEach(link => link.classList.remove('active'));

            const activeLink = document.querySelector(
                `.nav-list a[href="#${entry.target.id}"]`
            );

            activeLink?.classList.add('active');
        });
    }, {
        rootMargin: '-40% 0px -50%',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));

    /* HERO BUTTON */
    const heroButton = document.querySelector('.hero-menu-button');
    const aboutSection = document.querySelector('#about');

    heroButton?.addEventListener('click', () => {
        aboutSection?.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
    });

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

    /* Load once with defer, alongside the existing site JavaScript. */
    (() => {
        const init = () => {
            if (!('IntersectionObserver' in window) ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    entry.target.classList.toggle('about-revealed', entry.isIntersecting);
                });
            }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

            document.querySelectorAll('.profile-left, .profile-info, .profile-identity > h3, .profile-details, .education-info, .certification-info, .skills-heading, .skill-menu, .poster-heading, .banner-heading').forEach(target => {
                if (target.classList.contains('about-reveal-ready')) return;
                if (target.matches('.profile-details')) {
                    target.querySelectorAll(':scope > div').forEach((item, index) => {
                        item.style.setProperty('--profile-detail-delay', `${index * 0.15}s`);
                    });
                }
                if (target.matches('.certification-info')) {
                    target.querySelectorAll(':scope > ul > li').forEach((item, index) => {
                        item.style.setProperty('--reveal-delay', `${1.5 + index}s`);
                    });
                }
                target.classList.add('about-reveal-ready');
                observer.observe(target);
            });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        } else {
            init();
        }
    })();

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
