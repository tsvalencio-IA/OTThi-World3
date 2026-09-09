/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 27-npc-enemies-combat-camera-action.js
 * Escopo: Sociedade NPC, inimigos, combate, câmera, contexto, ação e necessidades
 * Linhas de origem V642: 4001-4157
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function nearestRideCompanion(radius=7){
    return world.npcs.filter(n=>!n.passengerMode&&(n.pendingRide||n.following)).sort((a,b)=>distance2D(player,a.group.position)-distance2D(player,b.group.position)).find(n=>distance2D(player,n.group.position)<=radius)||null;
  }
  function nearestBoardableNpc(radius=4.8){
    return world.npcs.filter(n=>!n.passengerMode).sort((a,b)=>distance2D(player,a.group.position)-distance2D(player,b.group.position)).find(n=>distance2D(player,n.group.position)<=radius)||null;
  }
  function boardNpcPassenger(npc,kind){
    if(!npc)return false;const current=kind==='boat'?player.boat:player.car;if(current.passengerBotId||(kind==='boat'?!!current.passengerUid:!vehicleHasPassengerSeat()))return false;current.passengerBotId=npc.id;npc.passengerMode=kind;npc.pendingRide=false;npc.following=false;if(npc.mobility?.ride)npc.mobility.ride.visible=false;toast(`${npc.name} entrou como passageiro no ${kind==='boat'?'barco':'carro'}.`,'good',2300);saveState();return true;
  }
  function releaseNpcPassenger(kind){
    const current=kind==='boat'?player.boat:player.car,id=current.passengerBotId;if(!id)return;const npc=world.npcs.find(n=>n.id===id);if(npc){const exitX=kind==='boat'?BOAT_DOCK.exitX+1.2:player.x+1.8,exitZ=kind==='boat'?clamp(player.z,BOAT_DOCK.minZ+.25,BOAT_DOCK.maxZ-.25):player.z;npc.passengerMode='';npc.group.position.set(exitX,groundHeightAt(exitX,exitZ),exitZ);npc.baseX=npc.group.position.x;npc.baseZ=npc.group.position.z;if(npc.mobility?.ride)npc.mobility.ride.visible=true;}current.passengerBotId='';
  }
  function updateNpcSociety(dt){
    updateNpcSociety.acc=(updateNpcSociety.acc||0)+dt;if(updateNpcSociety.acc<9)return;updateNpcSociety.acc=0;if(!world.npcs.length)return;
    const candidates=world.npcs.filter(n=>!n.stationary&&!n.ottoviasRole);if(!candidates.length)return;const npc=candidates[Math.floor(Math.random()*candidates.length)],roll=Math.random();
    if(roll<.22){const gift=Math.random()<.5?'food':'coins';if(gift==='food'){state.inventory.food=(state.inventory.food||0)+1;npcSpeech(npc,'Trouxe uma comida para você!');}else{state.profile.coins+=8;npcSpeech(npc,'Ganhei algumas moedas e dividi com você!');}saveState();updateHUD();}
    else if(roll<.44){npcSpeech(npc,'Quer apostar uma corrida comigo?');npc.userDataChallengeUntil=performance.now()+12000;}
    else if(roll<.66){const other=candidates.find(n=>n!==npc);if(other){state.npcSociety.friendships[`${npc.id}-${other.id}`]=(state.npcSociety.friendships[`${npc.id}-${other.id}`]||0)+1;npcSpeech(npc,`Conversei com ${other.name} na praça.`);}}
    else if(roll<.82){npcSpeech(npc,'Hoje estou chateado. Podemos conversar com calma?','warn');state.npcSociety.moods[npc.id]='chateado';}
    else{const available=world.houses.find(h=>!h.publicBuilding&&!cloudHouseRecord(h.id)&&!state.npcSociety.houses[h.id]);if(available){state.npcSociety.houses[available.id]=npc.id;npcSpeech(npc,`Estou juntando moedas para morar na ${available.name}.`);saveState();}}
  }

  function v705NpcSeed(id='npc'){let h=2166136261;for(const ch of String(id)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function v705NpcBrain(npc){if(npc.brain?.traits)return npc.brain;const seed=v705NpcSeed(npc.id),traits={cautious:.35+((seed&255)/255)*.55,social:.25+(((seed>>8)&255)/255)*.65,pace:.88+(((seed>>16)&255)/255)*.28,patience:.7+(((seed>>24)&255)/255)*.8};return npc.brain={state:'idle',target:null,nextThink:0,fearUntil:0,lastVehicle:'',lastVehicleAt:0,lastPlayerAt:0,wanderUntil:0,memory:[],traits,peerId:'',socialUntil:0,idleUntil:0};}
  function v705NpcRemember(npc,type,data={}){const b=v705NpcBrain(npc),last=b.memory[b.memory.length-1];if(last&&last.type===type&&performance.now()-last.at<2500)return;b.memory.push({type,at:performance.now(),...data});if(b.memory.length>10)b.memory.shift();}
  function v705NpcPositionClear(x,z){if(typeof v704RoadAt==='function'&&v704RoadAt(x,z,.18,true))return false;if(typeof positionBlockedForPlayer==='function'&&positionBlockedForPlayer(x,z,.38,{ignoreTraffic:true,allowWater:false}))return false;for(const h of world.hazards||[]){if(Number.isFinite(h?.w)&&Math.abs(x-h.x)<h.w/2+.45&&Math.abs(z-h.z)<h.d/2+.45)return false;}return true;}
  function v705NpcPickWander(npc){const b=v705NpcBrain(npc);for(let attempt=0;attempt<14;attempt++){const a=Math.random()*Math.PI*2,r=.9+Math.random()*Math.max(1.8,npc.pathRadius||4),x=npc.baseX+Math.sin(a)*r,z=npc.baseZ+Math.cos(a)*r;if(v705NpcPositionClear(x,z)){b.target={x,z};b.state='wander';b.wanderUntil=performance.now()+2800+Math.random()*5200*b.traits.patience;return;}}b.target={x:npc.baseX,z:npc.baseZ};b.state='idle';b.wanderUntil=performance.now()+1800;}
  function v705NpcVehicleThreat(npc){if(!player.vehicle||player.car.passengerOf)return null;const speed=Math.abs(Number(player.car.speed||0)),rx=npc.group.position.x-player.x,rz=npc.group.position.z-player.z,d=Math.hypot(rx,rz);if(speed<1.7||d>15)return null;const vx=Math.sin(player.car.heading)*player.car.speed,vz=Math.cos(player.car.heading)*player.car.speed,closing=(vx*rx+vz*rz)/Math.max(.001,d),speed2=Math.max(.01,vx*vx+vz*vz),ttc=(rx*vx+rz*vz)/speed2,closestX=rx-vx*ttc,closestZ=rz-vz*ttc,miss=Math.hypot(closestX,closestZ),horn=performance.now()<Number(player.hornUntil||0),cautious=v705NpcBrain(npc).traits.cautious;if(!horn&&(closing<.7||ttc<0||ttc>2.6+cautious||miss>1.4+cautious*1.5))return null;return{d,speed,vx,vz,id:String(currentVehicleRef?.()?.id||'player-car'),horn,ttc,miss};}
  function v705NpcEvadeTarget(npc,threat){const mag=Math.max(.001,Math.hypot(threat.vx,threat.vz)),nx=-threat.vz/mag,nz=threat.vx/mag;let sign=((npc.group.position.x-player.x)*nx+(npc.group.position.z-player.z)*nz)>=0?1:-1;for(const s of[sign,-sign])for(const dist of[5.2,4.0,3.0,2.2]){const x=npc.group.position.x+nx*s*dist,z=npc.group.position.z+nz*s*dist;if(v705NpcPositionClear(x,z))return{x,z};}return{x:npc.baseX,z:npc.baseZ};}
  function v705NpcSocialPeer(npc){const b=v705NpcBrain(npc);if(b.traits.social<.43)return null;let best=null,bestD=3.8;for(const other of world.npcs||[]){if(other===npc||other.passengerMode||other.mobility||other.coopRaceMode)continue;const d=Math.hypot(npc.group.position.x-other.group.position.x,npc.group.position.z-other.group.position.z);if(d<bestD){best=other;bestD=d;}}return best;}
  function v705NpcThink(npc){const b=v705NpcBrain(npc),now=performance.now(),near=distance2D(player,npc.group.position),threat=v705NpcVehicleThreat(npc);if(threat){b.state='evade';b.target=v705NpcEvadeTarget(npc,threat);b.fearUntil=now+2600+1700*b.traits.cautious;b.lastVehicle=threat.id;b.lastVehicleAt=now;v705NpcRemember(npc,'vehicle-threat',{vehicle:threat.id,ttc:+threat.ttc.toFixed(2)});if(now-Number(npc.lastDangerSpeech||0)>7000){npc.lastDangerSpeech=now;npcSpeech(npc,threat.horn?'Ouvi a buzina. Vou sair da frente.':'Cuidado! Vou para um lugar seguro.','warn');}return;}if(now<b.fearUntil){if(!b.target||Math.hypot(npc.group.position.x-b.target.x,npc.group.position.z-b.target.z)<.5)b.target={x:npc.baseX,z:npc.baseZ};b.state='recover';return;}if(npc.following){b.state='follow';return;}if(near<3.2){b.state='social';b.lastPlayerAt=now;return;}if(now<b.socialUntil&&b.peerId){b.state='peer-social';return;}const peer=v705NpcSocialPeer(npc);if(peer&&Math.random()<.16*b.traits.social){b.peerId=peer.id;b.socialUntil=now+1400+Math.random()*2400;b.state='peer-social';v705NpcRemember(npc,'talked-to',{peer:peer.id});return;}if(now<Number(b.idleUntil||0)){b.state='idle-look';return;}if(Math.random()<.12){b.idleUntil=now+800+Math.random()*1800;b.state='idle-look';return;}if(!b.target||now>b.wanderUntil||Math.hypot(npc.group.position.x-b.target.x,npc.group.position.z-b.target.z)<.35)v705NpcPickWander(npc);}
  function v705NpcSeparation(npc){let sx=0,sz=0,count=0;for(const other of world.npcs||[]){if(other===npc||other.passengerMode)continue;const dx=npc.group.position.x-other.group.position.x,dz=npc.group.position.z-other.group.position.z,d=Math.hypot(dx,dz);if(d>.001&&d<1.15){const w=(1.15-d)/1.15;sx+=dx/d*w;sz+=dz/d*w;count++;}}return count?{x:sx/count,z:sz/count}:{x:0,z:0};}
  function v705NpcWalk(npc,dt,target,speed=1.35){if(!target)return 0;const sep=v705NpcSeparation(npc),dx0=target.x-npc.group.position.x,dz0=target.z-npc.group.position.z,d0=Math.hypot(dx0,dz0);if(d0<.04)return 0;let nx=dx0/d0+sep.x*.62,nz=dz0/d0+sep.z*.62,n=Math.max(.001,Math.hypot(nx,nz));nx/=n;nz/=n;const step=Math.min(d0,speed*v705NpcBrain(npc).traits.pace*dt),nextX=npc.group.position.x+nx*step,nextZ=npc.group.position.z+nz*step;if(!v705NpcPositionClear(nextX,nextZ)){v705NpcBrain(npc).target=null;return 0;}npc.group.position.x=nextX;npc.group.position.z=nextZ;npc.group.rotation.y=lerpAngle(npc.group.rotation.y,Math.atan2(nx,nz),Math.min(1,dt*7));return step;}
  function updateNPCs(dt){
    const now=performance.now();
    for(const npc of world.npcs){
      const playerDistance=distance2D(player,npc.group.position),near=playerDistance<3.2,oldX=npc.group.position.x,oldZ=npc.group.position.z,b=v705NpcBrain(npc),culled=npc.group.visible===false&&!npc.passengerMode&&!npc.following&&!npc.coopRaceMode,background=playerDistance>(perf.mobile?62:88)&&!npc.passengerMode&&!npc.following&&!npc.coopRaceMode&&!npc.mobility&&!near;
      if(culled&&!npc.mobility)continue;if(background){npc._perfSkipSeq=(Number(npc._perfSkipSeq||0)+1)%3;if(npc._perfSkipSeq!==0)continue;}
      if(npc.passengerMode){const heading=npc.passengerMode==='boat'?player.boat.heading:player.car.heading,lx=.65,lz=npc.passengerMode==='boat'?.62:-.18;npc.group.position.x=player.x+Math.cos(heading)*lx+Math.sin(heading)*lz;npc.group.position.z=player.z-Math.sin(heading)*lx+Math.cos(heading)*lz;npc.group.position.y=npc.passengerMode==='boat'?.75:.3;npc.group.rotation.y=heading;}
      else if(npc.fishingActivity){npc.group.position.x=npc.baseX;npc.group.position.z=npc.baseZ;npc.group.rotation.y=npc.fishingActivity.heading;}
      else if(npc.coopRaceMode){/* posição sincronizada pela missão cooperativa */}
      else if(npc.stationary){npc.group.position.x=npc.baseX;npc.group.position.z=npc.baseZ;npc.group.rotation.y=Number(npc.stationaryHeading||npc.group.rotation.y||0);}
      else if(npc.mobility){const route=npc.mobility.route,target=route[npc.mobility.index],dx=target.x-npc.group.position.x,dz=target.z-npc.group.position.z,d=Math.hypot(dx,dz);if(performance.now()<Number(npc.mobility.trafficHoldUntil||0)){npc.mobility.currentSpeed=0;}else if(d<.2)npc.mobility.index=(npc.mobility.index+1)%route.length;else{const heading=Math.atan2(dx,dz),factor=trafficSpeedFactor(npc.mobility,heading,6),targetSpeed=npc.mobility.speed*factor;npc.mobility.currentSpeed=lerp(Number(npc.mobility.currentSpeed||0),targetSpeed,Math.min(1,dt*4));const step=Math.min(d,npc.mobility.currentSpeed*dt),previous={x:npc.group.position.x,z:npc.group.position.z};if(step>.0001){npc.group.position.x+=dx/d*step;npc.group.position.z+=dz/d*step;snapTrafficToRoad(npc.group,previous);npc.group.rotation.y=lerpAngle(npc.group.rotation.y,heading,Math.min(1,dt*5));for(const wheel of npc.mobility.wheels)wheel.rotation.x-=step*3;}}}
      else{
        if(now>Number(b.nextThink||0)){b.nextThink=now+260+Math.random()*260;v705NpcThink(npc);}
        if(npc.following){const backX=player.x-Math.sin(player.facing)*2.1,backZ=player.z-Math.cos(player.facing)*2.1;v705NpcWalk(npc,dt,{x:backX,z:backZ},2.65);npc.group.rotation.y=lerpAngle(npc.group.rotation.y,player.facing,Math.min(1,dt*6));}
        else if(b.state==='social'||near){const look=Math.atan2(player.x-npc.group.position.x,player.z-npc.group.position.z);npc.group.rotation.y=lerpAngle(npc.group.rotation.y,look,Math.min(1,dt*5.8));if(Math.hypot(player.vx,player.vz)>4.2&&distance2D(player,npc.group.position)<1.6){const side=Math.sin(player.facing+(npc.id.length%2?Math.PI/2:-Math.PI/2)),sideZ=Math.cos(player.facing+(npc.id.length%2?Math.PI/2:-Math.PI/2)),target={x:npc.group.position.x+side*1.8,z:npc.group.position.z+sideZ*1.8};if(v705NpcPositionClear(target.x,target.z)){b.target=target;b.state='step-aside';}}}
        else if(b.state==='peer-social'){const peer=(world.npcs||[]).find(item=>item.id===b.peerId);if(peer&&peer.group){const look=Math.atan2(peer.group.position.x-npc.group.position.x,peer.group.position.z-npc.group.position.z);npc.group.rotation.y=lerpAngle(npc.group.rotation.y,look,Math.min(1,dt*4.5));if(Math.hypot(npc.group.position.x-peer.group.position.x,npc.group.position.z-peer.group.position.z)>2.3)v705NpcWalk(npc,dt,{x:peer.group.position.x,z:peer.group.position.z},.75);}else{b.peerId='';b.socialUntil=0;}}
        else if(b.state==='idle-look'){npc.group.rotation.y+=Math.sin(animTime*.7+npc.phase)*dt*.08;}
        else if(b.state==='evade'||b.state==='recover'||b.state==='step-aside'){v705NpcWalk(npc,dt,b.target,b.state==='evade'?4.5:b.state==='recover'?1.7:2.5);}
        else if(b.state==='wander'){v705NpcWalk(npc,dt,b.target,1.2+(npc.id.length%4)*.08);}
        else if(b.target)v705NpcWalk(npc,dt,b.target,1.1);
      }
      if(npc.group.visible===false&&!npc.passengerMode&&!npc.following&&!npc.coopRaceMode)continue;
      if(!npc.passengerMode)npc.group.position.y=lerp(npc.group.position.y,v705GroundY? v705GroundY(npc.group.position.x,npc.group.position.z):groundHeightAt(npc.group.position.x,npc.group.position.z),Math.min(1,dt*8));
      const moved=Math.hypot(npc.group.position.x-oldX,npc.group.position.z-oldZ),riding=!!npc.mobility&&!npc.passengerMode&&!npc.following,walk=moved>.001&&!riding?Math.sin(animTime*(b.state==='evade'?12:8.5)+npc.phase)*.58:0,gesture=near?Math.sin(animTime*2.4+npc.phase)*.1:0,emote=performance.now()<npc.emoteUntil?npc.emoteType:'';
      if(npc.limbs){npc.limbs.leftArm.rotation.x=lerp(npc.limbs.leftArm.rotation.x,riding?-1.2:emote==='dance'?-1.35:walk+gesture,.2);npc.limbs.rightArm.rotation.x=lerp(npc.limbs.rightArm.rotation.x,riding?-1.2:emote==='wave'?-2.0:emote==='dance'?-1.35:-walk-gesture,.2);npc.limbs.leftLeg.rotation.x=lerp(npc.limbs.leftLeg.rotation.x,riding?1.05:-walk*.76,.2);npc.limbs.rightLeg.rotation.x=lerp(npc.limbs.rightLeg.rotation.x,riding?1.05:walk*.76,.2);}
      if(npc.body)npc.body.position.y=1.28+(moved>.001?Math.abs(Math.sin(animTime*8+npc.phase))*.025:Math.sin(animTime*2+npc.phase)*.008);
    }
  }

  function updateEnemies(dt){
    for(const e of world.enemies){
      if(e.dead){if(performance.now()-e.lastHit>18000){e.dead=false;e.hp=e.type==='golem'?3:1;e.group.visible=true;e.group.position.set(e.baseX,0,e.baseZ);}continue;}
      if(e.group?.visible===false)continue;
      const d=distance2D(player,e);if(d>(perf.mobile?58:82)){e._perfSkipSeq=(Number(e._perfSkipSeq||0)+1)%3;if(e._perfSkipSeq!==0)continue;}let tx=e.baseX+Math.sin(animTime*.55+e.phase)*4,tz=e.baseZ+Math.cos(animTime*.48+e.phase)*4;
      if(d<9&&!currentHouse){tx=player.x;tz=player.z;}
      const speed=e.type==='bat'?2.1:e.type==='golem'?1.0:1.45;e.group.position.x=lerp(e.group.position.x,tx,dt*speed);e.group.position.z=lerp(e.group.position.z,tz,dt*speed);e.group.position.y=e.type==='bat'?1.2+Math.sin(animTime*3+e.phase)*.35:0;e.group.rotation.y=Math.atan2(tx-e.group.position.x,tz-e.group.position.z);
      if(d<1.45&&performance.now()>player.damageUntil){player.damageUntil=performance.now()+1100;if(performance.now()<player.shieldUntil){toast('O Escudo Furtivo bloqueou o ataque!','good',1300);beep(690,60,'sine');continue;}state.needs.energy=clamp(state.needs.energy-12,0,100);state.needs.fun=clamp(state.needs.fun-4,0,100);toast('Monstro acertou!','bad');vibrate([35,40,35]);saveState();}
    }
  }
  function meleeAttack(){
    const target=world.enemies.filter(e=>!e.dead).sort((a,b)=>distance2D(player,a.group.position)-distance2D(player,b.group.position))[0];
    if(!target||distance2D(player,target.group.position)>2.35){toast('Nada para atacar por perto.','warn');return;}
    damageEnemy(target,1);player.attackUntil=performance.now()+280;beep(360,60,'sawtooth');
  }
  function damageEnemy(enemy,amount){
    if(enemy.dead)return;enemy.hp-=amount;enemy.lastHit=performance.now();enemy.group.scale.set(1.18,.82,1.18);setTimeout(()=>enemy.group&&enemy.group.scale.set(1,1,1),130);
    if(enemy.hp<=0){enemy.dead=true;enemy.group.visible=false;state.defeated++;addXP(enemy.type==='golem'?45:20);addCoins(enemy.type==='golem'?35:12);toast('Monstro derrotado!','good');evaluateMissions();saveState();}
  }
  function firePower(){
    if(!els.modal.hidden||paused||player.transit.mode)return;
    if(typeof handleActiveSportSpecialV704==='function'&&handleActiveSportSpecialV704()){updateContext(true);return;}
    if(player.vehicle||player.boating){vehicleUtilityAction();return;}
    if(currentHouse){toast('Use o poder do lado de fora.','warn');return;}
    const dir={x:Math.sin(player.facing),z:Math.cos(player.facing)};const mesh=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),mat(0xff5a12,{emissive:0xff2a00,emissiveIntensity:.9}));mesh.position.set(player.x,player.y+1.35,player.z);worldGroup.add(mesh);world.fireballs.push({mesh,x:player.x,y:player.y+1.35,z:player.z,vx:dir.x*12,vz:dir.z*12,life:1.4});beep(220,90,'sawtooth');vibrate(18);
  }
  function updateFireballs(dt){
    for(let i=world.fireballs.length-1;i>=0;i--){const f=world.fireballs[i];f.life-=dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.mesh.position.set(f.x,f.y,f.z);f.mesh.rotation.x+=dt*7;f.mesh.rotation.y+=dt*9;let hit=false;for(const e of world.enemies){if(!e.dead&&Math.hypot(f.x-e.group.position.x,f.z-e.group.position.z)<1.1){damageEnemy(e,1);hit=true;break;}}if(hit||f.life<=0){worldGroup.remove(f.mesh);world.fireballs.splice(i,1);}}
  }

  function updateCamera(dt){
    let desiredPos,look;
    const workshopView=world.workshopInspectionCamera,lift=world.workshopLift;if(workshopView?.active&&lift?.vehicleId){const ground=groundHeightAt(lift.x,lift.z),pitch=clamp(cameraPitch,-.55,1.35),normalized=(pitch+.55)/1.9,dist=clamp(6.2+cameraZoom,3.4,13.5),height=lerp(.48,7.35,normalized),focusY=ground+Number(lift.height||0)+.82;desiredPos=new THREE.Vector3(lift.x-Math.sin(cameraYaw)*dist,ground+height,lift.z+Math.cos(cameraYaw)*dist);look=new THREE.Vector3(lift.x,focusY,lift.z);camera.fov=lerp(60,48,normalized);}
    const sportFrame=!desiredPos?window.OTTHI_SPORTS_V705?.cameraFrame?.():null;if(sportFrame){desiredPos=sportFrame.position;look=sportFrame.look;camera.fov=Number(sportFrame.fov||56);}
    if(!desiredPos&&player.transit.mode==='bus'){
      const bus=world.buses.find(item=>item.id===player.transit.busId);
      if(bus){
        bus.group.updateMatrixWorld(true);
        desiredPos=bus.group.localToWorld(new THREE.Vector3(.28,2.28,-2.56));
        look=bus.group.localToWorld(new THREE.Vector3(-.18,1.55,1.75));
        camera.fov=68;
      }
    }
    if(!desiredPos&&fishingVisual?.active){
      const portrait=innerHeight>innerWidth,v=fishingVisual,target=v.phase==='ready'?v.target:(v.bobber?.position||v.target);
      const focusX=lerp(player.x,Number(target?.x??player.x),.58),focusZ=lerp(player.z,Number(target?.z??player.z),.58),focusY=Math.max(.7,player.y+1.0);
      const dist=clamp((portrait?9.2:7.6)+cameraZoom,5.8,14.5),height=clamp((portrait?4.8:4.0)+cameraPitch*2.0,3.2,7.2);
      desiredPos=new THREE.Vector3(focusX-Math.sin(cameraYaw)*dist,focusY+height,focusZ+Math.cos(cameraYaw)*dist);
      look=new THREE.Vector3(focusX,focusY+.12,focusZ);camera.fov=portrait?52:49;
    }
    if(!desiredPos&&currentHouse&&cameraMode==='interior'){
      const h=currentHouse;const portrait=innerHeight>innerWidth;const orbit=clamp(cameraYaw,-1.18,1.18);const dist=clamp((portrait?8.2:7.2)+cameraZoom,5.2,12.5);const height=clamp((portrait?5.6:4.6)+cameraPitch*2.4+cameraZoom*.18,3.8,8.8);
      desiredPos=new THREE.Vector3(player.x-Math.sin(orbit)*dist,player.y+height,player.z+Math.cos(orbit)*dist);look=new THREE.Vector3(player.x,player.y+1.15,player.z);camera.fov=portrait?54:50;
    }else if(!desiredPos){
      const portrait=innerHeight>innerWidth;const speed=Math.hypot(player.vx,player.vz);
      if((player.vehicle||player.boating)&&!input.cameraDrag){const heading=player.vehicle?player.car.heading:player.boat.heading;cameraYaw=lerpAngle(cameraYaw,Math.PI-heading,Math.min(1,dt*3.2));}
      const speedKick=clamp(Math.abs(player.vehicle?player.car.speed:speed)/9,0,1.6),pitch=clamp(cameraPitch,-.55,1.35);
      const dist=clamp((portrait?12.5:10.2)+(player.vehicle?3.4:player.boating?2.2:0)+speedKick*1.6+cameraZoom,5.3,27);
      const normalized=(pitch+.55)/1.9,height=clamp((portrait?2.35:1.75)+normalized*(portrait?11.8:10.4)+(player.vehicle?.55:player.boating?.32:0)+cameraZoom*.12,1.35,15.8);
      const forwardLook=lerp(7.0,1.6,normalized),visualHeight=1.35*playerScaleValue()*(player.crouched?.72:1)+(player.swimming?-.2:0);
      desiredPos=new THREE.Vector3(player.x-Math.sin(cameraYaw)*dist,player.y+height,player.z+Math.cos(cameraYaw)*dist);look=new THREE.Vector3(player.x+Math.sin(cameraYaw)*forwardLook,player.y+visualHeight+lerp(.9,-.25,normalized),player.z-Math.cos(cameraYaw)*forwardLook);
      camera.fov=(portrait?55:58)+speedKick*(player.vehicle?7:player.boating?4:2)+lerp(4,-2,normalized);
    }
    const t=1-Math.exp(-dt*7.5);camera.position.lerp(desiredPos,t);camera.lookAt(look);camera.updateProjectionMatrix();
  }

  function nearestInteractable(){
    if(world.workshopInspectionCamera?.active)return{id:'workshop-inspection-exit',type:'workshop',icon:'🎥',label:'Sair da inspeção 3D',actionLabel:'Sair',radius:999,priority:5000,action:()=>typeof workshopStopInspectionCamera==='function'?workshopStopInspectionCamera(true):false};
    if(activeRace)return null;
    if(player.transit.mode==='metro')return null;
    if(player.transit.mode==='bus')return{id:'request-bus-stop',type:'bus',icon:'🔔',label:player.transit.requestStop?'Parada já solicitada':'Pedir próxima parada',radius:999,priority:999,action:()=>{player.transit.requestStop=true;updateTransitPanel();toast('Parada solicitada.','good',1200);}};
    if(player.boating){const free=!player.boat.passengerOf&&!player.boat.passengerUid&&!player.boat.passengerBotId,remote=free?nearestRemotePlayer():null,npc=free?nearestBoardableNpc():null;if(remote)return{id:`boat-remote-${remote.uid}`,type:'remote-player',icon:'🌐',label:`Convidar ${remote.ghost.userData.displayName||'Jogador'} para o barco`,radius:999,priority:1001,action:()=>openRemotePlayerActions(remote.uid,remote.ghost)};if(npc)return{id:`boat-invite-${npc.id}`,type:'boat',icon:'🛶',label:`Convidar ${npc.name} para o barco`,radius:999,priority:1000,action:()=>boardNpcPassenger(npc,'boat')};return{id:'exit-boat',type:'boat',icon:'🛶',label:'Sair do barco no píer',radius:999,priority:999,action:exitBoat};}
    if(player.vehicle)return{id:'exit-vehicle',type:'vehicle',icon:'🚗',label:'Sair do carro',actionLabel:'Sair',radius:999,priority:999,action:exitVehicle};
    if(buildMode)return{id:'place-build',type:'build',icon:'🧱',label:`Confirmar ${BUILD_RECIPES[buildMode]?.name||'construção'}`,radius:999,priority:999,action:placeBuild};
    const remote=nearestRemotePlayer();if(remote)return{id:`remote-${remote.uid}`,type:'remote-player',icon:'🌐',label:`Interagir: ${remote.ghost.userData.displayName||'Jogador'}`,radius:2.8,priority:980,x:remote.ghost.position.x,z:remote.ghost.position.z,action:()=>openRemotePlayerActions(remote.uid,remote.ghost)};
    let nearest=null,best=Infinity;
    for(const it of world.interactables){
      if(!isInteractionAvailable(it))continue;
      const pos=worldPos(it),d=Math.hypot(player.x-pos.x,player.z-pos.z);
      if(d>(it.radius||2))continue;
      const score=d-(it.priority||0)*.006;
      if(score<best){best=score;nearest=it;}
    }
    return nearest;
  }
  function nearestVehicleContextInteractable(){
    if(!player.vehicle||player.car.passengerOf)return null;let nearest=null,best=Infinity;for(const it of world.interactables){if(!it.vehicleOnly||!isInteractionAvailable(it))continue;const pos=worldPos(it),distance=Math.hypot(player.x-pos.x,player.z-pos.z);if(distance>(it.radius||2))continue;const score=distance-(it.priority||0)*.006;if(score<best){best=score;nearest=it;}}return nearest;
  }
  function updateVehicleContextButton(){
    const button=els.vehicleActionBtn,target=nearestVehicleContextInteractable();currentVehicleContext=target;if(!button)return target;const available=!!target;button.hidden=!available;button.classList.toggle('is-available',available);button.classList.toggle('pulse',available);if(!available)return null;const label=typeof target.getActionLabel==='function'?target.getActionLabel():(target.actionLabel||'Ação'),icon=$('b',button),span=$('span',button);if(icon)icon.textContent=target.icon||'✋';if(span)span.textContent=label;button.setAttribute('aria-label',`${label}: ${typeof target.getLabel==='function'?target.getLabel():target.label||'ação veicular'}`);return target;
  }
  function doVehicleContextAction(){
    if(paused||!els.modal.hidden||!player.vehicle||player.car.passengerOf)return false;let target=currentVehicleContext;if(target){const pos=worldPos(target);if(!isInteractionAvailable(target)||Math.hypot(player.x-pos.x,player.z-pos.z)>(target.radius||2)+.25)target=null;}if(!target)target=nearestVehicleContextInteractable();if(!target){updateVehicleContextButton();return false;}target.action();updateContext(true);return true;
  }
  function updateContext(force=false){
    const now=performance.now(),moved=Math.hypot(player.x-lastContextScanX,player.z-lastContextScanZ);if(!force&&now-lastContextScanAt<85&&moved<.18)return;lastContextScanAt=now;lastContextScanX=player.x;lastContextScanZ=player.z;
    if(typeof syncSportControlsV705==='function'&&syncSportControlsV705()){currentContext=null;currentVehicleContext=null;lastContextId=`sport:${document.body.dataset.sportControls||''}`;els.actionBtn.classList.remove('pulse');els.contextPrompt.hidden=true;if(els.vehicleActionBtn){els.vehicleActionBtn.hidden=true;els.vehicleActionBtn.classList.remove('is-available','pulse');}return;}
    if(player.vehicle){const vehicleTarget=updateVehicleContextButton(),vehicleLabel=vehicleTarget?(typeof vehicleTarget.getLabel==='function'?vehicleTarget.getLabel():vehicleTarget.label):'',vehicleAction=vehicleTarget?(typeof vehicleTarget.getActionLabel==='function'?vehicleTarget.getActionLabel():(vehicleTarget.actionLabel||'Ação')):'';currentContext={id:'exit-vehicle',type:'vehicle',icon:'🚗',label:'Sair do carro',actionLabel:'Sair',radius:999,action:exitVehicle};lastContextId=`exit-vehicle:${vehicleTarget?.id||''}:${vehicleAction}`;els.actionBtn.classList.remove('pulse');const span=$('span',els.actionBtn),icon=$('b',els.actionBtn);if(span)span.textContent='Sair';if(icon)icon.textContent='🚗';els.contextPrompt.hidden=!vehicleTarget;els.contextIcon.textContent=vehicleTarget?.icon||'🚗';els.contextLabel.textContent=vehicleLabel||'Ação veicular';els.contextHint.textContent=vehicleTarget?`Use o botão extra: ${String(vehicleAction).toUpperCase()}`:'O botão SAIR permanece disponível';return;}
    if(els.vehicleActionBtn){els.vehicleActionBtn.hidden=true;els.vehicleActionBtn.classList.remove('is-available','pulse');currentVehicleContext=null;}
    const next=nearestInteractable(),label=next?(typeof next.getLabel==='function'?next.getLabel():next.label):'Atacar',actionLabel=next?(typeof next.getActionLabel==='function'?next.getActionLabel():(next.actionLabel||'Ação')):'Espada',id=`${next?.id||''}:${label}:${actionLabel}`;if(!force&&id===lastContextId)return;lastContextId=id;currentContext=next;els.contextPrompt.hidden=!next;els.actionBtn.classList.toggle('pulse',!!next);els.contextIcon.textContent=next?.icon||'⚔';els.contextLabel.textContent=label;els.contextHint.textContent=next?`Toque em ${String(actionLabel).toUpperCase()}`:'Ataque próximo';const span=$('span',els.actionBtn);const icon=$('b',els.actionBtn);if(span)span.textContent=actionLabel;if(icon)icon.textContent=next?.icon||'⚔';
  }
  function doAction(){
    if(paused||!els.modal.hidden||performance.now()<actionLockedUntil)return;
    actionLockedUntil=performance.now()+90;state.stats.actions++;
    if(state.ui.quickOpen){state.ui.quickOpen=false;syncMobilePanels();}
    if(typeof handleActiveSportActionV704==='function'&&handleActiveSportActionV704()){updateContext(true);return;}
    if(player.vehicle){exitVehicle();updateContext(true);return;}if(player.boating){exitBoat();updateContext(true);return;}
    if(typeof performPoliceCheckpointAction==='function'&&performPoliceCheckpointAction()){updateContext(true);return;}
    let target=currentContext;
    if(target&&target.radius!==999){const pos=worldPos(target);if(!isInteractionAvailable(target)||Math.hypot(player.x-pos.x,player.z-pos.z)>(target.radius||2)+.2)target=null;}
    if(!target)target=nearestInteractable();
    currentContext=target;lastActionSource=target?.id||'melee';
    if(target){target.action();updateContext(true);return;}
    meleeAttack();
  }

  function updateNeeds(dt){
    updateNeeds.acc=(updateNeeds.acc||0)+dt;if(updateNeeds.acc<1)return;const sec=updateNeeds.acc;updateNeeds.acc=0;state.needs.hunger=clamp(state.needs.hunger-sec*.065,0,100);state.needs.energy=clamp(state.needs.energy-sec*((player.vehicle||player.boating)?(sprintRequested()?.085:.035):(input.isSprinting?.16:.045)),0,100);state.needs.fun=clamp(state.needs.fun-sec*.025,0,100);state.needs.hygiene=clamp(state.needs.hygiene-sec*.028,0,100);if(state.needs.hunger<8&&Math.random()<.08)toast(`${playerDisplayName()} está com fome.`,'warn');updateHUD();if(!updateNeeds.lastSave||performance.now()-updateNeeds.lastSave>10000){updateNeeds.lastSave=performance.now();saveState();}
  }

  let localChannel=null,lastPublish=0,lastPublishSnapshot=null,lastPublishHeartbeat=0;

  let multiplayerState={mode:'solo',connected:false,count:0,room:normalizeRoomId(window.OTTHI_CONFIG?.defaultRoom),error:'',players:[]};const remotePresence=new Map();let pendingCloudCampfires={},pendingCloudExtensions={};
  const cloudHouses=new Map(),cloudChat=[],incomingChallenges=new Map(),incomingSocialRequests=new Map(),gameSessions=new Map(),shownChallengeToasts=new Set(),shownSocialToasts=new Set(),shownGameResults=new Set();let activeMultiplayerGameId='',promptChallengeId='',promptSessionId='',promptSocialRequestId='';
