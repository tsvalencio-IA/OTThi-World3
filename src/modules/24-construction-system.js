/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 24-construction-system.js
 * Escopo: Custos, propriedade, preview, validação, colocação, remoção e reconciliação
 * Linhas de origem V642: 3645-3754
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function buildCostText(cost){const names={wood:'madeira',stone:'pedra',blocks:'bloco',fences:'cerca'};return Object.entries(cost).map(([key,value])=>`${value} ${names[key]||key}${value>1?'s':''}`).join(' + ');}
  function currentBuildOwnerIds(){return new Set(['local',state.profile?.playerId,state.account?.accountId,window.OTTHOS_RTDB?.uid].filter(Boolean).map(String));}
  function buildOwnedByPlayer(data){return !data?.ownerId||currentBuildOwnerIds().has(String(data.ownerId));}
  function buildFootprint(type,rotation=0){
    const base={block:{w:1.5,d:1.5},wall:{w:3,d:.32},floor:{w:3,d:3},fence:{w:2.4,d:.22},lamp:{w:.9,d:.9},bench:{w:2.3,d:.85},planter:{w:2.3,d:.95}}[type]||{w:1.5,d:1.5};
    return Math.abs(Math.sin(Number(rotation||0)))>.7?{w:base.d,d:base.w}:{...base};
  }
  function buildNeedsWorldMigrationV704(data){
    const footprint=buildFootprint(data?.type,data?.rotation),rect={x:Number(data?.x),z:Number(data?.z),w:footprint.w,d:footprint.d};if(!Number.isFinite(rect.x)||!Number.isFinite(rect.z))return true;
    if(typeof v704RoadAt==='function'){const corners=[[rect.x-rect.w/2,rect.z-rect.d/2],[rect.x+rect.w/2,rect.z-rect.d/2],[rect.x-rect.w/2,rect.z+rect.d/2],[rect.x+rect.w/2,rect.z+rect.d/2]];if(corners.some(([x,z])=>v704RoadAt(x,z,.25,true)))return true;}
    if(typeof v704ProtectedRectangles==='function'&&v704ProtectedRectangles().some(item=>item.kind!=='construction'&&v704RectOverlap(rect,item,.35)))return true;
    if(typeof waterAt==='function'&&[[rect.x-rect.w/2,rect.z-rect.d/2],[rect.x+rect.w/2,rect.z-rect.d/2],[rect.x-rect.w/2,rect.z+rect.d/2],[rect.x+rect.w/2,rect.z+rect.d/2]].some(([x,z])=>waterAt(x,z)))return true;
    return false;
  }
  function migrateWorldBuildsToSafeZoneV704(){
    if(!Array.isArray(state.builds)||!state.builds.length)return{migrated:0};let migrated=0,slotIndex=0;const occupied=[];
    state.builds=state.builds.map(raw=>{const data=normalizeBuildRecord(raw);if(!data||!buildNeedsWorldMigrationV704(data)){if(data){const size=buildFootprint(data.type,data.rotation);occupied.push({x:data.x,z:data.z,w:size.w,d:size.d});}return data||raw;}
      const size=buildFootprint(data.type,data.rotation);let target=null;for(let tries=0;tries<48;tries++){const candidate=v704NearestConstructionSlot(slotIndex++);const rect={x:candidate.x,z:candidate.z,w:size.w,d:size.d};if(v704BuildAllowedAt(rect.x,rect.z,rect.w,rect.d)&&!occupied.some(other=>v704RectOverlap(rect,other,.3))){target=candidate;occupied.push(rect);break;}}
      if(!target)return data;const now=Date.now();migrated++;return{...data,x:target.x,z:target.z,updatedAt:now,layoutVersion:704,layoutMigratedAt:now,layoutMigratedFrom:{x:data.x,z:data.z}};
    }).filter(Boolean);
    if(migrated){state.worldLayout={version:704,migratedAt:Date.now(),migratedBuilds:migrated};saveState(true);console.info(`[OTTHI V704] ${migrated} construções antigas foram realocadas sem exclusão.`);}return{migrated};
  }
  function buildPlacementCandidate(){
    if(!buildMode)return null;const distance=['wall','fence','bench','planter'].includes(buildMode)?2.8:2.45;
    const x=Math.round((player.x+Math.sin(player.facing)*distance)*2)/2,z=Math.round((player.z+Math.cos(player.facing)*distance)*2)/2;
    const rotation=((buildRotation%(Math.PI*2))+(Math.PI*2))%(Math.PI*2),y=groundHeightAt(x,z);
    return{x,z,y,rotation,valid:canBuildAt(x,z,buildMode,rotation)};
  }
  function canBuildAt(x,z,type=buildMode,rotation=buildRotation){
    if(!Number.isFinite(x)||!Number.isFinite(z)||!type)return false;const footprint=buildFootprint(type,rotation),rect={x,z,w:footprint.w,d:footprint.d};
    const corners=[[x-footprint.w/2,z-footprint.d/2],[x+footprint.w/2,z-footprint.d/2],[x-footprint.w/2,z+footprint.d/2],[x+footprint.w/2,z+footprint.d/2]];
    if(corners.some(([cx,cz])=>waterAt(cx,cz)))return false;
    const heights=corners.map(([cx,cz])=>groundHeightAt(cx,cz));if(Math.max(...heights)-Math.min(...heights)>.72)return false;
    const publicZone=typeof v704BuildAllowedAt==='function'&&v704BuildAllowedAt(x,z,footprint.w,footprint.d),ownedLot=world.houses.some(h=>state.houses[h.id]?.owned&&Math.abs(x-h.x)<10&&Math.abs(z-h.z)<10);if(!publicZone&&!ownedLot)return false;
    if(typeof v704RoadAt==='function'&&corners.some(([cx,cz])=>v704RoadAt(cx,cz,.2,true)))return false;
    if(typeof v704ProtectedRectangles==='function'){for(const protectedRect of v704ProtectedRectangles()){if(protectedRect.kind==='house'||protectedRect.kind==='construction')continue;if(rectOverlap(rect,protectedRect,.35))return false;}}
    if(world.hazards.some(h=>Number.isFinite(h.w)&&Number.isFinite(h.d)&&rectOverlap(rect,h,.2)))return false;
    if(world.colliders.some(c=>rectOverlap(rect,{x:c.x,z:c.z,w:c.w,d:c.d},.22)))return false;
    if(world.builds.some(b=>{const size=buildFootprint(b.data.type,b.data.rotation);return rectOverlap(rect,{x:b.data.x,z:b.data.z,w:size.w,d:size.d},.18);} ))return false;
    return true;
  }
  function createBuildPreviewMesh(type){
    if(!window.THREE||!worldGroup)return null;const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:0x64ef78,transparent:true,opacity:.42,depthWrite:false,depthTest:true});
    const part=(w,h,d,x,y,z)=>{const mesh=new THREE.Mesh(sharedBoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.renderOrder=990;mesh.frustumCulled=false;group.add(mesh);return mesh;};
    if(type==='block')part(1.5,1.5,1.5,0,.75,0);
    else if(type==='wall')part(3,2.4,.32,0,1.2,0);
    else if(type==='floor')part(3,.28,3,0,.14,0);
    else if(type==='fence'){part(2.4,.18,.22,0,.32,0);for(const x of [-1.0,0,1.0])part(.16,1.05,.16,x,.52,0);}
    else if(type==='bench'){part(2.2,.22,.65,0,.62,0);part(2.2,.74,.18,0,1.02,-.27);for(const x of [-.8,.8])part(.14,.55,.14,x,.28,0);}
    else if(type==='planter'){part(2.2,.55,.86,0,.28,0);part(1.82,.18,.58,0,.58,0);for(const x of [-.65,0,.65]){part(.09,.5,.09,x,.92,0);part(.42,.18,.42,x,1.15,0);}}
    else{part(.22,2.4,.22,0,1.2,0);part(.65,.65,.65,0,2.65,0);}
    group.userData.previewMaterial=material;group.userData.previewType=type;worldGroup.add(group);return group;
  }
  function disposeBuildPreview(){
    if(!buildPreview)return;worldGroup?.remove(buildPreview);const material=buildPreview.userData?.previewMaterial;material?.dispose?.();buildPreview=null;buildPlacement=null;
  }
  function ensureBuildPanel(){
    if(buildPanel)return buildPanel;buildPanel=document.createElement('section');buildPanel.id='buildControlPanel';buildPanel.className='build-control-panel';buildPanel.hidden=true;buildPanel.setAttribute('aria-label','Controles da construção');
    buildPanel.innerHTML='<div class="build-control-copy"><b data-build-panel-name>Construção</b><span data-build-panel-cost></span><small data-build-panel-status></small></div><div class="build-control-actions"><button type="button" data-build-rotate>↻<span>Girar</span></button><button type="button" class="confirm" data-build-confirm>✓<span>Colocar</span></button><button type="button" class="cancel" data-build-cancel>×<span>Cancelar</span></button></div>';
    document.body.appendChild(buildPanel);buildPanel.querySelector('[data-build-rotate]').onclick=rotateBuildPreview;buildPanel.querySelector('[data-build-confirm]').onclick=placeBuild;buildPanel.querySelector('[data-build-cancel]').onclick=()=>endBuildMode('cancelled');return buildPanel;
  }
  function updateBuildPanel(){
    const panel=ensureBuildPanel(),recipe=BUILD_RECIPES[buildMode];panel.hidden=!buildMode;if(!buildMode||!recipe)return;
    panel.querySelector('[data-build-panel-name]').textContent=`${recipe.icon} ${recipe.name}`;panel.querySelector('[data-build-panel-cost]').textContent=buildCostText(recipe.cost);
    const status=panel.querySelector('[data-build-panel-status]'),enough=resourcesEnough(recipe.cost),valid=!!buildPlacement?.valid;status.textContent=!enough?'Materiais insuficientes':valid?'Local permitido • confirme para construir':'Local bloqueado • mova o personagem ou gire';status.className=valid&&enough?'good':'bad';panel.querySelector('[data-build-confirm]').disabled=!valid||!enough;
  }
  function updateBuildPreview(force=false){
    if(!buildMode)return;const candidate=buildPlacementCandidate();if(!candidate)return;
    if(!buildPreview||buildPreview.userData?.previewType!==buildMode){disposeBuildPreview();buildPreview=createBuildPreviewMesh(buildMode);}
    buildPlacement=candidate;if(buildPreview){buildPreview.position.set(candidate.x,candidate.y+.025,candidate.z);buildPreview.rotation.y=candidate.rotation;const material=buildPreview.userData.previewMaterial;material.color.setHex(candidate.valid?0x64ef78:0xff5266);material.opacity=candidate.valid?.44:.36;}
    if(force||!updateBuildPreview.last||Math.hypot(candidate.x-updateBuildPreview.last.x,candidate.z-updateBuildPreview.last.z)>.01||candidate.rotation!==updateBuildPreview.last.rotation||candidate.valid!==updateBuildPreview.last.valid){updateBuildPreview.last={...candidate};updateBuildPanel();}
  }
  function beginBuildMode(type){
    if(!BUILD_RECIPES[type])return false;if(player.vehicle||player.boating||player.transit.mode||fishingSession||currentHouse){toast('Finalize a atividade atual antes de construir.','warn');return false;}
    disposeBuildPreview();buildMode=type;buildRotation=Math.round(player.facing/(Math.PI/2))*(Math.PI/2);els.buildTypeLabel.textContent=BUILD_RECIPES[type].name;els.buildBadge.hidden=true;ensureBuildPanel().hidden=false;updateBuildPreview(true);updateVehicleControlsUI();updateContext(true);toast('Prévia ativa: mova-se, gire e confirme.','good',1900);return true;
  }
  function endBuildMode(reason='cancelled',silent=false){
    if(!buildMode&&!buildPreview)return false;disposeBuildPreview();buildMode=null;buildRotation=0;updateBuildPreview.last=null;if(buildPanel)buildPanel.hidden=true;els.buildBadge.hidden=true;updateVehicleControlsUI();updateContext(true);if(!silent&&reason==='cancelled')toast('Construção cancelada sem gastar materiais.','good',1400);return true;
  }
  function rotateBuildPreview(){if(!buildMode)return false;buildRotation=(buildRotation+Math.PI/2)%(Math.PI*2);updateBuildPreview(true);vibrate(12);return true;}
  function openBuildMenu(){
    if(player.vehicle||player.boating||player.transit.mode||fishingSession){toast('Finalize o transporte ou a atividade atual antes de construir.','warn');return false;}
    openModal('Construção Minecraft Kids',`<p>Escolha um objeto. Depois você verá a prévia real no terreno para girar, confirmar ou cancelar sem gastar materiais.</p><div class="choice-grid build-catalog">${Object.entries(BUILD_RECIPES).map(([type,item])=>`<button class="choice" data-type="${type}"><b>${item.icon} ${item.name}</b><span>${item.description}<br><strong>${buildCostText(item.cost)}</strong></span></button>`).join('')}<button class="choice" data-type="extension"><b>🏠 Ampliar casa</b><span>Adicionar um cômodo modular</span></button><button class="choice" data-type="remove"><b>🧹 Remover</b><span>Remove somente uma construção sua, após confirmação</span></button></div><div class="modal-actions"><button class="btn" data-cancel>Fechar</button></div>`,root=>{
      $$('[data-type]',root).forEach(btn=>btn.onclick=async()=>{const type=btn.dataset.type;if(type==='remove'){closeModal();await removeNearestBuild();return;}if(type==='extension'){openHouseExtensionMenu();return;}closeModal();beginBuildMode(type);});
      $('[data-cancel]',root).onclick=closeModal;
    });
  }
  function placeBuild(){
    if(!buildMode||player.vehicle||player.boating||player.transit.mode||currentHouse){toast('Saia do transporte ou interior para construir.','warn');return false;}
    updateBuildPreview(true);const placement=buildPlacement;if(!placement?.valid){toast('Local bloqueado. Mova-se até um terreno livre e observe a prévia verde.','warn');return false;}
    const recipe=BUILD_RECIPES[buildMode];if(!recipe)return false;if(!resourcesEnough(recipe.cost)){toast(`Faltam materiais: ${buildCostText(recipe.cost)}.`,'warn');updateBuildPanel();return false;}
    const before={};for(const[key,value]of Object.entries(recipe.cost)){before[key]=state.inventory[key];state.inventory[key]-=value;}
    const now=Date.now(),data=normalizeBuildRecord({id:uid(),type:buildMode,ownerId:window.OTTHOS_RTDB?.uid||state.profile?.accountId||state.profile?.playerId||'local',houseId:world.houses.find(h=>state.houses[h.id]?.owned&&Math.abs(placement.x-h.x)<10&&Math.abs(placement.z-h.z)<10)?.id||'',x:placement.x,z:placement.z,rotation:placement.rotation,createdAt:now,updatedAt:now});
    try{
      state.buildTombstones=normalizeBuildTombstones(state.buildTombstones).filter(item=>item.id!==data.id);state.builds=mergeBuildCollections(state.builds,[data],state.buildTombstones);const record=spawnBuild(data,true);if(!record)throw new Error('Objeto não foi criado no mundo');
      addXP(12);evaluateMissions();checkActiveJob();saveState(true).finally(()=>syncCloudProgress(true));toast(`${recipe.name} colocado e salvo!`,'good',1900);updateBuildPreview(true);return true;
    }catch(error){state.builds=state.builds.filter(b=>b.id!==data.id);for(const[key,value]of Object.entries(before))state.inventory[key]=value;console.error('[OTTHOS] Falha ao construir; recursos restaurados.',error);toast('Não foi possível construir. Seus recursos foram restaurados.','bad');updateBuildPanel();return false;}
  }
  function spawnBuild(rawData,persist=false){
    const data=normalizeBuildRecord(rawData);if(!data||!worldGroup)return null;const existing=world.builds.find(item=>item.data.id===data.id);if(existing)return existing;
    let mesh,extras=[];const rotation=Number(data.rotation||0),quarter=Math.abs(Math.sin(rotation))>.7,oriented=(w,d)=>quarter?{w:d,d:w}:{w,d},baseY=groundHeightAt(data.x,data.z);
    if(data.type==='block'){mesh=box(1.5,1.5,1.5,materials.brick,data.x,baseY+.75,data.z);registerPlatform(data.x,data.z,1.5,1.5,baseY+1.5,{buildId:data.id});registerCollider(data.x,data.z,1.5,1.5,{buildId:data.id});}
    else if(data.type==='fence'){mesh=box(2.4,1.05,.22,materials.wood,data.x,baseY+.52,data.z);mesh.rotation.y=rotation;const size=oriented(2.4,.22);registerCollider(data.x,data.z,size.w,size.d,{buildId:data.id});}
    else if(data.type==='wall'){mesh=box(3.0,2.4,.32,materials.stone,data.x,baseY+1.2,data.z);mesh.rotation.y=rotation;const size=oriented(3,.32);registerCollider(data.x,data.z,size.w,size.d,{buildId:data.id});}
    else if(data.type==='floor'){mesh=box(3.0,.28,3.0,materials.wood,data.x,baseY+.14,data.z);mesh.rotation.y=rotation;registerPlatform(data.x,data.z,3,3,baseY+.28,{buildId:data.id});}
    else if(data.type==='bench'){mesh=new THREE.Group();mesh.position.set(data.x,baseY,data.z);mesh.rotation.y=rotation;worldGroup.add(mesh);premiumBox(2.2,.22,.65,materials.fabric,0,.62,0,mesh);premiumBox(2.2,.74,.18,materials.fabric,0,1.02,-.27,mesh);for(const ox of [-.8,.8])premiumBox(.14,.55,.14,materials.metal,ox,.28,0,mesh);const size=oriented(2.3,.85);registerCollider(data.x,data.z,size.w,size.d,{buildId:data.id});}
    else if(data.type==='planter'){mesh=new THREE.Group();mesh.position.set(data.x,baseY,data.z);mesh.rotation.y=rotation;worldGroup.add(mesh);premiumBox(2.2,.55,.86,materials.brick,0,.28,0,mesh);premiumBox(1.82,.18,.58,0x5f371f,0,.58,0,mesh);for(const p of [[-.65,0xff6fa8],[0,0xffd74a],[.65,0x67d965]]){premiumBox(.09,.5,.09,0x3d8c3f,p[0],.92,0,mesh);premiumBox(.46,.18,.46,p[1],p[0],1.15,0,mesh);}const size=oriented(2.3,.95);registerCollider(data.x,data.z,size.w,size.d,{buildId:data.id});}
    else if(data.type==='lamp'){mesh=new THREE.Group();mesh.position.set(data.x,baseY,data.z);worldGroup.add(mesh);box(.22,2.4,.22,materials.wood,0,1.2,0,mesh);box(.65,.65,.65,0xffdc6a,0,2.65,0,mesh);extras.push(addGlow(data.x,baseY+2.65,data.z,0xffd56a,4));registerCollider(data.x,data.z,.55,.55,{buildId:data.id});}
    else return null;
    mesh.userData.buildId=data.id;mesh.userData.buildType=data.type;const record={data:{...data,groundY:baseY},mesh,extras,signature:buildRecordSignature(data)};world.builds.push(record);return record;
  }
  function buildRecordSignature(data){return [data.id,data.type,Number(data.x).toFixed(2),Number(data.z).toFixed(2),Number(data.rotation||0).toFixed(3),Number(data.updatedAt||data.createdAt||0)].join('|');}
  function removeWorldBuildRecord(record){
    if(!record)return;worldGroup?.remove(record.mesh);for(const extra of record.extras||[]){worldGroup?.remove(extra);world.glows=world.glows.filter(item=>item!==extra);}world.colliders=world.colliders.filter(c=>c.buildId!==record.data.id);world.platforms=world.platforms.filter(p=>p.buildId!==record.data.id);world.builds=world.builds.filter(item=>item!==record);
  }

  function buildConflictsWithMasterWorldV704(data){
    if(!data||typeof v704RectOverlap!=='function')return false;const size=buildFootprint(data.type,data.rotation),rect={x:Number(data.x),z:Number(data.z),w:size.w,d:size.d};
    if(WORLD_LAYOUT_V704.roads.some(road=>v704RectOverlap(rect,v704RoadFootprint(road,true),.25)))return true;
    for(const protectedRect of v704ProtectedRectangles()){if(protectedRect.kind==='house'||protectedRect.kind==='construction')continue;if(v704RectOverlap(rect,protectedRect,.35))return true;}
    if((world.hazards||[]).some(h=>Number.isFinite(h.w)&&v704RectOverlap(rect,h,.2)))return true;return false;
  }
  function migrateLegacyWorldBuildsV704(){
    if(!Array.isArray(state.builds)||typeof v704NearestConstructionSlot!=='function')return 0;let moved=0,slotIndex=0;const occupied=[];
    for(const data of state.builds){if(!buildConflictsWithMasterWorldV704(data))continue;let slot,size=buildFootprint(data.type,data.rotation);do{slot=v704NearestConstructionSlot(slotIndex++);}while(slotIndex<80&&occupied.some(other=>rectOverlap({x:slot.x,z:slot.z,w:size.w,d:size.d},other,.35)));data.legacyPositionV704=data.legacyPositionV704||{x:Number(data.x),z:Number(data.z)};data.x=slot.x;data.z=slot.z;data.y=groundHeightAt(slot.x,slot.z);data.worldLayoutVersion=704;occupied.push({x:data.x,z:data.z,w:size.w,d:size.d});moved++;}
    if(moved){state.worldMigrationV704={version:704,moved,at:Date.now()};console.warn(`[OTTHI V704] ${moved} construção(ões) antigas foram realocadas da pista/rua para a área de construção.`);saveState(true);}return moved;
  }
  function reconcileWorldBuilds(){
    if(!worldGroup||!world?.builds)return false;migrateLegacyWorldBuildsV704();state.buildTombstones=normalizeBuildTombstones(state.buildTombstones);state.builds=applyBuildTombstones(state.builds,state.buildTombstones);const wanted=new Map(state.builds.map(data=>[data.id,data]));
    for(const record of [...world.builds]){const data=wanted.get(record.data.id);if(!data||record.signature!==buildRecordSignature(data)){removeWorldBuildRecord(record);}}
    for(const data of state.builds)if(!world.builds.some(record=>record.data.id===data.id))spawnBuild(data,false);return true;
  }
  async function removeNearestBuild(){
    const nearest=world.builds.filter(b=>buildOwnedByPlayer(b.data)&&distance2D(player,b.data)<3.4).sort((a,b)=>distance2D(player,a.data)-distance2D(player,b.data))[0];if(!nearest){toast('Nenhuma construção sua por perto.','warn');return false;}
    const recipe=BUILD_RECIPES[nearest.data.type],ok=await confirmModal('Remover construção',`Remover ${recipe?.name||'esta construção'}? A ação será salva e não afetará objetos de outros jogadores.`,'Remover','Cancelar');if(!ok)return false;
    const removedAt=Date.now();state.buildTombstones=mergeBuildTombstones(state.buildTombstones,[{id:nearest.data.id,removedAt}]);state.builds=applyBuildTombstones(state.builds,state.buildTombstones);removeWorldBuildRecord(nearest);saveState(true).finally(()=>syncCloudProgress(true));toast('Construção removida e alteração salva.','good');return true;
  }
  els.buildBtn.onclick=openBuildMenu;

