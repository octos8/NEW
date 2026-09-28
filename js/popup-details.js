(() => {
    const init = () => {
        const station = document.querySelector('.popup-image-swiper');
        const dialog = document.querySelector('#popup-project-dialog');
        if (!station || !dialog) return;
        const content = dialog.querySelector('.popup-project-content');
        let opener;

        station.addEventListener('click', event => {
            const button = event.target.closest('.popup-image-button');
            if (!button || station.swiper?.allowClick === false) return;
            const caption = button.closest('.popup-slide').querySelector('figcaption');
            if (!caption || dialog.open) return;
            content.replaceChildren(...Array.from(caption.children, node => node.cloneNode(true)));
            content.querySelector('h3').id = 'popup-project-title';
            opener = button;
            station.swiper?.autoplay?.stop();
            dialog.showModal();
        });

        dialog.querySelector('.popup-project-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        });
        dialog.addEventListener('close', () => {
            opener?.focus({ preventScroll: true });
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                station.swiper?.autoplay?.start();
            }
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
