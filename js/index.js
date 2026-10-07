/* HOME 이동 후 타이틀 재생: header.js와 공유하는 기존 상태/함수. */
let heroScrollFrame;
let replayHeroOnHome;

document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    const heroName = document.querySelector('.hero-name');
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const title = heroTitle.textContent.trim();
        heroTitle.setAttribute('aria-label', title);
        const ns = 'http://www.w3.org/2000/svg';
        const make = (tag, attributes) => {
            const node = document.createElementNS(ns, tag);
            Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
            return node;
        };
        const drawing = make('svg', {
            viewBox: '0 0 940 170', class: 'structure-blueprint',
            'aria-hidden': 'true', focusable: 'false'
        });
        const grid = make('g', { class: 'structure-guides' });
        [14, 32, 136, 156].forEach(y => {
            grid.append(make('line', { x1: 10, y1: y, x2: 930, y2: y }));
        });
        for (let index = 0; index <= title.length; index++) {
            const x = 20 + index * 100;
            grid.append(make('line', { x1: x, y1: 0, x2: x, y2: 170 }));
            [14, 136].forEach(y => grid.append(make('circle', { cx: x, cy: y, r: 1.9 })));
            if (index < title.length) {
                grid.append(make('line', { x1: x + 50, y1: 0, x2: x + 50, y2: 170, class: 'structure-guide-minor' }));
            }
        }
        // Geometric letter outlines: broad stems, squared counters, bevelled corners.
        const glyphs = {
            S: 'M18 0H88V27H34V38H68L88 55V86L70 104H0V77H54V65H20L0 48V18Z',
            T: 'M0 0H88V28H61V104H27V28H0Z',
            R: 'M0 0H66L88 21V49L69 67L90 104H52L34 72V104H0ZM34 27V46H53V27Z',
            U: 'M0 0H34V73H54V0H88V83L69 104H19L0 83Z',
            C: 'M20 0H88V31H55V27H34V77H55V73H88V104H20L0 84V20Z',
            E: 'M0 0H88V27H34V39H80V65H34V77H88V104H0Z'
        };
        drawing.append(grid);
        Array.from(title).forEach((letter, index) => {
            const placement = make('g', { transform: `translate(${26 + index * 100} 32)` });
            const block = make('path', {
                d: glyphs[letter], class: 'structure-letter', 'fill-rule': 'evenodd'
            });
            block.style.setProperty('--letter-index', index);
            placement.append(block);
            drawing.append(placement);
        });
        heroTitle.replaceChildren(drawing);
    }
    const playHeroName = () => {
        if (!heroName || reducedMotion) return;
        heroName.classList.remove('is-entering');
        heroTitle?.classList.remove('is-entering');
        void heroName.offsetWidth;
        heroName.classList.add('is-entering');
        heroTitle?.classList.add('is-entering');
    };
    playHeroName();

    // Replay once HOME has scrolled back into view, including long scrolls.
    replayHeroOnHome = target => {
        cancelAnimationFrame(heroScrollFrame);
        const startedAt = performance.now();
        const waitForHome = () => {
            if (Math.abs(target.getBoundingClientRect().top) <= 2 || window.scrollY <= 2) {
                playHeroName();
                return;
            }
            if (performance.now() - startedAt > 2500) return;
            heroScrollFrame = requestAnimationFrame(waitForHome);
        };
        heroScrollFrame = requestAnimationFrame(waitForHome);
    };

    /* HERO BUTTON */
    const heroButton = document.querySelector('.hero-menu-button');
    const aboutSection = document.querySelector('#about');

    heroButton?.addEventListener('click', () => {
        aboutSection?.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
    });

    /* Load once with defer, alongside the existing site JavaScript. */
    (() => {
        const init = () => {
            if (!('IntersectionObserver' in window) ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    entry.target.classList.toggle('about-revealed', entry.isIntersecting);
                });
            }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

            document.querySelectorAll('.profile-left, .profile-info, .profile-identity > h3, .profile-details, .education-info, .certification-info, .skills-heading, .skill-menu, .poster-heading, .banner-heading').forEach(target => {
                if (target.classList.contains('about-reveal-ready')) return;
                if (target.matches('.profile-details')) {
                    target.querySelectorAll(':scope > div').forEach((item, index) => {
                        item.style.setProperty('--profile-detail-delay', `${index * 0.15}s`);
                    });
                }
                if (target.matches('.certification-info')) {
                    target.querySelectorAll(':scope > ul > li').forEach((item, index) => {
                        item.style.setProperty('--reveal-delay', `${1.5 + index}s`);
                    });
                }
                target.classList.add('about-reveal-ready');
                observer.observe(target);
            });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        } else {
            init();
        }
    })();


});

