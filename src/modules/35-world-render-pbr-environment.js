/**
 * OTTHI World V700 — módulo-fonte
 * Arquivo: 35-world-render-pbr-environment.js
 * Escopo: Etapa 3, materiais PBR, iluminação, vegetação e acabamento do mundo real existente
 */
// @otthi-module-body
  function otthiSeededRandom(seed=700){let value=seed>>>0;return()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};}
  function worldDetailAllowed(x,z){
    if(Math.abs(x)<12||Math.abs(z)<12)return false;
    if(waterAt(x,z))return false;
    if(world.colliders?.some(c=>Math.abs(x-c.x)<c.w/2+1.1&&Math.abs(z-c.z)<c.d/2+1.1))return false;
    if(world.houses?.some(h=>Math.abs(x-h.x)<7&&Math.abs(z-h.z)<6))return false;
    return Math.abs(x)<108&&Math.abs(z)<108;
  }
  function createWorldInstancedDetails(){
    if(!worldGroup||world.worldProfessional?.details)return false;const random=otthiSeededRandom(700031),quality=qualityTier(),grassCount=quality==='low'?100:quality==='high'?360:220,flowerCount=quality==='low'?30:quality==='high'?120:72;
    const grassMaterial=new THREE.MeshStandardMaterial({map:loadWorldTexture('foliage','basecolor',{repeat:[1,1],color:true,nearest:true}),normalMap:loadWorldTexture('foliage','normal',{repeat:[1,1]}),roughnessMap:loadWorldTexture('foliage','roughness',{repeat:[1,1]}),color:0x75bc55,roughness:.92,side:THREE.DoubleSide,vertexColors:false});
    const grassGeometry=new THREE.PlaneGeometry(.42,.72);grassGeometry.translate(0,.36,0);const grass=new THREE.InstancedMesh(grassGeometry,grassMaterial,grassCount);grass.name='OTTHI_WORLD_INSTANCED_GRASS';grass.userData.otthiWorldDetail=true;const dummy=new THREE.Object3D();let placed=0,attempts=0;
    while(placed<grassCount&&attempts<grassCount*16){attempts++;const x=(random()-.5)*208,z=(random()-.5)*208;if(!worldDetailAllowed(x,z))continue;dummy.position.set(x,.025,z);dummy.rotation.set(0,random()*Math.PI*2,0);const scale=.55+random()*.8;dummy.scale.set(scale,scale,scale);dummy.updateMatrix();grass.setMatrixAt(placed++,dummy.matrix);}
    grass.count=placed;grass.instanceMatrix.needsUpdate=true;grass.frustumCulled=true;worldGroup.add(grass);
    const flowerGeo=new THREE.OctahedronGeometry(.11,0),flowerMaterial=new THREE.MeshStandardMaterial({color:0xffd55b,roughness:.56,emissive:0x4a2500,emissiveIntensity:.08});const flowers=new THREE.InstancedMesh(flowerGeo,flowerMaterial,flowerCount);flowers.name='OTTHI_WORLD_INSTANCED_FLOWERS';flowers.userData.otthiWorldDetail=true;placed=0;attempts=0;
    while(placed<flowerCount&&attempts<flowerCount*18){attempts++;const x=(random()-.5)*198,z=(random()-.5)*198;if(!worldDetailAllowed(x,z))continue;dummy.position.set(x,.18,z);dummy.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);const scale=.7+random()*.8;dummy.scale.set(scale,scale,scale);dummy.updateMatrix();flowers.setMatrixAt(placed++,dummy.matrix);}
    flowers.count=placed;flowers.instanceMatrix.needsUpdate=true;worldGroup.add(flowers);world.worldProfessional={...(world.worldProfessional||{}),details:{grass,flowers}};otthiWorldRuntime.stats.instancedDetails=grass.count+flowers.count;return true;
  }
  function createWorldMushroomCluster(x,z,scale=1,color=0xd73b35){
    const group=new THREE.Group();group.position.set(x,groundHeightAt(x,z),z);group.scale.setScalar(scale);group.userData.otthiWorldDetail=true;worldGroup.add(group);
    const stem=worldAvatarMaterial(0xe8d5ad,{roughness:.86}),cap=new THREE.MeshStandardMaterial({map:loadWorldTexture('mushroom','basecolor',{repeat:[1,1],color:true,nearest:true}),normalMap:loadWorldTexture('mushroom','normal',{repeat:[1,1]}),roughnessMap:loadWorldTexture('mushroom','roughness',{repeat:[1,1]}),color,roughness:.74});
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.18,.27,.8,8),stem);body.position.y=.4;body.castShadow=true;group.add(body);const top=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8,0,Math.PI*2,0,Math.PI*.55),cap);top.position.y=.92;top.scale.y=.65;top.castShadow=true;group.add(top);return group;
  }
  function enhanceWorldHouses(){
    if(!world?.houses||world.worldProfessional?.housesEnhanced)return 0;let count=0;
    for(const house of world.houses){
      const trim=renderMat(shadeColor(house.color,58),{roughness:.68}),dark=renderMat(shadeColor(house.roofColor,-34),{roughness:.82});
      for(const side of[-1,1]){premiumBox(.20,3.05,.24,trim,house.x+side*4.16,1.55,house.z+3.42,house.front,0x142033);premiumBox(.38,.18,7.2,dark,house.x+side*4.48,2.92,house.z,house.roof,0x142033);}
      premiumBox(9.4,.18,.26,dark,house.x,2.95,house.z-3.45,house.roof,0x142033);
      if(!house.publicBuilding){for(const ox of[-2.55,2.55]){const planter=new THREE.Group();planter.userData.otthiWorldDetail=true;worldGroup.add(planter);premiumBox(1.25,.32,.45,materials.wood,house.x+ox,.82,house.z+3.76,planter,0x142033);for(const dx of[-.36,0,.36]){premiumBox(.07,.38,.07,0x3f8f47,house.x+ox+dx,1.12,house.z+3.76,planter,0x14341c);premiumBox(.20,.14,.20,dx===0?0xffdf55:0xff6f9e,house.x+ox+dx,1.36,house.z+3.76,planter,0x4a1b2c);}}}
      count++;
    }
    world.worldProfessional={...(world.worldProfessional||{}),housesEnhanced:true};return count;
  }
  function createWorldAtmosphericDetails(){
    if(world.worldProfessional?.atmosphere)return false;const group=new THREE.Group();group.name='OTTHI_WORLD_ATMOSPHERE';group.userData.otthiWorldDetail=true;scene.add(group);
    const particleMaterial=new THREE.PointsMaterial({color:0xffef9c,size:.16,transparent:true,opacity:.62,depthWrite:false,sizeAttenuation:true});const points=[],random=otthiSeededRandom(7721);for(let i=0;i<(qualityTier()==='low'?24:64);i++)points.push(new THREE.Vector3(-92+random()*58,.8+random()*7,-78+random()*48));const geometry=new THREE.BufferGeometry().setFromPoints(points),particles=new THREE.Points(geometry,particleMaterial);group.add(particles);
    const portalMat=new THREE.MeshStandardMaterial({map:loadWorldTexture('hero-energy','basecolor',{repeat:[1,1],color:true}),normalMap:loadWorldTexture('hero-energy','normal',{repeat:[1,1]}),emissiveMap:loadWorldTexture('hero-energy','emissive',{repeat:[1,1]}),color:0x5ddfff,emissive:0x147fae,emissiveIntensity:.62,roughness:.18,metalness:.18,transparent:true,opacity:.76});otthiWorldRuntime.materials.set('heroEnergy',portalMat);
    world.worldProfessional={...(world.worldProfessional||{}),atmosphere:{group,particles,portalMat}};return true;
  }
  function createWorldLandmarks(){
    if(world.worldProfessional?.landmarks)return false;const items=[];
    for(const [x,z,s]of[[-98,-18,.75],[-85,-28,.5],[-75,-62,.62],[-52,68,.58],[36,66,.5],[92,10,.68]])items.push(createWorldMushroomCluster(x,z,s));
    const signGroup=new THREE.Group();signGroup.position.set(12,0,-5.8);signGroup.userData.otthiWorldDetail=true;worldGroup.add(signGroup);premiumBox(4.8,.24,.28,materials.wood,0,2.6,0,signGroup,0x142033);premiumBox(.24,2.6,.24,materials.wood,-1.9,1.3,0,signGroup,0x142033);premiumBox(.24,2.6,.24,materials.wood,1.9,1.3,0,signGroup,0x142033);const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.35,1.15),new THREE.MeshStandardMaterial({map:signTexture('OTTHI WORLD','#103652','#ffffff'),roughness:.5,side:THREE.DoubleSide}));sign.position.set(0,2.65,.16);signGroup.add(sign);items.push(signGroup);
    world.worldProfessional={...(world.worldProfessional||{}),landmarks:items};return true;
  }
  function createOtthiWorldProfessionalLayer(){
    if(!worldGroup||otthiWorldRuntime.worldLayerReady)return false;ensureOtthiWorldState();upgradeCoreMaterialsToWorldPbr();improveSceneMeshMaterials(worldGroup);enhanceWorldHouses();createWorldInstancedDetails();createWorldAtmosphericDetails();createWorldLandmarks();
    if(renderer){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.outputEncoding=THREE.sRGBEncoding;}
    scene.background=new THREE.Color(0x70c8ef);scene.fog=new THREE.Fog(0xaadcf1,210,520);applyOtthiWorldRuntimeSettings();otthiWorldRuntime.worldLayerReady=true;return true;
  }
  function updateOtthiWorldEnvironment(dt){
    if(!otthiWorldRuntime.worldLayerReady)return;otthiWorldRuntime.updateTime+=dt;const time=otthiWorldRuntime.updateTime;
    const waterMaterial=materials.water;if(waterMaterial?.normalMap){waterMaterial.normalMap.offset.x=(waterMaterial.normalMap.offset.x+dt*.008)%1;waterMaterial.normalMap.offset.y=(waterMaterial.normalMap.offset.y+dt*.005)%1;}
    const atmosphere=world.worldProfessional?.atmosphere;if(atmosphere?.particles){atmosphere.particles.rotation.y=time*.018;atmosphere.particles.position.y=Math.sin(time*.35)*.14;}
    if(state.settings?.worldDayCycle&&sunLight){const cycle=(Math.sin(time*.018)+1)*.5,angle=time*.012;sunLight.position.set(Math.cos(angle)*52,30+cycle*26,Math.sin(angle)*48);sunLight.intensity=.88+cycle*.55;scene.background.setHSL(.55,.65,.58+cycle*.12);if(scene.fog)scene.fog.color.copy(scene.background).lerp(new THREE.Color(0xd9eeff),.45);}
  }
