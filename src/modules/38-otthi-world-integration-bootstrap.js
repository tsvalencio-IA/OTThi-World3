/**
 * OTTHI World V700 — módulo-fonte
 * Arquivo: 38-otthi-world-integration-bootstrap.js
 * Escopo: Integração das cinco etapas, wrappers seguros, API de teste e bootstrap
 */
// @otthi-module-body
  const legacyWorldInitMaterials=initMaterials;
  initMaterials=function initMaterialsOtthiWorld(){legacyWorldInitMaterials();if(state.settings?.worldRender!==false)upgradeCoreMaterialsToWorldPbr();};
  const legacyWorldInitThree=initThree;
  initThree=function initThreeOtthiWorld(){
    const ok=legacyWorldInitThree();if(!ok)return false;
    try{ensureOtthiWorldState();createOtthiWorldProfessionalLayer();applyWorldAvatarV3();createWorldModularGarageInteractable();createWorldHeroAdventure();ensureWorldHeroHud();applyOtthiWorldRuntimeSettings();otthiWorldRuntime.initialized=true;document.dispatchEvent(new CustomEvent('otthi-world:ready',{detail:otthiWorldDiagnostics()}));}
    catch(error){otthiWorldRuntime.errors.push(String(error?.stack||error));console.error('[OTTHI WORLD] Camada profissional em fallback:',error);toast('A base do jogo foi preservada; um detalhe profissional iniciou em fallback.','warn',3000);}
    return true;
  };
  function bootstrapOtthiWorldShell(){
    ensureOtthiWorldState();injectOtthiWorldButtons();ensureWorldHeroHud();if(els.avatarBtn)els.avatarBtn.onclick=openAvatarStudio;
    document.documentElement.dataset.otthiWorld='705';document.body.classList.add('otthi-world-shell','otthi-v705-world');
  }
  bootstrapOtthiWorldShell();
  dbReady.then(()=>{ensureOtthiWorldState();bootstrapOtthiWorldShell();updateWorldHeroHud();}).catch(()=>{});
  window.addEventListener('otthi:cloud-progress-merged',()=>{ensureOtthiWorldState();if(playerModel)applyAvatarCustomization();});
  window.OTTHI_WORLD_TESTS={
    state:()=>ensureOtthiWorldState(),
    diagnostics:otthiWorldDiagnostics,
    avatar:()=>applyWorldAvatarV3(),
    render:()=>createOtthiWorldProfessionalLayer(),
    vehicle:id=>{const vehicle=vehicleById(id)||world.vehicles?.[0];return vehicle?applyWorldVehicleModulesToGroup(vehicle.group,vehicle.id):false;},
    hero:()=>activateWorldHeroPower(),
    challenge:()=>startWorldHeroChallenge(),
    open:openOtthiWorldCenter
  };
  if(window.OTTHOS_TEST_API)window.OTTHOS_TEST_API.world=window.OTTHI_WORLD_TESTS;
