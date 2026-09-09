// FILE: assets/render-v48/v48-render-target.js
// ATHOS V48 — RENDER ALVO FIEL / SHADER SAFE
// Camada visual 3D real, sem texturas, sem luzes excessivas, sem mexer na engine.
(function(){
  'use strict';
  const VERSION = 'V50_RENDER_FIEL_IMAGEM_REFERENCIA_LOCKED';
  let installed=false, group=null, THREE_REF=null, currentWorld='campo', rngSeed=1, playerAddon=null, gradedCanvas=null, previousCanvasFilter='';
  let mats={}, geos={}, updatables=[], hidden=[];
  let stats={objects:0, animated:0, hiddenOriginals:0};
  const MAP={field:'campo',training:'campo',hub:'campo',free:'campo',campo:'campo',fire:'vulcao',vulcao:'vulcao',volcano:'vulcao',forest:'floresta',floresta:'floresta',castle:'castelo',castelo:'castelo',space:'espaco',espaco:'espaco','espaço':'espaco',arena:'arena',boss:'arena',real:'real',ar:'real',camera:'real'};
  const PAL={
    campo:{sky:0x79d8ff,fog:0xb9efff,grass:0x38b84a,grass2:0x73e35e,dirt:0x86542b,darkDirt:0x5c351b,path:0xc78c47,stone:0x89939c,wood:0x75451e,water:0x31cfff,lava:0xff4a00,crystal:0x2de6ff,magic:0xd13bff,flower:0xffe56a,enemy:0x35a844},
    vulcao:{sky:0x32120d,fog:0x552113,grass:0x4a3c32,grass2:0x645142,dirt:0x28120d,darkDirt:0x150807,path:0x5f4b3f,stone:0x4d5156,wood:0x5a3017,water:0x1b5f7a,lava:0xff3c00,crystal:0xff7a00,magic:0xff29b6,flower:0xffc400,enemy:0x8b1d1d},
    floresta:{sky:0x0f3625,fog:0x1d5a35,grass:0x177a32,grass2:0x39c755,dirt:0x5d3b20,darkDirt:0x3b2515,path:0x987642,stone:0x6f8069,wood:0x583517,water:0x29b6f6,lava:0xff4a00,crystal:0x52ffc5,magic:0x60ffb1,flower:0xff7ac7,enemy:0x14532d},
    castelo:{sky:0x63758a,fog:0x9aa6b8,grass:0x6f7886,grass2:0x87909c,dirt:0x3e4652,darkDirt:0x2d333d,path:0xa9b1bb,stone:0x7f8794,wood:0x6b421d,water:0x49bdf2,lava:0xff6a00,crystal:0xf2c94c,magic:0xa855f7,flower:0xffd166,enemy:0x5f6875},
    espaco:{sky:0x03071f,fog:0x071027,grass:0x263451,grass2:0x394b74,dirt:0x101827,darkDirt:0x050814,path:0x2e3d61,stone:0x46567c,wood:0x3f2a57,water:0x38bdf8,lava:0xff5a00,crystal:0x60a5fa,magic:0xc084fc,flower:0x67e8f9,enemy:0x111827},
    arena:{sky:0x2a1605,fog:0x5a2e0d,grass:0x7c3f18,grass2:0xa35d25,dirt:0x3c1f0d,darkDirt:0x241207,path:0x8b5a2b,stone:0x766657,wood:0x744318,water:0x38bdf8,lava:0xff5a00,crystal:0xff2e63,magic:0xff7a18,flower:0xffcc33,enemy:0x111827}
  };
  function norm(w){return MAP[String(w||'campo').toLowerCase()]||'campo'}
  function safe(fn){return function(){try{return fn.apply(this,arguments)}catch(e){console.warn('[V50 Render alvo protegido]',e);return null}}}
  function reseed(world){let s=2166136261; String(world||'campo').split('').forEach(ch=>{s^=ch.charCodeAt(0);s=Math.imul(s,16777619)}); rngSeed=s>>>0 || 1}
  function rnd(){rngSeed=(Math.imul(rngSeed,1664525)+1013904223)>>>0; return rngSeed/4294967296}
  function sign(){return rnd()>.5?1:-1}
  function makeMat(THREE,color,opt){opt=opt||{}; return new THREE.MeshLambertMaterial({color, transparent:!!opt.transparent, opacity:opt.opacity==null?1:opt.opacity, emissive:opt.emissive||0x000000, emissiveIntensity:opt.emissiveIntensity||0});}
  function makeBasic(THREE,color,opt){opt=opt||{}; return new THREE.MeshBasicMaterial({color, transparent:!!opt.transparent, opacity:opt.opacity==null?1:opt.opacity, side:opt.side||THREE.FrontSide});}
  function paletteKey(pal){return [pal.sky,pal.fog,pal.grass,pal.grass2,pal.dirt,pal.path,pal.stone,pal.crystal,pal.magic,pal.enemy].join('|')}
  function init(THREE,pal){
    const key=paletteKey(pal);
    if(THREE_REF===THREE && mats.grass && mats._key===key) return; THREE_REF=THREE; mats={_key:key}; geos={};
    geos.box=new THREE.BoxGeometry(1,1,1); geos.plane=new THREE.PlaneGeometry(1,1); geos.crystal=new THREE.OctahedronGeometry(.52,0); geos.ring=new THREE.TorusGeometry(1,.08,8,36); geos.circle=new THREE.CircleGeometry(1,24);
    mats.grass=makeMat(THREE,pal.grass); mats.grass2=makeMat(THREE,pal.grass2); mats.dirt=makeMat(THREE,pal.dirt); mats.darkDirt=makeMat(THREE,pal.darkDirt); mats.path=makeMat(THREE,pal.path); mats.stone=makeMat(THREE,pal.stone); mats.wood=makeMat(THREE,pal.wood);
    mats.water=makeMat(THREE,pal.water,{transparent:true,opacity:.72,emissive:pal.water,emissiveIntensity:.16}); mats.lava=makeMat(THREE,pal.lava,{emissive:pal.lava,emissiveIntensity:.9});
    mats.crystal=makeMat(THREE,pal.crystal,{transparent:true,opacity:.94,emissive:pal.crystal,emissiveIntensity:.85}); mats.crystal2=makeMat(THREE,pal.magic,{transparent:true,opacity:.92,emissive:pal.magic,emissiveIntensity:.78});
    mats.portal=makeBasic(THREE,pal.magic,{transparent:true,opacity:.82,side:THREE.DoubleSide}); mats.enemy=makeMat(THREE,pal.enemy); mats.enemyDark=makeMat(THREE,0x111827,{emissive:pal.magic,emissiveIntensity:.22}); mats.eye=makeBasic(THREE,0xff0022); mats.flower=makeMat(THREE,pal.flower,{emissive:pal.flower,emissiveIntensity:.10}); mats.white=makeBasic(THREE,0xffffff); mats.shadow=makeBasic(THREE,0x000000,{transparent:true,opacity:.18});
  }
  function resetStats(){stats={objects:0,animated:0,hiddenOriginals:0}}
  function add(o){if(group&&o){group.add(o);stats.objects++} return o}
  function block(THREE,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geos.box,mat);m.position.set(x,y,z);m.scale.set(sx||1,sy||1,sz||1);m.castShadow=true;m.receiveShadow=true;return add(m)}
  function hideOriginals(ctx){
    hidden.forEach(o=>{try{o.visible=true}catch{}}); hidden=[];
    const visit=o=>{if(!o||o===group)return; if(o.isObject3D){ if(o.visible!==false){hidden.push(o); o.visible=false; stats.hiddenOriginals++;}}};
    if(ctx.levelGroup && typeof ctx.levelGroup.traverse==='function') ctx.levelGroup.traverse(visit);
    ['objects','crystals'].forEach(k=>(ctx[k]||[]).forEach(o=>{ if(o&&o.visible!==false){hidden.push(o);o.visible=false;stats.hiddenOriginals++;}}));
    (ctx.enemies||[]).forEach(e=>{const m=e&&e.mesh; if(m&&m.visible!==false){hidden.push(m);m.visible=false;stats.hiddenOriginals++;}});
    if(ctx.portal&&ctx.portal.visible!==false){hidden.push(ctx.portal);ctx.portal.visible=false;stats.hiddenOriginals++;}
  }
  function restoreOriginals(){hidden.forEach(o=>{try{o.visible=true}catch{}}); hidden=[];}
  function applyCanvasGrade(ctx){
    const el=ctx&&ctx.renderer&&ctx.renderer.domElement;
    if(!el||!el.style)return;
    if(gradedCanvas!==el){ if(gradedCanvas&&gradedCanvas.style) gradedCanvas.style.filter=previousCanvasFilter||''; gradedCanvas=el; previousCanvasFilter=el.style.filter||''; }
    el.style.filter='saturate(1.45) contrast(1.18) brightness(.92)';
  }
  function restoreCanvasGrade(){if(gradedCanvas&&gradedCanvas.style)gradedCanvas.style.filter=previousCanvasFilter||''; gradedCanvas=null; previousCanvasFilter='';}
  function setupScene(THREE,ctx,pal,world){
    if(ctx.scene){ctx.scene.background=new THREE.Color(pal.sky); ctx.scene.fog=new THREE.Fog(pal.fog,78,230);}
    if(ctx.renderer){ctx.renderer.setClearColor(pal.sky,1); ctx.renderer.toneMappingExposure=.88; if(ctx.renderer.shadowMap) ctx.renderer.shadowMap.enabled=true; applyCanvasGrade(ctx);}
    if(ctx.camera && ctx.camera.fov){ctx.camera.fov=47; ctx.camera.updateProjectionMatrix&&ctx.camera.updateProjectionMatrix();}
    const amb=new THREE.HemisphereLight(0xffffff,pal.grass,.46); add(amb);
    const sun=new THREE.DirectionalLight(0xfff2c4,.94); sun.position.set(-16,26,12); sun.castShadow=false; add(sun);
    const rim=new THREE.DirectionalLight(pal.magic,.34); rim.position.set(14,11,-28); add(rim);
  }
  function clearPlayerAddon(){if(playerAddon&&playerAddon.parent)playerAddon.parent.remove(playerAddon); playerAddon=null}
  function enhancePlayer(THREE,ctx,pal){
    clearPlayerAddon();
    if(!ctx||!ctx.player)return;
    const g=new THREE.Group(); g.name='V50_PLAYER_REFERENCE_FLAMES';
    const flameA=makeMat(THREE,0xff2d00,{emissive:0xff2d00,emissiveIntensity:.72});
    const flameB=makeMat(THREE,0xff8a00,{emissive:0xff8a00,emissiveIntensity:.65});
    const flameC=makeMat(THREE,0xfff000,{emissive:0xfff000,emissiveIntensity:.55});
    const part=(mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geos.box,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m)};
    [-1,1].forEach(side=>{part(flameA,side*.78,.72,.25,.22,.42,.22);part(flameB,side*.78,.98,.25,.18,.30,.18);part(flameC,side*.78,1.18,.25,.12,.22,.12);part(flameA,side*.25,.08,.18,.28,.20,.30);part(flameB,side*.25,.22,.20,.22,.18,.24)});
    ctx.player.add(g); playerAddon=g;
  }
  function makeTerrain(THREE,pal,world,len){
    const step=2;
    for(let z=10; z>-len; z-=step){
      block(THREE,mats.path,0,.02,z,5.2,.24,2.04);
      // central broken stones in path
      if(Math.abs(z)%10===0){ block(THREE,mats.stone,(rnd()-.5)*2.8,.22,z-.5,.55,.12,.75); }
      for(const side of [-1,1]){
        const baseX=side*5.2;
        const h1=.45+((Math.sin(z*.14+side)>0)? .35:0);
        block(THREE,mats.dirt,baseX,h1/2-.12,z,3.5,h1,2.05);
        block(THREE,(rnd()>.25?mats.grass:mats.grass2),baseX,h1+.03,z,3.55,.18,2.05);
        if(Math.abs(z)%8===0){ block(THREE,mats.grass,side*(8+rnd()*2.6),.25,z,2.8,.5,2.4); }
        if(Math.abs(z)%18===0) flower(THREE,side*(4.2+rnd()*4),z+.5,pal);
        if(Math.abs(z)%28===0) mushroom(THREE,side*(4.8+rnd()*3.2),z-1.2);
        if(Math.abs(z)%36===0) tree(THREE,side*(8.8+rnd()*3.5),z-2,Math.abs(z)%72===0);
      }
    }
    // nearer foreground lush blocks like reference
    for(let i=0;i<40;i++){const side=sign(); const z=8-rnd()*85; const x=side*(7+rnd()*13); const h=.6+rnd()*2.8; const sx=2+rnd()*3, sz=2+rnd()*3; block(THREE,mats.dirt,x,h/2,z,sx,h,sz); block(THREE,mats.grass,x,h+.12,z,sx+.1,.22,sz+.1);}
  }
  function flower(THREE,x,z,pal){block(THREE,makeMat(THREE,0x219a3a),x,.36,z,.11,.72,.11); block(THREE,mats.flower,x,.78,z,.38,.22,.38)}
  function mushroom(THREE,x,z){block(THREE,makeMat(THREE,0xfff3d6),x,.35,z,.32,.7,.32); block(THREE,makeMat(THREE,0xe53e3e),x,.82,z,.96,.36,.96); block(THREE,mats.white,x+.18,1.02,z+.16,.18,.08,.18); block(THREE,mats.white,x-.22,1.02,z-.12,.16,.08,.16)}
  function tree(THREE,x,z,tall){const h=tall?3.4:2.4; block(THREE,mats.wood,x,h/2,z,.65,h,.65); block(THREE,mats.grass2,x,h+1,z,3.0,1.9,3.0); block(THREE,mats.grass,x,h+2.05,z,2.1,1.3,2.1)}
  function crystal(THREE,x,y,z,purple){const c=new THREE.Mesh(geos.crystal,purple?mats.crystal2:mats.crystal);c.position.set(x,y,z);c.scale.set(.95,1.9,.95);c.castShadow=true;add(c);updatables.push(dt=>{c.rotation.y+=dt*1.35;c.position.y=y+Math.sin(performance.now()*.002+z)*.15});stats.animated++; return c}
  function enemies(THREE,len){enemy(THREE,'green',4.1,.4,-18); enemy(THREE,'flyer',-2.7,3.0,-34); enemy(THREE,'golem',-7.4,1.6,-56); enemy(THREE,'green',5.6,.6,-72); enemy(THREE,'spiky',-4.7,.6,-94);}
  function enemy(THREE,type,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);const mat=type==='flyer'?mats.enemyDark:type==='golem'?mats.stone:mats.enemy;const s=type==='golem'?1.7:type==='spiky'?1.35:1.25; const body=new THREE.Mesh(geos.box,mat);body.position.y=s/2;body.scale.set(s,s,s);body.castShadow=true;g.add(body);const e1=new THREE.Mesh(geos.box,mats.eye),e2=new THREE.Mesh(geos.box,mats.eye);e1.scale.set(.24,.18,.08);e2.scale.copy(e1.scale);e1.position.set(-s*.23,s*.62,s*.52);e2.position.set(s*.23,s*.62,s*.52);g.add(e1,e2); if(type==='spiky'){for(let i=0;i<5;i++){const sp=new THREE.Mesh(geos.box,mats.stone);sp.position.set((i-2)*.35,s+.2,(i%2-.5)*.55);sp.scale.set(.18,.44,.18);g.add(sp)}} if(type==='golem'){for(const side of [-1,1]){const a=new THREE.Mesh(geos.box,mat);a.scale.set(.5,1.35,.5);a.position.set(side*s*.78,s*.45,0);g.add(a)}} const sh=new THREE.Mesh(geos.circle,mats.shadow);sh.rotation.x=-Math.PI/2;sh.position.y=.025;sh.scale.set(s*1.35,s*1.35,1);g.add(sh);add(g); updatables.push(dt=>{if(type==='flyer'){g.rotation.y+=dt*.55;g.position.y=y+Math.sin(performance.now()*.002+x)*.45}else{g.scale.y=1+Math.sin(performance.now()*.005+x)*.035}}); stats.animated++;}
  function portal(THREE,pal,z){const g=new THREE.Group();g.position.set(0,0,z);add(g);const addp=(o)=>{g.add(o);stats.objects++;return o}; for(let i=0;i<5;i++){const s=new THREE.Mesh(geos.box,mats.stone);s.position.set(0,.16+i*.18,2.6-i*.62);s.scale.set(8.8-i*.9,.32,1.15);s.castShadow=true;addp(s)} for(const side of [-1,1]){const p=new THREE.Mesh(geos.box,mats.stone);p.position.set(side*3.2,2.7,0);p.scale.set(1.25,5.4,1.3);p.castShadow=true;addp(p)} const top=new THREE.Mesh(geos.box,mats.stone);top.position.set(0,5.35,0);top.scale.set(8,1.05,1.4);addp(top); const core=new THREE.Mesh(geos.plane,mats.portal);core.position.set(0,2.75,.12);core.scale.set(4.6,5.05,1);addp(core); const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.08,8,44),mats.portal);ring.position.copy(core.position);addp(ring); for(let i=0;i<9;i++) crystal(THREE,sign()*(4+rnd()*3),1+rnd()*2,z+2-rnd()*7,true); updatables.push(dt=>{core.rotation.z+=dt*.42; ring.rotation.z-=dt*.24});stats.animated++;}
  function waterLava(THREE,pal,world){for(let z=-18;z>-105;z-=28){block(THREE,mats.water,-14,3.8,z,3.2,7.6,.32); block(THREE,mats.water,-14,.08,z+2.6,5,.16,3.2)} if(world==='campo'||world==='vulcao'||world==='arena'){block(THREE,mats.lava,13,.05,-35,7,.18,16);block(THREE,mats.lava,13,.05,-80,7,.18,15)}}
  function floating(THREE,pal){for(let i=0;i<18;i++){const x=(rnd()-.5)*72;const z=-35-rnd()*130;const y=5+rnd()*13;const sx=3+rnd()*8,sz=3+rnd()*8; block(THREE,mats.dirt,x,y,z,sx,1.2+rnd()*2.2,sz); block(THREE,mats.grass,x,y+1,z,sx,.22,sz); if(rnd()>.55) crystal(THREE,x,y+2.2,z,rnd()>.5)}}
  const api={version:VERSION, install:safe(function(ctx){if(installed)return; if(!ctx||!ctx.THREE||!ctx.scene)return; installed=true; document.body.classList.add('v48-target-active','v50-reference-active');}), update:safe(function(ctx,dt){if(!installed||!group)return;dt=dt||.016;updatables.forEach(fn=>fn(dt));}), rebuildWorld:safe(function(ctx,worldName){if(!installed||!ctx||!ctx.THREE||!ctx.scene)return; currentWorld=norm(worldName); reseed(currentWorld); this.disposeVisualsOnly(); if(currentWorld==='real'){restoreOriginals();return} const THREE=ctx.THREE,pal=PAL[currentWorld]||PAL.campo; init(THREE,pal); group=new THREE.Group(); group.name='V50_RENDER_REFERENCE_GROUP'; ctx.scene.add(group); resetStats(); hideOriginals(ctx); setupScene(THREE,ctx,pal,currentWorld); enhancePlayer(THREE,ctx,pal); const len=Math.min(240,Math.max(150,Number(ctx.level&&ctx.level.length||220))); makeTerrain(THREE,pal,currentWorld,len); for(let z=-8;z>-len+20;z-=24){crystal(THREE,sign()*(1.2+rnd()*2.1),1.15,z,false)} enemies(THREE,len); waterLava(THREE,pal,currentWorld); floating(THREE,pal); portal(THREE,pal,-len+20);}), disposeVisualsOnly:safe(function(){restoreCanvasGrade(); clearPlayerAddon(); if(group){group.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();}); if(group.parent)group.parent.remove(group)} group=null; updatables=[];}), dispose:safe(function(){this.disposeVisualsOnly(); restoreOriginals(); installed=false; document.body.classList.remove('v48-target-active','v50-reference-active');}), getStatus:function(){return{version:VERSION,installed,world:currentWorld,hasGroup:!!group,objects:stats.objects,animated:stats.animated,hiddenOriginals:stats.hiddenOriginals,shaderSafe:true,textureSamplers:0,deterministic:true,target:'whatsapp_2026_07_07_voxel_portal_reference'}}};
  window.ATHOS_V50_RENDER_TARGET=api;
  window.ATHOS_V48_RENDER_TARGET=api;
})();
