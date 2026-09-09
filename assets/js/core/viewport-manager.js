(() => {
  'use strict';
  let last = '';
  let timer = 0;
  function measure() {
    const vv = window.visualViewport;
    const width = Math.max(280, Math.round(vv?.width || document.documentElement.clientWidth || innerWidth));
    const height = Math.max(220, Math.round(vv?.height || document.documentElement.clientHeight || innerHeight));
    const landscape = width > height;
    const keyboard = Math.max(0, innerHeight - height) > 120;
    const key = `${width}x${height}:${landscape}:${keyboard}`;
    if (key === last) return;
    last = key;
    const root = document.documentElement;
    root.style.setProperty('--otthi-width', `${width}px`);
    root.style.setProperty('--otthi-height', `${height}px`);
    root.style.setProperty('--otthi-aspect', String(width / height));
    document.body?.classList.toggle('otthi-portrait', !landscape);
    document.body?.classList.toggle('otthi-landscape', landscape);
    document.body?.classList.toggle('otthi-keyboard', keyboard);
    document.body?.setAttribute('data-otthi-orientation', landscape ? 'landscape' : 'portrait');
    window.dispatchEvent(new CustomEvent('otthi:viewport', { detail:{ width, height, landscape, keyboard } }));
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(measure, 40); }
  addEventListener('resize', schedule, { passive:true });
  addEventListener('orientationchange', schedule, { passive:true });
  visualViewport?.addEventListener('resize', schedule, { passive:true });
  screen.orientation?.addEventListener?.('change', schedule);
  document.addEventListener('DOMContentLoaded', measure, { once:true });
  window.OTTHI_VIEWPORT = { measure, schedule };
})();
