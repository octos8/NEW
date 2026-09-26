(() => {
    const links = [...document.querySelectorAll('.aesop-links, .lune-links')].map(nav => ({
        nav,
        project: nav.closest('.aesop-case, .lune-case'),
        placeholder: null,
    })).filter(item => item.project);
    const header = document.querySelector('.site-header');
    let frame = 0;

    function update() {
        frame = 0;
        const top = Math.max(16, (header?.getBoundingClientRect().bottom ?? 0) + 12);

        links.forEach(item => {
            const { nav, project } = item;
            const anchor = (item.placeholder ?? nav).getBoundingClientRect();

            if (anchor.top >= top) {
                if (item.placeholder) {
                    nav.classList.remove('project-links-sticky');
                    ['top', 'left', 'width'].forEach(key => nav.style.removeProperty(`--project-links-${key}`));
                    item.placeholder.remove();
                    item.placeholder = null;
                }
                return;
            }

            if (!item.placeholder) {
                const style = getComputedStyle(nav);
                const placeholder = document.createElement('div');
                placeholder.setAttribute('aria-hidden', 'true');
                placeholder.style.height = `${anchor.height}px`;
                placeholder.style.marginTop = style.marginTop;
                placeholder.style.marginBottom = style.marginBottom;
                nav.before(placeholder);
                item.placeholder = placeholder;
                nav.classList.add('project-links-sticky');
            }

            const slot = item.placeholder.getBoundingClientRect();
            nav.style.setProperty('--project-links-left', `${slot.left}px`);
            nav.style.setProperty('--project-links-width', `${slot.width}px`);
            const height = nav.getBoundingClientRect().height;
            item.placeholder.style.height = `${height}px`;
            nav.style.setProperty('--project-links-top', `${Math.min(top, project.getBoundingClientRect().bottom - height)}px`);
        });
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    const observer = new ResizeObserver(schedule);
    links.forEach(({ project }) => observer.observe(project));
    if (header) observer.observe(header);
    document.fonts.ready.then(schedule);
    schedule();
})();
