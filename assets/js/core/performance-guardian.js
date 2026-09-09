(() => {
  'use strict';
  const cfg = window.OTTHI_CONFIG?.performance || { targetFps:30, downgradeFps:24, recoveryFps:48, sampleIntervalMs:3000 };
  const history = [];
  let lowCount = 0;
  let highCount = 0;
  let timer = 0;
  let badge = null;

  function diagnostic() {
    try { return window.OTTHOS_TEST_API?.diagnostics?.() || null; } catch { return null; }
  }
  function performanceData() {
    try { return window.OTTHOS_TEST_API?.performance?.() || null; } catch { return null; }
  }
  function showBadge(data) {
    if (!new URLSearchParams(location.search).has('debug')) return;
    if (!badge) {
      badge = document.createElement('button');
      badge.type = 'button';
      badge.id = 'otthiPerformanceBadge';
      badge.title = 'Abrir painel técnico do jogo';
      badge.addEventListener('click', () => window.OTTHOS_TEST_API?.toggleTechnicalPanel?.());
      document.body.appendChild(badge);
    }
    badge.textContent = `${Math.round(data.fps || 0)} FPS • ${data.tier || '?'}`;
    badge.dataset.level = data.fps < cfg.downgradeFps ? 'bad' : data.fps < cfg.targetFps ? 'warn' : 'good';
  }
  function sample() {
    const data = performanceData();
    const game = diagnostic();
    if (!data || !game?.running) return;
    history.push({ at:Date.now(), ...data });
    if (history.length > 40) history.shift();
    showBadge(data);
    if (data.fps < cfg.downgradeFps) { lowCount += 1; highCount = 0; }
    else if (data.fps > cfg.recoveryFps) { highCount += 1; lowCount = Math.max(0, lowCount - 1); }
    else { lowCount = Math.max(0, lowCount - 1); highCount = Math.max(0, highCount - 1); }
    if (lowCount >= 2 && data.requested === 'auto' && data.tier !== 'low') {
      window.OTTHOS_TEST_API?.setQuality?.('low');
      lowCount = 0;
      window.dispatchEvent(new CustomEvent('otthi:performance-protected', { detail:data }));
    }
  }
  function start() {
    stop();
    timer = setInterval(sample, Math.max(2000, cfg.sampleIntervalMs || 3000));
  }
  function stop() { if (timer) clearInterval(timer); timer = 0; }
  document.addEventListener('DOMContentLoaded', start, { once:true });
  window.OTTHI_PERFORMANCE = { start, stop, sample, history:() => history.slice(), current:performanceData };
})();
