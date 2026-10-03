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
