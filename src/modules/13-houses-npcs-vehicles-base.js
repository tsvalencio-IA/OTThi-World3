/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 13-houses-npcs-vehicles-base.js
 * Escopo: Casas, interiores, NPCs, inimigos, cristais, veículos e academia
 * Linhas de origem V642: 2185-2417
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function shadeColor(hex,amount){
    const r=Math.max(0,Math.min(255,((hex>>16)&255)+amount));
    const g=Math.max(0,Math.min(255,((hex>>8)&255)+amount));
    const b=Math.max(0,Math.min(255,(hex&255)+amount));
    return (r<<16)|(g<<8)|b;
  }
  function decorateHouseCommercial(house,config){
    const {id,x,z,color,roofColor,publicBuilding}=config,trim=shadeColor(color,38),dark=shadeColor(color,-44);
    premiumBox(9.3,.18,.22,dark,x,2.76,z+3.5,house.front);
    makePlanter(house.front,x-2.45,.88,z+3.68,id==='blue'?0x52c7ff:id==='pink'?0xff6ba7:0xffd34d);makePlanter(house.front,x+2.45,.88,z+3.68,0x75e56e);
    if(publicBuilding){
      const awningColor=id==='shop'?0xe5483e:id==='workshop'?0xb7ed20:0x2f7fd8;
      for(let i=-4;i<=4;i++)box(.58,.18,1.25,i%2?0xfff5df:awningColor,x+i*.58,2.44,z+3.92,house.front);
      premiumBox(4.5,.78,.24,0x18334d,x,3.08,z+3.6,house.front);
      premiumBox(.62,.45,.62,trim,x-3.25,3.32,z+3.55,house.front);premiumBox(.62,.45,.62,trim,x+3.25,3.32,z+3.55,house.front);
    }else{
      premiumBox(2.25,.24,1.1,trim,x,2.37,z+3.78,house.front);premiumBox(.18,1.12,.18,trim,x-.9,1.77,z+3.8,house.front);premiumBox(.18,1.12,.18,trim,x+.9,1.77,z+3.8,house.front);
    }
    premiumBox(.45,1.2,.45,shadeColor(roofColor,-35),x+2.8,4.6,z-1.4,house.roof);premiumBox(.65,.18,.65,0xd8dce2,x+2.8,5.22,z-1.4,house.roof);
    house.roof.traverse(o=>{if(o.isMesh&&o.geometry?.type==='BoxGeometry')addVoxelOutline(o,0x182238,.24)});
    house.front.traverse(o=>{if(o.isMesh&&o.geometry?.type==='BoxGeometry')addVoxelOutline(o,0x182238,.25)});
  }

  function createWorkshopShed(config){
    const {id,name,x,z,color,roofColor,price=0,publicBuilding=true}=config;
    const house={id,name,x,z,w:15,d:12,color,roofColor,price,publicBuilding,roof:new THREE.Group(),front:new THREE.Group(),door:new THREE.Group(),interiorObjects:[],owned:!!state.houses[id]?.owned,workshopOpen:true};
    worldGroup.add(house.roof,house.front,house.door);house.door.visible=false;
    const shell=new THREE.Group();shell.position.set(x,0,z);worldGroup.add(shell);house.workshopShell=shell;
    const concrete=renderMat(0x34373a,{roughness:.88}),graphite=renderMat(0x14181d,{roughness:.82}),graphite2=renderMat(0x252a30,{roughness:.72}),steel=renderMat(0x525c65,{roughness:.48,metalness:.30}),lime=renderMat(0xb7ed20,{roughness:.40,emissive:0x5e7f00,emissiveIntensity:.18}),led=renderMat(0xf7f8f5,{roughness:.24,emissive:0xffffff,emissiveIntensity:.42}),roofMat=renderMat(0x11151a,{roughness:.70,metalness:.10,transparent:true,opacity:.72,depthWrite:false});
    premiumBox(15,.18,12,concrete,0,.08,0,shell);
    // Barracão alto: fundo e laterais fechados, fachada completamente aberta para entrada de veículos.
    premiumBox(15,5.9,.28,graphite,0,3.0,-5.88,shell);premiumBox(.28,5.9,12,graphite,-7.38,3.0,0,shell);premiumBox(.28,5.9,12,graphite,7.38,3.0,0,shell);
    for(const sx of[-7.18,7.18]){premiumBox(.34,6.45,.34,steel,sx,3.22,5.70,shell);premiumBox(.22,5.70,.22,lime,sx+(sx<0?.20:-.20),3.0,5.68,shell);}
    premiumBox(14.55,.34,.34,steel,0,6.18,5.72,shell);premiumBox(14.1,.08,.10,lime,0,5.88,5.63,shell);
    // Cobertura alta e leve. As faixas translúcidas mantêm a oficina visível pela câmera em terceira pessoa.
    for(const rx of[-5.0,0,5.0])premiumBox(4.72,.16,11.7,roofMat,rx,6.40,0,shell);
    for(const rz of[-4.8,-2.4,0,2.4,4.8]){premiumBox(14.2,.12,.12,steel,0,6.15,rz,shell);premiumBox(8.8,.045,.075,led,-1.2,5.94,rz+.02,shell);}
    // Faixa frontal e identidade da oficina, sem qualquer porta ou portão.
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(8.9,1.12),new THREE.MeshStandardMaterial({map:signTexture('SOS VALÊNCIO • CENTRO AUTOMOTIVO','#101419','#f4f6f7'),roughness:.46,side:THREE.DoubleSide}));sign.position.set(0,5.25,5.82);shell.add(sign);
    premiumBox(9.2,.07,.07,lime,0,4.58,5.76,shell);
    // Piso de acesso contínuo: o carro vem da rua e entra fisicamente no barracão.
    premiumBox(6.6,.075,4.0,0x5b6064,-2.1,.045,7.75,shell);for(const ox of[-3.0,3.0])premiumBox(.08,.02,4.0,lime,-2.1+ox,.10,7.75,shell);
    registerCollider(x,z-5.88,15,.28,{houseId:id,workshopOpen:true});registerCollider(x-7.38,z,.28,12,{houseId:id,workshopOpen:true});registerCollider(x+7.38,z,.28,12,{houseId:id,workshopOpen:true});
    world.houses.push(house);return house;
  }

  function createWorkshopServicePartVisual(id,parent=worldGroup){
    const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0x6bd98a,emissive:0x173d24,emissiveIntensity:.34,roughness:.48,metalness:.18}),metal=renderMat(0x66727c,{roughness:.38,metalness:.48}),dark=renderMat(0x20262d,{roughness:.62,metalness:.22}),red=renderMat(0xd94a42,{roughness:.50}),blue=renderMat(0x2d73a8,{roughness:.46});parent?.add?.(group);group.name=`workshop-service-part-${id}`;
    const b=(w,h,d,x,y,z,mat=material)=>premiumBox(w,h,d,mat,x,y,z,group,0x15222b),c=(radius,depth,x,y,z,mat=metal,segments=12)=>{const mesh=cylinder(radius,depth,mat,x,y,z,group,segments);return mesh;};
    if(id==='engine'){
      b(1.16,.46,.88,0,.10,0);b(.88,.24,.64,0,.44,0);b(.22,.20,.22,-.30,.66,-.08,metal);b(.22,.20,.22,0,.66,-.08,metal);b(.22,.20,.22,.30,.66,-.08,metal);c(.16,.56,-.62,.18,0,dark);c(.12,.42,.62,.18,0,metal);
    }else if(id==='brakes'){
      for(const x of[-.48,.48]){const disc=c(.30,.12,x,.12,0,metal,16);disc.rotation.z=Math.PI/2;b(.16,.34,.22,x+(x<0?-.16:.16),.14,.08,red);b(.08,.20,.16,x,.14,0,dark);}
    }else if(id==='suspension'){
      for(const x of[-.52,.52]){const strut=c(.09,.82,x,.34,0,metal,10);b(.22,.12,.22,x,.74,0,dark);b(.34,.10,.54,x,.05,0,material);for(let i=0;i<3;i++){const spring=c(.16,.035,x,.24+i*.15,0,material,10);spring.scale.z=.62;}}
    }else if(id==='steering'){
      b(1.42,.16,.22,0,.18,0,material);b(.42,.10,.12,-.88,.18,0,metal);b(.42,.10,.12,.88,.18,0,metal);c(.17,.28,0,.18,0,dark,12);b(.12,.46,.12,.18,.43,-.02,metal);b(.24,.10,.20,-1.08,.18,0,dark);b(.24,.10,.20,1.08,.18,0,dark);
    }else if(id==='electrical'){
      b(.78,.48,.56,0,.24,0,dark);b(.70,.08,.50,0,.52,0,material);c(.075,.14,-.22,.62,0,red,10);c(.075,.14,.22,.62,0,dark,10);b(.18,.10,.12,-.22,.69,0,red);b(.18,.10,.12,.22,.69,0,metal);
    }else if(id==='cooling'){
      b(1.20,.72,.16,0,.36,0,metal);for(const x of[-.42,-.21,0,.21,.42])b(.055,.58,.18,x,.36,0,material);b(.16,.78,.24,-.68,.38,0,dark);b(.16,.78,.24,.68,.38,0,dark);const hose=c(.10,.72,.30,.54,.22,blue,12);hose.rotation.z=Math.PI/2;
    }else{
      b(.70,.30,.46,0,.18,0);b(.48,.16,.34,0,.42,0,metal);b(.12,.12,.58,-.24,.20,0,dark);b(.12,.12,.58,.24,.20,0,dark);
    }
    group.userData.workshopServicePartId=String(id||'');return{group,material};
  }

  function createHouse(config) {
    const {id,name,x,z,color,roofColor,price=0,publicBuilding=false}=config;
    if(id==='workshop')return createWorkshopShed({...config,publicBuilding:true});
    const house={id,name,x,z,w:9,d:7,color,roofColor,price,publicBuilding,roof:new THREE.Group(),front:new THREE.Group(),interiorObjects:[],owned:!!state.houses[id]?.owned};
    worldGroup.add(house.roof,house.front);
    const workshopIndustrial=id==='workshop',wallTexture=id.startsWith('school')?textures.schoolWall:id.startsWith('police')?textures.policeWall:id==='fire-station'?textures.fireWall:id.startsWith('shop')?textures.marketWall:textures.brick,wallMat=workshopIndustrial?renderMat(0x171b20,{roughness:.82}):tintedBrickMaterial(color,wallTexture),roofMat=workshopIndustrial?renderMat(0x0d1116,{roughness:.72,metalness:.08}):texturedRoofMaterial(roofColor),roofLight=workshopIndustrial?renderMat(0x242a31,{roughness:.66}):texturedRoofMaterial(shadeColor(roofColor,18)),corner=workshopIndustrial?renderMat(0xb7ed20,{roughness:.44,emissive:0x5f7f00,emissiveIntensity:.16}):renderMat(new THREE.Color(color).lerp(new THREE.Color(0xffffff),.48).getHex(),{roughness:.78});
    const floorMat=id.startsWith('school')?materials.schoolFloor:id.startsWith('shop')?materials.marketFloor:(id.startsWith('police')||id==='fire-station')?materials.concrete:materials.interiorFloor;box(9,.25,7,floorMat,x,.12,z);
    box(9,2.8,.35,wallMat,x,1.5,z-3.32);box(.35,2.8,7,wallMat,x-4.32,1.5,z);box(.35,2.8,7,wallMat,x+4.32,1.5,z);
    box(3.6,2.8,.35,wallMat,x-2.7,1.5,z+3.32,house.front);box(3.6,2.8,.35,wallMat,x+2.7,1.5,z+3.32,house.front);
    for(const cx of [-4.12,4.12]){box(.24,2.82,.4,corner,x+cx,1.5,z-3.28);box(.24,2.82,.4,corner,x+cx,1.5,z+3.28,house.front);}
    box(9.8,.62,7.75,roofMat,x,3.18,z,house.roof);box(8.8,.35,6.8,roofLight,x,3.55,z,house.roof);
    box(7.5,.42,7.15,roofMat,x,3.86,z,house.roof);box(5.9,.4,5.85,texturedRoofMaterial(shadeColor(roofColor,26)),x,4.18,z,house.roof);
    const spotMat=renderMat(0xfff2df,{roughness:.52});
    [[-2.5,-1.7],[2.25,-1.45],[-.4,1.8],[1.2,.5],[-1.2,-.1]].forEach(([ox,oz],i)=>box(i%2?.72:.88,.16,i%2?.72:.88,spotMat,x+ox,4.42,z+oz,house.roof));
    const door=box(1.45,2.25,.18,materials.wood,x,1.12,z+3.48);door.userData.houseId=id;
    box(.18,2.0,.2,corner,x-.83,1.16,z+3.46,house.front);box(.18,2.0,.2,corner,x+.83,1.16,z+3.46,house.front);
    makeWindow(house.front,x-2.4,1.45,z+3.52,1.12,.86,0xf6efe1);makeWindow(house.front,x+2.4,1.45,z+3.52,1.12,.86,0xf6efe1);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.66),new THREE.MeshStandardMaterial({map:signTexture(name,'#18334d','#ffffff'),roughness:.65,side:THREE.DoubleSide}));
    sign.position.set(x,2.36,z+3.58);house.front.add(sign);
    box(.16,.55,.16,materials.wood,x-1.55,.28,z+4.7);box(.36,.25,.24,shadeColor(color,12),x-1.55,.62,z+4.7);
    if(!publicBuilding){createFlower(x-3.1,z+4.7,shadeColor(0xff70c8,(id.charCodeAt(0)%3)*20-20));createFlower(x+3.1,z+4.7,0xffdf55);}
    createLamp(x-3.7,z+4.0);createLamp(x+3.7,z+4.0);
    house.door=door;
    registerCollider(x,z-3.32,9,.35,{houseId:id});registerCollider(x-4.32,z,.35,7,{houseId:id});registerCollider(x+4.32,z,.35,7,{houseId:id});registerCollider(x-2.7,z+3.32,3.6,.35,{houseId:id});registerCollider(x+2.7,z+3.32,3.6,.35,{houseId:id});
    const publicDoor=!!publicBuilding,workshopDoor=id==='workshop';world.houses.push(house);registerInteractable({id:`door-${id}`,type:'door',icon:'🚪',label:workshopDoor?'Entrar na Oficina':`Abrir: ${name}`,x,z:z+4.0,radius:workshopDoor?3.5:publicDoor?3.0:2.5,priority:workshopDoor?480:publicDoor?320:230,action:()=>handleHouseDoor(house)});
    decorateHouseCommercial(house,config);return house;
  }

  function addHouseInterior(house, type='home') {
    if(type==='home'){
      const bed=createFurniture(house,'bed',-2.85,-1.95,0,'Dormir');
      const sofa=createFurniture(house,'sofa',.85,-1.95,0x8b5cf6,'Sentar no sofá');
      const tv=createFurniture(house,'tv',2.85,-.25,0,'Assistir televisão');
      const fridge=createFurniture(house,'fridge',-3.05,1.55,0,'Abrir geladeira');
      const stove=createFurniture(house,'stove',-1.65,1.55,0,'Cozinhar');
      const sink=createFurniture(house,'sink',-.25,1.55,0,'Beber água');
      const shower=createFurniture(house,'shower',3.1,1.6,0,'Tomar banho');
      const chest=createFurniture(house,'chest',3.15,-2.05,0,'Abrir baú');
      const wardrobe=createFurniture(house,'wardrobe',2.95,.65,0,'Trocar roupa');
      createFurniture(house,'table',-1.6,.15,0,'Mesa de refeições');createFurniture(house,'plant',1.65,.55,0,'Planta da casa');
      premiumBox(3.5,.04,2.2,0xd6a65d,house.x-1.7,.18,house.z+1.45,worldGroup,0x765228);
      premiumBox(3.2,.04,2.0,0x7057b7,house.x+1.1,.18,house.z-1.85,worldGroup,0x3f2c65);
      premiumBox(8.1,.12,.18,0x63b4e8,house.x,.78,house.z-3.08);premiumBox(.18,2.0,.18,0x63b4e8,house.x-3.9,1.05,house.z-2.95);premiumBox(.18,2.0,.18,0x63b4e8,house.x+3.9,1.05,house.z-2.95);
      const lampA=addGlow(house.x-2.1,2.25,house.z-.1,0xffc66e,5),lampB=addGlow(house.x+2.1,2.25,house.z-.1,0xffc66e,5);house.interiorObjects.push(lampA,lampB);
      registerActivity(house,bed,'bed');registerActivity(house,sofa,'sofa');registerActivity(house,tv,'tv');registerActivity(house,fridge,'fridge');registerActivity(house,stove,'stove');registerActivity(house,sink,'sink');registerActivity(house,shower,'shower');registerActivity(house,chest,'chest');registerActivity(house,wardrobe,'wardrobe');
    } else if(type==='shop'){
      premiumBox(8.2,.08,6.2,materials.marketFloor,house.x,.16,house.z);premiumBox(8.1,1.15,.12,materials.marketWall,house.x,.72,house.z-3.08);
      const table=createFurniture(house,'table',0,2.05,0,'Comprar itens');registerActivity(house,table,'shop');
      for(const x of [-2.7,0,2.7]){createFurniture(house,'bookshelf',x,-1.35,0,'Prateleira de produtos');for(const z of [-.95,-1.65])premiumBox(.55,.32,.42,[0xffd84d,0x5bd18b,0xff7b72][Math.abs(Math.round(x))%3],house.x+x,.95,house.z+z);}
      createFurniture(house,'fridge',3.05,1.25,0,'Geladeira de bebidas');createFurniture(house,'plant',-3.2,2.1,0,'Horta do mercado');
      const lampA=addGlow(house.x-2.3,2.35,house.z,0xffffff,5),lampB=addGlow(house.x+2.3,2.35,house.z,0xffffff,5);house.interiorObjects.push(lampA,lampB);premiumBox(2.4,.12,.82,0x4b7a5d,house.x-1.45,1.18,house.z+2.45);premiumBox(1.35,.42,.12,0xfff1b8,house.x-1.45,1.52,house.z+2.02);for(const px of [-2.8,-1.8,-.8,.8,1.8,2.8])premiumBox(.58,.08,.58,0xf7e9cb,house.x+px,2.55,house.z);
    } else if(type==='workshop'){
      const graphite=renderMat(0x15191e,{roughness:.80}),graphite2=renderMat(0x252a30,{roughness:.70}),lime=renderMat(0xb7ed20,{roughness:.42,emissive:0x6f9400,emissiveIntensity:.22}),whiteLed=renderMat(0xf4f7f8,{roughness:.28,emissive:0xffffff,emissiveIntensity:.38}),steel=renderMat(0x66727c,{roughness:.44,metalness:.30}),blueLift=renderMat(0x205b91,{roughness:.56,metalness:.14}),glass=renderMat(0x8ec9d8,{roughness:.10,transparent:true,opacity:.34}),decor=new THREE.Group();decor.position.set(house.x,0,house.z);worldGroup.add(decor);decor.visible=true;world.workshopDecor=decor;house.interiorObjects.push(decor);
      // Boxes e circulação. O centro do barracão permanece livre para o veículo entrar dirigido pelo jogador.
      for(const cx of[-2.25,2.15]){premiumBox(.065,.025,9.8,lime,cx-1.72,.20,-.35,decor);premiumBox(.065,.025,9.8,lime,cx+1.72,.20,-.35,decor);premiumBox(3.5,.025,.065,lime,cx,.20,-5.05,decor);premiumBox(3.5,.025,.065,lime,cx,.20,4.55,decor);}
      premiumBox(.06,.025,10.0,0xe9edf0,0,.205,-.35,decor);
      // Elevador automotivo funcional: colunas fixas e braços móveis.
      const liftX=-2.25,liftZ=-.75,liftPlatform=new THREE.Group();liftPlatform.position.set(liftX,0,liftZ);decor.add(liftPlatform);
      for(const lx of[-1.70,1.70]){premiumBox(.28,4.70,.34,blueLift,liftX+lx,2.45,liftZ,decor);premiumBox(.52,.22,.62,blueLift,liftX+lx,.28,liftZ,decor);premiumBox(.48,.20,.58,blueLift,liftX+lx,4.70,liftZ,decor);}
      for(const zoff of[-1.08,1.08]){premiumBox(3.15,.12,.18,steel,0,.30,zoff,liftPlatform);premiumBox(.62,.11,.64,0x343a40,-1.20,.38,zoff,liftPlatform);premiumBox(.62,.11,.64,0x343a40,1.20,.38,zoff,liftPlatform);}
      premiumBox(.16,4.20,.16,lime,liftX-1.48,2.38,liftZ+.02,decor);premiumBox(.16,4.20,.16,lime,liftX+1.48,2.38,liftZ+.02,decor);
      // Painel do elevador e scanner físico.
      premiumBox(.72,1.35,.52,graphite2,.45,.78,-.55,decor);premiumBox(.52,.46,.055,0x5ad8ff,.45,1.06,-.27,decor);premiumBox(.52,.055,.40,lime,.45,.30,-.52,decor);
      premiumBox(1.05,1.22,.60,graphite2,.85,.72,-2.55,decor);premiumBox(.80,.50,.06,0x58d9f5,.85,1.05,-2.22,decor);
      // Marcadores físicos de componentes. Só ficam visíveis quando o carro estiver erguido.
      const markerDefs=[['engine','MOTOR',0,3.25,-1.72],['brakes','FREIOS',-1.62,2.78,-.55],['suspension','SUSPENSÃO',1.62,2.78,-.55],['steering','DIREÇÃO',-1.45,2.78,1.12],['electrical','ELÉTRICA',1.45,2.78,1.12],['cooling','ARREFEC.',0,3.35,1.52]],markerMap={},markers=new THREE.Group();markers.position.set(liftX,0,liftZ);decor.add(markers);
      for(const [pid,label,mx,my,mz] of markerDefs){const mg=new THREE.Group();mg.position.set(mx,my,mz);const dot=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),new THREE.MeshStandardMaterial({color:0x6bd98a,emissive:0x173d24,emissiveIntensity:.55,roughness:.35}));mg.add(dot);const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.30),new THREE.MeshStandardMaterial({map:signTexture(label,'#161b20','#ffffff'),roughness:.48,side:THREE.DoubleSide}));tag.position.set(0,.32,0);mg.add(tag);mg.visible=false;markers.add(mg);markerMap[pid]={group:mg,dot};}
      // Componentes automotivos reconhecíveis. Acompanham a plataforma e só aparecem com o elevador erguido.
      const underbody=new THREE.Group(),underbodyMap={};underbody.position.set(0,.56,0);underbody.visible=false;liftPlatform.add(underbody);
      const workshopPart=(id,x,y,z,scale=1)=>{const part=createWorkshopServicePartVisual(id,underbody);part.group.position.set(x,y,z);part.group.scale.setScalar(scale);underbodyMap[id]=part;return part.group;};
      workshopPart('engine',0,.08,-.82,.88);workshopPart('brakes',0,.05,.88,.82);workshopPart('suspension',0,.03,.18,.88);workshopPart('steering',0,.16,-.18,.86);workshopPart('electrical',.78,.22,-.72,.78);workshopPart('cooling',-.58,.18,-1.38,.72);
      // Bancadas e ferramental ao fundo.
      for(const x of[-.8,1.1,3.0]){premiumBox(1.55,1.05,.60,graphite2,x,.60,-5.20,decor);for(const y of[.38,.62,.86])premiumBox(1.34,.045,.64,steel,x,y,-5.18,decor);}
      const services=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.20),new THREE.MeshStandardMaterial({map:signTexture('MECÂNICA • ELÉTRICA • SCANNER • INJEÇÃO','#171c22','#b7ed20'),roughness:.50,side:THREE.DoubleSide}));services.position.set(.45,3.35,-5.72);decor.add(services);
      // Recepção técnica no lado direito, fora da faixa de circulação.
      premiumBox(2.7,.82,.82,graphite2,4.95,.54,2.85,decor);premiumBox(2.45,.07,.72,lime,4.95,.98,2.85,decor);premiumBox(.96,.66,.08,0x10354a,4.95,1.42,2.43,decor);
      const receptionSign=new THREE.Mesh(new THREE.PlaneGeometry(2.55,.62),new THREE.MeshStandardMaterial({map:signTexture('RECEPÇÃO TÉCNICA','#15191e','#f4f6f7'),roughness:.50,side:THREE.DoubleSide}));receptionSign.position.set(4.95,2.15,5.70);decor.add(receptionSign);
      // Escritório envidraçado thIAguinho no fundo direito, sem ocupar o box do elevador.
      premiumBox(.12,2.65,4.00,graphite2,3.60,1.48,-3.25,decor);premiumBox(3.25,2.65,.12,graphite2,5.18,1.48,-5.18,decor);premiumBox(.12,2.65,4.00,graphite2,6.78,1.48,-3.25,decor);
      const glassFront=new THREE.Mesh(new THREE.PlaneGeometry(3.08,2.15),glass);glassFront.position.set(5.18,1.50,-1.30);decor.add(glassFront);premiumBox(3.18,.08,.08,lime,5.18,2.65,-1.34,decor);
      premiumBox(1.80,.72,.70,graphite2,5.18,.55,-3.65,decor);premiumBox(1.0,.60,.08,0x0e2635,5.18,1.22,-4.02,decor);premiumBox(.72,.38,.055,0x3fd9ff,5.18,1.22,-4.06,decor);
      const digitalSign=new THREE.Mesh(new THREE.PlaneGeometry(2.85,.72),new THREE.MeshStandardMaterial({map:signTexture('thIAguinho • SOLUÇÕES DIGITAIS','#07101d','#ffffff'),roughness:.46,side:THREE.DoubleSide}));digitalSign.position.set(5.18,2.15,-5.10);decor.add(digitalSign);
      // A bancada legada continua preservada, agora posicionada fora da área do elevador.
      const table=createFurniture(house,'table',1.30,3.20,0,'Bancada e fundição');registerInteractable({id:'workshop-workbench-open',type:'activity',activity:'workshop',icon:'🛠',label:table.label,x:table.x,z:table.z,radius:1.85,priority:190,action:()=>useActivity('workshop',house)});createFurniture(house,'chest',2.65,3.25,0,'Baú de ferramentas');
      world.workshopLift={x:house.x+liftX,z:house.z+liftZ,heading:Math.PI,platform:liftPlatform,markers,markerMap,underbody,underbodyMap,vehicleId:'',raised:false,busy:false,height:0,maxHeight:2.35,houseId:house.id};
      registerInteractable({id:'workshop-lift-drive',type:'workshop',icon:'🚗',label:'Box do elevador',vehicleOnly:true,x:house.x+liftX,z:house.z+liftZ+1.25,radius:3.8,priority:1280,getActionLabel:()=>typeof workshopLiftDriveActionLabel==='function'?workshopLiftDriveActionLabel():'Alinhar',action:()=>typeof workshopStageCurrentVehicle==='function'?workshopStageCurrentVehicle():false});
      registerInteractable({id:'workshop-lift-control',type:'workshop',icon:'⬆️',x:house.x+.45,z:house.z-.55,radius:2.25,priority:510,getLabel:()=>typeof workshopLiftContextLabel==='function'?workshopLiftContextLabel():'Painel do elevador',getActionLabel:()=>typeof workshopLiftActionLabel==='function'?workshopLiftActionLabel():'Erguer',action:()=>typeof handleWorkshopLiftControl==='function'?handleWorkshopLiftControl():false});
      registerInteractable({id:'workshop-service-desk',type:'workshop',icon:'📋',label:'Recepção / Ordem de Serviço',x:house.x+4.95,z:house.z+2.85,radius:2.15,priority:335,action:()=>typeof openWorkshopServiceDesk==='function'?openWorkshopServiceDesk():openWorkshop()});
      registerInteractable({id:'workshop-scanner-desk',type:'workshop',icon:'📟',label:'Scanner e diagnóstico',x:house.x+.85,z:house.z-2.55,radius:1.85,priority:345,action:()=>typeof openWorkshopLiftInspection==='function'&&world.workshopLift?.raised?openWorkshopLiftInspection():openWorkshopServiceDesk()});
      registerInteractable({id:'workshop-digital-office',type:'workshop',icon:'💻',label:'thIAguinho • Criar projeto',x:house.x+5.18,z:house.z-3.10,radius:2.10,priority:350,action:()=>typeof openThiaguinhoStudio==='function'?openThiaguinhoStudio():openTioThiagoHub()});
    } else if(type==='school'){
      premiumBox(8.2,.08,6.2,materials.schoolFloor,house.x,.16,house.z);premiumBox(8.1,1.0,.12,materials.interiorWall,house.x,.68,house.z-3.08);
      const board=createFurniture(house,'board',0,-2.75,0,'Começar aula');registerActivity(house,board,'school');
      for(const [x,z] of [[-2.6,-1.2],[0,-1.2],[2.6,-1.2],[-2.6,.65],[0,.65],[2.6,.65]])createFurniture(house,'desk',x,z,0,'Carteira escolar');
      createFurniture(house,'bookshelf',3.25,2.15,0,'Biblioteca');createFurniture(house,'plant',-3.3,2.1,0,'Horta da turma');createFurniture(house,'desk',0,2.15,0,'Mesa do professor');const teacherWardrobe=createFurniture(house,'wardrobe',-3.25,1.15,0,'Uniformes profissionais');registerActivity(house,teacherWardrobe,'wardrobe');for(const x of [-2.6,0,2.6])premiumBox(.7,.85,.28,0x4a90c4,house.x+x,.62,house.z+2.78);for(const [px,c] of [[-2.5,0xffd34d],[0,0x64d986],[2.5,0xff728e]])premiumBox(1.45,.85,.08,c,house.x+px,1.75,house.z-3.0);for(const px of [-2.7,0,2.7])premiumBox(.72,.08,.72,0xfff4d8,house.x+px,2.58,house.z);const lampA=addGlow(house.x-2.4,2.35,house.z,0xfff6cf,5),lampB=addGlow(house.x+2.4,2.35,house.z,0xfff6cf,5);house.interiorObjects.push(lampA,lampB);
    } else if(type==='police'){
      premiumBox(8.2,.08,6.2,materials.concrete,house.x,.16,house.z);premiumBox(8.1,1.05,.12,materials.interiorWall,house.x,.7,house.z-3.08);
      const radio=createFurniture(house,'radio',-2.7,-1.4,0,'Central de segurança');registerActivity(house,radio,'police');
      createFurniture(house,'desk',0,-1.1,0,'Mesa da patrulha');createFurniture(house,'bench',2.5,1.8,0,'Banco de espera');
      createFurniture(house,'board',0,2.7,0,'Regras de trânsito');createFurniture(house,'bookshelf',-3.25,1.7,0,'Guias de segurança');const policeWardrobe=createFurniture(house,'wardrobe',3.15,-1.85,0,'Armário de uniformes');registerActivity(house,policeWardrobe,'wardrobe');premiumBox(8.0,.22,.1,0x245da8,house.x,1.08,house.z-3.0);for(const px of [-1.0,0,1.0])premiumBox(.72,.42,.08,0x7edfff,house.x+px,1.48,house.z-2.94);premiumBox(1.65,.08,1.0,0x2a4058,house.x,2.55,house.z);
    } else if(type==='firestation'){
      premiumBox(8.2,.08,6.2,materials.concrete,house.x,.16,house.z);premiumBox(8.1,1.05,.12,materials.fireWall||materials.interiorWall,house.x,.7,house.z-3.08);
      const dispatch=createFurniture(house,'radio',-2.5,-1.35,0,'Central dos bombeiros');registerActivity(house,dispatch,'firestation');
      createFurniture(house,'desk',0,-1.15,0,'Mesa de emergência');const fireWardrobe=createFurniture(house,'wardrobe',2.9,-1.5,0,'Uniformes de bombeiro');registerActivity(house,fireWardrobe,'wardrobe');createFurniture(house,'bench',0,1.7,0,'Banco da equipe');createFurniture(house,'board',-2.8,2.35,0,'Treinamento de segurança');
      for(const x of [1.75,2.45,3.15])premiumCylinder(.18,1.7,0xe24b3f,house.x+x,.9,house.z+2.45,worldGroup,12);for(let line=-3;line<=3;line+=1.2)premiumBox(.48,.025,5.6,line<0?0xf1c83b:0x222b34,house.x+line,.205,house.z);for(const px of [-2.9,-2.15,-1.4]){premiumBox(.62,1.65,.55,0xc43d38,house.x+px,.88,house.z+2.35);premiumBox(.5,.18,.62,0xf1cc3d,house.x+px,1.8,house.z+2.35);}premiumBox(2.2,.08,1.0,0xfff0cf,house.x,2.55,house.z);
    } else if(type==='neighbor'){
      const sofa=createFurniture(house,'sofa',1,-1.5,0xef6c9d,'Sentar');registerActivity(house,sofa,'sofa');
      const tv=createFurniture(house,'tv',1,.2,0,'Assistir TV');registerActivity(house,tv,'tv');
      createFurniture(house,'bed',-2.5,-1.7,0,'Cama');
    }
    registerInteractable({id:`exit-${house.id}`,type:'exit',icon:'🚪',label:'Sair da casa',x:house.x,z:house.z+2.65,radius:1.5,priority:240,houseId:house.id,action:()=>exitHouse()});
  }
  function registerActivity(house,item,activity){
    const priority=({stove:180,fridge:170,sink:165,bed:160,shower:155,tv:150,sofa:145,wardrobe:140,chest:120,shop:170,workshop:170,school:185,police:185,firestation:190})[activity]||100;
    registerInteractable({id:`${activity}-${house.id}`,type:'activity',activity,icon:activityIcon(activity),label:item.label,x:item.x,z:item.z,radius:1.75,priority,houseId:house.id,action:()=>useActivity(activity,house)});
  }
  function activityIcon(type){return ({bed:'🛏',sofa:'🛋',tv:'📺',fridge:'🍎',stove:'🍳',sink:'💧',shower:'🚿',chest:'🎁',shop:'🛒',workshop:'🛠',wardrobe:'👕',school:'🏫',police:'🛡️',firestation:'🚒'})[type]||'✋';}

  const OTTHI_TOY_THEMES=Object.freeze(['lego','minecraft','playmobil','mario-world']);
  function normalizeToyTheme(value){const raw=String(value??'').trim().toLowerCase();if(raw==='lego'||raw==='leggo')return'lego';if(raw==='minecraft'||raw==='manycraft')return'minecraft';if(raw==='playmobil')return'playmobil';if(raw==='mario'||raw==='mario-world'||raw==='marioworld')return'mario-world';return'lego';}
  function normalizeVehicleBodyType(value){const raw=String(value??'').trim().toLowerCase();if(['moto','motorcycle','bike','scooter'].includes(raw))return'moto';if(['truck','caminhao','caminhão','lorry'].includes(raw))return'truck';if(['utility','utilitario','utilitário','van','pickup'].includes(raw))return'utility';return'small';}
  function vehicleThemeIcon(kind){return kind==='moto'?'🏍️':kind==='truck'?'🚚':kind==='utility'?'🚐':'🚗';}
  function npcToyTheme(id){
    const core={nino:'lego',luna:'minecraft',teo:'playmobil',bia:'mario-world',maya:'lego',clara:'minecraft',rafa:'playmobil',davi:'mario-world',leo:'lego'};
    if(core[id])return core[id];let h=2166136261;for(const ch of String(id)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return OTTHI_TOY_THEMES[h%OTTHI_TOY_THEMES.length];
  }
  function hideNpcLegacyVisual(npc){
    const keep=new Set([npc.body,npc.head,npc.limbs?.leftArm,npc.limbs?.rightArm,npc.limbs?.leftLeg,npc.limbs?.rightLeg,npc.badge]);
    for(const child of npc.group.children)if(child?.isMesh&&!keep.has(child))child.visible=false;
    for(const mesh of[npc.body,npc.head]){if(!mesh?.material)continue;if(!mesh.userData.otthiThemeHiddenMaterial){mesh.userData.otthiThemeHiddenMaterial=mesh.material;mesh.material=mesh.material.clone();mesh.material.visible=false;}}
    for(const limb of Object.values(npc.limbs||{}))for(const child of limb?.children||[])if(child?.isMesh)child.visible=false;
  }
  function npcThemeMat(value,rough=.62){return typeof value==='number'?renderMat(value,{roughness:rough}):value;}
  function npcThemeBox(parent,w,h,d,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),npcThemeMat(material));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function npcThemeSphere(parent,r,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),npcThemeMat(material));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function npcThemeCylinder(parent,r,h,material,x=0,y=0,z=0,sides=18){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,sides),npcThemeMat(material));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function applyNpcToyTheme(npc,theme=npcToyTheme(npc?.id)){
    if(!npc?.group||npc.id==='michelle-ottovias')return npc;theme=normalizeToyTheme(theme);hideNpcLegacyVisual(npc);npc.theme=theme;npc.group.userData.toyTheme=theme;
    const marioLuigi=(String(npc.id||'').split('').reduce((sum,ch)=>sum+ch.charCodeAt(0),0)%2)===0,color=Number(npc.color||0x2787d8),primary=npcThemeMat(theme==='mario-world'?(marioLuigi?0x2e9d4d:0xd83b35):color,.55),dark=npcThemeMat(shadeColor(color,-42),.68),pants=npcThemeMat(theme==='mario-world'?0x245db2:theme==='minecraft'?0x394c78:0x30445f,.74),skin=npcThemeMat(theme==='lego'?0xf3d44e:theme==='playmobil'?0xffd777:0xd8a079,.68),black=npcThemeMat(0x1b2027,.72),white=npcThemeMat(0xf7f7f3,.5);
    const headRoot=new THREE.Group(),bodyRoot=new THREE.Group();npc.head.add(headRoot);npc.body.add(bodyRoot);npc.userData={...(npc.userData||{}),toyTheme:theme,toyThemeRoots:[headRoot,bodyRoot]};
    const {leftArm,rightArm,leftLeg,rightLeg}=npc.limbs;
    if(theme==='lego'){
      npcThemeCylinder(headRoot,.34,.55,skin,0,0,0,24);npcThemeCylinder(headRoot,.12,.07,skin,0,.31,0,20);npcThemeBox(bodyRoot,.96,.92,.56,primary,0,0,0);npcThemeBox(bodyRoot,.78,.18,.58,dark,0,-.48,0);
      for(const arm of[leftArm,rightArm]){npcThemeCylinder(arm,.12,.52,primary,0,-.27,0,14);const hand=npcThemeCylinder(arm,.13,.12,skin,0,-.62,.02,18);hand.rotation.z=Math.PI/2;}
      for(const leg of[leftLeg,rightLeg]){npcThemeBox(leg,.28,.7,.32,pants,0,-.35,0);npcThemeBox(leg,.34,.15,.44,black,0,-.76,.08);}
      for(const x of[-.13,.13])npcThemeSphere(headRoot,.045,black,x,.05,.34);npcThemeBox(headRoot,.2,.035,.025,black,0,-.14,.35);
    }else if(theme==='minecraft'){
      npcThemeBox(headRoot,.72,.72,.72,skin,0,0,0);npcThemeBox(bodyRoot,.96,1.0,.58,primary,0,0,0);
      for(const arm of[leftArm,rightArm])npcThemeBox(arm,.26,.68,.26,primary,0,-.34,0);for(const leg of[leftLeg,rightLeg]){npcThemeBox(leg,.28,.74,.28,pants,0,-.37,0);npcThemeBox(leg,.32,.14,.42,black,0,-.79,.07);}
      for(const x of[-.15,.15])npcThemeBox(headRoot,.11,.07,.035,black,x,.07,.37);npcThemeBox(headRoot,.23,.04,.035,0x7b3f44,0,-.16,.37);npcThemeBox(headRoot,.76,.15,.76,dark,0,.43,0);
    }else if(theme==='playmobil'){
      npcThemeSphere(headRoot,.42,skin,0,0,0,1,1.08,.98);npcThemeCylinder(bodyRoot,.42,.92,primary,0,0,0,20);npcThemeCylinder(bodyRoot,.31,.16,dark,0,-.49,0,20);
      for(const arm of[leftArm,rightArm]){npcThemeCylinder(arm,.11,.57,primary,0,-.28,0,14);npcThemeSphere(arm,.13,skin,0,-.61,.02,1,.86,1);}
      for(const leg of[leftLeg,rightLeg]){npcThemeCylinder(leg,.13,.68,pants,0,-.33,0,14);npcThemeBox(leg,.31,.15,.42,black,0,-.72,.07);}
      const hair=npcThemeSphere(headRoot,.44,dark,0,.16,-.08,1.02,.56,.98);for(const x of[-.14,.14])npcThemeSphere(headRoot,.048,black,x,.06,.425,1,1.05,.72);npcThemeBox(headRoot,.19,.038,.024,0xa44f58,0,-.16,.432);npcThemeSphere(headRoot,.036,skin,0,-.035,.43,1.1,.9,.55);
    }else{
      npcThemeSphere(headRoot,.43,skin,0,0,0,1.02,1.04,.98);npcThemeCylinder(bodyRoot,.4,.88,primary,0,0,0,18);npcThemeBox(bodyRoot,.7,.58,.55,pants,0,-.10,.03);
      for(const arm of[leftArm,rightArm]){npcThemeCylinder(arm,.11,.56,primary,0,-.27,0,14);npcThemeSphere(arm,.14,white,0,-.61,.02);}
      for(const leg of[leftLeg,rightLeg]){npcThemeCylinder(leg,.13,.65,pants,0,-.31,0,14);npcThemeBox(leg,.34,.16,.48,0x5b341e,0,-.7,.1);}
      npcThemeSphere(headRoot,.105,skin,0,-.01,.455,1.35,1,1);npcThemeBox(headRoot,.19,.045,.024,0x2b1712,-.08,-.14,.448);npcThemeBox(headRoot,.19,.045,.024,0x2b1712,.08,-.14,.448);for(const x of[-.14,.14])npcThemeSphere(headRoot,.046,black,x,.07,.445,1,1.05,.72);npcThemeSphere(headRoot,.48,primary,0,.35,-.02,1.18,.34,1.18);npcThemeBox(headRoot,.62,.09,.3,primary,0,.31,.34);const emblem=npcThemeSphere(headRoot,.105,white,0,.39,.405,1,.9,.35);const letter=new THREE.Mesh(new THREE.PlaneGeometry(.11,.11),new THREE.MeshStandardMaterial({map:signTexture(marioLuigi?'L':'M','#ffffff',marioLuigi?'#2e9d4d':'#d83b35'),transparent:true,side:THREE.DoubleSide,roughness:.5}));letter.position.set(0,.39,.444);headRoot.add(letter);
    }
    for(const root of[npc.group,headRoot,bodyRoot])root.traverse?.(o=>{if(o.isMesh&&o.visible)addVoxelOutline(o,0x132238,.18);});return npc;
  }
  function clearThemedVehicleGeometry(group){if(!group)return;for(const child of[...group.children]){group.remove(child);try{disposeDetachedVisual?.(child);}catch{}}group.userData.wheels=[];group.userData.frontWheels=[];}
  function buildThemedVehicleGeometry(group,options={}){
    if(!group)return group;clearThemedVehicleGeometry(group);const theme=normalizeToyTheme(options.theme),bodyType=normalizeVehicleBodyType(options.bodyType||options.kind),appearance=options.appearance||options;
    const chassis=renderMat(Number(appearance.chassis??0x26384e),{roughness:.52,metalness:.12}),primary=renderMat(Number(appearance.primary??0xf28a22),{roughness:.45,metalness:.10}),primaryDark=renderMat(Number(appearance.primaryDark??appearance.primary??0xc85b16),{roughness:.54}),secondary=renderMat(Number(appearance.secondary??0x0aa7b8),{roughness:.45}),glass=renderMat(Number(appearance.glass??0x17364b),{roughness:.16,metalness:.18,transparent:true,opacity:.82}),black=renderMat(0x15191f,{roughness:.88}),white=renderMat(0xf7f7f2,{roughness:.35}),yellow=renderMat(0xffd84d,{roughness:.42});
    group.userData.appearanceMaterials={chassis,primary,primaryDark,secondary,glass};group.userData.toyTheme=theme;group.userData.bodyType=bodyType;const wheels=group.userData.wheels,front=group.userData.frontWheels;
    const B=(w,h,d,m,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
    const S=(r,m,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
    const W=(x,z,r=.34,width=.28,isFront=false)=>{const holder=new THREE.Group();holder.position.set(x,.25,z);group.add(holder);const wheel=new THREE.Mesh(new THREE.CylinderGeometry(r,r,width,16),black);wheel.rotation.z=Math.PI/2;wheel.castShadow=true;holder.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.38,r*.38,width+.035,12),theme==='mario-world'?white:secondary);hub.rotation.z=Math.PI/2;holder.add(hub);wheels.push(wheel);if(isFront)front.push(holder);return holder;};
    if(bodyType==='moto'){
      W(0,-.82,.35,.13,false);W(0,.82,.35,.13,true);B(.16,.18,1.18,chassis,0,.48,0);B(.44,.18,.5,primary,0,.68,-.12);B(.54,.07,.08,white,0,.94,.54);B(.18,.28,.22,glass,0,.84,.30);
      if(theme==='lego'){B(.34,.18,.38,primaryDark,0,.82,-.42);S(.07,yellow,-.1,.95,-.06);S(.07,yellow,.1,.95,-.06);}else if(theme==='minecraft'){B(.38,.26,.38,primaryDark,0,.84,-.43);B(.22,.2,.24,glass,0,.9,.25);}else if(theme==='playmobil'){S(.22,primary,0,.78,-.35,1.25,.72,1.15);S(.14,white,0,.9,.24,1.2,.72,1);}else{S(.18,primaryDark,0,.79,-.35,1.35,.72,1.15);S(.10,white,0,.88,.30,1.2,.72,1);}
    }else if(bodyType==='truck'){
      B(2.2,.34,3.65,chassis,0,.27,0);B(1.76,.82,1.30,primary,0,.75,1.08);B(1.96,.92,1.68,secondary,0,.82,-.78);B(1.28,.38,.72,glass,0,1.02,.92);for(const [x,z,f]of[[-.98,-1.18,false],[.98,-1.18,false],[-.98,.05,false],[.98,.05,false],[-.98,1.18,true],[.98,1.18,true]])W(x,z,.39,.31,f);
      if(theme==='lego'){for(const [x,z]of[[-.42,-1.42],[0,-1.42],[.42,-1.42]])S(.12,primaryDark,x,1.39,z,1,1.15,1);B(1.78,.14,.14,yellow,0,.58,1.82);}else if(theme==='minecraft'){B(2.0,.25,1.7,primaryDark,0,1.35,-.78);B(.22,.32,3.2,white,-1.08,.57,0);B(.22,.32,3.2,white,1.08,.57,0);}else if(theme==='playmobil'){S(.38,secondary,0,1.28,-1.35,2.7,.62,1.05);S(.16,white,-.52,.83,1.72);S(.16,white,.52,.83,1.72);}else{S(.22,secondary,0,1.25,-1.38,1.5,.8,1);B(1.25,.14,.2,primaryDark,0,.44,-1.75);S(.16,white,-.56,.62,1.76);S(.16,white,.56,.62,1.76);}
    }else if(bodyType==='utility'){
      B(2.0,.34,3.0,chassis,0,.27,0);B(1.76,.64,1.24,primary,0,.66,.76);B(1.78,.7,1.24,secondary,0,.76,-.62);B(1.25,.34,.7,glass,0,.96,.5);for(const [x,z,f]of[[-.9,-.9,false],[.9,-.9,false],[-.9,.9,true],[.9,.9,true]])W(x,z,.36,.28,f);
      if(theme==='lego'){for(const x of[-.4,0,.4])S(.1,primaryDark,x,1.2,-.95,1,1.15,1);B(1.38,.22,.75,secondary,0,.96,-.88);}else if(theme==='minecraft'){B(1.86,.2,1.3,primaryDark,0,1.18,-.62);B(.18,.38,2.52,white,-1.0,.48,0);B(.18,.38,2.52,white,1.0,.48,0);}else if(theme==='playmobil'){S(.26,secondary,0,1.18,-1.04,2.6,.66,1.05);S(.14,white,-.48,.78,1.4);S(.14,white,.48,.78,1.4);}else{S(.16,secondary,0,1.15,-.96,1.6,.75,1);B(1.12,.1,.18,primaryDark,0,.43,-1.43);S(.14,white,-.52,.58,1.43);S(.14,white,.52,.58,1.43);}
    }else{
      B(1.84,.34,2.56,chassis,0,.27,0);for(const [x,z,f]of[[-.84,-.79,false],[.84,-.79,false],[-.84,.79,true],[.84,.79,true]])W(x,z,.34,.28,f);
      if(theme==='lego'){B(1.72,.48,1.32,primary,0,.55,.52);B(1.5,.45,.9,secondary,0,.78,-.48);B(1.32,.3,.7,glass,0,.93,-.42);B(1.92,.16,.24,white,0,.31,1.34);for(const[x,z]of[[-.36,-.2],[.36,-.2],[-.12,-.54],[.12,-.54]])S(.1,primaryDark,x,1.15,z,1,1.15,1);}
      else if(theme==='minecraft'){B(1.72,.52,1.38,primary,0,.57,.5);B(1.52,.5,.96,secondary,0,.82,-.46);B(1.34,.32,.74,glass,0,.96,-.42);B(.18,.38,2.16,primaryDark,-.94,.45,0);B(.18,.38,2.16,primaryDark,.94,.45,0);}
      else if(theme==='playmobil'){S(.92,primary,0,.49,.18,1.02,.35,1.22);S(.72,secondary,0,.75,-.56,.94,.48,1.05);S(.58,glass,0,.91,-.38,.92,.42,1);S(.15,white,-.54,.54,1.19);S(.15,white,.54,.54,1.19);B(1.52,.12,.18,primaryDark,0,.34,-1.28);}
      else{S(.93,primary,0,.48,.14,1.05,.34,1.24);S(.7,secondary,0,.74,-.5,.92,.46,1.02);S(.52,glass,0,.9,-.36,.92,.4,1);S(.14,white,-.54,.56,1.20);S(.14,white,.54,.56,1.20);B(1.48,.12,.18,primaryDark,0,.34,-1.28);S(.12,yellow,0,.92,-.98,1.4,.7,1);}
    }
    group.traverse(o=>{if(o.isMesh)addVoxelOutline(o,0x14243a,.22);});return group;
  }

  function applyTioThiagoReferenceSkin(npc){
    if(!npc?.group)return npc;for(const toyRoot of npc.userData?.toyThemeRoots||[])toyRoot.visible=false;for(const limb of Object.values(npc.limbs||{}))for(const child of limb?.children||[])if(child?.isMesh)child.visible=false;if(npc.body?.material)npc.body.material.visible=false;if(npc.head?.material)npc.head.material.visible=false;
    const root=new THREE.Group();root.scale?.set?.(1.06,1.06,1.06);npc.group.add(root);npc.tioThiagoVisual=root;
    const skin=renderMat(0xb97855,{roughness:.68}),hair=renderMat(0x171515,{roughness:.75}),beard=renderMat(0x201a19,{roughness:.78}),black=renderMat(0x111318,{roughness:.67}),black2=renderMat(0x242830,{roughness:.62}),cyan=renderMat(0x18bde7,{roughness:.43,emissive:0x087c9a,emissiveIntensity:.15}),lime=renderMat(0xb9ef18,{roughness:.45,emissive:0x6f9700,emissiveIntensity:.12}),shoe=renderMat(0x35a8c9,{roughness:.58}),white=renderMat(0xf4f2ed,{roughness:.42}),eye=renderMat(0x211815,{roughness:.34});
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.84,14),black);torso.position.set(0,1.31,0);root.add(torso);premiumBox(.62,.12,.47,black2,0,.88,0,root);premiumBox(.30,.08,.035,cyan,0,1.44,.405,root);premiumBox(.18,.035,.04,white,.03,1.33,.418,root);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.37,16,12),skin);head.position.set(0,2.02,0);head.scale.set(.92,1.05,.90);root.add(head);const cap=new THREE.Mesh(new THREE.SphereGeometry(.37,14,10),hair);cap.position.set(0,2.18,-.02);cap.scale.set(.98,.55,.92);root.add(cap);
    for(const x of[-.13,.13]){const eyeWhite=new THREE.Mesh(new THREE.SphereGeometry(.041,8,6),white);eyeWhite.position.set(x,2.05,.34);root.add(eyeWhite);const pupil=new THREE.Mesh(new THREE.SphereGeometry(.023,8,6),eye);pupil.position.set(x,2.05,.374);root.add(pupil);}
    const beardJaw=new THREE.Mesh(new THREE.SphereGeometry(.285,14,10),beard);beardJaw.position.set(0,1.88,.09);beardJaw.scale.set(.92,.62,.82);root.add(beardJaw);const facePatch=new THREE.Mesh(new THREE.SphereGeometry(.27,14,10),skin);facePatch.position.set(0,1.99,.20);facePatch.scale.set(.84,.63,.73);root.add(facePatch);premiumBox(.22,.038,.025,beard,0,1.90,.385,root);
    for(const x of[-.43,.43]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.10,.115,.67,10),skin);arm.position.set(x,1.37,0);arm.rotation.z=x<0?-.08:.08;root.add(arm);premiumBox(.19,.22,.20,black,x,1.61,0,root);}
    for(const x of[-.17,.17]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.12,.135,.67,10),skin);leg.position.set(x,.51,0);root.add(leg);premiumBox(.29,.27,.32,black,x,.80,0,root);premiumBox(.30,.14,.44,shoe,x,.12,.08,root);premiumBox(.12,.045,.45,lime,x,.15,.31,root);}
    root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});return npc;
  }
  function createNPC(id,name,x,z,color,pathRadius=3){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    const hairPalette=[0x34251c,0x15191f,0x6a4429,0xb36b35,0xd5b36a,0x643e55],skinPalette=[0xffd7b1,0xeab589,0xbd825d,0x8d5b43,0x6f4637];
    const hash=String(id).split('').reduce((a,c)=>a+c.charCodeAt(0),0),hairColor=hairPalette[hash%hairPalette.length],skin=skinPalette[hash%skinPalette.length];
    const height=.92+(hash%5)*.025,shoulder=.39+(hash%3)*.025,shirt=renderMat(color,{roughness:.7}),shirtDark=renderMat(shadeColor(color,-32),{roughness:.74}),pants=renderMat(hash%2?0x294b75:0x43365f,{roughness:.78}),shoe=renderMat(hash%3===0?0xf4f5f7:0x202935,{roughness:.6}),skinMat=renderMat(skin,{roughness:.72}),hairMat=renderMat(hairColor,{roughness:.78});
    const body=new THREE.Mesh(new THREE.CylinderGeometry(shoulder*.78,shoulder,height,12),shirt);body.position.y=1.28;body.castShadow=true;body.receiveShadow=true;group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.39,16,11),skinMat);head.position.set(0,2.0,0);head.scale.set(.93,1.04,.9);head.castShadow=true;group.add(head);
    const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.405,14,9,0,Math.PI*2,0,Math.PI*.56),hairMat);hairCap.position.set(0,2.17,-.015);hairCap.scale.set(.97,.68,.94);hairCap.castShadow=true;group.add(hairCap);
    if(hash%4===0){for(const sx of[-1,1]){const lock=new THREE.Mesh(new THREE.SphereGeometry(.12,9,7),hairMat);lock.scale.set(.7,1.8,.8);lock.position.set(sx*.32,2.03,-.04);group.add(lock);}}
    else if(hash%4===1){const fringe=new THREE.Mesh(new THREE.SphereGeometry(.2,10,7),hairMat);fringe.scale.set(1.6,.45,.52);fringe.position.set(-.08,2.18,.29);group.add(fringe);}
    const eyeMat=renderMat(hash%3===0?0x3c5f72:0x20232a,{roughness:.4});for(const ex of[-.14,.14]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.042,8,6),eyeMat);eye.position.set(ex,2.03,.345);group.add(eye);}const nose=new THREE.Mesh(new THREE.SphereGeometry(.04,7,5),skinMat);nose.position.set(0,1.96,.37);nose.scale.set(.75,1.2,.75);group.add(nose);box(.15,.035,.026,0x9d5052,0,1.88,.365,group);
    const leftArm=new THREE.Group(),rightArm=new THREE.Group(),leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftArm.position.set(-.48,1.52,0);rightArm.position.set(.48,1.52,0);leftLeg.position.set(-.19,.82,0);rightLeg.position.set(.19,.82,0);group.add(leftArm,rightArm,leftLeg,rightLeg);
    const makeLimb=(parent,r,h,material,y)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.9,r,h,10),material);mesh.position.y=y;mesh.castShadow=true;parent.add(mesh);return mesh;};
    makeLimb(leftArm,.12,.66,shirt,-.28);makeLimb(rightArm,.12,.66,shirt,-.28);const lh=new THREE.Mesh(new THREE.SphereGeometry(.12,9,7),skinMat),rh=lh.clone();lh.position.y=-.63;rh.position.y=-.63;leftArm.add(lh);rightArm.add(rh);
    makeLimb(leftLeg,.14,.72,pants,-.31);makeLimb(rightLeg,.14,.72,pants,-.31);box(.29,.15,.42,shoe,0,-.72,.07,leftLeg);box(.29,.15,.42,shoe,0,-.72,.07,rightLeg);box(.7,.18,.54,shirtDark,0,.82,0,group);
    if(hash%5===0){const cap=new THREE.Mesh(new THREE.SphereGeometry(.42,12,8,0,Math.PI*2,0,Math.PI*.48),renderMat(0x2f7ed6,{roughness:.62}));cap.position.set(0,2.28,0);cap.scale.y=.55;group.add(cap);box(.28,.04,.3,0x2f7ed6,0,2.27,.39,group);}
    const npc={id,name,x,z,baseX:x,baseZ:z,color,group,pathRadius,phase:Math.random()*6.28,friendship:state.friendship[id]||0,body,head,limbs:{leftArm,rightArm,leftLeg,rightLeg},brain:{state:'idle',target:null,nextThink:0,fearUntil:0,lastVehicle:'',lastVehicleAt:0,lastPlayerAt:0,wanderUntil:0,memory:[]}};
    const badge=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTexture(name.charAt(0),'#ffffff','#15314b'),transparent:true,depthWrite:false}));badge.position.set(0,2.85,0);badge.scale.set(.5,.5,.5);badge.visible=false;group.add(badge);npc.badge=badge;
    if(id!=='michelle-ottovias')applyNpcToyTheme(npc,npcToyTheme(id));world.npcs.push(npc);registerInteractable({id:`npc-${id}`,type:'npc',icon:'💬',label:`Conversar com ${name}`,radius:2.7,priority:160,getPos:()=>({x:npc.group.position.x,z:npc.group.position.z}),action:()=>talkToNPC(npc)});return npc;
  }

  function createNpcMobility(npc,type,route,speed){
    if(!npc||!Array.isArray(route)||route.length<2)return npc;const ride=new THREE.Group();npc.group.add(ride);const wheels=[];
    if(type==='car'){
      premiumBox(1.72,.34,2.45,0x24364d,0,.35,0,ride);premiumBox(1.55,.45,1.12,npc.color,0,.62,.43,ride);premiumBox(1.3,.4,.78,0x163049,0,.82,-.45,ride);
      for(const p of [[-.78,.28,-.72],[.78,.28,-.72],[-.78,.28,.72],[.78,.28,.72]]){const wheel=premiumCylinder(.28,.24,0x121821,p[0],p[1],p[2],ride,10);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}
    }else if(type==='moto'){
      for(const z of [-.72,.72]){const wheel=premiumCylinder(.34,.13,0x111822,0,.36,z,ride,12);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}premiumBox(.28,.26,1.15,npc.color,0,.58,0,ride);premiumBox(.56,.15,.42,0x202c3b,0,.76,-.12,ride);premiumBox(.7,.06,.08,0xd7e2eb,0,1.05,.53,ride);
    }else if(type==='bike'){
      for(const z of [-.72,.72]){const wheel=premiumCylinder(.34,.07,0x17202b,0,.36,z,ride,14);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}premiumBox(.08,.65,1.2,npc.color,0,.62,0,ride);premiumBox(.58,.07,.08,0xe8eef3,0,1.05,.62,ride);premiumBox(.45,.12,.34,0x25364a,0,.84,-.2,ride);
    }else{
      premiumBox(.62,.1,1.2,npc.color,0,.12,0,ride);for(const p of [[-.25,.08,-.42],[.25,.08,-.42],[-.25,.08,.42],[.25,.08,.42]]){const wheel=premiumCylinder(.09,.08,0x1c2633,p[0],p[1],p[2],ride,8);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}
    }
    ride.traverse(o=>{if(o.isMesh)addVoxelOutline(o,0x132238,.22);});const projected=buildTrafficRoute(route.map(p=>({x:p[0],z:p[1]})),true);npc.group.position.set(projected[0].x,0,projected[0].z);npc.group.userData.roadPath=projected;npc.group.userData.trafficCorridor=type==='car'?1.05:.82;npc.baseX=projected[0].x;npc.baseZ=projected[0].z;npc.mobility={id:`mobility-${npc.id}`,type,route:projected,index:1,speed:speed||({car:4.4,moto:4.8,bike:3.2,skate:2.8})[type]||3,currentSpeed:0,radius:type==='car'?1.45:type==='moto'?.9:.7,group:npc.group,ride,wheels};return npc;
  }
  function createEnemy(type,x,z){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    if(type==='slime'){box(1.35,.85,1.35,0x31c65b,0,.45,0,group);box(.18,.12,.05,0xff2441,-.28,.55,.7,group);box(.18,.12,.05,0xff2441,.28,.55,.7,group);}
    else if(type==='bat'){box(1.0,.75,1.0,0x35165e,0,1.4,0,group);box(.8,.18,.45,0x8c4ddb,-.8,1.4,0,group);box(.8,.18,.45,0x8c4ddb,.8,1.4,0,group);box(.12,.1,.05,0xff31f5,-.22,1.48,.54,group);box(.12,.1,.05,0xff31f5,.22,1.48,.54,group);}
    else {box(1.5,1.8,1.2,0x788495,0,1.0,0,group);box(1.0,.8,1.0,0x647080,0,2.2,0,group);box(.14,.1,.05,0xff293f,-.22,2.25,.52,group);box(.14,.1,.05,0xff293f,.22,2.25,.52,group);}
    const enemy={id:`enemy-${type}-${world.enemies.length}`,type,x,z,baseX:x,baseZ:z,group,hp:type==='golem'?3:1,phase:Math.random()*6.28,dead:false,lastHit:0};world.enemies.push(enemy);return enemy;
  }
  function createCrystal(x,y,z,secret=false){
    const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.48,0),mat(secret?0xa855f7:0x38d8ff,{emissive:secret?0x7e22ce:0x0a9dc0,emissiveIntensity:.7,metalness:.08,roughness:.22}));mesh.position.set(x,y,z);mesh.castShadow=true;worldGroup.add(mesh);addGlow(x,y,z,secret?0xa855f7:0x38d8ff,3);
    world.crystals.push({id:`crystal-${world.crystals.length}`,x,y,z,mesh,got:false,secret});
  }
  function createChest(id,x,z,secret=false){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);box(1.2,.72,.9,materials.wood,0,.36,0,group);const lid=box(1.25,.22,.95,secret?0xa855f7:0xffd84d,0,.84,0,group);const chest={id,x,z,group,lid,opened:!!state.flags[`chest_${id}`],secret};if(chest.opened)lid.rotation.x=-.6;registerInteractable({id:`chest-${id}`,type:'chest',icon:'🎁',label:secret?'Pegar presente secreto':'Abrir presente/baú',x,z,radius:2,priority:200,action:()=>openChest(chest)});return chest;
  }
  function createPlatform(x,y,z,w=3,d=3,color=0x8b5a2b){box(w,y,d,color,x,y/2,z);registerPlatform(x,z,w,d,y);}
  function vehicleById(id){return (world.vehicles||[]).find(v=>v.id===id)||null;}
  function currentVehicleRef(){if(activeVehicleRef)return activeVehicleRef;const byId=vehicleById(player.car.id);if(byId)return byId;if(world.activeVehicle)return world.activeVehicle;return player.car.id?null:(world.vehicle||null);}
  function applyVehicleAppearance(vehicle){
    const a=vehicle?.appearance||{},theme=normalizeToyTheme(vehicle?.theme||a.theme),bodyType=normalizeVehicleBodyType(vehicle?.bodyType||a.bodyType||vehicle?.kind);if(vehicleVisual)buildThemedVehicleGeometry(vehicleVisual,{theme,bodyType,appearance:a});
    if(typeof applyServiceVehicleVisual==='function')applyServiceVehicleVisual(vehicle);
  }
  function persistParkedVehicle(vehicle){
    if(!vehicle||!state.vehicles)return;state.vehicles.parked[vehicle.id]={x:+vehicle.group.position.x.toFixed(2),z:+vehicle.group.position.z.toFixed(2),heading:+vehicle.group.rotation.y.toFixed(3)};state.vehicles.lastUsedId=vehicle.id;
  }
  function createToyCar(x,z,options={}){
    const id=options.id||`city-car-${world.vehicles.length+1}`,existing=vehicleById(id);if(existing)return existing;
    const baseX=Number.isFinite(Number(x))?Number(x):0,baseZ=Number.isFinite(Number(z))?Number(z):0,baseHeading=Number(options.heading??0),origin=v704ClampWorldPoint(baseX,baseZ,.9),saved=state.vehicles?.parked?.[id]||{},heading=Number(saved.heading??baseHeading),group=new THREE.Group(),rawX=Number(saved.x??origin.x),rawZ=Number(saved.z??origin.z),spawn=v704ClampWorldPoint(Number.isFinite(rawX)?rawX:origin.x,Number.isFinite(rawZ)?rawZ:origin.z,.9);group.position.set(spawn.x,0,spawn.z);group.rotation.y=heading;group.userData.vehicleId=id;group.userData.vehicleSpawn={x:origin.x,z:origin.z,heading:baseHeading};worldGroup.add(group);
    const theme=normalizeToyTheme(options.theme||'lego'),bodyType=normalizeVehicleBodyType(options.bodyType||options.kind),kind=String(options.kind||bodyType==='moto'?'moto':bodyType==='truck'?'truck':bodyType==='utility'?'utility':'car'),appearance={chassis:options.chassis??0x26384e,primary:options.primary??0xf28a22,primaryDark:options.primaryDark??options.primary??0xc85b16,secondary:options.secondary??0x0aa7b8,glass:options.glass??0x17364b,theme,bodyType};
    buildThemedVehicleGeometry(group,{theme,bodyType,appearance});const garageStored=!!state.vehicles?.garage?.stored?.[id],radius=Number(options.radius||(bodyType==='truck'?2.15:bodyType==='utility'?1.8:bodyType==='moto'?1.0:1.55)),vehicle={id,x:group.position.x,z:group.position.z,heading,spawnX:origin.x,spawnZ:origin.z,spawnHeading:baseHeading,group,label:options.label||'Veículo',kind,bodyType,theme,serviceType:options.serviceType||'',appearance,occupied:false,radius,garageStored};group.visible=!garageStored;world.vehicles.push(vehicle);if(!world.vehicle)world.vehicle=vehicle;
    registerInteractable({id:`vehicle-${id}`,type:'vehicle',icon:vehicleThemeIcon(kind),label:`Entrar: ${vehicle.label}`,radius:bodyType==='truck'?3.2:bodyType==='moto'?2.2:2.6,priority:155,getPos:()=>({x:vehicle.group.position.x,z:vehicle.group.position.z}),available:()=>!vehicle.occupied&&vehicle.group.visible,action:()=>enterVehicle(vehicle)});return vehicle;
  }
  function restorePersistedVehicleTransforms(){
    if(!world?.vehicles||!state.vehicles?.parked)return 0;let moved=0;for(const vehicle of world.vehicles){if(!vehicle?.id||!vehicle.group||vehicle.occupied||player.vehicle&&String(player.car?.id||'')===String(vehicle.id))continue;const saved=state.vehicles.parked[String(vehicle.id)];if(!saved)continue;const rawX=Number(saved.x),rawZ=Number(saved.z),rawHeading=Number(saved.heading);if(!Number.isFinite(rawX)||!Number.isFinite(rawZ))continue;const point=v704ClampWorldPoint(rawX,rawZ,.9),heading=Number.isFinite(rawHeading)?rawHeading:Number(vehicle.heading||0);vehicle.group.position.set(point.x,groundHeightAt(point.x,point.z),point.z);vehicle.group.rotation.y=heading;vehicle.x=point.x;vehicle.z=point.z;vehicle.heading=heading;moved++;}return moved;
  }

  function createWaypointMarker(){
    const group=new THREE.Group();
    box(.32,6,.32,mat(0x38d8ff,{transparent:true,opacity:.48}),0,3,0,group);
    const top=new THREE.Mesh(new THREE.OctahedronGeometry(.65,0),mat(0x6ee94b,{emissive:0x35c728,emissiveIntensity:.75}));top.position.y=6.4;group.add(top);
    group.visible=false;worldGroup.add(group);world.waypointMarker=group;updateWaypointMarker();
  }
  function updateWaypointMarker(){
    if(!world.waypointMarker)return;
    const wp=state.waypoint;world.waypointMarker.visible=!!wp;
    if(wp)world.waypointMarker.position.set(wp.x,0,wp.z);
  }
  function createAthleticsGym(){
    // V704: autoridade única. Chamadas legadas reutilizam o complexo já existente.
    return typeof createSportsComplexV704==='function'?createSportsComplexV704():world.gym;
  }
  function createSizeChallenges(){
    const mini=worldLayoutPoint('miniTunnel'),crouch=worldLayoutPoint('crouchTunnel'),giant=worldLayoutPoint('giantGate');
    // Passagem mini: laterais sólidas e vão central livre.
    box(.7,2.5,6,0x64748b,mini.x-3,1.25,mini.z);box(.7,2.5,6,0x64748b,mini.x+3,1.25,mini.z);box(6.7,.65,6,0x64748b,mini.x,2.2,mini.z);registerCollider(mini.x-3,mini.z,.7,6,{challenge:'mini'});registerCollider(mini.x+3,mini.z,.7,6,{challenge:'mini'});
    registerInteractable({id:'mini-tunnel',type:'challenge',icon:'◱',label:'Passagem pequena',x:mini.x,z:mini.z+4.2,radius:3,priority:110,action:()=>{if(player.scaleMode!=='mini'){toast('Use o botão MINI para passar.','warn',2200);return;}player.x=mini.x;player.z=mini.z-4.2;setFlag('miniPassage');addXP(25);toast('Passagem mini concluída!','good');}});
    // Túnel baixo: somente o personagem abaixado atravessa o vão.
    box(.7,1.55,5,0x8b5a2b,crouch.x-3,.78,crouch.z);box(.7,1.55,5,0x8b5a2b,crouch.x+3,.78,crouch.z);box(6.7,.45,5,0x8b5a2b,crouch.x,1.55,crouch.z);registerCollider(crouch.x-3,crouch.z,.7,5,{challenge:'crouch'});registerCollider(crouch.x+3,crouch.z,.7,5,{challenge:'crouch'});
    registerInteractable({id:'crouch-tunnel',type:'challenge',icon:'▼',label:'Túnel baixo',x:crouch.x,z:crouch.z+3.8,radius:3,priority:110,action:()=>{if(!player.crouched){toast('Use ABAIXAR para entrar.','warn',2200);return;}player.x=crouch.x;player.z=crouch.z-3.8;setFlag('crouchPassage');addXP(25);toast('Túnel baixo concluído!','good');}});
    // Portão grande abre de verdade e libera a passagem.
    const gate=new THREE.Group();gate.position.set(giant.x,0,giant.z);worldGroup.add(gate);const slab=box(8,4,.6,0x6b7280,0,2,0,gate);box(1,5,1,0x94a3b8,-4.5,2.5,0,gate);box(1,5,1,0x94a3b8,4.5,2.5,0,gate);const collider=registerCollider(giant.x,giant.z,8,.6,{challenge:'giant'});
    registerInteractable({id:'giant-gate',type:'challenge',icon:'⬡',label:'Abrir portão pesado',x:giant.x,z:giant.z+3,radius:3.2,priority:110,action:()=>{if(player.scaleMode!=='giant'){toast('Use GRANDE para abrir o portão.','warn',2200);return;}slab.position.y=6;world.colliders=world.colliders.filter(item=>item!==collider);setFlag('giantGate');addXP(35);toast('Portão pesado aberto e passagem liberada!','good');}});
  }

  function createSkyDome(){
    const c=document.createElement('canvas');c.width=16;c.height=512;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,512);
    g.addColorStop(0,'#087ee8');g.addColorStop(.34,'#42b9ff');g.addColorStop(.67,'#9de2ff');g.addColorStop(.88,'#d9f4ff');g.addColorStop(1,'#fff0bf');ctx.fillStyle=g;ctx.fillRect(0,0,16,512);
    const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;
    const sky=new THREE.Mesh(new THREE.SphereGeometry(430,20,18),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));scene.add(sky);
    const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gx=glowCanvas.getContext('2d'),rad=gx.createRadialGradient(64,64,12,64,64,64);rad.addColorStop(0,'rgba(255,250,207,1)');rad.addColorStop(.35,'rgba(255,230,128,.72)');rad.addColorStop(1,'rgba(255,214,88,0)');gx.fillStyle=rad;gx.fillRect(0,0,128,128);
    const sunTex=new THREE.CanvasTexture(glowCanvas),sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTex,transparent:true,depthWrite:false,fog:false}));sunGlow.position.set(-145,126,-235);sunGlow.scale.set(72,72,1);scene.add(sunGlow);
    const sun=new THREE.Mesh(new THREE.CircleGeometry(13,24),new THREE.MeshBasicMaterial({color:0xfff4c4,depthWrite:false,fog:false}));sun.position.set(-145,126,-232);sun.lookAt(0,70,0);scene.add(sun);
    const cloudMat=renderMat(0xffffff,{transparent:true,opacity:.9,roughness:.95});world.clouds=[];
    const cloudGeo=sharedBoxGeometry(1,1,1);
    for(let i=0;i<7;i++){
      const cloud=new THREE.Group(),parts=[[0,0,0,7,2.2,2.8],[-5.4,-.35,0,5.3,1.85,2.4],[5.1,-.2,0,5.8,2,2.5],[-.8,1.35,0,4.9,2.35,2.6],[3,1.05,0,3.7,1.8,2.3]];
      parts.forEach(([x,y,z,w,h,d])=>{const p=new THREE.Mesh(cloudGeo,cloudMat);p.scale.set(w,h,d);p.position.set(x,y,z);p.frustumCulled=true;cloud.add(p);});
      cloud.position.set((Math.random()-.5)*360,62+Math.random()*38,(Math.random()-.5)*330);cloud.scale.setScalar(.72+Math.random()*.8);scene.add(cloud);world.clouds.push({group:cloud,speed:.55+Math.random()*.85});
    }
  }
  function updateClouds(dt){
    if(textures.water){textures.water.offset.x=(textures.water.offset.x+dt*.012)%1;textures.water.offset.y=(textures.water.offset.y+dt*.007)%1;}
    if(!world.clouds)return;
    for(const c of world.clouds){c.group.position.x+=c.speed*dt;if(c.group.position.x>210)c.group.position.x=-210;}
  }