/* Source: hero-space.js */
/* Enlarge the entire original cube photo, then wash to white over ABOUT. */
(() => {
  const home = document.querySelector('#home');
  const stage = home?.querySelector('.hero-stage');
  if (!stage || home?.hasAttribute('data-crystal-hero')) return;
  const photo = stage.querySelector('.hero-photo-rotate img');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const p=clamp(value); return p*p*(3-2*p); };
  let frame=0;
  function update() {
    frame=0;
    // Allow only a small enlargement over the resolution-conscious resting size.
    const sourceWidth=photo?.naturalWidth || 736;
    stage.style.setProperty('--hero-photo-limit', (sourceWidth*1.134)/Math.max(1,devicePixelRatio) + 'px');
    stage.style.setProperty('--hero-identity-offset', (sourceWidth*1.134*.36)/Math.max(1,devicePixelRatio) + 'px');
    home.classList.toggle('hero-cinematic', !motion.matches);
    const distance=Math.max(1,home.offsetHeight-stage.offsetHeight);
    const p=motion.matches ? 0 : clamp(-home.getBoundingClientRect().top/distance);
    const zoom = p<=.5 ? 1+.35*smooth(p/.5) : 1.35+4.65*smooth((p-.5)/.4);
    stage.style.setProperty('--hero-zoom', zoom);
    stage.style.setProperty('--hero-white', smooth((p-.15)/.45));
    const textProgress=clamp(-home.getBoundingClientRect().top/100);
    stage.style.setProperty('--hero-ui-fade', motion.matches ? (textProgress>0 ? 1 : 0) : smooth(textProgress));
    stage.style.setProperty('--hero-exit', 0);
  }
  function schedule() { if (!frame) frame=requestAnimationFrame(update); }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('pageshow',schedule);
  motion.addEventListener('change',schedule);
  photo?.addEventListener('load',schedule);
  update();
})();


/* Source: hero-pointer.js */
/* Pointer events come from the window because HOME is a non-interactive layer. */
(() => {
  const home = document.querySelector('#home');
  const stage = home?.querySelector('.hero-stage');
  if (!stage || home?.hasAttribute('data-crystal-hero')) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'hero-pointer-spread';
  layer.setAttribute('aria-hidden', 'true');
  stage.append(layer);
  let lastTime=-Infinity, lastX=-Infinity, lastY=-Infinity;
  function clear() { layer.replaceChildren(); lastTime=-Infinity; lastX=lastY=-Infinity; }
  addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || event.pointerType !== 'mouse') return;
    const rect=stage.getBoundingClientRect();
    const homeRect=home.getBoundingClientRect();
    if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom || homeRect.bottom<=0) return;
    const fade=Number(stage.style.getPropertyValue('--hero-white')) || 0;
    if (fade>=.95) return;
    const now=performance.now();
    if (now-lastTime<85 || Math.hypot(event.clientX-lastX,event.clientY-lastY)<12) return;
    lastTime=now; lastX=event.clientX; lastY=event.clientY;
    if (layer.childElementCount>=12) layer.firstElementChild.remove();
    const glow=document.createElement('span');
    glow.className='hero-pointer-wave';
    glow.style.left=(event.clientX-rect.left)+'px';
    glow.style.top=(event.clientY-rect.top)+'px';
    glow.addEventListener('animationend',()=>glow.remove(),{once:true});
    layer.append(glow);
  },{passive:true});
  addEventListener('pointerout', event=>{ if (!event.relatedTarget) clear(); },{passive:true});
  fine.addEventListener('change',clear);
  reduced.addEventListener('change',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) clear();});
})();


