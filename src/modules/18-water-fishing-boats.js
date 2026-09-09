/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 18-water-fishing-boats.js
 * Escopo: Água, câmera e animação da pesca, barco e física náutica
 * Linhas de origem V642: 2925-3064
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function rectOverlap(a,b,pad=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.z-b.z)<(a.d+b.d)/2+pad;}
  function insideWater(x,z,h){return Math.abs(x-h.x)<=h.w/2&&Math.abs(z-h.z)<=h.d/2;}
  function waterAt(x,z){return(world.hazards||[]).find(h=>h.type==='water'&&insideWater(x,z,h));}
  function isInsideLakeNavigable(x,z){const water=waterAt(x,z);return !!water?.reservoir;}
  function isNearFishingArea(){const pier=worldLayoutPoint('pier',{x:-67,z:54}),lake=worldLayoutRect('lake')||{x:-88,z:54,w:50,d:22};return player.boating||Math.hypot(player.x-pier.x,player.z-pier.z)<9||Math.abs(player.z-(lake.z-lake.d/2))<4&&Math.abs(player.x-lake.x)<lake.w/2-2||Math.abs(player.z-(lake.z+lake.d/2))<4&&Math.abs(player.x-lake.x)<lake.w/2-2;}
  function resolveWaterWalking(prevX,prevZ){if(player.boating||player.vehicle||currentHouse){player.swimming=false;return;}const h=waterAt(player.x,player.z);const nowSwimming=!!h&&groundHeightAt(player.x,player.z)<=.24;if(nowSwimming&&!player.swimming&&performance.now()-waterWarningAt>900){waterWarningAt=performance.now();toast('Você entrou na água. Use o joystick para nadar e PULAR para uma braçada.','good',2400);}if(!nowSwimming&&player.swimming&&performance.now()-waterWarningAt>700){waterWarningAt=performance.now();toast('Você saiu da água.','good',1100);}player.swimming=nowSwimming;if(player.swimming){player.vx*=.985;player.vz*=.985;}}

  const BOAT_DOCK={minX:-72,maxX:-62,minZ:52.5,maxZ:55.5,exitX:-60.8,touchDistance:4.4};
  function distanceToBoatDock(x=player.x,z=player.z){const nx=clamp(x,BOAT_DOCK.minX,BOAT_DOCK.maxX),nz=clamp(z,BOAT_DOCK.minZ,BOAT_DOCK.maxZ);return Math.hypot(x-nx,z-nz);}
  function validBoatExit(){return distanceToBoatDock()<=BOAT_DOCK.touchDistance;}
  function safeBoatExitPoint(){return{x:BOAT_DOCK.exitX,z:clamp(player.z,BOAT_DOCK.minZ+.25,BOAT_DOCK.maxZ-.25)};}

  function ensureFishingVisual(){
    if(fishingVisual||!playerGroup||!worldGroup)return fishingVisual;
    const rodRoot=new THREE.Group();rodRoot.visible=false;rodRoot.position.set(.56,1.34,.05);playerGroup.add(rodRoot);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.035,.06,2.3,8),renderMat(0x7b4a20,{roughness:.68}));rod.rotation.x=Math.PI/2;rod.position.z=1.08;rod.castShadow=false;rodRoot.add(rod);
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.065,.075,.38,8),renderMat(0x202833,{roughness:.58}));handle.rotation.x=Math.PI/2;handle.position.z=-.12;rodRoot.add(handle);
    const reel=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.12,10),renderMat(0x4ba7d8,{metalness:.25,roughness:.35}));reel.rotation.z=Math.PI/2;reel.position.set(.1,-.08,.15);rodRoot.add(reel);
    const tip=new THREE.Object3D();tip.position.set(0,0,2.25);rodRoot.add(tip);
    const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3).setUsage(THREE.DynamicDrawUsage));
    const line=new THREE.Line(lineGeometry,new THREE.LineBasicMaterial({color:0xeaf8ff,transparent:true,opacity:.88,depthWrite:false}));line.visible=false;line.frustumCulled=false;worldGroup.add(line);
    const bobber=new THREE.Group();const floatBall=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),renderMat(0xfff3d0,{emissive:0xffd95a,emissiveIntensity:.45,roughness:.35}));floatBall.scale.y=.8;bobber.add(floatBall);const floatTop=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.22,7),renderMat(0xff3d46,{roughness:.4}));floatTop.position.y=.14;bobber.add(floatTop);bobber.visible=false;worldGroup.add(bobber);
    const fish=new THREE.Group();const fishBody=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),renderMat(0x45b7cf,{roughness:.45,metalness:.08}));fishBody.scale.set(1.25,.58,.48);fish.add(fishBody);const tail=new THREE.Mesh(new THREE.ConeGeometry(.24,.48,4),renderMat(0x2a8fa8,{roughness:.5}));tail.rotation.z=-Math.PI/2;tail.position.x=-.48;fish.add(tail);const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,7,6),renderMat(0x111827,{roughness:.3}));eye.position.set(.27,.08,.13);fish.add(eye);fish.visible=false;worldGroup.add(fish);
    fishingVisual={active:false,phase:'idle',source:'shore',rodRoot,tip,line,bobber,fish,target:new THREE.Vector3(),castStart:new THREE.Vector3(),phaseAt:0,hideToken:0,fishSize:1};
    return fishingVisual;
  }
  function setFishingLine(a,b){const v=fishingVisual;if(!v)return;const attr=v.line.geometry.getAttribute('position'),arr=attr.array;arr[0]=a.x;arr[1]=a.y;arr[2]=a.z;arr[3]=b.x;arr[4]=b.y;arr[5]=b.z;attr.needsUpdate=true;}
  function fishingCastTarget(source){
    let dx,dz,dist=source==='boat'?5.4:5.0;
    if(source==='boat'){const heading=player.boat.heading;dx=Math.sin(heading);dz=Math.cos(heading);}else{const lake=worldLayoutPoint('lake',{x:-88,z:54});dx=lake.x-player.x;dz=lake.z-player.z;const m=Math.hypot(dx,dz)||1;dx/=m;dz/=m;}
    let x=player.x+dx*dist,z=player.z+dz*dist;
    if(!isInsideLakeNavigable(x,z)){const lake=worldLayoutPoint('lake',{x:-88,z:54});dx=lake.x-player.x;dz=lake.z-player.z;const m=Math.hypot(dx,dz)||1;x=player.x+dx/m*dist;z=player.z+dz/m*dist;}
    return new THREE.Vector3(x,.16,z);
  }
  function beginFishingVisual(source){
    const v=ensureFishingVisual();
    if(!v)return;
    if(!fishingCameraState)fishingCameraState={yaw:cameraYaw,pitch:cameraPitch,zoom:cameraZoom};
    const initialTarget=fishingCastTarget(source),targetHeading=Math.atan2(initialTarget.x-player.x,initialTarget.z-player.z);
    cameraYaw=targetHeading+Math.PI/2;
    cameraPitch=clamp(cameraPitch,.24,.52);
    cameraZoom=clamp(cameraZoom,-1.5,1.2);
    input.cameraDrag=null;
    v.hideToken++;v.active=true;v.phase='ready';v.source=source;v.phaseAt=performance.now();v.target.copy(initialTarget);
    v.rodRoot.visible=true;v.line.visible=true;v.bobber.visible=true;v.fish.visible=false;v.rodRoot.rotation.set(-.48,0,-.08);
    player.emoteType='fishing';player.emoteUntil=performance.now()+600000;player.emoteSeq=(player.emoteSeq||0)+1;
    const tip=new THREE.Vector3();v.tip.getWorldPosition(tip);v.bobber.position.copy(tip);setFishingLine(tip,v.bobber.position);
  }
  function castFishingVisual(){const v=ensureFishingVisual();if(!v?.active)return;v.tip.getWorldPosition(v.castStart);v.target.copy(fishingCastTarget(v.source));v.phase='casting';v.phaseAt=performance.now();beep(420,55,'sine');}
  function hookFishingVisual(){const v=fishingVisual;if(!v?.active)return;v.phase='hooked';v.phaseAt=performance.now();v.bobber.scale.setScalar(1.28);}
  function pullFishingVisual(success,fishData){const v=fishingVisual;if(!v?.active)return;v.phase=success?'pulling':'escaping';v.phaseAt=performance.now();v.fishSize=clamp(.8+Number(fishData?.size||.5)*.08,.82,1.35);v.fish.scale.setScalar(v.fishSize);v.fish.visible=!!success;}
  function restoreFishingCamera(){
    if(!fishingCameraState)return;
    cameraYaw=Number(fishingCameraState.yaw||0);cameraPitch=clamp(Number(fishingCameraState.pitch||.28),-.55,1.35);cameraZoom=Number(fishingCameraState.zoom||0);state.settings.cameraPitch=+cameraPitch.toFixed(3);fishingCameraState=null;input.cameraDrag=null;
  }
  function stopFishingVisual(delay=0){
    const v=fishingVisual;
    if(!v){restoreFishingCamera();return;}
    const token=++v.hideToken;
    const hide=()=>{if(token!==v.hideToken)return;v.active=false;v.phase='idle';v.rodRoot.visible=false;v.line.visible=false;v.bobber.visible=false;v.fish.visible=false;v.bobber.scale.setScalar(1);if(player.emoteType==='fishing'){player.emoteType='';player.emoteUntil=0;player.emoteSeq=(player.emoteSeq||0)+1;}setFishingUiActive(false);restoreFishingCamera();};
    if(delay>0)setTimeout(hide,delay);else hide();
  }
  function clearFishingTimers(session=fishingSession){if(!session)return;clearTimeout(session.hookTimer);clearTimeout(session.escapeTimer);clearTimeout(session.finishTimer);}
  function setFishingUiActive(active){
    document.body.classList.toggle('mode-fishing',!!active);
    if(active){state.ui.quickOpen=false;state.ui.skillsOpen=false;state.ui.needsOpen=false;state.ui.missionOpen=false;els.game?.classList.remove('needs-expanded');els.missionCard?.classList.remove('expanded');syncMobilePanels();}
    scheduleStableResize(0,true);
  }
  function cancelFishingSession(){clearFishingTimers();fishingSession=null;stopFishingVisual();}
  function ensureFishingModalStyle(){
    if(document.getElementById('otthosFishingModalStyle'))return;
    const style=document.createElement('style');style.id='otthosFishingModalStyle';style.textContent=`
      .modal.fishing-modal{z-index:1450!important;inset:0!important;width:100%!important;height:100dvh!important;background:linear-gradient(180deg,rgba(0,8,18,.02),rgba(0,8,18,.18))!important;backdrop-filter:none!important;pointer-events:none!important;align-items:flex-end!important;justify-content:center!important;padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))!important}
      .modal.fishing-modal .modal-card{position:relative!important;display:flex!important;flex-direction:column!important;pointer-events:auto!important;width:min(430px,100%)!important;max-width:100%!important;height:auto!important;max-height:min(196px,calc(100dvh - 16px))!important;margin:0!important;border-radius:18px!important;background:rgba(5,22,38,.95)!important;border:1px solid rgba(112,231,255,.62)!important;box-shadow:0 12px 32px rgba(0,0,0,.44)!important;overflow:hidden!important}
      .modal.fishing-modal .modal-card>header{position:absolute!important;right:4px!important;top:3px!important;z-index:3!important;padding:0!important;min-height:0!important;border:0!important}.modal.fishing-modal .modal-card>header h2{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important}.modal.fishing-modal .modal-card>header button{width:32px!important;height:32px!important;background:rgba(255,255,255,.12)!important}
      .modal.fishing-modal .modal-body{flex:1 1 auto!important;min-height:0!important;padding:9px 42px 9px 10px!important;max-height:none!important;overflow:auto!important;overscroll-behavior:contain!important}.modal.fishing-modal .activity-card{padding:0!important}.modal.fishing-modal .fishing-compact-status{min-height:24px;display:flex;align-items:center;justify-content:center;padding:0 3px;font-size:clamp(12px,3.6vw,15px);font-weight:900;color:#fff;white-space:normal;text-align:center;line-height:1.2}.modal.fishing-modal .fishing-camera-hint{margin:2px 0 5px;text-align:center;font-size:10px;color:#aeeeff}.modal.fishing-modal .activity-meter{margin:5px 0!important;height:7px!important}.modal.fishing-modal .btn.xl{width:100%!important;min-height:40px!important;padding:7px 11px!important;font-size:13px!important}
      @media (orientation:landscape){.modal.fishing-modal{align-items:flex-end!important;justify-content:flex-start!important;padding:6px 6px max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))!important}.modal.fishing-modal .modal-card{width:min(370px,44vw)!important;max-height:min(174px,calc(100dvh - 12px))!important}.modal.fishing-modal .modal-body{padding:7px 40px 7px 8px!important}.modal.fishing-modal .fishing-compact-status{font-size:12px!important}.modal.fishing-modal .fishing-camera-hint{font-size:9px!important;margin-bottom:3px!important}.modal.fishing-modal .btn.xl{min-height:35px!important}}
      @media (orientation:landscape) and (max-height:410px){.modal.fishing-modal .modal-card{width:min(350px,43vw)!important;max-height:146px!important}.modal.fishing-modal .modal-body{padding-top:5px!important;padding-bottom:5px!important}.modal.fishing-modal .fishing-compact-status{min-height:19px!important}.modal.fishing-modal .fishing-camera-hint{display:none!important}.modal.fishing-modal .activity-meter{margin:3px 0!important;height:6px!important}.modal.fishing-modal .btn.xl{min-height:31px!important;padding:4px 8px!important;font-size:11px!important}}
    `;document.head.appendChild(style);
  }
  function updateFishingVisual(){
    const v=fishingVisual;if(!v?.active)return;const now=performance.now(),tip=new THREE.Vector3();v.tip.getWorldPosition(tip);let lineEnd=v.bobber.position;
    if(v.phase==='ready'){v.bobber.position.copy(tip);v.rodRoot.rotation.x=lerp(v.rodRoot.rotation.x,-.48,.18);}
    else if(v.phase==='casting'){const t=clamp((now-v.phaseAt)/620,0,1),ease=1-Math.pow(1-t,3);v.bobber.position.lerpVectors(v.castStart,v.target,ease);v.bobber.position.y+=Math.sin(Math.PI*t)*2.35;v.rodRoot.rotation.x=lerp(-.18,-.72,ease);if(t>=1){v.phase='waiting';v.phaseAt=now;v.bobber.position.copy(v.target);}}
    else if(v.phase==='waiting'){v.bobber.position.set(v.target.x,.15+Math.sin(now*.007)*.035,v.target.z);v.rodRoot.rotation.x=lerp(v.rodRoot.rotation.x,-.62,.08);}
    else if(v.phase==='hooked'){v.bobber.position.set(v.target.x,.09+Math.sin(now*.026)*.11,v.target.z);v.bobber.scale.setScalar(1.12+Math.sin(now*.03)*.12);v.rodRoot.rotation.x=lerp(v.rodRoot.rotation.x,-.82,.12);}
    else if(v.phase==='pulling'){const t=clamp((now-v.phaseAt)/820,0,1),ease=1-Math.pow(1-t,3);v.bobber.position.lerpVectors(v.target,tip,ease);v.bobber.position.y+=Math.sin(Math.PI*t)*1.3;v.fish.position.copy(v.bobber.position);v.fish.position.y-=.18;v.fish.rotation.y+=.16;v.fish.rotation.z=Math.sin(now*.025)*.35;v.rodRoot.rotation.x=lerp(v.rodRoot.rotation.x,-1.02,.15);if(t>=1){v.phase='caught';v.phaseAt=now;v.bobber.visible=false;}}
    else if(v.phase==='caught'){v.fish.position.copy(tip);v.fish.position.y-=.35;v.fish.position.x+=Math.sin(now*.02)*.08;v.fish.rotation.z=Math.sin(now*.028)*.42;lineEnd=tip;}
    else if(v.phase==='escaping'){const t=clamp((now-v.phaseAt)/760,0,1);v.bobber.position.set(v.target.x,.12-t*.5,v.target.z);v.bobber.scale.setScalar(1-t*.65);if(t>=1)stopFishingVisual();}
    setFishingLine(tip,lineEnd);
  }
  function createShoreFisher(id,name,x,z,heading,color){
    const npc=createNPC(id,name,x,z,color,0);npc.fishingActivity={heading,phase:Math.random()*Math.PI*2};npc.group.rotation.y=heading;npc.baseX=x;npc.baseZ=z;
    const rod=new THREE.Group();rod.rotation.x=-.58;rod.position.set(.46,1.45,.12);npc.group.add(rod);premiumCylinder(.035,2.25,0x8b5a2b,0,0,0,rod,7);rod.children[rod.children.length-1].rotation.x=Math.PI/2;
    const lineGeo=new THREE.BufferGeometry(),lineArr=new Float32Array(6);lineGeo.setAttribute('position',new THREE.BufferAttribute(lineArr,3));const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xe8f7ff,transparent:true,opacity:.75,depthWrite:false}));worldGroup.add(line);
    const bobber=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),renderMat(0xff5647,{emissive:0x8c160f,emissiveIntensity:.32,roughness:.5}));worldGroup.add(bobber);const reach=3.8+Math.random()*1.4,dx=Math.sin(heading),dz=Math.cos(heading);bobber.position.set(x+dx*reach,.16,z+dz*reach);npc.fishingActivity.rod=rod;npc.fishingActivity.line=line;npc.fishingActivity.bobber=bobber;npc.fishingActivity.reach=reach;world.shoreFishers.push(npc);return npc;
  }
  function createShoreFishingLife(){
    if(world.shoreFishers.length)return;[
      ['shore-fisher-otto','Otto',-72.5,42.2,0,0x2f78d1],['shore-fisher-luna','Luna',-79.0,42.1,0,0xe35d9c],['shore-fisher-pedro','Pedro',-86.0,42.2,0,0x2faa68],['shore-fisher-maya','Maya',-73.5,65.8,Math.PI,0xf09a31],['shore-fisher-caio','Caio',-81.0,65.9,Math.PI,0x805ad5]
    ].forEach(args=>createShoreFisher(...args));
  }
  function updateShoreFishers(dt){
    if(textures.water){textures.water.offset.x=(textures.water.offset.x+dt*.012)%1;textures.water.offset.y=(textures.water.offset.y+dt*.006)%1;}
    const now=performance.now();for(const npc of world.shoreFishers){const act=npc.fishingActivity;if(!act)continue;npc.group.position.set(npc.baseX,0,npc.baseZ);npc.group.rotation.y=act.heading;const pulse=Math.sin(now*.0021+act.phase),bite=Math.sin(now*.006+act.phase)> .92;act.rod.rotation.x=-.58+pulse*.035-(bite?.1:0);if(npc.limbs){npc.limbs.leftArm.rotation.x=lerp(npc.limbs.leftArm.rotation.x,-1.55+(bite?-.18:0),.18);npc.limbs.rightArm.rotation.x=lerp(npc.limbs.rightArm.rotation.x,-1.72+(bite?-.25:0),.18);npc.limbs.leftLeg.rotation.x=lerp(npc.limbs.leftLeg.rotation.x,.16,.18);npc.limbs.rightLeg.rotation.x=lerp(npc.limbs.rightLeg.rotation.x,-.16,.18);}act.bobber.position.y=.15+Math.sin(now*.004+act.phase)*.035-(bite?.055:0);const tip=new THREE.Vector3();act.rod.localToWorld(tip.set(0,1.08,0));const arr=act.line.geometry.attributes.position.array;arr[0]=tip.x;arr[1]=tip.y;arr[2]=tip.z;arr[3]=act.bobber.position.x;arr[4]=act.bobber.position.y;arr[5]=act.bobber.position.z;act.line.geometry.attributes.position.needsUpdate=true;}
  }
  function createBoatModel(){
    const g=new THREE.Group();const hull=renderMat(0x7b3f20,{roughness:.72}),edge=renderMat(0xe3ad55,{roughness:.62}),seat=renderMat(0x374151,{roughness:.72});
    premiumBox(2.4,.42,4.4,hull,0,.38,0,g);premiumBox(2.75,.25,3.85,edge,0,.67,0,g);premiumBox(1.85,.23,3.15,renderMat(0x2d6f8d,{roughness:.48}),0,.83,0,g);premiumBox(1.75,.25,.55,seat,0,1.02,-.65,g);premiumBox(1.75,.25,.55,seat,0,1.02,.72,g);premiumBox(.12,1.8,.12,0xd8c28d,.95,1.35,.1,g);premiumBox(1.45,.05,.72,0xf5f1df,.25,2.05,.1,g);g.position.set(-70,.1,54);worldGroup.add(g);world.boat={id:'lake-boat',group:g,x:-70,z:54,heading:0,driverUid:'',passengerUid:''};
    registerInteractable({id:'lake-boat-entry',type:'boat',icon:'🛶',label:'Entrar no barco',radius:3.1,priority:180,getPos:()=>({x:world.boat?.group.position.x||-70,z:world.boat?.group.position.z||54}),action:enterBoat});
  }
  function ensureBoatPanel(){
    if(boatPanel)return boatPanel;boatPanel=document.createElement('div');boatPanel.id='boatActivityPanel';boatPanel.className='boat-activity-panel';boatPanel.innerHTML='<button type="button" data-boat-fish>🎣<span>Pescar</span></button><button type="button" data-boat-exit>🏝️<span>Sair</span></button>';document.body.appendChild(boatPanel);boatPanel.querySelector('[data-boat-fish]').onclick=()=>startFishing('boat');boatPanel.querySelector('[data-boat-exit]').onclick=()=>exitBoat();return boatPanel;
  }
  function updateBoatPanel(){const panel=ensureBoatPanel();panel.hidden=!player.boating;if(player.boating){const passenger=!!player.boat.passengerOf;panel.querySelector('[data-boat-fish]').disabled=passenger;panel.querySelector('[data-boat-fish] span').textContent=passenger?'Passageiro':'Pescar';}}
  async function enterBoat(){
    if(player.boating)return false;
    if(!canEnterMobility(PLAYER_MODES.BOAT_DRIVER)&&!player.vehicle)return false;
    if(player.vehicle)exitVehicle(true);
    if(player.transit.mode||!world.boat)return false;
    const p=world.boat.group.position;if(Math.hypot(player.x-p.x,player.z-p.z)>3.6){toast('Chegue perto do barco pelo píer.','warn');return false;}
    const lock=await window.OTTHOS_RTDB?.claimBoat?.(world.boat.id);if(lock&&lock.ok===false){toast(lock.error||'O barco já está sendo usado por outro jogador.','warn',2800);return false;}
    input.mobilityAccelerate=false;input.mobilityBrake=false;player.boating=true;player.boat.passengerOf='';player.boat.passengerUid='';player.boat.passengerBotId='';player.boat.heading=world.boat.heading||0;player.boat.speed=0;player.boat.steerVisual=0;player.x=p.x;player.z=p.z;player.y=.18;player.vx=player.vz=0;state.boats.activeBoatId=world.boat.id;state.boats.passengerOf='';const companion=nearestRideCompanion(9);if(companion)boardNpcPassenger(companion,'boat');updateBoatPanel();updateVehicleControlsUI();auditPlayerMode('board-boat-driver');toast('Barco pronto. Use o manche para navegar.','good',2300);saveState(true);return true;
  }
  function enterBoatAsPassenger(hostUid){
    const ghost=world.ghosts.get(hostUid),target=ghost?.userData?.target;
    if(!ghost||!target?.boating||target.boatRole==='passenger'){toast('O motorista ou o barco não está mais disponível.','warn');return false;}
    if(player.boating){toast('Você já está em um barco.','warn');return false;}
    if(player.vehicle)exitVehicle(true);
    if(player.transit.mode||!canEnterMobility(PLAYER_MODES.BOAT_PASSENGER))return false;
    player.boating=true;player.boat.passengerOf=hostUid;player.boat.passengerBotId='';player.boat.speed=0;player.x=ghost.position.x;player.z=ghost.position.z;state.boats.activeBoatId=target.boatId||'lake-boat';state.boats.passengerOf=hostUid;updateBoatPanel();updateVehicleControlsUI();auditPlayerMode('board-remote-boat');toast('Você entrou como passageiro. O motorista controla o barco.','good',2600);saveState(true);return true;
  }
  function exitBoat(silent=false){
    if(!player.boating)return false;
    if(!silent&&!validBoatExit()){toast('Encoste a lateral do barco no píer para sair com segurança.','warn',2500);return false;}
    const passengerHost=player.boat.passengerOf,hostedPassenger=player.boat.passengerUid,wasPassenger=!!passengerHost;
    if(passengerHost)window.OTTHOS_RTDB?.sendInteraction?.(passengerHost,{type:'boatPassengerLeft'});else if(hostedPassenger)window.OTTHOS_RTDB?.sendInteraction?.(hostedPassenger,{type:'boatEnded'});
    releaseNpcPassenger('boat');input.mobilityAccelerate=false;input.mobilityBrake=false;player.boating=false;player.boat.passengerOf='';player.boat.passengerUid='';player.boat.speed=0;player.boat.steerVisual=0;state.boats.passengerOf='';state.boats.activeBoatId='';if(!wasPassenger&&world.boat)window.OTTHOS_RTDB?.releaseBoat?.(world.boat.id);if(world.boat&&!wasPassenger){world.boat.group.position.set(player.x,.1,player.z);world.boat.heading=player.boat.heading;world.boat.group.rotation.y=player.boat.heading;}
    const safe=safeBoatExitPoint();player.x=safe.x;player.z=safe.z;player.y=groundHeightAt(safe.x,safe.z);player.vx=player.vy=player.vz=0;player.grounded=true;rememberSafePlayerPosition(true);updateBoatPanel();updateVehicleControlsUI();auditPlayerMode('exit-boat');if(!silent)toast('Você desembarcou no píer.','good');saveState(true);return true;
  }
  function updateBoatPhysics(dt,ix,iz){
    const boat=player.boat;if(boat.passengerOf){const ghost=world.ghosts.get(boat.passengerOf),target=ghost?.userData?.target;if(!ghost||!target){boat.hostMissingAt=boat.hostMissingAt||performance.now();if(performance.now()-boat.hostMissingAt>3500){toast('O motorista saiu. Você voltou ao píer.','warn');player.x=BOAT_DOCK.exitX;player.z=54;exitBoat(true);}player.vx=player.vz=0;return;}boat.hostMissingAt=0;const tx=Number(target.x||ghost.position.x),tz=Number(target.z||ghost.position.z);player.vx=clamp((tx-player.x)*8,-18,18);player.vz=clamp((tz-player.z)*8,-18,18);boat.heading=Number(target.r||boat.heading);player.facing=boat.heading;return;}
    // V643: mesma convenção do carro — manche para a direita vira para a direita.
    const steer=Math.abs(ix)<.07?0:-ix,command=mobilityThrottleIntent(iz,boat.speed),throttle=command.throttle;
    if(command.brake)boat.speed=approachNumber(boat.speed,0,(7.2+Math.abs(boat.speed)*.8)*dt);else{const crossing=boat.speed*throttle<-.08;boat.speed+=throttle*8.5*(crossing?1.8:1)*dt;}
    if(!throttle&&!command.brake)boat.speed*=Math.pow(.12,dt);if(Math.abs(boat.speed)<.02&&!throttle)boat.speed=0;boat.speed=clamp(boat.speed,-3.4,8.8);boat.steerVisual=lerp(boat.steerVisual||0,steer,Math.min(1,dt*6.5));const authority=Math.max(clamp(Math.abs(boat.speed)/2.8,0,1),Math.abs(throttle)>.1?.12:0);const turnRate=1.5/(1+Math.abs(boat.speed)*.075);boat.heading+=boat.steerVisual*turnRate*authority*dt*(boat.speed<-.08?-1:1);player.vx=Math.sin(boat.heading)*boat.speed;player.vz=Math.cos(boat.heading)*boat.speed;player.facing=boat.heading;updateMobilityControlLabels();
  }
  function constrainBoat(prevX,prevZ){if(!player.boating)return;if(!isInsideLakeNavigable(player.x,player.z)){player.x=prevX;player.z=prevZ;player.boat.speed*=-.18;player.vx=player.vz=0;}if(world.boat){world.boat.group.position.set(player.x,.1,player.z);world.boat.group.rotation.y=player.boat.heading;world.boat.heading=player.boat.heading;}state.boats.lastPosition={x:+player.x.toFixed(2),z:+player.z.toFixed(2),heading:+player.boat.heading.toFixed(3)};}
  function weightedFish(){let r=Math.random()*100;for(const fish of FISH_SPECIES){r-=fish.weight;if(r<=0)return fish;}return FISH_SPECIES[0];}
  function startFishing(source='shore',options={}){
    if(fishingSession){toast('Finalize a pesca atual primeiro.','warn');return;}if((state.inventory.fishingRod||0)<1){toast('Você precisa de uma vara de pesca.','warn');return;}if((state.inventory.bait||0)<1){toast('Você ficou sem isca.','warn');return;}if(source==='boat'&&!player.boating){toast('Entre no barco primeiro.','warn');return;}if(source!=='boat'&&!isNearFishingArea()){toast('Pesque somente nos pontos marcados da margem.','warn');return;}const wait=Math.max(0,6500-(Date.now()-Number(state.fishing.lastAttempt||0)));if(wait>0){toast(`Aguarde ${Math.ceil(wait/1000)} s para tentar novamente.`,'warn');return;}
    setFishingUiActive(true);const token=uid();fishingSession={token,source,options,hookTimer:0,escapeTimer:0,finishTimer:0};beginFishingVisual(source);ensureFishingModalStyle();openModal(options.cooperative?'Pesca com amigo':'Pesca',`<div class="activity-card fishing-card"><div class="fishing-compact-status" data-fishing-status>🎣 Pronto</div><div class="fishing-camera-hint">↔ Arraste a paisagem para girar a câmera</div><div class="activity-meter"><i data-fishing-meter></i></div><button class="btn primary xl" data-cast>Lançar</button><button class="btn good xl" data-pull hidden>PUXAR!</button></div>`,root=>{
      els.modal.classList.add('fishing-modal');
      const status=$('[data-fishing-status]',root),cast=$('[data-cast]',root),pull=$('[data-pull]',root),meter=$('[data-fishing-meter]',root);
      cast.onclick=()=>{if(!fishingSession||fishingSession.token!==token)return;cast.disabled=true;state.inventory.bait--;state.fishing.lastAttempt=Date.now();saveState(true);status.textContent='🎣 Aguarde…';meter.style.animation='fishingWait 2.4s linear forwards';castFishingVisual();const hookDelay=1400+Math.random()*1700;fishingSession.hookTimer=setTimeout(()=>{if(!fishingSession||fishingSession.token!==token||els.modal.hidden){cancelFishingSession();return;}status.textContent='⚡ Fisgou!';pull.hidden=false;hookFishingVisual();beep(880,100,'sine');vibrate([35,35,55]);fishingSession.hookedAt=performance.now();fishingSession.escapeTimer=setTimeout(()=>{if(!fishingSession||fishingSession.token!==token)return;status.textContent='💨 Escapou';pull.hidden=true;pullFishingVisual(false);fishingSession.finishTimer=setTimeout(()=>{if(fishingSession?.token===token)fishingSession=null;stopFishingVisual();},800);},2700);},hookDelay);};
      pull.onclick=()=>{if(!fishingSession||fishingSession.token!==token)return;clearTimeout(fishingSession.escapeTimer);const reaction=performance.now()-Number(fishingSession.hookedAt||performance.now()),success=reaction<2400&&Math.random()<.88;pull.hidden=true;if(!success){status.textContent='💨 Escapou';pullFishingVisual(false);saveState();fishingSession.finishTimer=setTimeout(()=>{if(fishingSession?.token===token)fishingSession=null;stopFishingVisual();},800);return;}const fish=weightedFish(),size=+(fish.min+Math.random()*(fish.max-fish.min)).toFixed(2),catchId=uid();state.inventory.rawFish=(state.inventory.rawFish||0)+1;state.fishing.catches.push({id:catchId,species:fish.name,size,rarity:fish.rarity,caughtAt:Date.now(),source,cooperative:!!options.cooperative});state.fishing.catches=state.fishing.catches.slice(-200);state.fishing.species[fish.name]=(state.fishing.species[fish.name]||0)+1;let xp=fish.xp,coins=fish.coins;if(options.cooperative&&options.requestId&&!state.fishing.cooperativeRewards.includes(options.requestId)){state.fishing.cooperativeRewards.push(options.requestId);state.fishing.cooperativeRewards=state.fishing.cooperativeRewards.slice(-80);xp+=6;coins+=3;}addXP(xp);addCoins(coins);status.textContent=`🐟 ${fish.name} • ${size} kg • ${fish.rarity}`;pullFishingVisual(true,{...fish,size});beep(1040,130,'sine');vibrate([40,35,70]);clearFishingTimers(fishingSession);fishingSession=null;stopFishingVisual(1800);saveState(true);};
    });
  }
