/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 22-careers-jobs-uniforms.js
 * Escopo: Carreiras, estados de missão, uniformes, professor, bombeiro e entrega
 * Linhas de origem V642: 3416-3530
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function setMissionState(job,next,reason=''){if(!job)return false;const changed=job.missionState!==next||job.missionReason!==reason;if(!changed)return false;job.missionState=next;job.missionStateAt=Date.now();job.missionReason=reason;return true;}
  function missionVehicleName(job){const kind=serviceKindForJob(job),vehicle=serviceMissionVehicle(job);return vehicle?.label||(kind==='police'?'Viatura da Polícia':kind==='firefighter'?'Caminhão dos Bombeiros':kind==='paramedic'?'Ambulância de Resgate':'');}
  function missionInstructionSteps(job){if(!job)return[];const kind=serviceKindForJob(job),vehicle=missionVehicleName(job);if(kind){const scene=job.id==='police'&&!job.emergencyIncidentId?'os três pontos da patrulha':job.id==='firefighter'&&!job.emergencyIncidentId?'a ocorrência de incêndio':'a área do acidente';return[{text:`Vestir o uniforme de ${job.title}`,done:effectiveAvatarUniform()===JOB_UNIFORMS[job.id]},{text:`Ir até ${vehicle} marcado no GPS`,done:!!job.serviceVehicleBoarded},{text:`Entrar e dirigir ${vehicle}`,done:!!job.serviceVehicleBoarded},{text:`Chegar com o veículo até ${scene}`,done:!!job.serviceVehicleArrived||Number(job.progress||0)>0},{text:job.id==='police'&&!job.emergencyIncidentId?'Concluir todos os pontos sem trocar de veículo':'Estacionar, sair e usar AÇÃO no local',done:!!job.sceneTaskCompleted||job.completed===true}];}if(job.id==='delivery')return[{text:'Ir à garagem e pegar o carrinho',done:!!player.vehicle},{text:'Levar o pacote até Maya',done:!!state.flags.deliveryDone}];if(job.id==='teacher')return[{text:'Ir até a escola marcada',done:!!currentHouse?.id?.startsWith('school')},{text:'Usar o quadro e concluir a atividade',done:!!job.completed}];if(job.id==='gather')return[{text:'Vestir o uniforme de mecânico',done:effectiveAvatarUniform()==='mechanic'},{text:'Ir até a Oficina',done:!!job.mechanicArrived},{text:'Diagnosticar o carro de treinamento',done:!!job.mechanicDiagnosed},{text:'Usar AÇÃO na vaga de reparo e consertar o veículo',done:!!job.mechanicRepairCompleted}];if(job.id==='crystals')return[{text:'Coletar 3 cristais novos',done:state.inventory.crystals-(job.start?.crystals||0)>=3}];if(job.id==='builder')return[{text:'Construir 2 objetos perto de uma casa',done:state.builds.length-(job.start?.builds||0)>=2}];return[{text:job.description,done:false}];}
  function missionBriefingMarkup(job){const progress=activeJobProgress(job),steps=missionInstructionSteps(job),vehicle=missionVehicleName(job);return`<div class="mission-briefing"><div class="mission-briefing-head"><span>${job.icon||'💼'}</span><div><small>${job.missionState||'MISSÃO ATIVA'}</small><h3>${job.title}</h3><p>${job.description}</p></div></div>${vehicle?`<div class="mission-assigned-vehicle"><b>VEÍCULO RESERVADO</b><span>${vehicle}${job.serviceVehicleBoarded?' • você já entrou':' • marcado no GPS'}</span></div>`:''}<ol class="mission-step-list">${steps.map((step,index)=>`<li class="${step.done?'done':''}"><i>${step.done?'✓':index+1}</i><span>${step.text}</span></li>`).join('')}</ol><div class="job-progress"><i style="width:${progress.percent}%"></i></div><b class="mission-current-instruction">Agora: ${progress.label}</b></div>`;}
  function equipJobUniform(jobId){
    const uniform=JOB_UNIFORMS[jobId]||'none',job=state.career?.activeJob;
    if(job&&job.id===jobId){job.uniform=uniform;job.uniformLocked=true;}
    state.avatar.uniform=uniform;applyAvatarCustomization();saveState(true);return uniform;
  }
  function focusActiveJob(){
    const job=state.career.activeJob;if(!job){toast('Nenhum trabalho ativo.','warn');return false;}if(currentHouse&&!(job.id==='teacher'&&currentHouse.id.startsWith('school')))exitHouse();const serviceKind=serviceKindForJob(job);
    if(serviceKind&&!job.serviceVehicleBoarded){const vehicle=reserveMissionServiceVehicle(job,{waypoint:true});if(!vehicle)return false;closeModal();updateMissionHUD();toast(`Primeiro passo: vista o uniforme e entre em ${serviceKind==='police'?'uma viatura':serviceKind==='firefighter'?'um caminhão dos bombeiros':'uma ambulância'}.`,'good',2600);return true;}
    if(job.emergencyIncidentId){const incident=world.activeIncident?.id===job.emergencyIncidentId?world.activeIncident:null;if(incident){state.waypoint={id:`assist-${incident.id}`,name:'Área do acidente',x:incident.x,z:incident.z,navX:incident.navX,navZ:incident.navZ,arrived:false};world.routePath=buildRoutePoints(player,state.waypoint);updateWaypointMarker();updateNavigation(0,true);}}
    else if(job.id==='delivery')setWaypoint('garage');
    else if(job.id==='police'){const id=(job.route||[])[Number(job.progress||0)]||'police';setWaypoint(id);}
    else if(job.id==='firefighter'){const fire=ensureActiveFire(true);if(fire){state.waypoint={id:`fire-${fire.id}`,name:fire.name,x:fire.x,z:fire.z,navX:fire.navX,navZ:fire.navZ,arrived:false};world.routePath=buildRoutePoints(player,state.waypoint);updateWaypointMarker();updateNavigation(0,true);}}
    else if(job.id==='paramedic'){const incident=ensureActiveTrafficIncident(true);if(incident){job.emergencyIncidentId=incident.id;focusActiveJob();return true;}}
    else if(job.id==='teacher')setWaypoint(job.schoolId||'school');else if(job.id==='gather')setWaypoint('workshop');else if(job.id==='crystals')setWaypoint('crystal');else if(job.id==='builder')setWaypoint('home-extension');
    closeModal();updateMissionHUD();toast(`Missão ativa: ${job.title}. Siga a rota azul.`,'good',2300);return true;
  }
  async function cancelActiveJob(){
    const job=state.career.activeJob;if(!job||job.missionState===MISSION_STATES.COMPLETING)return false;
    const ok=await confirmModal('Cancelar trabalho',`Deseja encerrar "${job.title}"? Suas moedas, itens e conquistas continuam salvos.`,'Cancelar trabalho','Continuar missão');if(!ok)return false;
    setMissionState(job,MISSION_STATES.CANCELLED,'player-cancel');job.uniformLocked=false;
    if(job.id==='delivery'){state.flags.deliveryActive=false;state.inventory.package=Number(job.previousPackage||0);}
    releaseMissionServiceVehicle(job);state.avatar.uniform=job.previousUniform||'none';state.career.lastMission={...job,endedAt:Date.now()};state.career.activeJob=null;state.waypoint=null;world.routePath=[];updateWaypointMarker();applyAvatarCustomization();updateMissionHUD();saveState(true);closeModal();toast('Trabalho cancelado. Você pode escolher outro.','good',1900);return true;
  }

  function activeJobProgress(job){
    if(!job)return{percent:0,label:'0%'};const start=job.start||{},serviceKind=serviceKindForJob(job);
    if(serviceKind&&!job.serviceVehicleBoarded)return{percent:18,label:`Entre ${serviceKind==='police'?'na viatura':serviceKind==='firefighter'?'no caminhão dos bombeiros':'na ambulância'}`};
    if(job.id==='delivery')return{percent:state.flags.deliveryDone?100:(player.vehicle?55:25),label:state.flags.deliveryDone?'concluído':player.vehicle?'Leve o pacote até Maya':'Pegue o carrinho'};
    if(job.id==='police'){if(job.emergencyIncidentId)return{percent:job.sceneTaskCompleted?90:job.serviceVehicleArrived?72:42,label:job.sceneTaskCompleted?'Área protegida; aguarde conclusão':job.serviceVehicleArrived?'Saia da viatura e use AÇÃO':'Dirija a viatura até o acidente'};const done=Number(job.progress||0),total=(job.route||[]).length||3;return{percent:clamp(24+done/total*76,0,100),label:`${done}/${total} pontos patrulhados com a viatura`};}
    if(job.id==='firefighter'){if(job.emergencyIncidentId)return{percent:job.sceneTaskCompleted?90:job.serviceVehicleArrived?72:42,label:job.sceneTaskCompleted?'Incêndio controlado':job.serviceVehicleArrived?'Saia do caminhão e use AÇÃO':'Dirija o caminhão até o acidente'};const fire=world.fires.find(f=>f.active);return{percent:job.completed?100:(fire?.playerHelping?88:job.serviceVehicleArrived?68:fire?42:25),label:job.completed?'emergência concluída':fire?.playerHelping?'Mangueira em operação':job.serviceVehicleArrived?'Estacione e ajude com a mangueira':fire?'Dirija até a ocorrência':'Aguardando chamado'};}
    if(job.id==='gather')return{percent:job.mechanicRepairCompleted?100:job.mechanicDiagnosed?72:job.mechanicArrived?45:22,label:job.mechanicRepairCompleted?'Veículo reparado':job.mechanicDiagnosed?'Use a vaga de reparo e conserte o veículo':job.mechanicArrived?'Diagnostique o carro de treinamento':'Vá até a Oficina'};
    if(job.id==='paramedic')return{percent:job.sceneTaskCompleted?90:job.serviceVehicleArrived?70:42,label:job.sceneTaskCompleted?'Atendimento realizado; aguarde liberação':job.serviceVehicleArrived?'Saia da ambulância e use AÇÃO':'Dirija a ambulância até o acidente'};
    if(job.id==='teacher')return{percent:job.completed?100:(currentHouse?.id?.startsWith('school')?55:20),label:job.completed?'aula concluída':'Vá até uma escola e use o quadro'};
    if(job.id==='gather'){const w=Math.max(0,state.inventory.wood-(start.wood||0)),r=Math.max(0,state.inventory.stone-(start.stone||0));return{percent:clamp((w/3+r/2)*50,0,100),label:`${Math.min(w,3)}/3 madeiras • ${Math.min(r,2)}/2 pedras`};}
    if(job.id==='crystals'){const n=Math.max(0,state.inventory.crystals-(start.crystals||0));return{percent:clamp(n/3*100,0,100),label:`${Math.min(n,3)}/3 cristais`};}if(job.id==='builder'){const n=Math.max(0,state.builds.length-(start.builds||0));return{percent:clamp(n/2*100,0,100),label:`${Math.min(n,2)}/2 construções`};}return{percent:0,label:'Em andamento'};
  }
  function openJobCenter(){
    const active=state.career.activeJob,progress=active?activeJobProgress(active):null;
    openModal('Central de Trabalhos',`<div class="coop-job-banner"><span>🤝</span><div><b>Missões cooperativas</b><small>Bombeiros, resgate, polícia, pesca, escola e corridas</small></div><button class="btn good" data-open-coop-jobs>Abrir</button></div>${active?`${missionBriefingMarkup(active)}<div class="roleplay-card active-job"><small>CONTROLES DA MISSÃO</small><div class="modal-actions"><button class="btn primary" data-continue-job>Continuar missão</button><button class="btn" data-job-uniform>Vestir uniforme</button><button class="btn danger" data-cancel-job>Trocar/Cancelar trabalho</button></div></div>`:'<p>Escolha uma atividade. Você pode cancelar e trocar de profissão sem perder conquistas.</p>'}<div class="choice-grid">${JOBS.map(j=>`<button class="choice" data-job="${j.id}" ${active?'disabled':''}><b>${j.icon} ${j.title}</b><span>${j.description}<br><strong>${j.reward} moedas</strong></span></button>`).join('')}</div>`,root=>{
      $('[data-open-coop-jobs]',root)?.addEventListener('click',openCoopMissionCenter);$$('[data-job]',root).forEach(btn=>btn.onclick=()=>{const job=JOBS.find(j=>j.id===btn.dataset.job);startJob(job);});
      $('[data-continue-job]',root)?.addEventListener('click',focusActiveJob);
      $('[data-job-uniform]',root)?.addEventListener('click',()=>{equipJobUniform(active.id);toast('Uniforme equipado.','good',1200);});
      $('[data-cancel-job]',root)?.addEventListener('click',cancelActiveJob);
    });
  }
  function startJob(job,options={}){
    if(!job||state.career.activeJob){toast('Cancele ou conclua o trabalho atual antes de trocar.','warn');return false;}const inv=state.inventory,schoolId=Math.random()>.5?'school':'school-east',instanceId=`job-${job.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    state.career.activeJob={...job,instanceId,missionState:MISSION_STATES.ACCEPTED,missionStateAt:Date.now(),schoolId,previousUniform:state.avatar.uniform||'none',previousPackage:Number(inv.package||0),rewardClaimed:false,startedAt:Date.now(),progress:0,serviceVehicleId:'',serviceVehicleKind:serviceKindForJob(job),serviceVehicleBoarded:false,serviceVehicleArrived:false,sceneTaskCompleted:false,emergencyIncidentId:'',start:{wood:inv.wood,stone:inv.stone,crystals:inv.crystals,builds:state.builds.length}};
    equipJobUniform(job.id);setMissionState(state.career.activeJob,MISSION_STATES.PREPARING,'uniform-ready');if(job.id==='delivery'){state.flags.deliveryActive=true;state.flags.deliveryDone=false;state.inventory.package=Math.max(1,Number(state.inventory.package||0));}
    else if(job.id==='police'){state.career.activeJob.route=['village','school','fire-station'];state.career.activeJob.progress=0;reserveMissionServiceVehicle(state.career.activeJob,{waypoint:true});}
    else if(job.id==='firefighter'){ensureActiveFire(true);reserveMissionServiceVehicle(state.career.activeJob,{waypoint:true});}
    else if(job.id==='paramedic'){const incident=ensureActiveTrafficIncident(true);if(incident)state.career.activeJob.emergencyIncidentId=incident.id;reserveMissionServiceVehicle(state.career.activeJob,{waypoint:true});}
    else if(job.id==='gather'){const target=typeof vehicleById==='function'?vehicleById('workshop-red'):null;state.career.activeJob.mechanicVehicleId='workshop-red';state.career.activeJob.mechanicArrived=false;state.career.activeJob.mechanicDiagnosed=false;state.career.activeJob.mechanicRepairCompleted=false;if(target&&typeof setVehicleDurabilityV704==='function')setVehicleDurabilityV704(target,48,'mechanic-training');}
    if(currentHouse&&!(job.id==='teacher'&&currentHouse.id.startsWith('school')))exitHouse();saveState(true);updateMissionHUD();if(options.focus!==false)focusActiveJob();toast(`Missão aceita: ${job.title}. Toque no cartão da missão para ver todas as etapas.`,'good',3200);return true;
  }
  function completeActiveJob(){
    const job=state.career.activeJob;if(!job||job.missionState===MISSION_STATES.COMPLETING||job.missionState===MISSION_STATES.COMPLETED)return false;
    const token=String(job.instanceId||`job-${job.id}-${job.startedAt||0}`),tokens=state.career.completedMissionTokens||(state.career.completedMissionTokens=[]);
    if(job.rewardClaimed||tokens.includes(token)){console.warn('[OTTHOS] Recompensa duplicada bloqueada:',token);return false;}
    setMissionState(job,MISSION_STATES.COMPLETING,'objective-complete');job.rewardClaimed=true;tokens.push(token);if(tokens.length>120)tokens.splice(0,tokens.length-120);
    state.profile.coins+=Number(job.reward||0);state.profile.reputation+=Number(job.rep||0);state.career.completed++;state.stats.jobsCompleted=(state.stats.jobsCompleted||0)+1;
    if(job.id==='delivery'){state.flags.deliveryActive=false;state.inventory.package=Number(job.previousPackage||0);state.flags.deliveryDone=true;state.flags.completedDeliveryJob=true;state.cityServices.deliveries++;}
    if(job.id==='police'){state.flags.completedPoliceJob=true;state.cityServices.policePatrols++;state.stats.patrols++;}
    if(job.id==='firefighter'){state.flags.completedFirefighterJob=true;state.cityServices.rescuesCompleted=(state.cityServices.rescuesCompleted||0)+1;}if(job.id==='paramedic'){state.flags.completedParamedicJob=true;state.cityServices.paramedicRescues=(state.cityServices.paramedicRescues||0)+1;state.stats.paramedicCalls=(state.stats.paramedicCalls||0)+1;}
    if(job.id==='teacher'){state.flags.completedTeacherJob=true;state.cityServices.lessonsTaught++;state.stats.classesTaught++;}
    state.career.xp+=100;state.career.level=Math.floor(state.career.xp/300)+1;state.career.title=state.career.level>=4?'Profissional da Vila':state.career.level>=2?'Ajudante da Vila':'Morador da Vila';
    job.uniformLocked=false;releaseMissionServiceVehicle(job);state.avatar.uniform=job.previousUniform||'none';setMissionState(job,MISSION_STATES.COMPLETED,'reward-committed');job.completedAt=Date.now();state.career.lastMission={...job};state.objectives.history.push({id:token,type:'job',jobId:job.id,title:job.title,completedAt:job.completedAt,reward:Number(job.reward||0),rep:Number(job.rep||0)});if(state.objectives.history.length>80)state.objectives.history.splice(0,state.objectives.history.length-80);
    state.career.activeJob=null;state.waypoint=null;world.routePath=[];updateWaypointMarker();applyAvatarCustomization();setFlag('completedJob');evaluateMissions();updateMissionHUD();updateHUD();saveState(true);toast(`Trabalho concluído! +${job.reward} moedas`,'good',2600);return true;
  }
  function checkActiveJob(){
    const job=state.career.activeJob;if(!job)return;
    const start=job.start||{};
    if(job.id==='crystals'&&state.inventory.crystals-(start.crystals||0)>=3)completeActiveJob();
    else if(job.id==='builder'&&state.builds.length-(start.builds||0)>=2)completeActiveJob();
  }

  function performPoliceCheckpointAction(){
    const job=state.career?.activeJob;if(!job||job.id!=='police'||!job.policeCheckpointReady||player.vehicle)return false;const route=job.route||[],targetId=route[Number(job.progress||0)],loc=MAP_LOCATIONS.find(x=>x.id===targetId);if(!loc||Math.hypot(player.x-(loc.navX??loc.x),player.z-(loc.navZ??loc.z))>6)return false;openModal('👮 Abordagem segura',`<div class="police-job-action"><h3>${escapeHtml(loc.name)}</h3><p>Faça a ocorrência na ordem correta. Não basta chegar com a viatura.</p><ol><li>Desembarcar e sinalizar a área.</li><li>Abordar e verificar a situação.</li><li>Orientar ou conduzir a pessoa com segurança.</li></ol><button class="btn primary" data-police-job-complete>Concluir abordagem e condução</button></div>`,root=>{$('[data-police-job-complete]',root).onclick=()=>{job.progress=(job.progress||0)+1;job.policeCheckpointReady=false;job.serviceVehicleArrived=false;closeModal();beep(720,70);toast(`Ocorrência em ${loc.name}: abordagem concluída e condução segura registrada.`,'good',2300);if(job.progress>=route.length){completeActiveJob();}else{reserveMissionServiceVehicle(job,{waypoint:false});setWaypoint(route[job.progress]);setMissionState(job,MISSION_STATES.TRAVELLING,'next-patrol-point');saveState(true);updateMissionHUD();}};});return true;
  }
  function restoreActiveJobRuntime(){
    const job=state.career?.activeJob;if(!job)return;job.uniform=JOB_UNIFORMS[job.id]||job.uniform||'none';job.uniformLocked=true;if(job.id==='delivery'){state.flags.deliveryActive=true;state.inventory.package=Math.max(1,Number(state.inventory.package||0));}if(job.id==='firefighter')ensureActiveFire(true);if(job.id==='paramedic'&&!world.activeIncident){const incident=ensureActiveTrafficIncident(true);if(incident)job.emergencyIncidentId=incident.id;}if(serviceKindForJob(job))reserveMissionServiceVehicle(job,{waypoint:false});applyAvatarCustomization();updateMissionHUD();
  }
  function updateCareerMissions(){
    const job=state.career.activeJob;if(!job)return;const now=performance.now();if(now-Number(updateCareerMissions.lastAt||0)<180)return;updateCareerMissions.lastAt=now;let signature='',serviceKind=serviceKindForJob(job);
    if(serviceKind&&!job.serviceVehicleBoarded){reserveMissionServiceVehicle(job,{waypoint:false});setMissionState(job,MISSION_STATES.PREPARING,'need-service-vehicle');}
    else if(job.emergencyIncidentId){const incident=world.activeIncident?.id===job.emergencyIncidentId?world.activeIncident:null;if(!incident&&job.sceneTaskCompleted)completeActiveJob();else if(incident)setMissionState(job,job.sceneTaskCompleted?MISSION_STATES.RETURNING:job.serviceVehicleArrived?MISSION_STATES.ACTION_REQUIRED:MISSION_STATES.TRAVELLING,job.sceneTaskCompleted?'scene-complete':job.serviceVehicleArrived?'assist-scene':'respond-incident');}
    else if(job.id==='police'){
      const route=job.route||[],targetId=route[Number(job.progress||0)],loc=MAP_LOCATIONS.find(x=>x.id===targetId);if(loc){const distance=Math.hypot(player.x-(loc.navX??loc.x),player.z-(loc.navZ??loc.z)),correctVehicle=isDrivingServiceVehicle('police');if(correctVehicle&&distance<5){job.policeCheckpointReady=true;job.serviceVehicleArrived=true;setMissionState(job,MISSION_STATES.ACTION_REQUIRED,'police-approach');}else if(job.policeCheckpointReady&&distance<6)setMissionState(job,MISSION_STATES.ACTION_REQUIRED,'police-approach');else setMissionState(job,!correctVehicle?MISSION_STATES.PREPARING:MISSION_STATES.TRAVELLING,!correctVehicle?'need-police-car':'route');}
    }else if(job.id==='delivery'){const d=Math.hypot(player.x-65,player.z-54);setMissionState(job,d<5?MISSION_STATES.ACTION_REQUIRED:player.vehicle?MISSION_STATES.TRAVELLING:MISSION_STATES.PREPARING,d<5?'deliver-to-maya':player.vehicle?'driving':'need-vehicle');}
    else if(job.id==='teacher'){const atSchool=!!currentHouse?.id?.startsWith('school');setMissionState(job,atSchool?MISSION_STATES.ACTION_REQUIRED:MISSION_STATES.TRAVELLING,atSchool?'teach':'go-school');}
    else if(job.id==='firefighter'){const fire=world.fires.find(f=>f.active),distance=fire?Math.hypot(player.x-fire.navX,player.z-fire.navZ):Infinity;if(isDrivingServiceVehicle('firefighter')&&distance<6&&!job.serviceVehicleArrived){job.serviceVehicleArrived=true;toast('Caminhão posicionado. Estacione, saia e use a mangueira.','good',2500);saveState(true);}setMissionState(job,job.serviceVehicleArrived?MISSION_STATES.ACTION_REQUIRED:MISSION_STATES.TRAVELLING,fire?'respond':'await-call');}
    else if(job.id==='paramedic'){const incident=ensureActiveTrafficIncident(true);if(incident&&!job.emergencyIncidentId)job.emergencyIncidentId=incident.id;}
    else if(job.id==='gather'){const w=worldLayoutPoint('workshop'),distance=Math.hypot(player.x-w.x,player.z-w.z);job.mechanicArrived=distance<10||job.mechanicArrived;if(job.mechanicArrived&&!job.mechanicDiagnosed){job.mechanicDiagnosed=true;toast('Diagnóstico: veículo de treinamento com falha. Vá à vaga de reparo e use AÇÃO.','good',2600);saveState(true);}setMissionState(job,job.mechanicArrived?MISSION_STATES.ACTION_REQUIRED:MISSION_STATES.TRAVELLING,job.mechanicArrived?'repair-training-car':'go-workshop');}
    else setMissionState(job,MISSION_STATES.ACTION_REQUIRED,'collect-or-build');checkActiveJob();signature=`${job.id}|${job.missionState}|${activeJobProgress(job).label}`;if(signature!==updateCareerMissions.signature){updateCareerMissions.signature=signature;updateMissionHUD();}
  }
  function openTeacherJobLesson(house){
    const questions=[['Qual atitude ajuda toda a turma?',['Ouvir e respeitar','Gritar com os colegas','Esconder os materiais'],0],['O que fazemos antes de atravessar?',['Corremos sem olhar','Olhamos para os dois lados','Fechamos os olhos'],1],['Como cuidamos da escola?',['Organizamos e ajudamos','Quebramos objetos','Jogamos lixo no chão'],0]],job=state.career.activeJob;if(!job||job.id!=='teacher')return;let step=0;const render=()=>{const q=questions[step];openModal('Missão de professor',`<div class="teacher-mission"><span>🧑‍🏫</span><h3>Aula prática • etapa ${step+1}/3</h3><p>${q[0]}</p><div class="choice-grid">${q[1].map((answer,i)=>`<button class="choice" data-teacher-answer="${i}"><b>${answer}</b></button>`).join('')}</div></div>`,root=>{$$('[data-teacher-answer]',root).forEach(btn=>btn.onclick=()=>{if(Number(btn.dataset.teacherAnswer)!==q[2]){toast('Resposta incorreta. Explique e tente novamente.','warn',1400);return;}step++;job.teacherLessonStep=step;if(step<questions.length){closeModal();setTimeout(render,80);return;}job.completed=true;closeModal();completeActiveJob();addXP(55);toast(`Aula completa na ${house.name}: 3 atividades ensinadas.`,'good',2400);});});};render();
  }
  function openFireStationDesk(){
    const active=state.career.activeJob,fire=world.fires.find(f=>f.active)||null;
    openModal('Central dos Bombeiros',`<div class="fire-station-card"><span>🚒</span><h3>Equipe de emergência infantil</h3><p>Os incêndios são simulações controladas. Ninguém perde vida, moedas ou conquistas.</p>${active?.id==='firefighter'?`<div class="job-progress"><b>Missão em andamento</b><span>${active.completed?'Retorne à central para concluir.':fire?`Chamado: ${fire.name}`:'Buscando um chamado seguro...'}</span></div>`:''}<div class="modal-actions">${active?.id==='firefighter'?`<button class="btn primary" data-fire-continue>Continuar missão</button><button class="btn danger" data-fire-cancel>Trocar de trabalho</button>`:`<button class="btn primary" data-fire-job>Começar missão de bombeiro</button>`}<button class="btn" data-fire-call>Ver chamado atual</button><button class="btn" data-fire-uniform>Vestir uniforme</button></div></div>`,root=>{
      const startBtn=$('[data-fire-job]',root);if(startBtn)startBtn.onclick=()=>{if(state.career.activeJob){toast('Escolha “Trocar de trabalho” no painel de empregos.','warn');return;}startJob(JOBS.find(j=>j.id==='firefighter'));};
      const cont=$('[data-fire-continue]',root);if(cont)cont.onclick=()=>{closeModal();focusActiveJob();};
      const cancel=$('[data-fire-cancel]',root);if(cancel)cancel.onclick=async()=>{closeModal();await cancelActiveJob();};
      $('[data-fire-call]',root).onclick=()=>{const current=ensureActiveFire(false);if(!current){toast('Nenhum chamado ativo agora.','good');return;}state.waypoint={id:`fire-${current.id}`,name:current.name,x:current.x,z:current.z,navX:current.navX,navZ:current.navZ};world.routePath=buildRoutePoints(player,state.waypoint);updateWaypointMarker();closeModal();if(currentHouse)exitHouse();toast(`Chamado marcado: ${current.name}`,'good');};
      $('[data-fire-uniform]',root).onclick=()=>{equipJobUniform('firefighter');closeModal();};
    });
  }


  function startDeliveryJob(){
    if(state.flags.deliveryActive){toast('Você já está fazendo uma entrega.','warn');return;}state.flags.deliveryActive=true;state.inventory.package=1;toast('Pacote recebido. Leve até Maya!','good',2200);saveState();
  }
  let fxParticles=[];
  const FX_MAX_PARTICLES=40;
