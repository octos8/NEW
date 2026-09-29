document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* AESOP: 화면에 보이는 동안 아래로 스크롤하면 내부 휴대폰만 가볍게 흔들림 */
    (() => {
        const visual = document.querySelector('.aesop-opening-visual');
        const phone = visual?.querySelector('.aesop-opening-phone');
        if (!phone || !phone.animate) return;

        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const shakeAngle = 1.2; // 흔들림 각도(deg)
        const shakeDuration = 800; // 한 번 흔들리는 시간(ms)
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
            ], {
                duration: shakeDuration,
                easing: 'ease-in-out'
            });
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
    const playHeroName = () => {
        if (!heroName || reducedMotion) return;
        heroName.classList.remove('is-entering');
        void heroName.offsetWidth;
        heroName.classList.add('is-entering');
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

    /* HEADER MENU POPUP */
    const navToggle = document.querySelector('.nav-toggle');
    const navPopup = document.querySelector('#nav-popup');
    const siteNav = document.querySelector('.site-nav');
    const mobileMenu = window.matchMedia('(max-width: 768px)');

    const closeNav = () => {
        if (!navPopup?.open) return;
        navPopup.close();
        navToggle?.setAttribute('aria-expanded', 'false');
    };

    // Keep one navigation list and move it into the dialog only on mobile.
    const syncNavLayout = () => {
        if (!navPopup || !siteNav) return;
        closeNav();
        if (mobileMenu.matches) {
            navPopup.append(siteNav);
        } else {
            navPopup.before(siteNav);
            if (document.activeElement === navToggle) {
                siteNav.querySelector('a')?.focus({ preventScroll: true });
            }
        }
    };
    syncNavLayout();
    mobileMenu.addEventListener('change', syncNavLayout);

    navToggle?.addEventListener('click', () => {
        if (!mobileMenu.matches || !navPopup || navPopup.open) return;
        navPopup.showModal();
        navToggle.setAttribute('aria-expanded', 'true');
    });
    navPopup?.querySelector('.nav-close')?.addEventListener('click', closeNav);
    navPopup?.addEventListener('cancel', event => {
        event.preventDefault();
        closeNav();
    });
    navPopup?.addEventListener('close', () => {
        // Do not overwrite the state if the menu was already reopened.
        if (!navPopup.open) navToggle?.setAttribute('aria-expanded', 'false');
    });

    /* HEADER NAV */
    const navLinks = document.querySelectorAll('.nav-list a');
    const sections = [...navLinks]
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            closeNav();
            cancelAnimationFrame(heroScrollFrame);
            target.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'start'
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

            document.querySelectorAll('.profile-side-label, .profile-left, .profile-info, .profile-identity > h3, .profile-details, .education-info, .certification-info, .skills-heading, .skill-menu, .poster-heading').forEach(target => {
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

    /* Mask scrolled history only after its heading reaches the sticky edge. */
    (() => {
        const headings = [...document.querySelectorAll('.profile-timeline > article > h3')];
        if (!headings.length) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            headings.forEach(heading => {
                const stickyTop = parseFloat(getComputedStyle(heading).top);
                const rect = heading.getBoundingClientRect();
                heading.classList.toggle('is-timeline-pinned',
                    Number.isFinite(stickyTop) && rect.top <= stickyTop + 1 && rect.bottom > 0);
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
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

    // Fit the complete panel into a rectangle inscribed inside the circle.
    const fitSkillPanels = () => {
        if (!skillOrbit) return;
        const safeSize = skillOrbit.clientWidth * 0.68;
        skillPanels.forEach(panel => {
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
        moveSkillDot(menu);
        fitSkillPanels();
    };

    skillMenus.forEach(menu => {
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
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        speed: reducedMotion ? 0 : 900,
        grabCursor: true,
        noSwiping: true,
        noSwipingSelector: '.banner-caption',
        autoplay: reducedMotion ? false : {
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false
        },
        pagination: {
            el: '.banner-swiper .swiper-pagination',
            clickable: true,
        },
    });

    // Preserve both description sentences; fit them to two lines at each width.
    const fitBannerDescriptions = () => {
        document.querySelectorAll('.banner-caption p').forEach(copy => {
            copy.style.removeProperty('font-size');
            if (!copy.clientWidth || window.innerWidth === 402) return;
            const baseSize = parseFloat(getComputedStyle(copy).fontSize);
            let low = 1;
            let high = baseSize;
            const fits = () => copy.scrollHeight <= parseFloat(getComputedStyle(copy).lineHeight) * 2 + 1;
            if (fits()) return;
            for (let step = 0; step < 10; step++) {
                const size = (low + high) / 2;
                copy.style.fontSize = `${size}px`;
                if (fits()) low = size;
                else high = size;
            }
            copy.style.fontSize = `${low}px`;
        });
    };
    bannerSwiper.on('resize', fitBannerDescriptions);
    document.fonts?.ready.then(fitBannerDescriptions);
    window.addEventListener('load', fitBannerDescriptions, { once: true });
    fitBannerDescriptions();

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