/* Source: top-link.js */
/* Keep TOP above section layers, hiding it only while HOME occupies the view. */
(() => {
  const link=document.querySelector('body > .top-link');
  if (!link) return;
  const home=document.querySelector('#home');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  function update() {
    frame=0;
    const onHome=!!home && home.getBoundingClientRect().bottom>1;
    link.classList.toggle('is-home-hidden',onHome);
    link.inert=onHome;
    if(onHome) link.setAttribute('aria-hidden','true');
    else link.removeAttribute('aria-hidden');
  }
  function schedule() { if(!frame) frame=requestAnimationFrame(update); }
  link.addEventListener('click',event=>{
    event.preventDefault();
    scrollTo({top:0,behavior:motion.matches?'auto':'smooth'});
  });
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('pageshow',schedule);
  if(home) new ResizeObserver(schedule).observe(home);
  update();
})();


/* Source: hero-3d.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
/* Independent solid cubes. Scroll positions are reversible and deterministic. */
(async () => {
  const home = document.querySelector('#home');
  const stage = home?.querySelector('.hero-stage');
  if (!stage || home?.hasAttribute('data-crystal-hero')) return;
  let THREE;
  try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'); }
  catch (error) { console.warn('3D unavailable; showing reference image.', error); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
  catch (error) { console.warn('WebGL unavailable.', error); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'hero-3d-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);
  const scene = new THREE.Scene();
  const reference = { width: 1179, height: 701, halfHeight: 7.15 };
  const camera = new THREE.OrthographicCamera(-reference.halfHeight*1179/701, reference.halfHeight*1179/701, reference.halfHeight, -reference.halfHeight, .1, 100);
  camera.position.set(0, 4.8, 14);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x716b5d, 2));
  const key = new THREE.DirectionalLight(0xfff7e6, 3);
  key.position.set(-6, 10, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 40 });
  key.shadow.bias = -.001;
  key.shadow.normalBias = .035;
  scene.add(key);
  const group = new THREE.Group();
  scene.add(group);
  const geometry = new THREE.BoxGeometry(1.04, 1.04, 1.04, 12, 12, 12);
  const vertices = geometry.attributes.position;
  const vertex = new THREE.Vector3(), inner = new THREE.Vector3();
  for (let i=0; i<vertices.count; i++) {
    vertex.fromBufferAttribute(vertices,i);
    inner.copy(vertex).clampScalar(-.455,.455);
    vertex.sub(inner).normalize().multiplyScalar(.065).add(inner);
    vertices.setXYZ(i,vertex.x,vertex.y,vertex.z);
  }
  geometry.computeVertexNormals();
  // A studio environment provides highlights and colored reflections on every side.
  const faces = Array.from({length:6}, (_,index) => {
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = index===3 ? '#737c8b' : '#d9dad9'; ctx.fillRect(0,0,256,256);
    const glow = ctx.createLinearGradient(0,0,256,256);
    glow.addColorStop(0,'#f7e9ce'); glow.addColorStop(.3,'#bcdbe9');
    glow.addColorStop(.52,'#e9c3df'); glow.addColorStop(.75,'#c6e5d8'); glow.addColorStop(1,'#fcfaff');
    ctx.fillStyle=glow; ctx.fillRect(18,20,220,70);
    ctx.fillStyle='#ffffff'; ctx.fillRect(35,26,160,20);
    return canvas;
  });
  const environment = new THREE.CubeTexture(faces);
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromCubemap(environment);
  scene.environment = envTarget.texture;
  environment.dispose(); pmrem.dispose();
  scene.background = new THREE.Color(0xd9dad8);
  const material = new THREE.MeshPhysicalMaterial({ color:0xdde4ed, roughness:.12, metalness:.12,
    transmission:.88, thickness:.85, ior:1.46, iridescence:1, iridescenceIOR:1.35,
    iridescenceThicknessRange:[180,650], clearcoat:1, clearcoatRoughness:.06, envMapIntensity:1.4 });
  const fill = new THREE.DirectionalLight(0xcbdfff, .9);
  fill.position.set(6, 3, 4);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x34393e, opacity: .22 }));
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -2.15;
  floor.receiveShadow = true;
  scene.add(floor);
  let seed = 73421;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const blocks = [];
  // Complete 3 x 3 x 3 assembly; all blocks share the same whole-cube rotation.
  const layout = [];
  for (let y=-1;y<=1;y++) for (let z=-1;z<=1;z++) for (let x=-1;x<=1;x++) {
    layout.push([x*1.075,y*1.075,z*1.075,0,0,0]);
  }
  for (const [x,y,z,rx,ry,rz] of layout) {
    const mesh = new THREE.Mesh(geometry, material);
    const origin = new THREE.Vector3(x,y,z);
    const baseRotation = new THREE.Vector3(rx,ry,rz);
    mesh.position.copy(origin);
    mesh.rotation.set(rx,ry,rz);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    const direction = origin.clone().add(new THREE.Vector3((random()-.5)*2,(random()-.5)*2,(random()-.5)*4)).normalize();
    const turn = new THREE.Vector3((random()>.5?1:-1)*(.055+random()*.025), (random()>.5?1:-1)*(.07+random()*.035), (random()-.5)*.035);
    blocks.push({mesh,origin,baseRotation,turn,direction,phase:random()*Math.PI*2,speed:.35+random()*.3,
      delay:random()*.12,travel:14+random()*10,
      spin:new THREE.Vector3(random()-.5,random()-.5,random()-.5).multiplyScalar(3)});
  }
  home.classList.add('hero-3d-ready');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const p = clamp(n); return p*p*(3-2*p); };
  let frame = 0, visible = true;
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h);
    // Match the original photograph's framing; fit the silhouette on narrow screens.
    const half = Math.max(2.85, 2.5 / (w / h));
    camera.left = -half*w/h; camera.right = half*w/h;
    camera.top = half; camera.bottom = -half;
    camera.updateProjectionMatrix();
    schedule();
  };
  function render(now = performance.now()) {
    frame = 0;
    if (document.hidden || !visible) return;
    const p = motion.matches ? 0 : clamp(-home.getBoundingClientRect().top / Math.max(1, home.offsetHeight-stage.offsetHeight));
    stage.style.setProperty('--hero-exit', smooth((p-.68)/.32));
    stage.style.setProperty('--hero-ui-exit', smooth(p/.4));
    const t = now*.001;
    group.rotation.y = -.48 + (motion.matches ? 0 : (t/65)*Math.PI*2);
    group.position.y = motion.matches ? 0 : Math.sin(t*.45)*.035;
    blocks.forEach(({mesh, origin, direction, phase, speed, delay, travel, spin, baseRotation, turn}) => {
      const scatter = smooth((p-.06-delay)/(.77-delay));
      const drift = motion.matches ? 0 : 0;
      mesh.position.copy(origin).addScaledVector(direction, travel*scatter);
      mesh.position.x += Math.sin(t*speed+phase)*drift;
      mesh.position.y += Math.sin(t*speed*.83+phase)*drift;
      mesh.position.z += Math.cos(t*speed*.7+phase)*drift;
      const tilt = motion.matches ? 0 : Math.sin(t*speed+phase)*.004;
      const elapsed = motion.matches ? 0 : Math.sin(t*.32+phase)*.45;
      mesh.rotation.set(spin.x*scatter, spin.y*scatter, spin.z*scatter);
    });
    renderer.render(scene, camera);
    if (!motion.matches && p < 1) schedule();
  }
  function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }, {rootMargin:'100px'}).observe(home);
  new ResizeObserver(resize).observe(stage);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { if (frame) cancelAnimationFrame(frame); frame=0; schedule(); });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); home.classList.remove('hero-3d-ready'); cancelAnimationFrame(frame); frame=0; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { home.classList.add('hero-3d-ready'); schedule(); });
  resize();
})();

});

