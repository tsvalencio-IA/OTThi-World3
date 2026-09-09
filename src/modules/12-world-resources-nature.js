/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 12-world-resources-nature.js
 * Escopo: Interações do mundo, árvores, rochas, mina, poço, ruas, água e móveis
 * Linhas de origem V642: 1963-2184
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function isInteractionAvailable(entry) {
    if (entry.disabled) return false;
    if (currentHouse) return entry.houseId === currentHouse.id || entry.globalInside;
    return !entry.houseId;
  }


  function ensureFlowerBatch(color){
    world.flowerBatches=world.flowerBatches||{stem:null,stemCount:0,petals:new Map()};
    const batch=world.flowerBatches;
    if(!batch.stem){
      batch.stem=new THREE.InstancedMesh(sharedBoxGeometry(.08,.42,.08),renderMat(0x2f9a42,{roughness:.82}),256);
      batch.stem.count=0;batch.stem.frustumCulled=false;batch.stem.castShadow=false;batch.stem.receiveShadow=false;worldGroup.add(batch.stem);
    }
    if(!batch.petals.has(color)){
      const mesh=new THREE.InstancedMesh(sharedBoxGeometry(.35,.18,.35),renderMat(color,{roughness:.62}),128);
      mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;worldGroup.add(mesh);batch.petals.set(color,{mesh,count:0});
    }
    return batch;
  }

  function createTree(x,z,scale=1,resource=true) {
    const high = new THREE.Group(),low=new THREE.Group();
    const seed=Math.abs(Math.round(x*17+z*29)),trunk=renderMat(seed%3===0?0x83502d:0x9a5d31,{roughness:.9});
    const dark=renderMat(seed%4===0?0x237f3c:0x2b9143,{roughness:.86}),mid=renderMat(seed%3===0?0x47b955:0x3fb651,{roughness:.82}),light=renderMat(seed%5===0?0x7bdc64:0x62cf5e,{roughness:.78});
    box(.74*scale,2.35*scale,.74*scale,trunk,0,1.18*scale,0,high);
    box(1.12*scale,.28*scale,.72*scale,trunk,0,.22*scale,0,high);
    box(.72*scale,.28*scale,1.12*scale,trunk,0,.22*scale,0,high);
    box(2.65*scale,1.18*scale,2.5*scale,dark,0,2.55*scale,0,high);
    box(2.05*scale,1.0*scale,2.25*scale,mid,-.45*scale,3.28*scale,.18*scale,high);
    box(1.8*scale,.92*scale,1.8*scale,light,.5*scale,3.55*scale,-.25*scale,high);
    box(1.22*scale,.68*scale,1.22*scale,mid,0,4.12*scale,0,high);
    if(!resource&&scale>.8){box(.34*scale,.18*scale,.34*scale,0xffe26a,.7*scale,3.95*scale,.65*scale,high);}
    const lowTrunk=box(.68*scale,2.45*scale,.68*scale,trunk,0,1.22*scale,0,low),lowCrown=box(2.45*scale,2.25*scale,2.35*scale,mid,0,3.12*scale,0,low);
    lowTrunk.castShadow=lowCrown.castShadow=false;
    const id=`tree-${x.toFixed(1)}-${z.toFixed(1)}`,group=createManagedLOD(id,high,low,{distance:resource?38:32,category:'nature'});
    group.position.set(x,0,z);worldGroup.add(group);
    if(resource){
      world.resources.push({id,type:'wood',x,z,mesh:group,collected:false,hits:0,hitsNeeded:2});
      registerInteractable({id,type:'resource',icon:'🪓',label:'Cortar árvore com machado',x,z,radius:2.4,priority:135,action:()=>collectResource(id)});
    }
    return group;
  }
  function createRock(x,z,scale=1,resource=true) {
    /* Recursos naturais nunca ocupam a faixa nem o acostamento da OTTOVIAS. */
    if(typeof v704HighwayAt==='function'&&v704HighwayAt(x,z,Math.max(1.4,scale*1.15),true))return null;
    const high=new THREE.Mesh(new THREE.DodecahedronGeometry(.8*scale,0),materials.stone);high.position.y=.55*scale;high.castShadow=true;high.receiveShadow=true;
    const low=new THREE.Mesh(sharedBoxGeometry(1.18*scale,.88*scale,1.08*scale),materials.stone);low.position.y=.48*scale;low.rotation.y=Math.PI/4;low.castShadow=false;low.receiveShadow=true;
    const id=`rock-${x.toFixed(1)}-${z.toFixed(1)}`,mesh=createManagedLOD(id,high,low,{distance:31,category:'nature'});mesh.position.set(x,0,z);worldGroup.add(mesh);
    if(resource){world.resources.push({id,type:'stone',x,z,mesh,collected:false,hits:0,hitsNeeded:2});registerInteractable({id,type:'resource',icon:'⛏️',label:'Extrair pedra com picareta',x,z,radius:2.2,priority:135,action:()=>collectResource(id)});} return mesh;
  }
  function createGoldFoundry(x=34,z=-35){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);
    premiumBox(7.4,.24,5.8,materials.stone,0,.12,0,g);premiumBox(6.6,3.2,5.1,0x8a5c3a,0,1.72,0,g);premiumBox(6.9,.42,5.4,texturedRoofMaterial(0x3d4652),0,3.45,0,g);
    premiumBox(1.15,3.4,1.15,0x59616a,2.25,4.65,-1.25,g);premiumBox(1.42,.35,1.42,0x343b42,2.25,6.36,-1.25,g);
    const furnace=renderMat(0x303842,{roughness:.42,metalness:.32}),glow=renderMat(0xffb33e,{emissive:0xff5a00,emissiveIntensity:1.25,roughness:.25});premiumBox(2.4,1.7,1.7,furnace,0,1.05,2.55,g);premiumBox(1.15,.82,.12,glow,0,1.05,3.43,g);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.9),new THREE.MeshStandardMaterial({map:signTexture('FUNDIÇÃO DE OURO','#3a2a16','#ffe691'),side:THREE.DoubleSide,roughness:.7}));sign.position.set(0,2.75,2.62);g.add(sign);
    registerCollider(x,z,7.4,5.8,{landmark:'foundry'});registerInteractable({id:'gold-foundry',type:'workshop',icon:'🏅',label:'Usar fundição de ouro',x,z:z+3.7,radius:3.1,priority:190,action:openWorkshop});world.landmarks.push(g);return g;
  }
  function createGoldMine(x=-92,z=-92){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);world.mine={x,z,group:g};
    premiumBox(18,.3,13,materials.stone,0,.15,0,g);premiumBox(15,.18,10,renderMat(0x2e3540,{roughness:.94}),0,.34,0,g);
    for(const [ox,oz,s] of [[-7,-4,2.4],[7,-4,2.4],[-7,4,2.6],[7,4,2.6],[-4,-5,2],[4,-5,2]]){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),materials.stone);rock.position.set(ox,s*.48,oz);rock.scale.y=1.35;g.add(rock);}
    premiumBox(7.4,5.5,1.4,materials.stone,0,2.75,-5.1,g);premiumBox(5.3,4.2,1.55,0x141923,0,2.05,-5.35,g);premiumBox(7.8,.55,2.2,materials.wood,0,.45,-3.9,g);
    for(const ox of [-2.5,2.5]){premiumBox(.35,4.7,.35,materials.wood,ox,2.4,-4.3,g);premiumBox(3.1,.35,.35,materials.wood,ox/2,4.65,-4.3,g);}
    const orePositions=[[-4,-1],[-1.2,2],[3.2,.8],[-3.8,3.6],[4.4,-2.4],[.8,-2.2]];
    orePositions.forEach(([ox,oz],index)=>{
      const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.78+(index%2)*.12,0),materials.goldOre);mesh.position.set(x+ox,.65,z+oz);mesh.castShadow=true;worldGroup.add(mesh);
      const id=`gold-${index}`;world.resources.push({id,type:'gold',x:x+ox,z:z+oz,mesh,collected:false,hits:0,hitsNeeded:3});
      registerInteractable({id,type:'resource',icon:'⛏️',label:'Extrair minério de ouro',x:x+ox,z:z+oz,radius:2.3,priority:145,action:()=>collectResource(id)});
    });
    createSignpost(x+7,z-6,'Mina Dourada',Math.PI*.1);createLamp(x-6,z-3);createLamp(x+6,z-3);return g;
  }
  function createVillageWell(x=38,z=10){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);world.well={x,z,group:g,lastDrawAt:0};
    premiumCylinder(2.05,.55,materials.stone,0,.28,0,g,14);premiumCylinder(1.42,.7,0x122637,0,.52,0,g,14);
    for(const ox of [-1.65,1.65])premiumBox(.28,3.6,.28,materials.wood,ox,2.0,0,g);
    premiumBox(4.2,.28,1.6,0xb24b35,0,4.0,0,g);premiumBox(3.5,.22,1.3,0xe16a42,0,4.28,0,g);
    const axle=premiumCylinder(.16,3.6,materials.metal,0,2.8,0,g,12);axle.rotation.z=Math.PI/2;
    premiumBox(.06,1.9,.06,0x70513b,0,1.85,0,g);const bucket=premiumCylinder(.35,.48,materials.metal,0,.82,0,g,10);bucket.userData.wellBucket=true;
    registerInteractable({id:'village-well',type:'well',icon:'🪣',label:'Retirar água com o balde',x,z,radius:3.2,priority:170,action:drawWaterFromWell});createSignpost(x+3,z+1.5,'Poço da Vila',Math.PI/2);return g;
  }
  function drawWaterFromWell(){
    if(state.tools.equipped!=='bucket'){toast('Equipe o balde no menu Ferramentas.','warn',1800);return;}
    const now=performance.now();if(world.well&&now-world.well.lastDrawAt<2500){toast('O balde ainda está subindo.','warn',1100);return;}if(world.well)world.well.lastDrawAt=now;
    playToolAnimation();state.inventory.water=(state.inventory.water||0)+2;state.tools.harvested.water=(state.tools.harvested.water||0)+2;state.needs.hygiene=clamp(state.needs.hygiene+2,0,100);advanceAdventure('resources','water');addXP(6);saveState(true);updateHUD();toast('+2 água limpa','good',1300);
  }
  function createFlower(x,z,color=0xff70c8){
    const batch=ensureFlowerBatch(color),matrix=new THREE.Matrix4();
    if(batch.stemCount<256){
      matrix.makeTranslation(x,.21,z);batch.stem.setMatrixAt(batch.stemCount++,matrix);batch.stem.count=batch.stemCount;batch.stem.instanceMatrix.needsUpdate=true;
    }
    const petals=batch.petals.get(color);
    if(petals.count<128){
      matrix.makeTranslation(x,.5,z);petals.mesh.setMatrixAt(petals.count++,matrix);petals.mesh.count=petals.count;petals.mesh.instanceMatrix.needsUpdate=true;
    }
  }
  function createLamp(x,z){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);
    box(.2,2.55,.2,renderMat(0x33485c,{roughness:.65,metalness:.16}),0,1.28,0,g);
    box(.5,.16,.5,0x223244,0,2.52,0,g);
    const glowMat=renderMat(0xffdf75,{emissive:0xffc94d,emissiveIntensity:.78,roughness:.28});
    box(.58,.62,.58,glowMat,0,2.82,0,g);box(.72,.12,.72,0x223244,0,3.15,0,g);
    addGlow(x,2.82,z,0xffd56b,4);return g;
  }
  function createSignpost(x,z,text,rotationY=0){
    const safe=typeof v704SafeSignPoint==='function'?v704SafeSignPoint(x,z,rotationY):{x,z};x=safe.x;z=safe.z;
    const group=new THREE.Group();group.position.set(x,0,z);group.name=`OTTHI_NAV_SIGN_${String(text||'').replace(/\W+/g,'_').slice(0,32)}`;worldGroup.add(group);
    box(.16,2.1,.16,materials.wood,0,1.05,0,group);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.6),new THREE.MeshStandardMaterial({map:signTexture(text,'#2a3f2c','#f4ede1'),roughness:.85,side:THREE.DoubleSide}));
    board.position.set(0,1.95,0);board.rotation.y=rotationY;group.add(board);group.visible=Math.hypot(player.x-x,player.z-z)<=42;
    world.navigationSigns.push({group,x,z,kind:'local',label:text});
    return group;
  }
  function createFenceLine(x1,z1,x2,z2,segments=8){
    for(let i=0;i<=segments;i++){const t=i/segments;box(.18,1.0,.18,materials.wood,lerp(x1,x2,t),.5,lerp(z1,z2,t));}
    const mx=(x1+x2)/2,mz=(z1+z2)/2,w=Math.abs(x2-x1)||.15,d=Math.abs(z2-z1)||.15;box(w+.2,.13,d+.2,materials.wood,mx,.73,mz);
  }
  function createRoad(x,z,w,d){
    stableBox(w,.1,d,materials.road,x,.055,z,worldGroup,1);
    const horizontal=w>=d,curbColor=0xe6e8ec,lineMaterial=renderMat(0xffd83d,{roughness:.68,emissive:0x5d4100,emissiveIntensity:.06}),edgeMaterial=renderMat(0xffffff,{roughness:.74});
    const curbDark=renderMat(0x9ca7b3,{roughness:.88});
    if(horizontal){
      stableBox(w+2.6,.13,1.65,materials.sidewalk,x,.065,z-d/2-1.0,worldGroup,1);stableBox(w+2.6,.13,1.65,materials.sidewalk,x,.065,z+d/2+1.0,worldGroup,1);
      stableBox(w+2.8,.13,.22,curbDark,x,.16,z-d/2-.26,worldGroup,2);stableBox(w+2.8,.13,.22,curbDark,x,.16,z+d/2+.26,worldGroup,2);
      stableBox(w+2.6,.035,.14,curbColor,x,.235,z-d/2-.18,worldGroup,3);stableBox(w+2.6,.035,.14,curbColor,x,.235,z+d/2+.18,worldGroup,3);
      for(let lx=-w/2+3;lx<w/2-1.5;lx+=6)stableBox(2.35,.022,.34,lineMaterial,x+lx,.132,z,worldGroup,3);
      stableBox(w,.02,.13,edgeMaterial,x,.132,z-d/2+.78,worldGroup,3);stableBox(w,.02,.13,edgeMaterial,x,.132,z+d/2-.78,worldGroup,3);
    }else{
      stableBox(1.65,.13,d+2.6,materials.sidewalk,x-w/2-1.0,.065,z,worldGroup,1);stableBox(1.65,.13,d+2.6,materials.sidewalk,x+w/2+1.0,.065,z,worldGroup,1);
      stableBox(.22,.13,d+2.8,curbDark,x-w/2-.26,.16,z,worldGroup,2);stableBox(.22,.13,d+2.8,curbDark,x+w/2+.26,.16,z,worldGroup,2);
      stableBox(.14,.035,d+2.6,curbColor,x-w/2-.18,.235,z,worldGroup,3);stableBox(.14,.035,d+2.6,curbColor,x+w/2+.18,.235,z,worldGroup,3);
      for(let lz=-d/2+3;lz<d/2-1.5;lz+=6)stableBox(.34,.022,2.35,lineMaterial,x,.132,z+lz,worldGroup,3);
      stableBox(.13,.02,d,edgeMaterial,x-w/2+.78,.132,z,worldGroup,3);stableBox(.13,.02,d,edgeMaterial,x+w/2-.78,.132,z,worldGroup,3);
    }
  }
  function createWater(x,z,w,d,options={}){const water=stableBox(w,.12,d,materials.water,x,.04,z,worldGroup,1);water.material.depthWrite=false;water.userData={...(water.userData||{}),waterId:options.id||'',reservoir:!!options.reservoir};if(options.shore!==false)for(let px=x-w/2+2;px<x+w/2;px+=4){stableBox(3.2,.18,.7,0x9fadb8,px,.09,z-d/2-.35,worldGroup,2);stableBox(3.2,.18,.7,0x9fadb8,px,.09,z+d/2+.35,worldGroup,2);}world.hazards.push({type:'water',id:options.id||'',reservoir:!!options.reservoir,x,z,w,d});return water;}
  function createReservoirBasin(main,north){
    if(!main||!north)return null;const root=new THREE.Group();root.name='OTTHI_RESERVOIR_SINGLE_CONNECTED';worldGroup.add(root);const bank=renderMat(0xc9b77f,{roughness:.96}),stone=renderMat(0x73808a,{roughness:.92});
    const mainWater=createWater(main.x,main.z,main.w,main.d,{id:'lake',reservoir:true,shore:false}),northWater=createWater(north.x,north.z,north.w,north.d,{id:'lakeNorth',reservoir:true,shore:false});
    const banks=[
      [main.x,main.z-main.d/2-.55,main.w+1.8,1.15],[main.x+main.w/2+.55,main.z,1.15,main.d+2.1],
      [main.x-7.5,main.z+main.d/2+.55,main.w-15,1.15],[main.x-main.w/2-.55,main.z-1.4,1.15,main.d-2.8],
      [north.x,north.z+north.d/2+.55,north.w+1.8,1.15],[north.x-north.w/2-.55,north.z,1.15,north.d+2.0],
      [north.x+north.w/2+.55,north.z+2.2,1.15,north.d-4.4]
    ];
    for(const [x,z,w,d] of banks)stableBox(w,.16,d,bank,x,.085,z,root,2);
    const rocks=[[-113.5,45],[-112.8,58],[-109,76.1],[-97,76.2],[-91.2,73],[-73,65.5],[-63.1,59],[-63.3,47]];for(const [x,z] of rocks){const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.42,0),stone);mesh.position.set(x,.22,z);mesh.scale.set(1.45,.55,1);mesh.castShadow=false;root.add(mesh);}
    const reedMat=renderMat(0x4f8f42,{roughness:.88});for(const [x,z] of [[-111,43],[-102,43],[-94,43],[-84,43],[-75,43],[-66,43],[-113,50],[-113,61],[-115,68],[-113,75],[-101,76],[-94,74],[-63,51],[-63,61]])for(const dx of[-.16,.05,.23]){const reed=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.72+Math.abs(dx),6),reedMat);reed.position.set(x+dx,.38,z);reed.rotation.z=dx*.35;root.add(reed);}
    world.reservoir={id:'otthi-reservoir',group:root,waters:[mainWater,northWater],main:{...main},north:{...north}};return world.reservoir;
  }
  function createLava(x,z,w,d){const m=stableBox(w,.12,d,mat(0xff3a00,{emissive:0xff2200,emissiveIntensity:.9}),x,.04,z,worldGroup,1);world.hazards.push({type:'lava',x,z,w,d});return m;}

  function createFurniture(house, type, lx, lz, color=0xffffff, label='Usar') {
    const x=house.x+lx,z=house.z+lz,group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    const wood=materials.wood,dark=renderMat(0x172231,{roughness:.64}),metal=renderMat(0x9ba9b8,{roughness:.4,metalness:.34}),cream=renderMat(0xfff3df,{roughness:.72});
    if(type==='bed'){
      box(2.25,.32,1.25,wood,0,.2,0,group);box(2.08,.32,1.1,renderMat(0x258ed6,{roughness:.68}),0,.54,0,group);
      box(.72,.2,1.02,cream,-.64,.82,0,group);box(.14,1.05,1.25,wood,-1.06,.7,0,group);box(1.85,.08,1.0,renderMat(0x55c9ff,{roughness:.58}),.12,.73,0,group);
    }
    if(type==='sofa'){
      const sofa=renderMat(color,{roughness:.72});box(2.25,.52,.9,sofa,0,.38,0,group);box(2.25,.82,.26,sofa,0,.88,-.36,group);
      box(.3,.72,.95,shadeColor(color,-18),-1.12,.54,0,group);box(.3,.72,.95,shadeColor(color,-18),1.12,.54,0,group);
      box(.86,.13,.66,shadeColor(color,16),-.5,.72,.05,group);box(.86,.13,.66,shadeColor(color,16),.5,.72,.05,group);
    }
    if(type==='tv'){
      box(1.75,.5,.62,wood,0,.3,0,group);box(1.62,1.02,.2,dark,0,1.2,0,group);
      box(1.38,.76,.05,renderMat(0x49cfff,{emissive:0x126b8f,emissiveIntensity:.25,roughness:.18}),0,1.2,.13,group);
      box(.12,.12,.12,0x38d66b,-.48,1.18,.18,group);box(.12,.12,.12,0xffd43b,.48,1.36,.18,group);
    }
    if(type==='fridge'){
      box(.94,1.86,.82,renderMat(0xdff4ff,{roughness:.36,metalness:.1}),0,.93,0,group);box(.88,.05,.84,0xa6c7d9,0,1.16,0,group);
      box(.06,.55,.08,metal,.29,1.38,.43,group);box(.06,.42,.08,metal,.29,.74,.43,group);
    }
    if(type==='stove'){
      box(1.12,.92,.86,renderMat(0xa8b3c0,{roughness:.42,metalness:.2}),0,.46,0,group);box(.88,.44,.06,dark,0,.43,.46,group);
      for(const ox of [-.28,.28])for(const oz of [-.2,.2])cylinder(.13,.045,0x111827,ox,.95,oz,group,12);
      for(const ox of [-.3,0,.3])cylinder(.04,.07,0xe8edf2,ox,.8,.46,group,8);
    }
    if(type==='sink'){
      box(1.25,.84,.78,cream,0,.42,0,group);box(.72,.13,.48,renderMat(0x5bc7e8,{roughness:.24,metalness:.12}),0,.89,0,group);
      box(.08,.5,.08,metal,.2,1.12,-.12,group);box(.34,.08,.08,metal,.03,1.35,-.12,group);
    }
    if(type==='shower'){
      box(1.15,.08,1.15,0x7dd9fa,0,.04,0,group);box(.08,2.2,.08,metal,.46,1.1,-.44,group);box(.7,1.9,.04,renderMat(0xa9ecff,{transparent:true,opacity:.35,roughness:.06}),0,1.05,-.48,group);
      cylinder(.16,.05,0x75879a,.46,2.08,-.44,group,12);
    }
    if(type==='chest'){box(1.25,.72,.82,wood,0,.36,0,group);box(1.3,.2,.87,0xffc629,0,.82,0,group);box(.18,.34,.08,metal,0,.55,.44,group);}
    if(type==='table'){box(1.6,.17,1.05,wood,0,.9,0,group);for(const ox of [-.58,.58])for(const oz of [-.35,.35])box(.13,.82,.13,wood,ox,.42,oz,group);box(.55,.08,.55,0x56c5ff,0,.99,0,group);}
    if(type==='wardrobe'){box(1.55,2.14,.68,renderMat(0x89502b,{roughness:.8}),0,1.07,0,group);box(.06,1.9,.7,0x5e351c,0,1.07,0,group);box(.08,.12,.08,0xffd84d,-.13,1.08,.37,group);box(.08,.12,.08,0xffd84d,.13,1.08,.37,group);}
    if(type==='desk'){
      box(1.75,.16,.88,wood,0,.83,0,group);for(const ox of [-.65,.65])for(const oz of [-.28,.28])box(.12,.76,.12,wood,ox,.4,oz,group);
      box(1.18,.1,.5,materials.tile,0,.94,0,group);box(.72,.14,.14,0xffd45e,-.15,1.07,.06,group);
      box(1.05,.14,.34,materials.fabric,0,.5,.72,group);box(1.05,.72,.14,materials.fabric,0,.83,.86,group);for(const ox of [-.42,.42])box(.1,.47,.1,metal,ox,.24,.72,group);
    }
    if(type==='bookshelf'){
      box(1.72,2.25,.4,wood,0,1.12,0,group);for(const y of [.2,.75,1.3,1.85,2.22])box(1.68,.1,.46,shadeColor(0x89502b,-16),0,y,0,group);
      const colors=[0xe34e52,0x3f8fd5,0xf0c441,0x55ad67,0x8d65c5];for(let row=0;row<4;row++)for(let i=0;i<7;i++)box(.16,.38,.3,colors[(i+row)%colors.length],-.62+i*.205,.43+row*.55,.04,group);
    }
    if(type==='board'){
      box(3.25,1.75,.12,0x244f47,0,1.55,0,group);box(3.5,.12,.2,wood,0,.65,0,group);box(3.5,.12,.2,wood,0,2.45,0,group);
      for(const ox of [-1.2,-.45,.35,1.05])box(.42,.06,.025,0xf1f5d5,ox,1.6,.075,group);
    }
    if(type==='bench'){box(2.25,.22,.62,materials.fabric,0,.62,0,group);box(2.25,.74,.18,materials.fabric,0,1.0,-.24,group);for(const ox of [-.82,.82])box(.14,.55,.14,metal,ox,.28,0,group);}
    if(type==='radio'){
      box(1.35,.88,.65,materials.metal,0,.7,0,group);box(.72,.42,.05,dark,-.18,.72,.35,group);for(let i=0;i<4;i++)box(.06,.32,.04,0x9aaaba,-.46+i*.14,.72,.39,group);
      cylinder(.13,.1,0xffd24a,.42,.86,.36,group,12);box(.06,.85,.06,metal,.45,1.55,0,group);
    }
    if(type==='plant'){
      premiumCylinder(.46,.58,0xd8733f,0,.3,0,group,10);box(.18,1.15,.18,0x4f8332,0,1.0,0,group);
      for(const [ox,oy,oz] of [[-.34,1.25,0],[.34,1.08,.08],[0,1.48,-.15],[-.15,1.05,.28]])premiumBox(.62,.22,.4,0x55b94b,ox,oy,oz,group);
    }
    house.interiorObjects.push(group);return {group,x,z,type,label};
  }

  function signTexture(text, bg='#f4ede1', fg='#2a2118'){
    const c=document.createElement('canvas'); c.width=512; c.height=192;
    const ctx=c.getContext('2d');
    ctx.fillStyle=bg; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=10; ctx.strokeRect(6,6,c.width-12,c.height-12);
    const words=String(text||'').trim().split(/\s+/).filter(Boolean);
    let lines=[''];
    const maxWidth=438;
    for(const word of words){
      const candidate=(lines[lines.length-1]+' '+word).trim();
      ctx.font='900 68px system-ui, sans-serif';
      if(ctx.measureText(candidate).width<=maxWidth||!lines[lines.length-1]) lines[lines.length-1]=candidate;
      else if(lines.length<2) lines.push(word);
      else lines[1]+=' '+word;
    }
    let fontSize=68;
    while(fontSize>30){
      ctx.font=`900 ${fontSize}px system-ui, sans-serif`;
      if(lines.every(line=>ctx.measureText(line).width<=maxWidth)) break;
      fontSize-=2;
    }
    ctx.fillStyle=fg; ctx.font=`900 ${fontSize}px system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    const lineHeight=fontSize*1.02;
    const startY=c.height/2-(lines.length-1)*lineHeight/2;
    lines.slice(0,2).forEach((line,i)=>ctx.fillText(line, c.width/2, startY+i*lineHeight));
    const tex=new THREE.CanvasTexture(c);
    tex.magFilter=THREE.LinearFilter; tex.minFilter=THREE.LinearMipmapLinearFilter; tex.generateMipmaps=true;
    tex.anisotropy=(renderer&&renderer.capabilities)?Math.min(8,renderer.capabilities.getMaxAnisotropy()):4;
    tex.encoding=THREE.sRGBEncoding;
    return tex;
  }
