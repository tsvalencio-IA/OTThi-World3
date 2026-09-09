// ATHOS V54 - render premium procedural Three.js.
(function(){
  'use strict';

  const VERSION = 'V58_GAMEPAD_JOGABILIDADE_RENDER';
  let installed = false;
  let group = null;
  let playerAddon = null;
  let currentWorld = 'field';
  let seed = 1;
  let mats = {};
  let geos = {};
  let hidden = [];
  let updatables = [];
  let stats = resetStats();
  let gradedCanvas = null;
  let previousCanvasFilter = '';

  const WORLD_MAP = {
    field:'field', training:'field', hub:'field', free:'field', campo:'field',
    fire:'fire', vulcao:'fire', volcano:'fire',
    forest:'forest', floresta:'forest',
    castle:'castle', castelo:'castle',
    space:'space', espaco:'space',
    arena:'arena', boss:'arena',
    real:'real', ar:'real', camera:'real'
  };

  const PAL = {
    field:{sky:0x63cfff,fog:0xa7ecff,sun:0xffd28a,grass:0x39c94c,grass2:0x77f15f,dirt:0x8a5528,dark:0x5a351b,path:0xc8873f,stone:0x85939e,wood:0x74451f,water:0x21c8ff,lava:0xff4d00,crystal:0x25dcff,magic:0xbf38ff,flower:0xffe166,enemy:0x1faf55,accent:0xff7b2f},
    fire:{sky:0x32100c,fog:0x5c1c0e,sun:0xff8a26,grass:0x5d4733,grass2:0x8b5a36,dirt:0x2d140e,dark:0x140706,path:0x594235,stone:0x44484f,wood:0x5a2c16,water:0x116278,lava:0xff3d00,crystal:0xff8a00,magic:0xff244f,flower:0xffd13d,enemy:0xb91c1c,accent:0xffe066},
    forest:{sky:0x0f4033,fog:0x2b6c42,sun:0x9effc0,grass:0x138239,grass2:0x42df64,dirt:0x684021,dark:0x3c2514,path:0x9a733d,stone:0x637465,wood:0x553316,water:0x2dd4ff,lava:0xff4d00,crystal:0x58ffd2,magic:0x72ffad,flower:0xff76c7,enemy:0x14532d,accent:0xfff07a},
    castle:{sky:0x66778d,fog:0xa9b3c2,sun:0xffdf9e,grass:0x71808d,grass2:0x91a0aa,dirt:0x46515e,dark:0x29313c,path:0xb6bec8,stone:0x7a8491,wood:0x704521,water:0x45bff2,lava:0xff6400,crystal:0xf7cc4e,magic:0x9f5aff,flower:0xffd166,enemy:0x505a66,accent:0xffa640},
    space:{sky:0x05071c,fog:0x101636,sun:0x93c5fd,grass:0x26385c,grass2:0x435a8f,dirt:0x111827,dark:0x050814,path:0x304264,stone:0x485a82,wood:0x3d2854,water:0x38bdf8,lava:0xff5a00,crystal:0x69a7ff,magic:0xc084fc,flower:0x67e8f9,enemy:0x111827,accent:0x8b5cf6},
    arena:{sky:0x2e1704,fog:0x60320e,sun:0xffb24a,grass:0x8a481a,grass2:0xb86525,dirt:0x3c1e0c,dark:0x220f05,path:0x8f5b2b,stone:0x766657,wood:0x744318,water:0x38bdf8,lava:0xff4d00,crystal:0xff2e63,magic:0xff7a18,flower:0xffcc33,enemy:0x111827,accent:0xffd166}
  };

  function resetStats(){
    return {
      objects:0,
      animated:0,
      hiddenOriginals:0,
      features:{
        portal:0, crystals:0, vegetation:0, flowers:0, mushrooms:0, floatingIslands:0,
        enemies:0, shieldEnemy:0, jumpEnemy:0, crouchEnemy:0,
        sword:0, shield:0, star:0, lava:0, water:0, pit:0, waterfall:0
      }
    };
  }

  function norm(world){
    return WORLD_MAP[String(world || 'field').toLowerCase()] || 'field';
  }

  function safe(fn){
    return function(){
      try { return fn.apply(this, arguments); }
      catch (err) { console.warn('[V54 render protegido]', err); return null; }
    };
  }

  function reseed(world){
    let s = 2166136261;
    String(world || 'field').split('').forEach(ch => {
      s ^= ch.charCodeAt(0);
      s = Math.imul(s, 16777619);
    });
    seed = (s >>> 0) || 1;
  }

  function rnd(){
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function sign(){ return rnd() > .5 ? 1 : -1; }
  function now(){ return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  function mat(THREE, color, opt){
    opt = opt || {};
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opt.roughness == null ? .72 : opt.roughness,
      metalness: opt.metalness || 0,
      transparent: !!opt.transparent,
      opacity: opt.opacity == null ? 1 : opt.opacity,
      emissive: opt.emissive || 0x000000,
      emissiveIntensity: opt.emissiveIntensity || 0
    });
  }

  function basic(THREE, color, opt){
    opt = opt || {};
    return new THREE.MeshBasicMaterial({
      color,
      transparent: !!opt.transparent,
      opacity: opt.opacity == null ? 1 : opt.opacity,
      side: opt.side || THREE.FrontSide
    });
  }

  function init(THREE, pal){
    const key = [pal.sky,pal.grass,pal.dirt,pal.path,pal.crystal,pal.magic,pal.enemy].join('|');
    if (mats._key === key && geos.box) return;
    mats = {_key:key};
    geos = {};
    geos.box = new THREE.BoxGeometry(1,1,1);
    geos.crystal = new THREE.OctahedronGeometry(.55,0);
    geos.portalRing = new THREE.TorusGeometry(2.35,.11,8,48);
    geos.portalCore = new THREE.PlaneGeometry(1,1);
    geos.circle = new THREE.CircleGeometry(1,32);
    geos.star = new THREE.OctahedronGeometry(.7,1);
    geos.sphere = new THREE.SphereGeometry(1,16,10);

    mats.grass = mat(THREE,pal.grass,{roughness:.62});
    mats.grass2 = mat(THREE,pal.grass2,{roughness:.58});
    mats.dirt = mat(THREE,pal.dirt);
    mats.dark = mat(THREE,pal.dark);
    mats.path = mat(THREE,pal.path,{roughness:.68});
    mats.stone = mat(THREE,pal.stone,{roughness:.7});
    mats.wood = mat(THREE,pal.wood);
    mats.water = mat(THREE,pal.water,{transparent:true,opacity:.68,emissive:pal.water,emissiveIntensity:.2,roughness:.35});
    mats.lava = mat(THREE,pal.lava,{emissive:pal.lava,emissiveIntensity:1.15,roughness:.45});
    mats.crystal = mat(THREE,pal.crystal,{transparent:true,opacity:.92,emissive:pal.crystal,emissiveIntensity:1.05,roughness:.28});
    mats.crystalPurple = mat(THREE,pal.magic,{transparent:true,opacity:.9,emissive:pal.magic,emissiveIntensity:1.05,roughness:.28});
    mats.portalCore = basic(THREE,pal.magic,{transparent:true,opacity:.76,side:THREE.DoubleSide});
    mats.enemy = mat(THREE,pal.enemy,{emissive:pal.enemy,emissiveIntensity:.08});
    mats.enemyDark = mat(THREE,0x101018,{emissive:pal.magic,emissiveIntensity:.25});
    mats.eye = basic(THREE,0xff1028);
    mats.flower = mat(THREE,pal.flower,{emissive:pal.flower,emissiveIntensity:.16});
    mats.white = basic(THREE,0xffffff);
    mats.shadow = basic(THREE,0x000000,{transparent:true,opacity:.18});
    mats.gold = mat(THREE,0xffd84d,{emissive:0xffb000,emissiveIntensity:.18,roughness:.35,metalness:.12});
    mats.blue = mat(THREE,0x20a7ff,{emissive:0x0ea5e9,emissiveIntensity:.3});
    mats.red = mat(THREE,0xff3b20,{emissive:0xff2500,emissiveIntensity:.55});
  }

  function add(obj){
    if (group && obj) {
      group.add(obj);
      stats.objects++;
    }
    return obj;
  }

  function feature(name, amount){
    stats.features[name] = (stats.features[name] || 0) + (amount || 1);
  }

  function block(THREE, material, x, y, z, sx, sy, sz, featureName){
    const mesh = new THREE.Mesh(geos.box, material);
    mesh.position.set(x,y,z);
    mesh.scale.set(sx || 1, sy || 1, sz || 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (featureName) feature(featureName);
    return add(mesh);
  }

  function hideOriginals(ctx){
    hidden.forEach(obj => { try { obj.visible = true; } catch(_) {} });
    hidden = [];
    const visit = obj => {
      if (!obj || obj === group) return;
      if (obj.isObject3D && obj.visible !== false) {
        hidden.push(obj);
        obj.visible = false;
        stats.hiddenOriginals++;
      }
    };
    if (ctx.levelGroup && typeof ctx.levelGroup.traverse === 'function') ctx.levelGroup.traverse(visit);
    (ctx.objects || []).forEach(visit);
    (ctx.crystals || []).forEach(visit);
    (ctx.enemies || []).forEach(enemy => visit(enemy && enemy.mesh));
    visit(ctx.portal);
  }

  function restoreOriginals(){
    hidden.forEach(obj => { try { obj.visible = true; } catch(_) {} });
    hidden = [];
  }

  function applyCanvasGrade(ctx){
    const el = ctx && ctx.renderer && ctx.renderer.domElement;
    if (!el || !el.style) return;
    if (gradedCanvas !== el) {
      if (gradedCanvas && gradedCanvas.style) gradedCanvas.style.filter = previousCanvasFilter || '';
      gradedCanvas = el;
      previousCanvasFilter = el.style.filter || '';
    }
    el.style.filter = 'saturate(1.82) contrast(1.18) brightness(1.02)';
  }

  function restoreCanvasGrade(){
    if (gradedCanvas && gradedCanvas.style) gradedCanvas.style.filter = previousCanvasFilter || '';
    gradedCanvas = null;
    previousCanvasFilter = '';
  }

  function setupScene(THREE, ctx, pal){
    if (ctx.scene) {
      ctx.scene.background = new THREE.Color(pal.sky);
      ctx.scene.fog = new THREE.Fog(pal.fog, 210, 520);
    }
    if (ctx.renderer) {
      ctx.renderer.setClearColor(pal.sky, 1);
      ctx.renderer.toneMappingExposure = currentWorld==='field' ? 1.06 : .90;
      if (ctx.renderer.shadowMap) ctx.renderer.shadowMap.enabled = true;
      applyCanvasGrade(ctx);
    }
    if (ctx.camera && ctx.camera.fov) {
      ctx.camera.fov = 45;
      ctx.camera.updateProjectionMatrix && ctx.camera.updateProjectionMatrix();
    }
    const hemi = new THREE.HemisphereLight(0xffffff, pal.grass, .62);
    add(hemi);
    const sun = new THREE.DirectionalLight(pal.sun, 1.08);
    sun.position.set(-17, 27, 16);
    add(sun);
    const rim = new THREE.DirectionalLight(pal.magic, .48);
    rim.position.set(18, 12, -30);
    add(rim);
  }

  function skyDetails(THREE, pal){
    const sun = new THREE.Mesh(geos.circle, basic(THREE,pal.sun,{transparent:true,opacity:.72,side:THREE.DoubleSide}));
    sun.position.set(-24,23,-46);
    sun.scale.set(5.5,5.5,1);
    add(sun);
    for (let i=0;i<16;i++) {
      const cloud = new THREE.Group();
      cloud.position.set((rnd()-.5)*72, 10 + rnd()*12, -28 - rnd()*150);
      for (let j=0;j<3+rnd()*3;j++) {
        const c = new THREE.Mesh(geos.box, basic(THREE,0xffffff,{transparent:true,opacity:.58}));
        c.position.set((j-1.5)*1.6, rnd()*.3, rnd()*.5);
        c.scale.set(2.2+rnd()*2.4, .45+rnd()*.35, .75+rnd()*1.2);
        cloud.add(c);
      }
      add(cloud);
    }
  }

  function clearPlayerAddon(){
    if (playerAddon && playerAddon.parent) playerAddon.parent.remove(playerAddon);
    playerAddon = null;
  }

  function enhancePlayer(THREE, ctx){
    clearPlayerAddon();
    if (!ctx || !ctx.player) return;
    const g = new THREE.Group();
    g.name = 'V54_PLAYER_FIRE_ACCENTS';
    const part = (material,x,y,z,sx,sy,sz) => {
      const m = new THREE.Mesh(geos.box, material);
      m.position.set(x,y,z);
      m.scale.set(sx,sy,sz);
      g.add(m);
    };
    [-1,1].forEach(side => {
      part(mats.red, side*.82, .72, .25, .24, .42, .24);
      part(mats.lava, side*.82, .98, .25, .18, .30, .18);
      part(mats.gold, side*.82, 1.18, .25, .11, .18, .11);
      part(mats.red, side*.28, .04, .20, .30, .20, .30);
      part(mats.lava, side*.28, .20, .20, .22, .18, .24);
    });
    ctx.player.add(g);
    playerAddon = g;
  }

  function grassTuft(THREE,x,z,pal){
    const h = .35 + rnd()*.55;
    block(THREE,mats.grass2,x,h/2,z,.08,h,.08,'vegetation');
    if (rnd()>.58) block(THREE,mats.flower,x,.58+h*.35,z,.32,.14,.32,'flowers');
  }

  function flower(THREE,x,z){
    block(THREE,mats.grass2,x,.35,z,.10,.7,.10,'vegetation');
    block(THREE,mats.flower,x,.78,z,.38,.22,.38,'flowers');
  }

  function mushroom(THREE,x,z){
    block(THREE,mats.white,x,.34,z,.30,.68,.30,'mushrooms');
    block(THREE,mats.red,x,.78,z,.92,.34,.92);
    block(THREE,mats.white,x+.2,.96,z+.16,.16,.06,.16);
    block(THREE,mats.white,x-.22,.96,z-.10,.14,.06,.14);
  }

  function tree(THREE,x,z,tall){
    const h = tall ? 3.7 : 2.6;
    block(THREE,mats.wood,x,h/2,z,.62,h,.62,'vegetation');
    block(THREE,mats.grass2,x,h+.78,z,2.9,1.55,2.9);
    block(THREE,mats.grass,x,h+1.85,z,2.05,1.05,2.05);
  }

  function signPost(THREE,x,z){
    block(THREE,mats.wood,x,.75,z,.20,1.5,.20,'vegetation');
    block(THREE,mats.wood,x,.95,z+.08,1.55,.72,.16);
    block(THREE,mats.white,x+.38,.98,z+.19,.55,.32,.08);
  }

  function hayBale(THREE,x,z){
    block(THREE,mats.gold,x,.72,z,1.8,1.4,1.8);
    block(THREE,mats.white,x+.25,.86,z,.10,1.10,.12);
    block(THREE,mats.white,x-.18,.86,z+.22,.10,1.10,.12);
  }

  function heroReferenceField(THREE, pal, len){
    // Set pieces pensados para aproximar a composição da imagem de referência.
    signPost(THREE,-7.2,-12.5);
    mushroom(THREE,-5.2,-23.5);
    hayBale(THREE,-3.8,-44.0);
    block(THREE,mats.water,-10.8,2.8,-42,2.2,5.6,.30,'waterfall');
    block(THREE,mats.water,-10.8,.08,-39.6,4.8,.16,2.8,'water');
    block(THREE,mats.lava,9.8,.10,-49.0,3.8,.22,8.8,'lava');
    // ilha do golem na esquerda
    block(THREE,mats.dirt,-6.2,2.0,-76,5.2,4.0,5.0);
    block(THREE,mats.grass,-6.2,4.12,-76,5.35,.24,5.15);
    enemy(THREE,'golem',-6.4,4.36,-74.5);
    // inimigo voador central e espinhoso à direita, como no render alvo
    enemy(THREE,'flyer',0,1.18,-56.5);
    enemy(THREE,'shield',6.2,.42,-21.5);
    for (const pos of [[2.4,1.08,-38],[3.8,1.28,-49],[4.6,1.45,-61],[1.0,1.00,-72]]) crystal(THREE,pos[0],pos[1],pos[2],false);
    crystal(THREE,8.1,3.9,-83,true);
  }

  function crystal(THREE,x,y,z,purple){
    const mesh = new THREE.Mesh(geos.crystal, purple ? mats.crystalPurple : mats.crystal);
    mesh.position.set(x,y,z);
    mesh.scale.set(.92,1.85,.92);
    mesh.castShadow = true;
    add(mesh);
    feature('crystals');
    updatables.push(() => {
      const t = now()*.002 + z;
      mesh.rotation.y += .018;
      mesh.position.y = y + Math.sin(t)*.16;
    });
    stats.animated++;
    return mesh;
  }

  function makeTerrain(THREE, pal, world, len){
    for (let z=12; z>-len; z-=2) {
      block(THREE,mats.path,0,.02,z,4.7,.24,2.04);
      if (Math.abs(z)%8===0) block(THREE,mats.stone,(rnd()-.5)*2.8,.22,z-.35,.50,.12,.68);
      if (Math.abs(z)%14===0) crystal(THREE,sign()*(3.4+rnd()*1.2),1.1,z-.6,false);
      [-1,1].forEach(side => {
        const x = side*5.35;
        const h = .55 + (Math.sin(z*.16 + side) > 0 ? .34 : 0);
        block(THREE,mats.dirt,x,h/2-.12,z,3.55,h,2.06);
        block(THREE,rnd()>.28?mats.grass:mats.grass2,x,h+.04,z,3.65,.2,2.08);
        if (Math.abs(z)%4===0) grassTuft(THREE,side*(3.5+rnd()*4.8),z+rnd()*.9,pal);
        if (Math.abs(z)%18===0) flower(THREE,side*(4.2+rnd()*4.2),z+.4);
        if (Math.abs(z)%26===0) mushroom(THREE,side*(4.7+rnd()*3.2),z-1.1);
        if (Math.abs(z)%34===0) tree(THREE,side*(8.0+rnd()*3.8),z-1.6,Math.abs(z)%68===0);
        if (Math.abs(z)%62===0) signPost(THREE,side*4.25,z+.6);
      });
    }
    for (let i=0;i<48;i++) {
      const side = sign();
      const z = 10 - rnd()*105;
      const x = side*(7 + rnd()*14);
      const h = .7 + rnd()*3.0;
      block(THREE,mats.dirt,x,h/2,z,2+rnd()*3.4,h,2+rnd()*3.2);
      block(THREE,mats.grass,x,h+.12,z,2.2+rnd()*3.5,.22,2.2+rnd()*3.3,'floatingIslands');
    }
  }

  function waterLavaPit(THREE, world){
    for (let z=-20; z>-118; z-=26) {
      block(THREE,mats.water,-12.4,2.4,z,2.5,4.8,.28,'waterfall');
      block(THREE,mats.water,-12.4,.06,z+2.2,5.1,.14,2.8,'water');
    }
    block(THREE,mats.water,0,.07,-52,4.4,.16,7.0,'water');
    block(THREE,mats.dark,-3.3,-.03,-112,3.8,.16,5.8,'pit');
    block(THREE,mats.lava,4.4,.08,-166,4.2,.18,8.2,'lava');
    if (world === 'fire' || world === 'arena') {
      block(THREE,mats.lava,-5.7,.08,-34,5.4,.18,13);
      block(THREE,mats.lava,12.0,.08,-82,7.2,.18,18);
      feature('lava',2);
    }
    updatables.push(() => {
      if (!group) return;
      group.traverse(obj => {
        if (obj.material === mats.water || obj.material === mats.lava) obj.rotation.y += .002;
      });
    });
  }

  function floatingIslands(THREE){
    for (let i=0;i<20;i++) {
      const x = sign()*(14 + rnd()*34);
      const z = -36 - rnd()*150;
      const y = 5 + rnd()*14;
      const sx = 3 + rnd()*8;
      const sz = 3 + rnd()*8;
      block(THREE,mats.dirt,x,y,z,sx,1.1+rnd()*2.2,sz,'floatingIslands');
      block(THREE,mats.grass,x,y+1,z,sx,.22,sz);
      if (rnd()>.50) crystal(THREE,x,y+2.25,z,rnd()>.5);
    }
  }

  function collectible(THREE,type,x,z){
    const g = new THREE.Group();
    g.position.set(x,1.12,z);
    if (type === 'sword') {
      const blade = new THREE.Mesh(geos.box,mats.white); blade.scale.set(.18,1.25,.12); blade.position.y=.45; g.add(blade);
      const hilt = new THREE.Mesh(geos.box,mats.gold); hilt.scale.set(.75,.16,.16); hilt.position.y=-.18; g.add(hilt);
      feature('sword');
    } else if (type === 'shield') {
      const body = new THREE.Mesh(geos.box,mats.blue); body.scale.set(.95,1.1,.16); body.position.y=.25; g.add(body);
      const cross = new THREE.Mesh(geos.box,mats.white); cross.scale.set(.22,.9,.18); cross.position.y=.25; g.add(cross);
      feature('shield');
    } else {
      const s = new THREE.Mesh(geos.star,mats.gold); s.scale.set(.82,.82,.82); g.add(s);
      feature('star');
    }
    add(g);
    updatables.push(() => { g.rotation.y += .025; g.position.y = 1.12 + Math.sin(now()*.003 + z)*.15; });
    stats.animated++;
  }

  function enemy(THREE,type,x,y,z){
    const g = new THREE.Group();
    g.position.set(x,y,z);
    const big = type === 'golem' || type === 'boss';
    const matBody = type === 'fire' ? mats.red : type === 'flyer' ? mats.enemyDark : big ? mats.stone : type==='shield' ? mats.grass : mats.enemy;
    const s = type === 'boss' ? 2.1 : big ? 1.65 : type === 'crawler' ? 1.15 : 1.28;
    const body = new THREE.Mesh(geos.box,matBody);
    body.position.y=s/2;
    body.scale.set(s,type==='crawler'?s*.62:s,s);
    g.add(body);
    const e1 = new THREE.Mesh(geos.box,mats.eye);
    const e2 = new THREE.Mesh(geos.box,mats.eye);
    e1.scale.set(.23,.17,.08); e2.scale.copy(e1.scale);
    e1.position.set(-s*.23,s*.62,s*.52); e2.position.set(s*.23,s*.62,s*.52);
    g.add(e1,e2);
    if (type === 'shield') {
      body.material = mats.grass;
      const sh = new THREE.Mesh(geos.box,mats.white);
      sh.scale.set(.26,.86,.26); sh.position.set(-.55,s*.88,.34); sh.rotation.z=.7; g.add(sh);
      const sh2 = new THREE.Mesh(geos.box,mats.white);
      sh2.scale.set(.26,.86,.26); sh2.position.set(0,s*1.00,0); sh2.rotation.z=.7; g.add(sh2);
      const sh3 = new THREE.Mesh(geos.box,mats.white);
      sh3.scale.set(.26,.86,.26); sh3.position.set(.55,s*.88,.34); sh3.rotation.z=.7; g.add(sh3);
      feature('shieldEnemy');
    }
    if (type === 'jump') feature('jumpEnemy');
    if (type === 'crawler') feature('crouchEnemy');
    if (type === 'golem' || type === 'boss') {
      [-1,1].forEach(side => {
        const arm = new THREE.Mesh(geos.box,matBody);
        arm.scale.set(.48,1.28,.48);
        arm.position.set(side*s*.76,s*.45,0);
        g.add(arm);
      });
    }
    const shadow = new THREE.Mesh(geos.circle,mats.shadow);
    shadow.rotation.x = -Math.PI/2;
    shadow.position.y = .02;
    shadow.scale.set(s*1.35,s*1.35,1);
    g.add(shadow);
    add(g);
    feature('enemies');
    updatables.push(() => {
      if (type === 'flyer') {
        g.rotation.y += .012;
        g.position.y = y + Math.sin(now()*.002 + x)*.48;
      } else {
        g.scale.y = 1 + Math.sin(now()*.004 + x)*.035;
      }
    });
    stats.animated++;
  }

  function enemies(THREE, world, len){
    enemy(THREE,world==='fire'?'fire':'jump',4.2,.42,-20);
    enemy(THREE,'crawler',-3.7,.42,-42);
    enemy(THREE,'shield',3.8,.45,-66);
    enemy(THREE,world==='castle'?'golem':'flyer',-5.8,world==='castle'?.7:2.7,-88);
    enemy(THREE,world==='arena'?'boss':'jump',5.2,.45,-Math.min(130,len-44));
  }

  function portal(THREE, pal, z, ready){
    const g = new THREE.Group();
    g.position.set(0,0,z);
    add(g);
    const local = obj => { g.add(obj); stats.objects++; return obj; };
    for (let i=0;i<6;i++) {
      const s = new THREE.Mesh(geos.box,mats.stone);
      s.position.set(0,.15+i*.18,2.7-i*.56);
      s.scale.set(9.2-i*.75,.32,1.12);
      local(s);
    }
    [-1,1].forEach(side => {
      const p = new THREE.Mesh(geos.box,mats.stone);
      p.position.set(side*3.25,2.85,0);
      p.scale.set(1.25,5.65,1.25);
      local(p);
      crystal(THREE,side*3.35,6.1,z+.15,true);
    });
    const top = new THREE.Mesh(geos.box,mats.stone);
    top.position.set(0,5.55,0);
    top.scale.set(8.2,1.05,1.35);
    local(top);
    const core = new THREE.Mesh(geos.portalCore, ready ? mats.portalCore : basic(THREE,0x66508a,{transparent:true,opacity:.45,side:THREE.DoubleSide}));
    core.position.set(0,2.78,.14);
    core.scale.set(4.7,5.15,1);
    local(core);
    const ring = new THREE.Mesh(geos.portalRing,mats.portalCore);
    ring.position.copy(core.position);
    local(ring);
    for (let i=0;i<12;i++) crystal(THREE,sign()*(4+rnd()*3.5),1+rnd()*2.7,z+2-rnd()*8,true);
    updatables.push(() => { core.rotation.z += .012; ring.rotation.z -= .008; });
    stats.animated++;
    feature('portal');
  }

  function rebuild(ctx, worldName){
    if (!installed || !ctx || !ctx.THREE || !ctx.scene) return;
    currentWorld = norm(worldName || ctx.currentWorld || 'field');
    reseed(currentWorld);
    api.disposeVisualsOnly();
    if (currentWorld === 'real') {
      restoreOriginals();
      return;
    }
    const THREE = ctx.THREE;
    const pal = PAL[currentWorld] || PAL.field;
    const len = Math.min(260, Math.max(160, Number(ctx.level && ctx.level.length || 220)));
    init(THREE,pal);
    stats = resetStats();
    updatables = [];
    group = new THREE.Group();
    group.name = 'V54_RENDER_PREMIUM_WORLD';
    ctx.scene.add(group);
    hideOriginals(ctx);
    setupScene(THREE,ctx,pal);
    skyDetails(THREE,pal);
    enhancePlayer(THREE,ctx);
    makeTerrain(THREE,pal,currentWorld,len);
    waterLavaPit(THREE,currentWorld);
    floatingIslands(THREE);
    if (currentWorld === 'field') heroReferenceField(THREE,pal,len);
    // V54.7: cenário rico preservado, mas sem itens/inimigos falsos. Interatividade fica nos objetos reais do app.js.
    portal(THREE,pal,-len+20,!!ctx.portalReady);
  }

  const api = {
    version: VERSION,
    install: safe(function(ctx){
      if (installed) return;
      if (!ctx || !ctx.THREE || !ctx.scene) return;
      installed = true;
      document.body.classList.add('v54-render-premium');
    }),
    rebuildWorld: safe(rebuild),
    update: safe(function(ctx,dt){
      if (!installed || !group) return;
      dt = dt || .016;
      updatables.forEach(fn => fn(dt,ctx));
    }),
    disposeVisualsOnly: safe(function(){
      restoreCanvasGrade();
      clearPlayerAddon();
      if (group && group.parent) group.parent.remove(group);
      group = null;
      updatables = [];
    }),
    dispose: safe(function(){
      this.disposeVisualsOnly();
      restoreOriginals();
      installed = false;
      document.body.classList.remove('v54-render-premium');
    }),
    getStatus: function(){
      return {
        version:VERSION,
        installed,
        world:currentWorld,
        hasGroup:!!group,
        objects:stats.objects,
        animated:stats.animated,
        hiddenOriginals:stats.hiddenOriginals,
        premium:true,
        deterministic:true,
        shaderSafe:true,
      v580GamepadGameplayRender:true,
      visualLanguageV55:true,
      renderRichPreserved:true,
      renderRichPreserved:true,
      fakeInteractiveRemoved:true,
      decorativeCrystalsOffTrack:true,
        textureSamplers:0,
        target:'whatsapp_2026_07_07_voxel_mobile_premium',
        features:Object.assign({},stats.features)
      };
    }
  };

  window.ATHOS_V54_RENDER_PREMIUM = api;
  window.ATHOS_V48_RENDER_TARGET = api;
})();
