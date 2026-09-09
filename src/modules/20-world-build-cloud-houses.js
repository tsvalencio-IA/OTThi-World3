/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 20-world-build-cloud-houses.js
 * Escopo: Construção do mundo, recursos, baús, casas em nuvem e interiores
 * Linhas de origem V642: 3097-3240
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function createLifeExpansionWorld(){createLakeExpansion();createCampfireZone();createHuntingArea();restoreLifeExpansion();applyCloudWorldObjects();}
  function createTioThiagoWorkshop(workshop){
    if(!workshop)return null;const tio=createNPC('tio-thiago','Tio Thiago',workshop.x+4.55,workshop.z+1.90,0x111318,1);if(typeof applyTioThiagoReferenceSkin==='function')applyTioThiagoReferenceSkin(tio);tio.stationary=true;tio.stationaryHeading=Math.PI;tio.group.rotation.y=Math.PI;tio.group.position.y=0;
    // A oficina agora é um barracão aberto no próprio mundo: Tio Thiago fica visível por distância, sem modo-interior paralelo.
    tio.interiorOnlyHouseId='';tio.group.visible=true;const action=world.interactables.find(it=>it.id==='npc-tio-thiago');if(action){action.type='workshop';action.icon='👨‍🔧';action.label='Tio Thiago • Oficina';action.radius=3.6;action.priority=390;delete action.houseId;action.getPos=()=>({x:tio.group.position.x,z:tio.group.position.z});}
    return tio;
  }
  function createWorkshopMechanic(workshop){
    if(!workshop)return null;const mechanic=createNPC('mecanico-oficina','Mecânico da Oficina',workshop.x+4.65,workshop.z-2.35,0x176b91,1);mechanic.stationary=true;mechanic.stationaryHeading=Math.PI/2;mechanic.group.rotation.y=Math.PI/2;mechanic.group.position.y=0;mechanic.workshopMechanic=true;mechanic.workshopHome={x:mechanic.group.position.x,z:mechanic.group.position.z,heading:mechanic.stationaryHeading};mechanic.interiorOnlyHouseId='';mechanic.group.visible=true;
    const limbs=mechanic.limbs||{};if(limbs.leftArm)limbs.leftArm.name='workshop-mechanic-left-arm';if(limbs.rightArm)limbs.rightArm.name='workshop-mechanic-right-arm';if(limbs.leftLeg)limbs.leftLeg.name='workshop-mechanic-left-leg';if(limbs.rightLeg)limbs.rightLeg.name='workshop-mechanic-right-leg';
    if(limbs.rightArm&&typeof premiumBox==='function'&&typeof premiumCylinder==='function'){const belt=new THREE.Group();belt.name='workshop-mechanic-toolbelt';mechanic.group.add(belt);premiumBox(.72,.13,.48,0x20252b,0,.95,0,belt);premiumBox(.16,.28,.10,0xf2b93b,-.24,.78,.24,belt);premiumBox(.16,.22,.10,0xc9d3dc,.25,.82,.24,belt);const wrench=new THREE.Group();wrench.name='workshop-mechanic-wrench';wrench.visible=false;limbs.rightArm.add(wrench);const handle=premiumCylinder(.045,.52,0xd5dde5,0,-.83,.02,wrench,8);handle.rotation.z=Math.PI/2;premiumBox(.20,.07,.06,0xd5dde5,.25,-.83,.02,wrench);premiumBox(.20,.07,.06,0xd5dde5,-.25,-.83,.02,wrench);}
    const action=world.interactables.find(it=>it.id==='npc-mecanico-oficina');if(action){action.type='workshop';action.icon='🔧';action.label='Mecânico da Oficina • acompanhar serviço';action.radius=3.4;action.priority=388;action.action=()=>openWorkshopServiceDesk();action.getPos=()=>({x:mechanic.group.position.x,z:mechanic.group.position.z});}
    world.workshopMechanic=mechanic;return mechanic;
  }
  function migrateWorkshopWallParkingR1678(){
    const parked=state.vehicles?.parked;if(!parked||typeof parked!=='object')return 0;let moved=0,redMigrated=false;
    const red=parked['workshop-red'],redX=Number(red?.x),redZ=Number(red?.z);
    if(red&&Number.isFinite(redX)&&Number.isFinite(redZ)&&Math.abs(redX-31)<=1.05&&Math.abs(redZ+13)<=1.05){red.x=33.4;red.z=-13.2;red.heading=-Math.PI/2;const record=state.vehicles?.workshopComponents?.['workshop-red'];if(record)record.yardStatus=record.yardStatus||'pending';moved++;redMigrated=true;}
    const towSlot=index=>{const row=index%2,col=Math.floor(index/2);return{x:33.4+col*4.15,z:-19.9+row*3.8};};let slotIndex=0;
    for(const [id,pose] of Object.entries(parked)){
      if(!pose||redMigrated&&id==='workshop-red')continue;const x=Number(pose.x),z=Number(pose.z);
      if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x-29)>.95||Math.abs(z+19)>.95)continue;
      // Cada registro legado recebe uma posição temporária própria. Antes, o índice
      // parava na quarta vaga e todos os veículos seguintes nasciam sobrepostos nela.
      const slot=towSlot(slotIndex);pose.x=slot.x;pose.z=slot.z;pose.heading=Math.PI/2;const record=state.vehicles?.workshopComponents?.[id];if(record)record.yardStatus=record.yardStatus||'pending';slotIndex++;moved++;
    }
    if(moved&&typeof saveState==='function')saveState(true);return moved;
  }
  function buildWorld(){
    worldGroup=new THREE.Group();scene.add(worldGroup);
    const worldSize=v704WorldSize(),ground=stableBox(worldSize.w+8,.3,worldSize.d+8,materials.grass,0,-.15,0,worldGroup,0);ground.receiveShadow=false;
    createSkyDome();scene.background=new THREE.Color(0x79cfff);scene.fog=new THREE.Fog(0xbce8ff,235,560);
    const P=(id,fallback={x:0,z:0})=>worldLayoutPoint(id,fallback),L=WORLD_LAYOUT_V704;

    // Uma única fonte de verdade cria todas as ruas. Nenhum módulo paralelo desenha vias alternativas.
    for(const road of L.roads)createRoad(road.x,road.z,road.w,road.d);
    createDistrictVisuals();createLearningPlaza();createOttoviasWorld();

    // A represa usa a geometria oficial do layout e permanece fisicamente separada da via.
    const lake=worldLayoutRect('lake'),lakeNorth=worldLayoutRect('lakeNorth');createReservoirBasin(lake,lakeNorth);
    for(let i=-5;i<=5;i++){const part=box(2.1,.35,5,materials.wood,-12+i*2.15,.25,52);world.bridgeParts.push(part);registerPlatform(-12+i*2.15,52,2.1,5,.43,{bridgePart:i+5});}
    const lava=P('lava');createLava(lava.x,lava.z,26,20);

    // Vegetação apenas em áreas livres: não nasce sobre ruas, pistas, quadras, fazenda ou kartódromo.
    for(let i=0,created=0;i<180&&created<48;i++){
      const x=-94+(Math.random()-.5)*58,z=-54+(Math.random()-.5)*80;
      if(v704ReservedAt(x,z,2.4)||v704PersonalHomeLotAt(x,z,2.4)||Math.abs(x+68)<11&&Math.abs(z+18)<11||Math.abs(x+92)<14&&Math.abs(z+92)<13)continue;
      createTree(x,z,.75+Math.random()*.55,true);created++;
    }
    for(let i=0,created=0;i<90&&created<18;i++){
      const x=-44+(Math.random()-.5)*60,z=-95+(Math.random()-.5)*42;if(v704ReservedAt(x,z,1.8)||v704PersonalHomeLotAt(x,z,1.8))continue;createRock(x,z,.7+Math.random()*.6,true);created++;
    }
    for(let i=0,created=0;i<320&&created<80;i++){
      const x=(Math.random()-.5)*218,z=(Math.random()-.5)*218;if(v704ReservedAt(x,z,1.2)||v704PersonalHomeLotAt(x,z,1.2))continue;createFlower(x,z,Math.random()>.5?0xff74c9:0xffdf55);created++;
    }

    // Casas e serviços usam os mesmos pontos usados pelo mapa, GPS e missões.
    const hp=P('home'),bp=P('blue'),pp=P('pink'),cp=P('cabin'),sp=P('shop'),wp=P('workshop'),sc=P('school'),se=P('schoolEast'),ps=P('police'),pw=P('policeWest'),fs=P('fireStation');
    const homeLot=otthiPersonalHomeLot(),homePalette=[0xc4843e,0x4f8fc7,0x6f9f56,0xc96f73,0x8c6ac4,0xd29b48,0x4d9f93,0x9b7354,0x4c78a7,0xb36a92],roofPalette=[0x704b25,0x294e70,0x3d6131,0x784042,0x503c76,0x77572a,0x2c6159,0x5c4434,0x2c4667,0x693d55],homeColor=homePalette[homeLot.index%homePalette.length];const home=createHouse({id:'home',name:`Casa de ${playerDisplayName()}`,x:hp.x,z:hp.z,color:homeColor,roofColor:roofPalette[homeLot.index%roofPalette.length]});home.userData={personalLot:homeLot.index,ownerIdentity:otthiHomeIdentity()};addHouseInterior(home,'home');
    const blue=createHouse({id:'blue',name:'Casa Azul',x:bp.x,z:bp.z,color:0x4f9fd7,roofColor:0x225fa5,price:250});addHouseInterior(blue,'neighbor');
    const pink=createHouse({id:'pink',name:'Casa Rosa',x:pp.x,z:pp.z,color:0xe58aae,roofColor:0xb63871,price:420});addHouseInterior(pink,'neighbor');
    const cabin=createHouse({id:'cabin',name:'Cabana da Floresta',x:cp.x,z:cp.z,color:0x7e4a28,roofColor:0x4d2b1c,price:180});addHouseInterior(cabin,'neighbor');
    const shop=createHouse({id:'shop',name:'Mercadinho',x:sp.x,z:sp.z,color:0xf1b83e,roofColor:0xc83a2f,publicBuilding:true});addHouseInterior(shop,'shop');
    const workshop=createHouse({id:'workshop',name:'SOS Valêncio • Centro Automotivo',x:wp.x,z:wp.z,color:0x242a30,roofColor:0x101419,publicBuilding:true});addHouseInterior(workshop,'workshop');world.workshop=workshop;
    const school=createHouse({id:'school',name:'Escola Vila do Sol',x:sc.x,z:sc.z,color:0xf2c64e,roofColor:0x2f7fd8,publicBuilding:true});addHouseInterior(school,'school');world.school=school;
    const schoolEast=createHouse({id:'school-east',name:'Escola Horizonte',x:se.x,z:se.z,color:0xe9d68f,roofColor:0x2f7fd8,publicBuilding:true});addHouseInterior(schoolEast,'school');world.schools=[school,schoolEast];
    const policeStation=createHouse({id:'police',name:'Delegacia Central',x:ps.x,z:ps.z,color:0xe8edf3,roofColor:0x245da8,publicBuilding:true});addHouseInterior(policeStation,'police');world.policeStation=policeStation;
    const policeWest=createHouse({id:'police-west',name:'Posto Policial do Bairro',x:pw.x,z:pw.z,color:0xdfeaf2,roofColor:0x245da8,publicBuilding:true});addHouseInterior(policeWest,'police');world.policeStations=[policeStation,policeWest];
    const fireStation=createHouse({id:'fire-station',name:'Corpo de Bombeiros',x:fs.x,z:fs.z,color:0xc83e3c,roofColor:0x3d4652,publicBuilding:true});addHouseInterior(fireStation,'firestation');world.fireStation=fireStation;
    if(typeof createPlayerGarageWorld==='function')createPlayerGarageWorld();
    const mine=P('mine'),well=P('well'),foundry=P('foundry');createGoldMine(mine.x,mine.z);createVillageWell(well.x,well.z);createGoldFoundry(foundry.x,foundry.z);

    createFenceLine(-36,26,-15,26,9);createFenceLine(15,26,36,26,9);for(const p of [[-9,9],[9,9],[-33,8],[33,8],[-10,-7],[10,-7]])createLamp(p[0],p[1]);

    // NPCs and their routes stay on pavements/roads from the master graph.
    const nino=createNPC('nino','Nino',4,3,0xffd84d,4),luna=createNPC('luna','Luna',-22,8,0xff72b6,4),teo=createNPC('teo','Teo',22,7,0x54c7ff,4),bia=createNPC('bia','Bia',-10,-10,0x8ee15c,3),maya=createNPC('maya','Maya',68,42,0xa66bff,3),clara=createNPC('clara','Clara',-66,-10,0xf0b62d,2),rafa=createNPC('rafa','Rafa',66,-10,0x2f7fd8,2),davi=createNPC('davi','Davi',66,-60,0xe54843,2),leo=createNPC('leo','Leo',34,58,0x38a66a,2);
    const tioThiago=createTioThiagoWorkshop(workshop);world.tioThiago=tioThiago;createWorkshopMechanic(workshop);
    createNpcMobility(clara,'bike',[[-66,-10],[-55,-10],[-55,0],[-66,0]],2.7);createNpcMobility(rafa,'moto',[[66,-10],[65,-10],[65,0],[76,0]],3.8);createNpcMobility(davi,'car',[[66,-60],[65,-60],[65,-18],[76,-18]],4.1);createNpcMobility(leo,'skate',[[34,58],[52,58],[68,58],[68,45]],3.0);
    createNpcMobility(nino,'bike',[[4,3],[4,10],[-18,10],[-18,0],[4,0]],3.2);createNpcMobility(luna,'skate',[[-22,8],[-34,8],[-34,0],[-12,0],[-12,8]],2.8);createNpcMobility(teo,'moto',[[22,7],[8,7],[8,-12],[35,-12],[35,7]],4.7);createNpcMobility(bia,'bike',[[-10,-10],[-10,0],[-48,0],[-48,-10]],3.4);createNpcMobility(maya,'car',[[68,42],[68,22],[65,0],[88,0],[88,42]],4.5);

    // Recupera somente os saves antigos gravados dentro da parede da oficina.
    migrateWorkshopWallParkingR1678();
    // Veículos estacionados em vagas livres, nunca sobre quadras/pistas/prédios.
    const homeGarage=P('homeGarage');createToyCar(homeGarage.x+.5,homeGarage.z-2.8,{id:'garage-orange',label:'LEGO • Carro pequeno',primary:0xf28a22,secondary:0x0aa7b8,heading:Math.PI/2,theme:'lego',bodyType:'small',kind:'car'});
    createToyCar(-31,-13,{id:'market-blue',label:'Minecraft / Manycraft • Carro',primary:0x3b8f52,secondary:0x456b9a,heading:Math.PI/2,theme:'minecraft',bodyType:'small',kind:'car'});
    createToyCar(33.4,-13.2,{id:'workshop-red',label:'Mario World • Kart pequeno',primary:0xd83b35,secondary:0x245fc0,heading:-Math.PI/2,theme:'mario-world',bodyType:'small',kind:'car'});
    createToyCar(14,35,{id:'home-green',label:'LEGO • Utilitário',primary:0x31a76a,secondary:0xf1c943,heading:Math.PI,theme:'lego',bodyType:'utility',kind:'utility'});
    createToyCar(76,31,{id:'royal-purple',label:'Mario World • Caminhão',primary:0x7d58c9,secondary:0xd83b35,theme:'mario-world',bodyType:'truck',kind:'truck'});
    createToyCar(78,68,{id:'gym-yellow',label:'Minecraft / Manycraft • Utilitário',primary:0x6b7f45,secondary:0xad7d3a,heading:Math.PI,theme:'minecraft',bodyType:'utility',kind:'utility'});
    createToyCar(-78,-15,{id:'forest-teal',label:'Playmobil • Caminhão',primary:0x168f88,secondary:0xf0c94a,heading:Math.PI/2,theme:'playmobil',bodyType:'truck',kind:'truck'});
    createToyCar(14,-13,{id:'city-white',label:'Playmobil • Carro pequeno',primary:0xf2f4f6,secondary:0x2f7fd8,heading:-Math.PI/2,theme:'playmobil',bodyType:'small',kind:'car'});
    createToyCar(-44,-13,{id:'adventure-black',label:'Mario World • Utilitário',primary:0x2e3540,secondary:0xe3483f,heading:Math.PI/2,theme:'mario-world',bodyType:'utility',kind:'utility'});
    createToyCar(87,14,{id:'country-brown',label:'LEGO • Caminhão',primary:0x9b642f,secondary:0xe0ad4f,heading:Math.PI,theme:'lego',bodyType:'truck',kind:'truck'});
    const job=P('jobBoard');registerInteractable({id:'job-board',type:'job',icon:'📦',label:'Central de trabalhos',x:job.x,z:job.z,radius:2.3,action:openJobCenter});world.deliveryPoint={x:86,z:34};

    createLifeExpansionWorld();createSportsComplexV704();createKartCircuitV704();createSizeChallenges();createTransitWorld();createPoliceSystem();createFireServiceWorld();decorateCityServices();createWaypointMarker();createCooperativeMissionWorld();

    for(const sign of L.signs||[]){if(sign.kind!=='guide')continue;createSignpost(sign.x,sign.z,sign.text,Number(sign.rotationY||0));}

    // Circuito de plataformas deslocado para uma área própria, sem ocupar o kartódromo.
    const circuit=P('platformCircuit'),coords=[[-16,0,15],[-10,1.2,10],[-4,2.3,5],[2,3.5,0],[8,4.6,-5],[14,5.8,-10]].map(([dx,y,dz])=>[circuit.x+dx,y,circuit.z+dz]);coords.forEach(([x,y,z],i)=>{createPlatform(x,y+.5,z,3.2,3.2,i%2?0x7a4ed0:0x3e9fd8);createCrystal(x,y+1.7,z,i===coords.length-1);});world.secretChest=createChest('secret',circuit.x+16,circuit.z-13,true);
    const castle=P('castle');createRoyalCastle(castle.x,castle.z);
    createEnemy('slime',48,-25);createEnemy('slime',58,-32);createEnemy('bat',72,-43);createEnemy('golem',82,48);createEnemy('slime',108,58);
    for(const p of [[12,1,-2],[-14,1,-8],[36,1,-15],[-45,1,18],[-63,1,-35],[78,1,15],[95,1,-20]])createCrystal(...p);
    registerInteractable({id:'bridge-repair',type:'repair',icon:'🛠',label:'Consertar/inspecionar ponte',x:-12,z:47,radius:3.2,action:repairBridge});createChest('village',8,-5,false);createChest('forest',-82,-50,false);
    if(typeof migrateWorldBuildsToSafeZoneV704==='function')migrateWorldBuildsToSafeZoneV704();reconcileWorldBuilds();updateBridgeVisual();restoreActiveAdventure();
    // O antigo anel aleatório de prédios foi removido: ele invadia quadras e a pista nas bordas.
    world.layoutAudit=v704StaticWorldAudit();if(!world.layoutAudit.passed)console.error('[OTTHI V704] conflitos no layout mestre',world.layoutAudit.problems);setTimeout(()=>{try{v704RuntimeWorldAudit();}catch(error){console.error('[OTTHI V704] auditoria do mundo real falhou',error);}},0);setTimeout(()=>{try{if(typeof workshopReorganizeLegacyYardVehicles==='function')workshopReorganizeLegacyYardVehicles();}catch(error){console.error('[OTTHI oficina] falha ao separar veículos salvos no pátio',error);}},160);
  }
  function collectResource(id){
    const resource=world.resources.find(r=>r.id===id);if(!resource||resource.collected)return;
    const needed=resource.type==='wood'?'axe':'pickaxe';if(state.tools.equipped!==needed){toast(`Equipe ${needed==='axe'?'o machado':'a picareta'} em Ferramentas.`,'warn',1700);return;}
    resource.hits=(resource.hits||0)+1;playToolAnimation();resource.mesh.rotation.y+=(resource.hits%2?.08:-.08);
    if(resource.hits<Number(resource.hitsNeeded||1)){toast(`${resource.type==='wood'?'Árvore':'Rocha'}: ${resource.hits}/${resource.hitsNeeded}`,'good',850);return;}
    resource.collected=true;resource.mesh.visible=false;const inventoryKey=resource.type==='gold'?'goldOre':resource.type,amount=resource.type==='wood'?2:1;
    state.inventory[inventoryKey]=(state.inventory[inventoryKey]||0)+amount;state.tools.harvested[resource.type]=(state.tools.harvested[resource.type]||0)+amount;state.stats.collected++;trackDaily('collect',1);
    advanceAdventure('resources',resource.type==='gold'?'stone':resource.type);addXP(resource.type==='gold'?18:10);toast(resource.type==='wood'?'+2 madeira':resource.type==='gold'?'+1 minério de ouro':'+1 pedra','good',1300);beep(resource.type==='gold'?850:620);vibrate(25);evaluateMissions();checkActiveJob();saveState();
    setTimeout(()=>{resource.collected=false;resource.hits=0;resource.mesh.visible=true;resource.mesh.rotation.y=0;},90000);
  }
  function openChest(chest){
    if(chest.opened){toast('Este baú já foi aberto.','warn');return;}
    chest.opened=true;chest.lid.rotation.x=-.65;state.flags[`chest_${chest.id}`]=true;
    state.inventory.crystals+=chest.secret?3:1;addCoins(chest.secret?100:25);addXP(chest.secret?80:25);
    if(chest.secret)setFlag('secretChest');toast(chest.secret?'Baú secreto! +3 cristais e 100 moedas':'Baú aberto!','good',2200);evaluateMissions();saveState();
  }

  function cloudHouseRecord(houseId){return cloudHouses.get(houseId)||null;}
  function isMyCloudHouse(record){return !!record&&record.ownerUid===window.OTTHOS_RTDB?.uid;}
  function reconcileCloudHouses(){
    const uid=window.OTTHOS_RTDB?.uid;if(!uid)return;
    for(const h of world.houses||[]){if(h.publicBuilding)continue;if(h.id==='home'){state.houses.home={...(state.houses.home||{}),owned:true,locked:false,home:true,price:h.price};continue;}const cloud=cloudHouseRecord(h.id);if(cloud){state.houses[h.id]={...(state.houses[h.id]||{}),owned:cloud.ownerUid===uid,locked:!!cloud.locked,ownerUid:cloud.ownerUid,ownerName:cloud.ownerName||'Jogador',price:h.price};}}
    saveState();
  }
  async function claimHouseOnline(house){
    if(!window.OTTHOS_RTDB?.connected?.()){toast('Conecte ao Firebase para comprar uma casa exclusiva.','warn',2600);return false;}
    const result=await window.OTTHOS_RTDB.claimHouse(house.id,{name:house.name,price:house.price,ownerName:publicPlayerName(),x:house.x,z:house.z});
    if(!result?.ok){toast(result?.ownerName?`Esta casa já pertence a ${result.ownerName}.`:'Não foi possível comprar a casa.','warn',2600);return false;}
    state.houses[house.id]={...(state.houses[house.id]||{}),owned:true,locked:false,ownerUid:window.OTTHOS_RTDB.uid,ownerName:state.profile.name,price:house.price};return true;
  }
  async function handleHouseDoor(house){
    const uid=window.OTTHOS_RTDB?.uid,cloud=cloudHouseRecord(house.id),mine=isMyCloudHouse(cloud),local=state.houses[house.id]||{};
    if(house.id==='workshop'){toast('A oficina é um barracão aberto. Entre a pé ou dirija o veículo diretamente até o elevador.','good',2600);return true;}
    if(house.publicBuilding){if(await confirmModal(house.name,'Deseja entrar?','Entrar','Cancelar'))enterHouse(house);return;}
    if(house.id==='home'){openModal('Minha casa',`<p>Esta é a residência principal de <b>${escapeHtml(playerDisplayName())}</b>. Ela permanece acessível neste aparelho e não depende da propriedade compartilhada do bairro.</p><div class="modal-actions"><button class="btn primary" data-enter-home>Entrar</button><button class="btn" data-cancel>Cancelar</button></div>`,root=>{$('[data-enter-home]',root).onclick=()=>{closeModal();enterHouse(house);};$('[data-cancel]',root).onclick=closeModal;});return;}
    if(cloud&&!mine){
      if(cloud.locked){toast(`Casa trancada por ${cloud.ownerName||'outro jogador'}.`,'warn',2500);return;}
      if(await confirmModal(house.name,`Casa de ${cloud.ownerName||'outro jogador'}. A porta está aberta. Deseja visitar?`,'Visitar','Cancelar'))enterHouse(house);return;
    }
    if(!cloud&&!local.owned){
      openModal(house.name,`<p>Residência disponível para visita. Por <b>${house.price} moedas</b>, você também pode comprá-la e controlar a fechadura.</p><div class="modal-actions"><button class="btn primary" data-visit-house>Visitar</button><button class="btn" data-buy-house>Comprar</button><button class="btn" data-race-house>Disputar em corrida</button><button class="btn" data-cancel>Cancelar</button></div>`,root=>{
        $('[data-visit-house]',root).onclick=()=>{closeModal();enterHouse(house);};
        $('[data-buy-house]',root).onclick=async()=>{if(state.profile.coins<house.price){toast('Moedas insuficientes.','warn');return;}const ok=await claimHouseOnline(house);if(!ok)return;addCoins(-house.price);setFlag('boughtHouse');awardMedal('Nova Propriedade');saveState(true);closeModal();handleHouseDoor(house);};
        $('[data-race-house]',root).onclick=()=>{closeModal();startRace('sprint',world.npcs[0],house.id);};$('[data-cancel]',root).onclick=closeModal;
      });return;
    }
    const owned=mine||local.owned;if(owned){const locked=cloud?!!cloud.locked:!!local.locked;openModal(house.name,`<p>Esta casa pertence a <b>${state.profile.name}</b>.</p><div class="modal-actions"><button class="btn primary" data-enter>Entrar</button><button class="btn" data-lock>${locked?'Destrancar':'Trancar'}</button><button class="btn" data-cancel>Cancelar</button></div>`,root=>{
      $('[data-enter]',root).onclick=()=>{closeModal();enterHouse(house);};$('[data-lock]',root).onclick=async()=>{const next=!locked,ok=await window.OTTHOS_RTDB?.setHouseLock?.(house.id,next);if(ok){state.houses[house.id]={...(state.houses[house.id]||{}),owned:true,locked:next};if(next)setFlag('lockedHouse');saveState(true);closeModal();toast(next?'Casa trancada.':'Casa destrancada.','good');}else toast('Não foi possível alterar a fechadura.','warn');};$('[data-cancel]',root).onclick=closeModal;
    });return;}
    toast('Sincronizando propriedade da casa...','warn');
  }

  function enterHouse(house){
    if(!house||!canEnterMobility(PLAYER_MODES.INTERIOR)){toast('Saia do transporte antes de entrar.','warn');return false;}
    rememberSafePlayerPosition(true);enterHouse.outdoorPosition={x:player.x,y:player.y,z:player.z,yaw:cameraYaw};enterHouse.outdoorYaw=cameraYaw;cameraYaw=0;clearMovementInputs();
    currentHouse=house;cameraMode='interior';
    if(house.id==='workshop'){if(world.workshopDecor)world.workshopDecor.visible=true;if(world.tioThiago?.group)world.tioThiago.group.visible=true;}
    if(house.exteriorGroup){house.exteriorGroup.visible=false;if(house.interiorGroup)house.interiorGroup.visible=true;for(const item of house.interiorObjects||[])if(item?.visible!==undefined)item.visible=true;}
    else{house.roof.visible=false;house.front.visible=false;house.door.visible=false;}
    for(const bus of world.buses)bus.group.visible=false;
    for(const car of world.policeCars)car.group.visible=false;for(const truck of world.fireTrucks)truck.group.visible=false;for(const ambulance of world.ambulances)ambulance.group.visible=false;for(const fire of world.fires)fire.group.visible=false;
    const entry=safePointNear(Number.isFinite(house.entryX)?house.entryX:house.x,Number.isFinite(house.entryZ)?house.entryZ:house.z+1,{ignoreTraffic:true,ignoreHouseId:house.id,allowWater:false,radius:.35,distances:[0,.5,1]});
    player.x=entry.x;player.z=entry.z;player.y=entry.y;player.vx=player.vz=player.vy=0;player.grounded=true;updateCamera(1);auditPlayerMode('enter-interior');
    if(house.id==='home')setFlag('enteredHome');toast(`Entrou: ${house.name}`,'good');updateContext(true);savePlayerPosition(true);return true;
  }
  function exitHouse(){
    if(!currentHouse)return false;const h=currentHouse;
    if(h.id==='workshop'){if(world.workshopDecor)world.workshopDecor.visible=false;if(world.tioThiago?.group)world.tioThiago.group.visible=false;}
    if(h.exteriorGroup){h.exteriorGroup.visible=true;if(h.interiorGroup)h.interiorGroup.visible=false;for(const item of h.interiorObjects||[])if(item?.visible!==undefined)item.visible=false;}
    else{h.roof.visible=true;h.front.visible=true;h.door.visible=true;}
    for(const bus of world.buses)bus.group.visible=true;
    for(const car of world.policeCars)car.group.visible=true;for(const truck of world.fireTrucks)truck.group.visible=true;for(const ambulance of world.ambulances)ambulance.group.visible=true;for(const fire of world.fires)fire.group.visible=!!fire.active;
    currentHouse=null;cameraMode='openworld';cameraYaw=Number.isFinite(enterHouse.outdoorYaw)?enterHouse.outdoorYaw:0;clearMovementInputs();
    const preferred=enterHouse.outdoorPosition||{x:Number.isFinite(h.exitX)?h.exitX:h.x,z:Number.isFinite(h.exitZ)?h.exitZ:h.z+5.3};const safe=safePointNear(Number.isFinite(h.exitX)?h.exitX:preferred.x,Number.isFinite(h.exitZ)?h.exitZ:preferred.z,{ignoreTraffic:false,allowWater:false,radius:.44});
    player.x=safe.x;player.z=safe.z;player.y=safe.y;player.vx=player.vz=player.vy=0;player.grounded=true;rememberSafePlayerPosition(true);auditPlayerMode('exit-interior');toast(`Saiu: ${h.name}.`,'good');savePlayerPosition(true);return true;
  }


  function openHomeChest(){
    const keys=[['wood','Madeira','🪵'],['stone','Pedra','🪨'],['goldOre','Minério de ouro','🟨'],['goldBar','Barra de ouro','🏅'],['food','Comida','🍎'],['water','Água','💧'],['crystals','Cristais','💎']];
    const rows=keys.map(([key,name,icon])=>`<div class="storage-row"><span>${icon} ${name}</span><b>Mochila ${state.inventory[key]||0} • Baú ${state.homeStorage[key]||0}</b><div><button data-store="${key}">Guardar 1</button><button data-take="${key}">Retirar 1</button></div></div>`).join('');
    openModal(`Baú da casa de ${playerDisplayName()}`,`<p>Guarde recursos sem abrir o inventário geral.</p><div class="storage-list">${rows}</div>`,root=>{
      $$('[data-store]',root).forEach(btn=>btn.onclick=()=>{const key=btn.dataset.store;if((state.inventory[key]||0)<=0){toast('Você não tem esse item.','warn');return;}state.inventory[key]--;state.homeStorage[key]=(state.homeStorage[key]||0)+1;saveState(true);openHomeChest();});
      $$('[data-take]',root).forEach(btn=>btn.onclick=()=>{const key=btn.dataset.take;if((state.homeStorage[key]||0)<=0){toast('O baú não tem esse item.','warn');return;}state.homeStorage[key]--;state.inventory[key]=(state.inventory[key]||0)+1;saveState(true);openHomeChest();});
    });
  }