/* Source: hero-scatter.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
/* Pin HOME until its photographed wood blocks finish scattering. */
(() => {
    const home = document.querySelector('#home');
    const photo = home?.querySelector('.hero-visual img');
    const stage = home?.querySelector('.hero-stage');
    if (!photo || !stage) return;
    if (photo.closest('.hero-visual-centered')) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const layer = document.createElement('div');
    layer.className = 'hero-wood-scatter';
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    stage.append(layer);
    const fill = document.createElement('div');
    fill.className = 'hero-wood-fill';
    layer.append(fill);

    // Outlines in the original 1066 × 633 photo; no black background tiles.
    const outlines = [
        [[274,519],[298,505],[352,505],[355,596],[277,594]],
        [[353,518],[436,517],[438,597],[354,596]],
        [[437,519],[518,517],[520,597],[438,597]],
        [[520,518],[602,518],[604,599],[520,597]],
        [[604,519],[687,518],[688,599],[605,599]],
        [[689,520],[769,519],[770,600],[689,599]],
        [[772,520],[853,520],[854,600],[771,600]],
        [[855,521],[935,519],[934,599],[855,600]],
        [[353,436],[365,426],[434,428],[435,517],[354,517]],
        [[436,439],[518,436],[519,517],[436,517]],
        [[520,437],[602,436],[603,517],[520,518]],
        [[604,438],[687,437],[688,517],[604,518]],
        [[689,438],[770,437],[771,517],[689,519]],
        [[772,437],[794,430],[852,430],[854,518],[772,518]],
        [[855,439],[940,438],[938,519],[855,519]],
        [[435,357],[450,350],[516,350],[518,436],[435,438]],
        [[519,354],[601,353],[602,434],[519,436]],
        [[604,357],[687,354],[688,435],[604,437]],
        [[689,355],[770,354],[771,436],[689,437]],
        [[854,353],[940,353],[941,436],[855,437]],
        [[519,271],[526,265],[604,268],[601,352],[517,352]],
        [[606,274],[687,272],[687,353],[604,355]],
        [[689,272],[765,269],[771,274],[771,352],[689,353]]
    ];
    // Fixed seed keeps the chaotic paths stable when resizing or scrolling back.
    let seed = 73421;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const blocks = outlines.map(points => {
        const x = Math.min(...points.map(point => point[0]));
        const y = Math.min(...points.map(point => point[1]));
        const width = Math.max(...points.map(point => point[0])) - x;
        const height = Math.max(...points.map(point => point[1])) - y;
        const element = document.createElement('span');
        element.className = 'hero-wood-fragment';
        element.style.clipPath = `polygon(${points.map(point =>
            `${(point[0] - x) / width * 100}% ${(point[1] - y) / height * 100}%`).join(',')})`;
        layer.append(element);
        return {
            element, x, y, width, height,
            targetX: (random() - .5) * 2,
            targetY: random() * 1.4 - 1,
            bendX: (random() - .5) * .06,
            bendY: (random() - .5) * .06,
            spin: (random() - .5) * 64,
            delay: random() * .1,
            duration: .58 + random() * .16,
            fadeStart: .3 + random() * .12,
            depth: .9 + random() * .14
        };
    });
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
    const driftEase = value => {
        const p = clamp(value);
        return p * p * p * (p * (p * 6 - 15) + 10);
    };
    let geometry;
    let frame = 0;
    const render = () => {
        frame = 0;
        if (!geometry || preference.matches) {
            layer.hidden = true;
            photo.style.removeProperty('opacity');
            return;
        }
        const scroll = -home.getBoundingClientRect().top;
        const progress = clamp(scroll / geometry.distance);
        // Finish on a full white screen before releasing HOME to the introduction.
        const active = scroll > 0 && home.getBoundingClientRect().bottom > 0;
        layer.hidden = !active;
        photo.style.opacity = String(1 - smooth(progress / .18));
        if (!active) return;
        layer.style.opacity = String(smooth(progress / .055));
        fill.style.opacity = String(smooth((progress - .22) / .76));
        fill.style.setProperty('--hero-about-blend', String(smooth((scroll - geometry.release * .48) / (geometry.release * .3))));
        blocks.forEach(block => {
            const p = driftEase((progress - .025 - block.delay) / block.duration);
            const startX = geometry.left + block.x * geometry.scale;
            const startY = geometry.top + block.y * geometry.scale;
            const targetX = startX + block.targetX * Math.min(180, geometry.width * .2);
            const targetY = startY + block.targetY * Math.min(140, geometry.height * .18);
            const arc = Math.sin(p * Math.PI);
            const x = startX + (targetX - startX) * p + arc * block.bendX * geometry.width;
            const y = startY + (targetY - startY) * p + arc * block.bendY * geometry.height;
            const size = 1 + p * (block.depth - 1);
            block.element.style.opacity = String(1 - smooth((progress - block.fadeStart) / .48));
            const turn = driftEase((progress - block.delay - .07) / (block.duration + .08));
            block.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${block.spin * turn}deg) scale(${size})`;
        });
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(render);
    };
    const measure = () => {
        const enabled = !!photo.naturalWidth && !preference.matches;
        home.classList.toggle('hero-scatter-active', enabled);
        if (!enabled) {
            home.style.removeProperty('--hero-scatter-distance');
            geometry = null;
            schedule();
            return;
        }
        home.style.setProperty('--hero-scatter-distance', `${Math.round(Math.max(380, Math.min(680, window.innerHeight * .72)) * 1.9)}px`);
        const rect = photo.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const scale = rect.width / 1066;
        geometry = {
            left: rect.left - stageRect.left, top: rect.top - stageRect.top, scale,
            width: stage.clientWidth, height: stage.clientHeight,
            release: Math.max(1, home.offsetHeight - stage.offsetHeight),
            // Reserve the final stretch for a completely white viewport.
            distance: Math.max(1, (home.offsetHeight - stage.offsetHeight) * .65)
        };
        blocks.forEach(block => {
            block.element.style.width = `${block.width * scale}px`;
            block.element.style.height = `${block.height * scale}px`;
            block.element.style.backgroundImage = `url("${photo.currentSrc || photo.src}")`;
            block.element.style.backgroundSize = `${1066 * scale}px ${633 * scale}px`;
            block.element.style.backgroundPosition = `${-block.x * scale}px ${-block.y * scale}px`;
        });
        schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pageshow', measure);
    photo.addEventListener('load', measure);
    preference.addEventListener('change', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(home);
    measure();
})();

});

/* Source: floating-wood.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
/* Show the viewport decoration between HOME and POPUP, and within CONTACT. */
(() => {
    const layer = document.querySelector('.floating-wood');
    const boundary = document.querySelector('#detail');
    const home = document.querySelector('#home');
    const contact = document.querySelector('#contact');
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

    // Each overlapping page needs decorations inside its own stacking context.
    const panelLayers = [...document.querySelectorAll('#about-me > .profile-story, #about-me > .skills-section')].map(panel => {
        const decoration = layer.cloneNode(true);
        decoration.classList.add('floating-wood-panel');
        panel.prepend(decoration);
        return { panel, decoration, copies: [...decoration.querySelectorAll('.floating-wood-piece')] };
    });
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
        const visible = bottom > top;
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
        panelLayers.forEach(({ panel, decoration, copies }) => {
            const rect = panel.getBoundingClientRect();
            const panelTop = clamp(Math.max(top, rect.top), 0, height);
            const panelBottom = clamp(Math.min(bottom, rect.bottom), 0, height);
            const shown = visible && panelBottom > panelTop;
            decoration.style.clipPath = `inset(${panelTop}px 0 ${height - panelBottom}px 0)`;
            decoration.style.visibility = shown ? 'visible' : 'hidden';
            decoration.style.setProperty('--wood-play-state', shown ? 'running' : 'paused');
            copies.forEach((copy, index) => {
                copy.style.cssText = pieces[index].style.cssText;
                const originalAnimation = pieces[index].getAnimations()[0];
                const copyAnimation = copy.getAnimations()[0];
                if (originalAnimation && copyAnimation) copyAnimation.currentTime = originalAnimation.currentTime;
            });
        });
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

});

/* Source: responsive-text.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
/* Fit text to its available width while preserving explicit <br> breaks. */
(() => {
    const start = () => {
        const excluded = 'script, style, noscript, svg, textarea, input, [aria-hidden="true"], .lune-color-copy > p, .lune-font-why > p, .poster-heading > p, .poster-content > p, .popup-description-slide, .about-intro, .banner-caption p, .skill-detail, .profile-timeline .education-info p, .profile-timeline .certification-info li > div > span';
        const elements = [...document.body.querySelectorAll('*')].filter(element =>
            !element.closest(excluded) &&
            [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
        );
        const originals = new Map(elements.map(element => [element, {
            size: element.style.getPropertyValue('font-size'),
            priority: element.style.getPropertyPriority('font-size')
        }]));

        elements.forEach(element => {
            element.style.setProperty('white-space', 'nowrap', 'important');
            element.style.setProperty('overflow-wrap', 'normal', 'important');
            element.style.setProperty('word-break', 'normal', 'important');
            element.style.setProperty('min-width', '0');
        });

        const fit = () => {
            // Restore stylesheet sizes first so resizing never compounds a reduction.
            elements.forEach(element => {
                const original = originals.get(element);
                if (original.size) element.style.setProperty('font-size', original.size, original.priority);
                else element.style.removeProperty('font-size');
            });

            elements.forEach(element => {
                if (!element.getClientRects().length) return;
                const computed = getComputedStyle(element);
                if (computed.writingMode !== 'horizontal-tb' || computed.clipPath === 'inset(50%)') return;
                const inline = computed.display === 'inline';
                let container = inline ? element.parentElement : element;
                while (container && getComputedStyle(container).display === 'inline') container = container.parentElement;
                if (!container || !container.clientWidth) return;
                const containerStyle = getComputedStyle(container);
                const available = container.clientWidth - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight);
                if (available <= 1) return;

                const range = document.createRange();
                range.selectNodeContents(element);
                const width = () => range.getBoundingClientRect().width;
                if (width() <= available + .5) return;
                let low = 0;
                let high = parseFloat(computed.fontSize);
                for (let step = 0; step < 12; step++) {
                    const middle = (low + high) / 2;
                    element.style.setProperty('font-size', `${middle}px`, 'important');
                    if (width() > available) high = middle;
                    else low = middle;
                }
                element.style.setProperty('font-size', `${low}px`, 'important');
            });

        };

        let frame;
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(fit);
        };
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('load', schedule, { once: true });
        document.fonts.ready.then(schedule);
        // Hidden slides and skill panels are fitted when their state changes.
        new MutationObserver(schedule).observe(document.body, {
            subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'open']
        });
        schedule();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

});

/* Source: review.js — 기존 HTML 미연결 코드. 실행하지 않고 보존. */
(() => {
let reviewArray = [];
});
