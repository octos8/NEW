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
