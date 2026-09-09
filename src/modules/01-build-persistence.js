/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 01-build-persistence.js
 * Escopo: Normalização, merge, tombstones e persistência das construções
 * Linhas de origem V642: 27-142
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function stableBuildId(item={},index=0){
    const source=[String(item.type||'build'),Number(item.x||0).toFixed(2),Number(item.z||0).toFixed(2),Number(item.rotation||0).toFixed(3),Number(item.createdAt||0),String(item.ownerId||'local')].join('|');
    let hash=2166136261;
    for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return `build-${(hash>>>0).toString(36)}`;
  }
  function normalizeBuildRecord(item,index=0){
    if(!item||typeof item!=='object')return null;
    const type=String(item.type||'').trim(),x=Number(item.x),z=Number(item.z),rotation=Number(item.rotation||0);
    if(!type||!Number.isFinite(x)||!Number.isFinite(z))return null;
    const createdAt=Math.max(0,Number(item.createdAt||0)),updatedAt=Math.max(createdAt,Number(item.updatedAt||createdAt||0));
    return {...item,id:String(item.id||stableBuildId(item,index)),type,x,z,rotation:Number.isFinite(rotation)?rotation:0,ownerId:String(item.ownerId||'local'),createdAt,updatedAt};
  }
  function normalizeBuildList(list=[]){
    const byId=new Map();
    (Array.isArray(list)?list:[]).forEach((item,index)=>{
      const record=normalizeBuildRecord(item,index);if(!record)return;
      const previous=byId.get(record.id);
      if(!previous||Number(record.updatedAt||record.createdAt||0)>=Number(previous.updatedAt||previous.createdAt||0))byId.set(record.id,record);
    });
    return [...byId.values()].sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0));
  }
  function normalizeBuildTombstones(list=[]){
    const byId=new Map();
    (Array.isArray(list)?list:[]).forEach(item=>{
      if(!item)return;const id=String(typeof item==='string'?item:item.id||'').trim();if(!id)return;
      const removedAt=Math.max(0,Number(typeof item==='string'?0:item.removedAt||0));
      const previous=byId.get(id);if(!previous||removedAt>=previous.removedAt)byId.set(id,{id,removedAt});
    });
    return [...byId.values()].sort((a,b)=>a.removedAt-b.removedAt).slice(-300);
  }
  function mergeBuildTombstones(local=[],remote=[]){return normalizeBuildTombstones([...(local||[]),...(remote||[])]);}
  function applyBuildTombstones(builds=[],tombstones=[]){
    const removed=new Map(normalizeBuildTombstones(tombstones).map(item=>[item.id,item.removedAt]));
    return normalizeBuildList(builds).filter(item=>!removed.has(item.id)||Number(item.updatedAt||item.createdAt||0)>Number(removed.get(item.id)||0));
  }
  function mergeBuildCollections(local=[],remote=[],tombstones=[]){
    return applyBuildTombstones(normalizeBuildList([...(local||[]),...(remote||[])]),tombstones);
  }
  function mergeEntityCollections(local=[],remote=[]){
    const byId=new Map();
    [...(Array.isArray(local)?local:[]),...(Array.isArray(remote)?remote:[])].forEach((item,index)=>{
      if(!item||typeof item!=='object')return;const id=String(item.id||`entity-${index}-${Number(item.createdAt||0)}`),stamp=Number(item.updatedAt||item.createdAt||0),previous=byId.get(id);
      if(!previous||stamp>=Number(previous.updatedAt||previous.createdAt||0))byId.set(id,{...item,id});
    });
    return [...byId.values()];
  }

  const els = {
    lobby: $('#lobby'), game: $('#game'), stage: $('#stage'), screenTint: $('#screenTint'),
    playBtn: $('#playBtn'), continueBtn: $('#continueBtn'), installBtn: $('#installBtn'), installHint: $('#installHint'),
    arBtn: $('#arBtn'), quizBtn: $('#quizBtn'), collectionBtn: $('#collectionBtn'), avatarBtn: $('#avatarBtn'), accountBtn: $('#accountBtn'), moldsBtn: $('#moldsBtn'), howBtn: $('#howBtn'), settingsBtn: $('#settingsBtn'),
    lobbyLevel: $('#lobbyLevel'), lobbyCoins: $('#lobbyCoins'), lobbyRep: $('#lobbyRep'), lobbyMedals: $('#lobbyMedals'), lobbyPlayerName: $('#lobbyPlayerName'), profileNameBtn: $('#profileNameBtn'), accountStatusLabel: $('#accountStatusLabel'),
    hudLevel: $('#hudLevel'), xpFill: $('#xpFill'), xpText: $('#xpText'), hudCoins: $('#hudCoins'), hudPlayerName: $('#hudPlayerName'),
    needHunger: $('#needHunger'), needEnergy: $('#needEnergy'), needFun: $('#needFun'), needHygiene: $('#needHygiene'),
    missionChapter: $('#missionChapter'), missionTitle: $('#missionTitle'), missionStep: $('#missionStep'), missionFill: $('#missionFill'),
    quickToggleBtn: $('#quickToggleBtn'), quickBar: $('#quickBar'), needsToggleBtn: $('#needsToggleBtn'), missionCard: $('#missionCard'), avatarGameBtn: $('#avatarGameBtn'), inventoryBtn: $('#inventoryBtn'), buildBtn: $('#buildBtn'), toolsBtn: $('#toolsBtn'), mapBtn: $('#mapBtn'), dailyBtn: $('#dailyBtn'), onlineBtn: $('#onlineBtn'), newsQuickBtn: $('#newsQuickBtn'), neighborhoodQuickBtn: $('#neighborhoodQuickBtn'), gameSettingsBtn: $('#gameSettingsBtn'), multiplayerBadge: $('#multiplayerBadge'),
    contextPrompt: $('#contextPrompt'), contextIcon: $('#contextIcon'), contextLabel: $('#contextLabel'), contextHint: $('#contextHint'),
    joystick: $('#joystick'), joystickKnob: $('#joystickKnob'), runBtn: $('#runBtn'), specialBtn: $('#specialBtn'), actionBtn: $('#actionBtn'), vehicleActionBtn: $('#vehicleActionBtn'), jumpBtn: $('#jumpBtn'), crouchBtn: $('#crouchBtn'), miniBtn: $('#miniBtn'), normalBtn: $('#normalBtn'), giantBtn: $('#giantBtn'), spinBtn: $('#spinBtn'), skillsToggleBtn: $('#skillsToggleBtn'), secondaryActions: document.querySelector('.secondary-actions'),
    miniNav: $('#miniNav'), miniMapCanvas: $('#miniMapCanvas'), miniNavName: $('#miniNavName'), miniNavDistance: $('#miniNavDistance'), miniNavArrow: $('#miniNavArrow'),
    cameraControls: $('#cameraControls'), cameraNearBtn: $('#cameraNearBtn'), cameraResetBtn: $('#cameraResetBtn'), cameraFarBtn: $('#cameraFarBtn'),
    buildBadge: $('#buildBadge'), buildTypeLabel: $('#buildTypeLabel'), vehicleBadge: $('#vehicleBadge'), safetyPanel: $('#safetyPanel'), safetyStatus: $('#safetyStatus'), raceBadge: $('#raceBadge'), raceTitle: $('#raceTitle'), raceStatus: $('#raceStatus'), toast: $('#toast'),
    modal: $('#modal'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'), modalClose: $('#modalClose'), challengePrompt: $('#challengePrompt'), challengePromptKicker: $('#challengePromptKicker'), challengePromptTitle: $('#challengePromptTitle'), challengePromptText: $('#challengePromptText'), challengePromptAccept: $('#challengePromptAccept'), challengePromptDecline: $('#challengePromptDecline'),
    nativeViewer: $('#nativeViewer'), viewerShell: $('#viewerShell'), viewerPlaceholder: $('#viewerPlaceholder'), viewerLoadBtn: $('#viewerLoadBtn'), viewerStatus: $('#viewerStatus'), insideArBtn: $('#insideArBtn')
  };

  const defaultState = () => ({
    version: APP_VERSION,
    profile: { playerId: uid(), name: '', nameConfirmed: false, level: 1, xp: 0, coins: 500, reputation: 0 },
    needs: { hunger: 92, energy: 92, fun: 86, hygiene: 88 },
    inventory: { wood: 0, stone: 0, goldOre: 0, goldBar: 0, food: 2, water: 2, crystals: 0, blocks: 4, fences: 2, keys: 0, fishingRod: 1, bait: 5, seeds: 6, wheat: 0, carrots: 0, clay: 0, rawFish: 0, cookedFish: 0, forestResources: 0 },
    homeStorage: { wood: 0, stone: 0, goldOre: 0, goldBar: 0, food: 0, water: 0, crystals: 0 },
    houses: {
      home: { owned: true, locked: false, home: true },
      blue: { owned: false, locked: true, price: 250 },
      pink: { owned: false, locked: true, price: 420 },
      cabin: { owned: false, locked: false, price: 180 }
    },
    friendship: { nino: 0, luna: 0, teo: 0, bia: 0, maya: 0, clara:0, rafa:0, davi:0, leo:0 },
    avatar: defaultAvatarV2(),
    career: { title: 'Morador da Vila', level: 1, xp: 0, completed: 0, activeJob: null, lastMission:null, completedMissionTokens:[] },
    social: { invited: [], gifts: 0, jokes: 0, arguments: 0, chatHiddenBefore:0 },
    abilities: { scaleMode: 'normal', crouched: false, mastery: { miniDash:0, superJump:0, giantSlam:0, stealth:0, magnetSpin:0 } },
    tools: { owned: ['axe','pickaxe','bucket','hoe','shovel'], equipped: 'axe', harvested: { wood:0, stone:0, gold:0, water:0, bait:0, crops:0, clay:0 } },
    account: { linked:false, accountId:'', username:'', lastCloudSync:0 },
    gm: { appliedGrantIds: [], lastGrantAt: 0 },
    safety: { incidents:0, safeStops:0, lessons:0, lastIncident:0 },
    cityServices: { firesExtinguished:0, policePatrols:0, lessonsTaught:0, deliveries:0, emergencyCalls:0, accidentsResolved:0, rescuesCompleted:0, paramedicRescues:0, lastFireAt:0 },
    races: { wins: 0, losses: 0, coinWins: 0, houseWins: 0, bestTime: 0 },
    waypoint: null,
    ui: { quickOpen: false, needsOpen: false, missionOpen: false, skillsOpen: false },
    flags: {},
    completedChapters: [],
    medals: [],
    builds: [],
    buildTombstones: [],
    defeated: 0,
    position: { x: -18, y: 0, z: 39, yaw: 0 },
    settings: { sound: true, quality: 'auto', autoTier: 'balanced', vibration: true, cameraZoom: 0, cameraPitch: .28, cameraYawAssist: true, joystickNatural: true },
    guardian: { multiplayerEnabled:true, communicationEnabled:true, chatEnabled:true, sessionLimitMinutes:0, updatedAt:0 },
    usage: { totalSeconds:0, sessionSeconds:0, sessionStartedAt:0, lastPlayedAt:0, sessionLockedAt:0 },
    stats: { walked:0, swum:0, driven:0, jumps:0, collected:0, talks:0, cooked:0, planted:0, harvestedCrops:0, dugBait:0, races:0, actions:0, metroTrips:0, busStops:0, skillCombos:0, jobsCompleted:0, firesHelped:0, classesTaught:0, patrols:0, accidentsHelped:0, paramedicCalls:0, repairs:0, digitalProjects:0, digitalDeliveries:0 },
    daily: { date:'', streak:0, lastDate:'', quests:[] },
    learning: { crowns:0, totalCorrect:0, lessons:{}, lastLesson:'', perfectLessons:0, subjectXP:{math:0,portuguese:0,english:0}, multiplayerWins:0, multiplayerPlayed:0, matchHistory:[] },
    digitalStudio: { projects:[], delivered:0, created:0, portfolio:[], lastProjectAt:0 },
    multiplayer: { enabled:true, room:normalizeRoomId(window.OTTHI_CONFIG?.defaultRoom), displayName:'', cloudUid:'', cloudReady:false },
    fishing: { catches: [], species: {}, lastAttempt: 0, cooperativeRewards: [] },
    farming: { plots: {}, digSites: {}, planted: 0, harvested: 0, lastActionAt: 0 },
    campfires: [],
    boats: { activeBoatId: '', passengerOf: '', lastPosition: { x:-38, z:52, heading:0 } },
    transport: { metroTrips:0, metroDestinations:[], busStops:[], busTrips:0, busWaiting:null },
    vehicles: { lastUsedId:'garage-orange', owned:['garage-orange'], primaryId:'garage-orange', parked:{}, modularParts:{}, partDurability:{}, broken:{}, damageHistory:[], garage:{slots:{'1':'garage-orange'},stored:{},purchasedAt:{'garage-orange':0}} },
    worldLayout: { version:704, migratedAt:0, migratedBuilds:0 },
    ottovias: { passes:0, spent:0, lastTollId:'', lastTollAt:0, tour:{ active:false, index:0, startedAt:0, bestMs:0, completed:0 }, communication:{ active:false, mode:'', index:0, startedAt:0, completed:0, specialComplete:false, questionsAnswered:0 }, news:[], newsSeq:0, lastBulletinAt:0, newsMode:'critical' },
    objectives: { pinnedChapterId:'', history:[] },
    adventures: { completed:[], bestTimes:{}, active:null },
    hunting: { lastAttempt: 0, tracksFound: 0, successful: 0, failed: 0, cooperativeRewards: [] },
    houseExtensions: [],
    roomFurniture: [],
    multiplayerRequests: { lastSentAt: 0, completed: [] },
    cooperative: { active:null, completed:[], history:[], preferredMode:'coop', soloFallback:true, lastLobbyNotice:0 },
    npcSociety: { lastEvent:0, houses:{}, friendships:{}, moods:{} },
    lastSaved: Date.now()
  });
