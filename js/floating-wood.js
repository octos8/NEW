/* Show the viewport decoration between HOME and POPUP, and within CONTACT. */
(() => {
    const layer = document.querySelector('.floating-wood');
    const boundary = document.querySelector('#popup');
    const home = document.querySelector('#home');
    const contact = document.querySelector('#contact');
    const skills = document.querySelector('.skills-section');
    if (!layer || !boundary || !home) return;

    const pieces = [...layer.querySelectorAll('.floating-wood-piece')];
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    pieces.forEach(piece => {
        let drag = null;
        piece.addEventListener('pointerdown', event => {
            if (event.button !== 0 || drag) return;
            event.preventDefault();
            // Freeze at the current rotation and position, without a jump.
            const style = getComputedStyle(piece);
            const transform = style.transform;
            const left = parseFloat(style.left);
            const top = parseFloat(style.top);
            piece.style.transform = transform;
            piece.style.animation = 'none';
            piece.style.left = `${left}px`;
            piece.style.top = `${top}px`;
            piece.dataset.placed = 'true';
            drag = {
                id: event.pointerId, x: event.clientX, y: event.clientY,
                left, top, rect: piece.getBoundingClientRect()
            };
            piece.classList.add('is-dragging');
            piece.setPointerCapture(event.pointerId);
        });
        piece.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.id) return;
            const dx = clamp(event.clientX - drag.x, -drag.rect.left,
                layer.clientWidth - drag.rect.right);
            const dy = clamp(event.clientY - drag.y, -drag.rect.top,
                layer.clientHeight - drag.rect.bottom);
            piece.style.left = `${drag.left + dx}px`;
            piece.style.top = `${drag.top + dy}px`;
        });
        const finish = event => {
            if (!drag || event.pointerId !== drag.id) return;
            drag = null;
            piece.classList.remove('is-dragging');
            // Start a fresh float at the drop position, retaining its rotation.
            const rect = piece.getBoundingClientRect();
            const driftX = rect.left + rect.width / 2 < layer.clientWidth / 2 ? 12 : -12;
            const driftY = rect.top + rect.height / 2 < layer.clientHeight / 2 ? 18 : -18;
            piece.style.setProperty('--wood-rest-transform', piece.style.transform);
            piece.style.setProperty('--wood-drift-x', `${driftX}px`);
            piece.style.setProperty('--wood-drift-y', `${driftY}px`);
            piece.classList.add('is-floating-placed');
            piece.style.removeProperty('animation');
            if (piece.hasPointerCapture(event.pointerId)) piece.releasePointerCapture(event.pointerId);
        };
        piece.addEventListener('pointerup', finish);
        piece.addEventListener('pointercancel', finish);
        piece.addEventListener('lostpointercapture', finish);
    });

    window.addEventListener('resize', () => {
        pieces.filter(piece => piece.dataset.placed).forEach(piece => {
            const rect = piece.getBoundingClientRect();
            const dx = clamp(rect.left, 0, Math.max(0, layer.clientWidth - rect.width)) - rect.left;
            const dy = clamp(rect.top, 0, Math.max(0, layer.clientHeight - rect.height)) - rect.top;
            piece.style.left = `${parseFloat(piece.style.left || '24') + dx}px`;
            piece.style.top = `${parseFloat(piece.style.top || '24') + dy}px`;
        });
    }, { passive: true });

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
        // Feather section boundaries so a block never ends at a hard horizontal cut.
        const feather = Math.min(160, height * .2, Math.max(0, bottom - top) / 2);
        const fadeTop = top > 0 ? top + feather : 0;
        const fadeBottom = bottom < height ? bottom - feather : height;
        const mask = `linear-gradient(to bottom, transparent ${top}px, #000 ${fadeTop}px, #000 ${fadeBottom}px, transparent ${bottom}px)`;
        layer.style.maskImage = mask;
        layer.style.webkitMaskImage = mask;
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
