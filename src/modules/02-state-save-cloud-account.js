/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 02-state-save-cloud-account.js
 * Escopo: Estado, save local, IndexedDB, nuvem e conta
 * Linhas de origem V642: 143-396
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function normalizeState(saved = {}) {
    const fresh = defaultState();
    const savedVehicles=saved.vehicles||{},legacyVehicleSave=!Array.isArray(savedVehicles.owned),ownedVehicles=[...new Set([...fresh.vehicles.owned,...(Array.isArray(savedVehicles.owned)?savedVehicles.owned:[])].map(String).filter(Boolean))],garageState={...fresh.vehicles.garage,...(savedVehicles.garage||{}),slots:{...fresh.vehicles.garage.slots,...(savedVehicles.garage?.slots||{})},stored:{...fresh.vehicles.garage.stored,...(savedVehicles.garage?.stored||{})},purchasedAt:{...fresh.vehicles.garage.purchasedAt,...(savedVehicles.garage?.purchasedAt||{})}},parkedVehicles={...fresh.vehicles.parked,...(savedVehicles.parked||{})};
    if(legacyVehicleSave){parkedVehicles['garage-orange']={x:-30.5,z:43.2,heading:1.571};garageState.slots={'1':'garage-orange'};garageState.stored={};}
    const oldFriendship = saved.friendship || {};
    const friendship = { ...fresh.friendship, ...oldFriendship };
    if (oldFriendship.otto !== undefined && oldFriendship.nino === undefined) friendship.nino = oldFriendship.otto;
    delete friendship.otto;
    const flags = { ...(saved.flags || {}) };
    if (flags.talkedOtto && !flags.talkedNeighbor) flags.talkedNeighbor = true;
    const buildTombstones=normalizeBuildTombstones(saved.buildTombstones);
    const normalizedBuilds=applyBuildTombstones(saved.builds,buildTombstones);
    return {
      ...fresh,
      ...saved,
      version: APP_VERSION,
      profile: { ...fresh.profile, ...(saved.profile || {}) },
      needs: { ...fresh.needs, ...(saved.needs || {}) },
      inventory: { ...fresh.inventory, ...(saved.inventory || {}) },
      homeStorage: { ...fresh.homeStorage, ...(saved.homeStorage || {}) },
      houses: { ...fresh.houses, ...(saved.houses || {}) },
      friendship,
      flags,
      settings: { ...fresh.settings, ...(saved.settings || {}), quality: Number(saved.version||0)<615 && (saved.settings?.quality||'high')==='high' ? 'auto' : ((saved.settings?.quality)||fresh.settings.quality) },
      guardian: { ...fresh.guardian, ...(saved.guardian || {}), multiplayerEnabled:(saved.guardian?.multiplayerEnabled??fresh.guardian.multiplayerEnabled)!==false, communicationEnabled:(saved.guardian?.communicationEnabled??fresh.guardian.communicationEnabled)!==false, chatEnabled:(saved.guardian?.chatEnabled??fresh.guardian.chatEnabled)!==false },
      usage: { ...fresh.usage, ...(saved.usage || {}) },
      stats: { ...fresh.stats, ...(saved.stats || {}) },
      daily: { ...fresh.daily, ...(saved.daily || {}), quests:Array.isArray(saved.daily?.quests)?saved.daily.quests:[] },
      learning: { ...fresh.learning, ...(saved.learning || {}), subjectXP:{...fresh.learning.subjectXP,...(saved.learning?.subjectXP||{})}, lessons:{...fresh.learning.lessons,...(saved.learning?.lessons||{})}, matchHistory:Array.isArray(saved.learning?.matchHistory)?saved.learning.matchHistory:[] },
      digitalStudio: { ...fresh.digitalStudio, ...(saved.digitalStudio||{}), projects:Array.isArray(saved.digitalStudio?.projects)?saved.digitalStudio.projects.slice(-12):[], portfolio:Array.isArray(saved.digitalStudio?.portfolio)?saved.digitalStudio.portfolio.slice(-20):[] },
      multiplayer: { ...fresh.multiplayer, ...(saved.multiplayer || {}), room:normalizeRoomId(saved.multiplayer?.room || fresh.multiplayer.room) },
      fishing: { ...fresh.fishing, ...(saved.fishing || {}), catches:Array.isArray(saved.fishing?.catches)?saved.fishing.catches:[], species:{...fresh.fishing.species,...(saved.fishing?.species||{})}, cooperativeRewards:Array.isArray(saved.fishing?.cooperativeRewards)?saved.fishing.cooperativeRewards:[] },
      farming: { ...fresh.farming, ...(saved.farming || {}), plots:{...fresh.farming.plots,...(saved.farming?.plots||{})}, digSites:{...fresh.farming.digSites,...(saved.farming?.digSites||{})} },
      campfires: Array.isArray(saved.campfires) ? saved.campfires : [],
      boats: { ...fresh.boats, ...(saved.boats || {}), lastPosition:{...fresh.boats.lastPosition,...(saved.boats?.lastPosition||{})} },
      hunting: { ...fresh.hunting, ...(saved.hunting || {}), cooperativeRewards:Array.isArray(saved.hunting?.cooperativeRewards)?saved.hunting.cooperativeRewards:[] },
      houseExtensions: Array.isArray(saved.houseExtensions) ? saved.houseExtensions : [],
      roomFurniture: Array.isArray(saved.roomFurniture) ? saved.roomFurniture : [],
      multiplayerRequests: { ...fresh.multiplayerRequests, ...(saved.multiplayerRequests || {}), completed:Array.isArray(saved.multiplayerRequests?.completed)?saved.multiplayerRequests.completed:[] },
      cooperative: { ...fresh.cooperative, ...(saved.cooperative || {}), active:saved.cooperative?.active&&typeof saved.cooperative.active==='object'?{...saved.cooperative.active}:null, completed:Array.isArray(saved.cooperative?.completed)?saved.cooperative.completed:[], history:Array.isArray(saved.cooperative?.history)?saved.cooperative.history:[] },
      npcSociety: { ...fresh.npcSociety, ...(saved.npcSociety || {}), houses:{...fresh.npcSociety.houses,...(saved.npcSociety?.houses||{})}, friendships:{...fresh.npcSociety.friendships,...(saved.npcSociety?.friendships||{})}, moods:{...fresh.npcSociety.moods,...(saved.npcSociety?.moods||{})} },
      avatar: normalizeAvatarV2({ ...fresh.avatar, ...(saved.avatar || {}) }),
      career: { ...fresh.career, ...(saved.career || {}), completedMissionTokens:Array.isArray(saved.career?.completedMissionTokens)?saved.career.completedMissionTokens:[], activeJob:saved.career?.activeJob?{...saved.career.activeJob,instanceId:saved.career.activeJob.instanceId||`legacy-${saved.career.activeJob.id||'job'}-${Number(saved.career.activeJob.startedAt||saved.lastSaved||Date.now())}`,missionState:saved.career.activeJob.missionState||'TRAVELLING',rewardClaimed:!!saved.career.activeJob.rewardClaimed,previousUniform:saved.career.activeJob.previousUniform||'none',previousPackage:Number(saved.career.activeJob.previousPackage||0)}:null },
      social: { ...fresh.social, ...(saved.social || {}) },
      abilities: { ...fresh.abilities, ...(saved.abilities || {}), mastery:{...fresh.abilities.mastery,...(saved.abilities?.mastery||{})} },
      tools: { ...fresh.tools, ...(saved.tools || {}), owned:Array.isArray(saved.tools?.owned)?saved.tools.owned:fresh.tools.owned, harvested:{...fresh.tools.harvested,...(saved.tools?.harvested||{})} },
      account: { ...fresh.account, ...(saved.account || {}) },
      gm: { ...fresh.gm, ...(saved.gm || {}), appliedGrantIds:[...new Set((Array.isArray(saved.gm?.appliedGrantIds)?saved.gm.appliedGrantIds:[]).map(String).filter(Boolean))].slice(-500), lastGrantAt:Math.max(0,Number(saved.gm?.lastGrantAt||0)) },
      safety: { ...fresh.safety, ...(saved.safety || {}) },
      cityServices: { ...fresh.cityServices, ...(saved.cityServices || {}) },
      transport: { ...fresh.transport, ...(saved.transport || {}), metroDestinations:Array.isArray(saved.transport?.metroDestinations)?saved.transport.metroDestinations:[], busStops:Array.isArray(saved.transport?.busStops)?saved.transport.busStops:[] },
      vehicles: { ...fresh.vehicles, ...savedVehicles, lastUsedId:String(savedVehicles.lastUsedId||fresh.vehicles.lastUsedId), owned:ownedVehicles, primaryId:ownedVehicles.includes(savedVehicles.primaryId)?savedVehicles.primaryId:fresh.vehicles.primaryId, parked:parkedVehicles, modularParts:{...fresh.vehicles.modularParts,...(savedVehicles.modularParts||{})}, partDurability:{...fresh.vehicles.partDurability,...(savedVehicles.partDurability||{})}, broken:{...fresh.vehicles.broken,...(savedVehicles.broken||{})}, damageHistory:Array.isArray(savedVehicles.damageHistory)?savedVehicles.damageHistory.slice(-40):[], garage:garageState },
      worldLayout: { ...fresh.worldLayout, ...(saved.worldLayout || {}) },
      ottovias: { ...fresh.ottovias, ...(saved.ottovias || {}), tour:{...fresh.ottovias.tour,...(saved.ottovias?.tour||{})}, communication:{...fresh.ottovias.communication,...(saved.ottovias?.communication||{})}, news:Array.isArray(saved.ottovias?.news)?saved.ottovias.news.slice(0,16):[] },
      objectives: { ...fresh.objectives, ...(saved.objectives || {}), history:Array.isArray(saved.objectives?.history)?saved.objectives.history:[] },
      adventures: { ...fresh.adventures, ...(saved.adventures || {}), active:saved.adventures?.active&&typeof saved.adventures.active==='object'?{...saved.adventures.active,progress:Array.isArray(saved.adventures.active.progress)?saved.adventures.active.progress:[]}:null, completed:Array.isArray(saved.adventures?.completed)?saved.adventures.completed:[], bestTimes:{...fresh.adventures.bestTimes,...(saved.adventures?.bestTimes||{})} },
      races: { ...fresh.races, ...(saved.races || {}) },
      ui: { ...fresh.ui, ...(saved.ui || {}) },
      builds: normalizedBuilds,
      buildTombstones,
      medals: Array.isArray(saved.medals) ? saved.medals : [],
      completedChapters: Array.isArray(saved.completedChapters) ? saved.completedChapters : []
    };
  }

  function loadState() {
    const fresh = defaultState();
    try {
      let raw = safeLocalGet(STORAGE_KEY);
      if (!raw) {
        for (const key of LEGACY_STORAGE_KEYS) {
          raw = safeLocalGet(key);
          if (raw) break;
        }
      }
      if (!raw) return fresh;
      const saved = JSON.parse(raw);
      return normalizeState(saved);
    } catch (error) {
      console.warn('Falha ao ler progresso; usando estado novo.', error);
      return fresh;
    }
  }

  let state = loadState();
  if(state.career?.activeJob){const legacyJob=state.career.activeJob;legacyJob.instanceId=legacyJob.instanceId||`legacy-${legacyJob.id||'job'}-${Number(legacyJob.startedAt||Date.now())}`;legacyJob.missionState=legacyJob.missionState||'TRAVELLING';legacyJob.rewardClaimed=!!legacyJob.rewardClaimed;legacyJob.previousUniform=legacyJob.previousUniform||'none';legacyJob.previousPackage=Number(legacyJob.previousPackage||0);}
  let accountSession = window.OTTHOS_ACCOUNT?.getSession?.() || null;
  if(accountSession){
    state.account={...(state.account||{}),linked:true,accountId:accountSession.accountId,username:accountSession.username||state.account?.username||''};
  }
  if(!state.profile.nameConfirmed){
    const legacyName=String(state.profile.name||'').trim();
    if(legacyName&&legacyName.toLowerCase()!=='otthos'){state.profile.name=legacyName;state.profile.nameConfirmed=true;}
    else{state.profile.name='';state.profile.nameConfirmed=false;}
  }
  state.multiplayer.displayName=state.profile.name||'';state.multiplayer.room=normalizeRoomId(state.multiplayer.room);
  let dbReady = Promise.resolve();
  if (window.OTTHOS_DB) {
    dbReady = window.OTTHOS_DB.load().then(saved => {
      if (saved && saved.profile) {
        state = normalizeState(saved);
        if(accountSession)state.account={...(state.account||{}),linked:true,accountId:accountSession.accountId,username:accountSession.username||state.account?.username||''};
        safeLocalSet(STORAGE_KEY, JSON.stringify(state));
      } else {
        window.OTTHOS_DB.save(state).catch(console.warn);
      }
      ensureDailyChallenges();updateLobbyStats();
      updateHUD();updateDailyBadge();
      return state;
    }).catch(error => { console.warn('IndexedDB indisponível; usando armazenamento local.', error); return state; });
    window.OTTHOS_DB.requestPersistentStorage().catch(() => false);
  }
  let saveTimer = 0;
  let lastSavePromise = Promise.resolve(true);
  function commitState() {
    if(window.__OTTHI_DEV_NO_SAVE__===true)return Promise.resolve(true);
    state.version = APP_VERSION;
    state.lastSaved = Date.now();
    state.buildTombstones=normalizeBuildTombstones(state.buildTombstones);
    state.builds=applyBuildTombstones(state.builds,state.buildTombstones);
    const snapshot = JSON.parse(JSON.stringify(state));
    safeLocalSet(STORAGE_KEY, JSON.stringify(snapshot));
    lastSavePromise = window.OTTHOS_DB
      ? lastSavePromise.catch(()=>true).then(()=>window.OTTHOS_DB.save(snapshot)).catch(error => {
          console.warn('Falha no IndexedDB; cópia local mantida.', error);
          return false;
        })
      : Promise.resolve(true);
    ensureDailyChallenges();updateLobbyStats();updateDailyBadge();
    lastSavePromise.finally(()=>{syncCloudProgress(false);syncGameAccount(false);});
    return lastSavePromise;
  }
  function saveState(immediate = false) {
    if(window.__OTTHI_DEV_NO_SAVE__===true){clearTimeout(saveTimer);return Promise.resolve(true);}
    state.lastSaved = Date.now();
    clearTimeout(saveTimer);
    if (immediate) return commitState();
    saveTimer = setTimeout(commitState, 140);
    return lastSavePromise;
  }

  function cloudProgressPayload(){
    return {
      version: APP_VERSION,lastSaved:Number(state.lastSaved||Date.now()),
      profile:{name:state.profile.name||'Jogador',coins:state.profile.coins||0,xp:state.profile.xp||0,level:state.profile.level||1,reputation:state.profile.reputation||0},
      inventory:{...state.inventory},gm:{appliedGrantIds:[...new Set((state.gm?.appliedGrantIds||[]).map(String).filter(Boolean))].slice(-500),lastGrantAt:Math.max(0,Number(state.gm?.lastGrantAt||0))},medals:[...(state.medals||[])],flags:{...state.flags},houses:{...state.houses},races:{...state.races},
      avatar:{...state.avatar},abilities:{...state.abilities,mastery:{...(state.abilities?.mastery||{})}},tools:{...state.tools,owned:[...(state.tools?.owned||[])],harvested:{...(state.tools?.harvested||{})}},safety:{...state.safety},cityServices:{...state.cityServices},career:{...state.career,activeJob:state.career?.activeJob?{...state.career.activeJob}:null},cooperative:{...state.cooperative,active:state.cooperative?.active?{...state.cooperative.active}:null,completed:[...(state.cooperative?.completed||[])],history:[...(state.cooperative?.history||[])]},friendship:{...state.friendship},completedChapters:[...(state.completedChapters||[])],builds:[...(state.builds||[])],buildTombstones:[...(state.buildTombstones||[])],homeStorage:{...state.homeStorage},fishing:{...state.fishing,catches:[...(state.fishing?.catches||[])],species:{...(state.fishing?.species||{})}},farming:{...state.farming,plots:{...(state.farming?.plots||{})},digSites:{...(state.farming?.digSites||{})}},campfires:[...(state.campfires||[])],boats:{...state.boats,lastPosition:{...(state.boats?.lastPosition||{})}},transport:{...state.transport,metroDestinations:[...(state.transport?.metroDestinations||[])],busStops:[...(state.transport?.busStops||[])]},vehicles:{...state.vehicles,owned:[...(state.vehicles?.owned||[])],parked:{...(state.vehicles?.parked||{})},modularParts:{...(state.vehicles?.modularParts||{})},partDurability:{...(state.vehicles?.partDurability||{})},broken:{...(state.vehicles?.broken||{})},damageHistory:[...(state.vehicles?.damageHistory||[])].slice(-40),garage:{...(state.vehicles?.garage||{}),slots:{...(state.vehicles?.garage?.slots||{})},stored:{...(state.vehicles?.garage?.stored||{})},purchasedAt:{...(state.vehicles?.garage?.purchasedAt||{})}}},worldLayout:{...(state.worldLayout||{})},ottovias:{...(state.ottovias||{}),tour:{...(state.ottovias?.tour||{})},communication:{...(state.ottovias?.communication||{})},news:[...(state.ottovias?.news||[])].slice(0,16)},objectives:{...state.objectives,history:[...(state.objectives?.history||[])]},adventures:{...state.adventures,completed:[...(state.adventures?.completed||[])],bestTimes:{...(state.adventures?.bestTimes||{})}},hunting:{...state.hunting},houseExtensions:[...(state.houseExtensions||[])],roomFurniture:[...(state.roomFurniture||[])],digitalStudio:{...state.digitalStudio,projects:[...(state.digitalStudio?.projects||[])].slice(-12),portfolio:[...(state.digitalStudio?.portfolio||[])].slice(-20)},
      achievements:{stats:{...state.stats},daily:{...state.daily,quests:[...(state.daily?.quests||[])]},learning:{...state.learning,subjectXP:{...state.learning.subjectXP},lessons:{...state.learning.lessons}}},position:{...state.position}
    };
  }
  function syncCloudProgress(force=false){
    if(window.__OTTHI_DEV_NO_SAVE__===true)return false;
    if(!hasValidPlayerName())return false;
    return window.OTTHOS_RTDB?.syncProgress?.(cloudProgressPayload(),force)||false;
  }
  function mergeCloudProgress(remote){
    if(!remote||typeof remote!=='object')return false;
    const remoteSaved=Number(remote.lastSaved||0),localSaved=Number(state.lastSaved||0);
    if(remoteSaved<=localSaved+2500){syncCloudProgress(true);return false;}
    const mergedBuildTombstones=mergeBuildTombstones(state.buildTombstones,remote.buildTombstones);
    const mergedBuilds=mergeBuildCollections(state.builds,remote.builds,mergedBuildTombstones);
    const mergedExtensions=mergeEntityCollections(state.houseExtensions,remote.houseExtensions);
    const mergedFurniture=mergeEntityCollections(state.roomFurniture,remote.roomFurniture);
    const merged={...state,
      profile:{...state.profile,...(remote.profile||{}),name:state.profile.name||remote.profile?.name||'Jogador',nameConfirmed:true},
      inventory:{...state.inventory,...(remote.inventory||{})},gm:{...state.gm,...(remote.gm||{}),appliedGrantIds:[...new Set([...(state.gm?.appliedGrantIds||[]),...(remote.gm?.appliedGrantIds||[])].map(String).filter(Boolean))].slice(-500),lastGrantAt:Math.max(Number(state.gm?.lastGrantAt||0),Number(remote.gm?.lastGrantAt||0))},medals:Array.isArray(remote.medals)?remote.medals:state.medals,
      flags:{...state.flags,...(remote.flags||{})},houses:{...state.houses,...(remote.houses||{})},races:{...state.races,...(remote.races||{})},
      avatar:normalizeAvatarV2({...state.avatar,...(remote.avatar||{})}),abilities:{...state.abilities,...(remote.abilities||{}),mastery:{...state.abilities.mastery,...(remote.abilities?.mastery||{})}},tools:{...state.tools,...(remote.tools||{}),owned:Array.isArray(remote.tools?.owned)?remote.tools.owned:state.tools.owned,harvested:{...state.tools.harvested,...(remote.tools?.harvested||{})}},safety:{...state.safety,...(remote.safety||{})},cityServices:{...state.cityServices,...(remote.cityServices||{})},career:{...state.career,...(remote.career||{}),activeJob:remote.career?.activeJob?{...remote.career.activeJob}:state.career.activeJob},cooperative:{...state.cooperative,...(remote.cooperative||{}),active:remote.cooperative?.active?{...remote.cooperative.active}:state.cooperative.active,completed:Array.isArray(remote.cooperative?.completed)?remote.cooperative.completed:state.cooperative.completed,history:Array.isArray(remote.cooperative?.history)?remote.cooperative.history:state.cooperative.history},friendship:{...state.friendship,...(remote.friendship||{})},completedChapters:Array.isArray(remote.completedChapters)?remote.completedChapters:state.completedChapters,
      builds:mergedBuilds,buildTombstones:mergedBuildTombstones,homeStorage:{...state.homeStorage,...(remote.homeStorage||{})},fishing:{...state.fishing,...(remote.fishing||{}),catches:Array.isArray(remote.fishing?.catches)?remote.fishing.catches:state.fishing.catches,species:{...state.fishing.species,...(remote.fishing?.species||{})}},farming:{...state.farming,...(remote.farming||{}),plots:{...state.farming.plots,...(remote.farming?.plots||{})},digSites:{...state.farming.digSites,...(remote.farming?.digSites||{})}},campfires:Array.isArray(remote.campfires)?remote.campfires:state.campfires,boats:{...state.boats,...(remote.boats||{}),lastPosition:{...state.boats.lastPosition,...(remote.boats?.lastPosition||{})}},transport:{...state.transport,...(remote.transport||{}),metroDestinations:Array.isArray(remote.transport?.metroDestinations)?remote.transport.metroDestinations:state.transport.metroDestinations,busStops:Array.isArray(remote.transport?.busStops)?remote.transport.busStops:state.transport.busStops},vehicles:{...state.vehicles,...(remote.vehicles||{}),owned:[...new Set([...(state.vehicles?.owned||[]),...(Array.isArray(remote.vehicles?.owned)?remote.vehicles.owned:[])])],parked:{...state.vehicles.parked,...(remote.vehicles?.parked||{})},modularParts:{...(state.vehicles?.modularParts||{}),...(remote.vehicles?.modularParts||{})},partDurability:{...(state.vehicles?.partDurability||{}),...(remote.vehicles?.partDurability||{})},broken:{...(state.vehicles?.broken||{}),...(remote.vehicles?.broken||{})},damageHistory:Array.isArray(remote.vehicles?.damageHistory)?remote.vehicles.damageHistory.slice(-40):(state.vehicles?.damageHistory||[]).slice(-40),garage:{...(state.vehicles?.garage||{}),...(remote.vehicles?.garage||{}),slots:{...(state.vehicles?.garage?.slots||{}),...(remote.vehicles?.garage?.slots||{})},stored:{...(state.vehicles?.garage?.stored||{}),...(remote.vehicles?.garage?.stored||{})},purchasedAt:{...(state.vehicles?.garage?.purchasedAt||{}),...(remote.vehicles?.garage?.purchasedAt||{})}}},worldLayout:{...(state.worldLayout||{}),...(remote.worldLayout||{})},ottovias:{...(state.ottovias||{}),...(remote.ottovias||{}),tour:{...(state.ottovias?.tour||{}),...(remote.ottovias?.tour||{})},communication:{...(state.ottovias?.communication||{}),...(remote.ottovias?.communication||{})},news:Array.isArray(remote.ottovias?.news)?remote.ottovias.news.slice(0,16):(state.ottovias?.news||[]).slice(0,16)},objectives:{...state.objectives,...(remote.objectives||{}),history:Array.isArray(remote.objectives?.history)?remote.objectives.history:state.objectives.history},adventures:{...state.adventures,...(remote.adventures||{}),completed:Array.isArray(remote.adventures?.completed)?remote.adventures.completed:state.adventures.completed,bestTimes:{...state.adventures.bestTimes,...(remote.adventures?.bestTimes||{})}},hunting:{...state.hunting,...(remote.hunting||{})},houseExtensions:mergedExtensions,roomFurniture:mergedFurniture,digitalStudio:{...state.digitalStudio,...(remote.digitalStudio||{}),projects:Array.isArray(remote.digitalStudio?.projects)?remote.digitalStudio.projects.slice(-12):(state.digitalStudio?.projects||[]).slice(-12),portfolio:Array.isArray(remote.digitalStudio?.portfolio)?remote.digitalStudio.portfolio.slice(-20):(state.digitalStudio?.portfolio||[]).slice(-20)},
      stats:{...state.stats,...(remote.achievements?.stats||{})},daily:{...state.daily,...(remote.achievements?.daily||{})},learning:{...state.learning,...(remote.achievements?.learning||{}),subjectXP:{...state.learning.subjectXP,...(remote.achievements?.learning?.subjectXP||{})},lessons:{...state.learning.lessons,...(remote.achievements?.learning?.lessons||{})}},
      position:{...state.position,...(remote.position||{})},lastSaved:remoteSaved,version: APP_VERSION
    };
    state=normalizeState(merged);state.profile.nameConfirmed=true;state.multiplayer.room=normalizeRoomId(state.multiplayer.room);
    safeLocalSet(STORAGE_KEY,JSON.stringify(state));window.OTTHOS_DB?.save?.(state).catch(()=>{});if(worldGroup&&world?.builds)reconcileWorldBuilds();updatePlayerNameUI();updateHUD();updateLobbyStats();toast('Progresso recuperado do Firebase sem apagar construções locais.','good',2300);return true;
  }

  let accountSaveTimer=0,accountSyncing=false;
  function accountLinked(){return!!(accountSession&&state.account?.linked&&state.account.accountId===accountSession.accountId);}
  function accountPromptWasHandled(){return Object.entries(state.flags||{}).some(([key,value])=>/^accountPromptedV\d+$/.test(key)&&value===true);}
  function accountStatusText(){return accountLinked()?`Conta: ${state.account.username||accountSession.username}`:state.account?.linked?'Entrar novamente':'Conta local';}
  async function waitForAccountBackend(timeout=6500){
    if(window.OTTHOS_RTDB)return window.OTTHOS_RTDB;
    return new Promise(resolve=>{
      let done=false;
      const finish=value=>{if(done)return;done=true;clearTimeout(timer);window.removeEventListener('otthos:rtdb-ready',ready);resolve(value);};
      const ready=()=>finish(window.OTTHOS_RTDB||null),timer=setTimeout(()=>finish(window.OTTHOS_RTDB||null),timeout);
      window.addEventListener('otthos:rtdb-ready',ready,{once:true});
    });
  }
  async function ensureAccountConnection(){
    const backend=await waitForAccountBackend();
    if(!backend?.configured)return{ok:false,error:'A nuvem do jogo ainda não está configurada.'};
    if(backend.connected?.())return{ok:true,backend};
    const ok=await backend.connect?.({name:publicPlayerName()});
    return ok?{ok:true,backend}:{ok:false,error:'Sem conexão. O progresso local continua protegido neste aparelho.'};
  }
  function syncGameAccount(force=false){
    if(window.__OTTHI_DEV_NO_SAVE__===true){clearTimeout(accountSaveTimer);return false;}
    clearTimeout(accountSaveTimer);
    if(!accountLinked()||accountSyncing)return false;
    const run=async()=>{
      if(!accountLinked()||accountSyncing)return false;
      const connection=await ensureAccountConnection();if(!connection.ok)return false;
      const cloudAccount=connection.backend.accountStatus?.();
      if(!cloudAccount||cloudAccount.anonymous||cloudAccount.username!==accountSession.username)return false;
      accountSyncing=true;
      try{
        const snapshot=JSON.parse(JSON.stringify(state));
        snapshot.account={...snapshot.account,linked:true,accountId:accountSession.accountId,username:accountSession.username};
        const encrypted=await window.OTTHOS_ACCOUNT.encryptState(snapshot,accountSession);
        const result=await connection.backend.saveGameAccount(accountSession.accountId,encrypted);
        if(result?.ok)state.account.lastCloudSync=Date.now();
        return!!result?.ok;
      }catch(error){console.warn('Conta do jogo:',error);return false}
      finally{accountSyncing=false}
    };
    if(force)return run();
    accountSaveTimer=setTimeout(run,2400);return true;
  }
  async function createGameAccount(displayName,username,password){
    if(!window.OTTHOS_ACCOUNT)throw new Error('Proteção de conta indisponível neste navegador.');
    const cleanName=sanitizePlayerName(displayName);if(cleanName.length<3)throw new Error('Escolha um nome de jogador com pelo menos 3 caracteres.');
    const credentials=await window.OTTHOS_ACCOUNT.deriveCredentials(username,password),connection=await ensureAccountConnection();
    if(!connection.ok)throw new Error(connection.error);
    const authResult=await connection.backend.createPlayerAccount?.(credentials.username,password,cleanName);
    if(!authResult?.ok)throw new Error(authResult?.error||'Não foi possível criar a conta protegida.');
    applyPlayerName(cleanName);accountSession=window.OTTHOS_ACCOUNT.rememberSession(credentials);
    state.account={linked:true,accountId:credentials.accountId,username:credentials.username,lastCloudSync:0};
    await commitState();const saved=await syncGameAccount(true);if(!saved)throw new Error('A conta foi criada, mas a primeira cópia online não terminou. Tente sincronizar novamente.');
    updatePlayerNameUI();return true;
  }
  async function loginGameAccount(username,password){
    if(!window.OTTHOS_ACCOUNT)throw new Error('Proteção de conta indisponível neste navegador.');
    window.__OTTHI_ACCOUNT_RECOVERING=true;
    window.dispatchEvent(new CustomEvent('otthi:account-state-loading'));
    try{
      const credentials=await window.OTTHOS_ACCOUNT.deriveCredentials(username,password),connection=await ensureAccountConnection();
      if(!connection.ok)throw new Error(connection.error);
      const authResult=await connection.backend.signInPlayerAccount?.(credentials.username,password,state.profile.name||credentials.username);
      if(!authResult?.ok)throw new Error(authResult?.error||'Nome ou senha incorretos.');
      const result=await connection.backend.loadGameAccount(credentials.accountId);
      if(!result?.ok)throw new Error(result?.error||'Não foi possível consultar a conta.');
      if(!result.exists)throw new Error('A conta existe, mas ainda não possui uma cópia de progresso. Entre no aparelho onde ela foi criada e toque em “Sincronizar agora”.');
      const recovered=await window.OTTHOS_ACCOUNT.decryptState(result.record,credentials);
      accountSession=window.OTTHOS_ACCOUNT.rememberSession(credentials);
      state=normalizeState(recovered);state.account={...(state.account||{}),linked:true,accountId:credentials.accountId,username:credentials.username,lastCloudSync:Date.now()};
      state.profile.nameConfirmed=!!sanitizePlayerName(state.profile.name);
      safeLocalSet(STORAGE_KEY,JSON.stringify(state));await window.OTTHOS_DB?.save?.(state);window.OTTHOS_RTDB?.setDisplayName?.(publicPlayerName());
      updatePlayerNameUI();updateHUD();updateLobbyStats();return true;
    }finally{
      window.__OTTHI_ACCOUNT_RECOVERING=false;
      window.dispatchEvent(new CustomEvent('otthi:account-state-ready'));
    }
  }
  async function unlinkGameAccount(password=''){
    const result=await window.OTTHOS_RTDB?.signOutPlayerAccount?.(password);if(!result?.ok)return result||{ok:false,error:'Não foi possível confirmar a saída.'};
    window.OTTHOS_ACCOUNT?.clearSession?.();accountSession=null;state.account={linked:false,accountId:'',username:'',lastCloudSync:0};saveState(true);updatePlayerNameUI();
    return{ok:true};
  }
  function openAccountForm(mode='create',required=false,onReady=null){
    const creating=mode==='create';
    openModal(creating?'Criar conta do jogo':'Entrar na conta',`<div class="account-form"><div class="account-shield">🔐</div><p>${creating?'Um responsável pode ajudar. A senha não é gravada; ela protege o progresso antes de enviá-lo.':'Use o mesmo usuário e senha cadastrados no outro aparelho.'}</p>${creating?'<label class="field"><span>Nome que aparece no jogo</span><input data-account-display maxlength="18" autocomplete="nickname" value="'+escapeHtml(state.profile.name||'')+'" placeholder="Ex.: Luna"></label>':''}<label class="field"><span>Usuário da conta</span><input data-account-user maxlength="20" autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="Ex.: luna_azul"></label><label class="field"><span>Senha</span><input data-account-password type="password" maxlength="64" autocomplete="${creating?'new-password':'current-password'}" placeholder="Mínimo de 6 caracteres"></label>${creating?'<label class="field"><span>Repita a senha</span><input data-account-confirm type="password" maxlength="64" autocomplete="new-password"></label>':''}<p class="account-error" data-account-error hidden></p><button class="btn primary xl" data-account-submit>${creating?'Criar e proteger progresso':'Entrar e recuperar progresso'}</button><button class="btn" data-account-back>Voltar</button></div>`,root=>{
      const submit=$('[data-account-submit]',root),error=$('[data-account-error]',root),user=$('[data-account-user]',root),password=$('[data-account-password]',root);
      const showError=message=>{error.textContent=message;error.hidden=false;submit.disabled=false;submit.textContent=creating?'Criar e proteger progresso':'Entrar e recuperar progresso';};
      submit.onclick=async()=>{error.hidden=true;const pass=password.value;if(creating&&pass!==$('[data-account-confirm]',root).value){showError('As duas senhas precisam ser iguais.');return;}submit.disabled=true;submit.textContent=creating?'Criando conta...':'Recuperando...';try{if(creating)await createGameAccount($('[data-account-display]',root).value,user.value,pass);else await loginGameAccount(user.value,pass);closeModal();toast(creating?'Conta criada e progresso protegido.':'Progresso recuperado com sucesso.','good',2600);if(typeof onReady==='function')onReady();else if(!creating)setTimeout(()=>location.reload(),550);}catch(e){showError(e.message||'Não foi possível concluir.');}};
      $('[data-account-back]',root).onclick=()=>openAccountCenter(required,onReady);setTimeout(()=>user.focus(),80);
    });
  }
  function openAccountCenter(required=false,onReady=null){
    const linked=accountLinked(),last=Number(state.account?.lastCloudSync||0),lastText=last?new Date(last).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'aguardando primeira cópia';
    openModal(linked?'Minha conta':'Proteja seu progresso',linked?`<div class="account-card linked"><span>✓</span><div><b>${escapeHtml(state.account.username||accountSession.username)}</b><small>Progresso criptografado • última cópia ${lastText}</small></div></div><div class="modal-actions"><button class="btn primary" data-account-sync>Sincronizar agora</button><button class="btn" data-account-logout>Sair da conta neste aparelho</button></div>`:`<div class="account-intro"><span>☁️</span><h3>Continue em qualquer celular</h3><p>Crie uma conta do jogo ou entre com a combinação cadastrada. Não informe telefone, endereço, escola ou nome completo.</p></div><div class="choice-grid"><button class="choice" data-account-create><b>🔐 Criar conta</b><span>Protege o progresso atual</span></button><button class="choice" data-account-login><b>🔑 Entrar</b><span>Recupera conquistas antigas</span></button>${required?'<button class="choice muted" data-account-offline><b>📱 Jogar neste aparelho</b><span>O progresso continuará salvo localmente</span></button>':''}</div>`,root=>{
      $('[data-account-create]',root)?.addEventListener('click',()=>openAccountForm('create',required,onReady));$('[data-account-login]',root)?.addEventListener('click',()=>openAccountForm('login',required,onReady));
      $('[data-account-sync]',root)?.addEventListener('click',async e=>{e.currentTarget.disabled=true;e.currentTarget.textContent='Sincronizando...';const ok=await syncGameAccount(true);closeModal();toast(ok?'Progresso sincronizado.':'Sem conexão agora; a cópia local foi preservada.',ok?'good':'warn',2400);});
      $('[data-account-logout]',root)?.addEventListener('click',()=>openAccountLogoutGate(required,onReady));
      $('[data-account-offline]',root)?.addEventListener('click',()=>openPlayerNameModal(true,()=>{state.flags.accountPromptedV635=true;saveState(true);if(typeof onReady==='function')onReady();}));
    });
  }
  function openAccountLogoutGate(required=false,onReady=null){
    openModal('Confirme a saída',`<div class="account-form"><div class="account-shield">🛡️</div><p>A senha do responsável é obrigatória para impedir que os controles de segurança sejam burlados.</p><label class="field"><span>Senha atual</span><input data-account-logout-password type="password" maxlength="64" autocomplete="current-password"></label><p class="account-error" data-account-logout-error hidden></p><button class="btn primary xl" data-account-logout-confirm>Sair desta conta</button><button class="btn" data-account-logout-back>Cancelar</button></div>`,root=>{
      const input=$('[data-account-logout-password]',root),error=$('[data-account-logout-error]',root),button=$('[data-account-logout-confirm]',root);
      const submit=async()=>{error.hidden=true;button.disabled=true;button.textContent='Confirmando...';const result=await unlinkGameAccount(input.value);if(!result?.ok){error.textContent=result?.error||'Senha incorreta.';error.hidden=false;button.disabled=false;button.textContent='Sair desta conta';input.select();return;}closeModal();toast('Conta desconectada. As restrições de segurança foram preservadas.','good',2800);};
      button.onclick=submit;$('[data-account-logout-back]',root).onclick=()=>openAccountCenter(required,onReady);input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submit();}};setTimeout(()=>input.focus(),80);
    });
  }
