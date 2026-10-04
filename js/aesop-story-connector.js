(() => {
    const section = document.querySelector('.aesop-story-details');
    if (!section) return;
    const phone = section.querySelector('.aesop-story-selection');
    const panel = section.querySelector('.aesop-story-detail-header');
    const svg = section.querySelector('.aesop-story-connector');
    const update = () => {
        const base = section.getBoundingClientRect();
        const a = phone.getBoundingClientRect();
        const b = panel.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
        const x1 = a.left + a.width / 2 - base.left;
        const x2 = b.left - base.left - 20;
        const y = a.top - base.top;
        const endY = b.top + b.height / 2 - base.top;
        const bend = (a.right - base.left + x2) / 2;
        const lineY = y - 24;
        const direction = endY >= lineY ? 1 : -1;
        const radius = Math.max(0, Math.min(12, (bend - x1) / 2, (x2 - bend) / 2, Math.abs(endY - lineY) / 2));
        svg.querySelector('path').setAttribute('d',
            `M ${x1} ${y} V ${lineY + radius} Q ${x1} ${lineY} ${x1 + radius} ${lineY} H ${bend - radius} Q ${bend} ${lineY} ${bend} ${lineY + direction * radius} V ${endY - direction * radius} Q ${bend} ${endY} ${bend + radius} ${endY} H ${x2}`);
    };
    const observer = new ResizeObserver(update);
    [section, phone, panel].forEach(el => observer.observe(el));
    update();
})();
