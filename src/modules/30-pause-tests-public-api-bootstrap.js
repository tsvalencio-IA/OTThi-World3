/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 30-pause-tests-public-api-bootstrap.js
 * Escopo: Pausa, testes de veículo, API pública de auditoria e bootstrap final
 * Linhas de origem V642: 4378-4557
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function stopGame(){
    if(buildMode)endBuildMode('cancelled',true);
    if(world.policeAlert)removeRoadsidePoliceOfficer?.(world.policeAlert);world.policeAlert=null;updateSafetyPanel('');if(player.boating){player.x=-24.7;player.z=52;exitBoat(true);}if(player.vehicle)exitVehicle(true);if(player.transit.mode==='bus'){const bus=world.buses.find(b=>b.id===player.transit.busId);if(bus)exitBusAtStop(bus,{stopId:bus.lastStopId,stopName:bus.lastStopName});}if(player.transit.mode==='metro'){player.transit.mode='';if(metroOverlay)metroOverlay.hidden=true;if(playerModel)playerModel.visible=true;if(avatarLayer)avatarLayer.visible=true;if(contactShadow)contactShadow.visible=true;}running=false;paused=false;pauseMenuOpen=false;cancelAnimationFrame(raf);stopEngineSound();savePlayerPosition(true);showScreen('lobby');updateLobbyStats();
  }
  els.playBtn.onclick=()=>requestPreferredGameOrientation().finally(()=>startGame(false));els.continueBtn.onclick=()=>requestPreferredGameOrientation().finally(()=>startGame(false));

  function openPauseMenu(){
    if(!running||pauseMenuOpen)return;
    if(buildMode)endBuildMode('cancelled',true);
    paused=true;pauseMenuOpen=true;if(engineAudio)stopEngineSound();openModal('Jogo pausado',`<div class="choice-grid"><button class="choice" data-resume><b>▶ Continuar</b><span>Voltar ao mundo</span></button><button class="choice" data-life><b>👤 Minha vida</b><span>Carreira, amizades e visual</span></button><button class="choice" data-safe><b>🛟 Desprender</b><span>Voltar ao último ponto seguro</span></button><button class="choice" data-home><b>🏠 Casa</b><span>Voltar para minha casa</span></button><button class="choice" data-menu><b>↩ Menu inicial</b><span>Salvar e sair</span></button></div>`,root=>{
      $('[data-resume]',root).onclick=()=>closeModal();
      $('[data-life]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();if(player.vehicle)startEngineSound();openLifePanel();};
      $('[data-safe]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();recoverPlayerToLastSafe('retorno manual',true);};
      $('[data-home]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();returnHome();};
      $('[data-menu]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();stopGame();};
    });
  }
  els.gameSettingsBtn.addEventListener('contextmenu',e=>e.preventDefault());

  function updateBridgeVisual(){world.bridgeParts.forEach((p,i)=>{p.visible=state.flags.bridgeFixed||i%2===0;});}


  function prepareVehicleTestArea(){
    if(currentHouse)exitHouse();
    if(player.vehicle)exitVehicle(true);
    clearMovementInputs();
    const vehicle=(world.vehicles||[]).find(item=>item?.group&&!item.occupied&&!vehicleBrokenV704?.(item))||(world.vehicles||[]).find(item=>item?.group&&!item.occupied)||world.vehicle;
    if(!vehicle)return {x:player.x,z:player.z,active:false,heading:player.car.heading,vehicleId:'',error:'no-available-vehicle'};
    player.x=vehicle.group.position.x;player.z=vehicle.group.position.z;player.y=groundHeightAt(player.x,player.z);
    player.vx=0;player.vy=0;player.vz=0;player.grounded=true;player.sitUntil=0;
    player.facing=0;player.car.heading=0;player.car.speed=0;player.car.steerVisual=0;player.car.drift=0;player.car._prevSpeed=0;
    vehicleImpactCount=0;
    const entered=enterVehicle(vehicle);
    return {x:player.x,z:player.z,active:!!entered&&player.vehicle,heading:player.car.heading,vehicleId:player.car.id||''};
  }
  function stepVehicleSimulation(frames=120,steer=.35,throttle=1){
    if(!player.vehicle){const prepared=prepareVehicleTestArea();if(!prepared.active)return {...prepared,frames:0,seconds:0,distance:0,speed:0,impacts:0};}
    const count=clamp(Math.round(Number(frames)||120),1,600);
    const sx=clamp(Number(steer)||0,-1,1),sz=clamp(Number(throttle)||0,-1,1);
    const dt=1/60,startX=player.x,startZ=player.z,startImpacts=vehicleImpactCount;
    const wasPaused=paused;paused=true;
    for(let i=0;i<count;i++){
      updateVehiclePhysics(dt,sx,sz);
      const prevX=player.x,prevZ=player.z;
      {const b=v704WorldBounds();player.x=clamp(player.x+player.vx*dt,b.minX,b.maxX);
      player.z=clamp(player.z+player.vz*dt,b.minZ,b.maxZ);}
      resolveCollisions(prevX,prevZ);
      const ground=groundHeightAt(player.x,player.z);player.y=ground;player.vy=0;player.grounded=true;
    }
    playerGroup?.position?.set(player.x,player.y,player.z);
    paused=wasPaused;
    return {frames:count,seconds:count*dt,distance:Math.hypot(player.x-startX,player.z-startZ),speed:player.car.speed,x:player.x,z:player.z,impacts:vehicleImpactCount-startImpacts};
  }

  // Public test/audit API
  window.OTTHOS_TEST_API={
    version:'V643_PRECISION_MOBILITY_TRAFFIC_FISHING_1',
    diagnostics:runtimeDiagnostics,
    playerMode:()=>({state:playerModeMachine.state,enteredAt:playerModeMachine.enteredAt,lastReason:playerModeMachine.lastReason,conflicts:[...playerModeMachine.conflicts],history:playerModeMachine.history.map(x=>({...x}))}),
    toggleTechnicalPanel,
    controlMath:(x=0,z=0,yaw=0,mode='WALKING')=>{const key=String(mode).toUpperCase(),resolved=PLAYER_MODES[key]||String(mode).toLowerCase();if([PLAYER_MODES.CAR_DRIVER,PLAYER_MODES.MOTORCYCLE_DRIVER,PLAYER_MODES.BICYCLE,PLAYER_MODES.SKATE,PLAYER_MODES.BOAT_DRIVER].includes(resolved))return{x:clamp(Number(x)||0,-1,1),z:clamp(Number(z)||0,-1,1),steer:-clamp(Number(x)||0,-1,1),throttle:clamp(Number(z)||0,-1,1),mode:resolved};const vector=cameraRelativeVector(Number(x)||0,Number(z)||0,Number(yaw)||0);return{x:vector.x,z:vector.z,steer:0,throttle:0,mode:resolved};},
    missionStates:()=>({...MISSION_STATES}),
    startJobById:(id='gather',focus=false)=>startJob(JOBS.find(j=>j.id===id),{focus}),
    forceCompleteJob:()=>completeActiveJob(),
    setInventory:patch=>{state.inventory={...state.inventory,...(patch||{})};saveState(true);return{...state.inventory};},
    prepareBuild:(type='block',x=0,z=35,facing=0)=>{player.x=Number(x)||0;player.z=Number(z)||35;player.y=groundHeightAt(player.x,player.z);player.facing=Number(facing)||0;return beginBuildMode(type);},
    placeBuild:()=>placeBuild(),
    rotateBuild:()=>rotateBuildPreview(),
    cancelBuild:()=>endBuildMode('cancelled',true),
    construction:()=>({mode:buildMode,placement:buildPlacement?{...buildPlacement}:null,stateBuilds:JSON.parse(JSON.stringify(state.builds)),tombstones:JSON.parse(JSON.stringify(state.buildTombstones||[])),worldBuilds:world.builds.map(item=>({id:item.data.id,type:item.data.type,x:item.data.x,z:item.data.z,groundY:item.data.groundY,ownerId:item.data.ownerId}))}),
    reconcileBuilds:()=>reconcileWorldBuilds(),
    saveNow:()=>{savePlayerPosition(true);return JSON.parse(JSON.stringify(state.position));},
    performance:()=>({fps:+perf.fps.toFixed(1),targetRenderFps:targetRenderFrameRate(),renderedFrames:perf.renderedFrames,tier:qualityTier(),requested:requestedQuality(),dpr:renderer?.getPixelRatio?.()||0,drawCalls:renderer?.info?.render?.calls||0,triangles:renderer?.info?.render?.triangles||0,culling:{criticalVisible:Number(perf.criticalVisible||0),criticalHidden:Number(perf.criticalHidden||0),dynamicVisible:Number(perf.dynamicVisible||0),dynamicHidden:Number(perf.dynamicHidden||0)},textures:Object.fromEntries(Object.entries(textures).map(([id,t])=>[id,{name:t?.name||'',status:t?.userData?.status||'generated',width:t?.image?.naturalWidth||t?.image?.width||0,height:t?.image?.naturalHeight||t?.image?.height||0}]))}),
    setQuality:(quality='auto')=>{const value=['auto','low','high'].includes(quality)?quality:'auto';state.settings.quality=value;if(value==='auto')perf.sessionTier=resolvedStableAutoTier();applyAdaptiveRenderSettings(true);lockStableSceneVisibility();saveState(true);return{requested:requestedQuality(),tier:qualityTier(),dpr:renderer?.getPixelRatio?.()||0};},
    getState:()=>JSON.parse(JSON.stringify(state)),
    getGame:()=>({running,paused,currentHouse:currentHouse?.id||null,cameraMode,player:{...player},objects:{houses:world.houses.length,npcs:world.npcs.length,enemies:world.enemies.length,interactables:world.interactables.length,builds:world.builds.length,vehicles:world.vehicles.length,buses:world.buses.length,metroStations:world.metroStations.length,policeCars:world.policeCars.length,resources:world.resources.length,school:!!world.school,policeStation:!!world.policeStation,mine:!!world.mine,well:!!world.well}}),
    getVisual:()=>{const parts=playerModel?.userData?.parts||{};const modelY=playerModel?.position?.y||0;const minFootY=playerModel?.userData?.minFootY??0;const scaleY=playerGroup?.scale?.y||1;const rootY=playerGroup?.position?.y||0;return {procedural:!!playerModel?.userData?.proceduralOtthos,rendered:playerModel?.visible!==false,ownNameLabelVisible:playerGroup?.userData?.nameLabel?.visible!==false,rootY,modelY,minFootY,scaleY,visualBottom:rootY+(modelY+minFootY)*scaleY,limbs:{leftArm:parts.leftArm?.rotation?.x||0,rightArm:parts.rightArm?.rotation?.x||0,leftLeg:parts.leftLeg?.rotation?.x||0,rightLeg:parts.rightLeg?.rotation?.x||0}};},
    teleport:(x,z)=>{player.x=x;player.z=z;player.y=groundHeightAt(x,z);player.vx=player.vy=player.vz=0;player.grounded=true;updateContext(true);},
    getContext:()=>currentContext?{id:currentContext.id,label:currentContext.label,type:currentContext.type,activity:currentContext.activity||null}:null,
    getLastAction:()=>lastActionSource,
    action:()=>doAction(),
    jump:()=>requestJump(),
    fire:()=>firePower(),
    enterVehicle:()=>{enterVehicle();return player.vehicle;},
    prepareVehicleTest:prepareVehicleTestArea,
    exitVehicle:()=>{exitVehicle();return !player.vehicle;},
    setDriveInput:(steer=0,throttle=0)=>{input.virtualX=clamp(Number(steer)||0,-1,1);input.virtualZ=clamp(Number(throttle)||0,-1,1);input.virtualActive=Math.abs(input.virtualX)+Math.abs(input.virtualZ)>.001;resolveMovementInput();return {active:input.virtualActive,x:input.targetX,z:input.targetZ};},
    clearDriveInput:()=>{input.virtualX=0;input.virtualZ=0;input.virtualActive=false;resolveMovementInput();return {x:input.targetX,z:input.targetZ};},
    setMobilityButtons:(accelerate=false,brake=false)=>{input.mobilityAccelerate=!!accelerate;input.mobilityBrake=!!brake;if(input.mobilityAccelerate)input.mobilityBrake=false;updateMobilityControlLabels();return{accelerate:input.mobilityAccelerate,brake:input.mobilityBrake};},
    mobilityControls:()=>({driver:mobilityDriverActive(),vehicle:!!player.vehicle,boat:!!player.boating,accelerate:!!input.mobilityAccelerate,brake:!!input.mobilityBrake,speed:player.boating?player.boat.speed:player.car.speed,steeringConvention:'joystick-right => negative internal steer => visual right turn',acceleratorLabel:$('span',els.runBtn)?.textContent||'',brakeLabel:$('span',els.jumpBtn)?.textContent||''}),
    refreshInput:()=>resolveMovementInput(),
    stepVehicleSimulation,
    vehicle:()=>({active:player.vehicle,activeVehicleId:currentVehicleRef()?.id||'',parkedVehicles:world.vehicles.map(v=>({id:v.id,visible:v.group.visible,occupied:v.occupied,x:v.group.position.x,z:v.group.position.z})),speed:player.car.speed,heading:player.car.heading,drift:player.car.drift,sitUntilRemaining:Math.max(0,player.sitUntil-performance.now()),driveInput:{x:input.x,z:input.z,targetX:input.targetX,targetZ:input.targetZ,virtualActive:input.virtualActive,joyX:input.joyX,joyZ:input.joyZ,gamepadActive:input.gamepadActive},playerVisible:playerModel?.visible!==false,accessoriesVisible:avatarLayer?.visible!==false,vehicleVisible:!!vehicleVisual?.visible,parkedVisible:currentVehicleRef()?.group?.visible!==false,preVehicleAbilities:player.preVehicleAbilities?{...player.preVehicleAbilities}:null,specialLabel:$('span',els.specialBtn)?.textContent||'',fireballs:world.fireballs.length,engineActive:!!engineAudio,wheelCount:vehicleVisual?.userData?.wheels?.length||0,frontWheelCount:vehicleVisual?.userData?.frontWheels?.length||0,impactCount:vehicleImpactCount,rootScale:{x:playerGroup?.scale?.x||0,y:playerGroup?.scale?.y||0,z:playerGroup?.scale?.z||0}}),
    pause:()=>openPauseMenu(),
    crouch:()=>toggleCrouch(),
    setSize:setScaleMode,
    spin:spinPlayer,
    controls:()=>({crouch:!!els.crouchBtn,mini:!!els.miniBtn,normal:!!els.normalBtn,giant:!!els.giantBtn,spin:!!els.spinBtn,action:!!els.actionBtn,vehicleAction:!!els.vehicleActionBtn,jump:!!els.jumpBtn,power:!!els.specialBtn}),
    race:()=>activeRace?{type:activeRace.type,npc:activeRace.npcName,playerScore:activeRace.playerScore,opponentScore:activeRace.opponentScore,timeLeft:activeRace.timeLeft}:null,
    startRace:(type='sprint')=>startRace(type,world.npcs[0]),
    map:()=>({player:{x:player.x,z:player.z},waypoint:state.waypoint,route:state.waypoint?buildRoutePoints(player,state.waypoint):[],locations:MAP_LOCATIONS.map(x=>({...x}))}),
    setWaypoint:id=>{setWaypoint(id);return state.waypoint;},
    clearWaypoint:()=>{state.waypoint=null;updateWaypointMarker();updateNavigation(0,true);return true;},
    camera:()=>({yaw:cameraYaw,pitch:cameraPitch,zoom:cameraZoom,mode:cameraMode,position:camera?{x:camera.position.x,y:camera.position.y,z:camera.position.z}:null,fov:camera?.fov||0}),
    setCameraZoom:value=>{cameraZoom=clamp(Number(value)||0,-4.5,9);state.settings.cameraZoom=cameraZoom;return cameraZoom;},
    sprint:active=>{input.touchSprint=!!active;updateRunUI();return sprintRequested();},
    joystickVector:(dx,dy)=>{input.joyX=clamp(dx,-1,1);input.joyZ=clamp(dy,-1,1);return resolveMovementInput();},
    stepPlayer:(frames=1,dt=1/60)=>{const n=clamp(Math.round(Number(frames)||1),1,600),step=clamp(Number(dt)||1/60,.001,.1);for(let i=0;i<n;i++)updatePlayer(step);return{x:player.x,y:player.y,z:player.z,facing:player.facing};},
    enterHouseById:(id)=>{const h=world.houses.find(x=>x.id===id);return h?enterHouse(h):false;},
    exitHouse,
    returnHome,
    recoverToSafe:(reason='teste')=>recoverPlayerToLastSafe(reason,false),
    evaluateMissions,
    installReady:()=>!!deferredInstallPrompt,
    avatar:()=>({...state.avatar}),
    career:()=>({...state.career}),
    openAvatarStudio,
    openJobCenter,
    openObjectivesPanel,
    database:()=>({available:!!window.OTTHOS_DB,name:window.OTTHOS_DB?.name||null,schema:window.OTTHOS_DB?.schema||null,lastSaved:state.lastSaved,autoSaveMs:8000}),
    render:()=>({
      pixelRatio:renderer?.getPixelRatio?.()||0,
      drawCalls:renderer?.info?.render?.calls||0,
      triangles:renderer?.info?.render?.triangles||0,
      textureCount:renderer?.info?.memory?.textures||0,
      geometryCount:renderer?.info?.memory?.geometries||0,
      running,paused,currentHouse:currentHouse?.id||null,vehicleActive:!!player.vehicle,
      shadowMapEnabled:!!renderer?.shadowMap?.enabled,
      cloudCount:world.clouds?.length||0,
      fxParticleCount:(typeof fxParticles!=='undefined'?fxParticles.length:0),
      modelViewerDefined:!!(window.customElements&&customElements.get('model-viewer')),
      wheelFrontCount:vehicleVisual?.userData?.frontWheels?.length||0,
      wheelTotalCount:vehicleVisual?.userData?.wheels?.length||0
    }),
    navigation:()=>({waypoint:state.waypoint,route:world.routePath.map(p=>({...p})),progress:state.waypoint?routeProgressInfo(world.routePath,player):null}),
    trafficAudit:()=>trafficActorList().map(actor=>{const x=actor.group.position.x,z=actor.group.position.z,route=projectPointToPolyline({x,z},actor.group.userData?.roadPath);return{id:actor.id,type:actor.type,x:+x.toFixed(2),z:+z.toFixed(2),roadSafe:trafficFootprintOnRoad(actor),routeDistance:Number.isFinite(route?.distance)?+route.distance.toFixed(2):null};}),
    navigationSigns:()=>({total:(world.navigationSigns||[]).length,visible:(world.navigationSigns||[]).filter(sign=>sign.group?.visible!==false).length,items:(world.navigationSigns||[]).map(sign=>({label:sign.label,kind:sign.kind,x:sign.x,z:sign.z,visible:sign.group?.visible!==false}))}),
    sceneStability:()=>({critical:world.criticalSurfaces.length,hiddenCritical:world.criticalSurfaces.filter(m=>m&&!m.visible).length,frustumCulledCritical:world.criticalSurfaces.filter(m=>m?.frustumCulled).length,staticRenderObjects:world.staticRenderObjects||0,frustumEnabledStatic:(()=>{let n=0;worldGroup?.traverse?.(o=>{if((o.isMesh||o.isLine||o.isSprite)&&o.frustumCulled)n++;});return n;})(),mobile:perf.mobile,shadows:!!renderer?.shadowMap?.enabled}),
    mobileLayout:()=>({portrait:document.body.classList.contains('ui-portrait'),landscape:document.body.classList.contains('ui-landscape'),tiny:document.body.classList.contains('ui-tiny'),skillsOpen:!!state.ui.skillsOpen,quickOpen:!!state.ui.quickOpen}),
    playerIdentity:()=>({name:state.profile.name,confirmed:!!state.profile.nameConfirmed}),
    education:()=>({subjects:Object.keys(EDUCATION_SUBJECTS),summary:educationSummary(),learning:JSON.parse(JSON.stringify(state.learning)),stations:MAP_LOCATIONS.filter(x=>x.group==='Academia')}),
    educationRounds:(subject='math',level=1,seed=123)=>generateEducationRounds(subject,Number(level)||1,Number(seed)||123,5),
    lifeExpansion:()=>({boating:player.boating,boat:{...player.boat,dockDistance:+distanceToBoatDock().toFixed(2),canExit:validBoatExit()},fishing:JSON.parse(JSON.stringify(state.fishing)),fishingVisual:fishingVisual?{active:fishingVisual.active,phase:fishingVisual.phase,source:fishingVisual.source}:null,campfires:JSON.parse(JSON.stringify(state.campfires)),hunting:JSON.parse(JSON.stringify(state.hunting)),houseExtensions:JSON.parse(JSON.stringify(state.houseExtensions)),animals:world.animals.map(a=>({id:a.id,type:a.type,available:a.available}))}),
    transport:()=>({state:JSON.parse(JSON.stringify(state.transport)),mode:player.transit.mode,stations:METRO_STATIONS.map(s=>({...s,group:undefined})),stops:world.busStops.map(s=>({id:s.id,name:s.name,routes:[...s.routes],x:s.x,z:s.z})),buses:world.buses.map(b=>({id:b.id,route:b.route.id,line:b.route.number,x:b.group.position.x,z:b.group.position.z,visible:b.group.visible!==false,stopped:busAtStop(b),lastStopId:b.lastStopId,interiorSeats:b.interiorSeats||0}))}),
    rideMetro:(destinationId='village',stationId='central')=>{const destination=MAP_LOCATIONS.find(x=>x.id===destinationId),station=METRO_STATIONS.find(x=>x.id===stationId)||METRO_STATIONS[0];return destination?rideMetroTo(station,destination):false;},
    boardBus:id=>{const bus=world.buses.find(b=>b.id===id)||world.buses[0];if(!bus)return false;player.x=bus.group.position.x;player.z=bus.group.position.z;bus.currentSpeed=0;bus.doorsOpen=true;bus.stopUntil=performance.now()+2000;bus.lastStopId=bus.lastStopId||'test-stop';bus.lastStopName=bus.lastStopName||'Parada de teste';setBusState(bus,BUS_STATES.DOORS_OPEN,'test-board-ready');return enterBus(bus);},
    exitBus:()=>{const bus=world.buses.find(b=>b.id===player.transit.busId);return bus?exitBusAtStop(bus,{stopId:'test-stop',stopName:'Parada de teste'}):false;},
    stepTransit:(frames=60,dt=1/60)=>{const n=clamp(Math.round(Number(frames)||60),1,1200),step=clamp(Number(dt)||1/60,.001,.1);for(let i=0;i<n;i++)updateTransitWorld(step);return world.buses.map(b=>({id:b.id,x:b.group.position.x,z:b.group.position.z,stopped:busAtStop(b)}));},
    fleet:()=>world.vehicles.map(v=>({id:v.id,label:v.label,x:v.group.position.x,z:v.group.position.z,visible:v.group.visible,occupied:v.occupied})),
    npcMobility:()=>world.npcs.map(n=>({id:n.id,name:n.name,type:n.mobility?.type||'walk',passengerMode:n.passengerMode||'',pendingRide:!!n.pendingRide,x:n.group.position.x,z:n.group.position.z})),
    setNpcRideCompanion:(id='nino')=>{const npc=world.npcs.find(n=>n.id===id);if(!npc)return false;npc.pendingRide=true;npc.following=true;npc.group.position.set(player.x+1,0,player.z);return true;},
    tools:()=>({equipped:state.tools.equipped,owned:[...state.tools.owned],harvested:{...state.tools.harvested},resources:world.resources.map(resource=>({id:resource.id,type:resource.type,hits:resource.hits,hitsNeeded:resource.hitsNeeded,collected:resource.collected}))}),
    equipTool,
    collectResource,
    drawWaterFromWell,
    police:()=>({alert:world.policeAlert?{...world.policeAlert}:null,cars:world.policeCars.map(car=>({id:car.id,x:car.group.position.x,z:car.group.position.z,npcTarget:car.npcTarget||''})),safety:{...state.safety},panelHidden:els.safetyPanel?.hidden!==false}),
    cityServices:()=>({state:JSON.parse(JSON.stringify(state.cityServices)),fires:world.fires.map(f=>({id:f.id,name:f.name,active:f.active,x:f.x,z:f.z,playerHelping:f.playerHelping,truckHelping:f.truckHelping})),fireTrucks:world.fireTrucks.map(t=>({id:t.id,x:t.group.position.x,z:t.group.position.z,targetFireId:t.targetFireId}))}),
    startFire:(id='')=>activateFireIncident(id,true),
    stepFire:(frames=60,dt=1/60)=>{for(let i=0;i<frames;i++)updateFireService(dt);return world.fires.map(f=>({id:f.id,active:f.active}));},
    startPoliceAlert:()=>startPoliceAlert(world.policeCars[0]),
    finishSafetyStop,
    openSafetyLesson,
    openSettings,
    closeModal:()=>{closeModal();return els.modal.hidden;},
    modalState:()=>({hidden:!!els.modal.hidden,title:els.modalTitle?.textContent||'',control:resolveMovementInput()}),
    openAccountCenter,
    triggerEmote,
    adventures:()=>({completed:[...state.adventures.completed],active:world.activeChallenge?{type:world.activeChallenge.type,progress:world.activeChallenge.progress.size,target:world.activeChallenge.target}:null,definitions:JSON.parse(JSON.stringify(ADVENTURE_DEFS))}),
    startAdventure,
    stepAdventure:()=>{updateAdventure();return world.activeChallenge?{type:world.activeChallenge.type,progress:world.activeChallenge.progress.size}:null;},
    startFishing:(source='shore')=>startFishing(source),
    enterBoat:()=>enterBoat(),
    boatDock:()=>({distance:distanceToBoatDock(),canExit:validBoatExit(),dock:{...BOAT_DOCK}}),
    forceBoatState:(x=-38,z=52,heading=0)=>{if(player.vehicle)exitVehicle(true);player.boating=true;player.boat.passengerOf='';player.boat.heading=Number(heading)||0;player.boat.speed=0;player.boat.steerVisual=0;input.mobilityAccelerate=false;input.mobilityBrake=false;player.x=Number(x);player.z=Number(z);player.y=.78;state.boats.activeBoatId='lake-boat';if(world.boat){world.boat.group.position.set(player.x,.1,player.z);world.boat.heading=player.boat.heading;world.boat.group.rotation.y=player.boat.heading;}updateBoatPanel();updateVehicleControlsUI();return{canExit:validBoatExit(),distance:distanceToBoatDock()};},
    exitBoat:(silent=false)=>exitBoat(!!silent),
    stepBoat:(steer=0,throttle=0,frames=60)=>{const n=clamp(Math.round(Number(frames)||60),1,600),dt=1/60,start={x:player.x,z:player.z,heading:player.boat.heading};for(let i=0;i<n;i++){updateBoatPhysics(dt,clamp(Number(steer)||0,-1,1),clamp(Number(throttle)||0,-1,1));const px=player.x,pz=player.z;player.x+=player.vx*dt;player.z+=player.vz*dt;constrainBoat(px,pz);}return{x:player.x,z:player.z,heading:player.boat.heading,speed:player.boat.speed,deltaHeading:player.boat.heading-start.heading,distance:Math.hypot(player.x-start.x,player.z-start.z)};},
    buildCampfire,
    startHunting:()=>startHunting(),
    openHouseExtensionMenu,
    multiplayer:()=>({local:window.OTTHOS_MULTIPLAYER||null,cloud:window.OTTHOS_RTDB?.status?.()||multiplayerState,challenges:pendingChallenges(),socialRequests:socialRequestPending(),sessions:[...gameSessions.values()],ghosts:[...world.ghosts.entries()].map(([id,g])=>({id,vehicle:!!g.userData.carVisual?.visible,boat:!!g.userData.boatVisual?.visible,target:{...(g.userData.target||{})}}))}),
    simulateRemotePresence:(data={})=>{const remote={uid:data.uid||'remote-test',name:data.name||'Jogador Teste',x:Number(data.x??player.x+2),y:Number(data.y??player.y),z:Number(data.z??player.z),r:Number(data.r??player.facing),vehicle:!!data.vehicle,vehicleId:data.vehicleId||'remote-car',vehicleRole:data.vehicleRole||'',boating:!!data.boating,boatId:data.boatId||'',boatRole:data.boatRole||'',scaleMode:data.scaleMode||'normal',color:data.color||0x5ad8ff};remotePlayerEvent(remote);updateMultiplayer(.1);return remote.uid;},
    enterVehiclePassenger:(uid='remote-test')=>enterVehicleAsPassenger(uid),
    enterBoatPassenger:(uid='remote-test')=>enterBoatAsPassenger(uid)
  };

  initTechnicalPanel();auditPlayerMode('ready');updateLobbyStats();evaluateMissions();updateInstallUI();
