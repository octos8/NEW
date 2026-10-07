document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

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
            const destination = target.id === 'about-me'
                ? target.querySelector('.editorial-profile') || target
                : target;
            window.scrollTo({
                top: getSectionTop(destination),
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


});
