/* Pointer events come from the window because HOME is a non-interactive layer. */
(() => {
  const home = document.querySelector('#home');
  const stage = home?.querySelector('.hero-stage');
  if (!stage) return;
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
