/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 08-map-parent-settings.js
 * Escopo: Mapa, marcadores, waypoint, reset, ferramentas parentais e configurações
 * Linhas de origem V642: 1201-1359
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function mapLocationDetails(loc){if(loc?.description||loc?.actions)return{description:loc.description||'Destino relacionado à missão ativa.',actions:Array.isArray(loc.actions)?loc.actions:['Seguir o GPS','Concluir a etapa']};const d=MAP_LOCATION_DETAILS[loc.id]||MAP_LOCATION_DETAILS.default;return{description:d[0],actions:d[1]};}
  function worldToMap(x,z){const b=v704WorldBounds(),w=Math.max(1,b.maxX-b.minX),d=Math.max(1,b.maxZ-b.minZ);return{left:clamp((x-b.minX)/w*100,2.5,97.5),top:clamp((b.maxZ-z)/d*100,2.5,97.5)};}
  function missionMapLocations(){
    const job=state.career?.activeJob,items=[];
    if(job&&typeof serviceVehicleMapLocation==='function'){const vehicleTarget=serviceVehicleMapLocation(job);if(vehicleTarget)items.push(vehicleTarget);}
    const waypoint=state.waypoint;if(waypoint&&!MAP_LOCATIONS.some(loc=>loc.id===waypoint.id)&&!items.some(loc=>loc.id===waypoint.id)){const mission=!!job||/^(service-|assist-|fire-|delivery-)/.test(String(waypoint.id||''));items.push({id:waypoint.id,name:waypoint.name||'Destino da missão',icon:String(waypoint.icon||(/service-/.test(waypoint.id)?'🚨':/fire-/.test(waypoint.id)?'🔥':/assist-/.test(waypoint.id)?'⚠️':'📍')),group:mission?'Missão ativa':'Destino atual',x:Number(waypoint.x||0),z:Number(waypoint.z||0),navX:Number(waypoint.navX??waypoint.x??0),navZ:Number(waypoint.navZ??waypoint.z??0),missionTarget:mission,description:mission?'Este é o ponto exato exigido pela missão. A rota azul e as setas do mundo levam até ele.':'Destino atualmente marcado no GPS.',actions:['Seguir a rota azul','Observar as setas no chão']});}
    return items;
  }
  function onlinePlayerMapLocations(){const presence=window.OTTHOS_RTDB?.getPresence?.()||{};return Object.entries(presence).filter(([,item])=>item&&Number.isFinite(Number(item.x))&&Number.isFinite(Number(item.z))).map(([uid,item])=>({id:`online-${String(uid).replace(/[^A-Za-z0-9_-]/g,'').slice(0,48)}`,name:item.name||'Jogador online',icon:'👤',group:'Jogadores online',x:Number(item.x),z:Number(item.z),navX:Number(item.x),navZ:Number(item.z),description:'Posição individual sincronizada deste participante no bairro atual.',actions:['Marcar no GPS','Encontrar o participante voluntariamente']}));}
  function currentMapLocations(){const all=[...MAP_LOCATIONS,...(window.OTTHI_ROOM_WORLD?.mapHouseLocations?.()||[]),...missionMapLocations(),...(typeof coopMissionMapLocations==='function'?coopMissionMapLocations():[]),...onlinePlayerMapLocations()];const unique=new Map();for(const loc of all)if(loc?.id)unique.set(loc.id,loc);return[...unique.values()];}
  function mapDistance(point){ return Math.round(Math.hypot(player.x-(point.navX??point.x),player.z-(point.navZ??point.z))); }
  let mapSelectedId='';
  const mapViewState={zoom:1,panX:0,panY:0};
  function mapMarkerPlacements(locations,playerPoint,mapWidth=0,mapHeight=0){
    const portrait=window.matchMedia?.('(orientation: portrait)')?.matches??(innerHeight>=innerWidth);
    const lowLandscape=!portrait&&innerHeight<=600;
    const width=Math.max(220,Number(mapWidth)||Math.min(760,Math.max(280,innerWidth-(portrait?24:300))));
    const height=Math.max(150,Number(mapHeight)||Math.min(620,Math.max(180,innerHeight-(portrait?430:110))));
    // Usa o maior diâmetro visual (selecionado/ativo), evitando colisão também após o toque.
    const markerDiameter=portrait?36:(lowLandscape?34:38),safeGapPx=markerDiameter+4;
    const gapX=safeGapPx/width*100,gapY=safeGapPx/height*100;
    const playerGapX=(markerDiameter+15)/width*100,playerGapY=(markerDiameter+15)/height*100;
    const edgeX=(markerDiameter/2+5)/width*100,edgeY=(markerDiameter/2+5)/height*100;
    const minLeft=clamp(edgeX,3.5,11),maxLeft=100-minLeft,minTop=clamp(edgeY,4.5,16),maxTop=100-minTop;
    const points=locations.map((loc,index)=>{const pos=worldToMap(loc.navX??loc.x,loc.navZ??loc.z);return{loc,index,originLeft:pos.left,originTop:pos.top,left:clamp(pos.left,minLeft,maxLeft),top:clamp(pos.top,minTop,maxTop)};});
    const separate=(a,b,requiredX,requiredY,pushBoth=true)=>{
      let dx=b.left-a.left,dy=b.top-a.top,nx=dx/requiredX,ny=dy/requiredY,d=Math.hypot(nx,ny);
      if(d>=1)return false;
      if(d<.001){const angle=((a.index+1)*2.399963229728653+(b.index+1)*.731);nx=Math.cos(angle);ny=Math.sin(angle);d=1;}
      else{nx/=d;ny/=d;}
      const force=(1-d)+(pushBoth?.018:.035),mx=nx*requiredX*force,my=ny*requiredY*force;
      if(pushBoth){a.left-=mx*.5;a.top-=my*.5;b.left+=mx*.5;b.top+=my*.5;}
      else{b.left+=mx;b.top+=my;}
      return true;
    };
    const playerAnchor={index:-7,left:playerPoint.left,top:playerPoint.top};
    for(let pass=0;pass<72;pass++){
      let moved=false;
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)moved=separate(points[i],points[j],gapX,gapY,true)||moved;
      for(const point of points){
        moved=separate(playerAnchor,point,playerGapX,playerGapY,false)||moved;
        // Atrai suavemente para a posição real, sem desfazer a separação obtida.
        if(pass>38){point.left+=(point.originLeft-point.left)*.006;point.top+=(point.originTop-point.top)*.006;}
        point.left=clamp(point.left,minLeft,maxLeft);point.top=clamp(point.top,minTop,maxTop);
      }
      if(!moved&&pass>10)break;
    }
    return points;
  }
  function applyMapMarkerPlacements(root,placements){
    placements.forEach(({loc,left,top})=>{
      const marker=$(`[data-map-marker="${loc.id}"]`,root);if(!marker)return;
      marker.style.left=`${left.toFixed(2)}%`;marker.style.top=`${top.toFixed(2)}%`;
      marker.dataset.labelX=left<18?'left':left>82?'right':'center';
      marker.dataset.labelY=top>80?'above':'below';
    });
  }
  let mapClusterLookup={};
  function mapVisualNodes(locations,activeId='',selectedId=''){
    mapClusterLookup={};const priority=[],regular=[];
    for(const loc of locations){if(loc.missionTarget||loc.id===activeId||loc.id===selectedId||loc.id==='home'||loc.coopTarget)priority.push(loc);else regular.push(loc);}
    const cells=new Map(),cellSize=(innerHeight<560&&innerWidth>innerHeight)?13:10;
    for(const loc of regular){const pos=worldToMap(loc.navX??loc.x,loc.navZ??loc.z),key=`${Math.round(pos.left/cellSize)}:${Math.round(pos.top/cellSize)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(loc);}
    const nodes=[...priority];let index=0;
    for(const group of cells.values()){
      if(group.length===1){nodes.push(group[0]);continue;}
      const x=group.reduce((sum,item)=>sum+Number(item.navX??item.x??0),0)/group.length,z=group.reduce((sum,item)=>sum+Number(item.navZ??item.z??0),0)/group.length,id=`map-cluster-${index++}`,node={id,name:`${group.length} locais`,icon:String(group.length),group:'Grupo de locais',x,z,navX:x,navZ:z,mapCluster:true,clusterItems:group,description:'Toque para escolher um dos locais agrupados nesta área.',actions:['Abrir o grupo','Escolher o destino']};mapClusterLookup[id]=node;nodes.push(node);
    }
    return nodes;
  }
  function mapClusterSelectionMarkup(cluster){return`<div class="map-selection detailed map-cluster-selection"><div class="map-selection-title"><b>📍 ${cluster.clusterItems.length} locais próximos</b><span>Ícones agrupados para manter o mapa legível</span></div><div class="map-cluster-options">${cluster.clusterItems.sort((a,b)=>mapDistance(a)-mapDistance(b)).map(loc=>`<button data-cluster-location="${loc.id}"><b>${loc.icon} ${loc.name}</b><span>${mapDistance(loc)} m</span></button>`).join('')}</div></div>`;}
  function mapSelectionMarkup(id){
    const cluster=mapClusterLookup[id];if(cluster)return mapClusterSelectionMarkup(cluster);const loc=currentMapLocations().find(x=>x.id===id);if(!loc)return'<div class="map-selection empty"><b>Toque em um ícone</b><span>O nome aparecerá aqui antes de iniciar a rota.</span></div>';
    const details=mapLocationDetails(loc),mission=loc.missionTarget?' mission-target':'';return`<div class="map-selection detailed${mission}"><div class="map-selection-title"><b>${loc.icon} ${loc.name}</b><span>${loc.group}</span></div><p>${details.description}</p><div class="map-action-chips">${details.actions.map(action=>`<i>${action}</i>`).join('')}</div><footer><span>${mapDistance(loc)} m de distância</span><button class="btn primary compact" data-route-selected="${loc.id}">Ir para este local</button></footer></div>`;
  }
  function setWaypoint(id){
    const point=currentMapLocations().find(p=>p.id===id);if(!point)return;
    state.waypoint={id:point.id,name:point.name,x:point.x,z:point.z,navX:point.navX??point.x,navZ:point.navZ??point.z,arrived:false};world.routePath=buildRoutePoints(player,state.waypoint);
    updateWaypointMarker();updateNavigation(0,true);saveState(true);closeModal();toast(`Destino marcado: ${point.name} • siga as setas azuis`,'good',2600);
  }
  function clearWaypoint(){ state.waypoint=null; updateWaypointMarker(); updateNavigation(0,true); saveState(true); closeModal(); toast('Destino removido.','good'); }
  function openMap(){
    const pp=worldToMap(player.x,player.z),angleDeg=(Math.PI-(player.facing||0))*180/Math.PI,activeId=state.waypoint?.id||'',route=state.waypoint?(world.routePath.length?world.routePath:buildRoutePoints(player,state.waypoint)):[],routeInfo=state.waypoint?routeProgressInfo(route,player):null;
    const mapLocations=currentMapLocations();if(!mapSelectedId||(!mapLocations.some(x=>x.id===mapSelectedId)&&!mapClusterLookup[mapSelectedId]))mapSelectedId=activeId||'home';
    const visualNodes=mapVisualNodes(mapLocations,activeId,mapSelectedId),placements=mapMarkerPlacements(visualNodes,pp);
    const markers=placements.map(({loc,left,top})=>{const active=loc.id===activeId?' active':'',selected=loc.id===mapSelectedId?' selected':'',mission=loc.missionTarget?' mission-target':'',cluster=loc.mapCluster?' cluster':'',home=loc.id==='home'?' my-home':'';return `<button class="map-marker clean${active}${selected}${mission}${cluster}${home}" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%" data-map-marker="${loc.id}" aria-label="${loc.id==='home'?'Minha casa':loc.name}" title="${loc.id==='home'?'Minha casa':loc.name}"><b>${loc.mapCluster?loc.clusterItems.length:loc.icon}</b><span>${loc.id==='home'?'MINHA CASA':loc.name}</span></button>`;}).join('');
    const groupOrder=['Missão cooperativa','Missão ativa',...new Set(mapLocations.map(x=>x.group))],groups=[...new Set(groupOrder.filter(Boolean))];
    const grouped=groups.map(group=>{const list=mapLocations.filter(x=>x.group===group);if(!list.length)return'';const items=list.sort((a,b)=>mapDistance(a)-mapDistance(b)).map(loc=>`<button class="map-destination ${loc.id===activeId?'active':''}" data-map-list="${loc.id}"><b>${loc.icon}<em>${loc.name}</em></b><span>${mapDistance(loc)} m</span></button>`).join('');return `<section class="map-destination-group"><h4>${group}</h4><div>${items}</div></section>`;}).join('');
    const current=state.waypoint?`<div class="gps-current"><small>ROTA ATUAL</small><b>${state.waypoint.name}</b><span>${Math.round(routeInfo?.remaining||0)} m • ${routeInfo?.instruction||'siga a rota'}</span><button class="btn danger" data-clear-waypoint>Cancelar</button></div>`:`<div class="gps-current empty"><b>Para onde vamos?</b><span>Escolha um lugar no mapa ou na lista.</span></div>`;
    openModal('Mapa',`<div class="map-layout v626 responsive-map"><div class="map-main"><div class="world-map clean-map"><div class="map-zoom-layer"><i class="map-road horizontal"></i><i class="map-road vertical"></i><i class="map-road west"></i><i class="map-road east"></i><i class="map-river"></i><div class="map-region forest">FLORESTA</div><div class="map-region city">VILA</div><div class="map-region adventure">AVENTURA</div>${window.OTTHI_ROOM_WORLD?.mapRegionsMarkup?.(worldToMap)||''}${typeof worldHighwaysSvgMarkup==='function'?worldHighwaysSvgMarkup():''}${route.length?routeSvgMarkup(route):''}${markers}<span class="player-dot" style="left:${pp.left}%;top:${pp.top}%;--player-angle:${angleDeg}deg"><i></i><b>VOCÊ</b></span></div><span class="map-north">N</span><div class="map-zoom-controls" role="group" aria-label="Controles de zoom do mapa"><button data-map-zoom-out aria-label="Diminuir zoom">−</button><button data-map-zoom-reset aria-label="Restaurar zoom">100%</button><button data-map-zoom-in aria-label="Aumentar zoom">+</button><button class="map-home-control" data-map-my-home>🏠 Minha casa</button></div></div></div><aside class="map-sidebar">${current}<div id="mapSelection">${mapSelectionMarkup(mapSelectedId)}</div><h3>Escolha um lugar</h3><div class="map-destinations grouped">${grouped}</div></aside></div>`,root=>{
      const map=$('.clean-map',root),layer=$('.map-zoom-layer',root),main=$('.map-main',root),selection=$('#mapSelection',root),zoomLabel=$('[data-map-zoom-reset]',root);
      const clampMapView=()=>{if(!map)return;const rect=map.getBoundingClientRect(),limitX=Math.max(0,(mapViewState.zoom-1)*rect.width*.5),limitY=Math.max(0,(mapViewState.zoom-1)*rect.height*.5);mapViewState.panX=clamp(mapViewState.panX,-limitX,limitX);mapViewState.panY=clamp(mapViewState.panY,-limitY,limitY);};
      const renderMapView=()=>{clampMapView();if(layer)layer.style.transform=`translate3d(${mapViewState.panX.toFixed(1)}px,${mapViewState.panY.toFixed(1)}px,0) scale(${mapViewState.zoom.toFixed(3)})`;if(zoomLabel)zoomLabel.textContent=`${Math.round(mapViewState.zoom*100)}%`;};
      const setMapZoom=(next,clientX=null,clientY=null)=>{if(!map)return;const rect=map.getBoundingClientRect(),old=mapViewState.zoom,zoom=clamp(Number(next)||1,1,2.8),anchorX=clientX===null?rect.width/2:clamp(clientX-rect.left,0,rect.width),anchorY=clientY===null?rect.height/2:clamp(clientY-rect.top,0,rect.height),centerX=rect.width/2,centerY=rect.height/2;if(Math.abs(zoom-old)<.001)return;mapViewState.panX=(anchorX-centerX)-(anchorX-centerX-mapViewState.panX)*zoom/old;mapViewState.panY=(anchorY-centerY)-(anchorY-centerY-mapViewState.panY)*zoom/old;mapViewState.zoom=zoom;renderMapView();};
      const fitMapToViewport=()=>{if(!map||!main)return;const portrait=matchMedia?.('(orientation: portrait)')?.matches??innerHeight>=innerWidth,body=$('.modal-body',els.modal),availableWidth=Math.max(220,main.clientWidth),availableHeight=portrait?Math.min(innerHeight*.55,availableWidth):Math.max(220,Math.min(main.clientHeight,body?.clientHeight||innerHeight*.75)),size=Math.floor(Math.min(availableWidth,availableHeight));map.style.setProperty('--map-size',`${size}px`);map.style.setProperty('width',`${size}px`,'important');map.style.setProperty('height',`${size}px`,'important');const rect=map.getBoundingClientRect();applyMapMarkerPlacements(root,mapMarkerPlacements(visualNodes,pp,rect.width,rect.height));renderMapView();};
      const bindRoute=()=>{$('[data-route-selected]',selection)?.addEventListener('click',e=>setWaypoint(e.currentTarget.dataset.routeSelected));$$('[data-cluster-location]',selection).forEach(btn=>btn.onclick=()=>selectMapLocation(btn.dataset.clusterLocation));};
      const selectMapLocation=id=>{mapSelectedId=id;$$('[data-map-marker]',root).forEach(x=>x.classList.toggle('selected',x.dataset.mapMarker===id));$$('[data-map-list]',root).forEach(x=>x.classList.toggle('selected',x.dataset.mapList===id));selection.innerHTML=mapSelectionMarkup(id);bindRoute();if(matchMedia?.('(orientation: portrait)')?.matches)selection.scrollIntoView?.({behavior:'smooth',block:'nearest'});};
      requestAnimationFrame(fitMapToViewport);setTimeout(fitMapToViewport,100);$$('[data-map-list]',root).forEach(btn=>btn.onclick=()=>selectMapLocation(btn.dataset.mapList));$$('[data-map-marker]',root).forEach(btn=>btn.onclick=()=>selectMapLocation(btn.dataset.mapMarker));$('[data-clear-waypoint]',root)?.addEventListener('click',clearWaypoint);$('[data-map-zoom-in]',root)?.addEventListener('click',()=>setMapZoom(mapViewState.zoom+.35));$('[data-map-zoom-out]',root)?.addEventListener('click',()=>setMapZoom(mapViewState.zoom-.35));$('[data-map-zoom-reset]',root)?.addEventListener('click',()=>{mapViewState.zoom=1;mapViewState.panX=mapViewState.panY=0;renderMapView();});$('[data-map-my-home]',root)?.addEventListener('click',()=>selectMapLocation('home'));map?.addEventListener('wheel',event=>{event.preventDefault();setMapZoom(mapViewState.zoom+(event.deltaY<0 ? .24 : -.24),event.clientX,event.clientY);},{passive:false});map?.addEventListener('dblclick',event=>{if(event.target.closest?.('button'))return;event.preventDefault();setMapZoom(mapViewState.zoom<1.5?1.75:1,event.clientX,event.clientY);});
      const pointers=new Map();let gesture=null,suppressClickUntil=0;const pointOf=event=>({x:event.clientX,y:event.clientY});map?.addEventListener('pointerdown',event=>{if(event.target.closest?.('button'))return;pointers.set(event.pointerId,pointOf(event));map.setPointerCapture?.(event.pointerId);const values=[...pointers.values()];if(values.length===1)gesture={mode:'pan',origin:values[0],panX:mapViewState.panX,panY:mapViewState.panY,moved:false};else if(values.length===2){const mid={x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2};gesture={mode:'pinch',distance:Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y)||1,mid,zoom:mapViewState.zoom,panX:mapViewState.panX,panY:mapViewState.panY,moved:false};}});map?.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;pointers.set(event.pointerId,pointOf(event));const values=[...pointers.values()],rect=map.getBoundingClientRect();if(values.length===1&&gesture?.mode==='pan'&&mapViewState.zoom>1){const dx=values[0].x-gesture.origin.x,dy=values[0].y-gesture.origin.y;mapViewState.panX=gesture.panX+dx;mapViewState.panY=gesture.panY+dy;gesture.moved=gesture.moved||Math.hypot(dx,dy)>5;renderMapView();event.preventDefault();}else if(values.length===2){if(gesture?.mode!=='pinch'){const mid={x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2};gesture={mode:'pinch',distance:Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y)||1,mid,zoom:mapViewState.zoom,panX:mapViewState.panX,panY:mapViewState.panY,moved:true};}const distance=Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y)||1,mid={x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2},zoom=clamp(gesture.zoom*distance/gesture.distance,1,2.8),anchorX=gesture.mid.x-rect.left-rect.width/2,anchorY=gesture.mid.y-rect.top-rect.height/2;mapViewState.zoom=zoom;mapViewState.panX=anchorX-(anchorX-gesture.panX)*zoom/gesture.zoom+(mid.x-gesture.mid.x);mapViewState.panY=anchorY-(anchorY-gesture.panY)*zoom/gesture.zoom+(mid.y-gesture.mid.y);gesture.moved=true;renderMapView();event.preventDefault();}},{passive:false});const endPointer=event=>{const moved=!!gesture?.moved;pointers.delete(event.pointerId);if(moved)suppressClickUntil=performance.now()+220;const remaining=[...pointers.values()];gesture=remaining.length===1?{mode:'pan',origin:remaining[0],panX:mapViewState.panX,panY:mapViewState.panY,moved:false}:null;};map?.addEventListener('pointerup',endPointer);map?.addEventListener('pointercancel',endPointer);map?.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}},{capture:true});bindRoute();
    });els.modal.classList.add('map-modal');
  }
  let mapResizeTimer=0;
  function refreshOpenMapAfterResize(){if(els.modal.hidden||!els.modal.classList.contains('map-modal'))return;clearTimeout(mapResizeTimer);mapResizeTimer=setTimeout(()=>{if(!els.modal.hidden&&els.modal.classList.contains('map-modal'))openMap();},180);}
  window.addEventListener('resize',refreshOpenMapAfterResize,{passive:true});window.addEventListener('orientationchange',refreshOpenMapAfterResize,{passive:true});

  function performLocalReset(){
    window.OTTHOS_ACCOUNT?.clearSession?.();accountSession=null;safeLocalRemove(STORAGE_KEY);LEGACY_STORAGE_KEYS.forEach(safeLocalRemove);return window.OTTHOS_DB?.clear?.();
  }
  function openFinalResetConfirmation(inGame=false){
    openModal('Confirmação final',`<div class="parent-gate"><span>⚠️</span><h3>Esta ação reinicia somente este aparelho</h3><p>Uma conta sincronizada poderá recuperar o progresso. Para continuar, digite <b>APAGAR</b>.</p><label class="field"><span>Confirmação</span><input data-reset-word maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="APAGAR"></label><p data-reset-error class="account-error" hidden>Digite APAGAR exatamente.</p><button class="btn danger" data-reset-confirm>Recomeçar neste aparelho</button><button class="btn" data-reset-cancel>Cancelar</button></div>`,root=>{
      const input=$('[data-reset-word]',root),confirm=async()=>{if(String(input.value||'').trim().toUpperCase()!=='APAGAR'){$('[data-reset-error]',root).hidden=false;input.select();return;}if(!(await confirmModal('Última confirmação','Tem certeza de que deseja reiniciar os dados locais deste aparelho?','Sim, recomeçar','Cancelar')))return;await performLocalReset();state=defaultState();await commitState();location.reload();};
      $('[data-reset-confirm]',root).onclick=confirm;$('[data-reset-cancel]',root).onclick=()=>openParentTools(inGame);input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();confirm();}};setTimeout(()=>input.focus(),80);
    });
  }
  function formatPlayTime(seconds=0){const minutes=Math.max(0,Math.floor(Number(seconds||0)/60)),hours=Math.floor(minutes/60),rest=minutes%60;return hours?`${hours}h ${rest}min`:`${rest} min`;}
  async function openParentTools(inGame=false){
    let guardian={multiplayerEnabled:true,communicationEnabled:true,chatEnabled:true,sessionLimitMinutes:0,updatedAt:0,...(state.guardian||{})},blocked={},activityAudit=[];
    if(accountLinked()){
      try{const remote=await window.OTTHOS_RTDB?.getGuardianSettings?.();if(remote&&typeof remote==='object')guardian={...guardian,...(remote.settings||remote)};}catch{}
      try{blocked=await window.OTTHOS_RTDB?.getBlockedPlayers?.()||{};}catch{}
      try{const audit=await window.OTTHOS_RTDB?.getActivityAudit?.(120);activityAudit=Array.isArray(audit?.items)?audit.items:[];}catch{}
      state.guardian={...state.guardian,...guardian};
    }
    const linked=accountLinked(),blockedEntries=Object.entries(blocked||{});
    const sessionLimitSeconds=Math.max(0,Number(guardian.sessionLimitMinutes||0))*60,sessionLocked=Number(state.usage?.sessionLockedAt||0)>0||(sessionLimitSeconds>0&&Number(state.usage?.sessionSeconds||0)>=sessionLimitSeconds);
    const sessionUnlockHtml=sessionLocked?`<div class="online-status-card"><b>⏰ Sessão bloqueada pelo limite</b><span>Somente esta área protegida pode liberar uma nova sessão.</span><button class="btn primary" data-parent-new-session>Liberar nova sessão</button></div>`:'';
    const onlineControls=`<div class="online-status-card"><b>🌐 Controles online</b><span>${linked?'Estas opções ficam protegidas pela senha da conta.':'Estas opções valem neste aparelho. Vincule uma conta para protegê-las por senha e sincronizá-las.'}</span></div><div class="settings-list"><div class="settings-row"><div><b>Multiplayer</b><small>Entrada em bairros e presença de outros jogadores</small></div><button class="toggle ${guardian.multiplayerEnabled!==false?'on':''}" data-guardian-toggle="multiplayerEnabled"><i></i></button></div><div class="settings-row"><div><b>Interações online</b><small>Convites, presentes, desafios e ações sociais</small></div><button class="toggle ${guardian.communicationEnabled!==false?'on':''}" data-guardian-toggle="communicationEnabled"><i></i></button></div><div class="settings-row"><div><b>Chat seguro</b><small>Somente frases pré-aprovadas pelo jogo</small></div><button class="toggle ${guardian.chatEnabled!==false?'on':''}" data-guardian-toggle="chatEnabled"><i></i></button></div><div class="settings-row"><div><b>Limite por sessão</b><small>O jogo volta ao menu quando o tempo termina</small></div><select data-session-limit><option value="0">Sem limite</option><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></div></div><div class="modal-actions"><button class="btn primary" data-save-guardian>Salvar controles</button></div>`;
    const auditCategoryLabel=item=>item?.category==='chat'?'Conversa':item?.category==='gift'?'Presente':item?.category==='challenge'?'Desafio':item?.category==='coop'?'Missão cooperativa':item?.category==='safety'?'Segurança':'Interação';
    const auditDirectionLabel=item=>item?.direction==='received'?'Recebeu':item?.direction==='sent'?'Enviou':'Realizou';
    const auditHtml=linked?`<div class="social-tabs"><b>Histórico online</b><small>últimas ${activityAudit.length} ações</small></div>${activityAudit.length?activityAudit.map(item=>{const when=new Date(Number(item.createdAtClient||item.createdAt||Date.now())).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),peer=item.peerName?` • ${escapeHtml(item.peerName)}`:'',text=item.text?` • “${escapeHtml(item.text)}”`:'';return`<div class="settings-row"><div><b>${auditDirectionLabel(item)} ${auditCategoryLabel(item)}</b><small>${escapeHtml(item.action||'atividade')}${peer}${text}</small></div><span class="db-status">${when}</span></div>`}).join(''):'<p class="empty-online">Nenhuma conversa ou interação registrada ainda.</p>'}`:'';
    const blockedHtml=linked?`<div class="social-tabs"><b>Jogadores bloqueados</b><small>${blockedEntries.length}</small></div>${blockedEntries.length?blockedEntries.map(([uid,data])=>`<div class="settings-row"><div><b>${escapeHtml(data?.name||'Jogador bloqueado')}</b><small>${escapeHtml(uid.slice(0,12))}</small></div><button class="btn compact" data-unblock-player="${escapeHtml(uid)}">Desbloquear</button></div>`).join(''):'<p class="empty-online">Nenhum jogador bloqueado.</p>'}`:'';
    openModal('Área dos responsáveis',`<div class="parent-area"><div class="parent-area-heading"><span>🛡️</span><div><b>Progresso e segurança</b><small>Área protegida e fora da interface infantil.</small></div></div><div class="settings-list"><div class="settings-row"><div><b>Tempo total neste aparelho</b><small>Sessão atual: ${formatPlayTime(state.usage?.sessionSeconds)}</small></div><span class="db-status">${formatPlayTime(state.usage?.totalSeconds)}</span></div><div class="settings-row"><div><b>Aprendizado</b><small>${Number(state.learning?.totalCorrect||0)} respostas corretas • ${Object.keys(state.learning?.lessons||{}).length} lições</small></div><span class="db-status">Nível ${Number(state.profile?.level||1)}</span></div><div class="settings-row"><div><b>Atividade</b><small>${Number(state.stats?.walked||0).toFixed(0)} m a pé • ${Number(state.stats?.driven||0).toFixed(0)} m dirigindo</small></div><span class="db-status">${Number(state.medals?.length||0)} medalhas</span></div></div>${sessionUnlockHtml}${onlineControls}${auditHtml}${blockedHtml}<div class="social-tabs"><b>Backup e dados</b><small>somente este aparelho</small></div><div class="choice-grid"><button class="choice" data-parent-export><b>📤 Exportar backup</b><span>Baixar uma cópia do progresso</span></button><button class="choice" data-parent-import><b>📥 Importar backup</b><span>Substitui os dados deste aparelho</span></button><button class="choice danger-zone" data-parent-reset><b>🗑️ Recomeçar neste aparelho</b><span>Exige senha, palavra APAGAR e confirmação final</span></button></div><input data-parent-import-file type="file" accept="application/json" hidden><div class="modal-actions"><button class="btn" data-parent-back>Voltar às configurações</button></div></div>`,root=>{
      const draft={...guardian};
      const limit=$('[data-session-limit]',root);if(limit)limit.value=String(Math.max(0,Number(guardian.sessionLimitMinutes||0)));$$('[data-guardian-toggle]',root).forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.guardianToggle;draft[key]=draft[key]===false;btn.classList.toggle('on',draft[key]!==false);if(key==='multiplayerEnabled'&&draft[key]===false){draft.communicationEnabled=false;draft.chatEnabled=false;$$('[data-guardian-toggle]',root).forEach(other=>{if(other.dataset.guardianToggle!=='multiplayerEnabled')other.classList.remove('on');});}if(key==='communicationEnabled'&&draft[key]===false){draft.chatEnabled=false;$('[data-guardian-toggle="chatEnabled"]',root)?.classList.remove('on');}if(key==='communicationEnabled'&&draft[key]!==false&&draft.multiplayerEnabled===false){draft.multiplayerEnabled=true;$('[data-guardian-toggle="multiplayerEnabled"]',root)?.classList.add('on');}if(key==='chatEnabled'&&draft[key]!==false){draft.communicationEnabled=true;draft.multiplayerEnabled=true;$('[data-guardian-toggle="communicationEnabled"]',root)?.classList.add('on');$('[data-guardian-toggle="multiplayerEnabled"]',root)?.classList.add('on');}}));
      $('[data-save-guardian]',root)?.addEventListener('click',async e=>{const btn=e.currentTarget;draft.sessionLimitMinutes=Math.max(0,Number(limit?.value||0));btn.disabled=true;btn.textContent='Salvando...';let result={ok:true,settings:{...draft}};if(linked){const saveGuardian=window.OTTHOS_RTDB?.saveGuardianSettings;result=saveGuardian?await saveGuardian(draft):{ok:false,error:'Firebase ainda não está pronto.'};}if(result?.ok===false||result===false){btn.disabled=false;btn.textContent='Salvar controles';toast(result?.error||'Não foi possível salvar. Confirme a senha novamente.','warn',3000);return;}const saved=result?.settings||result;state.guardian={...draft,...saved,updatedAt:Date.now()};saveState(true);if(state.guardian.multiplayerEnabled===false)window.OTTHOS_RTDB?.disconnect?.();else window.OTTHOS_RTDB?.connect?.({name:publicPlayerName()});toast('Controles online salvos.','good',2200);openParentTools(inGame);});
      $$('[data-unblock-player]',root).forEach(btn=>btn.onclick=async()=>{const result=await window.OTTHOS_RTDB?.unblockPlayer?.(btn.dataset.unblockPlayer);if(result?.ok===false||result===false){toast(result?.error||'Não foi possível desbloquear.','warn');return;}toast('Jogador desbloqueado.','good');openParentTools(inGame);});
      $('[data-parent-new-session]',root)?.addEventListener('click',()=>{state.usage={totalSeconds:0,sessionSeconds:0,sessionStartedAt:0,lastPlayedAt:0,sessionLockedAt:0,...(state.usage||{}),sessionSeconds:0,sessionStartedAt:Date.now(),sessionLockedAt:0};saveState(true);toast('Nova sessão liberada pelo responsável.','good',2400);openParentTools(inGame);});
      $('[data-parent-export]',root).onclick=()=>window.OTTHOS_DB?.exportFile(state);
      const fileInput=$('[data-parent-import-file]',root);$('[data-parent-import]',root).onclick=()=>fileInput.click();
      fileInput.onchange=async()=>{const file=fileInput.files?.[0];if(!file)return;try{const imported=normalizeState(await window.OTTHOS_DB.importFile(file));if(!(await confirmModal('Importar backup','O progresso atual deste aparelho será substituído pelo arquivo escolhido. Continuar?','Importar','Cancelar')))return;state=imported;await window.OTTHOS_DB.save(state);safeLocalSet(STORAGE_KEY,JSON.stringify(state));location.reload();}catch(error){toast(error.message||'Backup inválido.','bad');}};
      $('[data-parent-reset]',root).onclick=()=>openFinalResetConfirmation(inGame);$('[data-parent-back]',root).onclick=()=>openSettings(inGame);
    });
  }
  function openParentGate(inGame=false){
    if(accountLinked()){
      openModal('Acesso de responsável',`<div class="parent-gate"><span>🛡️</span><h3>Confirme a senha da conta</h3><p>Esta área contém progresso, controles online, bloqueios, backup e reinício.</p><label class="field"><span>Senha da conta</span><input data-parent-password type="password" maxlength="64" autocomplete="current-password"></label><p data-parent-gate-error class="account-error" hidden></p><button class="btn primary xl" data-parent-unlock>Continuar</button><button class="btn" data-parent-cancel>Cancelar</button></div>`,root=>{
        const input=$('[data-parent-password]',root),error=$('[data-parent-gate-error]',root),unlock=async()=>{const btn=$('[data-parent-unlock]',root);btn.disabled=true;btn.textContent='Confirmando...';const result=await window.OTTHOS_RTDB?.reauthenticateAccount?.(input.value);if(!result?.ok){error.textContent=result?.error||'Senha incorreta.';error.hidden=false;btn.disabled=false;btn.textContent='Continuar';input.select();return;}openParentTools(inGame);};
        $('[data-parent-unlock]',root).onclick=unlock;$('[data-parent-cancel]',root).onclick=()=>openSettings(inGame);input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();unlock();}};setTimeout(()=>input.focus(),80);
      });return;
    }
    const a=7+Math.floor(Math.random()*5),b=5+Math.floor(Math.random()*4),answer=a*b;
    openModal('Acesso de responsável',`<div class="parent-gate"><span>🛡️</span><h3>Peça ajuda a um adulto</h3><p>Sem uma conta vinculada, esta verificação libera apenas progresso e backup local. Para controles online protegidos por senha, vincule a conta. Responda:</p><label class="field"><span>Quanto é ${a} × ${b}?</span><input data-parent-answer inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off"></label><p data-parent-gate-error class="account-error" hidden>Resposta incorreta.</p><button class="btn primary xl" data-parent-unlock>Continuar</button><button class="btn" data-parent-cancel>Cancelar</button></div>`,root=>{const input=$('[data-parent-answer]',root),unlock=()=>{if(Number(input.value)!==answer){$('[data-parent-gate-error]',root).hidden=false;input.select();return;}openParentTools(inGame);};$('[data-parent-unlock]',root).onclick=unlock;$('[data-parent-cancel]',root).onclick=()=>openSettings(inGame);input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();unlock();}};setTimeout(()=>input.focus(),80);});
  }
  let deferredSettingsRefresh = null;
  function openSettings(inGame = false) {
    const sound = state.settings.sound, vibration = state.settings.vibration, quality = requestedQuality(), high = quality === 'high';
    const savedAt = state.lastSaved ? new Date(state.lastSaved).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : 'ainda não salvo';
    const isiOSInstall = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const installOption = !isStandalone() && (!!deferredInstallPrompt || isiOSInstall) ? '<button class="btn" data-install>Instalar aplicativo</button>' : '';
    openModal('Configurações', `<div class="settings-list">
      <div class="settings-row"><div><b>Som</b><small>Interface, coleta e combate</small></div><button class="toggle ${sound ? 'on' : ''}" data-toggle="sound"><i></i></button></div>
      <div class="settings-row"><div><b>Vibração</b><small>Feedback no celular</small></div><button class="toggle ${vibration ? 'on' : ''}" data-toggle="vibration"><i></i></button></div>
      <div class="settings-row"><div><b>Qualidade gráfica</b><small>${qualityLabel()}</small></div><button class="toggle ${quality !== 'low' ? 'on' : ''}" data-toggle="quality"><i></i></button></div><div class="settings-row"><div><b>Desempenho atual</b><small>${Math.round(perf.fps)} FPS • render ${qualityTier()}</small></div><span class="db-status">AUTO</span></div>
      <div class="settings-row"><div><b>Salvamento automático</b><small>IndexedDB no celular + cópia local. Último: ${savedAt}</small></div><span class="db-status">✓ Ativo</span></div>
      <div class="settings-row"><div><b>Nome público</b><small>${hasValidPlayerName()?state.profile.name:'Ainda não definido'}</small></div><button class="btn compact" data-player-name-settings>Editar</button></div>
      <div class="settings-row"><div><b>Conta do jogo</b><small>${accountStatusText()}</small></div><button class="btn compact" data-account-settings>Abrir</button></div>
      <div class="settings-row"><div><b>Mundo online</b><small id="mpSettingsStatus">${multiplayerStatusText()}</small></div><button class="btn compact" data-multiplayer-config>Abrir online</button></div>
    </div><div class="modal-actions">
      <button class="btn primary" data-save-now>Salvar agora</button>
      ${installOption}
      ${inGame ? '<button class="btn" data-home>Voltar para casa</button><button class="btn" data-exit>Sair para o menu</button>' : ''}
      <button class="btn subtle parent-access-btn" data-parent-area>🛡️ Área dos responsáveis</button>
    </div>`, root => {
      $('[data-player-name-settings]',root)?.addEventListener('click',()=>openPlayerNameModal(false,()=>openSettings(inGame)));$('[data-account-settings]',root)?.addEventListener('click',()=>openAccountCenter(false));$('[data-multiplayer-config]',root)?.addEventListener('click',openMultiplayerConfig);
      $$('[data-toggle]', root).forEach(btn => btn.onclick = () => {
        const key = btn.dataset.toggle;
        if (key === 'quality') state.settings.quality = requestedQuality() === 'auto' ? 'high' : requestedQuality() === 'high' ? 'low' : 'auto';
        else state.settings[key] = !state.settings[key];
        saveState(true); closeModal(); applyQuality(); openSettings(inGame);
      });
      $('[data-save-now]',root).onclick=async()=>{ if(running) savePlayerPosition(true); else await commitState(); toast('Progresso salvo no celular.','good'); closeModal(); };
      const install=$('[data-install]',root);if(install)install.onclick=installApp;
      const home = $('[data-home]', root); if (home) home.onclick = () => { closeModal(); returnHome(); };
      const exit = $('[data-exit]', root); if (exit) exit.onclick = () => { closeModal(); stopGame(); };
      $('[data-parent-area]',root).onclick=()=>openParentGate(inGame);
    });
  }


  els.quizBtn.onclick = () => openEducationHub('math');
  const learningPathBtn=$('#learningPathBtn');if(learningPathBtn)learningPathBtn.onclick=()=>{if(window.OTTHI_LEARNING?.open)window.OTTHI_LEARNING.open();else openEducationHub(String(state.learning?.lastLesson||'math').split('-')[0]);};
  const neighborhoodBtn=$('#neighborhoodBtn');if(neighborhoodBtn)neighborhoodBtn.onclick=openMultiplayerConfig;
  els.challengePromptAccept.onclick=()=>{if(promptSocialRequestId)acceptIncomingSocialRequest(promptSocialRequestId);else if(promptChallengeId)acceptIncomingChallenge(promptChallengeId);else if(promptSessionId){const s=gameSessions.get(promptSessionId);if(s)launchSessionWithCountdown(s);}};
  els.challengePromptDecline.onclick=()=>{if(promptSocialRequestId)declineIncomingSocialRequest(promptSocialRequestId);else if(promptChallengeId)declineIncomingChallenge(promptChallengeId);else closeChallengePrompt();};
  els.collectionBtn.onclick = openCollection;
  els.avatarBtn.onclick = openAvatarStudio;
  els.accountBtn.onclick = () => openAccountCenter(false);
  els.moldsBtn.onclick = openMolds;
  els.howBtn.onclick = openHow;
  els.settingsBtn.onclick = () => openSettings(false);els.multiplayerBadge.onclick=openSocialHub;els.profileNameBtn.onclick=()=>openPlayerNameModal(false);
  els.avatarGameBtn.onclick = openLifePanel;
  els.inventoryBtn.onclick = openInventory;
  els.toolsBtn.onclick = openToolbelt;
  els.mapBtn.onclick = openMap;
  els.dailyBtn.onclick = () => openEducationHub('math');
  els.onlineBtn.onclick = openSocialHub;
  els.newsQuickBtn.onclick = () => { if(window.OTTHI_OTTOVIAS?.openNews) window.OTTHI_OTTOVIAS.openNews(); else toast('O noticiário estará disponível quando o mundo terminar de carregar.','warn'); };
  els.neighborhoodQuickBtn.onclick = openMultiplayerConfig;
  els.gameSettingsBtn.onclick = () => openSettings(true);
