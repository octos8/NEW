/* Enlarge the entire original cube photo, then wash to white over ABOUT. */
(() => {
  const home = document.querySelector('#home');
  const stage = home?.querySelector('.hero-stage');
  if (!stage) return;
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
