/* Show the viewport decoration between HOME and POPUP, and within CONTACT. */
(() => {
    const layer = document.querySelector('.floating-wood');
    const boundary = document.querySelector('#popup');
    const home = document.querySelector('#home');
    const contact = document.querySelector('#contact');
    const skills = document.querySelector('.skills-section');
    if (!layer || !boundary || !home) return;

    let frame = 0;
    const update = () => {
        frame = 0;
        const height = layer.clientHeight;
        let top = Math.max(0, Math.min(height, home.getBoundingClientRect().bottom));
        let bottom = Math.max(0, Math.min(height, boundary.getBoundingClientRect().top));
        if (contact) {
            const rect = contact.getBoundingClientRect();
            if (rect.top < height && rect.bottom > 0) {
                top = Math.max(0, rect.top);
                bottom = Math.min(height, rect.bottom);
            }
        }
        const skillsRect = skills?.getBoundingClientRect();
        const mobileSkillsVisible = window.innerWidth <= 768 && skillsRect &&
            skillsRect.top < height && skillsRect.bottom > 0;
        const visible = bottom > top && !mobileSkillsVisible;
        layer.style.clipPath = `inset(${top}px 0 ${height - bottom}px 0)`;
        layer.style.visibility = visible ? 'visible' : 'hidden';
        layer.style.setProperty('--wood-play-state', visible ? 'running' : 'paused');
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('load', schedule, { once: true });
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
    update();
})();
