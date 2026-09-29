(() => {
    const init = () => {
        const station = document.querySelector('.popup-image-swiper');
        const posterList = document.querySelector('.poster-list');
        const dialog = document.querySelector('#popup-project-dialog');
        if (!station || !dialog) return;
        const content = dialog.querySelector('.popup-project-content');
        const previewImage = dialog.querySelector('.popup-project-image');
        let opener;
        let anchor;
        const measureImage = image => {
            const bounds = image.getBoundingClientRect();
            // Measure the image before the hover scale so the panel fits its frame.
            let width = image.offsetWidth;
            let height = image.offsetHeight;
            if (!width || !height) return;
            let left = bounds.left + (bounds.width - width) / 2;
            let top = bounds.top + (bounds.height - height) / 2;
            if (getComputedStyle(image).objectFit === 'contain' && image.naturalWidth && image.naturalHeight) {
                const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
                const imageWidth = image.naturalWidth * ratio;
                const imageHeight = image.naturalHeight * ratio;
                left += (width - imageWidth) / 2;
                top += (height - imageHeight) / 2;
                width = imageWidth;
                height = imageHeight;
            }
            return { width, height, left, top };
        };
        const fitDialogToImage = () => {
            if (!anchor) return;
            let { width, height, left, top } = anchor;
            const scale = Math.min(1, (window.innerWidth - 16) / width, (window.innerHeight - 16) / height);
            width *= scale;
            height *= scale;
            left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
            top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
            dialog.style.setProperty('--project-dialog-left', `${left}px`);
            dialog.style.setProperty('--project-dialog-top', `${top}px`);
            dialog.style.setProperty('--project-dialog-width', `${width}px`);
            dialog.style.setProperty('--project-dialog-height', `${height}px`);
        };
        window.addEventListener('resize', () => {
            if (dialog.open) fitDialogToImage();
        });

        const openProject = (button, caption) => {
            const image = button.querySelector('img');
            // Capture the clicked position before showing/focusing the panel.
            anchor = measureImage(image);
            if (!anchor) return;
            content.replaceChildren(...Array.from(caption.children, node => node.cloneNode(true)));
            content.querySelector('h3').id = 'popup-project-title';
            previewImage.src = image.currentSrc || image.src;
            opener = button;
            fitDialogToImage();
            if (!dialog.open) dialog.show();
        };

        document.querySelectorAll('.popup-image-button, .poster-image-button').forEach(button => {
            button.setAttribute('aria-haspopup', 'dialog');
            button.setAttribute('aria-controls', 'popup-project-dialog');
            button.addEventListener('pointerenter', event => {
                if (event.pointerType !== 'touch') button.classList.add('is-hovered');
            });
            button.addEventListener('pointerleave', () => button.classList.remove('is-hovered'));
            button.addEventListener('pointercancel', () => button.classList.remove('is-hovered'));
        });

        station.addEventListener('click', event => {
            const button = event.target.closest('.popup-image-button');
            if (!button || station.swiper?.allowClick === false) return;
            const caption = button.closest('.popup-slide').querySelector('figcaption');
            if (!caption) return;
            openProject(button, caption);
        });

        posterList?.addEventListener('click', event => {
            const button = event.target.closest('.poster-image-button');
            if (!button) return;
            const caption = button.closest('.poster-item')?.querySelector('.poster-content');
            if (!caption) return;
            openProject(button, caption);
        });

        dialog.querySelector('.popup-project-close').addEventListener('click', () => dialog.close());
        document.addEventListener('click', event => {
            if (!dialog.open || dialog.contains(event.target) ||
                event.target.closest('.popup-image-button, .poster-image-button')) return;
            dialog.close();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && dialog.open) {
                event.preventDefault();
                dialog.close();
            }
        });
        dialog.addEventListener('close', () => {
            opener?.focus({ preventScroll: true });
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
