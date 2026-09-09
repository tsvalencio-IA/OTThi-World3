/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 15-transit-bus-metro.js
 * Escopo: Ônibus, rotas viárias, paradas, metrô e painel de transporte
 * Linhas de origem V642: 2506-2722
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function compactBusPath(points){
    const out=[];for(const item of points||[]){if(!item||!Number.isFinite(Number(item.x))||!Number.isFinite(Number(item.z)))continue;const p={...item,x:+item.x,z:+item.z},last=out[out.length-1];if(last&&Math.hypot(last.x-p.x,last.z-p.z)<.12){if(p.stopId)Object.assign(last,p);continue;}out.push(p);}return out;
  }
  function projectedBusPoint(point){const projection=nearestRoadProjection(point);return projection?.point?{...point,x:projection.point.x,z:projection.point.z}:{...point};}
  function offsetBusPath(points,offset=BUS_LANE_OFFSET){
    const source=compactBusPath(points);if(source.length<2)return source;return offsetBrazilianTrafficPath(source,offset,{closed:true,valid:(x,z)=>pointOnRoad(x,z,-1.62),factors:[1,.72,.45,0]});
  }
  function buildBusRoadPath(route){
    const source=route?.points||[];if(source.length<2)return source.map(projectedBusPoint);
    const center=[];const first=projectedBusPoint(source[0]);center.push(first);
    for(let i=0;i<source.length;i++){
      const from=projectedBusPoint(source[i]),targetSource=source[(i+1)%source.length],to=projectedBusPoint(targetSource),lastLeg=i===source.length-1;
      let leg=compactBusPath(buildRoutePoints(from,to).map(point=>{const projection=nearestRoadProjection(point);return projection?.point?{x:projection.point.x,z:projection.point.z}:{x:point.x,z:point.z};}));
      if(leg.length<2)leg=[from,to];
      for(let j=1;j<leg.length;j++){
        const final=j===leg.length-1;if(lastLeg&&final)continue;
        center.push(final?{...leg[j],...targetSource,x:to.x,z:to.z}:leg[j]);
      }
    }
    const lane=offsetBusPath(compactBusPath(center),Number(route.laneOffset||BUS_LANE_OFFSET));if(lane.length>1&&Math.hypot(lane[0].x-lane[lane.length-1].x,lane[0].z-lane[lane.length-1].z)<.12)lane.pop();return lane;
  }
  function busRoutePoints(bus){return bus?.runtimePoints?.length?bus.runtimePoints:(bus?.route?.points||[]);}
  function busNextStop(bus){const points=busRoutePoints(bus);for(let step=0;step<points.length;step++){const point=points[(bus.pointIndex+step)%points.length];if(point?.stopId)return point;}return null;}
  function nearestForwardBusSegment(bus,points){
    if(!points?.length)return null;let best=null;const start=(bus.pointIndex-1+points.length)%points.length,limit=Math.min(points.length,18);
    for(let step=0;step<limit;step++){const index=(start+step)%points.length,a=points[index],b=points[(index+1)%points.length],point=projectPointToSegment(bus.group.position,a,b),distance=Math.hypot(bus.group.position.x-point.x,bus.group.position.z-point.z),score=distance+step*.045;if(!best||score<best.score)best={index,nextIndex:(index+1)%points.length,point,distance,score};}
    return best;
  }
  function recoverBusRoute(bus,reason='route-recovery'){
    const points=busRoutePoints(bus);let projection=nearestForwardBusSegment(bus,points);const global=projectPointToPolyline(bus.group.position,points);if(global&&(!projection||global.distance+1.2<projection.distance))projection=global;if(!projection)return false;
    bus.group.position.x=projection.point.x;bus.group.position.z=projection.point.z;bus.pointIndex=projection.nextIndex;bus.currentSpeed=0;bus.targetSpeed=0;bus.trafficHoldUntil=performance.now()+650;bus.lastProgressAt=performance.now();bus.lastProgressX=bus.group.position.x;bus.lastProgressZ=bus.group.position.z;bus.lastRecoveryAt=bus.lastProgressAt;setBusState(bus,BUS_STATES.RECOVERING,reason);return true;
  }
  function setBusState(bus,next,reason=''){
    if(!bus||bus.state===next)return false;bus.stateHistory=bus.stateHistory||[];bus.stateHistory.push({from:bus.state||'',to:next,at:Date.now(),reason});bus.stateHistory=bus.stateHistory.slice(-24);bus.state=next;bus.stateSince=performance.now();bus.lastStateReason=reason;return true;
  }
  function setBusWaiting(stopId,routeId=''){
    const value={stopId:String(stopId||''),routeId:String(routeId||''),startedAt:Date.now()};world.waitingForBus=value;state.transport.busWaiting={...value};saveState(true);return value;
  }
  function clearBusWaiting(save=true){world.waitingForBus=null;state.transport.busWaiting=null;if(save)saveState(true);}
  function restoreBusWaiting(){const waiting=state.transport?.busWaiting;if(!waiting?.stopId)return false;const stop=busStopRecord(waiting);if(!stop){state.transport.busWaiting=null;return false;}world.waitingForBus={stopId:stop.id,routeId:waiting.routeId||'',startedAt:Number(waiting.startedAt||Date.now())};return true;}
  function busStopRecord(stopLike){const id=stopLike?.stopId||stopLike?.id||'';return world.busStops.find(stop=>stop.id===id||(stop.aliases||[]).includes(id))||null;}
  function safeBusExitPoint(bus,stopLike){
    const stop=busStopRecord(stopLike),heading=Number(bus?.group?.rotation?.y||0);
    if(stop&&!positionBlockedForPlayer(stop.x,stop.z,.45,{ignoreActor:bus,ignoreTraffic:false}))return{x:stop.x,z:stop.z,y:groundHeightAt(stop.x,stop.z)};
    return safePointNear(bus.group.position.x,bus.group.position.z,{heading,radius:.45,ignoreActor:bus,angles:[Math.PI/2,-Math.PI/2,Math.PI],distances:[3.4,4.0,4.8]});
  }

  function createMetroEntrance(station){
    if(isInsideLakeNavigable(station.x,station.z)){const dry=safePointNear(station.x,station.z,{radius:.55,ignoreTraffic:true,allowWater:false,distances:[5,7,9,12]});station.x=dry.x;station.z=dry.z;}
    const g=new THREE.Group();g.position.set(station.x,0,station.z);worldGroup.add(g);
    premiumBox(4.3,.24,4.6,0x27384a,0,.12,0,g);premiumBox(3.65,.24,3.9,0xc9d6df,0,.3,0,g);
    for(let i=0;i<5;i++)premiumBox(2.8,.16,.58,0x718291,0,.35-i*.02,.6+i*.5,g);
    premiumBox(.25,3.3,.25,0x1c2c42,-1.82,1.75,-1.62,g);premiumBox(.25,3.3,.25,0x1c2c42,1.82,1.75,-1.62,g);premiumBox(4.1,.32,1.2,0x168de2,0,3.38,-1.62,g);
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.15),new THREE.MeshStandardMaterial({map:iconTexture('M','#168de2','#ffffff'),emissive:0x0a4d86,emissiveIntensity:.35,side:THREE.DoubleSide}));panel.position.set(0,3.42,-2.25);panel.rotation.y=Math.PI;g.add(panel);
    premiumBox(3.45,2.5,.12,0x13283d,0,1.45,1.82,g);for(const x of [-1.18,0,1.18])premiumBox(.08,2.35,.14,0x64d8ff,x,1.45,1.75,g);
    station.group=g;world.metroStations.push(station);registerInteractable({id:`metro-entry-${station.id}`,type:'metro',icon:'Ⓜ️',label:`Entrar: ${station.name}`,x:station.x,z:station.z,radius:3.5,priority:205,action:()=>openMetroStation(station)});return station;
  }
  function ensureMetroOverlay(){
    if(metroOverlay)return metroOverlay;metroOverlay=document.createElement('div');metroOverlay.id='metroTravelOverlay';metroOverlay.className='metro-travel-overlay';metroOverlay.hidden=true;metroOverlay.innerHTML='<div class="metro-tunnel"><i></i><i></i><i></i></div><div class="metro-train"><b>M</b><span></span><span></span><span></span></div><strong data-metro-trip>Próxima estação</strong>';document.body.appendChild(metroOverlay);return metroOverlay;
  }
  function openMetroStation(station){
    if(player.vehicle||player.boating||player.transit.mode){toast('Desembarque antes de entrar no metrô.','warn');return;}
    const groups=[...new Set(MAP_LOCATIONS.map(x=>x.group))].map(group=>`<section class="metro-destination-group"><h4>${group}</h4><div>${MAP_LOCATIONS.filter(x=>x.group===group).map(loc=>`<button class="metro-destination" data-metro-destination="${loc.id}"><b>${loc.icon} ${loc.name}</b><span>${Math.round(Math.hypot((loc.navX??loc.x)-station.x,(loc.navZ??loc.z)-station.z))} m</span></button>`).join('')}</div></section>`).join('');
    openModal(station.name,`<div class="transit-heading"><b>Ⓜ️ ${station.line}</b><span>Escolha qualquer ponto conhecido do mapa.</span></div><div class="metro-destination-list">${groups}</div>`,root=>{$$('[data-metro-destination]',root).forEach(btn=>btn.onclick=()=>{const destination=MAP_LOCATIONS.find(x=>x.id===btn.dataset.metroDestination);if(destination)rideMetroTo(station,destination);});});
  }
  function rideMetroTo(station,destination){
    if(!destination||player.transit.mode||!canEnterMobility(PLAYER_MODES.METRO_PASSENGER))return false;
    closeModal();clearMovementInputs();player.transit.mode='metro';player.transit.metroUntil=performance.now()+1900;player.transit.destinationId=destination.id;player.vx=player.vz=0;auditPlayerMode('enter-metro');
    if(playerModel)playerModel.visible=false;if(avatarLayer)avatarLayer.visible=false;if(contactShadow)contactShadow.visible=false;
    const overlay=ensureMetroOverlay();overlay.querySelector('[data-metro-trip]').textContent=`${station.name} → ${destination.name}`;overlay.hidden=false;overlay.classList.remove('arriving');requestAnimationFrame(()=>overlay.classList.add('travelling'));
    const token=player.transit.metroUntil;setTimeout(()=>{
      if(player.transit.mode!=='metro'||player.transit.metroUntil!==token)return;
      overlay.classList.add('arriving');const tx=Number(destination.navX??destination.x),tz=Number(destination.navZ??destination.z),safe=safePointNear(tx,tz,{radius:.44,heading:Math.PI,ignoreTraffic:false});
      player.x=safe.x;player.z=safe.z;player.y=safe.y;player.vx=player.vy=player.vz=0;player.grounded=true;player.facing=Math.PI;state.position={x:player.x,y:player.y,z:player.z,yaw:player.facing};
      state.transport.metroTrips=(state.transport.metroTrips||0)+1;state.stats.metroTrips=(state.stats.metroTrips||0)+1;if(!state.transport.metroDestinations.includes(destination.id))state.transport.metroDestinations.push(destination.id);state.transport.metroDestinations=state.transport.metroDestinations.slice(-60);trackDaily('metro',1);advanceAdventure('metro',destination.id);setFlag('usedMetro');state.waypoint=null;world.routePath=[];
      player.transit.mode='';player.transit.destinationId='';if(playerModel)playerModel.visible=true;if(avatarLayer)avatarLayer.visible=true;if(contactShadow)contactShadow.visible=true;playerGroup?.position?.set(player.x,player.y,player.z);rememberSafePlayerPosition(true);auditPlayerMode('exit-metro');updateNavigation(0,true);updateContext(true);saveState(true);
      setTimeout(()=>{overlay.hidden=true;overlay.classList.remove('travelling','arriving');},260);toast(`Metrô: chegada em ${destination.name}.`,'good',2100);
    },1900);return true;
  }
  function ensureBusStop(route,point){
    let stop=busStopRecord(point)||world.busStops.find(item=>Math.hypot(item.roadX-point.x,item.roadZ-point.z)<.8);if(stop){if(!stop.routes.includes(route.id))stop.routes.push(route.id);stop.aliases=Array.from(new Set([...(stop.aliases||[]),point.stopId]));return stop;}
    const points=route.points||[],index=Math.max(0,points.findIndex(item=>item.stopId===point.stopId&&Math.hypot(item.x-point.x,item.z-point.z)<.8)),previous=points[(index-1+points.length)%points.length]||point,next=points[(index+1)%points.length]||point,dx=next.x-previous.x,dz=next.z-previous.z,heading=Math.atan2(dx,dz),rotation=heading-Math.PI/2,safe=v704SafeSignPoint(point.x,point.z,rotation);
    stop={id:point.stopId,aliases:[point.stopId],name:point.stopName,x:safe.x,z:safe.z,roadX:point.x,roadZ:point.z,routes:[route.id]};world.busStops.push(stop);const g=new THREE.Group();g.position.set(safe.x,0,safe.z);g.rotation.y=rotation;worldGroup.add(g);premiumBox(.18,2.7,.18,0x23364b,0,1.35,0,g);premiumBox(1.5,.92,.16,route.color,0,2.35,0,g);const sign=new THREE.Mesh(new THREE.PlaneGeometry(.72,.72),new THREE.MeshStandardMaterial({map:iconTexture('🚌','#ffffff','#17324d'),transparent:true,side:THREE.DoubleSide}));sign.position.set(0,2.38,.1);g.add(sign);premiumBox(2.8,.18,.82,0xd3dce3,0,.1,0,g);stop.sign=g;registerInteractable({id:`bus-stop-${stop.id}`,type:'bus-stop',icon:'🚌',label:`Parada: ${stop.name}`,x:stop.x,z:stop.z,radius:3.3,priority:190,action:()=>openBusStop(stop)});return stop;
  }
  function busSpawnIndex(runtimePoints,preferredOffset){
    if(!runtimePoints.length)return 0;let best=preferredOffset,bestScore=-Infinity;for(let i=0;i<runtimePoints.length;i++){const point=runtimePoints[i],roadOk=pointOnRoad(point.x,point.z,.03),distanceToTraffic=trafficActorList().reduce((min,actor)=>Math.min(min,Math.hypot(actor.group.position.x-point.x,actor.group.position.z-point.z)-(actor.radius||1.5)),999),distanceToBus=(world.buses||[]).reduce((min,bus)=>Math.min(min,Math.hypot(bus.group.position.x-point.x,bus.group.position.z-point.z)-5.5),999),cycle=Math.min(Math.abs(i-preferredOffset),runtimePoints.length-Math.abs(i-preferredOffset)),score=(roadOk?0:-500)+Math.min(distanceToTraffic,distanceToBus)-cycle*.045+(point.stopId?-1.2:0);if(score>bestScore){bestScore=score;best=i;}}return best;
  }
  function createBusModel(route,copy=0,routeOrder=0){
    const g=new THREE.Group(),body=renderMat(route.color,{roughness:.4,metalness:.14}),dark=renderMat(0x11263a,{roughness:.08,metalness:.28,transparent:true,opacity:.42}),light=renderMat(0xf5f7fa,{roughness:.46}),rail=renderMat(0xf6c934,{roughness:.34,metalness:.32}),seat=materials.fabric;
    premiumBox(3.08,.48,7.0,0x26384b,0,.4,0,g);premiumBox(2.92,.2,6.65,materials.tile,0,.72,0,g);
    premiumBox(3.02,.62,6.82,body,0,1.02,0,g);premiumBox(3.06,.24,6.9,light,0,3.26,0,g);
    for(const side of [-1,1]){
      premiumBox(.16,2.05,6.74,body,side*1.49,1.95,0,g);
      for(const z of [-2.72,-1.38,0,1.38,2.72])premiumBox(.22,2.0,.18,light,side*1.51,2.03,z,g);
      for(const z of [-2.08,-.68,.68,2.08])premiumBox(.035,1.25,1.08,dark,side*1.595,2.1,z,g);
    }
    premiumBox(2.95,2.25,.2,body,0,2.0,-3.4,g);premiumBox(2.48,1.25,.04,dark,0,2.24,-3.52,g);
    premiumBox(2.95,.72,.2,body,0,1.08,3.4,g);premiumBox(2.75,.42,.16,light,0,3.05,3.42,g);
    premiumBox(2.48,1.15,.045,renderMat(0x11263a,{roughness:.08,metalness:.28,transparent:true,opacity:.5}),0,2.18,3.515,g);
    premiumBox(.16,2.15,.22,light,-1.36,2.03,3.42,g);premiumBox(.16,2.15,.22,light,1.36,2.03,3.42,g);
    const routeBoard=new THREE.Mesh(new THREE.PlaneGeometry(1.95,.46),new THREE.MeshStandardMaterial({map:signTexture(`${route.number} ${route.name}`,route.schoolBus?'#f0b62d':'#12273b',route.schoolBus?'#1b2835':'#ffffff'),roughness:.5,side:THREE.DoubleSide}));routeBoard.position.set(0,2.92,3.535);g.add(routeBoard);if(route.schoolBus){const schoolSign=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.45),new THREE.MeshStandardMaterial({map:signTexture('ESCOLAR','#fff4c8','#24364a'),side:THREE.DoubleSide,roughness:.6}));schoolSign.position.set(0,2.35,-3.54);schoolSign.rotation.y=Math.PI;g.add(schoolSign);}
    for(const z of [-2.25,-.85,.55,1.95])for(const x of [-.72,.72]){premiumBox(.72,.18,.62,seat,x,1.08,z,g);premiumBox(.72,.74,.16,seat,x,1.42,z-.26,g);premiumBox(.08,.48,.08,rail,x-.26,1.0,z,g);premiumBox(.08,.48,.08,rail,x+.26,1.0,z,g);}
    for(const x of [-1.15,1.15])premiumBox(.07,2.2,.07,rail,x,1.82,2.55,g);premiumBox(2.35,.07,.07,rail,0,2.72,2.55,g);
    premiumBox(.68,1.9,.08,renderMat(0x98e7ff,{transparent:true,opacity:.22,roughness:.08}),1.54,1.7,2.52,g);premiumBox(.12,2.08,.12,rail,1.5,1.78,1.84,g);
    const wheels=[];for(const p of [[-1.48,.47,-2.3],[1.48,.47,-2.3],[-1.48,.47,2.25],[1.48,.47,2.25]]){const wheel=premiumCylinder(.48,.28,0x111720,p[0],p[1],p[2],g,14);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}
    const passengerColors=[0xffd84d,0xff72b6,0x54c7ff];for(let i=0;i<3;i++){const pg=new THREE.Group();pg.position.set(i%2?-.72:.72,1.2,-1.6+i*1.35);g.add(pg);premiumBox(.42,.52,.38,passengerColors[i],0,.25,0,pg);premiumBox(.36,.36,.36,0xffc997,0,.68,0,pg);}
    const runtimePoints=buildBusRoadPath(route),copies=Math.max(1,Number(route.copies||1)),preferredOffset=Math.floor(((copy/copies)+(routeOrder/Math.max(1,BUS_ROUTES.length)))*runtimePoints.length)%runtimePoints.length;let routeOffset=busSpawnIndex(runtimePoints,preferredOffset);const start=runtimePoints[routeOffset],now=performance.now(),bus={id:`bus-${route.id}-${copy+1}`,route,runtimePoints,group:g,pointIndex:(routeOffset+1)%runtimePoints.length,stopUntil:start.stopId?now+1200:0,lastStopId:start.stopId||'',lastStopName:start.stopName||'',wheels,speed:route.speed,currentSpeed:0,targetSpeed:0,seatOffset:new THREE.Vector3(-.72,.94,.55),interiorSeats:8,doorsOpen:!!start.stopId,state:start.stopId?BUS_STATES.DOORS_OPEN:BUS_STATES.SPAWNING,stateSince:now,stateHistory:[],lastProgressAt:now,lastProgressX:start.x,lastProgressZ:start.z,lastRecoveryAt:0,offerStopId:'',openAt:0,closeUntil:0,radius:3.05,incidentLocked:false};g.position.set(start.x,.02,start.z);const nextPoint=runtimePoints[(routeOffset+1)%runtimePoints.length]||start;g.rotation.y=Math.atan2(nextPoint.x-start.x,nextPoint.z-start.z);g.userData.roadPath=runtimePoints;g.userData.trafficCorridor=.95;g.userData.busId=bus.id;worldGroup.add(g);world.buses.push(bus);
    registerInteractable({id:`board-${bus.id}`,type:'bus',icon:'🚌',label:`Embarcar • ${route.number} ${route.name}`,radius:4.6,priority:210,getPos:()=>({x:bus.group.position.x,z:bus.group.position.z}),action:()=>enterBus(bus)});
    for(const point of runtimePoints)if(point.stopId)ensureBusStop(route,point);return bus;
  }
  function createTransitWorld(){METRO_STATIONS.forEach(createMetroEntrance);BUS_ROUTES.forEach((route,routeOrder)=>{for(let copy=0;copy<Math.max(1,Number(route.copies||2));copy++)createBusModel(route,copy,routeOrder);});validateBusCoverage();restoreBusWaiting();}
  function busAtStop(bus){return!!(bus&&bus.doorsOpen&&bus.lastStopId&&Math.abs(Number(bus.currentSpeed||0))<.18&&[BUS_STATES.DOORS_OPEN,BUS_STATES.OFFERING_BOARDING,BUS_STATES.BOARDING].includes(bus.state));}
  function busEtaSeconds(bus,stopId){if(!bus||!stopId)return Infinity;if(busAtStop(bus)&&bus.lastStopId===stopId)return 0;const points=busRoutePoints(bus);let distance=0,previous={x:bus.group.position.x,z:bus.group.position.z};for(let step=0;step<points.length;step++){const idx=(bus.pointIndex+step)%points.length,point=points[idx];distance+=Math.hypot(point.x-previous.x,point.z-previous.z);if(point.stopId===stopId)return Math.max(1,Math.round(distance/Math.max(1,bus.speed)+(step*.8)));previous=point;}return Infinity;}
  function validateBusCoverage(){for(const stop of world.busStops){const active=world.buses.some(bus=>stop.routes.includes(bus.route.id));stop.covered=active;if(!active)console.warn('Parada sem ônibus ativo:',stop.id);}}
  function busDestinationsAfter(bus,stopId){
    const points=bus?.route?.points||[],start=Math.max(0,points.findIndex(p=>p.stopId===stopId)),names=[];for(let step=1;step<=points.length;step++){const p=points[(start+step)%points.length];if(p?.stopName&&!names.includes(p.stopName))names.push(p.stopName);}return names.slice(0,8);
  }
  function openBusArrivalOffer(bus,stop){
    if(!bus||!stop||player.transit.mode||player.vehicle||player.boating||!busAtStop(bus))return false;
    if(Math.hypot(player.x-stop.x,player.z-stop.z)>6.2)return false;
    const destinations=busDestinationsAfter(bus,stop.id);setBusState(bus,BUS_STATES.OFFERING_BOARDING,'arrival-offer');
    openModal('Ônibus chegou',`<div class="bus-arrival-card"><span>🚌</span><section><small>${bus.route.number}</small><h3>${bus.route.name}</h3><p>Embarque em <b>${stop.name}</b>.</p></section></div><div class="bus-destination-preview"><b>Próximos destinos</b><span>${destinations.join(' → ')||'Terminal da linha'}</span></div><div class="modal-actions"><button class="btn primary" data-arrival-board>Entrar neste ônibus</button><button class="btn" data-arrival-wait>Continuar esperando</button><button class="btn danger" data-arrival-cancel>Cancelar espera</button></div>`,root=>{
      $('[data-arrival-board]',root).onclick=()=>{clearBusWaiting(false);closeModal();enterBus(bus);};
      $('[data-arrival-wait]',root).onclick=()=>{setBusWaiting(stop.id,world.waitingForBus?.routeId||'');closeModal();toast(`Você continua esperando na parada ${stop.name}.`,'good',1500);};
      $('[data-arrival-cancel]',root).onclick=()=>{clearBusWaiting();closeModal();toast('Espera cancelada.','good',1200);};
    });return true;
  }
  function offerBusAtStop(bus,stop){
    if(!bus||!stop)return;const waiting=world.waitingForBus,match=!waiting||(waiting.stopId===stop.id&&(!waiting.routeId||waiting.routeId===bus.route.id));if(!match)return;
    const near=Math.hypot(player.x-stop.x,player.z-stop.z)<=6.2;if(!near)return;
    const tryOffer=()=>{if(!busAtStop(bus)||player.transit.mode)return;if(els.modal.hidden)openBusArrivalOffer(bus,stop);else if(performance.now()<bus.stopUntil-450)setTimeout(tryOffer,420);};
    setTimeout(tryOffer,260);
  }

  function openBusStop(stop){
    const buses=world.buses.filter(b=>stop.routes.includes(b.route.id)).sort((a,b)=>busEtaSeconds(a,stop.id)-busEtaSeconds(b,stop.id));
    const ready=buses.find(b=>busAtStop(b)&&b.lastStopId===stop.id&&Math.hypot(b.group.position.x-stop.roadX,b.group.position.z-stop.roadZ)<2.8);
    const uniqueRoutes=stop.routes.map(id=>BUS_ROUTES.find(r=>r.id===id)).filter(Boolean),waiting=world.waitingForBus?.stopId===stop.id?world.waitingForBus:null;
    openModal(`Parada ${stop.name}`,`<div class="transit-heading"><b>🚌 ${uniqueRoutes.map(r=>r.number).join(' • ')}</b><span>${ready?'Há um ônibus parado com portas abertas.':waiting?'Você já está esperando nesta parada.':'Escolha a linha que deseja esperar.'}</span></div><div class="bus-live-list">${buses.map(bus=>{const eta=busEtaSeconds(bus,stop.id);return`<article class="${eta===0?'arrived':''}"><b>${bus.route.number} • ${bus.route.name}</b><span>${eta===0?'Na parada • portas abertas':`Chega em aproximadamente ${eta}s`} • ${bus.state||BUS_STATES.MOVING}</span></article>`;}).join('')}</div><div class="bus-line-choice">${uniqueRoutes.map(route=>`<button class="choice" data-wait-route="${route.id}"><b>${route.number} • ${route.name}</b><span>${[...new Set(route.points.filter(p=>p.stopName).map(p=>p.stopName))].join(' → ')}</span></button>`).join('')}</div><div class="modal-actions">${ready?`<button class="btn primary" data-board-ready="${ready.id}">Ver destinos e embarcar</button>`:''}<button class="btn" data-wait-any>Esperar qualquer linha</button>${waiting?'<button class="btn" data-keep-wait>Continuar esperando</button>':''}<button class="btn danger" data-cancel-wait>Cancelar espera</button></div>`,root=>{
      $('[data-board-ready]',root)?.addEventListener('click',()=>{closeModal();openBusArrivalOffer(ready,stop);});
      $$('[data-wait-route]',root).forEach(btn=>btn.onclick=()=>{const route=BUS_ROUTES.find(r=>r.id===btn.dataset.waitRoute);setBusWaiting(stop.id,btn.dataset.waitRoute);closeModal();toast(`Esperando a linha ${route?.number||''} ${route?.name||''}.`,'good',2100);});
      $('[data-wait-any]',root).onclick=()=>{setBusWaiting(stop.id,'');closeModal();toast(`Esperando o próximo ônibus em ${stop.name}.`,'good',2100);};
      $('[data-keep-wait]',root)?.addEventListener('click',()=>{setBusWaiting(stop.id,waiting?.routeId||'');closeModal();toast('Você continua esperando.','good',1200);});
      $('[data-cancel-wait]',root).onclick=()=>{clearBusWaiting();closeModal();toast('Espera cancelada.','good',1200);};
    });
  }
  function ensureTransitPanel(){
    if(transitPanel)return transitPanel;transitPanel=document.createElement('div');transitPanel.id='transitActivityPanel';transitPanel.className='transit-activity-panel';transitPanel.hidden=true;transitPanel.innerHTML='<div><b data-bus-line>Ônibus</b><span data-bus-next>Próxima parada</span></div><button type="button" data-bus-request>🔔<span>Pedir parada</span></button>';document.body.appendChild(transitPanel);transitPanel.querySelector('[data-bus-request]').onclick=()=>{if(player.transit.mode!=='bus')return;player.transit.requestStop=true;updateTransitPanel();toast('Parada solicitada.','good',1200);};return transitPanel;
  }
  function updateTransitPanel(){
    const panel=ensureTransitPanel(),bus=world.buses.find(b=>b.id===player.transit.busId);document.body.classList.toggle('bus-passenger',player.transit.mode==='bus'&&!!bus);panel.hidden=player.transit.mode!=='bus'||!bus;if(!bus)return;const nextStop=busNextStop(bus);panel.querySelector('[data-bus-line]').textContent=`${bus.route.number} • ${bus.route.name}`;panel.querySelector('[data-bus-next]').textContent=`Próxima: ${nextStop?.stopName||'Terminal'}`;const button=panel.querySelector('[data-bus-request]');button.disabled=player.transit.requestStop;button.querySelector('span').textContent=player.transit.requestStop?'Solicitada':'Pedir parada';
  }
  function enterBus(bus){
    if(!bus||player.transit.mode||player.vehicle||player.boating||!canEnterMobility(PLAYER_MODES.BUS_PASSENGER)){toast('Desembarque do transporte atual primeiro.','warn');return false;}
    if(!busAtStop(bus)){toast('Embarque somente com o ônibus parado e as portas abertas.','warn');return false;}
    if(Math.hypot(player.x-bus.group.position.x,player.z-bus.group.position.z)>6.2){toast('Chegue mais perto da porta do ônibus.','warn');return false;}
    closeModal();clearMovementInputs();setBusState(bus,BUS_STATES.BOARDING,'player-board');
    player.transit.mode='bus';player.transit.busId=bus.id;player.transit.requestStop=false;player.transit.boardedAt=Date.now();player.transit.originStopId=bus.lastStopId||'';player.x=bus.group.position.x;player.z=bus.group.position.z;player.y=.94;player.vx=player.vz=0;player.sitUntil=Number.MAX_SAFE_INTEGER;
    if(playerModel)playerModel.visible=false;if(avatarLayer)avatarLayer.visible=false;if(contactShadow)contactShadow.visible=false;if(toolVisual)toolVisual.visible=false;
    bus.group.updateMatrixWorld(true);const cameraPos=bus.group.localToWorld(new THREE.Vector3(.28,2.28,-2.56)),cameraLook=bus.group.localToWorld(new THREE.Vector3(-.18,1.55,1.75));camera.position.copy(cameraPos);camera.fov=68;camera.lookAt(cameraLook);camera.updateProjectionMatrix();
    clearBusWaiting(false);state.transport.busTrips=(state.transport.busTrips||0)+1;updateTransitPanel();auditPlayerMode('board-bus');toast(`Embarcou na linha ${bus.route.number}.`,'good',1800);saveState(true);
    setTimeout(()=>{if(busAtStop(bus)&&bus.state===BUS_STATES.BOARDING)setBusState(bus,BUS_STATES.DOORS_OPEN,'boarding-complete');},420);return true;
  }
  function exitBusAtStop(bus,stopLike){
    if(player.transit.mode!=='bus'||!bus||!busAtStop(bus))return false;
    const safe=safeBusExitPoint(bus,stopLike),stop=busStopRecord(stopLike);setBusState(bus,BUS_STATES.BOARDING,'player-exit');
    player.transit.mode='';player.transit.busId='';player.transit.requestStop=false;player.transit.originStopId='';player.sitUntil=0;player.x=safe.x;player.z=safe.z;player.y=safe.y;player.vx=player.vy=player.vz=0;player.grounded=true;
    if(playerModel)playerModel.visible=true;if(avatarLayer)avatarLayer.visible=true;if(contactShadow)contactShadow.visible=true;if(toolVisual)toolVisual.visible=true;
    const stopId=stop?.id||stopLike?.stopId||bus.lastStopId||'terminal';if(!state.transport.busStops.includes(stopId))state.transport.busStops.push(stopId);state.transport.busStops=state.transport.busStops.slice(-40);state.stats.busStops=(state.stats.busStops||0)+1;trackDaily('bus',1);advanceAdventure('bus',stopId);setFlag('rodeBus');
    rememberSafePlayerPosition(true);auditPlayerMode('exit-bus');updateTransitPanel();updateContext(true);saveState(true);toast(`Desembarcou: ${stop?.name||stopLike?.stopName||bus.lastStopName||'parada'}.`,'good',1900);
    setTimeout(()=>{if(bus.doorsOpen&&bus.state===BUS_STATES.BOARDING)setBusState(bus,BUS_STATES.DOORS_OPEN,'exit-complete');},350);return true;
  }
  function updateTransitWorld(dt){
    const now=performance.now();
    for(const bus of world.buses){
      const points=busRoutePoints(bus);if(!points.length)continue;
      if(bus.state===BUS_STATES.SPAWNING)setBusState(bus,BUS_STATES.MOVING,'spawn-complete');
      if(now<Number(bus.trafficHoldUntil||0)){bus.currentSpeed=lerp(Number(bus.currentSpeed||0),0,Math.min(1,dt*10));continue;}
      if(bus.state===BUS_STATES.ACCIDENT){bus.currentSpeed=lerp(Number(bus.currentSpeed||0),0,Math.min(1,dt*8));continue;}
      if(bus.state===BUS_STATES.TURNING_AROUND){
        bus.currentSpeed=0;const targetHeading=Number(bus.turnTargetHeading||0),delta=((targetHeading-bus.group.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;bus.group.rotation.y=lerpAngle(bus.group.rotation.y,targetHeading,Math.min(1,dt*4.8));if(Math.abs(delta)<.045||now>=Number(bus.turnUntil||0)){bus.group.rotation.y=targetHeading;bus.turnTargetHeading=0;bus.turnUntil=0;setBusState(bus,BUS_STATES.MOVING,'turn-complete');}
      }else if(bus.state===BUS_STATES.OPENING_DOORS){
        bus.currentSpeed=0;if(now>=Number(bus.openAt||0)){bus.doorsOpen=true;bus.stopUntil=Math.max(Number(bus.stopUntil||0),now+Number(bus.route.dwell||3600));setBusState(bus,BUS_STATES.DOORS_OPEN,'doors-open');const stop=busStopRecord({stopId:bus.lastStopId});if(stop&&bus.offerStopId!==stop.id){bus.offerStopId=stop.id;offerBusAtStop(bus,stop);}}
      }else if([BUS_STATES.DOORS_OPEN,BUS_STATES.OFFERING_BOARDING,BUS_STATES.BOARDING].includes(bus.state)){
        bus.currentSpeed=0;
        if(player.transit.mode==='bus'&&player.transit.busId===bus.id&&player.transit.requestStop&&bus.lastStopId!==player.transit.originStopId)exitBusAtStop(bus,{stopId:bus.lastStopId,stopName:bus.lastStopName});
        if(now>=Number(bus.stopUntil||0)&&bus.state!==BUS_STATES.BOARDING){bus.doorsOpen=false;bus.closeUntil=now+420;setBusState(bus,BUS_STATES.CLOSING_DOORS,'dwell-complete');}
      }else if(bus.state===BUS_STATES.CLOSING_DOORS){
        bus.currentSpeed=0;if(now>=Number(bus.closeUntil||0)){bus.offerStopId='';setBusState(bus,BUS_STATES.LEAVING_STOP,'doors-closed');}
      }else{
        const target=points[bus.pointIndex];if(!target){bus.pointIndex=0;setBusState(bus,BUS_STATES.REROUTING,'missing-waypoint');continue;}
        const dx=target.x-bus.group.position.x,dz=target.z-bus.group.position.z,d=Math.hypot(dx,dz),heading=d>.001?Math.atan2(dx,dz):bus.group.rotation.y,turnDelta=Math.abs(((heading-bus.group.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI);
        if(d>.35&&turnDelta>2.45&&Math.abs(Number(bus.currentSpeed||0))<.3){bus.turnTargetHeading=heading;bus.turnUntil=now+1050;bus.currentSpeed=0;setBusState(bus,BUS_STATES.TURNING_AROUND,'terminal-u-turn');}
        if(bus.state===BUS_STATES.TURNING_AROUND)continue;
        const trafficFactor=trafficSpeedFactor(bus,heading,9.2),approaching=!!target.stopId&&d<13;
        const brakingFactor=approaching?clamp((d-.15)/8.5,.12,1):1;bus.targetSpeed=bus.speed*trafficFactor*brakingFactor;
        if(trafficFactor<.075)setBusState(bus,BUS_STATES.WAITING_TRAFFIC,'vehicle-ahead');
        else if(approaching&&d<2.2)setBusState(bus,BUS_STATES.ALIGNING_TO_STOP,'near-stop');
        else if(approaching&&d<6)setBusState(bus,BUS_STATES.BRAKING,'approach-stop');
        else if(approaching)setBusState(bus,BUS_STATES.APPROACHING_STOP,'approach-stop');
        else if(bus.state!==BUS_STATES.LEAVING_STOP)setBusState(bus,BUS_STATES.MOVING,'route');
        if(trafficFactor<.035){bus.currentSpeed=0;bus.trafficHoldUntil=Math.max(Number(bus.trafficHoldUntil||0),now+420);}else bus.currentSpeed=lerp(Number(bus.currentSpeed||0),bus.targetSpeed,Math.min(1,dt*(trafficFactor<.1?10:4.4)));
        const move=Math.min(d,Math.max(0,bus.currentSpeed)*dt),previous={x:bus.group.position.x,z:bus.group.position.z};
        if(move>.0001){bus.group.position.x+=dx/d*move;bus.group.position.z+=dz/d*move;if(!snapTrafficToRoad(bus.group,previous))recoverBusRoute(bus,'left-road');bus.group.rotation.y=lerpAngle(bus.group.rotation.y,heading,Math.min(1,dt*(approaching?3.6:4.4)));for(const wheel of bus.wheels)wheel.rotation.x-=move*2.2;}
        const movedFromProgress=Math.hypot(bus.group.position.x-Number(bus.lastProgressX||0),bus.group.position.z-Number(bus.lastProgressZ||0));
        if(movedFromProgress>.45){bus.lastProgressX=bus.group.position.x;bus.lastProgressZ=bus.group.position.z;bus.lastProgressAt=now;}
        if(d<=Math.max(.22,move+.1)){
          bus.group.position.set(target.x,.02,target.z);bus.group.rotation.y=heading;bus.currentSpeed=0;bus.pointIndex=(bus.pointIndex+1)%points.length;bus.lastProgressAt=now;bus.lastProgressX=target.x;bus.lastProgressZ=target.z;
          if(target.stopId){bus.lastStopId=target.stopId;bus.lastStopName=target.stopName||target.stopId;bus.doorsOpen=false;bus.openAt=now+260;bus.stopUntil=now+260+Number(bus.route.dwell||3600);setBusState(bus,BUS_STATES.OPENING_DOORS,'aligned-at-stop');}
          else setBusState(bus,BUS_STATES.MOVING,'waypoint-reached');
        }else if(now-Number(bus.lastProgressAt||now)>8500&&now-Number(bus.lastRecoveryAt||0)>12000&&trafficFactor>.2){
          recoverBusRoute(bus,'stuck-route');setTimeout(()=>{if(bus.state===BUS_STATES.RECOVERING)setBusState(bus,BUS_STATES.REROUTING,'recovery-cooldown');},450);
        }
      }
      if(player.transit.mode==='bus'&&player.transit.busId===bus.id){bus.group.updateMatrixWorld?.(true);const seat=bus.group.localToWorld(bus.seatOffset.clone());player.x=seat.x;player.z=seat.z;player.y=seat.y;player.facing=bus.group.rotation.y;player.vx=player.vz=0;}
    }
    updateTransitPanel();
  }
