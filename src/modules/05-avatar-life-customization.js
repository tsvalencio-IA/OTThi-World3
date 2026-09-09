/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 05-avatar-life-customization.js
 * Escopo: Avatar, roupas, uniformes, vida, moldes e ajuda
 * Linhas de origem V642: 787-927
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function effectiveAvatarUniform(){
    const job=state.career?.activeJob,terminal=['COMPLETED','CANCELLED','FAILED_SAFE'];
    if(job&&!terminal.includes(String(job.missionState||''))){
      const uniforms={delivery:'delivery',police:'police',firefighter:'firefighter',paramedic:'paramedic',teacher:'teacher',gather:'mechanic',crystals:'miner',builder:'builder'};
      return uniforms[job.id]||job.uniform||state.avatar?.uniform||'none';
    }
    return state.avatar?.uniform||'none';
  }
  function avatarChoiceGroup(type, title) {
    const locked=type==='uniform'&&!!state.career?.activeJob;
    const selected=type==='uniform'?effectiveAvatarUniform():(state.avatar[type]||'none');
    return `<section class="avatar-section"><h3>${title}${locked?' <small>• definido pela missão</small>':''}</h3><div class="avatar-grid">${avatarCatalog[type].map(([id,name,icon]) => `<button class="avatar-option ${selected===id?'selected':''}" data-avatar-type="${type}" data-avatar-id="${id}" ${locked?'disabled aria-disabled="true"':''}><b>${icon}</b><span>${name}</span></button>`).join('')}</div></section>`;
  }
  function openAvatarStudio() {
    openModal(`Meu ${playerDisplayName()}`, `${state.career?.activeJob?`<div class="roleplay-card active-job"><small>UNIFORME EM USO</small><b>${state.career.activeJob.icon||'💼'} ${state.career.activeJob.title}</b><span>O uniforme profissional será restaurado automaticamente ao concluir ou cancelar.</span></div>`:''}<div class="avatar-summary"><div class="avatar-face"><i></i><i></i></div><div><b>Personalize seu personagem</b><span>Roupas, uniformes e acessórios ficam salvos no seu progresso.</span></div></div>${avatarChoiceGroup('outfit','Roupa')}${avatarChoiceGroup('uniform','Uniforme profissional')}${avatarChoiceGroup('hat','Chapéu')}${avatarChoiceGroup('accessory','Acessório')}<div class="modal-actions"><button class="btn primary" data-avatar-save>Salvar visual</button></div>`, root => {
      $$('[data-avatar-type]', root).forEach(btn => btn.onclick = () => {
        state.avatar=updateAvatarV2LegacyChoice(state.avatar,btn.dataset.avatarType,btn.dataset.avatarId);
        $$(`[data-avatar-type="${btn.dataset.avatarType}"]`, root).forEach(x => x.classList.toggle('selected', x === btn));
        applyAvatarCustomization();
      });
      $('[data-avatar-save]', root).onclick = () => { state.avatar=normalizeAvatarV2(state.avatar);setFlag('customizedAvatar'); saveState(true); closeModal(); toast(`Visual de ${playerDisplayName()} salvo!`, 'good'); };
    });
  }
  function openLifePanel() {
    const c = state.career;
    const friendships = Object.entries(state.friendship).sort((a,b)=>b[1]-a[1]).map(([id,value])=>`<div class="friend-row"><span>${({nino:'Nino',luna:'Luna',teo:'Teo',bia:'Bia',maya:'Maya',clara:'Clara',rafa:'Rafa',davi:'Davi',leo:'Leo'})[id]||id}</span><b>${value}/100</b></div>`).join('');
    const companions=(world.npcs||[]).filter(n=>n.following||n.pendingRide||n.passengerMode);
    openModal('Minha vida', `<div class="roleplay-card"><small>CARREIRA</small><h3>${c.title}</h3><p>Nível ${c.level} • ${c.xp} XP profissional • ${c.completed} trabalhos</p></div><div class="choice-grid"><button class="choice" data-life-avatar><b>👕 Meu personagem</b><span>Roupas e acessórios</span></button><button class="choice" data-life-jobs><b>💼 Trabalhos</b><span>Ganhe moedas e reputação</span></button><button class="choice" data-life-adventures><b>🏰 Desafios da cidade</b><span>Castelo, metrô, ônibus e skills</span></button><button class="choice" data-life-transit><b>Ⓜ️ Rede de transporte</b><span>Estações, linhas e progresso</span></button>${companions.length?`<button class="choice warning" data-life-cancel-companions><b>✋ Encerrar passeio</b><span>${companions.map(n=>n.name).join(', ')}</span></button>`:''}</div><h3>Amizades</h3><div class="friend-list">${friendships}</div>`, root => {
      $('[data-life-avatar]', root).onclick = openAvatarStudio;
      $('[data-life-jobs]', root).onclick = openJobCenter;
      $('[data-life-adventures]', root).onclick = openAdventureHub;
      $('[data-life-transit]', root).onclick = openTransitGuide;
      const cancel=$('[data-life-cancel-companions]',root);if(cancel)cancel.onclick=()=>{for(const npc of world.npcs||[]){npc.following=false;npc.pendingRide=false;npc.passengerMode=null;if(npc.group)npc.group.visible=true;}closeModal();toast('Passeio encerrado com segurança.','good');};
    });
  }
  const moldFiles = [
    ['athos_moldes_caneta_3d.png','Moldes para caneta 3D'],
    ['modelo-referencia-athos.png','Modelo de referência do personagem']
  ];
  function openMolds() {
    openModal(`Moldes 3D de ${playerDisplayName()}`, `<p>Abra a imagem em tamanho maior para usar como referência.</p><div class="mold-grid">${moldFiles.map(([file, title]) => `<a class="mold-card" href="./assets/moldes/${file}" target="_blank" rel="noopener"><img src="./assets/moldes/${file}" alt="${title}"><b>${title}</b></a>`).join('')}</div>`);
  }
  function openHow() {
    openModal('Como jogar', `<div class="choice-grid">
      <div class="choice"><b>🕹 Andar</b><span>Use o joystick. O movimento acompanha a direção da câmera.</span></div>
      <div class="choice"><b>✋ Ação contextual</b><span>O texto da tela é exatamente a ação executada: cozinhar, abrir, conversar, coletar ou usar ferramentas.</span></div>
      <div class="choice"><b>▼ Abaixar</b><span>Use em passagens baixas e túneis.</span></div>
      <div class="choice"><b>◱ Mini</b><span>Entre em espaços pequenos; toque novamente para usar o Dash Mini.</span></div>
      <div class="choice"><b>N Normal</b><span>Volta ao tamanho padrão; toque novamente para o Super Pulo.</span></div>
      <div class="choice"><b>⬡ Grande</b><span>Abra portões; toque novamente para o Impacto Gigante.</span></div>
      <div class="choice"><b>↻ Giro Ímã</b><span>Atrai cristais e afasta monstros próximos.</span></div>
      <div class="choice"><b>⬆ Pular</b><span>Pulo rápido com peso. Use nas plataformas e corridas.</span></div>
      <div class="choice"><b>🔥 Poder</b><span>Lança fogo contra monstros de fantasia.</span></div>
      <div class="choice"><b>🏃 Ginásio</b><span>Dispute corridas e desafios pega-moedas com os vizinhos.</span></div>
      <div class="choice"><b>Ⓜ️ Metrô</b><span>Entre em uma estação e escolha qualquer destino do mapa.</span></div>
      <div class="choice"><b>🚌 Ônibus</b><span>Embarque nas paradas, percorra a linha e peça a próxima parada.</span></div>
      <div class="choice"><b>🧱 Construir</b><span>Escolha um item e coloque em áreas autorizadas.</span></div>
      <div class="choice"><b>💾 Salvar</b><span>O jogo salva automaticamente no celular e também permite exportar backup.</span></div>
    </div>`);
  }


  const missionChapters = [
    {
      id: 'home', title: 'Arrume sua casa', chapter: 'CAPÍTULO 1 — VIDA EM CASA', reward: { coins: 100, medal: 'Minha Primeira Casa' },
      steps: [
        ['enteredHome', 'Entre na sua casa.'],
        ['slept', 'Durma na cama para recuperar energia.'],
        ['ateMeal', 'Prepare e coma uma refeição.'],
        ['talkedNeighbor', 'Converse com Nino na praça.']
      ]
    },
    {
      id: 'neighbors', title: 'Vida de bairro', chapter: 'CAPÍTULO 2 — VIZINHOS', reward: { coins: 160, medal: 'Bom Vizinho' },
      steps: [
        ['metNeighbors', 'Converse com três vizinhos diferentes.'],
        ['boughtHouse', 'Compre uma segunda casa.'],
        ['lockedHouse', 'Tranque uma casa que pertence a você.']
      ]
    },
    {
      id: 'builder', title: 'Construtor do vale', chapter: 'CAPÍTULO 3 — MINECRAFT KIDS', reward: { coins: 220, medal: 'Construtor do Vale' },
      steps: [
        ['hasMaterials', 'Colete 3 madeiras e 2 pedras.'],
        ['bridgeFixed', 'Conserte a ponte quebrada.'],
        ['builtThree', 'Construa três objetos na sua área.']
      ]
    },
    {
      id: 'adventure', title: 'Vale dos Cristais', chapter: 'CAPÍTULO 4 — AVENTURA', reward: { coins: 280, medal: 'Herói dos Cristais' },
      steps: [
        ['fiveCrystals', 'Colete cinco cristais no percurso.'],
        ['threeEnemies', 'Derrote três monstros de fantasia.'],
        ['secretChest', 'Encontre e abra o baú secreto.']
      ]
    },
    {
      id: 'city', title: 'Cidade em movimento', chapter: 'CAPÍTULO 5 — SECOND LIFE KIDS', reward: { coins: 350, medal: 'Estrela da Cidade' },
      steps: [
        ['gotVehicle', 'Pegue o carrinho na garagem.'],
        ['deliveryDone', 'Faça a entrega para Maya.'],
        ['rep50', 'Alcance 50 pontos de reputação.']
      ]
    },
    {
      id: 'roleplay', title: 'Construa sua história', chapter: 'CAPÍTULO 6 — ROLE PLAY', reward: { coins: 500, medal: 'Minha Vida na Vila' },
      steps: [
        ['customizedAvatar', 'Escolha uma roupa e um acessório.'],
        ['completedJob', 'Conclua um trabalho da vila.'],
        ['friend10', 'Alcance amizade 10 com um vizinho.'],
        ['decoratedHome', 'Construa ou decore perto da sua casa.']
      ]
    },
    {
      id: 'sports', title: 'Campeão da Vila', chapter: 'CAPÍTULO 7 — GINÁSIO E DESAFIOS', reward: { coins: 650, medal: 'Campeão do Ginásio' },
      steps: [
        ['wonRace', 'Vença uma corrida de velocidade.'],
        ['wonCoinRace', 'Vença a corrida pega-moedas.'],
        ['wonHouseChallenge', 'Conquiste uma casa em uma disputa.']
      ]
    },
    {
      id: 'transit', title: 'Cidade conectada', chapter: 'CAPÍTULO 8 — TRANSPORTE E CASTELO', reward: { coins: 720, medal: 'Guardião da Cidade' },
      steps: [
        ['usedMetro', 'Viaje de metrô para um ponto do mapa.'],
        ['rodeBus', 'Embarque e desembarque em uma linha de ônibus.'],
        ['castleChallenge', 'Conclua um desafio no castelo.']
      ]
    },
    {
      id:'city-services',title:'Heróis da Cidade',chapter:'CAPÍTULO 9 — PROFISSÕES E SERVIÇOS',reward:{coins:900,medal:'Herói da Cidade Kids'},
      steps:[
        ['completedDeliveryJob','Conclua uma missão de entregador.'],
        ['completedPoliceJob','Conclua uma patrulha educativa.'],
        ['completedFirefighterJob','Ajude os bombeiros em uma emergência controlada.'],
        ['completedTeacherJob','Conclua uma missão de professor.']
      ]
    }
  ];

  let activeMission = null;
