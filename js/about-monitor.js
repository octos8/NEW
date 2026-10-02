/* A shallow, tilted orbit carries each word behind and in front of the monitor. */
(() => {
    const scene = document.querySelector('.about-workspace-scene');
    const labels = [...document.querySelectorAll('.about-word-orbit li')];
    if (!scene || !labels.length) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let width = scene.clientWidth;
    new ResizeObserver(() => { width = scene.clientWidth; }).observe(scene);
    let phase = 0;
    let lastTime = 0;
    const tilt = -10 * Math.PI / 180;
    function draw() {
        labels.forEach((label, index) => {
            const angle = phase + index * Math.PI * 2 / labels.length;
            const depth = Math.sin(angle);
            const x = Math.cos(angle) * width * .4;
            const y = depth * width * .095;
            const tiltedX = x * Math.cos(tilt) - y * Math.sin(tilt);
            const tiltedY = x * Math.sin(tilt) + y * Math.cos(tilt);
            label.style.transform = `translate(${tiltedX}px, ${tiltedY}px) scale(${.92 + depth * .12})`;
            label.style.zIndex = depth >= 0 ? '3' : '0';
            label.style.opacity = depth >= 0 ? '1' : '.65';
        });
    }
    function animate(time) {
        const elapsed = lastTime ? Math.min(time - lastTime, 64) : 0;
        lastTime = time;
        if (!document.hidden && !reducedMotion.matches) phase += elapsed * Math.PI * 2 / 28000;
        draw();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
})();