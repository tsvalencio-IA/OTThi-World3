/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 10-player-skills.js
 * Escopo: Escala, Mini/Normal/Grande, abaixar, girar e domínio de skills
 * Linhas de origem V642: 1625-1691
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function playerScaleValue(mode = player.scaleMode) { return mode === 'mini' ? .58 : mode === 'giant' ? 1.42 : 1; }
  const skillCooldowns={miniDash:0,superJump:0,giantSlam:0,stealth:0,magnetSpin:0};
  const skillButtons={miniDash:()=>els.miniBtn,superJump:()=>els.normalBtn,giantSlam:()=>els.giantBtn,stealth:()=>els.crouchBtn,magnetSpin:()=>els.spinBtn};
  function skillReady(id){const left=Math.max(0,Number(skillCooldowns[id]||0)-performance.now());if(left>0){toast(`Skill recarregando: ${Math.ceil(left/1000)} s.`,'warn',1200);return false;}return true;}
  function recordAdvancedSkill(id,cooldownMs){
    skillCooldowns[id]=performance.now()+cooldownMs;
    state.abilities.mastery[id]=(state.abilities.mastery[id]||0)+1;
    state.stats.skillCombos=(state.stats.skillCombos||0)+1;trackDaily('skill',1);advanceAdventure('skills',id);saveState();updateAbilityUI();
    for(let elapsed=1000;elapsed<=cooldownMs+50;elapsed+=1000)setTimeout(updateAbilityUI,elapsed);setTimeout(updateAbilityUI,cooldownMs+60);
  }
  function collectCrystal(c,message='Cristal coletado!'){
    if(!c||c.got)return false;c.got=true;c.mesh.visible=false;state.inventory.crystals++;state.stats.collected++;trackDaily('collect',1);addXP(15);addCoins(5);toast(message,'good');beep(880);vibrate(20);evaluateMissions();checkActiveJob();saveState();return true;
  }
  function syncPlayerRootScale(){
    if(!playerGroup)return;
    if(player.vehicle){
      // O veículo nunca herda Mini/Grande/Abaixar do Otthos.
      playerGroup.scale.set(1,1,1);
      return;
    }
    const scale=playerScaleValue();
    playerGroup.scale.set(scale,scale*(player.crouched?.68:1),scale);
  }
  function setScaleMode(mode) {
    if(!els.modal.hidden||paused||player.vehicle||player.boating||player.transit.mode)return;
    if (!['mini','normal','giant'].includes(mode)) return;
    if(mode===player.scaleMode){
      if(mode==='mini'){
        if(!skillReady('miniDash'))return;player.skillDashUntil=performance.now()+1250;recordAdvancedSkill('miniDash',4200);toast('Dash Mini ativado!','good',1400);beep(760,70,'sine');
      }else if(mode==='normal'){
        if(!player.grounded){toast('Pouse antes de usar o Super Pulo.','warn');return;}if(!skillReady('superJump'))return;state.stats.jumps++;trackDaily('jump',1);player.vy=15;player.grounded=false;recordAdvancedSkill('superJump',4600);toast('Super Pulo!','good',1300);beep(820,80,'sine');vibrate(24);
      }else{
        if(!skillReady('giantSlam'))return;player.damageUntil=performance.now()+900;for(const enemy of world.enemies)if(!enemy.dead&&distance2D(player,enemy.group.position)<5.4)damageEnemy(enemy,2);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;spawnDust(player.x+Math.sin(a)*1.8,player.z+Math.cos(a)*1.8);}recordAdvancedSkill('giantSlam',6000);toast('Impacto Gigante!','good',1500);beep(125,130,'sawtooth');vibrate([45,25,60]);
      }
      return;
    }
    player.scaleMode = mode;
    player.crouched = false;
    state.abilities.scaleMode = mode;
    state.abilities.crouched = false;
    updateAbilityUI(); saveState(true);
    toast(mode === 'mini' ? 'Modo mini: entre em passagens pequenas.' : mode === 'giant' ? 'Modo grande: força para desafios pesados.' : 'Tamanho normal.', 'good');
  }
  function toggleCrouch(force) {
    if(!els.modal.hidden||paused||player.vehicle||player.boating||player.transit.mode)return;
    if(typeof force!=='boolean'&&player.crouched){
      if(!skillReady('stealth')){player.crouched=false;state.abilities.crouched=false;updateAbilityUI();saveState();return;}player.crouched=false;state.abilities.crouched=false;player.shieldUntil=performance.now()+5000;recordAdvancedSkill('stealth',8000);toast('Escudo Furtivo: protegido por 5 s.','good',1800);beep(610,90,'sine');return;
    }
    player.crouched = typeof force === 'boolean' ? force : !player.crouched;
    state.abilities.crouched = player.crouched;
    updateAbilityUI(); saveState();
    toast(player.crouched ? `${playerDisplayName()} abaixou.` : `${playerDisplayName()} levantou.`, 'good');
  }
  function spinPlayer(){
    if(!els.modal.hidden||paused||player.vehicle||player.boating||player.transit.mode||!skillReady('magnetSpin'))return;
    player.spinUntil=performance.now()+980;let pulled=0;
    for(const c of world.crystals)if(!c.got&&Math.hypot(player.x-c.x,player.z-c.z)<6){collectCrystal(c,'Cristal atraído pelo Giro Ímã!');pulled++;}
    for(const enemy of world.enemies)if(!enemy.dead&&distance2D(player,enemy.group.position)<4.6){damageEnemy(enemy,1);const a=Math.atan2(enemy.group.position.x-player.x,enemy.group.position.z-player.z);enemy.group.position.x+=Math.sin(a)*1.4;enemy.group.position.z+=Math.cos(a)*1.4;}
    recordAdvancedSkill('magnetSpin',5200);addXP(3+pulled);beep(430,80,'sine');toast(pulled?`Giro Ímã: ${pulled} cristal(is)!`:'Giro Ímã ativado!','good',1500);
  }
  function updateAbilityUI(){
    els.crouchBtn?.classList.toggle('active',player.crouched);els.miniBtn?.classList.toggle('active',player.scaleMode==='mini');els.normalBtn?.classList.toggle('active',player.scaleMode==='normal');els.giantBtn?.classList.toggle('active',player.scaleMode==='giant');
    const labels=[[els.crouchBtn,player.crouched?'Escudo':'Abaixar'],[els.miniBtn,player.scaleMode==='mini'?'Dash':'Mini'],[els.normalBtn,player.scaleMode==='normal'?'Super pulo':'Normal'],[els.giantBtn,player.scaleMode==='giant'?'Impacto':'Grande'],[els.spinBtn,'Giro ímã']];for(const [btn,label] of labels){const span=$('span',btn);if(span)span.textContent=label;}
    for(const [id,getButton] of Object.entries(skillButtons)){const btn=getButton(),left=Math.max(0,skillCooldowns[id]-performance.now());btn?.classList.toggle('cooldown',left>0);if(btn){btn.dataset.cooldown=left>0?String(Math.ceil(left/1000)):'';btn.disabled=left>0&&id==='magnetSpin';}}
    els.crouchBtn?.classList.toggle('shielded',performance.now()<player.shieldUntil);
  }

