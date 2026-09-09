/**
 * OTTHI World Edu V644 — módulo-fonte
 * Arquivo: 31-neighborhood-world-controller.js
 * Escopo: bairros reais, transição do mundo, vagas, casas e mapa coerente
 * Este arquivo é compilado em app.js por tools/build_project.py.
 */
// @otthi-module-body
  const ROOM_WORLD_LAYOUTS=new Map((window.OTTHI_CONFIG?.rooms||[]).map(room=>[room.id,{...room,shortName:String(room.name||'Bairro').replace('Bairro da ','').replace('Bairro do ','').replace('Bairro ','')}]))
  let appliedRoomId='';
  function roomWorldInfo(id=window.OTTHOS_RTDB?.getRoom?.()||window.OTTHI_CONFIG?.defaultRoom||'bairro-central'){return ROOM_WORLD_LAYOUTS.get(id)||ROOM_WORLD_LAYOUTS.values().next().value||{id:'bairro-central',name:'Bairro Central',icon:'🏙️',entry:{x:0,z:8,yaw:0},bounds:{xMin:-48,xMax:48,zMin:-22,zMax:38},capacity:10};}
  function roomHouseMarkers(){const mineUid=window.OTTHOS_RTDB?.uid||'';return [...cloudHouses.entries()].map(([id,data])=>{const local=world.houses.find(h=>h.id===id);const x=Number.isFinite(Number(data.x))&&Number(data.x)!==0?Number(data.x):Number(local?.x||0),z=Number.isFinite(Number(data.z))&&Number(data.z)!==0?Number(data.z):Number(local?.z||0);return{id,name:data.name||`Casa de ${data.ownerName||'Jogador'}`,ownerName:data.ownerName||'Jogador',ownerUid:data.ownerUid||'',x,z,mine:data.ownerUid===mineUid,locked:!!data.locked};}).filter(item=>Number.isFinite(item.x)&&Number.isFinite(item.z));}
  function mapHouseLocations(){return roomHouseMarkers().map(h=>({id:`online-house-${h.id}`,houseId:h.id,name:h.name,icon:h.mine?'🏠':'🏡',x:h.x,z:h.z,navX:h.x,navZ:h.z,group:'Casas online',onlineHouse:true}));}
  function mapRegionsMarkup(project=worldToMap){return[...ROOM_WORLD_LAYOUTS.values()].map(room=>{const a=project(room.bounds.xMin,room.bounds.zMax),b=project(room.bounds.xMax,room.bounds.zMin),left=Math.min(a.left,b.left),top=Math.min(a.top,b.top),width=Math.abs(b.left-a.left),height=Math.abs(b.top-a.top),active=room.id===(window.OTTHOS_RTDB?.getRoom?.()||window.OTTHI_CONFIG?.defaultRoom);return`<span class="map-neighborhood-region ${active?'active':''}" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;width:${width.toFixed(2)}%;height:${height.toFixed(2)}%;--room-accent:${room.accent||'#66e7ff'}" title="${escapeHtml(room.name)}"><b>${room.icon}</b><em>${room.shortName}</em></span>`;}).join('');}
  function clearRemoteRoomEntities(){
    for(const ghost of world.ghosts.values())scene?.remove(ghost);world.ghosts.clear();remotePresence.clear();multiplayerState.players=[];multiplayerState.count=1;
    cloudHouses.clear();cloudChat.splice(0);gameSessions.clear();pendingCloudCampfires={};pendingCloudExtensions={};applyCloudWorldObjects();reconcileCloudHouses();closeChallengePrompt();updateMultiplayerBadge();refreshOpenSocialHub();
  }
  function resetMobilityForRoomChange(){
    if(fishingSession)cancelFishingSession();if(buildMode)endBuildMode('cancelled',true);if(currentHouse)exitHouse();if(player.vehicle)exitVehicle(true);if(player.boating)exitBoat(true);
    if(player.transit.mode){player.transit.mode='';player.transit.busId='';player.transit.destinationId='';player.transit.requestStop=false;player.sitUntil=0;if(playerModel)playerModel.visible=true;if(avatarLayer)avatarLayer.visible=true;if(contactShadow)contactShadow.visible=true;document.body.classList.remove('bus-passenger');if(transitPanel)transitPanel.hidden=true;}
    clearMovementInputs();player.vx=player.vy=player.vz=0;player.grounded=true;
  }
  function canChangeRoom(){return{ok:true};}
  function focusCurrentRoom(){const room=roomWorldInfo();state.waypoint={id:`room-${room.id}`,name:`Entrada — ${room.name}`,x:room.entry.x,z:room.entry.z,navX:room.entry.x,navZ:room.entry.z,arrived:false};world.routePath=buildRoutePoints(player,state.waypoint);updateNavigation(0,true);toast(`${room.icon} Você já está no ${room.name}.`,'good',1800);}
  function applyRoomWorld(roomId,options={}){
    const room=roomWorldInfo(roomId);if(!room)return false;const changed=appliedRoomId!==room.id,shouldTeleport=options.teleport!==false&&(changed||options.forceTeleport===true);
    if(shouldTeleport){const entry=safePointNear(room.entry.x,room.entry.z,{ignoreTraffic:true,allowWater:false,radius:.4,distances:[0,.7,1.2,1.8]});player.x=entry.x;player.y=entry.y||0;player.z=entry.z;player.facing=Number(room.entry.yaw||0);cameraYaw=player.facing;playerGroup?.position?.set(player.x,player.y,player.z);playerGroup&&(playerGroup.rotation.y=player.facing);state.position={x:player.x,y:player.y,z:player.z,yaw:cameraYaw};state.waypoint=null;world.routePath=[];}
    state.multiplayer.room=room.id;appliedRoomId=room.id;rememberSafePlayerPosition(true);updateNavigation(0,true);updateContext(true);updateHUD();saveState(true);window.dispatchEvent(new CustomEvent('otthi:room-world-ready',{detail:{room:room.id,name:room.name,entry:{x:player.x,z:player.z},changed}}));if(options.toast!==false)toast(`${room.icon} Você entrou no ${room.name}.`,'good',2600);return true;
  }
  window.addEventListener('otthi:room-changing',()=>{clearRemoteRoomEntities();resetMobilityForRoomChange();});
  window.addEventListener('otthi:room-changed',event=>{if(event.detail?.connected===false)return;const actualChange=!!event.detail?.previousRoom&&event.detail.previousRoom!==event.detail?.room;applyRoomWorld(event.detail?.room,{toast:actualChange,teleport:actualChange});});
  window.addEventListener('otthos:mp-status',event=>{const room=event.detail?.room;if(event.detail?.connected&&room&&!appliedRoomId&&running)applyRoomWorld(room,{toast:false,teleport:state.multiplayer.room!==room});});
  window.addEventListener('otthos:houses',()=>{if(!els.modal.hidden&&els.modal.classList.contains('map-modal'))refreshOpenMapAfterResize();updateNavigation(0,true);});
  window.OTTHI_ROOM_WORLD={current:()=>roomWorldInfo(),get:roomWorldInfo,canChangeRoom,apply:applyRoomWorld,focusCurrentRoom,houseMarkers:roomHouseMarkers,mapHouseLocations,mapRegionsMarkup};
