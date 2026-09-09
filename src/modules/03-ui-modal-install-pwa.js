/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 03-ui-modal-install-pwa.js
 * Escopo: Economia, flags, telas, modais, feedback, instalação e PWA
 * Linhas de origem V642: 397-658
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function addXP(amount) {
    state.profile.xp += Math.max(0, Math.round(amount));
    const nextLevel = Math.floor(state.profile.xp / 1000) + 1;
    if (nextLevel > state.profile.level) {
      state.profile.level = nextLevel;
      toast(`Nível ${nextLevel}!`, 'good');
      awardMedal(`Nível ${nextLevel}`);
    }
    saveState();
    updateHUD();
  }
  function addCoins(amount) {
    state.profile.coins = Math.max(0, state.profile.coins + Math.round(amount));
    saveState(); updateHUD();
  }
  function addReputation(amount) {
    state.profile.reputation = Math.max(0, state.profile.reputation + Math.round(amount));
    saveState(); updateHUD();
  }
  function awardMedal(name) {
    if (state.medals.includes(name)) return;
    state.medals.push(name);
    toast(`🏅 ${name}`, 'good');
    saveState();
  }
  function setFlag(flag, value = true) {
    if (state.flags[flag] === value) return;
    state.flags[flag] = value;
    evaluateMissions();
    saveState();
  }

  function showScreen(name) {
    els.lobby.classList.toggle('active', name === 'lobby');
    els.game.classList.toggle('active', name === 'game');
    queueMicrotask(() => typeof updateInstallUI === 'function' && updateInstallUI());
  }
  function toast(text, type = 'good', ms = 1700) {
    els.toast.textContent = text;
    els.toast.className = `toast show ${type}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'), ms);
  }
  function vibrate(pattern = 30) {
    if (state.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
  }
  function beep(freq = 500, duration = 70, type = 'square') {
    if (!state.settings.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = beep.ctx || (beep.ctx = new Ctx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.value = .025;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration / 1000);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }

  function openModal(title, html, onReady) {
    state.ui.quickOpen = false;
    if (els.quickBar) els.quickBar.hidden = true;
    els.quickToggleBtn?.classList.remove('active');
    input.keys?.clear?.();
    input.targetX = input.targetZ = input.x = input.z = 0;
    if (typeof player !== 'undefined' && player.vehicle) player.car.speed *= .7;
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = html;
    els.modal.hidden = false;
    document.body.classList.add('modal-open');
    els.game?.setAttribute('aria-hidden', 'true');
    if (onReady) onReady(els.modalBody);
    requestAnimationFrame(()=>{els.modalBody.scrollTop=0;scheduleStableResize(0,true);});
  }
  function closeModal() {
    clearExtensionPreview();
    if (typeof fishingSession !== 'undefined' && fishingSession) cancelFishingSession();
    else if (typeof fishingVisual !== 'undefined' && fishingVisual?.active) stopFishingVisual();
    const resumePausedGame = pauseMenuOpen;
    els.modal.hidden = true;
    els.modal.classList.remove('map-modal','fishing-modal');
    els.modalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    els.game?.removeAttribute('aria-hidden');
    input.keys?.clear?.();
    input.targetX = input.targetZ = input.x = input.z = 0;
    if (resumePausedGame) {
      pauseMenuOpen = false;
      paused = false;
      if (running && player.vehicle) startEngineSound();
    }
  }
  function confirmModal(title, text, yesLabel = 'Sim', noLabel = 'Não') {
    return new Promise(resolve => {
      openModal(title, `<p>${text}</p><div class="modal-actions"><button class="btn primary" data-yes>${yesLabel}</button><button class="btn" data-no>${noLabel}</button></div>`, root => {
        $('[data-yes]', root).onclick = () => { closeModal(); resolve(true); };
        $('[data-no]', root).onclick = () => { closeModal(); resolve(false); };
      });
    });
  }
  els.modalClose.onclick = closeModal;
  els.modal.addEventListener('pointerdown', e => { if (e.target === els.modal) closeModal(); });

  /* PWA — instalação aparece somente no lobby e apenas quando realmente disponível */
  let deferredInstallPrompt = null;
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true || safeLocalGet('otthos_installed') === '1';
  function updateInstallUI() {
    const installed = isStandalone();
    const canInstall = !installed && !!deferredInstallPrompt;
    // O botão permanece visível enquanto o aplicativo não estiver instalado.
    // Quando o navegador não oferece o prompt automático, ele abre as instruções manuais.
    if (els.installBtn) {
      els.installBtn.hidden = installed;
      els.installBtn.classList.toggle('install-ready', canInstall);
      els.installBtn.setAttribute('aria-label', canInstall ? 'Instalar OTTHOS agora' : 'Ver como instalar OTTHOS');
    }
    if (els.installHint) {
      els.installHint.hidden = installed;
      els.installHint.textContent = canInstall ? 'Toque para instalar com o ícone OTTHOS.' : 'Toque em Instalar para adicionar o OTTHOS ao celular.';
    }
    document.documentElement.classList.toggle('app-installed', installed);
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUI();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    safeLocalSet('otthos_installed', '1');
    updateInstallUI();
    toast('Aplicativo instalado!', 'good');
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', updateInstallUI);
  async function installApp() {
    if (isStandalone()) { updateInstallUI(); return; }
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallUI();
      return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    openModal('Instalar aplicativo', isiOS
      ? '<p>No iPhone/iPad, toque em <b>Compartilhar</b> e escolha <b>Adicionar à Tela de Início</b>.</p>'
      : '<p>No Chrome, abra o menu ⋮ e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</p>');
  }
  if (els.installBtn) els.installBtn.onclick = installApp;
  const OTTHI_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
  let otthiUpdateReloading = false;
  let otthiLastUpdateCheck = 0;
  let otthiServiceWorkerRegistration = null;

  function isOfficialOtthiGameAddress() {
    try {
      const live = new URL(OTTHI_GAME_LIVE_BASE);
      const current = new URL(location.href);
      return current.origin === live.origin
        && (current.pathname === live.pathname || current.pathname.startsWith(live.pathname));
    } catch {
      return false;
    }
  }

  async function persistBeforeOtthiReload() {
    try { await saveState(true); } catch {}
    try { await lastSavePromise; } catch {}
  }

  async function reloadForOtthiUpdate(buildToken) {
    if (otthiUpdateReloading) return false;
    otthiUpdateReloading = true;
    await persistBeforeOtthiReload();
    const target = new URL(location.href);
    target.searchParams.set('otthi_update', buildToken || String(Date.now()));
    location.replace(target.href);
    return true;
  }

  async function probeOtthiGameUpdate(force = false) {
    if (!isOfficialOtthiGameAddress() || !navigator.onLine || otthiUpdateReloading) return false;
    const now = Date.now();
    if (!force && now - otthiLastUpdateCheck < OTTHI_UPDATE_INTERVAL_MS) return false;
    otthiLastUpdateCheck = now;
    try {
      const probe = new URL('release-manifest.json', OTTHI_GAME_LIVE_BASE);
      probe.searchParams.set('otthi_probe', String(now));
      const response = await fetch(probe.href, { cache:'no-store', credentials:'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const release = await response.json();
      const remoteBuild = String(release?.build || '');
      const remoteRevision = String(release?.revision || '');
      if ((remoteBuild && remoteBuild !== OTTHI_GAME_WEB_BUILD)
        || (remoteRevision && remoteRevision !== OTTHI_RELEASE_REVISION)) {
        if (!otthiServiceWorkerRegistration) {
          return reloadForOtthiUpdate(remoteRevision || remoteBuild);
        }
        await otthiServiceWorkerRegistration?.update?.().catch(() => {});
        if (otthiServiceWorkerRegistration?.waiting) {
          otthiServiceWorkerRegistration.waiting.postMessage({ type:'SKIP_WAITING' });
        }
        toast('Atualização encontrada. Ela será aplicada quando todos os arquivos forem validados.','good',3200);
        return true;
      }
    } catch (error) {
      console.warn('[OTTHI UPDATE] Verificação adiada:', error?.message || error);
    }
    return false;
  }

  async function registerOtthiGameUpdates() {
    if (!('serviceWorker' in navigator) || !isOfficialOtthiGameAddress()) return;
    const hadController = !!navigator.serviceWorker.controller;
    let controllerHandled = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (controllerHandled) return;
      controllerHandled = true;
      if (hadController) reloadForOtthiUpdate(`sw-${OTTHI_GAME_WEB_BUILD}`);
    });
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });
      otthiServiceWorkerRegistration = registration;
      if (registration.waiting) registration.waiting.postMessage({ type:'SKIP_WAITING' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type:'SKIP_WAITING' });
          }
        });
      });
      await registration.update().catch(() => {});
      setTimeout(() => probeOtthiGameUpdate(true), 1800);
      setInterval(() => {
        registration.update().catch(() => {});
        probeOtthiGameUpdate(false);
      }, OTTHI_UPDATE_INTERVAL_MS);
    } catch (error) {
      console.warn('[OTTHI UPDATE] Service Worker indisponível:', error?.message || error);
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', registerOtthiGameUpdates, { once:true });
  }
  window.addEventListener('offline', () => toast('Sem internet. O progresso continua salvo neste aparelho.','warn',3200), { passive:true });
  window.addEventListener('online', () => {
    toast('Conexão restabelecida. Sincronizando com segurança.','good',2600);
    probeOtthiGameUpdate(true);
  }, { passive:true });
  window.addEventListener('pageshow', () => probeOtthiGameUpdate(false), { passive:true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) probeOtthiGameUpdate(false);
  });
  updateInstallUI();
  if (!window.OTTHI_RELEASE_COHERENT) {
    setTimeout(() => openModal('Atualização incompleta',`<div class="parent-gate"><span>🧩</span><h3>Os arquivos publicados pertencem a versões diferentes</h3><p>Seu progresso está preservado. Termine de enviar todos os arquivos V646 e toque em verificar novamente.</p><button class="btn primary xl" data-coherence-reload>Verificar novamente</button></div>`,root=>{
      $('[data-coherence-reload]',root).onclick=()=>reloadForOtthiUpdate(`coherence-${Date.now()}`);
    }), 0);
  } else if (!navigator.onLine) {
    setTimeout(() => toast('Modo offline ativo. Seu progresso será sincronizado quando a internet voltar.','warn',3200), 400);
  }


  const DAILY_QUEST_POOL=[
    {id:'walk',icon:'👟',title:'Explorador da Vila',target:180,reward:90,xp:50,label:n=>`${Math.floor(n)}/180 m caminhando`},
    {id:'drive',icon:'🚗',title:'Piloto da Vila',target:260,reward:120,xp:70,label:n=>`${Math.floor(n)}/260 m dirigindo`},
    {id:'jump',icon:'⬆',title:'Pula-pula',target:12,reward:70,xp:45,label:n=>`${Math.floor(n)}/12 pulos`},
    {id:'collect',icon:'💎',title:'Caçador de Tesouros',target:5,reward:95,xp:60,label:n=>`${Math.floor(n)}/5 itens coletados`},
    {id:'talk',icon:'💬',title:'Amigo da Vizinhança',target:3,reward:80,xp:50,label:n=>`${Math.floor(n)}/3 conversas`},
    {id:'cook',icon:'🍳',title:'Chef da Vila',target:1,reward:75,xp:45,label:n=>`${Math.floor(n)}/1 refeição`},
    {id:'race',icon:'🏁',title:'Competidor',target:1,reward:130,xp:80,label:n=>`${Math.floor(n)}/1 corrida concluída`},
    {id:'metro',icon:'Ⓜ️',title:'Rede Metropolitana',target:2,reward:110,xp:65,label:n=>`${Math.floor(n)}/2 viagens de metrô`},
    {id:'bus',icon:'🚌',title:'Passageiro da Cidade',target:3,reward:105,xp:60,label:n=>`${Math.floor(n)}/3 paradas de ônibus`},
    {id:'skill',icon:'✨',title:'Mestre das Skills',target:3,reward:120,xp:75,label:n=>`${Math.floor(n)}/3 skills avançadas`}
  ];
