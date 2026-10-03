/* Independent solid cubes. Scroll positions are reversible and deterministic. */
(async () => {
  const home = document.querySelector('#home');
  const stage = home?.querySelector('.hero-stage');
  if (!stage) return;
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
