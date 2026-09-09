/**
 * OTTHI World Edu V646.7 — módulo-fonte
 * Arquivo: 00a-visual-foundation-avatar-v2.js
 * Escopo: Registro central de assets, LOD gerenciado, orçamento visual e esquema de avatar V2
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  const OTTHI_VISUAL_FOUNDATION_VERSION = 1;
  const OTTHI_AVATAR_SCHEMA_VERSION = 2;
  const OTTHI_VISUAL_ASSETS = Object.freeze({
    models: Object.freeze({
      athosLobby: Object.freeze({
        id: 'model:athos-lobby',
        source: './athos.glb',
        purpose: 'lobby-ar-only',
        gameplayEnabled: false
      })
    }),
    textures: Object.freeze({
      grass: './assets/textures/grass-v628.png',
      road: './assets/textures/asphalt-v628.png',
      sidewalk: './assets/textures/sidewalk-v632.png',
      water: './assets/textures/water-ripples-v643.png',
      wood: './assets/textures/wood-v628.png',
      brick: './assets/textures/brick-v628.png',
      stone: './assets/textures/stone-v628.png',
      roof: './assets/textures/roof-v628.png',
      busSeat: './assets/textures/bus-seat-v628.png',
      schoolWall: './assets/textures/school-wall-v628.png',
      policeWall: './assets/textures/police-wall-v628.png',
      goldOre: './assets/textures/gold-ore-v628.png',
      interiorFloor: './assets/textures/home-floor-v632.png',
      interiorWall: './assets/textures/interior-wall-v632.png',
      marketFloor: './assets/textures/market-floor-v632.png',
      marketWall: './assets/textures/market-wall-v632.png',
      schoolFloor: './assets/textures/school-floor-v632.png',
      fireWall: './assets/textures/fire-station-wall-v632.png',
      concrete: './assets/textures/concrete-v632.png',
      cityGlass: './assets/textures/city-glass-v632.png',
      emergencyMetal: './assets/textures/emergency-metal-v632.png'
    })
  });

  const OTTHI_AVATAR_V2_DEFAULTS = Object.freeze({
    version: OTTHI_AVATAR_SCHEMA_VERSION,
    renderMode: 'procedural-fallback',
    bodyStyle: 'block',
    skinTone: 'tone-03',
    face: 'face-athos-01',
    hair: 'hair-athos-01',
    hairColor: '#352317',
    torso: 'legacy-outfit-classic',
    legs: 'legacy-pants-01',
    shoes: 'legacy-sneakers-01',
    hat: 'none',
    back: 'none',
    pattern: 'none',
    primaryColor: '#1267d6',
    secondaryColor: '#111827',
    outfit: 'classic',
    accessory: 'none',
    uniform: 'none'
  });
  const OTTHI_AVATAR_SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,63}$/;
  const OTTHI_AVATAR_SAFE_COLOR = /^#[0-9a-f]{6}$/i;
  const OTTHI_AVATAR_LEGACY_CHOICES = Object.freeze({
    outfit: Object.freeze(['classic','blue','red','explorer']),
    hat: Object.freeze(['none','cap','crown','helmet']),
    accessory: Object.freeze(['none','backpack','glasses','cape']),
    uniform: Object.freeze(['none','firefighter','police','paramedic','teacher','delivery','mechanic','miner','builder','sport'])
  });

  function safeAvatarId(value,fallback){
    const candidate=String(value??'').trim().toLowerCase();
    return OTTHI_AVATAR_SAFE_ID.test(candidate)?candidate:fallback;
  }
  function safeAvatarColor(value,fallback){
    const candidate=String(value??'').trim();
    return OTTHI_AVATAR_SAFE_COLOR.test(candidate)?candidate.toLowerCase():fallback;
  }
  function safeLegacyAvatarChoice(type,value,fallback){
    const allowed=OTTHI_AVATAR_LEGACY_CHOICES[type]||[];
    return allowed.includes(value)?value:fallback;
  }
  function defaultAvatarV2(){
    return {...OTTHI_AVATAR_V2_DEFAULTS};
  }
  function normalizeAvatarV2(value={}){
    const source=value&&typeof value==='object'?value:{};
    const defaults=OTTHI_AVATAR_V2_DEFAULTS;
    const outfit=safeLegacyAvatarChoice('outfit',source.outfit,defaults.outfit);
    const hat=safeLegacyAvatarChoice('hat',source.hat,defaults.hat);
    const accessory=safeLegacyAvatarChoice('accessory',source.accessory,defaults.accessory);
    const uniform=safeLegacyAvatarChoice('uniform',source.uniform,defaults.uniform);
    // O estado sincronizado aceita somente os campos conhecidos pelo esquema infantil V2.
    return {
      ...defaults,
      version:OTTHI_AVATAR_SCHEMA_VERSION,
      renderMode:safeAvatarId(source.renderMode,defaults.renderMode),
      bodyStyle:safeAvatarId(source.bodyStyle,defaults.bodyStyle),
      skinTone:safeAvatarId(source.skinTone,defaults.skinTone),
      face:safeAvatarId(source.face,defaults.face),
      hair:safeAvatarId(source.hair,defaults.hair),
      hairColor:safeAvatarColor(source.hairColor,defaults.hairColor),
      torso:safeAvatarId(source.torso,`legacy-outfit-${outfit}`),
      legs:safeAvatarId(source.legs,defaults.legs),
      shoes:safeAvatarId(source.shoes,defaults.shoes),
      hat,
      back:safeAvatarId(source.back,accessory==='backpack'?'legacy-backpack':'none'),
      pattern:safeAvatarId(source.pattern,defaults.pattern),
      primaryColor:safeAvatarColor(source.primaryColor,defaults.primaryColor),
      secondaryColor:safeAvatarColor(source.secondaryColor,defaults.secondaryColor),
      outfit,
      accessory,
      uniform
    };
  }
  function updateAvatarV2LegacyChoice(avatar,type,id){
    const current=normalizeAvatarV2(avatar);
    if(!Object.prototype.hasOwnProperty.call(OTTHI_AVATAR_LEGACY_CHOICES,type))return current;
    const fallback=OTTHI_AVATAR_V2_DEFAULTS[type];
    const selected=safeLegacyAvatarChoice(type,id,fallback);
    const next={...current,[type]:selected};
    if(type==='outfit')next.torso=`legacy-outfit-${selected}`;
    if(type==='accessory')next.back=selected==='backpack'?'legacy-backpack':'none';
    return normalizeAvatarV2(next);
  }

  const visualFoundation={
    version:OTTHI_VISUAL_FOUNDATION_VERSION,
    assets:new Map(),
    lods:[],
    qualityTier:'balanced',
    qualityProfile:null,
    outlineVisible:0,
    outlineHidden:0,
    materialCacheHits:0,
    materialCacheMisses:0,
    mutableMaterialCreates:0,
    geometryCacheHits:0,
    geometryCacheMisses:0
  };
  const OTTHI_VISUAL_QUALITY_PROFILES=Object.freeze({
    low:Object.freeze({lodDistanceScale:.72,outlineDistance:24,glows:false}),
    balanced:Object.freeze({lodDistanceScale:1,outlineDistance:46,glows:true}),
    high:Object.freeze({lodDistanceScale:1.34,outlineDistance:82,glows:true})
  });

  function registerVisualAsset(id,object=null,metadata={}){
    const key=String(id||'').trim();
    if(!key)return null;
    const previous=visualFoundation.assets.get(key)||{};
    const record={...previous,...metadata,id:key,object:object??previous.object??null};
    visualFoundation.assets.set(key,record);
    return record;
  }
  function updateVisualAsset(id,metadata={}){
    return registerVisualAsset(id,null,metadata);
  }
  function visualAssetStatus(){
    const records=[...visualFoundation.assets.values()];
    const byType={};
    const byStatus={};
    for(const record of records){
      const type=record.type||'other',status=record.status||'registered';
      byType[type]=(byType[type]||0)+1;
      byStatus[status]=(byStatus[status]||0)+1;
    }
    return{total:records.length,byType,byStatus};
  }
  function visualQualityProfile(tier='balanced'){
    return OTTHI_VISUAL_QUALITY_PROFILES[tier]||OTTHI_VISUAL_QUALITY_PROFILES.balanced;
  }
  function createManagedLOD(id,highObject,lowObject,options={}){
    if(!highObject)return null;
    const Three=window.THREE;
    if(!Three?.LOD||!lowObject){
      registerVisualAsset(`lod:${id}`,highObject,{type:'lod',status:'fallback-high-only',category:options.category||'world'});
      return highObject;
    }
    const lod=new Three.LOD(),baseDistance=Math.max(8,Number(options.distance||42));
    lod.name=`OTTHI_LOD_${String(id||'asset').replace(/[^a-z0-9_-]+/gi,'_')}`;
    lod.addLevel(highObject,0);
    lod.addLevel(lowObject,baseDistance);
    lod.userData.otthiManagedLOD=true;
    lod.userData.otthiAssetId=String(id||'');
    lod.userData.otthiBaseDistance=baseDistance;
    lod.userData.otthiCategory=options.category||'world';
    const record={id:String(id||''),lod,baseDistance,category:options.category||'world',currentLevel:0};
    visualFoundation.lods.push(record);
    registerVisualAsset(`lod:${id}`,lod,{type:'lod',status:'ready',category:record.category,levels:2,baseDistance});
    return lod;
  }
  function applyVisualQualityBudget(tier='balanced'){
    const resolved=OTTHI_VISUAL_QUALITY_PROFILES[tier]?tier:'balanced',profile=visualQualityProfile(resolved);
    visualFoundation.qualityTier=resolved;
    visualFoundation.qualityProfile=profile;
    for(const record of visualFoundation.lods){
      const level=record.lod?.levels?.[1];
      if(level)level.distance=Math.max(8,record.baseDistance*profile.lodDistanceScale);
    }
    return profile;
  }
  function updateManagedVisualLODs(activeCamera){
    if(!activeCamera)return;
    for(const record of visualFoundation.lods){
      try{
        record.lod.update(activeCamera);
        record.currentLevel=Number(record.lod.getCurrentLevel?.()||0);
      }catch(error){
        updateVisualAsset(`lod:${record.id}`,{status:'runtime-fallback',error:String(error?.message||error)});
      }
    }
  }
  function outlineBelongsToPlayer(line){
    let owner=line;
    while(owner){
      if(owner===playerGroup||owner===playerModel||owner===vehicleVisual||owner.userData?.alwaysOutline===true)return true;
      owner=owner.parent;
    }
    return false;
  }
  function updateManagedOutlineVisibility(){
    if(!world?.outlines||!camera)return;
    const profile=visualFoundation.qualityProfile||visualQualityProfile(qualityTier?.()||'balanced');
    const position=new THREE.Vector3();
    let visible=0,hidden=0;
    for(const line of world.outlines){
      if(!line?.parent)continue;
      const keep=outlineBelongsToPlayer(line);
      if(keep){
        line.visible=true;
        visible++;
        continue;
      }
      line.getWorldPosition(position);
      const show=position.distanceTo(camera.position)<=profile.outlineDistance;
      line.visible=show;
      if(show)visible++;else hidden++;
    }
    visualFoundation.outlineVisible=visible;
    visualFoundation.outlineHidden=hidden;
  }
  function visualFoundationDiagnostics(){
    const lodLevels={near:0,far:0};
    for(const record of visualFoundation.lods){
      if(record.currentLevel>0)lodLevels.far++;else lodLevels.near++;
    }
    return{
      version:visualFoundation.version,
      tier:visualFoundation.qualityTier,
      assets:visualAssetStatus(),
      lod:{registered:visualFoundation.lods.length,...lodLevels},
      outlines:{visible:visualFoundation.outlineVisible,hidden:visualFoundation.outlineHidden},
      materials:{
        immutable:typeof immutableVisualMaterials!=='undefined'?immutableVisualMaterials.size:0,
        hits:visualFoundation.materialCacheHits,
        misses:visualFoundation.materialCacheMisses,
        mutableCreated:visualFoundation.mutableMaterialCreates
      },
      geometries:{
        boxes:typeof sharedGeometryCache!=='undefined'?sharedGeometryCache.box.size:0,
        cylinders:typeof sharedGeometryCache!=='undefined'?sharedGeometryCache.cylinder.size:0,
        outlineShapes:typeof outlineGeometryCache!=='undefined'?outlineGeometryCache.size:0,
        hits:visualFoundation.geometryCacheHits,
        misses:visualFoundation.geometryCacheMisses
      }
    };
  }

  function createAvatarRigFoundation(root,bodyRoot,parts){
    if(!root||!bodyRoot||!parts)return null;
    root.name='OTTHI_AVATAR_ROOT';
    bodyRoot.name='BODY_ROOT';
    if(parts.body)parts.body.name='TORSO';
    if(parts.head)parts.head.name='HEAD';
    if(parts.leftArm)parts.leftArm.name='ARM_LEFT';
    if(parts.rightArm)parts.rightArm.name='ARM_RIGHT';
    if(parts.leftLeg)parts.leftLeg.name='LEG_LEFT';
    if(parts.rightLeg)parts.rightLeg.name='LEG_RIGHT';
    const socket=(parent,name,position)=>{
      const group=new THREE.Group();
      group.name=name;
      group.position.set(position[0],position[1],position[2]);
      parent?.add(group);
      return group;
    };
    const sockets={
      TOOL_SOCKET:socket(parts.rightArm,'TOOL_SOCKET',[0,-1.16,.1]),
      HAND_LEFT_SOCKET:socket(parts.leftArm,'HAND_LEFT_SOCKET',[0,-1.16,.1]),
      BACK_SOCKET:socket(parts.body,'BACK_SOCKET',[0,0,-.5]),
      HEAD_SOCKET:socket(parts.head,'HEAD_SOCKET',[0,.64,0]),
      VEHICLE_SOCKET:socket(bodyRoot,'VEHICLE_SOCKET',[0,.45,0])
    };
    root.userData.avatarRig={
      version:OTTHI_AVATAR_SCHEMA_VERSION,
      fallback:'procedural',
      fallbackActive:true,
      bodyRoot,
      sockets
    };
    registerVisualAsset('avatar:procedural-fallback',root,{type:'avatar',status:'active-fallback',schemaVersion:OTTHI_AVATAR_SCHEMA_VERSION});
    return root.userData.avatarRig;
  }
  function avatarFoundationDiagnostics(){
    const rig=playerModel?.userData?.avatarRig;
    return{
      schemaVersion:OTTHI_AVATAR_SCHEMA_VERSION,
      stateVersion:Number(state?.avatar?.version||0),
      renderMode:state?.avatar?.renderMode||'',
      fallbackActive:rig?.fallbackActive!==false,
      rootName:playerModel?.name||'',
      bodyRootName:rig?.bodyRoot?.name||'',
      sockets:Object.keys(rig?.sockets||{})
    };
  }

  registerVisualAsset(OTTHI_VISUAL_ASSETS.models.athosLobby.id,null,{
    type:'model',
    status:'lobby-only',
    source:OTTHI_VISUAL_ASSETS.models.athosLobby.source,
    gameplayEnabled:false
  });
