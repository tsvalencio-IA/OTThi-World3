#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const body=file=>fs.readFileSync(file,'utf8').split('// @otthi-module-body',2)[1];
const records={roads:[],houses:[],vehicles:[],waters:[],largeBoxes:[],systems:{sports:0,kart:0,castle:0,ottovias:0}};
const world={bridgeParts:[],houses:[],vehicles:[],interactables:[],resources:[],builds:[],colliders:[],hazards:[],landmarks:[],npcs:[],enemies:[],routePath:[]};
const group=()=>({position:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},rotation:{y:0},add(){},traverse(){},children:[]});
const c={window:{},console,Math,Date,Number,String,Array,Object,JSON,setTimeout:()=>0,clearTimeout:()=>{},
 THREE:{Group:function(){return group();},Color:function(){},Fog:function(){}},scene:{add(){}},worldGroup:null,world,materials:{grass:{},wood:{}},state:{flags:{}},player:{},
 stableBox:()=>({receiveShadow:false}),createSkyDome:()=>{},
 createRoad:(x,z,w,d)=>records.roads.push({x,z,w,d}),
 createDistrictVisuals:()=>{},createLearningPlaza:()=>{},createOttoviasWorld:()=>{records.systems.ottovias++;},
 createWater:(x,z,w,d)=>records.waters.push({x,z,w,d}),createReservoirBasin:(main,north)=>records.waters.push({x:main.x,z:main.z,w:main.w,d:main.d},{x:north.x,z:north.z,w:north.w,d:north.d}),createLava:()=>{},
 box:(w,h,d,mat,x,y,z)=>{const item={w,h,d,x,z};if(w>=8&&h>=6&&d>=8)records.largeBoxes.push(item);return group();},registerPlatform:()=>{},
 createTree:()=>{},createRock:()=>{},createFlower:()=>{},
 playerDisplayName:()=> 'Teste',
 createHouse:data=>{const h={...data,w:9,d:7,roof:{},front:{},door:{}};records.houses.push(h);world.houses.push(h);return h;},addHouseInterior:()=>{},
 createGoldMine:()=>{},createVillageWell:()=>{},createGoldFoundry:()=>{},createFenceLine:()=>{},createLamp:()=>{},
 createNPC:(id,name,x,z)=>({id,name,x,z,group:group()}),createNpcMobility:()=>{},
 createToyCar:(x,z,opt={})=>{const v={id:opt.id||'car',kind:'car',x,z,radius:1.35,group:group()};v.group.position.set(x,0,z);records.vehicles.push(v);world.vehicles.push(v);return v;},
 registerInteractable:item=>{world.interactables.push(item);return item;},openJobCenter:()=>{},
 createLakeExpansion:()=>{},createCampfireZone:()=>{},createHuntingArea:()=>{},restoreLifeExpansion:()=>{},applyCloudWorldObjects:()=>{},
 createSportsComplexV704:()=>{records.systems.sports++;},createKartCircuitV704:()=>{records.systems.kart++;},createSizeChallenges:()=>{},createTransitWorld:()=>{},createPoliceSystem:()=>{},createFireServiceWorld:()=>{},decorateCityServices:()=>{},createWaypointMarker:()=>{},createCooperativeMissionWorld:()=>{},
 createSignpost:()=>{},createPlatform:()=>{},createCrystal:()=>{},createChest:()=>({}),
 createRoyalCastle:(x,z)=>{records.systems.castle++;records.largeBoxes.push({id:'castle',x,z,w:31,h:10,d:28});},createEnemy:()=>{},
 repairBridge:()=>{},migrateWorldBuildsToSafeZoneV704:()=>{},reconcileWorldBuilds:()=>{},updateBridgeVisual:()=>{},restoreActiveAdventure:()=>{}
};
vm.createContext(c);vm.runInContext(body('src/modules/05a-world-layout-v704.js'),c);vm.runInContext(body('src/modules/20-world-build-cloud-houses.js'),c);
vm.runInContext('buildWorld()',c);
const api=c.window.OTTHI_WORLD_LAYOUT_V704,layout=api.layout;
assert.strictEqual(records.roads.length,layout.roads.length,'buildWorld deve criar exatamente as vias do layout mestre');
for(let i=0;i<layout.roads.length;i++)assert.deepStrictEqual(records.roads[i],{x:layout.roads[i].x,z:layout.roads[i].z,w:layout.roads[i].w,d:layout.roads[i].d});
assert.strictEqual(records.systems.sports,1,'complexo esportivo duplicado');assert.strictEqual(records.systems.kart,1,'kartódromo duplicado');assert.strictEqual(records.systems.castle,1,'castelo duplicado');assert.strictEqual(records.systems.ottovias,1,'OTTOVIAS deve ser inicializada exatamente uma vez pelo buildWorld');
const roadRects=layout.roads.map(r=>({x:r.x,z:r.z,w:r.w+(r.w<r.d?2.7:0),d:r.d+(r.w>=r.d?2.7:0)}));
const overlap=(a,b,m=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+m&&Math.abs(a.z-b.z)<(a.d+b.d)/2+m;
for(const h of records.houses)for(const r of roadRects)assert(!overlap(h,r,1),`casa ${h.id} sobre via`);
const protectedIds=['stadium','volley','footvolley','kart-circuit'];const protectedAreas=protectedIds.map(id=>api.structure(id));
for(const h of records.houses)for(const a of protectedAreas)assert(!overlap(h,a,.1),`casa ${h.id} dentro de ${a.id}`);
for(const b of records.largeBoxes){if(b.id==='castle')continue;for(const a of protectedAreas)assert(!overlap(b,a,.1),`prédio decorativo dentro de ${a.id}`);}
for(const v of records.vehicles){for(const a of protectedAreas)assert(!overlap({x:v.x,z:v.z,w:2.7,d:2.7},a,.1),`veículo ${v.id} dentro de ${a.id}`);}
assert.deepStrictEqual(records.waters,[{x:-88,z:54,w:50,d:22},{x:-104,z:69,w:24,d:14}]);
for(const water of records.waters)for(const road of roadRects)assert(!overlap(water,road,0),`água da represa sobre via ${road.x},${road.z}`);
console.log(JSON.stringify({passed:true,checks:records.roads.length+records.houses.length+records.vehicles.length+records.largeBoxes.length+8,counts:{roads:records.roads.length,houses:records.houses.length,vehicles:records.vehicles.length,largeDecorativeBuildings:records.largeBoxes.length,waters:records.waters.length,systems:records.systems}}));
