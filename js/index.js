document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

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
                    if (!entry.target.matches('.skills-heading')) {
                        entry.target.classList.toggle('about-revealed', entry.isIntersecting);
                        return;
                    }

                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('about-revealed');
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

            document.querySelectorAll('.profile-left, .profile-info, .education-info, .certification-info, .skills-heading, .skill-menu').forEach(target => {
                if (target.classList.contains('about-reveal-ready')) return;
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

    /* POPUP TEXT SWIPER */
    const popupTextSwiper = new Swiper('.popup-text-swiper', {
        loop: true,
        speed: reducedMotion ? 0 : 700,
        allowTouchMove: false,
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    });

    /* POPUP IMAGE SWIPER */
    const popupImageSwiper = new Swiper('.popup-image-swiper', {
        loop: true,
        speed: reducedMotion ? 0 : 700,
        slidesPerView: 1.18,
        spaceBetween: 20,
        breakpoints: {
            769: { slidesPerView: 1.45, spaceBetween: 28 },
            1025: { slidesPerView: 2, spaceBetween: 48 }
        },
        grabCursor: true,
        autoplay: {
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false
        },
        on: {
            slideChange() {
                popupTextSwiper.slideToLoop(this.realIndex, reducedMotion ? 0 : 700);
            },
            click(swiper) {
                if (swiper.clickedSlide?.classList.contains('swiper-slide-next')) {
                    swiper.slideNext();
                }
            }
        }
    });
    const bannerSwiper = new Swiper('.banner-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        speed: reducedMotion ? 0 : 900,
        grabCursor: true,
        autoplay: reducedMotion ? false : {
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        pagination: {
            el: '.banner-swiper .swiper-pagination',
            clickable: true,
        },
    });

    /* MOBILE MENU */
    const header = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const mobileNavLinks = document.querySelectorAll('.site-nav a');

    navToggle?.addEventListener('click', () => {
        const isOpen = header.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', isOpen);
        navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            header.classList.remove('is-open');
            navToggle?.setAttribute('aria-expanded', 'false');
            navToggle?.setAttribute('aria-label', '메뉴 열기');
        });
    });

    document.addEventListener('click', e => {
        if (!header?.classList.contains('is-open')) return;
        if (header.contains(e.target)) return;

        header.classList.remove('is-open');
        navToggle?.setAttribute('aria-expanded', 'false');
        navToggle?.setAttribute('aria-label', '메뉴 열기');
    });
});
