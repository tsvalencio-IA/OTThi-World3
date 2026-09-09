/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 06-missions-profile-hud-inventory-tools.js
 * Escopo: Missões, objetivos, perfil, HUD, inventário e ferramentas
 * Linhas de origem V642: 928-1063
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function deriveMissionFlags() {
    const friendCount = Object.values(state.friendship).filter(v => v > 0).length;
    state.flags.metNeighbors = friendCount >= 3;
    state.flags.hasMaterials = state.inventory.wood >= 3 && state.inventory.stone >= 2;
    state.flags.builtThree = state.builds.length >= 3;
    state.flags.fiveCrystals = state.inventory.crystals >= 5;
    state.flags.threeEnemies = state.defeated >= 3;
    state.flags.rep50 = state.profile.reputation >= 50;
    state.flags.friend10 = Object.values(state.friendship).some(v => v >= 10);
    state.flags.completedJob = (state.career?.completed || 0) > 0;
    state.flags.decoratedHome = state.builds.some(b => Math.hypot((b.x||0), (b.z||0)-18) < 12);
  }
  function evaluateMissions() {
    deriveMissionFlags();
    for (const chapter of missionChapters) {
      const complete = chapter.steps.every(([flag]) => !!state.flags[flag]);
      if (complete && !state.completedChapters.includes(chapter.id)) {
        state.completedChapters.push(chapter.id);
        addCoins(chapter.reward.coins);
        awardMedal(chapter.reward.medal);
        toast(`Capítulo concluído: ${chapter.title}`, 'good', 2600);
      }
    }
    const pinned=missionChapters.find(c=>c.id===state.objectives?.pinnedChapterId&&!c.steps.every(([flag])=>!!state.flags[flag]));
    if(state.objectives?.pinnedChapterId&&!pinned)state.objectives.pinnedChapterId='';
    const chapter=pinned||missionChapters.find(c=>!c.steps.every(([flag])=>!!state.flags[flag]))||missionChapters[missionChapters.length-1];
    const nextIndex=chapter.steps.findIndex(([flag])=>!state.flags[flag]);
    activeMission={chapter,stepIndex:nextIndex<0?chapter.steps.length:nextIndex};
    updateMissionHUD();
  }
  function updateMissionHUD() {
    const coop=typeof coopMissionProgressLabel==='function'?coopMissionProgressLabel():null;if(coop){els.missionChapter.textContent='MISSÃO COOPERATIVA';els.missionTitle.textContent=coop.title;els.missionStep.textContent=coop.label;els.missionFill.style.width=`${coop.percent}%`;els.missionCard.title='Toque para abrir os detalhes da missão cooperativa';els.missionCard.setAttribute('aria-label',`Abrir missão cooperativa. ${coop.label}`);return;}
    const job = state.career?.activeJob;
    if (job) {
      const progress = activeJobProgress(job);
      els.missionChapter.textContent = 'TRABALHO ATIVO';
      els.missionTitle.textContent = `${job.icon || '💼'} ${job.title}`;
      els.missionStep.textContent = progress.label;
      els.missionFill.style.width = `${progress.percent}%`;
      els.missionCard.title = `Toque para abrir a missão: ${job.title}`;els.missionCard.setAttribute('aria-label',`Abrir detalhes da missão ${job.title}. ${progress.label}`);
      return;
    }
    if (!activeMission) return;
    const { chapter, stepIndex } = activeMission;
    els.missionChapter.textContent = chapter.chapter;
    els.missionTitle.textContent = chapter.title;
    els.missionStep.textContent = stepIndex < chapter.steps.length ? playerText(chapter.steps[stepIndex][1]) : 'Capítulo concluído!';
    els.missionFill.style.width = `${Math.round((Math.min(stepIndex, chapter.steps.length) / chapter.steps.length) * 100)}%`;
  }


  function objectiveStatusLabel(flag){return state.flags[flag]?'Concluído':'Pendente';}
  function skillMasterySummary(){const names={miniDash:'Dash Mini',superJump:'Super Pulo',giantSlam:'Impacto Gigante',stealth:'Escudo Furtivo',magnetSpin:'Giro Ímã'},mastery=state.abilities?.mastery||{};return Object.entries(names).map(([id,name])=>`<div class="skill-mastery"><b>${name}</b><span>Nível ${Number(mastery[id]||0)}</span></div>`).join('');}
  function pinChapter(chapterId){state.objectives.pinnedChapterId=chapterId||'';saveState(true);evaluateMissions();updateMissionHUD();toast(chapterId?'Objetivo destacado no HUD.':'Objetivo automático restaurado.','good',1300);}
  function openObjectivesPanel(){
    deriveMissionFlags();const coop=typeof activeCoopMission==='function'?activeCoopMission():null,job=state.career?.activeJob,progress=job?activeJobProgress(job):null;
    const chapters=missionChapters.map(ch=>{const done=ch.steps.filter(([f])=>!!state.flags[f]).length,complete=done===ch.steps.length,pinned=state.objectives.pinnedChapterId===ch.id;return `<article class="objective-chapter ${complete?'complete':''} ${pinned?'pinned':''}"><header><b>${complete?'✅':'◆'} ${ch.title}</b><span>${done}/${ch.steps.length}</span></header>${ch.steps.map(([f,t])=>`<p class="${state.flags[f]?'done':''}">${state.flags[f]?'✓':'○'} ${playerText(t)}</p>`).join('')}<button class="btn objective-pin" data-pin-chapter="${ch.id}" ${complete?'disabled':''}>${pinned?'Destacado':'Destacar objetivo'}</button></article>`;}).join('');
    openModal('Objetivos, missões e skills',`${coop?`<section class="active-objective">${coopMissionBriefingMarkup()}<div class="modal-actions"><button class="btn primary" data-open-coop-center>Abrir missão cooperativa</button><button class="btn" data-objective-map>Abrir mapa completo</button><button class="btn danger" data-leave-coop>Sair da missão</button></div></section>`:job?`<section class="active-objective">${missionBriefingMarkup(job)}<div class="modal-actions"><button class="btn primary" data-objective-continue>Marcar próximo passo no GPS</button><button class="btn" data-objective-map>Abrir mapa completo</button><button class="btn" data-objective-jobs>Central de trabalhos</button><button class="btn danger" data-objective-cancel>Cancelar missão</button></div></section>`:`<section class="active-objective"><small>PRÓXIMO OBJETIVO</small><h3>${activeMission?.chapter?.title||'Explore a Vila'}</h3><p>${activeMission&&activeMission.stepIndex<activeMission.chapter.steps.length?playerText(activeMission.chapter.steps[activeMission.stepIndex][1]):'Escolha uma profissão ou atividade.'}</p><div class="modal-actions"><button class="btn primary" data-objective-jobs>Escolher trabalho</button><button class="btn" data-objective-map>Abrir mapa</button></div></section>`}<h3 class="panel-subtitle">Progressão das skills</h3><div class="skill-mastery-grid">${skillMasterySummary()}</div><h3 class="panel-subtitle">Capítulos do mundo</h3><div class="objective-list">${chapters}</div>`,root=>{
      $('[data-open-coop-center]',root)?.addEventListener('click',openCoopMissionCenter);$('[data-leave-coop]',root)?.addEventListener('click',leaveActiveCoopMission);$('[data-objective-continue]',root)?.addEventListener('click',focusActiveJob);$('[data-objective-map]',root)?.addEventListener('click',()=>{focusActiveJob();setTimeout(openMap,0);});$('[data-objective-jobs]',root)?.addEventListener('click',openJobCenter);$('[data-objective-cancel]',root)?.addEventListener('click',cancelActiveJob);$$('[data-pin-chapter]',root).forEach(btn=>btn.onclick=()=>{pinChapter(btn.dataset.pinChapter);openObjectivesPanel();});
    });
  }

  function sanitizePlayerName(value){return String(value||'').replace(/[^\p{L}\p{N} _.-]/gu,'').replace(/\s+/g,' ').trim().slice(0,18);}
  function hasValidPlayerName(){const name=sanitizePlayerName(state.profile.name);return !!(state.profile.nameConfirmed&&name.length>=3);}
  function playerDisplayName(){return hasValidPlayerName()?sanitizePlayerName(state.profile.name):'Jogador';}
  function playerText(value=''){return String(value).replaceAll('Casa do Otthos',`Casa de ${playerDisplayName()}`).replaceAll('do Otthos',`de ${playerDisplayName()}`).replaceAll('o Otthos',playerDisplayName()).replaceAll('Otthos',playerDisplayName());}
  function updatePlayerNameUI(){const name=hasValidPlayerName()?state.profile.name:'Escolher nome';if(els.lobbyPlayerName)els.lobbyPlayerName.textContent=name;if(els.hudPlayerName)els.hudPlayerName.textContent=hasValidPlayerName()?state.profile.name:'Jogador';if(els.accountStatusLabel)els.accountStatusLabel.textContent=accountStatusText();const menu=$('#avatarMenuName'),quick=$('#avatarQuickName');if(menu)menu.textContent=`Meu ${playerDisplayName()}`;if(quick)quick.textContent=playerDisplayName();const homeLoc=MAP_LOCATIONS?.find?.(x=>x.id==='home');if(homeLoc)homeLoc.name=`Casa de ${playerDisplayName()}`;const homeHouse=world?.houses?.find?.(x=>x.id==='home');if(homeHouse)homeHouse.name=`Casa de ${playerDisplayName()}`;updateLocalPlayerNameLabel?.();}
  function applyPlayerName(name){const clean=sanitizePlayerName(name);if(clean.length<3){toast('Digite um apelido com pelo menos 3 caracteres.','warn',2200);return false;}state.profile.name=clean;state.profile.nameConfirmed=true;state.multiplayer.displayName=clean;updatePlayerNameUI();saveState(true);const publicName=publicPlayerName(clean);window.OTTHOS_RTDB?.setDisplayName?.(publicName);if(running)window.OTTHOS_RTDB?.publish?.({name:publicName,x:player.x,y:player.y,z:player.z,r:player.facing,vehicle:!!player.vehicle,vehicleId:player.car.id||'',vehicleRole:player.vehicle?(player.car.passengerOf?'passenger':'driver'):'',vehiclePassengerOf:player.car.passengerOf||'',vehiclePassengerUid:player.car.passengerUid||'',vehiclePassengerBotId:player.car.passengerBotId||'',boating:!!player.boating,boatId:state.boats.activeBoatId||'',boatRole:player.boating?(player.boat.passengerOf?'passenger':'driver'):'',passengerOf:player.boat.passengerOf||'',boatPassengerUid:player.boat.passengerUid||'',boatPassengerBotId:player.boat.passengerBotId||'',scaleMode:player.scaleMode,crouched:!!player.crouched,color:0x5ad8ff},true);return true;}
  function openPlayerNameModal(required=false,onSaved=null){
    const current=hasValidPlayerName()?state.profile.name:'';
    openModal(required?'Escolha seu nome de jogador':'Nome do jogador',`<div class="player-name-modal"><div class="player-name-icon">👤</div><p>${required?'Antes de entrar, escolha o nome que aparecerá para os outros jogadores.':'Este nome aparece sobre seu personagem no multiplayer.'}</p><label class="field"><span>Nome público</span><input id="playerNameInput" maxlength="18" autocomplete="nickname" inputmode="text" value="${current.replace(/"/g,'&quot;')}" placeholder="Ex.: Thiago"></label><small>De 3 a 18 caracteres. Não use telefone, endereço ou informação pessoal sensível.</small><button class="btn primary xl" data-save-player-name>Salvar nome</button></div>`,root=>{const input=$('#playerNameInput',root),save=$('[data-save-player-name]',root);setTimeout(()=>input?.focus(),80);const submit=()=>{if(!applyPlayerName(input?.value))return;closeModal();toast(`Nome definido: ${state.profile.name}`,'good',1600);if(typeof onSaved==='function')onSaved();};save.onclick=submit;input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});});
  }

  function updateLobbyStats() {
    updatePlayerNameUI();
    els.lobbyLevel.textContent = state.profile.level;
    els.lobbyCoins.textContent = state.profile.coins;
    els.lobbyRep.textContent = state.profile.reputation;
    els.lobbyMedals.textContent = state.medals.length;
  }
  function updateHUD() {
    updatePlayerNameUI();
    els.hudLevel.textContent = state.profile.level;
    const xpBase = (state.profile.level - 1) * 1000;
    const xpInLevel = state.profile.xp - xpBase;
    els.xpFill.style.width = `${clamp(xpInLevel / 1000 * 100, 0, 100)}%`;
    els.xpText.textContent = `${xpInLevel} / 1000`;
    els.hudCoins.textContent = state.profile.coins;
    const needs = [['hunger', els.needHunger], ['energy', els.needEnergy], ['fun', els.needFun], ['hygiene', els.needHygiene]];
    needs.forEach(([key, el]) => el.style.width = `${clamp(state.needs[key], 0, 100)}%`);
    const lowest = Math.min(...Object.values(state.needs));
    if (els.needsToggleBtn) { els.needsToggleBtn.textContent = lowest < 20 ? '⚠️' : lowest < 50 ? '💛' : '❤️'; els.needsToggleBtn.classList.toggle('warning', lowest < 35); }
    updateMissionHUD();
  }

  function openInventory() {
    const inv = state.inventory;
    openModal('Inventário', `<div class="inventory-grid">
      <div class="inventory-item"><b>🪵 ${inv.wood}</b><span>Madeira</span></div><div class="inventory-item"><b>🪨 ${inv.stone}</b><span>Pedra</span></div><div class="inventory-item"><b>🟨 ${inv.goldOre||0}</b><span>Minério de ouro</span></div><div class="inventory-item"><b>🏅 ${inv.goldBar||0}</b><span>Barra de ouro</span></div><div class="inventory-item"><b>🍎 ${inv.food}</b><span>Comida</span></div><div class="inventory-item"><b>💧 ${inv.water}</b><span>Água</span></div><div class="inventory-item"><b>💎 ${inv.crystals}</b><span>Cristais</span></div><div class="inventory-item"><b>🧱 ${inv.blocks}</b><span>Blocos</span></div><div class="inventory-item"><b>🪵 ${inv.fences}</b><span>Cercas</span></div><div class="inventory-item"><b>🪙 ${state.profile.coins}</b><span>Moedas</span></div>
      <div class="inventory-item"><b>🎣 ${inv.fishingRod||0}</b><span>Vara de pesca</span></div><div class="inventory-item"><b>🪱 ${inv.bait||0}</b><span>Iscas</span></div><div class="inventory-item"><b>🌱 ${inv.seeds||0}</b><span>Sementes</span></div><div class="inventory-item"><b>🌾 ${inv.wheat||0}</b><span>Trigo</span></div><div class="inventory-item"><b>🥕 ${inv.carrots||0}</b><span>Cenouras</span></div><div class="inventory-item"><b>🟫 ${inv.clay||0}</b><span>Argila</span></div><div class="inventory-item"><b>🐟 ${inv.rawFish||0}</b><span>Peixe cru</span></div><div class="inventory-item"><b>🍽️ ${inv.cookedFish||0}</b><span>Peixe assado</span></div><div class="inventory-item"><b>🌿 ${inv.forestResources||0}</b><span>Recursos da floresta</span></div>
    </div><div class="modal-actions"><button class="btn primary" data-open-tools>Ferramentas</button>${inv.cookedFish>0?'<button class="btn" data-eat-cooked>Comer peixe assado</button>':''}</div>`,root=>{$('[data-open-tools]',root)?.addEventListener('click',openToolbelt);$('[data-eat-cooked]',root)?.addEventListener('click',()=>{if((state.inventory.cookedFish||0)<1)return;state.inventory.cookedFish--;state.needs.hunger=clamp(state.needs.hunger+32,0,100);state.needs.energy=clamp(state.needs.energy+6,0,100);saveState(true);updateHUD();toast('Peixe assado consumido.','good');openInventory();});});
  }

  const TOOL_DEFS={
    axe:{icon:'🪓',name:'Machado',description:'Corta árvores e coleta madeira.'},
    pickaxe:{icon:'⛏️',name:'Picareta',description:'Extrai pedra e minério de ouro.'},
    bucket:{icon:'🪣',name:'Balde',description:'Retira água limpa do poço.'},
    hoe:{icon:'🧑‍🌾',name:'Enxada',description:'Prepara a terra, planta e procura iscas.'},
    shovel:{icon:'🪏',name:'Pá',description:'Escava terra, areia, argila e iscas.'}
  };
  function equippedTool(){return TOOL_DEFS[state.tools?.equipped]||TOOL_DEFS.axe;}
  function equipTool(id){
    if(!TOOL_DEFS[id]||!state.tools.owned.includes(id))return false;state.tools.equipped=id;saveState(true);refreshEquippedToolVisual();if(els.toolsBtn){els.toolsBtn.firstChild.textContent=TOOL_DEFS[id].icon;$('span',els.toolsBtn).textContent=TOOL_DEFS[id].name;}toast(`${TOOL_DEFS[id].name} equipado.`,'good',1200);return true;
  }
  function openToolbelt(){
    openModal('Ferramentas',`<div class="tool-grid">${Object.entries(TOOL_DEFS).map(([id,tool])=>`<button class="tool-card ${state.tools.equipped===id?'active':''}" data-equip-tool="${id}"><span>${tool.icon}</span><b>${tool.name}</b><small>${tool.description}</small><em>${state.tools.equipped===id?'Em uso':'Equipar'}</em></button>`).join('')}</div><div class="resource-summary"><span>🪵 ${state.tools.harvested.wood||0}</span><span>🪨 ${state.tools.harvested.stone||0}</span><span>🟨 ${state.tools.harvested.gold||0}</span><span>💧 ${state.tools.harvested.water||0}</span><span>🪱 ${state.tools.harvested.bait||0}</span><span>🌾 ${state.tools.harvested.crops||0}</span><span>🟫 ${state.tools.harvested.clay||0}</span></div>`,root=>{$$('[data-equip-tool]',root).forEach(btn=>btn.onclick=()=>{equipTool(btn.dataset.equipTool);closeModal();});});
  }
  function refreshEquippedToolVisual(){
    if(!playerModel?.userData?.parts?.rightArm)return;
    const arm=playerModel.userData.parts.rightArm;if(toolVisual){arm.remove(toolVisual);toolVisual=null;}
    toolVisual=new THREE.Group();toolVisual.position.set(0,-1.12,.14);toolVisual.rotation.z=-.18;arm.add(toolVisual);
    const type=state.tools?.equipped||'axe',wood=materials.wood||0x8c542c,metal=materials.metal||0x8d9aa6;
    if(type==='bucket'){
      const bucket=new THREE.Mesh(new THREE.CylinderGeometry(.24,.18,.38,10,1,true),metal);bucket.position.y=-.16;toolVisual.add(bucket);const handle=new THREE.Mesh(new THREE.TorusGeometry(.24,.025,6,12,Math.PI),renderMat(0x53606c,{metalness:.5,roughness:.35}));handle.position.y=.05;handle.rotation.z=Math.PI;toolVisual.add(handle);
    }else{
      box(.11,.92,.11,wood,0,-.16,0,toolVisual);
      if(type==='axe'){box(.48,.3,.14,metal,.17,.25,0,toolVisual);box(.18,.18,.17,metal,-.13,.25,0,toolVisual);}
      else if(type==='hoe'){box(.68,.11,.12,metal,.18,.25,0,toolVisual);box(.12,.35,.12,metal,-.12,.09,0,toolVisual);}
      else if(type==='shovel'){const blade=new THREE.Mesh(new THREE.CylinderGeometry(.24,.31,.34,6),metal);blade.position.set(0,.28,0);blade.scale.z=.45;toolVisual.add(blade);}
      else{box(.72,.16,.16,metal,0,.25,0,toolVisual);box(.16,.28,.16,metal,-.3,.14,0,toolVisual);box(.16,.28,.16,metal,.3,.14,0,toolVisual);}
    }
    toolVisual.visible=!player.vehicle&&!player.boating&&!player.transit.mode;
  }
  function playToolAnimation(){player.emoteType='tool';player.emoteUntil=performance.now()+620;player.emoteSeq=(player.emoteSeq||0)+1;const low=['pickaxe','hoe','shovel'].includes(state.tools.equipped);beep(low?180:260,55,'triangle');vibrate(16);}

  const WORLD_MAP_ROADS=WORLD_LAYOUT_V704.roads.map(road=>({...road}));
  const NAV_BASE_NODES=Object.fromEntries(Object.entries(WORLD_LAYOUT_V704.nodes).map(([id,point])=>[id,{...point}]));
  const NAV_BASE_EDGES=WORLD_LAYOUT_V704.edges.map(edge=>[...edge]);
