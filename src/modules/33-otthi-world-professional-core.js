/**
 * OTTHI World V700 — módulo-fonte
 * Arquivo: 33-otthi-world-professional-core.js
 * Escopo: Fundação profissional, PBR local, controle de etapas e painel OTTHI World
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  const OTTHI_WORLD_VERSION = 702;
  const OTTHI_WORLD_BUILD = '702.1-ux-personagem-veiculos';
  const OTTHI_WORLD_STAGES = Object.freeze({
    foundation:Object.freeze({id:'foundation',number:1,title:'Fundação profissional',status:'implemented'}),
    avatar:Object.freeze({id:'avatar',number:2,title:'Personagem modular',status:'implemented'}),
    render:Object.freeze({id:'render',number:3,title:'Mundo, texturas e render',status:'implemented'}),
    machines:Object.freeze({id:'machines',number:4,title:'Construção e máquinas modulares',status:'implemented'}),
    adventure:Object.freeze({id:'adventure',number:5,title:'Aventura, plataforma e poderes',status:'implemented'})
  });
  const OTTHI_WORLD_PBR_PACKS=Object.freeze({
    grass:'grass',road:'road',sidewalk:'sidewalk',water:'water',wood:'wood',brick:'brick',stone:'stone',roof:'roof',fabric:'fabric',schoolWall:'school-wall',policeWall:'police-wall',goldOre:'gold-ore',interiorFloor:'interior-floor',interiorWall:'interior-wall',marketFloor:'market-floor',marketWall:'market-wall',schoolFloor:'school-floor',fireWall:'fire-wall',concrete:'concrete',cityGlass:'city-glass',emergencyMetal:'emergency-metal',toyPlastic:'toy-plastic',vehicleTire:'vehicle-tire',heroEnergy:'hero-energy',mushroom:'mushroom',foliage:'foliage',dirt:'dirt',sand:'sand',farmland:'farmland',cliff:'cliff',deepWater:'deep-water',shore:'shore',mud:'mud'
  });
  const otthiWorldRuntime={
    initialized:false,
    pbrReady:false,
    worldLayerReady:false,
    avatarReady:false,
    modularVehiclesReady:false,
    adventureReady:false,
    textures:new Map(),
    materials:new Map(),
    stats:{pbrMaps:0,enhancedMeshes:0,instancedDetails:0,vehicleModules:0,adventureObjects:0},
    updateTime:0,
    errors:[]
  };

  function ensureOtthiWorldState(){
    state.settings={...(state.settings||{}),worldRender:state.settings?.worldRender!==false,worldDetails:state.settings?.worldDetails!==false,worldDayCycle:!!state.settings?.worldDayCycle,worldOutlines:state.settings?.worldOutlines!=='off'};
    state.avatar=normalizeAvatarV2({...state.avatar,renderMode:'otthi-world-v3',bodyStyle:state.avatar?.bodyStyle||'lego',face:state.avatar?.face||'face-happy-01',hair:state.avatar?.hair||'hair-short-01',torso:state.avatar?.torso||'world-jacket-01',legs:state.avatar?.legs||'world-pants-01',shoes:state.avatar?.shoes||'world-sneakers-01'});
    state.vehicles={...(state.vehicles||{}),owned:[...new Set(['garage-orange',...(state.vehicles?.owned||[])])],primaryId:state.vehicles?.primaryId||'garage-orange',parked:{...(state.vehicles?.parked||{})},modularParts:{...(state.vehicles?.modularParts||{})},partDurability:{...(state.vehicles?.partDurability||{})},garage:{slots:{'1':'garage-orange',...(state.vehicles?.garage?.slots||{})},stored:{...(state.vehicles?.garage?.stored||{})},purchasedAt:{'garage-orange':0,...(state.vehicles?.garage?.purchasedAt||{})}}};
    state.adventures={...(state.adventures||{}),hero:{selectedPower:state.adventures?.hero?.selectedPower||'energyPulse',unlocked:Array.isArray(state.adventures?.hero?.unlocked)?state.adventures.hero.unlocked:['energyPulse','velocityDash','guardianShield'],mastery:{energyPulse:0,velocityDash:0,guardianShield:0,skyLeap:0,magnetWave:0,...(state.adventures?.hero?.mastery||{})},challengeBest:Number(state.adventures?.hero?.challengeBest||0),challengeWins:Number(state.adventures?.hero?.challengeWins||0),energy:Number.isFinite(state.adventures?.hero?.energy)?clamp(state.adventures.hero.energy,0,100):100,lastUse:Number(state.adventures?.hero?.lastUse||0)}};
    return state;
  }

  function worldPbrPath(pack,channel){return `./assets/world/textures/${pack}-${channel}.png`;}
  function configureWorldTexture(texture,options={}){
    if(!texture)return texture;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    const repeat=options.repeat||[1,1];texture.repeat.set(Number(repeat[0]||1),Number(repeat[1]||1));
    texture.magFilter=options.nearest?THREE.NearestFilter:THREE.LinearFilter;
    texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;
    texture.anisotropy=(renderer&&renderer.capabilities)?Math.min(Number(options.anisotropy||12),renderer.capabilities.getMaxAnisotropy()):4;
    if(options.color){if('colorSpace'in texture&&THREE.SRGBColorSpace)texture.colorSpace=THREE.SRGBColorSpace;else texture.encoding=THREE.sRGBEncoding;}
    return texture;
  }
  function loadWorldTexture(pack,channel,options={}){
    const key=`${pack}:${channel}:${(options.repeat||[1,1]).join('x')}`;
    if(otthiWorldRuntime.textures.has(key))return otthiWorldRuntime.textures.get(key);
    const texture=new THREE.TextureLoader().load(worldPbrPath(pack,channel),loaded=>{
      configureWorldTexture(loaded,options);loaded.needsUpdate=true;registerVisualAsset(`world-texture:${key}`,loaded,{type:'texture',status:'loaded',pack,channel});
    },undefined,error=>{
      otthiWorldRuntime.errors.push(`texture:${pack}:${channel}:${String(error?.message||'load')}`);updateVisualAsset(`world-texture:${key}`,{status:'fallback'});
    });
    configureWorldTexture(texture,options);texture.name=`OTTHI_WORLD_${pack}_${channel}`;otthiWorldRuntime.textures.set(key,texture);registerVisualAsset(`world-texture:${key}`,texture,{type:'texture',status:'loading',pack,channel});return texture;
  }
  function ensureUv2(mesh){
    const geometry=mesh?.geometry;if(!geometry?.attributes?.uv||geometry.attributes.uv2)return false;
    const source=geometry.attributes.uv;geometry.setAttribute('uv2',new THREE.BufferAttribute(source.array,source.itemSize));return true;
  }
  function applyPbrPack(material,packName,options={}){
    if(!material||!packName)return material;
    const repeat=options.repeat||material.map?.repeat?.toArray?.()||[1,1];
    material.normalMap=loadWorldTexture(packName,'normal',{repeat});
    material.roughnessMap=loadWorldTexture(packName,'roughness',{repeat});
    material.aoMap=loadWorldTexture(packName,'ao',{repeat});
    if(options.replaceBase!==false)material.map=loadWorldTexture(packName,'basecolor',{repeat,color:true,nearest:!!options.nearest});
    if(options.emissive){material.emissiveMap=loadWorldTexture(packName,'emissive',{repeat});material.emissive=material.emissive||new THREE.Color(options.emissiveColor||0xffffff);material.emissiveIntensity=Number(options.emissiveIntensity||.18);}
    material.normalScale?.set?.(Number(options.normalScale||.6),Number(options.normalScale||.6));
    if(Number.isFinite(options.roughness))material.roughness=Number(options.roughness);
    material.envMapIntensity=Number(options.envMapIntensity||.42);material.needsUpdate=true;material.userData={...(material.userData||{}),otthiWorldPbr:packName};otthiWorldRuntime.stats.pbrMaps+=4;return material;
  }
  function upgradeCoreMaterialsToWorldPbr(){
    if(!materials||otthiWorldRuntime.pbrReady)return false;
    const configs=[
      ['grass','grass',[46,46],.9],['road','road',[10,30],.88],['sidewalk','sidewalk',[7,16],.91],['wood','wood',[2,2],.72],['brick','brick',[3,2],.82],['stone','stone',[4,3],.86],['roof','roof',[3,3],.80],['fabric','fabric',[4,4],.94],['interiorFloor','interior-floor',[4,4],.68],['interiorWall','interior-wall',[3,2],.88],['marketFloor','market-floor',[4,4],.62],['marketWall','market-wall',[3,2],.84],['schoolFloor','school-floor',[4,4],.64],['schoolWall','school-wall',[3,2],.82],['policeWall','police-wall',[3,2],.72],['fireWall','fire-wall',[3,2],.76],['concrete','concrete',[5,6],.87],['cityGlass','city-glass',[2,2],.18],['emergencyMetal','emergency-metal',[3,3],.38],['goldOre','gold-ore',[2,2],.72]
    ];
    for(const [key,pack,repeat,roughness]of configs)if(materials[key])applyPbrPack(materials[key],pack,{repeat,roughness,emissive:['water','city-glass','emergency-metal','gold-ore'].includes(pack),emissiveIntensity:pack==='gold-ore'?.24:.10});
    if(materials.water)applyPbrPack(materials.water,'water',{repeat:[7,7],roughness:.22,emissive:true,emissiveColor:0x1b7ca7,emissiveIntensity:.12,normalScale:.34});
    otthiWorldRuntime.pbrReady=true;return true;
  }
  function improveSceneMeshMaterials(root=worldGroup){
    if(!root)return 0;let count=0;
    root.traverse(object=>{
      if(!object?.isMesh)return;ensureUv2(object);
      object.castShadow=qualityTier()==='high'&&!perf.mobile&&object.geometry?.type!=='PlaneGeometry';
      object.receiveShadow=true;object.frustumCulled=object.userData?.criticalSurface!==true;
      const list=Array.isArray(object.material)?object.material:[object.material];for(const material of list){if(!material)continue;material.dithering=true;if(material.map)configureWorldTexture(material.map,{repeat:material.map.repeat?.toArray?.()||[1,1],color:true});}
      count++;
    });
    otthiWorldRuntime.stats.enhancedMeshes=count;return count;
  }
  function otthiWorldStageMarkup(){
    return '';
  }
  function openOtthiWorldCenter(){
    ensureOtthiWorldState();
    return openAvatarStudio();
  }
  function injectOtthiWorldButtons(){
    document.getElementById('otthiWorldBtn')?.remove();
    document.getElementById('otthiWorldQuickBtn')?.remove();
    return false;
  }
  function applyOtthiWorldRuntimeSettings(){
    const enabled=state.settings?.worldRender!==false;document.body.classList.toggle('otthi-world-render',enabled);document.body.classList.toggle('otthi-world-details',state.settings?.worldDetails!==false);
    if(worldGroup)worldGroup.traverse(object=>{if(object.userData?.otthiWorldDetail)object.visible=state.settings?.worldDetails!==false;});
    if(renderer){renderer.toneMappingExposure=enabled?1.02:.94;renderer.shadowMap.enabled=enabled&&qualityTier()==='high'&&!perf.mobile;}
    
  }
  function otthiWorldDiagnostics(){return{version:OTTHI_WORLD_VERSION,build:OTTHI_WORLD_BUILD,stages:OTTHI_WORLD_STAGES,runtime:{...otthiWorldRuntime,assets:undefined,textures:otthiWorldRuntime.textures.size,materials:otthiWorldRuntime.materials.size},state:{avatar:{...state.avatar},vehicles:{modularParts:Object.keys(state.vehicles?.modularParts||{}).length},hero:{...state.adventures?.hero}},firebaseConfigPreserved:true};}
  window.OTTHI_WORLD={version:OTTHI_WORLD_VERSION,build:OTTHI_WORLD_BUILD,open:openOtthiWorldCenter,status:otthiWorldDiagnostics,stages:OTTHI_WORLD_STAGES};
