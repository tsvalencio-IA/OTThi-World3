/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 23-vehicle-effects-driving.js
 * Escopo: Poeira, som, efeitos, controles, direção, passageiros e ponte
 * Linhas de origem V642: 3531-3644
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function clearServiceVehicleVisualFromGroup(group){
    const layer=group?.userData?.serviceLayer;if(layer){group.remove(layer);disposeDetachedVisual(layer);}
    if(group){group.userData.serviceLayer=null;group.userData.serviceLights=[];group.userData.serviceBaseScale=[1,1,1];group.scale.set(1,1,1);}
  }
  function clearServiceVehicleVisual(){clearServiceVehicleVisualFromGroup(vehicleVisual);}
  function serviceVehicleIcon(kind='car'){return({police:'🚓',firefighter:'🚒',paramedic:'🚑',ambulance:'🚑',fire:'🚒',kart:'🏎️',moto:'🏍️',motorcycle:'🏍️',truck:'🚚',utility:'🚐'})[kind]||'🚗';}
  function applyServiceVehicleVisualToGroup(group,vehicle={}){
    if(!group)return false;clearServiceVehicleVisualFromGroup(group);const kind=String(vehicle.serviceType||vehicle.kind||'car');if(!['police','firefighter','fire','paramedic','ambulance','kart'].includes(kind))return false;
    const layer=new THREE.Group();layer.name=`OTTHI_SERVICE_${kind.toUpperCase()}`;group.add(layer);group.userData.serviceLayer=layer;group.userData.serviceLights=[];
    const setScale=(x,y,z)=>{group.scale.set(x,y,z);group.userData.serviceBaseScale=[x,y,z];};
    const addLight=(x,color,emissive)=>{const mesh=box(.46,.16,.3,mat(color,{emissive,emissiveIntensity:.95,roughness:.2}),x,1.39,-.1,layer);group.userData.serviceLights.push(mesh);return mesh;};
    if(kind==='kart'){
      setScale(.9,.74,.82);box(1.9,.16,2.55,0x171f2b,0,.25,0,layer);box(1.58,.3,1.05,Number(vehicle.appearance?.primary||0xe5484d),0,.42,.42,layer);box(1.95,.15,.28,Number(vehicle.appearance?.primary||0xe5484d),0,.3,1.25,layer);box(.74,.42,.72,0x27364a,0,.62,-.28,layer);const helmet=new THREE.Mesh(new THREE.SphereGeometry(.3,12,9),renderMat(0xf2c55b,{roughness:.55}));helmet.position.set(0,1.16,-.32);layer.add(helmet);const visor=box(.42,.12,.08,0x162536,0,1.17,-.58,layer);visor.rotation.x=-.08;const steering=cylinder(.2,.06,0x202833,0,.89,.12,layer,12);steering.rotation.x=Math.PI/2;
    }else if(kind==='police'){
      setScale(1.04,1.04,1.08);box(1.86,.3,1.25,0xf3f6fa,0,.7,.15,layer);box(1.9,.22,.3,0x193f72,0,.62,.86,layer);box(.12,.36,2.25,0x193f72,-.94,.58,0,layer);box(.12,.36,2.25,0x193f72,.94,.58,0,layer);addLight(-.27,0xe53945,0xa50018);addLight(.27,0x42bfff,0x087db4);const patch=new THREE.Mesh(new THREE.PlaneGeometry(.78,.22),new THREE.MeshStandardMaterial({map:signTexture('POLÍCIA','#173d70','#ffffff'),transparent:true,side:THREE.DoubleSide}));patch.position.set(0,.77,1.31);layer.add(patch);
    }else if(kind==='paramedic'||kind==='ambulance'){
      setScale(1.08,1.12,1.22);box(1.78,.9,1.45,0xf5f7f8,0,1.02,-.55,layer);box(1.82,.14,1.5,0xe34848,0,1.12,-.54,layer);box(.15,.58,.06,0xe34848,0,1.03,1.31,layer);box(.58,.15,.06,0xe34848,0,1.03,1.315,layer);addLight(-.27,0xe53945,0xa50018);addLight(.27,0x42bfff,0x087db4);const patch=new THREE.Mesh(new THREE.PlaneGeometry(.82,.23),new THREE.MeshStandardMaterial({map:signTexture('RESGATE','#ffffff','#d83e42'),transparent:true,side:THREE.DoubleSide}));patch.position.set(0,1.43,-1.3);patch.rotation.y=Math.PI;layer.add(patch);
    }else{
      setScale(1.18,1.2,1.42);box(1.92,.88,1.65,0xc93431,0,1.02,-.58,layer);box(1.86,.14,2.15,0xf2d84d,0,.76,-.2,layer);box(.22,.22,2.5,0xe8edf0,-.45,1.62,-.2,layer);box(.22,.22,2.5,0xe8edf0,.45,1.62,-.2,layer);for(let z=-1.15;z<=.95;z+=.42)box(.95,.07,.07,0xe8edf0,0,1.64,z,layer);addLight(-.27,0xe53945,0xa50018);addLight(.27,0x42bfff,0x087db4);const patch=new THREE.Mesh(new THREE.PlaneGeometry(.92,.24),new THREE.MeshStandardMaterial({map:signTexture('BOMBEIROS','#b52d2a','#ffffff'),transparent:true,side:THREE.DoubleSide}));patch.position.set(0,1.28,1.31);layer.add(patch);
    }
    layer.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;addVoxelOutline(o,0x152235,.2);}});return true;
  }
  function applyServiceVehicleVisual(vehicle={}){if(!vehicleVisual)return false;return applyServiceVehicleVisualToGroup(vehicleVisual,vehicle);}
  function spawnDust(x,z,color=0xcfc6a8){
    if(fxParticles.length>=FX_MAX_PARTICLES){const oldest=fxParticles.shift();worldGroup.remove(oldest.mesh);oldest.mesh.geometry.dispose();oldest.mesh.material.dispose();}
    const mesh=new THREE.Mesh(new THREE.CircleGeometry(.2+Math.random()*.12,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2; mesh.position.set(x,.06,z); worldGroup.add(mesh);
    fxParticles.push({mesh,life:.55,vx:(Math.random()-.5)*1.1,vz:(Math.random()-.5)*1.1});
  }
  function updateFX(dt){
    for(let i=fxParticles.length-1;i>=0;i--){
      const p=fxParticles[i]; p.life-=dt;
      p.mesh.position.x+=p.vx*dt; p.mesh.position.z+=p.vz*dt;
      p.mesh.scale.setScalar(1+(.55-p.life)*2.2);
      p.mesh.material.opacity=Math.max(0,p.life/.55*.5);
      if(p.life<=0){worldGroup.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();fxParticles.splice(i,1);}
    }
  }
  let engineAudio=null,driftSoundCooldown=0,vehicleImpactCount=0;
  function startEngineSound(){
    if(!state.settings.sound||engineAudio)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=beep.ctx||(beep.ctx=new Ctx());
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sawtooth';osc.frequency.value=65;gain.gain.value=0;
      osc.connect(gain);gain.connect(ctx.destination);osc.start();
      engineAudio={ctx,osc,gain};gain.gain.linearRampToValueAtTime(.018,ctx.currentTime+.18);
    }catch(_){}
  }
  function stopEngineSound(){
    if(!engineAudio)return;
    try{engineAudio.gain.gain.linearRampToValueAtTime(0,engineAudio.ctx.currentTime+.12);engineAudio.osc.stop(engineAudio.ctx.currentTime+.16);}catch(_){}
    engineAudio=null;
  }
  function updateVehicleFX(dt){
    if(!player.vehicle){if(engineAudio)stopEngineSound();return;}
    if(player.car.passengerOf){if(engineAudio)stopEngineSound();if(els.vehicleBadge)els.vehicleBadge.textContent=`${serviceVehicleIcon(player.car.kind)} Passageiro — AÇÃO para sair`;return;}
    const car=player.car,wheels=vehicleVisual.userData.wheels,fronts=vehicleVisual.userData.frontWheels;
    const spin=car.speed*dt*3.4;
    wheels.forEach(w=>w.rotation.x-=spin);
    fronts.forEach(h=>h.rotation.y=lerp(h.rotation.y,car.steerVisual*.5,Math.min(1,dt*10)));
    const speedDelta=car.speed-(car._prevSpeed??car.speed);car._prevSpeed=car.speed;
    const targetTiltX=clamp(-speedDelta*.55,-.13,.13);
    vehicleVisual.rotation.x=lerp(vehicleVisual.rotation.x,targetTiltX,Math.min(1,dt*6));
    vehicleVisual.rotation.z=lerp(vehicleVisual.rotation.z,-car.steerVisual*car.drift*.4,Math.min(1,dt*6));
    if(car.drift>.4&&Math.abs(car.speed)>3){
      updateVehicleFX.acc=(updateVehicleFX.acc||0)+dt;
      if(updateVehicleFX.acc>.045){updateVehicleFX.acc=0;spawnDust(player.x-Math.sin(car.heading)*1.05,player.z-Math.cos(car.heading)*1.05);}
      driftSoundCooldown-=dt;if(driftSoundCooldown<=0){driftSoundCooldown=.5;beep(180,55,'sawtooth');}
    }
    const serviceKind=String(car.kind||'car'),serviceIcon=serviceVehicleIcon(serviceKind),siren=!!car.sirenActive,turbo=performance.now()<Number(car.turboUntil||0);for(const [index,light] of (vehicleVisual.userData.serviceLights||[]).entries())light.material.emissiveIntensity=siren?(.32+(Math.floor(performance.now()/180)+index)%2*1.2):.08;if(siren&&performance.now()>Number(car.sirenBeepAt||0)){car.sirenBeepAt=performance.now()+620;beep(serviceKind==='paramedic'?740:serviceKind==='police'?610:520,135,'square');setTimeout(()=>{if(player.vehicle&&player.car.sirenActive)beep(serviceKind==='paramedic'?560:760,120,'square');},175);}if(els.vehicleBadge)els.vehicleBadge.textContent=`${serviceIcon} ${car.label||'Veículo'} • ${Math.round(Math.abs(car.speed)*6)} km/h${turbo?' • TURBO':siren?' • SIRENE':''} — SAIR sempre disponível`;
    if(!state.settings.sound&&engineAudio)stopEngineSound();
    else if(state.settings.sound&&!engineAudio)startEngineSound();
    else if(state.settings.sound&&engineAudio){
      const freq=68+Math.abs(car.speed)*11.5;
      try{engineAudio.osc.frequency.setTargetAtTime(freq,engineAudio.ctx.currentTime,.05);}catch(_){}
    }
  }

  function mobilityDriverActive(){return(player.vehicle&&!player.car.passengerOf)||(player.boating&&!player.boat.passengerOf);}
  function updateMobilityControlLabels(){
    if(typeof syncSportControlsV705==='function'&&syncSportControlsV705())return;
    const mobility=mobilityDriverActive(),isBoat=player.boating&&!player.boat.passengerOf,speed=isBoat?Number(player.boat.speed||0):Number(player.car.speed||0);
    const runIcon=$('b',els.runBtn),runLabel=$('span',els.runBtn),jumpIcon=$('b',els.jumpBtn),jumpLabel=$('span',els.jumpBtn),actionIcon=$('b',els.actionBtn),actionLabel=$('span',els.actionBtn);
    if(mobility){if(runIcon)runIcon.textContent='▲';if(runLabel)runLabel.textContent='Acelerar';if(jumpIcon)jumpIcon.textContent=speed>.04?'■':'▼';if(jumpLabel)jumpLabel.textContent=speed>.04?'Freio':'Ré';if(actionIcon)actionIcon.textContent=isBoat?'🛶':'🚗';if(actionLabel)actionLabel.textContent='Sair';}
    else{if(runIcon)runIcon.textContent='🏃';if(runLabel)runLabel.textContent='Correr';if(jumpIcon)jumpIcon.textContent='⬆';if(jumpLabel)jumpLabel.textContent='Pular';}
    els.runBtn?.classList.toggle('mobility-accelerate',mobility);els.runBtn?.classList.toggle('active',mobility?input.mobilityAccelerate:sprintRequested());els.jumpBtn?.classList.toggle('mobility-brake',mobility);els.jumpBtn?.classList.toggle('active',mobility&&input.mobilityBrake);
    if(els.runBtn)els.runBtn.setAttribute('aria-label',mobility?`Acelerar ${isBoat?'barco':'veículo'}`:'Correr');if(els.jumpBtn)els.jumpBtn.setAttribute('aria-label',mobility?(speed>.04?'Frear':'Engatar ré'):'Pular');
  }
  function updateVehicleControlsUI(){
    const vehiclePassenger=!!player.car.passengerOf,boatPassenger=!!player.boat.passengerOf,mobility=mobilityDriverActive();document.body.classList.toggle('mode-vehicle',!!player.vehicle);document.body.classList.toggle('mode-passenger',vehiclePassenger||boatPassenger);document.body.classList.toggle('mode-transit',!!player.transit.mode);document.body.classList.toggle('mode-boat',!!player.boating);document.body.classList.toggle('mode-mobility-driver',mobility);document.body.classList.toggle('mode-building',!!buildMode);document.body.classList.toggle('mode-fishing',!!fishingSession);
    els.secondaryActions?.classList.toggle('vehicle-hidden',!!player.vehicle||!!player.boating);
    els.jumpBtn?.classList.toggle('vehicle-disabled',(!!player.vehicle||!!player.boating)&&!mobility);
    els.specialBtn?.classList.toggle('vehicle-horn',mobility);
    const specialIcon=$('b',els.specialBtn),specialLabel=$('span',els.specialBtn),utility=vehicleUtilityDescriptor();
    if(specialIcon)specialIcon.textContent=mobility?utility.icon:'🔥';if(specialLabel)specialLabel.textContent=mobility?utility.label:'Poder';if(els.specialBtn)els.specialBtn.setAttribute('aria-label',mobility?utility.aria:`Poder de ${playerDisplayName()}`);if(!player.vehicle&&els.vehicleActionBtn){els.vehicleActionBtn.hidden=true;els.vehicleActionBtn.classList.remove('is-available','pulse');currentVehicleContext=null;}updateMobilityControlLabels();
  }
  function vehicleUtilityDescriptor(){if(player.boating)return{icon:'📣',label:'Buzina',aria:'Buzina do barco'};const kind=String(player.car.kind||'car');if(kind==='firefighter')return{icon:'💦',label:'Água',aria:'Jato de água do caminhão dos bombeiros'};if(kind==='police'||kind==='paramedic')return{icon:'🚨',label:player.car.sirenActive?'Desligar':'Sirene',aria:`${player.car.sirenActive?'Desligar':'Ligar'} sirene`};return{icon:'⚡',label:'Turbo',aria:'Ativar turbo do veículo'};}
  function vehicleUtilityAction(){
    if(!mobilityDriverActive()||paused||!els.modal.hidden)return false;if(player.boating){vehicleHorn();return true;}const kind=String(player.car.kind||'car'),now=performance.now();
    if(kind==='police'||kind==='paramedic'){player.car.sirenActive=!player.car.sirenActive;player.car.sirenBeepAt=0;updateVehicleControlsUI();toast(player.car.sirenActive?'Sirene ligada. Dirija com responsabilidade.':'Sirene desligada.','good',1500);return true;}
    if(kind==='firefighter'){if(now<Number(player.car.utilityCooldownUntil||0)){toast('Canhão de água recarregando.','warn',900);return false;}player.car.utilityCooldownUntil=now+900;return typeof usePlayerFireTruckWaterCannon==='function'?usePlayerFireTruckWaterCannon():false;}
    if(now<Number(player.car.utilityCooldownUntil||0)){toast('Turbo recarregando.','warn',900);return false;}player.car.utilityCooldownUntil=now+6500;player.car.turboUntil=now+2800;beep(960,90,'sawtooth');vibrate([24,20,40]);toast('Turbo ativado por 3 segundos!','good',1500);return true;
  }
  function vehicleHorn(){
    if(!mobilityDriverActive()||paused||!els.modal.hidden)return;const t=performance.now();if(t<player.hornUntil)return;player.hornUntil=t+360;const boat=player.boating;beep(boat?330:410,boat?125:95,boat?'sine':'square');setTimeout(()=>{if(mobilityDriverActive())beep(boat?390:520,boat?100:70,boat?'sine':'square');},105);vibrate(18);if(!boat&&vehicleVisual){vehicleVisual.scale.set(1.015,.99,1.015);setTimeout(()=>vehicleVisual?.scale?.set(1,1,1),120);}
  }
  function normalizeVehiclePassengerUids(value=[]){const source=Array.isArray(value)?value:[value],out=[];for(const raw of source){const uid=String(raw||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,128);if(uid&&!out.includes(uid))out.push(uid);}return out;}
  function vehiclePassengerSeatCapacity(bodyType='',kind=''){
    const cleanBody=typeof normalizeVehicleBodyType==='function'?normalizeVehicleBodyType(bodyType):String(bodyType||'small'),cleanKind=String(kind||'').toLowerCase();if(cleanBody==='moto'||['moto','motorcycle','bicycle','bike','skate'].includes(cleanKind))return 1;if(cleanBody==='truck'||['firefighter','fire'].includes(cleanKind))return 2;return 3;
  }
  function currentVehiclePassengerSeatCapacity(){const vehicle=typeof currentVehicleRef==='function'?currentVehicleRef():null,body=vehicle?.group?.userData?.bodyType||vehicle?.bodyType||vehicle?.kind||player.car.kind;return vehiclePassengerSeatCapacity(body,player.car.kind);}
  function hostedVehiclePassengerUids(){
    if(!player.vehicle||player.car.passengerOf)return[];const own=String(window.OTTHOS_RTDB?.uid||state.profile?.playerId||''),out=normalizeVehiclePassengerUids([...(player.car.passengerUids||[]),player.car.passengerUid]);if(own&&typeof remotePresence!=='undefined')for(const[uid,presence]of remotePresence){if(presence?.vehicle&&presence.vehicleRole==='passenger'&&String(presence.vehiclePassengerOf||'')===own&&!out.includes(String(uid)))out.push(String(uid));}const capacity=currentVehiclePassengerSeatCapacity(),allowed=Math.max(0,capacity-(player.car.passengerBotId?1:0));player.car.passengerUids=normalizeVehiclePassengerUids(out).slice(0,allowed);player.car.passengerUid=player.car.passengerUids[0]||'';return[...player.car.passengerUids];
  }
  function vehiclePassengerSeatsUsed(){return hostedVehiclePassengerUids().length+(player.car.passengerBotId?1:0);}
  function vehicleHasPassengerSeat(){return!!player.vehicle&&!player.car.passengerOf&&vehiclePassengerSeatsUsed()<currentVehiclePassengerSeatCapacity();}
  function addHostedVehiclePassenger(uid){uid=normalizeVehiclePassengerUids([uid])[0]||'';if(!uid)return false;const current=hostedVehiclePassengerUids();if(current.includes(uid))return true;if(!vehicleHasPassengerSeat())return false;player.car.passengerUids=[...current,uid];player.car.passengerUid=player.car.passengerUids[0]||'';return true;}
  function removeHostedVehiclePassenger(uid){uid=String(uid||'');player.car.passengerUids=normalizeVehiclePassengerUids(player.car.passengerUids).filter(value=>value!==uid);if(player.car.passengerUid===uid||!player.car.passengerUids.includes(player.car.passengerUid))player.car.passengerUid=player.car.passengerUids[0]||'';return true;}
  function vehicleDriverSeatOffset(bodyType='',kind=''){const body=typeof normalizeVehicleBodyType==='function'?normalizeVehicleBodyType(bodyType||kind):String(bodyType||kind||'small'),cleanKind=String(kind||'').toLowerCase();if(body==='moto'||['moto','motorcycle','bike','bicycle'].includes(cleanKind))return{x:0,y:.54,z:-.12};if(body==='truck'||['firefighter','fire'].includes(cleanKind))return{x:-.38,y:.54,z:.38};if(body==='utility'||['paramedic','ambulance'].includes(cleanKind))return{x:-.34,y:.48,z:.12};return{x:-.34,y:.42,z:-.34};}
  function vehiclePassengerSeatOffset(index=0,bodyType='',kind=''){const body=typeof normalizeVehicleBodyType==='function'?normalizeVehicleBodyType(bodyType||kind):String(bodyType||kind||'small'),cleanKind=String(kind||'').toLowerCase(),seat=Math.max(0,Math.min(2,Number(index)||0));if(body==='moto'||['moto','motorcycle','bike','bicycle'].includes(cleanKind))return{x:0,y:.52,z:-.58};if(body==='truck'||['firefighter','fire'].includes(cleanKind))return([{x:.38,y:.54,z:.38},{x:-.38,y:.54,z:-.32},{x:.38,y:.54,z:-.32}][seat]||{x:.38,y:.54,z:.38});if(body==='utility'||['paramedic','ambulance'].includes(cleanKind))return([{x:.34,y:.48,z:.12},{x:-.34,y:.48,z:-.58},{x:.34,y:.48,z:-.58}][seat]||{x:.34,y:.48,z:.12});return([{x:.34,y:.42,z:-.34},{x:-.34,y:.42,z:-.78},{x:.34,y:.42,z:-.78}][seat]||{x:.34,y:.42,z:-.34});}
  function enterVehicle(vehicle=world.vehicle){
    if(player.vehicle||player.boating||player.transit.mode||!vehicle||vehicle.occupied||!canEnterMobility(PLAYER_MODES.VEHICLE_DRIVER))return false;
    const bounds=v704WorldBounds(),margin=.9,rawX=Number(vehicle.group?.position?.x),rawZ=Number(vehicle.group?.position?.z);if(!Number.isFinite(rawX)||!Number.isFinite(rawZ)){toast('Veículo indisponível nesta posição.','warn');return false;}const board=v704ClampWorldPoint(rawX,rawZ,margin);if(board.x!==rawX||board.z!==rawZ){vehicle.group.position.x=board.x;vehicle.group.position.z=board.z;vehicle.x=board.x;vehicle.z=board.z;persistParkedVehicle(vehicle);}const originValid=Number.isFinite(player.x)&&Number.isFinite(player.z)&&player.x>=bounds.minX+margin&&player.x<=bounds.maxX-margin&&player.z>=bounds.minZ+margin&&player.z<=bounds.maxZ-margin&&!isInsideLakeNavigable(player.x,player.z)&&!positionBlockedForPlayer(player.x,player.z,.26,{ignoreActor:vehicle,ignoreTraffic:true,allowWater:false});if(originValid){player.lastSafeX=player.x;player.lastSafeZ=player.z;player.lastSafeY=groundHeightAt(player.x,player.z);player.lastSafeAt=performance.now();state.position={x:+player.x.toFixed(2),y:+player.lastSafeY.toFixed(2),z:+player.z.toFixed(2),yaw:+Number(cameraYaw||0).toFixed(3)};}
    activeVehicleRef=vehicle;world.activeVehicle=vehicle;player.preVehicleAbilities={scaleMode:player.scaleMode,crouched:player.crouched};player.sitUntil=0;player.attackUntil=0;player.spinUntil=0;player.jumpBuffer=0;player.vy=0;player.grounded=true;clearMovementInputs();
    input.mobilityAccelerate=false;input.mobilityBrake=false;player.vehicle=true;player.car.id=vehicle.id;player.car.kind=vehicle.serviceType||vehicle.kind||'car';player.car.label=vehicle.label||'Veículo';player.car.passengerOf='';player.car.passengerUid='';player.car.passengerUids=[];player.car.passengerBotId='';player.car.heading=vehicle.group.rotation.y||player.facing;player.car.speed=0;player.car.steerVisual=0;player.car.drift=0;player.car._prevSpeed=0;player.car.turboUntil=0;player.car.sirenActive=false;player.car.utilityCooldownUntil=0;player.x=board.x;player.z=board.z;player.y=groundHeightAt(player.x,player.z);player.facing=player.car.heading;vehicle.occupied=true;
    player.scaleMode='normal';player.crouched=false;syncPlayerRootScale();updateAbilityUI();if(playerModel)playerModel.visible=false;if(avatarLayer)avatarLayer.visible=false;applyVehicleAppearance(vehicle);vehicleVisual.visible=true;vehicleVisual.scale.set(1,1,1);vehicleVisual.rotation.set(0,0,0);vehicle.group.visible=false;els.vehicleBadge.hidden=false;updateVehicleControlsUI();updateRunUI();setFlag('gotVehicle');state.vehicles.lastUsedId=vehicle.id;if(typeof onServiceVehicleBoarded==='function')onServiceVehicleBoarded(vehicle);
    if(state.career.activeJob?.id==='delivery'){setMissionState(state.career.activeJob,MISSION_STATES.TRAVELLING,'vehicle-boarded');state.waypoint={id:'delivery-maya',name:'Entregar para Maya',x:65,z:54,navX:55,navZ:48,arrived:false};world.routePath=buildRoutePoints(player,state.waypoint);updateWaypointMarker();}
    const companion=nearestRideCompanion();if(companion)boardNpcPassenger(companion,'car');toast(`${serviceVehicleIcon(player.car.kind)} ${vehicle.label||'Veículo'} ligado! Use o manche para dirigir.`,'good');startEngineSound();saveState(true);return true;
  }
  function enterVehicleAsPassenger(hostUid,vehicleId=''){
    const ghost=world.ghosts.get(hostUid),target=ghost?.userData?.target;
    if(!ghost||!target?.vehicle||target.vehicleRole==='passenger'){toast('O motorista ou o carro não está mais disponível.','warn');return false;}
    if(player.vehicle){toast('Você já está em um veículo.','warn');return false;}
    if(player.boating)exitBoat(true);
    if(player.transit.mode||!canEnterMobility(PLAYER_MODES.VEHICLE_PASSENGER))return false;
    player.preVehicleAbilities={scaleMode:player.scaleMode,crouched:player.crouched};clearMovementInputs();player.vehicle=true;player.car.id=vehicleId||target.vehicleId||'online-vehicle';player.car.kind=String(target.vehicleKind||target.vehicleBodyType||'car');player.car.label=String(target.vehicleAppearance?.label||target.vehicleLabel||'Veículo');player.car.passengerOf=hostUid;player.car.passengerUid='';player.car.passengerUids=[];player.car.passengerBotId='';player.car.hostMissingAt=0;player.car._passengerHostSync=null;player.car.speed=0;player.scaleMode='normal';player.crouched=false;
    if(playerModel)playerModel.visible=false;if(avatarLayer)avatarLayer.visible=false;vehicleVisual.visible=false;els.vehicleBadge.hidden=false;updateVehicleControlsUI();updateRunUI();updateAbilityUI();auditPlayerMode('board-remote-vehicle');toast(`Você entrou como passageiro. O motorista controla ${String(target.vehicleBodyType||'')==='moto'?'a moto':'o veículo'}.`,'good',2500);saveState(true);return true;
  }
  function exitVehicle(silent=false){
    if(!player.vehicle)return false;
    const passengerHost=player.car.passengerOf,hostedPassengers=passengerHost?[]:hostedVehiclePassengerUids(),wasPassenger=!!passengerHost,drivenVehicle=currentVehicleRef(),parkX=player.x,parkZ=player.z,parkHeading=player.car.heading;const exitPoint=safeVehicleExitPoint(drivenVehicle);
    if(passengerHost)window.OTTHOS_RTDB?.sendInteraction?.(passengerHost,{type:'vehiclePassengerLeft'});else for(const uid of hostedPassengers)window.OTTHOS_RTDB?.sendInteraction?.(uid,{type:'vehicleEnded'});
    releaseNpcPassenger('car');input.mobilityAccelerate=false;input.mobilityBrake=false;player.vehicle=false;player.vx=0;player.vz=0;player.car.speed=0;player.car._prevSpeed=0;player.car.turboUntil=0;player.car.sirenActive=false;player.car.utilityCooldownUntil=0;player.car.passengerOf='';player.car.passengerUid='';player.car.passengerUids=[];player.car.hostMissingAt=0;player.car._passengerHostSync=null;clearMovementInputs();
    const prior=player.preVehicleAbilities||state.abilities||{scaleMode:'normal',crouched:false};player.scaleMode=['mini','normal','giant'].includes(prior.scaleMode)?prior.scaleMode:'normal';player.crouched=!!prior.crouched;player.preVehicleAbilities=null;syncPlayerRootScale();if(playerModel)playerModel.visible=true;if(avatarLayer)avatarLayer.visible=true;vehicleVisual.visible=false;vehicleVisual.rotation.set(0,0,0);els.vehicleBadge.hidden=true;updateVehicleControlsUI();updateRunUI();updateAbilityUI();stopEngineSound();
    if(drivenVehicle&&!wasPassenger){drivenVehicle.occupied=false;drivenVehicle.group.visible=true;drivenVehicle.group.position.set(parkX,groundHeightAt(parkX,parkZ),parkZ);drivenVehicle.group.rotation.y=parkHeading;drivenVehicle.x=parkX;drivenVehicle.z=parkZ;drivenVehicle.heading=parkHeading;persistParkedVehicle(drivenVehicle);}
    if(typeof onServiceVehicleExited==='function')onServiceVehicleExited(drivenVehicle);clearServiceVehicleVisual();activeVehicleRef=null;world.activeVehicle=null;player.x=exitPoint.x;player.z=exitPoint.z;player.y=exitPoint.y;player.vx=player.vy=player.vz=0;player.grounded=true;player.car.id='';player.car.kind='car';rememberSafePlayerPosition(true);auditPlayerMode('exit-vehicle');if(!silent)toast('Saiu do veículo em local seguro.','good');saveState(true);return true;
  }
  function repairBridge(){
    if(state.flags.bridgeFixed){toast('A ponte já está consertada.','good');return;}
    if(state.inventory.wood<3||state.inventory.stone<2){toast('Precisa de 3 madeiras e 2 pedras.','warn');return;}
    state.inventory.wood-=3;state.inventory.stone-=2;setFlag('bridgeFixed');addXP(70);addReputation(20);toast('Ponte consertada!','good',2200);saveState();
  }

  const BUILD_RECIPES={
    block:{name:'Bloco',icon:'🧱',cost:{blocks:1},description:'Bloco empilhável'},
    wall:{name:'Parede',icon:'🧱',cost:{stone:2,blocks:1},description:'Parede de pedra'},
    floor:{name:'Piso de madeira',icon:'🪵',cost:{wood:2},description:'Plataforma para o quintal'},
    fence:{name:'Cerca',icon:'🚧',cost:{fences:1},description:'Cerca orientada para a direção do personagem'},
    lamp:{name:'Poste',icon:'💡',cost:{wood:1,stone:1},description:'Iluminação para sua construção'},
    bench:{name:'Banco',icon:'🪑',cost:{wood:3},description:'Móvel externo para a vila'},
    planter:{name:'Jardineira',icon:'🌻',cost:{wood:2,stone:1},description:'Flores vivas para o terreno'}
  };
