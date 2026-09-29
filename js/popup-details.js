/* Show descriptions directly over the selected photo. */
(() => {
    const station = document.querySelector('.popup-image-swiper');
    let active = null;
    let pausedSwiper = null;
    let resumeAutoplay = false;
    let allowTouchMove;
    const pauseMotion = () => {
        if (pausedSwiper || !station?.swiper) return;
        pausedSwiper = station.swiper;
        resumeAutoplay = pausedSwiper.autoplay?.running;
        allowTouchMove = pausedSwiper.allowTouchMove;
        const translate = pausedSwiper.getTranslate();
        pausedSwiper.autoplay?.stop();
        pausedSwiper.setTransition(0);
        pausedSwiper.setTranslate(translate);
        pausedSwiper.animating = false;
        pausedSwiper.allowTouchMove = false;
    };
    const close = (restoreFocus = false) => {
        if (!active) return;
        const previous = active;
        previous.frame.classList.remove('is-open');
        previous.overlay.hidden = true;
        previous.button.setAttribute('aria-expanded', 'false');
        active = null;
        if (pausedSwiper) {
            pausedSwiper.allowTouchMove = allowTouchMove;
            if (resumeAutoplay) pausedSwiper.autoplay?.start();
            pausedSwiper = null;
        }
        document.dispatchEvent(new Event('project-description-change'));
        if (restoreFocus) previous.button.focus({ preventScroll: true });
    };
    document.querySelectorAll('.popup-image-button, .poster-image-button').forEach((button, index) => {
        const caption = button.closest('.popup-slide')?.querySelector('figcaption') ||
            button.closest('.poster-item')?.querySelector('.poster-content');
        if (!caption) return;
        const frame = document.createElement('div');
        frame.className = 'project-photo';
        button.before(frame);
        frame.append(button);
        if (button.matches('.poster-image-button')) {
            const image = button.querySelector('img');
            const syncRatio = () => {
                if (image.naturalWidth && image.naturalHeight) {
                    frame.style.setProperty('--poster-image-ratio', image.naturalWidth / image.naturalHeight);
                }
            };
            image.addEventListener('load', syncRatio);
            syncRatio();
        }
        const overlay = document.createElement('div');
        overlay.className = 'project-photo-description';
        overlay.id = `project-photo-description-${index}`;
        overlay.hidden = true;
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'project-photo-close';
        dismiss.textContent = '×';
        dismiss.setAttribute('aria-label', '설명 닫기');
        const copy = document.createElement('div');
        copy.className = 'project-photo-copy';
        copy.append(...Array.from(caption.children, node => node.cloneNode(true)));
        overlay.append(dismiss, copy);
        frame.append(overlay);
        button.removeAttribute('aria-haspopup');
        button.setAttribute('aria-controls', overlay.id);
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', () => {
            if (button.closest('.popup-slide') && station?.swiper?.allowClick === false) return;
            if (active?.button === button) return close();
            close();
            pauseMotion();
            active = { button, frame, overlay };
            frame.classList.add('is-open');
            overlay.hidden = false;
            copy.scrollTop = 0;
            button.setAttribute('aria-expanded', 'true');
            document.dispatchEvent(new Event('project-description-change'));
            dismiss.focus({ preventScroll: true });
        });
        dismiss.addEventListener('click', () => close(true));
        button.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'touch') button.classList.add('is-hovered');
        });
        button.addEventListener('pointerleave', () => button.classList.remove('is-hovered'));
        button.addEventListener('pointercancel', () => button.classList.remove('is-hovered'));
    });
    document.addEventListener('click', event => {
        if (active && !active.frame.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && active) {
            event.preventDefault();
            close(true);
        }
    });
})();
