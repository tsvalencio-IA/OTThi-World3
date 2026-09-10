/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 09-responsive-ar-quality-diagnostics.js
 * Escopo: Responsividade, AR, modos, qualidade, LOD e diagnóstico
 * Linhas de origem V642: 1360-1624
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function syncMobilePanels(){
    const compact=document.body.classList.contains('ui-compact')||document.body.classList.contains('ui-narrow')||document.body.classList.contains('ui-short');
    if(compact&&state.ui.quickOpen&&state.ui.skillsOpen)state.ui.skillsOpen=false;
    if(document.body.classList.contains('mode-fishing')){state.ui.quickOpen=false;state.ui.skillsOpen=false;state.ui.needsOpen=false;state.ui.missionOpen=false;els.game?.classList.remove('needs-expanded');els.missionCard?.classList.remove('expanded');}
    document.body.classList.toggle('skills-open',!!state.ui.skillsOpen);document.body.classList.toggle('quick-open',!!state.ui.quickOpen);
    els.skillsToggleBtn?.classList.toggle('active',!!state.ui.skillsOpen);els.quickToggleBtn?.classList.toggle('active',!!state.ui.quickOpen);if(els.quickBar)els.quickBar.hidden=!state.ui.quickOpen;
  }
  els.quickToggleBtn.onclick = () => { state.ui.quickOpen = !state.ui.quickOpen;if(state.ui.quickOpen)state.ui.skillsOpen=false;syncMobilePanels();saveState(); };
  els.skillsToggleBtn.onclick=()=>{state.ui.skillsOpen=!state.ui.skillsOpen;if(state.ui.skillsOpen)state.ui.quickOpen=false;syncMobilePanels();saveState();};
  els.needsToggleBtn.onclick = () => { state.ui.needsOpen = !state.ui.needsOpen; els.game.classList.toggle('needs-expanded', state.ui.needsOpen); saveState(); };
  const toggleMission = () => openObjectivesPanel();
  els.missionCard.onclick = toggleMission;
  els.missionCard.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMission(); } };
  [els.avatarGameBtn,els.inventoryBtn,els.buildBtn,els.toolsBtn,els.mapBtn,els.dailyBtn,els.onlineBtn,els.newsQuickBtn,els.neighborhoodQuickBtn,els.gameSettingsBtn].forEach(btn => btn?.addEventListener('click', () => { state.ui.quickOpen=false; els.quickBar.hidden=true; els.quickToggleBtn.classList.remove('active'); }));
  async function ensureModelViewerReady({activateAR=false}={}) {
    if (!els.nativeViewer || !window.loadModelViewerLib) throw new Error('Visualizador indisponível');
    if (els.viewerStatus) els.viewerStatus.textContent = 'Carregando visualizador 3D…';
    if (els.viewerLoadBtn) els.viewerLoadBtn.disabled = true;
    els.nativeViewer.hidden = false;
    try {
      await window.loadModelViewerLib();
      await Promise.race([
        customElements.whenDefined('model-viewer'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado carregando model-viewer')), 15000))
      ]);
      if (!els.nativeViewer.loaded) {
        await Promise.race([
          new Promise((resolve, reject) => {
            const done = () => { cleanup(); resolve(true); };
            const fail = () => { cleanup(); reject(new Error('Falha carregando athos.glb')); };
            const cleanup = () => { els.nativeViewer.removeEventListener('load', done); els.nativeViewer.removeEventListener('error', fail); };
            els.nativeViewer.addEventListener('load', done, {once:true});
            els.nativeViewer.addEventListener('error', fail, {once:true});
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado carregando o modelo 3D')), 20000))
        ]);
      }
      if (els.viewerPlaceholder) els.viewerPlaceholder.hidden = true;
      if (els.viewerShell) els.viewerShell.classList.add('viewer-ready');
      if (activateAR) await els.nativeViewer.activateAR();
      return true;
    } catch (error) {
      if (els.viewerPlaceholder) els.viewerPlaceholder.hidden = false;
      if (els.viewerStatus) els.viewerStatus.textContent = 'Não foi possível carregar. Toque para tentar novamente.';
      throw error;
    } finally {
      if (els.viewerLoadBtn) els.viewerLoadBtn.disabled = false;
    }
  }
  function otthiGameModelUrl() {
    return new URL('athos.glb', OTTHI_GAME_LIVE_BASE).href;
  }

  function androidSceneViewerUrl() {
    const sceneViewer = new URL('https://arvr.google.com/scene-viewer/1.0');
    sceneViewer.searchParams.set('file', otthiGameModelUrl());
    sceneViewer.searchParams.set('mode', 'ar_preferred');
    sceneViewer.searchParams.set('title', 'Otthos');
    sceneViewer.searchParams.set('link', OTTHI_GAME_LIVE_BASE);
    sceneViewer.searchParams.set('resizable', 'false');
    return sceneViewer.href;
  }

  function isAndroidDevice() {
    return /android/i.test(navigator.userAgent || '');
  }

  function openAndroidSceneViewer() {
    if (!isAndroidDevice()) return false;
    location.assign(androidSceneViewerUrl());
    return true;
  }

  if (els.viewerLoadBtn) els.viewerLoadBtn.onclick = () => ensureModelViewerReady().catch(() => toast('Visualizador 3D indisponível agora.','warn',2400));
  if (els.insideArBtn) els.insideArBtn.addEventListener('click', event => {
    if (!isAndroidDevice()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openAndroidSceneViewer();
  }, true);
  els.arBtn.onclick = async () => {
    if (openAndroidSceneViewer()) return;
    try { await ensureModelViewerReady({activateAR:true}); }
    catch { openModal('Realidade aumentada', '<p>Não foi possível iniciar o AR agora. Verifique a internet e o suporte do aparelho e tente novamente.</p>'); }
  };

  /* THREE.JS GAME */
  let scene, camera, renderer, clock, worldGroup, playerGroup, playerModel, playerMixer, avatarLayer, contactShadow, vehicleVisual, toolVisual, sunLight;
  let activeVehicleRef = null;
  let running = false, paused = false, pauseMenuOpen = false, raf = 0, cameraYaw = 0, cameraPitch = clamp(Number(state.settings?.cameraPitch ?? .28),-.55,1.35), cameraZoom = Number(state.settings?.cameraZoom || 0), cameraMode = 'openworld';
  let currentHouse = null, buildMode = null, buildPreview = null, buildPanel = null, buildRotation = 0, buildPlacement = null, currentContext = null, currentVehicleContext = null, lastContextId = '', lastActionSource = 'none', actionLockedUntil = 0, activeRace = null, lastContextScanAt = 0, lastContextScanX = Infinity, lastContextScanZ = Infinity;
  const player = { x: 0, y: 0, z: 8, vx: 0, vy: 0, vz: 0, facing: Math.PI, grounded: true, vehicle: false, sitUntil: 0, lastGrounded: 0, lastSafeX: 0, lastSafeY: 0, lastSafeZ: 8, lastSafeAt: 0, invalidSince: 0, jumpBuffer: 0, airJumpAvailable: true, lastJumpWasAir: false, attackUntil: 0, damageUntil: 0, shieldUntil:0, skillDashUntil:0, scaleMode: state.abilities?.scaleMode || 'normal', crouched: !!state.abilities?.crouched, spinUntil: 0, preVehicleAbilities: null, hornUntil: 0, emoteUntil:0, emoteType:'', emoteSeq:0, boating:false, transit:{mode:'',busId:'',requestStop:false,metroUntil:0}, boat:{heading:0,speed:0,steerVisual:0,passengerOf:'',passengerUid:'',passengerBotId:'',hostMissingAt:0}, car: { id:'', kind:'car', label:'Carro', heading: Math.PI, speed: 0, steerVisual: 0, drift: 0, _prevSpeed: 0, turboUntil:0, sirenActive:false, utilityCooldownUntil:0, passengerOf:'', passengerUid:'', passengerUids:[], passengerBotId:'', hostMissingAt:0 } };
  const input = {
    x:0,z:0,targetX:0,targetZ:0,
    joyId:null,joyX:0,joyZ:0,
    gamepadX:0,gamepadZ:0,gamepadActive:false,
    virtualX:0,virtualZ:0,virtualActive:false,
    touchSprint:false,gamepadSprint:false,isSprinting:false,
    mobilityAccelerate:false,mobilityBrake:false,mobilityControlSource:'',
    keys:new Set(),cameraDrag:null,cameraPointers:new Map(),pinchDistance:0
  };
  const world = {
    houses: [], npcs: [], interactables: [], enemies: [], fireballs: [], resources: [], crystals: [], platforms: [], colliders: [], hazards: [], builds: [], ghosts: new Map(), navigationSigns: [],
    bridgeParts: [], secretChest: null, vehicle: null, activeVehicle:null, vehicles:[], buses:[], busStops:[], metroStations:[], policeCars:[], policeAlert:null, policeStations:[], school:null, schools:[], policeStation:null, fireStation:null, fireTrucks:[], ambulances:[], fires:[], trafficIncidents:[], activeIncident:null, nextFireAt:0, emergencySeq:0, mine:null, well:null, deliveryPoint: null, raceCoins: [], waypointMarker: null, gym: null, routeGuide: null, routeArrows: [], routeLastBuild: 0, routeLastX: Infinity, routeLastZ: Infinity, routePath: [], navCache: new Map(), landmarks: [], outlines: [], glows: [], criticalSurfaces: [], boat:null, campfires:[], animals:[], houseExtensions:[], extensionFurniture:[], remoteCampfires:new Map(), remoteExtensions:new Map(), challengeTokens:[], activeChallenge:null, activityAcc:0, shoreFishers:[], waterSurfaces:[]
  };
  const textures = {};
  const materials = {};


  const OTTHI_VISUAL_GOVERNOR_MIGRATION='otthi_visual_governor_r1681';
  function migrateLegacyAutoForcedQuality(){
    // R16.8.1: versões anteriores podiam gravar LOW automaticamente via performance-guardian.
    // Só desfazemos o caso inequivocamente automático (quality=low + autoTier=low), uma única vez.
    let migrated=false;try{migrated=localStorage.getItem(OTTHI_VISUAL_GOVERNOR_MIGRATION)==='1';}catch{}
    if(migrated)return false;
    const mobile=matchMedia('(pointer:coarse)').matches;
    if(mobile&&state.settings?.quality==='low')state.settings.quality='auto';
    if(mobile&&state.settings?.autoTier==='low')state.settings.autoTier='balanced';
    try{localStorage.setItem(OTTHI_VISUAL_GOVERNOR_MIGRATION,'1');}catch{}
    try{saveState();}catch{}
    return true;
  }
  migrateLegacyAutoForcedQuality();
  function detectStableAutoTier(){
    const memory=Number(navigator.deviceMemory||4),cores=Number(navigator.hardwareConcurrency||4),mobile=matchMedia('(pointer:coarse)').matches;
    // HardwareHint é apenas diagnóstico. No celular, a identidade visual automática começa sempre equilibrada;
    // RAM/núcleos reportados pelo navegador não podem decidir que um aparelho verá um mundo "mais pobre".
    if(mobile)return 'balanced';
    if(memory>=8&&cores>=8)return 'high';
    return 'balanced';
  }
  function resolvedStableAutoTier(saved=state.settings?.autoTier){
    const detected=detectStableAutoTier(),mobile=matchMedia('(pointer:coarse)').matches;
    if(mobile&&saved==='high')return 'balanced';
    if(mobile)return 'balanced';
    if(!['low','balanced','high'].includes(saved))return detected;
    return saved==='low'?'balanced':saved;
  }
  const initialAutoTier=resolvedStableAutoTier();
  const perf = {
    tier:initialAutoTier, sessionTier:initialAutoTier, fps:60, frameAcc:0, frameCount:0, sampleMs:0, lastNow:performance.now(),
    lowSamples:0, highSamples:0, recommendationSamples:0, aiAcc:0, trafficAcc:0, cloudAcc:0, lodAcc:0, uiAcc:0, panelAcc:0, modeAuditAcc:0, renderAcc:0, renderedFrames:0, aiTicks:0, trafficTicks:0, mobile:matchMedia('(pointer:coarse)').matches,
    appliedTier:'',appliedDpr:0,recommendation:initialAutoTier,lastRecommendationSaved:0,lastRenderW:0,lastRenderH:0,resizeTimer:0,cullingEnabled:0,cullingBypassed:0,criticalVisible:0,criticalHidden:0,dynamicVisible:0,dynamicHidden:0,
    renderScale:1,renderScaleMin:matchMedia('(pointer:coarse)').matches?.72:.82,renderScaleMax:1,governorPressure:0,governorRecoveries:0,governorProtections:0,governorReason:'boot',
    loopAcc:0,rafHz:60,rafSampleAcc:0,rafFrames:0,simulationHz:0,simulationFrames:0,simulationSampleAcc:0
  };
  const distanceCullPosition=new THREE.Vector3(),distanceCullScale=new THREE.Vector3();
  const PLAYER_MODES=Object.freeze({
    WALKING:'walking',RUNNING:'running',INTERIOR:'interior',BUILDING:'building',FISHING:'fishing',
    CAR_DRIVER:'car-driver',CAR_PASSENGER:'car-passenger',BUS_PASSENGER:'bus-passenger',METRO_PASSENGER:'metro-passenger',
    BOAT_DRIVER:'boat-driver',BOAT_PASSENGER:'boat-passenger',MOTORCYCLE_DRIVER:'motorcycle-driver',MOTORCYCLE_PASSENGER:'motorcycle-passenger',
    BICYCLE:'bicycle',SKATE:'skate',SOCIAL_ACTION:'social-action',MISSION_ACTION:'mission-action',DISABLED_DURING_MODAL:'disabled-during-modal',
    ON_FOOT:'walking',VEHICLE_DRIVER:'car-driver',VEHICLE_PASSENGER:'car-passenger',BUS:'bus-passenger',METRO:'metro-passenger'
  });
  const playerModeMachine={state:PLAYER_MODES.WALKING,enteredAt:performance.now(),lastReason:'boot',conflicts:[],history:[],transitionCount:0};
  function vehiclePlayerMode(){
    const kind=String(player.car?.kind||'car');
    if(kind==='motorcycle'||kind==='moto')return player.car.passengerOf?PLAYER_MODES.MOTORCYCLE_PASSENGER:PLAYER_MODES.MOTORCYCLE_DRIVER;
    if(kind==='bicycle')return PLAYER_MODES.BICYCLE;
    if(kind==='skate')return PLAYER_MODES.SKATE;
    return player.car.passengerOf?PLAYER_MODES.CAR_PASSENGER:PLAYER_MODES.CAR_DRIVER;
  }
  function derivePlayerMode(){
    if(player.transit.mode==='metro')return PLAYER_MODES.METRO_PASSENGER;
    if(player.transit.mode==='bus')return PLAYER_MODES.BUS_PASSENGER;
    if(player.boating)return player.boat.passengerOf?PLAYER_MODES.BOAT_PASSENGER:PLAYER_MODES.BOAT_DRIVER;
    if(player.vehicle)return vehiclePlayerMode();
    if(currentHouse)return PLAYER_MODES.INTERIOR;
    if(buildMode)return PLAYER_MODES.BUILDING;
    if(fishingSession||fishingVisual?.active)return PLAYER_MODES.FISHING;
    if(performance.now()<Number(player.emoteUntil||0))return PLAYER_MODES.SOCIAL_ACTION;
    return sprintRequested?.()&&Math.hypot(input.x,input.z)>.12?PLAYER_MODES.RUNNING:PLAYER_MODES.WALKING;
  }
  function auditPlayerMode(reason='periodic'){
    const exclusive=[];
    if(player.vehicle)exclusive.push('vehicle');
    if(player.boating)exclusive.push('boat');
    if(player.transit.mode)exclusive.push(`transit:${player.transit.mode}`);
    if(currentHouse)exclusive.push('interior');
    if(buildMode)exclusive.push('building');
    if(fishingSession||fishingVisual?.active)exclusive.push('fishing');
    playerModeMachine.conflicts=exclusive.length>1?exclusive:[];
    const next=derivePlayerMode();
    if(next!==playerModeMachine.state){
      playerModeMachine.history.push({from:playerModeMachine.state,to:next,at:Date.now(),reason});
      playerModeMachine.history=playerModeMachine.history.slice(-40);playerModeMachine.state=next;playerModeMachine.enteredAt=performance.now();playerModeMachine.lastReason=reason;playerModeMachine.transitionCount++;
    }
    return{state:playerModeMachine.state,conflicts:[...playerModeMachine.conflicts],valid:playerModeMachine.conflicts.length===0};
  }
  function isOnFootMode(mode=derivePlayerMode()){return mode===PLAYER_MODES.WALKING||mode===PLAYER_MODES.RUNNING;}
  function canEnterMobility(next){
    const audit=auditPlayerMode(`request:${next}`);
    if(!audit.valid){console.warn('[OTTHOS] Estado de mobilidade conflitante bloqueado',audit);return false;}
    return isOnFootMode(audit.state);
  }
  function cameraRelativeVector(x,z,yaw){
    const length=Math.hypot(x,z),nx=length>1?x/length:x,nz=length>1?z/length:z;
    const forwardX=Math.sin(yaw),forwardZ=-Math.cos(yaw),rightX=Math.cos(yaw),rightZ=Math.sin(yaw);
    return{x:rightX*nx+forwardX*nz,z:rightZ*nx+forwardZ*nz};
  }
  function normalizeControlIntent(rawX=0,rawZ=0,mode=derivePlayerMode()){
    const x=Math.abs(rawX)<.055?0:clamp(rawX,-1,1),z=Math.abs(rawZ)<.055?0:clamp(rawZ,-1,1);
    const disabled=mode===PLAYER_MODES.DISABLED_DURING_MODAL||mode===PLAYER_MODES.BUS_PASSENGER||mode===PLAYER_MODES.METRO_PASSENGER||mode===PLAYER_MODES.CAR_PASSENGER||mode===PLAYER_MODES.BOAT_PASSENGER||mode===PLAYER_MODES.MOTORCYCLE_PASSENGER;
    if(disabled)return{x:0,z:0,moveX:0,moveZ:0,steer:0,throttle:0,disabled:true,mode};
    if([PLAYER_MODES.CAR_DRIVER,PLAYER_MODES.MOTORCYCLE_DRIVER,PLAYER_MODES.BICYCLE,PLAYER_MODES.SKATE,PLAYER_MODES.BOAT_DRIVER].includes(mode))return{x,z,moveX:0,moveZ:0,steer:x,throttle:z,disabled:false,mode};
    const yaw=mode===PLAYER_MODES.INTERIOR?clamp(cameraYaw,-1.18,1.18):cameraYaw,worldVector=cameraRelativeVector(x,z,yaw);
    return{x,z,moveX:worldVector.x,moveZ:worldVector.z,steer:0,throttle:0,disabled:false,mode};
  }
  function requestedQuality(){return ['high','low','auto'].includes(state.settings.quality)?state.settings.quality:'auto';}
  function qualityLabel(){return requestedQuality()==='high'?'Alta':requestedQuality()==='low'?'Econômica':`Automática inteligente • ${qualityTier()==='high'?'Alta':qualityTier()==='low'?'Proteção':'Equilibrada'}`;}
  function qualityTier(){const requested=requestedQuality();return requested==='high'?'high':requested==='low'?'low':perf.sessionTier;}
  function performanceGovernorState(){return{mode:requestedQuality(),tier:qualityTier(),renderScale:+Number(perf.renderScale||1).toFixed(3),pressure:Number(perf.governorPressure||0),protections:Number(perf.governorProtections||0),recoveries:Number(perf.governorRecoveries||0),reason:String(perf.governorReason||''),rafHz:+Number(perf.rafHz||0).toFixed(1),simulationHz:+Number(perf.simulationHz||0).toFixed(1)};}
  function performanceGovernorProtect(reason='runtime-pressure',strength=1){
    if(requestedQuality()!=='auto')return performanceGovernorState();
    const step=clamp(Number(strength||1),.5,2)*.055,before=perf.renderScale;
    perf.renderScale=clamp(perf.renderScale-step,perf.renderScaleMin,perf.renderScaleMax);perf.governorPressure=Math.min(100,Number(perf.governorPressure||0)+Math.round(12*strength));perf.governorReason=reason;
    if(Math.abs(before-perf.renderScale)>.015){perf.governorProtections++;applyAdaptiveRenderSettings(true);}
    return performanceGovernorState();
  }
  function performanceGovernorRecover(reason='stable-runtime'){
    if(requestedQuality()!=='auto')return performanceGovernorState();
    const before=perf.renderScale;perf.renderScale=clamp(perf.renderScale+.025,perf.renderScaleMin,perf.renderScaleMax);perf.governorPressure=Math.max(0,Number(perf.governorPressure||0)-8);perf.governorReason=reason;
    if(Math.abs(before-perf.renderScale)>.01){perf.governorRecoveries++;applyAdaptiveRenderSettings(true);}
    return performanceGovernorState();
  }
  function targetDpr(){
    const tier=qualityTier(),mobile=perf.mobile;
    // Perfis manuais legados permanecem disponíveis exatamente como antes.
    if(requestedQuality()!=='auto'){
      if(tier==='high')return mobile?1.0:1.35;
      if(tier==='low') return mobile?.62:.95;
      return mobile?.72:1.08;
    }
    // Automático R16.8.1 preserva o perfil visual equilibrado e regula somente a resolução interna.
    const autoScale=clamp(Number(perf.renderScale||1),perf.renderScaleMin,perf.renderScaleMax),base=mobile?.80:1.08;
    return base*autoScale;
  }
  function applyAdaptiveRenderSettings(force=false){
    if(!renderer)return;
    const tier=qualityTier(),dpr=Math.min(devicePixelRatio||1,targetDpr());
    if(force||!running||Math.abs(perf.appliedDpr-dpr)>.035){renderer.setPixelRatio(dpr);perf.appliedDpr=dpr;}
    renderer.shadowMap.enabled=tier==='high'&&!perf.mobile;
    // No automático móvel a iluminação-base não muda: o governor reduz custo por resolução, não por "empobrecer" a cena.
    renderer.toneMappingExposure=requestedQuality()==='auto'&&perf.mobile?.94:tier==='high'?.98:tier==='balanced'?.94:.92;
    if(sunLight){if(!perf.appliedTier){const size=tier==='high'?(perf.mobile?1024:1536):tier==='balanced'?768:512;sunLight.shadow.mapSize.set(size,size);}sunLight.castShadow=tier==='high'&&!perf.mobile;}
    applyVisualQualityBudget(tier);
    perf.appliedTier=tier;document.body.dataset.renderTier=tier;document.body.dataset.renderGovernor=String(Math.round((perf.renderScale||1)*100));scheduleStableResize(80,true);
  }
  function samplePerformance(dt){
    if(paused||document.hidden){perf.frameAcc=0;perf.frameCount=0;perf.sampleMs=0;return;}
    perf.frameAcc+=dt;perf.frameCount++;perf.sampleMs+=dt;perf.simulationSampleAcc+=dt;perf.simulationFrames++;
    if(perf.simulationSampleAcc>=1.5){perf.simulationHz=perf.simulationFrames/Math.max(.001,perf.simulationSampleAcc);perf.simulationSampleAcc=0;perf.simulationFrames=0;}
    if(perf.sampleMs<(perf.mobile?2:3))return;
    perf.fps=perf.frameCount/Math.max(.001,perf.frameAcc);perf.frameAcc=0;perf.frameCount=0;perf.sampleMs=0;
    if(requestedQuality()!=='auto')return;
    const lowRecommendationFps=perf.mobile?34:28,lowProtectionFps=perf.mobile?31:26;
    const target=perf.mobile?45:60,protectFps=Math.max(lowProtectionFps,perf.mobile?36:48),severeFps=perf.mobile?20:24;
    const recommendation=perf.mobile?'balanced':perf.fps<lowRecommendationFps?'balanced':perf.fps>55?'high':'balanced';
    if(recommendation===perf.recommendation)perf.recommendationSamples++;else{perf.recommendation=recommendation;perf.recommendationSamples=1;}
    perf.lowSamples=perf.fps<protectFps?perf.lowSamples+1:Math.max(0,perf.lowSamples-1);
    perf.highSamples=perf.fps>=target*.96?perf.highSamples+1:Math.max(0,perf.highSamples-1);
    if(perf.lowSamples>=(perf.mobile?1:2)){
      // Proteção normal atua na resolução interna. LOW visual fica reservado para colapso real de desempenho.
      performanceGovernorProtect('fps-pressure',perf.fps<target*.7?1.5:1);perf.lowSamples=0;
      if(perf.fps<severeFps&&perf.renderScale<=perf.renderScaleMin+.01&&perf.sessionTier!=='low'){
        perf.sessionTier=perf.mobile?'low':perf.sessionTier==='high'?'balanced':'low';applyAdaptiveRenderSettings(true);lockStableSceneVisibility();
      }
    }else if(perf.highSamples>=7){
      if(perf.sessionTier==='low')perf.sessionTier='balanced';
      performanceGovernorRecover('fps-stable');perf.highSamples=0;lockStableSceneVisibility();
    }
    if(perf.recommendationSamples>=5&&recommendation!==state.settings.autoTier&&performance.now()-perf.lastRecommendationSaved>30000){
      perf.lastRecommendationSaved=performance.now();state.settings.autoTier=recommendation;saveState();
    }
  }
  function performanceDistanceRanges(){
    const tier=qualityTier(),mobile=perf.mobile;
    if(mobile){
      if(tier==='low')return{critical:52,npc:42,resource:54,enemy:50,crystal:58,animal:48};
      if(tier==='high')return{critical:104,npc:82,resource:98,enemy:92,crystal:104,animal:86};
      return{critical:74,npc:62,resource:76,enemy:70,crystal:82,animal:66};
    }
    if(tier==='low')return{critical:88,npc:68,resource:84,enemy:80,crystal:90,animal:74};
    if(tier==='high')return{critical:175,npc:130,resource:155,enemy:145,crystal:165,animal:135};
    return{critical:122,npc:96,resource:112,enemy:106,crystal:120,animal:100};
  }
  function updateCriticalSurfaceDistanceVisibility(){
    const range=performanceDistanceRanges().critical;let visible=0,hidden=0;
    for(const mesh of world.criticalSurfaces||[]){
      if(!mesh?.parent)continue;
      if(mesh.userData?.alwaysVisible===true||Number(mesh.renderOrder||0)>=900){mesh.visible=true;visible++;continue;}
      let radius=0;
      try{if(mesh.geometry&&!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();radius=Number(mesh.geometry?.boundingSphere?.radius||0);mesh.getWorldPosition(distanceCullPosition);mesh.getWorldScale(distanceCullScale);radius*=Math.max(Math.abs(distanceCullScale.x)||1,Math.abs(distanceCullScale.y)||1,Math.abs(distanceCullScale.z)||1);}catch{mesh.visible=true;visible++;continue;}
      const d=Math.hypot(player.x-distanceCullPosition.x,player.z-distanceCullPosition.z),show=!Number.isFinite(d)||!Number.isFinite(radius)||d<=range+Math.max(1,radius);
      mesh.visible=show;mesh.frustumCulled=false;mesh.userData.otthiDistanceCulled=!show;if(show)visible++;else hidden++;
    }
    perf.criticalVisible=visible;perf.criticalHidden=hidden;return{visible,hidden,range};
  }
  function updateDynamicEntityVisibility(){
    const ranges=performanceDistanceRanges(),distance=(x,z)=>Math.hypot(player.x-Number(x||0),player.z-Number(z||0));let visible=0,hidden=0;
    for(const npc of world.npcs||[]){if(!npc?.group)continue;if(npc.coopRaceBot&&!npc.coopRaceMode){npc.group.visible=false;hidden++;continue;}const keep=!!npc.passengerMode||!!npc.following||!!npc.coopRaceMode,insideOk=!npc.interiorOnlyHouseId||currentHouse?.id===npc.interiorOnlyHouseId,show=insideOk&&(keep||distance(npc.group.position.x,npc.group.position.z)<=ranges.npc);npc.group.visible=show;if(show)visible++;else hidden++;}
    for(const resource of world.resources||[]){const object=resource?.mesh;if(!object)continue;const show=!resource.collected&&distance(resource.x,resource.z)<=ranges.resource;object.visible=show;if(show)visible++;else hidden++;}
    for(const enemy of world.enemies||[]){if(!enemy?.group)continue;const show=!enemy.dead&&distance(enemy.group.position.x,enemy.group.position.z)<=ranges.enemy;enemy.group.visible=show;if(show)visible++;else hidden++;}
    for(const crystal of world.crystals||[]){const object=crystal?.mesh;if(!object)continue;const show=!crystal.got&&distance(crystal.x,crystal.z)<=ranges.crystal;object.visible=show;if(show)visible++;else hidden++;}
    for(const animal of world.animals||[]){const object=animal?.group||animal?.mesh;if(!object)continue;const x=animal.x??object.position?.x,z=animal.z??object.position?.z,show=animal.available!==false&&distance(x,z)<=ranges.animal;object.visible=show;if(show)visible++;else hidden++;}
    perf.dynamicVisible=visible;perf.dynamicHidden=hidden;return{visible,hidden,ranges};
  }
  function lockStableSceneVisibility(){
    updateCriticalSurfaceDistanceVisibility();updateDynamicEntityVisibility();
    updateManagedOutlineVisibility();
    const glowVisible=visualQualityProfile(qualityTier()).glows;for(const light of world.glows){if(light?.parent)light.visible=glowVisible;}
    if(world.clouds){const max=qualityTier()==='high'?8:qualityTier()==='balanced'?6:4;world.clouds.forEach((cloud,i)=>cloud.group.visible=i<max);}
  }

  function freezeWorldFrustumCulling(){
    if(!worldGroup)return;
    let enabled=0,bypassed=0,total=0;
    worldGroup.traverse(obj=>{
      if(!(obj.isMesh||obj.isLine||obj.isLineSegments||obj.isPoints||obj.isSprite))return;
      total++;
      if(obj.geometry&&!obj.geometry.boundingSphere){try{obj.geometry.computeBoundingSphere();}catch(_){}}
      const radius=Number(obj.geometry?.boundingSphere?.radius||0),critical=world.criticalSurfaces.includes(obj),overlay=obj.isSprite||Number(obj.renderOrder||0)>=900||obj.userData?.alwaysVisible===true;
      // Instâncias distribuídas pelo mundo não podem usar apenas a esfera da geometria-base no Three r128.
      // Superfícies críticas, overlays, lotes instanciados e objetos enormes permanecem protegidos.
      const keepAlwaysVisible=critical||overlay||obj.isInstancedMesh||radius>170;
      obj.frustumCulled=!keepAlwaysVisible;
      if(obj.frustumCulled)enabled++;else bypassed++;
    });
    worldGroup.frustumCulled=false;worldGroup.updateMatrixWorld(true);world.staticRenderObjects=total;perf.cullingEnabled=enabled;perf.cullingBypassed=bypassed;
  }
  function updateVisualLOD(){
    updateManagedVisualLODs(camera);
    updateManagedOutlineVisibility();
    updateCriticalSurfaceDistanceVisibility();
    updateDynamicEntityVisibility();
    if(typeof updateParkedVehicleVisibility==='function')updateParkedVehicleVisibility();
    const signRange=qualityTier()==='low'?30:qualityTier()==='high'?58:42;
    for(const sign of world.navigationSigns||[]){
      if(!sign?.group)continue;
      const range=sign.kind==='highway'?signRange+28:signRange;
      sign.group.visible=Math.hypot(player.x-sign.x,player.z-sign.z)<=range;
    }
  }

  let technicalPanel=null,technicalPanelVisible=false,technicalPanelTapCount=0,technicalPanelTapTimer=0;
  function pwaInstalled(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
  function activeVehicleCount(){return world.vehicles.filter(v=>v?.group?.visible!==false).length+world.buses.filter(v=>v?.group?.visible!==false).length+world.policeCars.filter(v=>v?.group?.visible!==false).length+world.fireTrucks.filter(v=>v?.group?.visible!==false).length+world.ambulances.filter(v=>v?.group?.visible!==false).length;}
  function runtimeDiagnostics(){
    const mode=auditPlayerMode('diagnostics'),render=renderer?.info?.render||{},memory=renderer?.info?.memory||{};
    return{version:APP_VERSION,running,paused,mode:mode.state,modeValid:mode.valid,modeConflicts:mode.conflicts,fps:+perf.fps.toFixed(1),frameMs:+(1000/Math.max(1,perf.fps)).toFixed(1),drawCalls:Number(render.calls||0),triangles:Number(render.triangles||0),geometries:Number(memory.geometries||0),textures:Number(memory.textures||0),npcs:world.npcs.length,vehicles:activeVehicleCount(),aiTicks:perf.aiTicks,trafficTicks:perf.trafficTicks,governor:performanceGovernorState(),culling:{enabled:perf.cullingEnabled,bypassed:perf.cullingBypassed,total:world.staticRenderObjects||0,criticalVisible:perf.criticalVisible,criticalHidden:perf.criticalHidden,dynamicVisible:perf.dynamicVisible,dynamicHidden:perf.dynamicHidden},visual:visualFoundationDiagnostics(),avatar:avatarFoundationDiagnostics(),pwaInstalled:pwaInstalled(),online:navigator.onLine,browser:navigator.userAgent,save:{version:state.version,lastSaved:Number(state.lastSaved||0),database:window.OTTHOS_DB?.name||'',schema:window.OTTHOS_DB?.schema||0},multiplayer:window.OTTHOS_RTDB?.status?.()||{configured:false,connected:false}};
  }
  function ensureTechnicalPanel(){
    if(technicalPanel)return technicalPanel;const style=document.createElement('style');style.id='otthosTechnicalPanelStyle';style.textContent='.otthos-tech-panel{position:fixed;z-index:100000;right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));width:min(330px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;padding:12px;border:1px solid rgba(116,220,255,.65);border-radius:14px;background:rgba(4,13,25,.94);color:#eaf8ff;font:700 12px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;box-shadow:0 16px 45px rgba(0,0,0,.45);backdrop-filter:blur(10px)}.otthos-tech-panel[hidden]{display:none!important}.otthos-tech-panel header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.otthos-tech-panel h2{font:900 14px/1.2 system-ui,sans-serif;margin:0}.otthos-tech-panel button{border:0;border-radius:8px;background:#dff7ff;color:#082032;padding:5px 9px;font-weight:900}.otthos-tech-panel pre{white-space:pre-wrap;word-break:break-word;margin:0;color:#c9edff}';document.head.appendChild(style);technicalPanel=document.createElement('aside');technicalPanel.className='otthos-tech-panel';technicalPanel.hidden=true;technicalPanel.setAttribute('aria-label','Painel técnico OTTHOS');technicalPanel.innerHTML='<header><h2>OTTHI • diagnóstico V702</h2><button type="button" data-tech-close>Fechar</button></header><pre data-tech-data></pre>';document.body.appendChild(technicalPanel);technicalPanel.querySelector('[data-tech-close]').onclick=()=>toggleTechnicalPanel(false);return technicalPanel;
  }
  function refreshTechnicalPanel(){if(!technicalPanelVisible)return;const panel=ensureTechnicalPanel(),d=runtimeDiagnostics(),mp=typeof multiplayerV2Diagnostics==='function'?multiplayerV2Diagnostics():null;panel.querySelector('[data-tech-data]').textContent=[`FPS: ${d.fps} • frame: ${d.frameMs} ms`,`Draw calls: ${d.drawCalls} • triângulos: ${d.triangles}`,`Geometrias: ${d.geometries} • texturas: ${d.textures}`,`Materiais cache: ${d.visual.materials.immutable} • acertos: ${d.visual.materials.hits}`,`LOD: ${d.visual.lod.registered} • perto: ${d.visual.lod.near} • longe: ${d.visual.lod.far}`,`Contornos: ${d.visual.outlines.visible} visíveis • ${d.visual.outlines.hidden} distantes`,`NPCs: ${d.npcs} • veículos ativos: ${d.vehicles}`,`IA: ${d.aiTicks} ticks • trânsito: ${d.trafficTicks} ticks`,`Culling: ${d.culling.enabled} ativo • ${d.culling.bypassed} protegido • superfícies ${d.culling.criticalVisible}/${d.culling.criticalHidden} • dinâmicos ${d.culling.dynamicVisible}/${d.culling.dynamicHidden}`,`Avatar: schema V${d.avatar.stateVersion} • fallback ${d.avatar.fallbackActive?'ativo':'inativo'}`,`Modo: ${d.mode}${d.modeValid?'':' • CONFLITO '+d.modeConflicts.join(', ')}`,`Qualidade: ${qualityTier()} • DPR: ${renderer?.getPixelRatio?.().toFixed?.(2)||0}`,`Governor: escala ${d.governor.renderScale} • pressão ${d.governor.pressure}% • RAF ${d.governor.rafHz} Hz • sim ${d.governor.simulationHz} Hz`,`PWA instalada: ${d.pwaInstalled?'sim':'não'} • online: ${d.online?'sim':'não'}`,`Save: schema ${d.save.schema||'n/d'} • V${d.save.version}`,`Multiplayer: ${d.multiplayer.connected?'conectado':d.multiplayer.configured?'configurado/offline':'não configurado'}`,mp?`MP Core V2: protocolo ${mp.protocol} • peers ${mp.motionPeers} • buffer ${mp.bufferAvg.toFixed(1)}/${mp.bufferMax}`:'MP Core V2: indisponível',mp?`Rede V2: snapshot ${mp.snapshotMs} ms • jitter ${mp.jitterMs} ms • extrapolações ${mp.extrapolated} • correções ${mp.corrections}`:'',mp?`Autoridade: ${mp.isAuthority?'este aparelho':mp.authority||'aguardando'} • esporte ${mp.sport||'nenhum'} • host ${mp.sportHost||'-'}`:'',mp?`Dados estimados V2: ↑ ${(mp.bytesUp/1024).toFixed(1)} KB • ↓ ${(mp.bytesDown/1024).toFixed(1)} KB • writes ${mp.writes}`:'',`Navegador: ${navigator.userAgent}`].filter(Boolean).join('\n');}
  function toggleTechnicalPanel(force){technicalPanelVisible=typeof force==='boolean'?force:!technicalPanelVisible;const panel=ensureTechnicalPanel();panel.hidden=!technicalPanelVisible;if(technicalPanelVisible)refreshTechnicalPanel();}
  function initTechnicalPanel(){
    window.addEventListener('keydown',event=>{if(event.code==='F3'){event.preventDefault();toggleTechnicalPanel();}});
    document.querySelector('.brand-card')?.addEventListener('pointerup',()=>{technicalPanelTapCount++;clearTimeout(technicalPanelTapTimer);technicalPanelTapTimer=setTimeout(()=>technicalPanelTapCount=0,1400);if(technicalPanelTapCount>=5){technicalPanelTapCount=0;toggleTechnicalPanel();}});
  }
