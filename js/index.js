document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

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
            target.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
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
        speed: 700,
        allowTouchMove: false,
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    });

    /* POPUP IMAGE SWIPER */
    const popupImageSwiper = new Swiper('.popup-image-swiper', {
        loop: true,
        speed: 700,
        slidesPerView: 1,
        spaceBetween: 0,
        grabCursor: true,
        autoplay: reducedMotion ? false : {
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        on: {
            slideChange() {
                popupTextSwiper.slideToLoop(this.realIndex, 700);
            }
        }
    });
    const bannerSwiper = new Swiper('.banner-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        speed: 900,
        autoplay: {
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
const header=document.querySelector('.site-header');
const navToggle=document.querySelector('.nav-toggle');
const mobileNavLinks=document.querySelectorAll('.site-nav a');

navToggle?.addEventListener('click',()=>{
    const isOpen=header.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded',isOpen);
    navToggle.setAttribute('aria-label',isOpen?'메뉴 닫기':'메뉴 열기');
});

mobileNavLinks.forEach(link=>{
    link.addEventListener('click',()=>{
        header.classList.remove('is-open');
        navToggle?.setAttribute('aria-expanded','false');
        navToggle?.setAttribute('aria-label','메뉴 열기');
    });
});

document.addEventListener('click',e=>{
    if(!header?.classList.contains('is-open'))return;
    if(header.contains(e.target))return;

    header.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded','false');
    navToggle?.setAttribute('aria-label','메뉴 열기');
});
});