/* Project the original screenshots onto the four screen corners of each render. */
(() => {
    const layouts = [
        {
            selector: '.lune-monitor',
            size: [1536, 1024],
            corners: [[170, 99], [1382, 65], [1383, 744], [174, 728]],
            radius: '0'
        },
        {
            selector: '.responsive-stage-tablet, .lune-finale .lune-tablet',
            size: [1448, 1086],
            corners: [[198, 166], [1293, 182], [1294, 914], [198, 924]],
            radius: '1.2% / 1.8%'
        },
        {
            selector: '.aesop-responsive-phones > .aesop-device--phone, .lune-phone-fan > .lune-phone',
            size: [1024, 1536],
            corners: [[247, 119], [760, 66], [760, 1455], [247, 1415]],
            radius: '13% / 5.2%'
        }
    ];

    // Homography from a unit square to a quadrilateral (TL, TR, BR, BL).
    function project(points, width, height) {
        const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
        const dx1 = x1 - x2, dx2 = x3 - x2;
        const dy1 = y1 - y2, dy2 = y3 - y2;
        const dx3 = x0 - x1 + x2 - x3;
        const dy3 = y0 - y1 + y2 - y3;
        const denominator = dx1 * dy2 - dx2 * dy1;
        if (Math.abs(denominator) < 1e-8) return null;
        const g = (dx3 * dy2 - dx2 * dy3) / denominator;
        const h = (dx1 * dy3 - dx3 * dy1) / denominator;
        return [
            (x1 - x0 + g * x1) / width, (y1 - y0 + g * y1) / width, 0, g / width,
            (x3 - x0 + h * x3) / height, (y3 - y0 + h * y3) / height, 0, h / height,
            0, 0, 1, 0,
            x0, y0, 0, 1
        ];
    }

    const devices = new Map();
    for (const layout of layouts) {
        document.querySelectorAll(layout.selector).forEach(device => {
            const screen = device.querySelector(':scope > .lune-screen, :scope > .aesop-device-screen');
            if (screen) devices.set(device, { layout, screen });
        });
    }

    const observer = new ResizeObserver(entries => {
        for (const { target, contentRect } of entries) {
            const { layout, screen } = devices.get(target);
            const { width, height } = contentRect;
            if (!width || !height) continue;
            const points = layout.corners.map(([x, y]) => [x / layout.size[0] * width, y / layout.size[1] * height]);
            const screenWidth = (points[1][0] + points[2][0] - points[0][0] - points[3][0]) / 2;
            const screenHeight = (points[2][1] + points[3][1] - points[0][1] - points[1][1]) / 2;
            const matrix = project(points, screenWidth, screenHeight);
            if (!matrix) continue;
            Object.assign(screen.style, {
                left: '0px', top: '0px',
                width: `${screenWidth}px`, height: `${screenHeight}px`,
                clipPath: 'none', borderRadius: layout.radius,
                transformOrigin: '0 0',
                transform: `matrix3d(${matrix.join(',')})`
            });
        }
    });
    devices.forEach((_, device) => observer.observe(device));
})();
