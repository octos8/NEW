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

    /* TOOLS & SKILLS */
    const skillMenus = document.querySelectorAll('.skill-menu');
    const skillPanels = document.querySelectorAll('.skill-detail');
    const skillDot = document.querySelector('.skills-dot');

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

        document
            .querySelector(`.skill-detail[data-panel="${target}"]`)
            ?.classList.add('is-active');

        activeSkill = menu;
        moveSkillDot(menu);
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
        autoplay: reducedMotion ? false : {
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        pagination: {
            el: '.banner-swiper .swiper-pagination',
            clickable: true,
        },
    });

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
