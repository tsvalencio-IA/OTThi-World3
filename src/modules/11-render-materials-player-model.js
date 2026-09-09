/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 11-render-materials-player-model.js
 * Escopo: Texturas, materiais, geometria, personagem e avatar 3D
 * Linhas de origem V642: 1692-1962
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function canvasTexture(kind, colors) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d');
    let seed=[kind,...colors].join('|').split('').reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,2166136261);
    const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
    const pick=()=>colors[1+Math.floor(rand()*Math.max(1,colors.length-1))]||colors[0];
    ctx.imageSmoothingEnabled=false;ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, 256, 256);
    if (kind === 'grass') {
      for (let i = 0; i < 720; i++) { ctx.fillStyle=pick();const x=rand()*256,y=rand()*256;ctx.fillRect(x,y,2+rand()*7,2+rand()*7);if(i%9===0)ctx.fillRect(x+2,y-5,2,8); }
      ctx.fillStyle='rgba(15,65,22,.14)';for(let i=0;i<95;i++)ctx.fillRect(rand()*256,rand()*256,12+rand()*26,2);
    } else if (kind === 'road') {
      for (let i=0;i<260;i++){ctx.fillStyle=pick();ctx.globalAlpha=.18+rand()*.2;ctx.fillRect(rand()*256,rand()*256,2+rand()*7,1+rand()*4);}ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(10,16,23,.22)';ctx.lineWidth=2;for(let i=0;i<8;i++){const x=rand()*256,y=rand()*256;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+10+rand()*22,y-5+rand()*10);ctx.lineTo(x+18+rand()*28,y+rand()*20);ctx.stroke();}
    } else if (kind === 'wood') {
      for(let x=0;x<256;x+=48){ctx.fillStyle=x%96?colors[0]:pick();ctx.fillRect(x,0,47,256);ctx.fillStyle='rgba(255,238,190,.12)';ctx.fillRect(x+3,0,3,256);ctx.fillStyle='rgba(50,22,8,.25)';ctx.fillRect(x+45,0,3,256);}
      ctx.strokeStyle='rgba(66,31,13,.28)';ctx.lineWidth=2;for(let i=0;i<28;i++){const x=rand()*256;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+8,65,x-7,150,x+4,256);ctx.stroke();}
      for(let i=0;i<9;i++){ctx.strokeStyle='rgba(58,28,13,.35)';ctx.strokeRect(rand()*245,rand()*245,5+rand()*9,3+rand()*6);}
    } else if (kind === 'brick') {
      ctx.fillStyle=colors[1];ctx.fillRect(0,0,256,256);for(let y=0;y<256;y+=42){const offset=(y/42)%2?32:0;for(let x=-64+offset;x<256;x+=64){ctx.fillStyle=rand()>.5?colors[0]:pick();ctx.fillRect(x+3,y+3,58,36);ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(x+5,y+5,54,3);}}
    } else if (kind === 'sidewalk') {
      ctx.strokeStyle='rgba(54,66,80,.22)';ctx.lineWidth=4;for(let y=0;y<=256;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}for(let x=0;x<=256;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
      for(let i=0;i<150;i++){ctx.fillStyle=pick();ctx.globalAlpha=.16;ctx.fillRect(rand()*256,rand()*256,2+rand()*5,2+rand()*5);}ctx.globalAlpha=1;
    } else if (kind === 'water') {
      ctx.strokeStyle=colors[1]; ctx.lineWidth=3; ctx.globalAlpha=.5;
      for(let y=10;y<256;y+=24){ctx.beginPath();ctx.moveTo(0,y+Math.sin(y)*4);for(let x=0;x<=256;x+=12)ctx.lineTo(x,y+Math.sin((x+y)*.09)*5);ctx.stroke();}
      ctx.globalAlpha=1;
    } else if(kind==='stone'){
      ctx.fillStyle=colors[1];ctx.fillRect(0,0,256,256);for(let y=0;y<256;y+=50){for(let x=((y/50)%2?-28:0);x<256;x+=58){ctx.fillStyle=rand()>.45?colors[0]:pick();ctx.fillRect(x+3,y+3,52,44);ctx.fillStyle='rgba(255,255,255,.09)';ctx.fillRect(x+5,y+5,48,4);}}
    } else if(kind==='tile'){
      ctx.strokeStyle=colors[1];ctx.lineWidth=7;for(let p=0;p<=256;p+=64){ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,256);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(256,p);ctx.stroke();}ctx.fillStyle='rgba(255,255,255,.18)';for(let y=7;y<256;y+=64)for(let x=7;x<256;x+=64)ctx.fillRect(x,y,48,5);
    } else if(kind==='fabric'){
      for(let y=0;y<256;y+=12)for(let x=0;x<256;x+=12){ctx.fillStyle=(x/12+y/12)%2?colors[0]:colors[1];ctx.globalAlpha=.62;ctx.fillRect(x,y,12,12);}ctx.globalAlpha=1;
    } else if(kind==='metal'){
      for(let y=0;y<256;y+=32){ctx.fillStyle=y%64?colors[0]:colors[1];ctx.fillRect(0,y,256,32);ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(0,y,256,3);}for(const x of [10,246])for(let y=14;y<256;y+=42){ctx.fillStyle='#6c7b88';ctx.fillRect(x-3,y-3,6,6);}
    }
    const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = (renderer && renderer.capabilities) ? Math.min(12,renderer.capabilities.getMaxAnisotropy()) : 4; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;tex.encoding=THREE.sRGBEncoding; return tex;
  }
  function professionalTexture(path,kind,colors,repeatX=1,repeatY=1,assetId=''){
    const registryId=`texture:${assetId||String(path).split('/').pop().replace(/\.[^.]+$/,'')}`;
    const texture=canvasTexture(kind,colors);texture.name=`fallback:${path}`;texture.repeat.set(repeatX,repeatY);texture.userData={source:path,status:'fallback',assetId:registryId};
    registerVisualAsset(registryId,texture,{type:'texture',status:'fallback',source:path,kind});
    const configure=target=>{target.wrapS=target.wrapT=THREE.RepeatWrapping;target.repeat.set(repeatX,repeatY);target.magFilter=THREE.LinearFilter;target.minFilter=THREE.LinearMipmapLinearFilter;target.generateMipmaps=true;target.anisotropy=(renderer&&renderer.capabilities)?Math.min(12,renderer.capabilities.getMaxAnisotropy()):4;if('colorSpace' in target&&THREE.SRGBColorSpace)target.colorSpace=THREE.SRGBColorSpace;else target.encoding=THREE.sRGBEncoding;};configure(texture);
    new THREE.TextureLoader().load(path,loaded=>{texture.image=loaded.image;texture.name=path;texture.userData={source:path,status:'loaded',assetId:registryId,width:loaded.image?.naturalWidth||loaded.image?.width||0,height:loaded.image?.naturalHeight||loaded.image?.height||0};configure(texture);texture.needsUpdate=true;updateVisualAsset(registryId,{status:'loaded',width:texture.userData.width,height:texture.userData.height});},undefined,error=>{texture.userData.error=String(error?.message||'load-failed');updateVisualAsset(registryId,{status:'fallback',error:texture.userData.error});console.warn('[OTTHOS] Textura local indisponível; fallback mantido:',path);});
    return texture;
  }
  function initMaterials() {
    textures.grass = professionalTexture(OTTHI_VISUAL_ASSETS.textures.grass,'grass',['#348f32','#62c94e','#28762c','#91df63'],46,46,'grass');
    textures.road = professionalTexture(OTTHI_VISUAL_ASSETS.textures.road,'road',['#252d38','#3d4652'],10,30,'road');
    textures.sidewalk = professionalTexture(OTTHI_VISUAL_ASSETS.textures.sidewalk,'sidewalk',['#d9dde3','#aeb7c2'],7,16,'sidewalk');
    textures.water = professionalTexture(OTTHI_VISUAL_ASSETS.textures.water,'water',['#187fb5','#4ac9ef','#bdf1ff'],7,7,'water');
    textures.wood = professionalTexture(OTTHI_VISUAL_ASSETS.textures.wood,'wood',['#9a5a28','#693819'],2,2,'wood');
    textures.brick = professionalTexture(OTTHI_VISUAL_ASSETS.textures.brick,'brick',['#c38142','#8a4e25'],3,2,'brick');
    textures.stone = professionalTexture(OTTHI_VISUAL_ASSETS.textures.stone,'stone',['#8795a6','#677482','#aab5bf'],4,3,'stone');
    textures.roof = professionalTexture(OTTHI_VISUAL_ASSETS.textures.roof,'brick',['#7c3030','#481d22'],3,3,'roof');
    textures.busSeat = professionalTexture(OTTHI_VISUAL_ASSETS.textures.busSeat,'fabric',['#2e6db2','#173c69'],4,4,'bus-seat');
    textures.schoolWall = professionalTexture(OTTHI_VISUAL_ASSETS.textures.schoolWall,'brick',['#ead89a','#c49b58'],3,2,'school-wall');
    textures.policeWall = professionalTexture(OTTHI_VISUAL_ASSETS.textures.policeWall,'brick',['#dce8ef','#1f5c9d'],3,2,'police-wall');
    textures.goldOre = professionalTexture(OTTHI_VISUAL_ASSETS.textures.goldOre,'stone',['#565c64','#f0c230'],2,2,'gold-ore');
    textures.interiorFloor = professionalTexture(OTTHI_VISUAL_ASSETS.textures.interiorFloor,'wood',['#a4703e','#67411f'],4,4,'interior-floor');
    textures.interiorWall = professionalTexture(OTTHI_VISUAL_ASSETS.textures.interiorWall,'sidewalk',['#e7decc','#cdbda8'],3,2,'interior-wall');
    textures.marketFloor = professionalTexture(OTTHI_VISUAL_ASSETS.textures.marketFloor,'tile',['#e9eee8','#7da68b'],4,4,'market-floor');
    textures.marketWall = professionalTexture(OTTHI_VISUAL_ASSETS.textures.marketWall,'brick',['#f5f1de','#4e8f65'],3,2,'market-wall');
    textures.schoolFloor = professionalTexture(OTTHI_VISUAL_ASSETS.textures.schoolFloor,'tile',['#d8e0e4','#4a90c4'],4,4,'school-floor');
    textures.fireWall = professionalTexture(OTTHI_VISUAL_ASSETS.textures.fireWall,'brick',['#b93131','#f4f4ee'],3,2,'fire-wall');
    textures.concrete = professionalTexture(OTTHI_VISUAL_ASSETS.textures.concrete,'metal',['#70777e','#4b5158'],5,6,'concrete');
    textures.cityGlass = professionalTexture(OTTHI_VISUAL_ASSETS.textures.cityGlass,'water',['#4c91b5','#9cd9ec'],2,2,'city-glass');
    textures.emergencyMetal = professionalTexture(OTTHI_VISUAL_ASSETS.textures.emergencyMetal,'metal',['#bf2b2a','#e55d4d'],3,3,'emergency-metal');
    textures.tile = canvasTexture('tile', ['#e8f3f6','#78b8c9']); textures.tile.repeat.set(4,4);
    textures.fabric = textures.busSeat;
    textures.metal = canvasTexture('metal', ['#8c9dab','#657481']); textures.metal.repeat.set(2,3);
    materials.grass = new THREE.MeshStandardMaterial({ map: textures.grass, roughness: .88 });
    materials.road = new THREE.MeshStandardMaterial({ map: textures.road, roughness: .82 });
    materials.sidewalk = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: .92 });
    materials.wood = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: .8 });
    materials.brick = new THREE.MeshStandardMaterial({ map: textures.brick, roughness: .82 });
    materials.tile = new THREE.MeshStandardMaterial({ map:textures.tile,roughness:.42,metalness:.03 });
    materials.fabric = new THREE.MeshStandardMaterial({ map:textures.fabric,roughness:.86 });
    materials.metal = new THREE.MeshStandardMaterial({ map:textures.metal,roughness:.38,metalness:.48 });
    materials.water = new THREE.MeshStandardMaterial({ map:textures.water, color:0x70d9f5, emissive:0x075d82, emissiveIntensity:.13, transparent:true, opacity:.82, roughness:.16, metalness:.06 });
    materials.interiorFloor = new THREE.MeshStandardMaterial({map:textures.interiorFloor,roughness:.68});
    materials.interiorWall = new THREE.MeshStandardMaterial({map:textures.interiorWall,roughness:.82});
    materials.marketFloor = new THREE.MeshStandardMaterial({map:textures.marketFloor,roughness:.58});
    materials.schoolFloor = new THREE.MeshStandardMaterial({map:textures.schoolFloor,roughness:.62});
    materials.concrete = new THREE.MeshStandardMaterial({map:textures.concrete,roughness:.88});
    materials.cityGlass = new THREE.MeshStandardMaterial({map:textures.cityGlass,color:0xb9ecff,transparent:true,opacity:.52,roughness:.08,metalness:.18});
    materials.emergencyMetal = new THREE.MeshStandardMaterial({map:textures.emergencyMetal,color:0xffffff,roughness:.38,metalness:.28});
    materials.fireWall = new THREE.MeshStandardMaterial({map:textures.fireWall,color:0xffffff,roughness:.78});
    materials.stone = new THREE.MeshStandardMaterial({ map:textures.stone,color:0xaab2bb,roughness:.88,flatShading:true });
    materials.goldOre = new THREE.MeshStandardMaterial({ map:textures.goldOre,color:0xffffff,emissive:0x6b3f00,emissiveIntensity:.22,roughness:.62,metalness:.28,flatShading:true });
    materials.dark = new THREE.MeshStandardMaterial({ color:0x080b11, roughness:.55, flatShading:true });
    for(const [id,material] of Object.entries(materials))registerVisualAsset(`material:${id}`,material,{type:'material',status:'ready',shared:true});
  }
  function mat(color, opts = {}) { visualFoundation.mutableMaterialCreates++;return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .72, metalness: opts.metalness ?? .03, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, flatShading: opts.flatShading ?? true }); }

  // V626: cache somente de geometrias e materiais visuais imutáveis.
  // Reduz memória e tempo de criação sem alterar física, colisões ou IDs.
  const sharedGeometryCache={box:new Map(),cylinder:new Map()};
  const immutableVisualMaterials=new Map();
  const tintedBrickMaterialCache=new Map();
  const outlineGeometryCache=new Map();
  const outlineMaterialCache=new Map();
  function geometryKey(...values){return values.map(v=>Number(v).toFixed(3)).join('|');}
  function sharedBoxGeometry(w,h,d){
    const key=geometryKey(w,h,d);
    if(sharedGeometryCache.box.has(key))visualFoundation.geometryCacheHits++;
    else{visualFoundation.geometryCacheMisses++;sharedGeometryCache.box.set(key,new THREE.BoxGeometry(w,h,d));}
    return sharedGeometryCache.box.get(key);
  }
  function sharedCylinderGeometry(r,h,sides=10){
    const key=geometryKey(r,h,sides);
    if(sharedGeometryCache.cylinder.has(key))visualFoundation.geometryCacheHits++;
    else{visualFoundation.geometryCacheMisses++;sharedGeometryCache.cylinder.set(key,new THREE.CylinderGeometry(r,r,h,sides));}
    return sharedGeometryCache.cylinder.get(key);
  }
  function renderMat(color,opts={}){
    const key=[color,opts.roughness??.72,opts.metalness??.03,opts.emissive??0,opts.emissiveIntensity??0,opts.transparent?1:0,opts.opacity??1,opts.flatShading??true].join('|');
    if(immutableVisualMaterials.has(key))visualFoundation.materialCacheHits++;
    else{visualFoundation.materialCacheMisses++;immutableVisualMaterials.set(key,mat(color,opts));}
    return immutableVisualMaterials.get(key);
  }
  const roofMaterialCache=new Map();
  function tintedBrickMaterial(color,texture=textures.brick){
    const source=texture||textures.brick,key=`${Number(color)}|${source?.uuid||'brick'}`;
    if(!tintedBrickMaterialCache.has(key))tintedBrickMaterialCache.set(key,new THREE.MeshStandardMaterial({map:source,color:new THREE.Color(color).lerp(new THREE.Color(0xffffff),.34),roughness:.8,metalness:0,flatShading:true}));
    return tintedBrickMaterialCache.get(key);
  }
  function texturedRoofMaterial(color){
    const key=Number(color);if(!roofMaterialCache.has(key))roofMaterialCache.set(key,new THREE.MeshStandardMaterial({map:textures.roof,color:new THREE.Color(color).lerp(new THREE.Color(0xffffff),.12),roughness:.76,metalness:0,flatShading:true}));return roofMaterialCache.get(key);
  }
  function visualCacheHasValue(cache,value){
    if(!cache||!value)return false;
    for(const cached of cache.values())if(cached===value)return true;
    return false;
  }
  function visualCacheOwnsGeometry(geometry){
    return visualCacheHasValue(sharedGeometryCache.box,geometry)||visualCacheHasValue(sharedGeometryCache.cylinder,geometry)||visualCacheHasValue(outlineGeometryCache,geometry);
  }
  function visualCacheOwnsMaterial(material){
    return visualCacheHasValue(immutableVisualMaterials,material)||visualCacheHasValue(tintedBrickMaterialCache,material)||visualCacheHasValue(roofMaterialCache,material)||visualCacheHasValue(outlineMaterialCache,material)||Object.values(materials).includes(material);
  }
  function visualCacheOwnsTexture(texture){return !!texture&&(Object.values(textures).includes(texture)||Object.values(materials).some(material=>material?.map===texture));}
  function disposeDetachedVisual(root){
    if(!root?.traverse)return;
    const disposedGeometry=new Set(),disposedMaterial=new Set(),disposedTexture=new Set();
    root.traverse(object=>{
      if(object.userData?.v615Outline&&world?.outlines){
        const outlineIndex=world.outlines.indexOf(object);
        if(outlineIndex>=0)world.outlines.splice(outlineIndex,1);
      }
      const geometry=object.geometry;
      if(geometry&&!visualCacheOwnsGeometry(geometry)&&!disposedGeometry.has(geometry)){disposedGeometry.add(geometry);geometry.dispose?.();}
      const objectMaterials=Array.isArray(object.material)?object.material:[object.material];
      for(const material of objectMaterials.filter(Boolean)){
        if(visualCacheOwnsMaterial(material)||disposedMaterial.has(material))continue;
        disposedMaterial.add(material);
        const map=material.map;
        if(map&&!visualCacheOwnsTexture(map)&&!disposedTexture.has(map)){disposedTexture.add(map);map.dispose?.();}
        material.dispose?.();
      }
    });
  }
  function addSoftHighlight(parent,w,h,d,x,y,z,color=0xffffff,opacity=.22){
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,fog:true});
    const highlight=new THREE.Mesh(sharedBoxGeometry(w,h,d),m);highlight.position.set(x,y,z);highlight.renderOrder=4;highlight.frustumCulled=true;parent.add(highlight);return highlight;
  }

  function box(w, h, d, materialOrColor, x = 0, y = 0, z = 0, parent = worldGroup) {
    const material = typeof materialOrColor === 'number' ? renderMat(materialOrColor) : materialOrColor;
    const mesh = new THREE.Mesh(sharedBoxGeometry(w,h,d), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled=true; parent.add(mesh); return mesh;
  }
  function stabilizeSurface(mesh,renderOrder=0){if(!mesh)return mesh;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=renderOrder;mesh.userData.stableSurface=true;world.criticalSurfaces.push(mesh);return mesh;}
  function stableBox(w,h,d,materialOrColor,x=0,y=0,z=0,parent=worldGroup,renderOrder=0){return stabilizeSurface(box(w,h,d,materialOrColor,x,y,z,parent),renderOrder);}
  function cylinder(r, h, color, x, y, z, parent = worldGroup, sides = 10) {
    const material=typeof color==='number'?renderMat(color):color;
    const mesh = new THREE.Mesh(sharedCylinderGeometry(r,h,sides), material);
    mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled=true; parent.add(mesh); return mesh;
  }
  function addGlow(x, y, z, color = 0x5ae5ff, size = 4) {
    const light = new THREE.PointLight(color, .5, size * 3); light.position.set(x,y,z); light.userData.v615Glow=true; worldGroup.add(light); world.glows.push(light); return light;
  }

  function addVoxelOutline(mesh,color=0x142033,opacity=.36){
    if(!mesh?.geometry||mesh.userData?.voxelOutline)return mesh;
    const geometryKey=`${mesh.geometry.uuid}|22`;
    if(!outlineGeometryCache.has(geometryKey))outlineGeometryCache.set(geometryKey,new THREE.EdgesGeometry(mesh.geometry,22));
    const materialKey=`${Number(color)}|${Number(opacity).toFixed(3)}`;
    if(!outlineMaterialCache.has(materialKey))outlineMaterialCache.set(materialKey,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));
    const lines=new THREE.LineSegments(outlineGeometryCache.get(geometryKey),outlineMaterialCache.get(materialKey));
    lines.frustumCulled=true;
    lines.renderOrder=5;lines.userData.v615Outline=true;mesh.add(lines);mesh.userData.voxelOutline=lines;world.outlines.push(lines);return mesh;
  }
  function premiumBox(w,h,d,materialOrColor,x=0,y=0,z=0,parent=worldGroup,outline=0x142033){
    return addVoxelOutline(box(w,h,d,materialOrColor,x,y,z,parent),outline,.34);
  }
  function premiumCylinder(r,h,color,x,y,z,parent=worldGroup,sides=10){
    return addVoxelOutline(cylinder(r,h,color,x,y,z,parent,sides),0x142033,.3);
  }
  function makeWindow(parent,x,y,z,w=1.1,h=.9,frame=0xf7f3ea,glass=0x73d9ff){
    premiumBox(w+.2,h+.2,.16,frame,x,y,z,parent);premiumBox(w,h,.18,mat(glass,{emissive:0x1d739b,emissiveIntensity:.18,roughness:.16}),x,y,z+.02,parent,0x23445e);
    premiumBox(.08,h,.2,frame,x,y,z+.04,parent);premiumBox(w,.07,.2,frame,x,y,z+.04,parent);return parent;
  }
  function makePlanter(parent,x,y,z,color=0xe24f72){
    premiumBox(1.35,.34,.48,0x8a522d,x,y,z,parent);for(const ox of [-.42,0,.42]){premiumBox(.08,.4,.08,0x2f9d46,x+ox,y+.32,z,parent);premiumBox(.28,.16,.28,color,x+ox,y+.55,z,parent);}return parent;
  }

  function createPlayerModel() {
    playerGroup = new THREE.Group();playerGroup.name='OTTHOS_PLAYER';scene.add(playerGroup);
    playerModel = new THREE.Group();playerGroup.add(playerModel);
    const bodyRoot=new THREE.Group();playerModel.add(bodyRoot);
    const black=renderMat(0x090c12,{roughness:.48}),blackSoft=renderMat(0x151a23,{roughness:.58});
    const blue=renderMat(0x099fe5,{roughness:.46}),blueDark=renderMat(0x0875bd,{roughness:.52}),blueLight=renderMat(0x38c8ff,{roughness:.38});
    const white=renderMat(0xf4f7ff,{roughness:.3}),red=renderMat(0xff2947,{emissive:0x9b0018,emissiveIntensity:.62,roughness:.24});
    const sole=renderMat(0xdfe8f4,{roughness:.42}),parts={};
    parts.body=new THREE.Group();parts.body.position.set(0,1.55,0);bodyRoot.add(parts.body);
    box(1.02,1.22,.72,blue,0,0,0,parts.body);
    box(1.12,.28,.78,blueDark,0,.62,0,parts.body);
    box(.92,.3,.08,blueLight,0,.28,.39,parts.body);
    box(.9,.12,.08,blueDark,0,-.46,.4,parts.body);
    box(.08,.66,.06,white,-.18,.32,.43,parts.body);box(.08,.66,.06,white,.18,.32,.43,parts.body);
    box(.14,.14,.08,black,-.18,-.02,.46,parts.body);box(.14,.14,.08,black,.18,-.02,.46,parts.body);
    parts.head=box(1.08,1.02,1.02,black,0,2.72,0,bodyRoot);
    box(1.2,1.08,.28,blueDark,0,2.72,-.55,bodyRoot);
    box(1.22,.28,1.08,blue,0,3.17,-.04,bodyRoot);
    box(.26,.2,.05,white,-.27,2.78,.545,bodyRoot);box(.26,.2,.05,white,.27,2.78,.545,bodyRoot);
    box(.15,.09,.06,red,-.27,2.76,.575,bodyRoot);box(.15,.09,.06,red,.27,2.76,.575,bodyRoot);
    parts.leftArm=new THREE.Group();parts.rightArm=new THREE.Group();parts.leftLeg=new THREE.Group();parts.rightLeg=new THREE.Group();
    parts.leftArm.position.set(-.72,2.0,0);parts.rightArm.position.set(.72,2.0,0);parts.leftLeg.position.set(-.28,.92,0);parts.rightLeg.position.set(.28,.92,0);
    bodyRoot.add(parts.leftArm,parts.rightArm,parts.leftLeg,parts.rightLeg);
    for(const arm of [parts.leftArm,parts.rightArm]){
      box(.38,.52,.38,blue,0,-.24,0,arm);box(.34,.44,.34,blueDark,0,-.69,0,arm);box(.34,.26,.36,black,0,-1.02,.03,arm);
      addSoftHighlight(arm,.08,.62,.02,-.13,-.42,.2,0xffffff,.18);
    }
    for(const leg of [parts.leftLeg,parts.rightLeg]){
      box(.4,.58,.4,black,0,-.28,0,leg);box(.38,.42,.38,blackSoft,0,-.72,.02,leg);
      box(.43,.29,.52,blue,0,-1.02,.09,leg);box(.44,.11,.54,sole,0,-1.18,.1,leg);box(.22,.08,.55,blueLight,0,-1.08,.13,leg);
    }
    playerModel.userData.parts=parts;playerModel.userData.baseY=.24;playerModel.userData.minFootY=-.23;playerModel.userData.proceduralOtthos=true;createAvatarRigFoundation(playerModel,bodyRoot,parts);
    const shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide});
    contactShadow=new THREE.Mesh(new THREE.CircleGeometry(.88,24),shadowMat);contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=.025;scene.add(contactShadow);

    vehicleVisual=new THREE.Group();vehicleVisual.visible=false;playerGroup.add(vehicleVisual);
    buildThemedVehicleGeometry(vehicleVisual,{theme:'lego',bodyType:'small',appearance:{chassis:0x26384e,primary:0xf28a22,primaryDark:0xc85b16,secondary:0x0aa7b8,glass:0x17364b}});
    const ownLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:multiplayerNameTexture(playerDisplayName()),transparent:true,depthWrite:false,depthTest:false}));
    ownLabel.position.set(0,3.65,0);ownLabel.scale.set(2.65,.66,1);ownLabel.renderOrder=1000;ownLabel.visible=false;playerGroup.add(ownLabel);playerGroup.userData.nameLabel=ownLabel;playerGroup.userData.displayName=playerDisplayName();
    refreshEquippedToolVisual();
  }

  function loadFaithfulAthosModel() {
    // Regra V606 (herdada da V605): athos.glb pertence apenas ao visualizador/AR do lobby.
    // A jogabilidade usa o Otthos procedural animado para preservar física, escala e desempenho.
    return false;
  }

  function clearAvatarLayer() {
    if (avatarLayer && playerGroup){playerGroup.remove(avatarLayer);disposeDetachedVisual(avatarLayer);}
    for(const attachment of playerModel?.userData?.avatarAttachments||[]){try{attachment.parent?.remove(attachment);disposeDetachedVisual(attachment);}catch{}}
    if(playerModel)playerModel.userData.avatarAttachments=[];
    avatarLayer = new THREE.Group();
    avatarLayer.name = 'OTTHOS_AVATAR_ACCESSORIES';
    playerGroup?.add(avatarLayer);
  }
  function avatarPartLayer(parent,name){
    const layer=new THREE.Group();layer.name=`OTTHOS_AVATAR_${name}`;parent?.add(layer);
    if(playerModel){playerModel.userData.avatarAttachments=playerModel.userData.avatarAttachments||[];playerModel.userData.avatarAttachments.push(layer);}
    return layer;
  }
  function addUniformPatch(parent,text,color='#ffffff',background='#17243a',x=0,y=1.7,z=.426,rotationY=0,width=.72,height=.22){
    const patch=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:signTexture(text,background,color),transparent:true,roughness:.58,side:THREE.DoubleSide}));
    patch.position.set(x,y,z);patch.rotation.y=rotationY;parent.add(patch);return patch;
  }
  function addUniformLimb(parent,x,y,z,w,h,d,color,reflective=0){
    box(w,h,d,color,x,y,z,parent);if(reflective)box(w+.025,.09,d+.025,reflective,x,y-h*.18,z,parent);
  }
  function uniformPalette(uniform){
    const palettes={
      firefighter:{primary:0x8e2f2b,secondary:0x232b35,accent:0xf8d449,boot:0x151a20},
      police:{primary:0x183d70,secondary:0x101d31,accent:0xb9d7ef,boot:0x0d121a},
      paramedic:{primary:0xf1f5f7,secondary:0x24404b,accent:0xe34248,boot:0x15202a},
      teacher:{primary:0x4a9b65,secondary:0x253d32,accent:0xf4f6f8,boot:0x2b211b},
      delivery:{primary:0xe59a2f,secondary:0x4b3425,accent:0xf8f0d7,boot:0x241b16},
      mechanic:{primary:0x315f91,secondary:0x26384e,accent:0xdce8f2,boot:0x151a20},
      miner:{primary:0xc68b24,secondary:0x3b3026,accent:0xf2d25c,boot:0x181617},
      builder:{primary:0xe9782b,secondary:0x34404d,accent:0xfff2a1,boot:0x171a1e},
      sport:{primary:0x2f7fd8,secondary:0x172f4a,accent:0xf5d84d,boot:0xffffff}
    };return palettes[uniform]||{primary:0x2477d4,secondary:0x26384e,accent:0xf4f6f8,boot:0x151a20};
  }
  function dressAnimatedAvatar(outfit,uniform){
    const parts=playerModel?.userData?.parts;if(!parts)return null;
    const palette=uniform!=='none'?uniformPalette(uniform):{primary:({blue:0x2477d4,red:0xd93645,explorer:0x3f9b4b})[outfit]||0x2477d4,secondary:outfit==='explorer'?0x36533b:0x22344a,accent:0xeaf5ff,boot:0x151a20};
    const body=avatarPartLayer(parts.body,'TORSO'),leftArm=avatarPartLayer(parts.leftArm,'LEFT_ARM'),rightArm=avatarPartLayer(parts.rightArm,'RIGHT_ARM'),leftLeg=avatarPartLayer(parts.leftLeg,'LEFT_LEG'),rightLeg=avatarPartLayer(parts.rightLeg,'RIGHT_LEG');
    box(1.095,1.235,.755,mat(palette.primary,{transparent:true,opacity:.985}),0,0,.005,body);
    box(1.125,.18,.79,palette.secondary,0,-.49,.01,body);
    box(.94,.22,.055,palette.accent,0,.29,.405,body);
    for(const arm of[leftArm,rightArm]){
      box(.405,.56,.405,palette.primary,0,-.24,0,arm);box(.365,.47,.365,palette.secondary,0,-.69,0,arm);box(.365,.27,.38,palette.boot,0,-1.02,.02,arm);
      if(uniform!=='none')box(.385,.085,.385,palette.accent,0,-.48,.005,arm);
    }
    for(const leg of[leftLeg,rightLeg]){
      box(.43,.63,.43,palette.secondary,0,-.29,0,leg);box(.415,.45,.415,palette.secondary,0,-.73,.015,leg);box(.46,.32,.55,palette.boot,0,-1.04,.1,leg);
      if(uniform==='firefighter'||uniform==='paramedic'||uniform==='builder')box(.435,.085,.46,palette.accent,0,-.74,.02,leg);
    }
    if(uniform!=='none'){
      box(1.12,.085,.79,palette.accent,0,.35,.01,body);box(1.12,.085,.79,palette.accent,0,-.30,.01,body);
      box(.18,.34,.08,palette.accent,.35,.02,.43,body);
    }
    return{parts,palette,body,leftArm,rightArm,leftLeg,rightLeg};
  }
  function applyAvatarCustomization() {
    if (!playerGroup || !window.THREE) return;
    clearAvatarLayer();
    const outfit=state.avatar?.outfit||'classic',hat=state.avatar?.hat||'none',accessory=state.avatar?.accessory||'none',uniform=effectiveAvatarUniform();
    const dressed=(uniform!=='none'||outfit!=='classic')?dressAnimatedAvatar(outfit,uniform):null;
    if(uniform!=='none'&&dressed){
      const {body,palette}=dressed;
      if(uniform==='firefighter'){
        const helm=new THREE.Mesh(new THREE.SphereGeometry(.67,16,10,0,Math.PI*2,0,Math.PI*.64),mat(0xf0c735,{metalness:.12,roughness:.34}));helm.position.set(0,3.08,0);avatarLayer.add(helm);box(.92,.13,.24,0xcf332e,0,3.14,.52,avatarLayer);box(.76,.88,.3,0x26384e,0,1.58,-.55,avatarLayer);addUniformPatch(body,'BOMBEIROS','#ffffff','#b52d2a',0,.08,.422,0,.86,.20);
      }else if(uniform==='police'){
        box(1.02,.21,1.0,palette.primary,0,3.28,0,avatarLayer);box(.56,.09,.58,palette.primary,0,3.18,.58,avatarLayer);box(.88,.74,.14,0x101a27,0,.02,.43,body);box(.20,.26,.07,0xffd84d,.31,.06,.515,body);addUniformPatch(body,'POLÍCIA','#ffffff','#153c70',0,.13,.505,0,.76,.20);addUniformPatch(body,'POLÍCIA','#ffffff','#153c70',0,.13,-.405,Math.PI,.82,.20);
      }else if(uniform==='paramedic'){
        box(1.0,.20,1.0,0xf2f5f7,0,3.27,0,avatarLayer);box(.54,.09,.58,0xe54b4b,0,3.18,.58,avatarLayer);box(.14,.60,.07,0xe54b4b,0,.06,.455,body);box(.60,.14,.07,0xe54b4b,0,.06,.46,body);box(.72,.82,.32,0x1d4c45,0,1.58,-.52,avatarLayer);addUniformPatch(body,'RESGATE','#ffffff','#d83e42',0,.39,.43,0,.78,.20);
      }else if(uniform==='teacher'){box(.18,.70,.08,0x6e4a2f,.43,.03,.45,body);box(.40,.27,.08,0xf7f1d0,.43,.35,.45,body);addUniformPatch(body,'PROFESSOR','#ffffff','#397a51',0,.15,.43,0,.82,.20);
      }else if(uniform==='delivery'){box(.82,.95,.42,0x8b5a2b,0,1.62,-.58,avatarLayer);addUniformPatch(body,'ENTREGA','#ffffff','#b86d13',0,.15,.43,0,.75,.20);
      }else if(uniform==='mechanic'){box(.22,.32,.08,0xf3bd37,.34,-.03,.44,body);box(.90,.16,.85,0x26384e,0,3.25,0,avatarLayer);addUniformPatch(body,'OFICINA','#ffffff','#274d75',0,.15,.43,0,.75,.20);
      }else if(uniform==='miner'){const helm=new THREE.Mesh(new THREE.SphereGeometry(.64,12,8,0,Math.PI*2,0,Math.PI*.62),mat(0xf0bb2d,{metalness:.08}));helm.position.set(0,3.08,0);avatarLayer.add(helm);box(.22,.22,.08,0xf8f4c6,0,3.17,.58,avatarLayer);box(.75,.18,.07,0x3b2c1b,0,.15,.43,body);
      }else if(uniform==='builder'){box(1.14,.20,.82,0xf8d54a,0,3.24,0,avatarLayer);box(.72,.15,.85,0xf8d54a,0,3.15,.50,avatarLayer);box(.12,1.02,.07,0xfff2a1,-.33,0,.43,body);box(.12,1.02,.07,0xfff2a1,.33,0,.43,body);
      }else if(uniform==='sport'){box(.20,.70,.07,0xf5d84d,-.33,.02,.44,body);box(.20,.70,.07,0xf5d84d,.33,.02,.44,body);addUniformPatch(body,'ATLETA','#ffffff','#185fa8',0,.15,.43,0,.72,.20);}
    }
    if(uniform==='none'){
      if(hat==='cap'){box(1.0,.22,1.0,0x2477d4,0,3.28,0,avatarLayer);box(.55,.10,.55,0x2477d4,0,3.18,.58,avatarLayer);}
      else if(hat==='crown'){box(.92,.25,.92,0xffd84d,0,3.32,0,avatarLayer);[[-.32,.22],[0,.34],[.32,.22]].forEach(([x,h])=>box(.18,h,.18,0xffd84d,x,3.48+h/2,0,avatarLayer));}
      else if(hat==='helmet'){const helm=new THREE.Mesh(new THREE.SphereGeometry(.62,12,8,0,Math.PI*2,0,Math.PI*.62),mat(0xf97316,{metalness:.08}));helm.position.set(0,3.08,0);avatarLayer.add(helm);}
      if(accessory==='backpack'){box(.78,1.05,.42,0x9a5b2b,0,1.65,-.58,avatarLayer);}
      else if(accessory==='glasses'){box(.38,.18,.08,0x111827,-.26,2.78,.59,avatarLayer);box(.38,.18,.08,0x111827,.26,2.78,.59,avatarLayer);box(.18,.06,.08,0x111827,0,2.78,.59,avatarLayer);}
      else if(accessory==='cape'){const cape=box(.92,1.35,.08,0x8b5cf6,0,1.58,-.60,avatarLayer);cape.rotation.x=-.08;}
    }
    const markShadows=layer=>layer?.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});markShadows(avatarLayer);for(const attachment of playerModel.userData.avatarAttachments||[])markShadows(attachment);
  }

  function registerCollider(x,z,w,d,options={}) { world.colliders.push({x,z,w,d,...options}); }
  function registerPlatform(x,z,w,d,top,options={}) { world.platforms.push({x,z,w,d,top,...options}); }
  function registerInteractable(data) { world.interactables.push({...data}); return data; }
  function worldPos(entry) {
    if (entry.getPos) return entry.getPos();
    return {x:entry.x,z:entry.z,y:entry.y||0};
  }
