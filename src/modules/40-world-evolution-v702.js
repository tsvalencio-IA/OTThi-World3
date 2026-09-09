/**
 * OTTHI World V702 — evolução integral do mundo
 * Escopo: HUD paisagem, câmera, terreno/biomas, profundidade da água, natação,
 * fazenda, escavação, mercadinho completo e cidadãos temáticos originais.
 */
// @otthi-module-body
  const OTTHI_WORLD_EVOLUTION_VERSION=704;
  const WORLD_V702={initialized:false,terrain:null,waterLayers:[],farmPlots:new Map(),digSites:new Map(),citizens:[],cameraButtonsReady:false,waterTime:0};
  const FARM_GROW_MS=90000; // 90 segundos por ciclo completo, persistente
  const V702_DIG_COOLDOWN=22000;

  function ensureWorldEvolutionState(){
    state.inventory={wood:0,stone:0,goldOre:0,goldBar:0,food:0,water:0,crystals:0,blocks:0,fences:0,keys:0,fishingRod:0,bait:0,seeds:0,wheat:0,carrots:0,clay:0,rawFish:0,cookedFish:0,forestResources:0,...(state.inventory||{})};
    state.tools={owned:[],equipped:'axe',harvested:{},...(state.tools||{})};state.tools.owned=[...new Set([...(state.tools.owned||[]),'axe','pickaxe','bucket','hoe','shovel'])];
    state.tools.harvested={wood:0,stone:0,gold:0,water:0,bait:0,crops:0,clay:0,...(state.tools.harvested||{})};
    state.farming={plots:{},digSites:{},planted:0,harvested:0,lastActionAt:0,...(state.farming||{})};state.farming.plots={...(state.farming.plots||{})};state.farming.digSites={...(state.farming.digSites||{})};
    state.settings={cameraPitch:.28,cameraZoom:0,cameraYawAssist:true,...(state.settings||{})};
    return state;
  }

  function professionalTerrainHeightAt(x,z){
    if(!Number.isFinite(x)||!Number.isFinite(z))return 0;
    // Montanha noroeste: zona própria, longe de ruas, estádio, castelo e construções.
    const mountainPoint=worldLayoutPoint('mountain',{x:-88,z:104}),nx=(x-mountainPoint.x)/24,nz=(z-mountainPoint.z)/20,r=Math.hypot(nx,nz);let mountain=0;
    if(r<1.12&&z>82){const dome=Math.pow(Math.max(0,1-r/1.12),1.55)*15.5;const ridges=(Math.sin(x*.22)+Math.cos(z*.18))*1.05*Math.max(0,1-r);mountain=Math.max(0,dome+ridges);}
    // Colinas do deserto, baixas o suficiente para não cobrir prédios ou vias.
    let dune=0;if(x>70&&z>-61&&z<-24){const a=Math.max(0,1-Math.hypot((x-91)/25,(z+42)/20));dune=Math.max(0,Math.sin((x+z)*.12)*.45+.55)*a*2.1;}
    return Math.max(0,mountain,dune);
  }
  function v702TextureMaterial(pack,color,options={}){
    const repeat=options.repeat||[6,6],material=new THREE.MeshStandardMaterial({color,roughness:options.roughness??.86,metalness:options.metalness??0,transparent:!!options.transparent,opacity:options.opacity??1,side:options.side||THREE.FrontSide});
    try{material.map=loadWorldTexture(pack,'basecolor',{repeat,color:true,nearest:!!options.nearest});material.normalMap=loadWorldTexture(pack,'normal',{repeat});material.roughnessMap=loadWorldTexture(pack,'roughness',{repeat});material.normalScale.set(options.normalScale??.45,options.normalScale??.45);}catch(error){material.userData.textureFallback=true;}
    material.userData={...(material.userData||{}),otthiV702Pack:pack};return material;
  }
  function createV702GroundRecovery(){
    if(world.worldEvolution?.groundRecovery)return false;
    const material=v702TextureMaterial('grass',0x5fae4d,{repeat:[42,42],roughness:.94,normalScale:.28});
    const worldSize=v704WorldSize(),ground=new THREE.Mesh(new THREE.BoxGeometry(worldSize.w+7,.04,worldSize.d+7),material);ground.position.set(0,.025,0);ground.receiveShadow=true;ground.frustumCulled=false;ground.renderOrder=0;ground.userData.criticalSurface=true;ground.name='OTTHI_V702_GRASS_RECOVERY';worldGroup.add(ground);world.criticalSurfaces.push(ground);
    world.worldEvolution={...(world.worldEvolution||{}),groundRecovery:ground};return true;
  }
  function terrainVertexColor(height,kind){if(kind==='mountain')return new THREE.Color(height>9?0xd5d8cf:height>4?0x75825f:0x5d9949);return new THREE.Color(0xd9ae5f);}
  function createMountainTerrain(){
    const mountainPoint=worldLayoutPoint('mountain',{x:-88,z:104}),geometry=new THREE.PlaneGeometry(50,36,34,26);geometry.rotateX(-Math.PI/2);const position=geometry.attributes.position,colors=[];
    for(let i=0;i<position.count;i++){const wx=mountainPoint.x+position.getX(i),wz=mountainPoint.z+position.getZ(i),h=professionalTerrainHeightAt(wx,wz);position.setY(i,h-.02);const c=terrainVertexColor(h,'mountain');colors.push(c.r,c.g,c.b);}
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const material=v702TextureMaterial('cliff',0xffffff,{repeat:[10,9],roughness:.92,normalScale:.65});material.vertexColors=true;
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(mountainPoint.x,0,mountainPoint.z);mesh.receiveShadow=true;mesh.castShadow=qualityTier()==='high'&&!perf.mobile;mesh.name='OTTHI_V702_MOUNTAIN';worldGroup.add(mesh);
    for(const [x,z]of[[-104,92],[-96,100],[-86,108],[-74,112]]){const tree=createTree(x,z,.72,false);tree.position.y=professionalTerrainHeightAt(x,z);}
    const entrance=worldLayoutPoint('mountainEntrance');createSignpost(entrance.x,entrance.z,'Montanha OTTHI',-Math.PI/2);
    world.worldEvolution.mountain=mesh;return mesh;
  }
  function createDesertBiome(){
    const matSand=v702TextureMaterial('sand',0xe3ba6c,{repeat:[12,9],roughness:.95,normalScale:.48}),group=new THREE.Group();group.name='OTTHI_V702_DESERT';worldGroup.add(group);
    const patch=new THREE.Mesh(new THREE.BoxGeometry(40,.08,34),matSand);patch.position.set(94,.01,-42);patch.receiveShadow=true;group.add(patch);
    const duneMat=v702TextureMaterial('sand',0xe9c579,{repeat:[3,3],roughness:.96,normalScale:.32});
    for(const [x,z,s]of[[80,-34,1],[89,-50,1.2],[100,-38,.9],[108,-52,1.1]]){const dune=new THREE.Mesh(new THREE.SphereGeometry(3.6*s,14,8,0,Math.PI*2,0,Math.PI/2),duneMat);dune.scale.y=.38;dune.position.set(x,.05,z);dune.receiveShadow=true;group.add(dune);}
    createSignpost(72,-24,'Deserto dos Brinquedos',Math.PI/2);world.worldEvolution.desert=group;return group;
  }
  function createLakeDepthLayers(){
    if(world.worldEvolution?.lakeDepth)return false;const group=new THREE.Group();group.name='OTTHI_V702_LAKE_DEPTH';worldGroup.add(group);
    for(const hazard of(world.hazards||[]).filter(h=>h.type==='water')){
      const bottomMat=v702TextureMaterial('deep-water',0x0b5578,{repeat:[8,4],roughness:.72,normalScale:.18});const bottom=new THREE.Mesh(new THREE.BoxGeometry(hazard.w-.8,.12,hazard.d-.8),bottomMat);bottom.position.set(hazard.x,-1.58,hazard.z);bottom.receiveShadow=true;group.add(bottom);
      const deepMat=v702TextureMaterial('deep-water',0x137ca3,{repeat:[9,5],roughness:.2,normalScale:.36,transparent:true,opacity:.56});deepMat.depthWrite=false;const deep=new THREE.Mesh(new THREE.BoxGeometry(hazard.w-.45,.04,hazard.d-.45),deepMat);deep.position.set(hazard.x,.105,hazard.z);deep.renderOrder=4;group.add(deep);WORLD_V702.waterLayers.push(deep);
      if(!hazard.reservoir){const shoreMat=v702TextureMaterial('shore',0xd7c888,{repeat:[12,2],roughness:.9,normalScale:.35});const north=new THREE.Mesh(new THREE.BoxGeometry(hazard.w+2.8,.06,2.2),shoreMat),south=north.clone();north.position.set(hazard.x,.01,hazard.z-hazard.d/2-1.12);south.position.set(hazard.x,.01,hazard.z+hazard.d/2+1.12);group.add(north,south);for(let ix=-hazard.w/2+3;ix<hazard.w/2-2;ix+=8){const reeds=new THREE.Group();reeds.position.set(hazard.x+ix,.1,hazard.z-hazard.d/2-.35);group.add(reeds);for(const dx of[-.22,0,.22])premiumBox(.05,.72+Math.abs(dx),.05,0x4f8b43,dx,.36,0,reeds);}}
    }
    world.worldEvolution.lakeDepth=group;return true;
  }
  function farmPlotRecord(id){return state.farming.plots[id]||{status:'empty',plantedAt:0,crop:'wheat'};}
  function cropStage(record){if(record.status!=='growing')return record.status==='ready'?3:0;return clamp(Math.floor((Date.now()-Number(record.plantedAt||0))/FARM_GROW_MS*3)+1,1,3);}
  function updateFarmPlotVisual(plot){const record=farmPlotRecord(plot.id),stage=cropStage(record);plot.soil.material=record.status==='empty'?plot.soilMaterials.empty:plot.soilMaterials.wet;plot.crop.visible=stage>0;plot.crop.scale.y=stage===1?.32:stage===2?.68:1;plot.crop.position.y=.16+plot.crop.scale.y*.35;plot.interactable.label=record.status==='ready'||stage>=3?'Colher plantação':record.status==='growing'?`Plantação crescendo (${Math.min(99,Math.floor((Date.now()-record.plantedAt)/FARM_GROW_MS*100))}%)`:'Preparar e plantar';if(record.status==='growing'&&stage>=3){state.farming.plots[plot.id]={...record,status:'ready'};plot.interactable.label='Colher plantação';}}
  function useFarmPlot(plot){ensureWorldEvolutionState();const record=farmPlotRecord(plot.id);if(record.status==='empty'){
      if(state.tools.equipped!=='hoe'){toast('Equipe a Enxada para preparar e plantar.','warn',1800);return;}if((state.inventory.seeds||0)<1){toast('Você precisa de sementes. Compre no mercadinho ou cave a terra.','warn',2200);return;}state.inventory.seeds--;state.farming.plots[plot.id]={status:'growing',plantedAt:Date.now(),crop:Math.random()<.45?'carrot':'wheat'};state.farming.planted++;state.stats.planted=(state.stats.planted||0)+1;playToolAnimation();addXP(8);toast('Semente plantada. Ela cresce mesmo com o jogo fechado.','good',2200);
    }else if(record.status==='ready'||cropStage(record)>=3){const crop=record.crop||'wheat',food=2+Math.floor(Math.random()*2);state.inventory[crop==='carrot'?'carrots':'wheat']=(state.inventory[crop==='carrot'?'carrots':'wheat']||0)+2;state.inventory.food=(state.inventory.food||0)+food;state.inventory.seeds=(state.inventory.seeds||0)+1;state.farming.plots[plot.id]={status:'empty',plantedAt:0,crop};state.farming.harvested++;state.stats.harvestedCrops=(state.stats.harvestedCrops||0)+1;state.tools.harvested.crops=(state.tools.harvested.crops||0)+2;addXP(22);addCoins(8);toast(`Colheita concluída: +2 ${crop==='carrot'?'cenouras':'trigos'}, +${food} comida e +1 semente.`,'good',2600);
    }else{toast('A plantação ainda está crescendo.','warn',1400);return;}saveState(true);updateHUD();updateFarmPlotVisual(plot);}
  function createFarmingSystem(){
    if(world.worldEvolution?.farming)return false;const group=new THREE.Group();group.name='OTTHI_V702_FARM';worldGroup.add(group);const empty=v702TextureMaterial('farmland',0x79502e,{repeat:[2,2],roughness:.96,normalScale:.52}),wet=v702TextureMaterial('mud',0x543522,{repeat:[2,2],roughness:.88,normalScale:.48});
    const farmPoint=worldLayoutPoint('farm',{x:98,z:25}),positions=[];for(let x=farmPoint.x-8;x<=farmPoint.x+8;x+=4)for(let z=farmPoint.z-6;z<=farmPoint.z+6;z+=4)positions.push([x,z]);
    positions.forEach(([x,z],index)=>{const id=`farm-${index}`,soil=new THREE.Mesh(new THREE.BoxGeometry(3.25,.12,3.25),empty);soil.position.set(x,.13,z);soil.receiveShadow=true;group.add(soil);const crop=new THREE.Group();crop.position.set(x,.2,z);group.add(crop);for(const dx of[-.72,-.24,.24,.72])for(const dz of[-.72,0,.72]){premiumBox(.07,.72,.07,0x4b9f3e,dx,.36,dz,crop);premiumBox(.25,.19,.25,(index+Math.round(dx*10))%2?0xf0c84c:0x6fc44e,dx,.76,dz,crop);}const interactable={id:`farm-plot-${id}`,type:'farm',icon:'🌱',label:'Preparar e plantar',x,z,radius:2.25,priority:178,action:null};const plot={id,x,z,soil,crop,interactable,soilMaterials:{empty,wet}};interactable.action=()=>useFarmPlot(plot);registerInteractable(interactable);WORLD_V702.farmPlots.set(id,plot);updateFarmPlotVisual(plot);});
    createSignpost(farmPoint.x,farmPoint.z-10,'Fazenda Comunitária',Math.PI);world.worldEvolution.farming=group;return true;
  }
  function useDigSite(site){ensureWorldEvolutionState();if(!['hoe','shovel','pickaxe'].includes(state.tools.equipped)){toast('Equipe Enxada, Pá ou Picareta para cavar.','warn',1900);return;}const previous=Number(state.farming.digSites[site.id]||0),remaining=V702_DIG_COOLDOWN-(Date.now()-previous);if(remaining>0){toast(`A terra precisa descansar por ${Math.ceil(remaining/1000)} s.`,'warn',1300);return;}state.farming.digSites[site.id]=Date.now();playToolAnimation();const bait=1+Math.floor(Math.random()*3),seeds=Math.random()<.46?1:0,clay=site.biome==='shore'||site.biome==='farm'?(Math.random()<.55?1:0):0;state.inventory.bait=(state.inventory.bait||0)+bait;state.inventory.seeds=(state.inventory.seeds||0)+seeds;state.inventory.clay=(state.inventory.clay||0)+clay;state.tools.harvested.bait=(state.tools.harvested.bait||0)+bait;state.tools.harvested.clay=(state.tools.harvested.clay||0)+clay;state.stats.dugBait=(state.stats.dugBait||0)+bait;addXP(7+bait*2);saveState(true);updateHUD();toast(`Escavação: +${bait} isca${bait>1?'s':''}${seeds?`, +${seeds} semente`:''}${clay?', +1 argila':''}.`,'good',2200);}
  function createDigSites(){
    if(world.worldEvolution?.digSites)return false;const farm=worldLayoutPoint('farm'),sites=[[-47,-45,'forest'],[-62,-34,'forest'],[farm.x-7,farm.z-5,'farm'],[farm.x+7,farm.z+5,'farm'],[-65,42,'shore'],[-91,76,'shore'],[81,-36,'desert'],[104,-48,'desert']];
    for(const [x,z,biome]of sites){const id=`dig-${biome}-${x}-${z}`,mat=v702TextureMaterial(biome==='desert'?'sand':biome==='shore'?'shore':'dirt',biome==='desert'?0xdcb266:0x795333,{repeat:[2,2],roughness:.95});const patch=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.55,.08,16),mat);patch.position.set(x,groundHeightAt(x,z)+.05,z);worldGroup.add(patch);const site={id,x,z,biome,mesh:patch};WORLD_V702.digSites.set(id,site);registerInteractable({id,type:'dig',icon:'🪱',label:'Cavar por iscas e recursos',x,z,radius:2.35,priority:165,action:()=>useDigSite(site)});}
    world.worldEvolution.digSites=true;return true;
  }
  function decorateThemedCitizen(npc,theme){
    const g=npc.group,front=.34;if(theme==='shadow'){premiumBox(.78,.98,.06,0x111827,0,1.18,-.34,g);premiumBox(.82,.18,.72,0x202b45,0,2.42,0,g);premiumBox(.12,.16,.04,0x78d7ff,-.16,2.08,front+.04,g);premiumBox(.12,.16,.04,0x78d7ff,.16,2.08,front+.04,g);}
    if(theme==='web'){for(const y of[.82,1.08,1.34])premiumBox(.77,.035,.05,0xeaf5ff,0,y,.31,g);premiumBox(.18,1.0,.05,0x1e65b1,0,1.14,.33,g);}
    if(theme==='adventure'){const cap=worldAvatarMaterial(0xd84235,{roughness:.48});avatarV3Sphere(g,.58,cap,0,2.48,0,1.08,.34,1.08);premiumBox(.72,.1,.32,cap,0,2.43,.38,g);premiumBox(.58,.72,.05,0x256ac5,0,1.05,.33,g);}
    if(theme==='toy'){for(const p of[[-.48,1.2,0],[.48,1.2,0],[-.2,.62,0],[.2,.62,0]])avatarV3Sphere(g,.16,worldAvatarMaterial(0xffd39a,{roughness:.38}),...p);premiumBox(.42,.3,.14,0xffdc4d,0,1.32,.35,g);}
    if(theme==='block'){g.scale.set(1.06,1.02,1.06);premiumBox(.34,.34,.08,0x62e86b,0,1.15,.35,g);}
    npc.theme=theme;return npc;
  }
  function createThemedCitizens(){
    if(world.worldEvolution?.citizens)return false;const specs=[['nox','Nox',-8,-28,0x25365f,'shadow',3.2],['arani','Arani',16,-34,0xd9454d,'web',3.2],['tico','Tico',38,34,0xe44739,'adventure',2.8],['plim','Plim',82,-39,0xf0c743,'toy',3],['byte','Byte',82,70,0x45b7da,'block',2.8],['flora','Flora',-46,44,0x6bbf55,'toy',3.2]];
    for(const [id,name,x,z,color,theme,radius]of specs){if(world.npcs.some(n=>n.id===id))continue;const npc=decorateThemedCitizen(createNPC(id,name,x,z,color,radius),theme);WORLD_V702.citizens.push(npc);}world.worldEvolution.citizens=true;return true;
  }
  function createCameraPitchButtons(){
    if(WORLD_V702.cameraButtonsReady||!els.cameraControls)return;const add=(id,text,label)=>{let b=document.getElementById(id);if(!b){b=document.createElement('button');b.id=id;b.type='button';b.textContent=text;b.setAttribute('aria-label',label);els.cameraControls.insertBefore(b,els.cameraResetBtn||null);}return b;};
    const up=add('cameraPitchUpBtn','↑','Levantar câmera e olhar mais para baixo'),down=add('cameraPitchDownBtn','↓','Abaixar câmera e olhar para o horizonte');const change=delta=>{cameraPitch=clamp(cameraPitch+delta,-.55,1.35);state.settings.cameraPitch=+cameraPitch.toFixed(3);saveState();toast(cameraPitch<-.15?'Câmera baixa: visão do horizonte.':cameraPitch>.85?'Câmera alta: visão geral.':'Inclinação da câmera ajustada.','good',850);};
    up.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();change(.18);},{passive:false});down.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();change(-.18);},{passive:false});WORLD_V702.cameraButtonsReady=true;
  }
  function initializeWorldEvolution(){
    if(WORLD_V702.initialized||!worldGroup)return false;ensureWorldEvolutionState();createV702GroundRecovery();world.worldEvolution=world.worldEvolution||{};createDesertBiome();createMountainTerrain();createLakeDepthLayers();createFarmingSystem();createDigSites();createThemedCitizens();createCameraPitchButtons();WORLD_V702.initialized=true;document.documentElement.dataset.otthiWorld='705';document.body.classList.add('otthi-v702-world','otthi-v704-world','otthi-v705-world');setTimeout(()=>{try{world.layoutAuditRuntime=v704RuntimeWorldAudit();}catch(error){console.error('[OTTHI V704] falha na auditoria runtime',error);}},900);return true;
  }
  function updateWorldEvolution(dt){
    if(!WORLD_V702.initialized)return;WORLD_V702.waterTime+=dt;for(const layer of WORLD_V702.waterLayers){if(layer.material?.normalMap){layer.material.normalMap.offset.x=(layer.material.normalMap.offset.x+dt*.012)%1;layer.material.normalMap.offset.y=(layer.material.normalMap.offset.y+dt*.007)%1;}layer.position.y=.105+Math.sin(WORLD_V702.waterTime*1.45+layer.position.x*.01)*.018;}
    updateWorldEvolution.farmAcc=(updateWorldEvolution.farmAcc||0)+dt;if(updateWorldEvolution.farmAcc>.9){updateWorldEvolution.farmAcc=0;for(const plot of WORLD_V702.farmPlots.values())updateFarmPlotVisual(plot);}
  }
  const legacyV702InitThree=initThree;initThree=function initThreeV702(){const ok=legacyV702InitThree();if(ok)try{initializeWorldEvolution();}catch(error){console.error('[OTTHI V702] evolução em fallback',error);toast('O mundo principal foi preservado; uma melhoria visual iniciou em fallback.','warn',2600);}return ok;};
  const legacyV702Environment=updateOtthiWorldEnvironment;updateOtthiWorldEnvironment=function updateOtthiWorldEnvironmentV702(dt){legacyV702Environment(dt);updateWorldEvolution(dt);};
  createCameraPitchButtons();dbReady.then(()=>{ensureWorldEvolutionState();createCameraPitchButtons();}).catch(()=>{});
  window.OTTHI_WORLD_V702={state:()=>ensureWorldEvolutionState(),initialize:initializeWorldEvolution,terrainHeight:professionalTerrainHeightAt,farm:()=>[...WORLD_V702.farmPlots.values()].map(p=>({id:p.id,...farmPlotRecord(p.id)})),dig:()=>[...WORLD_V702.digSites.keys()],citizens:()=>WORLD_V702.citizens.map(n=>({id:n.id,name:n.name,theme:n.theme})),diagnostics:()=>({version:704,initialized:WORLD_V702.initialized,swimming:!!player.swimming,farmPlots:WORLD_V702.farmPlots.size,digSites:WORLD_V702.digSites.size,citizens:WORLD_V702.citizens.length,waterLayers:WORLD_V702.waterLayers.length})};
  if(window.OTTHOS_TEST_API)window.OTTHOS_TEST_API.worldEvolution=window.OTTHI_WORLD_V702;
