/**
 * OTTHI World V700 — módulo-fonte
 * Arquivo: 34-avatar-studio-professional-v3.js
 * Escopo: Etapa 2, personagem modular profissional sobre o rig procedural preservado
 */
// @otthi-module-body
  const OTTHI_WORLD_AVATAR_CATALOG=Object.freeze({
    bodyStyle:Object.freeze([['lego','LEGO','🧱'],['minecraft','Minecraft / Manycraft','🟩'],['playmobil','Playmobil','🧍'],['mario-world','Mario World — Mario','🧢'],['luigi-world','Mario World — Luigi','🟢']]),
    face:Object.freeze([['face-happy-01','Feliz','🙂'],['face-brave-01','Corajoso','😎'],['face-curious-01','Curioso','🤔'],['face-focus-01','Concentrado','🎯']]),
    hair:Object.freeze([['hair-none','Sem cabelo','◯'],['hair-short-01','Curto','✂'],['hair-spikes-01','Espetado','⚡'],['hair-curls-01','Cacheado','〰']]),
    torso:Object.freeze([['world-jacket-01','Jaqueta World','🧥'],['world-hoodie-01','Moletom','👕'],['world-explorer-01','Explorador','🧭'],['world-hero-01','Herói OTTHI','⚡'],['world-shadow-guardian','Guardião Noturno','🌙'],['world-web-runner','Corredor de Fios','🕸️'],['world-mushroom-adventurer','Macacão de aventura','🧢'],['world-toy-rescuer','Resgatista Brinquedo','🧸']]),
    legs:Object.freeze([['world-pants-01','Calça urbana','👖'],['world-shorts-01','Bermuda','🩳'],['world-armor-01','Proteção de aventura','🛡']]),
    shoes:Object.freeze([['world-sneakers-01','Tênis','👟'],['world-boots-01','Botas','🥾'],['world-energy-01','Tênis de energia','✨']]),
    back:Object.freeze([['none','Sem item','—'],['world-backpack-01','Mochila modular','🎒'],['world-cape-01','Capa OTTHI','🦸'],['world-jetpack-01','Propulsor de brinquedo','🚀']]),
    pattern:Object.freeze([['none','Sem estampa','□'],['world-stripe','Faixas','≡'],['world-pixels','Pixels','▦'],['world-star','Estrela OTTHI','★']])
  });

  function worldAvatarSafeChoice(field,value){
    const options=OTTHI_WORLD_AVATAR_CATALOG[field]||[];return options.some(item=>item[0]===value)?value:(options[0]?.[0]||'none');
  }
  function disposeWorldAvatarObject(object){
    object?.traverse?.(child=>{if(child.isMesh){child.geometry?.dispose?.();const list=Array.isArray(child.material)?child.material:[child.material];for(const material of list){if(material?.userData?.otthiWorldAvatarMaterial)material.dispose?.();}}});
  }
  function clearWorldAvatarV3(){
    const attachments=playerModel?.userData?.worldAvatarV3Attachments||[];
    for(const attachment of attachments){attachment.parent?.remove(attachment);disposeWorldAvatarObject(attachment);}
    if(playerModel)playerModel.userData.worldAvatarV3Attachments=[];
  }
  function worldAvatarMaterial(color,options={}){
    const material=new THREE.MeshStandardMaterial({color:new THREE.Color(color),roughness:Number(options.roughness??.48),metalness:Number(options.metalness??.04),transparent:!!options.transparent,opacity:Number(options.opacity??1),emissive:new THREE.Color(options.emissive??0x000000),emissiveIntensity:Number(options.emissiveIntensity??0)});material.userData.otthiWorldAvatarMaterial=true;return material;
  }
  function worldAvatarLayer(parent,name){
    const group=new THREE.Group();group.name=`OTTHI_WORLD_AVATAR_V3_${name}`;parent?.add(group);playerModel.userData.worldAvatarV3Attachments=playerModel.userData.worldAvatarV3Attachments||[];playerModel.userData.worldAvatarV3Attachments.push(group);return group;
  }
  function avatarV3Box(parent,w,h,d,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);if(state.settings?.worldOutlines!==false)addVoxelOutline(mesh,0x102238,.22);return mesh;}
  function avatarV3Sphere(parent,r,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function avatarPatternColor(){return state.avatar.pattern==='world-star'?0xffd84d:state.avatar.pattern==='world-pixels'?0x5ad7ff:state.avatar.pattern==='world-stripe'?0xffffff:state.avatar.secondaryColor;}
  function hideLegacyAvatarForToySkin(){
    const parts=playerModel?.userData?.parts;if(!parts)return;const bodyRoot=parts.body?.parent;
    for(const child of bodyRoot?.children||[]){if(child?.isMesh){if(child===parts.head){if(!child.userData.otthiHiddenBaseMaterial){child.userData.otthiHiddenBaseMaterial=child.material;child.material=child.material.clone();child.material.visible=false;}for(const nested of child.children||[])if(nested?.userData?.v615Outline)nested.visible=false;}else child.visible=false;}}
    for(const part of[parts.body,parts.leftArm,parts.rightArm,parts.leftLeg,parts.rightLeg])for(const child of part?.children||[])if(child?.isMesh)child.visible=false;
    if(avatarLayer)avatarLayer.visible=false;for(const attachment of playerModel?.userData?.avatarAttachments||[])attachment.visible=false;
  }
  function toySkinBox(parent,w,h,d,material,x=0,y=0,z=0){return avatarV3Box(parent,w,h,d,material,x,y,z);}
  function toySkinSphere(parent,r,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){return avatarV3Sphere(parent,r,material,x,y,z,sx,sy,sz);}
  function toySkinCylinder(parent,r,h,material,x=0,y=0,z=0,sides=20){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,sides),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);if(state.settings?.worldOutlines!==false)addVoxelOutline(mesh,0x102238,.18);return mesh;}
  function toySkinApplyFace(headLayer,theme,skin,eye,mouth){
    if(theme==='minecraft'){toySkinBox(headLayer,.13,.08,.04,eye,-.18,.08,.53);toySkinBox(headLayer,.13,.08,.04,eye,.18,.08,.53);toySkinBox(headLayer,.26,.05,.04,mouth,0,-.18,.53);return;}
    if(theme==='lego'){toySkinSphere(headLayer,.052,eye,-.16,.07,.37);toySkinSphere(headLayer,.052,eye,.16,.07,.37);toySkinBox(headLayer,.24,.045,.028,mouth,0,-.14,.38);return;}
    if(theme==='playmobil'){
      // O rosto precisa ficar SOBRE a superfície da cabeça, não enterrado dentro da esfera.
      toySkinSphere(headLayer,.057,eye,-.16,.08,.585,1,1.05,.72);toySkinSphere(headLayer,.057,eye,.16,.08,.585,1,1.05,.72);
      toySkinBox(headLayer,.24,.045,.026,mouth,0,-.16,.592);toySkinSphere(headLayer,.045,skin,0,-.035,.59,1.1,.9,.55);return;
    }
    const marioFace=theme==='mario-world'||theme==='luigi-world';if(marioFace){
      toySkinSphere(headLayer,.055,eye,-.17,.09,.595,1,1.05,.72);toySkinSphere(headLayer,.055,eye,.17,.09,.595,1,1.05,.72);
      toySkinSphere(headLayer,.115,skin,0,-.02,.62,1.35,1,1);const mustache=worldAvatarMaterial(0x2b1712,{roughness:.7});toySkinBox(headLayer,.21,.05,.027,mustache,-.09,-.15,.605);toySkinBox(headLayer,.21,.05,.027,mustache,.09,-.15,.605);return;
    }
  }
  function toySkinApplyLegacyOptions(theme,bodyLayer,headLayer,backLayer,primary,secondary,accent,hairMat){
    const uniform=typeof effectiveAvatarUniform==='function'?effectiveAvatarUniform():'none';
    if(state.avatar.hat==='cap'){const cap=worldAvatarLayer(playerModel.userData.parts.head,'THEME_CAP');if(theme==='minecraft'){toySkinBox(cap,1.06,.18,1.06,primary,0,.58,0);toySkinBox(cap,.72,.09,.32,primary,0,.54,.48);}else{toySkinSphere(cap,.62,primary,0,.43,0,1.12,.34,1.12);toySkinBox(cap,.72,.09,.34,primary,0,.37,.43);}}
    else if(state.avatar.hat==='crown'){const crown=worldAvatarLayer(playerModel.userData.parts.head,'THEME_CROWN');toySkinBox(crown,.82,.18,.82,accent,0,.56,0);for(const x of[-.28,0,.28])toySkinBox(crown,.14,.28,.14,accent,x,.76,0);}
    else if(state.avatar.hat==='helmet'){const helm=worldAvatarLayer(playerModel.userData.parts.head,'THEME_HELMET');if(theme==='minecraft')toySkinBox(helm,1.1,.42,1.1,secondary,0,.48,0);else toySkinSphere(helm,.64,secondary,0,.25,0,1.08,.68,1.08);}
    if(state.avatar.accessory==='backpack'){toySkinBox(backLayer,.76,.9,.34,secondary,0,.03,-.55);toySkinBox(backLayer,.48,.24,.12,accent,0,-.22,-.76);}else if(state.avatar.accessory==='cape'){const cape=toySkinBox(backLayer,.9,1.25,.06,primary,0,-.16,-.5);cape.rotation.x=-.08;}else if(state.avatar.accessory==='glasses'){toySkinBox(headLayer,.34,.16,.05,worldAvatarMaterial(0x15191f,{roughness:.35}),-.22,.07,.53);toySkinBox(headLayer,.34,.16,.05,worldAvatarMaterial(0x15191f,{roughness:.35}),.22,.07,.53);toySkinBox(headLayer,.12,.04,.05,worldAvatarMaterial(0x15191f,{roughness:.35}),0,.07,.53);}
    if(uniform&&uniform!=='none'){const badge=worldAvatarLayer(playerModel.userData.parts.body,'THEME_UNIFORM_BADGE'),label=String(uniform).toUpperCase().slice(0,8);const patch=new THREE.Mesh(new THREE.PlaneGeometry(.72,.2),new THREE.MeshStandardMaterial({map:signTexture(label,'#173b59','#ffffff'),transparent:true,roughness:.55,side:THREE.DoubleSide}));patch.position.set(0,.15,.53);badge.add(patch);}
  }
  function applyWorldAvatarV3(){
    if(!playerModel?.userData?.parts)return false;ensureOtthiWorldState();clearWorldAvatarV3();hideLegacyAvatarForToySkin();
    const parts=playerModel.userData.parts,avatar=state.avatar;avatar.bodyStyle=worldAvatarSafeChoice('bodyStyle',avatar.bodyStyle);avatar.face=worldAvatarSafeChoice('face',avatar.face);avatar.hair=worldAvatarSafeChoice('hair',avatar.hair);avatar.torso=worldAvatarSafeChoice('torso',avatar.torso);avatar.legs=worldAvatarSafeChoice('legs',avatar.legs);avatar.shoes=worldAvatarSafeChoice('shoes',avatar.shoes);avatar.back=worldAvatarSafeChoice('back',avatar.back);avatar.pattern=worldAvatarSafeChoice('pattern',avatar.pattern);
    const theme=avatar.bodyStyle,isMario=theme==='mario-world'||theme==='luigi-world',isLuigi=theme==='luigi-world',primary=worldAvatarMaterial(avatar.primaryColor,{roughness:.45}),secondary=worldAvatarMaterial(avatar.secondaryColor,{roughness:.56}),accent=worldAvatarMaterial(avatarPatternColor(),{roughness:.38}),hairMat=worldAvatarMaterial(avatar.hairColor,{roughness:.72}),skin=worldAvatarMaterial(theme==='lego'?0xf3d44e:theme==='playmobil'?0xffd777:0xd9a075,{roughness:.7}),eye=worldAvatarMaterial(0x1b2027,{roughness:.45}),mouth=worldAvatarMaterial(0xa24d5a,{roughness:.5}),white=worldAvatarMaterial(0xf8f8f4,{roughness:.45}),brown=worldAvatarMaterial(0x5b341e,{roughness:.7}),marioShirt=worldAvatarMaterial(isLuigi?0x2e9d4d:0xd83b35,{roughness:.5}),marioOveralls=worldAvatarMaterial(0x245db2,{roughness:.56});
    const headLayer=worldAvatarLayer(parts.head,'THEME_HEAD'),bodyLayer=worldAvatarLayer(parts.body,'THEME_TORSO'),leftArm=worldAvatarLayer(parts.leftArm,'THEME_ARM_LEFT'),rightArm=worldAvatarLayer(parts.rightArm,'THEME_ARM_RIGHT'),leftLeg=worldAvatarLayer(parts.leftLeg,'THEME_LEG_LEFT'),rightLeg=worldAvatarLayer(parts.rightLeg,'THEME_LEG_RIGHT'),backLayer=worldAvatarLayer(parts.body,'THEME_BACK');
    if(theme==='lego'){
      toySkinCylinder(headLayer,.43,.74,skin,0,0,0,28);toySkinCylinder(headLayer,.14,.09,skin,0,.42,0,24);toySkinBox(bodyLayer,1.10,1.02,.74,primary,0,0,0);toySkinBox(bodyLayer,.88,.18,.76,secondary,0,-.52,0);
      for(const arm of[leftArm,rightArm]){toySkinCylinder(arm,.14,.66,primary,0,-.35,0,16);const hand=toySkinCylinder(arm,.16,.14,skin,0,-.78,.02,20);hand.rotation.z=Math.PI/2;}for(const leg of[leftLeg,rightLeg]){toySkinBox(leg,.34,.82,.38,secondary,0,-.4,0);toySkinBox(leg,.4,.17,.52,brown,0,-.92,.09);}
      if(avatar.hair!=='hair-none')for(const[x,z]of[[-.22,-.15],[0,-.18],[.22,-.15],[-.12,.12],[.12,.12]])toySkinCylinder(headLayer,.08,.07,hairMat,x,.44,z,14);
    }else if(theme==='minecraft'){
      toySkinBox(headLayer,1.02,1.02,1.02,skin,0,0,0);toySkinBox(bodyLayer,1.08,1.04,.78,primary,0,0,0);for(const arm of[leftArm,rightArm])toySkinBox(arm,.34,.9,.34,primary,0,-.44,0);for(const leg of[leftLeg,rightLeg]){toySkinBox(leg,.38,.9,.4,secondary,0,-.43,0);toySkinBox(leg,.4,.18,.5,brown,0,-.98,.08);}if(avatar.hair!=='hair-none'){toySkinBox(headLayer,1.05,.2,1.05,hairMat,0,.56,0);toySkinBox(headLayer,.18,.42,1.05,hairMat,-.45,.34,0);toySkinBox(headLayer,.18,.42,1.05,hairMat,.45,.34,0);}
    }else if(theme==='playmobil'){
      toySkinSphere(headLayer,.58,skin,0,0,0,1,1.08,.98);toySkinCylinder(bodyLayer,.48,1.02,primary,0,0,0,24);toySkinCylinder(bodyLayer,.36,.18,secondary,0,-.55,0,22);for(const arm of[leftArm,rightArm]){toySkinCylinder(arm,.13,.68,primary,0,-.34,0,18);toySkinSphere(arm,.16,skin,0,-.76,.02,1,.86,1);}for(const leg of[leftLeg,rightLeg]){toySkinCylinder(leg,.15,.76,secondary,0,-.37,0,18);toySkinBox(leg,.36,.17,.5,brown,0,-.82,.09);}if(avatar.hair!=='hair-none'){toySkinSphere(headLayer,.62,hairMat,0,.22,-.03,1.02,.58,1.02);if(avatar.hair==='hair-curls-01')for(const[x,y,z]of[[-.38,.25,-.1],[-.18,.43,-.12],[.18,.43,-.12],[.38,.25,-.1]])toySkinSphere(headLayer,.18,hairMat,x,y,z);}
    }else if(isMario){
      // Mario/Luigi reconhecíveis: camisa e boné fixos da variante + jardineira azul.
      toySkinSphere(headLayer,.59,skin,0,0,0,1.02,1.04,.98);toySkinCylinder(bodyLayer,.47,.98,marioShirt,0,0,0,22);toySkinBox(bodyLayer,.78,.68,.62,marioOveralls,0,-.12,.02);
      toySkinBox(bodyLayer,.16,.78,.08,marioOveralls,-.25,.08,.36);toySkinBox(bodyLayer,.16,.78,.08,marioOveralls,.25,.08,.36);toySkinSphere(bodyLayer,.055,worldAvatarMaterial(0xffd84d,{roughness:.35}),-.25,.12,.42);toySkinSphere(bodyLayer,.055,worldAvatarMaterial(0xffd84d,{roughness:.35}),.25,.12,.42);
      for(const arm of[leftArm,rightArm]){toySkinCylinder(arm,.13,.66,marioShirt,0,-.32,0,18);toySkinSphere(arm,.18,white,0,-.75,.02,1.08,.92,1.04);}for(const leg of[leftLeg,rightLeg]){toySkinCylinder(leg,.15,.72,marioOveralls,0,-.34,0,18);toySkinBox(leg,.42,.2,.58,brown,0,-.79,.13);}
      const cap=worldAvatarLayer(parts.head,isLuigi?'LUIGI_CAP':'MARIO_CAP');toySkinSphere(cap,.69,marioShirt,0,.45,0,1.17,.34,1.17);toySkinBox(cap,.78,.1,.36,marioShirt,0,.38,.45);const emblem=worldAvatarLayer(parts.head,isLuigi?'LUIGI_EMBLEM':'MARIO_EMBLEM');const badge=new THREE.Mesh(new THREE.CircleGeometry(.13,18),white);badge.position.set(0,.49,.54);emblem.add(badge);const letter=new THREE.Mesh(new THREE.PlaneGeometry(.13,.13),new THREE.MeshStandardMaterial({map:signTexture(isLuigi?'L':'M','#ffffff',isLuigi?'#2e9d4d':'#d83b35'),transparent:true,side:THREE.DoubleSide,roughness:.5}));letter.position.set(0,.49,.547);emblem.add(letter);
    }else{
      toySkinSphere(headLayer,.59,skin,0,0,0,1.02,1.04,.98);toySkinCylinder(bodyLayer,.47,.98,primary,0,0,0,22);toySkinBox(bodyLayer,.78,.68,.62,secondary,0,-.12,.02);
    }
    toySkinApplyFace(headLayer,theme,skin,eye,mouth);
    if(avatar.pattern==='world-stripe'){toySkinBox(bodyLayer,1.0,.14,.08,accent,0,.24,.42);toySkinBox(bodyLayer,1.0,.14,.08,accent,0,-.04,.42);}else if(avatar.pattern==='world-pixels')for(const[x,y]of[[-.28,.24],[0,.04],[.28,.24],[-.28,-.18],[.28,-.18]])toySkinBox(bodyLayer,.14,.14,.08,accent,x,y,.43);else if(avatar.pattern==='world-star'){const star=new THREE.Mesh(new THREE.CircleGeometry(.22,5),accent);star.position.set(0,.12,.48);bodyLayer.add(star);}
    toySkinApplyLegacyOptions(theme,bodyLayer,headLayer,backLayer,primary,secondary,accent,hairMat);playerModel.userData.toyTheme=theme;otthiWorldRuntime.avatarReady=true;return true;
  }
  function worldAvatarOptions(field,title){
    const selected=state.avatar[field];return `<section class="avatar-section world-avatar-section"><h3>${title}</h3><div class="avatar-grid">${OTTHI_WORLD_AVATAR_CATALOG[field].map(([id,name,icon])=>`<button class="avatar-option ${selected===id?'selected':''}" data-world-avatar-field="${field}" data-world-avatar-value="${id}"><b>${icon}</b><span>${name}</span></button>`).join('')}</div></section>`;
  }
  const legacyApplyAvatarCustomization=applyAvatarCustomization;
  applyAvatarCustomization=function applyAvatarCustomizationWorld(){legacyApplyAvatarCustomization();applyWorldAvatarV3();};
  const legacyOpenAvatarStudio=openAvatarStudio;
  openAvatarStudio=function openAvatarStudioWorld(){
    ensureOtthiWorldState();
    openModal(`Personagem — ${playerDisplayName()}`,`<div class="avatar-summary world-avatar-summary"><div class="avatar-face"><i></i><i></i></div><div><b>Personalize seu personagem</b><span>Escolha corpo, rosto, cabelo, roupas, acessórios e cores. Suas escolhas ficam salvas no seu perfil.</span></div></div>${worldAvatarOptions('bodyStyle','Skin / estilo do personagem')}${worldAvatarOptions('face','Expressão')}${worldAvatarOptions('hair','Cabelo')}${worldAvatarOptions('torso','Parte superior')}${worldAvatarOptions('legs','Parte inferior')}${worldAvatarOptions('shoes','Calçados')}${worldAvatarOptions('back','Costas')}${worldAvatarOptions('pattern','Estampa')}<section class="avatar-section"><h3>Cores</h3><div class="world-color-grid"><label>Cor principal<input type="color" data-world-avatar-color="primaryColor" value="${state.avatar.primaryColor}"></label><label>Cor secundária<input type="color" data-world-avatar-color="secondaryColor" value="${state.avatar.secondaryColor}"></label><label>Cabelo<input type="color" data-world-avatar-color="hairColor" value="${state.avatar.hairColor}"></label></div></section>${avatarChoiceGroup('uniform','Uniforme')}${avatarChoiceGroup('hat','Chapéu')}${avatarChoiceGroup('accessory','Acessório')}<div class="modal-actions"><button class="btn primary" data-world-avatar-save>Salvar personagem</button></div>`,root=>{
      $$('[data-world-avatar-field]',root).forEach(button=>button.onclick=()=>{const field=button.dataset.worldAvatarField,value=button.dataset.worldAvatarValue;state.avatar={...state.avatar,[field]:worldAvatarSafeChoice(field,value),renderMode:'otthi-world-v3'};$$(`[data-world-avatar-field="${field}"]`,root).forEach(item=>item.classList.toggle('selected',item===button));applyAvatarCustomization();});
      $$('[data-world-avatar-color]',root).forEach(input=>input.oninput=()=>{state.avatar={...state.avatar,[input.dataset.worldAvatarColor]:safeAvatarColor(input.value,state.avatar[input.dataset.worldAvatarColor])};applyAvatarCustomization();});
      $$('[data-avatar-type]',root).forEach(button=>button.onclick=()=>{state.avatar=updateAvatarV2LegacyChoice(state.avatar,button.dataset.avatarType,button.dataset.avatarId);$$(`[data-avatar-type="${button.dataset.avatarType}"]`,root).forEach(item=>item.classList.toggle('selected',item===button));applyAvatarCustomization();});
      $('[data-world-avatar-save]',root).onclick=()=>{state.avatar=normalizeAvatarV2({...state.avatar,renderMode:'otthi-world-v3'});setFlag('customizedAvatar');setFlag('otthiWorldAvatarV3');saveState(true);closeModal();toast('Personagem salvo no seu perfil.','good',2000);};
      $('[data-world-avatar-legacy]',root)?.addEventListener('click',legacyOpenAvatarStudio);
    });
  };
