/**
 * OTTHI World V700 — módulo-fonte
 * Arquivo: 37-hero-platform-gameplay.js
 * Escopo: Etapa 5, poderes originais, plataforma, portais e desafio profissional
 */
// @otthi-module-body
  const OTTHI_WORLD_HERO_POWERS=Object.freeze({
    energyPulse:Object.freeze({id:'energyPulse',icon:'⚡',name:'Pulso de energia',cost:22,cooldown:1600,description:'Onda circular que afasta e acerta inimigos próximos.'}),
    velocityDash:Object.freeze({id:'velocityDash',icon:'➤',name:'Impulso veloz',cost:18,cooldown:1300,description:'Avanço rápido na direção atual, com proteção curta.'}),
    guardianShield:Object.freeze({id:'guardianShield',icon:'🛡',name:'Escudo guardião',cost:25,cooldown:6500,description:'Proteção temporária contra monstros e perigos.'}),
    skyLeap:Object.freeze({id:'skyLeap',icon:'⬆',name:'Salto celeste',cost:28,cooldown:2600,description:'Super salto para plataformas e áreas verticais.'}),
    magnetWave:Object.freeze({id:'magnetWave',icon:'◎',name:'Onda magnética',cost:30,cooldown:3600,description:'Atrai cristais e enfraquece monstros ao redor.'})
  });
  function worldHeroState(){ensureOtthiWorldState();return state.adventures.hero;}
  function heroPowerUnlocked(id){return worldHeroState().unlocked.includes(id);}
  function heroPowerReady(power){const hero=worldHeroState();return performance.now()-Number(hero.lastUse||0)>=power.cooldown&&hero.energy>=power.cost;}
  function createHeroPulseVisual(color=0x5de6ff,radius=5){
    if(!worldGroup)return;const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}),ring=new THREE.Mesh(new THREE.RingGeometry(.3,.52,32),material);ring.rotation.x=-Math.PI/2;ring.position.set(player.x,player.y+.08,player.z);worldGroup.add(ring);const start=performance.now();const animate=()=>{const t=clamp((performance.now()-start)/480,0,1);ring.scale.setScalar(1+t*radius*2.2);material.opacity=.8*(1-t);if(t<1)requestAnimationFrame(animate);else{worldGroup?.remove(ring);material.dispose();ring.geometry.dispose();}};animate();
  }
  function activateWorldHeroPower(id=worldHeroState().selectedPower){
    if(!running||paused||!els.modal.hidden||player.vehicle||player.boating||player.transit.mode||currentHouse){toast('Use os poderes do lado de fora e sem transporte.','warn',1800);return false;}const power=OTTHI_WORLD_HERO_POWERS[id];if(!power||!heroPowerUnlocked(id)){toast('Este poder ainda precisa ser desbloqueado no desafio OTTHI.','warn');return false;}const hero=worldHeroState();if(!heroPowerReady(power)){const wait=Math.max(0,Math.ceil((power.cooldown-(performance.now()-hero.lastUse))/1000));toast(hero.energy<power.cost?'Energia OTTHI recarregando.':`Aguarde ${wait}s para usar novamente.`,'warn',1300);return false;}
    hero.energy=clamp(hero.energy-power.cost,0,100);hero.lastUse=performance.now();hero.mastery[id]=Number(hero.mastery[id]||0)+1;
    if(id==='energyPulse'){
      createHeroPulseVisual(0x5de6ff,5.4);for(const enemy of world.enemies)if(!enemy.dead&&distance2D(player,enemy.group.position)<5.6){damageEnemy(enemy,1);const angle=Math.atan2(enemy.group.position.x-player.x,enemy.group.position.z-player.z);enemy.group.position.x+=Math.sin(angle)*1.8;enemy.group.position.z+=Math.cos(angle)*1.8;}beep(520,110,'sine');
    }else if(id==='velocityDash'){
      const speed=15;player.vx=Math.sin(player.facing)*speed;player.vz=Math.cos(player.facing)*speed;player.damageUntil=performance.now()+720;for(let i=0;i<7;i++)spawnDust(player.x-Math.sin(player.facing)*i*.24,player.z-Math.cos(player.facing)*i*.24);beep(760,80,'square');
    }else if(id==='guardianShield'){
      player.shieldUntil=performance.now()+8000;createHeroPulseVisual(0x75f08f,2.2);toast('Escudo guardião ativo por 8 segundos.','good',1800);beep(680,120,'sine');
    }else if(id==='skyLeap'){
      player.vy=Math.max(player.vy,13.2);player.grounded=false;player.damageUntil=performance.now()+900;createHeroPulseVisual(0xffd75e,2.4);beep(840,100,'sine');
    }else if(id==='magnetWave'){
      createHeroPulseVisual(0xb77bff,8);for(const crystal of world.crystals)if(!crystal.got&&Math.hypot(player.x-crystal.x,player.z-crystal.z)<9)collectCrystal(crystal);for(const enemy of world.enemies)if(!enemy.dead&&distance2D(player,enemy.group.position)<7.5)damageEnemy(enemy,1);beep(410,160,'triangle');
    }
    vibrate([24,28,34]);saveState();updateWorldHeroHud();return true;
  }
  function worldHeroPowerCards(){const hero=worldHeroState();return Object.values(OTTHI_WORLD_HERO_POWERS).map(power=>{const unlocked=heroPowerUnlocked(power.id),selected=hero.selectedPower===power.id;return`<button class="hero-power-card ${selected?'selected':''} ${unlocked?'':'locked'}" data-world-hero-power="${power.id}" ${unlocked?'':'disabled'}><span>${power.icon}</span><div><b>${power.name}</b><small>${power.description}</small><i>${unlocked?`${power.cost} energia`:'Bloqueado pelo desafio'}</i></div></button>`;}).join('');}
  function openWorldHeroCenter(){
    const hero=worldHeroState(),power=OTTHI_WORLD_HERO_POWERS[hero.selectedPower]||OTTHI_WORLD_HERO_POWERS.energyPulse;
    openModal('Poderes e aventuras OTTHI',`<div class="otthi-hero-header"><span>${power.icon}</span><div><b>${power.name}</b><small>Energia atual: ${Math.round(hero.energy)}%</small></div></div><div class="hero-power-grid">${worldHeroPowerCards()}</div><div class="choice-grid"><button class="choice" data-world-hero-use><b>⚡ Usar poder selecionado</b><span>Também disponível no botão flutuante durante o jogo</span></button><button class="choice" data-world-hero-challenge><b>🏁 Ir ao Circuito das Nuvens</b><span>Plataformas, cristais de energia e novos desbloqueios</span></button></div><div class="otthi-world-metrics"><span><b>${hero.challengeWins}</b> conclusões</span><span><b>${hero.challengeBest?hero.challengeBest.toFixed(1)+'s':'—'}</b> melhor tempo</span><span><b>${Object.values(hero.mastery).reduce((a,b)=>a+Number(b||0),0)}</b> poderes usados</span></div>`,root=>{
      $$('[data-world-hero-power]',root).forEach(button=>button.onclick=()=>{hero.selectedPower=button.dataset.worldHeroPower;saveState();openWorldHeroCenter();updateWorldHeroHud();});
      $('[data-world-hero-use]',root).onclick=()=>{closeModal();activateWorldHeroPower();};
      $('[data-world-hero-challenge]',root).onclick=()=>{closeModal();startWorldHeroChallenge();};
    });
  }
  function createHeroPlatform(x,y,z,w=3,d=3,color=0x365f92){const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);premiumBox(w,.42,d,color,0,y-.21,0,group,0x102238);premiumBox(w*.72,.12,d*.72,otthiWorldRuntime.materials.get('heroEnergy')||0x5de6ff,0,y+.05,0,group,0x0a4056);registerPlatform(x,z,w,d,y,{otthiHero:true});return group;}
  function createHeroToken(x,y,z,index){const material=new THREE.MeshStandardMaterial({map:loadWorldTexture('hero-energy','basecolor',{repeat:[1,1],color:true}),emissiveMap:loadWorldTexture('hero-energy','emissive',{repeat:[1,1]}),color:index%2?0xffd75e:0x5de6ff,emissive:index%2?0xa15c00:0x147fae,emissiveIntensity:.82,roughness:.18,metalness:.22}),mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.44,0),material);mesh.position.set(x,y,z);mesh.castShadow=true;worldGroup.add(mesh);return{id:`hero-token-${index}`,x,y,z,mesh,index,collected:false};}
  function createWorldHeroAdventure(){
    if(world.worldProfessional?.heroAdventure)return false;const root=new THREE.Group();root.name='OTTHI_WORLD_HERO_ADVENTURE';worldGroup.add(root);const start={x:-41,z:88,y:2.2},platforms=[[-41,2.2,88,5,5],[-34,3.5,91,3.4,3.4],[-27,4.8,87,3.2,3.2],[-20,6.2,92,3.2,3.2],[-12,7.6,88,3.4,3.4],[-4,9.1,93,3.6,3.6],[5,10.5,89,5.2,5.2]];for(const [x,y,z,w,d]of platforms)createHeroPlatform(x,y,z,w,d,y>8?0x7252aa:0x365f92);
    const tokens=platforms.slice(1).map(([x,y,z],index)=>createHeroToken(x,y+1.15,z,index));
    const portalMaterial=otthiWorldRuntime.materials.get('heroEnergy')||new THREE.MeshStandardMaterial({color:0x5de6ff,emissive:0x147fae,emissiveIntensity:.7,roughness:.2,transparent:true,opacity:.78}),portal=new THREE.Mesh(new THREE.TorusGeometry(1.45,.22,12,32),portalMaterial);portal.position.set(-41,1.75,84.5);portal.rotation.y=Math.PI/2;worldGroup.add(portal);addGlow(-41,1.8,84.5,0x5de6ff,7);
    const finish=new THREE.Group();finish.position.set(5,10.55,89);worldGroup.add(finish);for(const x of[-1.55,1.55])premiumBox(.22,3.2,.22,0xf5d75a,x,1.6,0,finish,0x3c2d0a);premiumBox(3.5,.3,.32,0xf5d75a,0,3.05,0,finish,0x3c2d0a);const banner=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.72),new THREE.MeshStandardMaterial({map:signTexture('OTTHI HERO','#163b62','#ffffff'),side:THREE.DoubleSide,roughness:.5}));banner.position.set(0,2.75,.18);finish.add(banner);
    registerInteractable({id:'otthi-hero-portal',type:'adventure',icon:'⚡',label:'Entrar no Circuito das Nuvens',x:-41,z:84.5,radius:3,priority:248,action:startWorldHeroChallenge});
    world.worldProfessional={...(world.worldProfessional||{}),heroAdventure:{root,portal,platforms,tokens,start,finish,active:false,startedAt:0,collected:0,lastCheckpoint:start}};otthiWorldRuntime.stats.adventureObjects=platforms.length+tokens.length+2;otthiWorldRuntime.adventureReady=true;return true;
  }
  function resetWorldHeroTokens(){const challenge=world.worldProfessional?.heroAdventure;if(!challenge)return;challenge.collected=0;for(const token of challenge.tokens){token.collected=false;token.mesh.visible=true;}}
  function startWorldHeroChallenge(){
    const challenge=world.worldProfessional?.heroAdventure;if(!challenge){toast('O circuito ainda está sendo preparado.','warn');return false;}if(player.vehicle)exitVehicle(true);if(player.boating)exitBoat(true);if(currentHouse)exitHouse();resetWorldHeroTokens();challenge.active=true;challenge.startedAt=performance.now();challenge.lastCheckpoint=challenge.start;player.x=challenge.start.x;player.z=challenge.start.z;player.y=challenge.start.y+.2;player.vx=player.vz=player.vy=0;player.grounded=true;cameraYaw=Math.PI/2;worldHeroState().energy=100;state.waypoint={id:'otthi-hero-finish',name:'Final do Circuito das Nuvens',x:5,z:89,navX:5,navZ:89,arrived:false};updateWaypointMarker();toast('Circuito iniciado: colete os 6 cristais e alcance o portal final.','good',3000);return true;
  }
  function completeWorldHeroChallenge(){const challenge=world.worldProfessional?.heroAdventure;if(!challenge?.active)return;challenge.active=false;const seconds=(performance.now()-challenge.startedAt)/1000,hero=worldHeroState();hero.challengeWins++;hero.challengeBest=hero.challengeBest?Math.min(hero.challengeBest,seconds):seconds;for(const id of['skyLeap','magnetWave'])if(!hero.unlocked.includes(id))hero.unlocked.push(id);hero.energy=100;addXP(180);addCoins(140);awardMedal('Herói do Circuito OTTHI');setFlag('otthiWorldHeroChallenge');state.waypoint=null;updateWaypointMarker();saveState(true).finally(()=>syncCloudProgress(true));toast(`Circuito concluído em ${seconds.toFixed(1)}s! Novos poderes desbloqueados.`, 'good',4200);updateWorldHeroHud();}
  function updateWorldHeroAdventure(dt){
    const hero=worldHeroState(),challenge=world.worldProfessional?.heroAdventure;hero.energy=clamp(hero.energy+dt*(challenge?.active?5.2:8.5),0,100);if(challenge){challenge.portal.rotation.z+=dt*.65;for(const token of challenge.tokens){if(token.collected)continue;token.mesh.rotation.y+=dt*2.2;token.mesh.position.y=token.y+Math.sin(animTime*2.4+token.index)*.16;if(challenge.active&&Math.hypot(player.x-token.x,player.z-token.z)<1.15&&Math.abs(player.y-token.mesh.position.y)<2){token.collected=true;token.mesh.visible=false;challenge.collected++;challenge.lastCheckpoint={x:token.x,y:Math.max(groundHeightAt(token.x,token.z),token.y-1),z:token.z};hero.energy=clamp(hero.energy+18,0,100);addXP(15);beep(920,70,'sine');toast(`Cristal de energia ${challenge.collected}/${challenge.tokens.length}`,'good',1100);}}
      if(challenge.active&&challenge.collected===challenge.tokens.length&&Math.hypot(player.x-5,player.z-89)<2.4&&player.y>8)completeWorldHeroChallenge();
      if(challenge.active&&player.y<-.5){const safe=challenge.lastCheckpoint||challenge.start;player.x=safe.x;player.z=safe.z;player.y=safe.y+.35;player.vx=player.vz=player.vy=0;player.grounded=true;toast('Retorno ao último cristal do circuito.','warn',1300);}
    }
    updateWorldHeroHud();
  }
  function ensureWorldHeroHud(){
    if(document.getElementById('worldHeroBtn'))return;const button=document.createElement('button');button.id='worldHeroBtn';button.className='world-hero-action';button.type='button';button.setAttribute('aria-label','Usar poder OTTHI');button.innerHTML='<b data-world-hero-icon>⚡</b><span data-world-hero-energy>100</span>';button.onclick=()=>activateWorldHeroPower();document.getElementById('game')?.appendChild(button);
  }
  function updateWorldHeroHud(){const button=document.getElementById('worldHeroBtn');if(!button)return;const hero=worldHeroState(),power=OTTHI_WORLD_HERO_POWERS[hero.selectedPower]||OTTHI_WORLD_HERO_POWERS.energyPulse;button.querySelector('[data-world-hero-icon]').textContent=power.icon;button.querySelector('[data-world-hero-energy]').textContent=Math.round(hero.energy);button.disabled=hero.energy<power.cost;button.title=`${power.name} • ${Math.round(hero.energy)}%`;}
