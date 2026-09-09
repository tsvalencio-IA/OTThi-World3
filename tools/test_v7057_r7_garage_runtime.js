#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const body=fs.readFileSync('src/modules/36-modular-build-machines.js','utf8').split('// @otthi-module-body',2)[1];
const makeGroup=(x,z)=>({visible:true,position:{x,y:0,z,set(nx,ny,nz){this.x=nx;this.y=ny;this.z=nz;}},rotation:{y:0},userData:{},add(){},remove(){},traverse(){}});
const vehicles=[
  {id:'garage-orange',label:'Clássico Laranja',group:makeGroup(-30.5,43.2),occupied:false},
  {id:'market-blue',label:'Compacto Azul',group:makeGroup(-31,-13),occupied:false},
  {id:'city-white',label:'Sedã Urbano Branco',group:makeGroup(14,-13),occupied:false}
];
const state={profile:{coins:1000},settings:{},vehicles:{lastUsedId:'garage-orange',owned:['garage-orange','market-blue'],primaryId:'garage-orange',parked:{},modularParts:{},partDurability:{},garage:{slots:{'1':'garage-orange'},stored:{},purchasedAt:{}}}};
const events=[];
const context={
  console,Math,Date,Number,String,Array,Object,JSON,parseInt,Set,Map,Promise,
  window:{THREE:{}},BUILD_RECIPES:{},world:{vehicles,builds:[],interactables:[]},worldGroup:{add(){}},materials:{},state,
  player:{x:-18,z:39,vehicle:false,car:{id:''}},vehicleVisual:null,otthiWorldRuntime:{materials:new Map(),stats:{vehicleModules:0}},
  THREE:{Group:function(){return makeGroup(0,0);},MeshBasicMaterial:function(){},MeshStandardMaterial:function(){},Mesh:function(){return makeGroup(0,0);},PlaneGeometry:function(){},BoxGeometry:function(){},CylinderGeometry:function(){},TorusGeometry:function(){},Color:function(){} ,DoubleSide:2},
  buildFootprint:()=>({w:1,d:1}),createBuildPreviewMesh:()=>null,spawnBuild:()=>null,normalizeBuildRecord:x=>x,buildRecordSignature:()=>'',groundHeightAt:()=>0,registerPlatform:()=>{},registerCollider:()=>{},premiumBox:()=>makeGroup(0,0),premiumCylinder:()=>makeGroup(0,0),worldAvatarMaterial:()=>({}),loadWorldTexture:()=>({}),sharedBoxGeometry:()=>({}),registerInteractable:item=>item,ensureUv2:()=>{},addGlow:()=>null,
  createToyCar:()=>null,currentMapLocations:()=>[],applyVehicleAppearance:()=>{},registerVehicleImpact:()=>{},currentVehicleRef:()=>null,disposeWorldAvatarObject:()=>{},addVoxelOutline:()=>{},safeAvatarColor:(value)=>value,escapeHtml:value=>String(value),
  ensureOtthiWorldState:()=>state,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),worldLayoutPoint:(id,fallback)=>id==='homeGarage'?{x:-31,z:46}:fallback,vehicleById:id=>vehicles.find(v=>v.id===id)||null,
  persistParkedVehicle:vehicle=>{state.vehicles.parked[vehicle.id]={x:vehicle.group.position.x,z:vehicle.group.position.z,heading:vehicle.group.rotation.y};},saveState:()=>Promise.resolve(true),updateContext:()=>{},toast:(message)=>events.push(message),addCoins:value=>{state.profile.coins+=value;},addXP:()=>{},confirmModal:async()=>true,setWaypoint:()=>{},qualityTier:()=> 'low',
  openModal:()=>{},$:()=>null,$$:()=>[],syncCloudProgress:()=>Promise.resolve(true),repairVehicleV704:()=>true,signTexture:()=>({})
};
vm.createContext(context);vm.runInContext(body,context,{filename:'36-modular-build-machines.js'});

assert.deepStrictEqual(Array.from(vm.runInContext('ensurePlayerGarageState();state.vehicles.owned',context)),['garage-orange','market-blue']);
assert.strictEqual(vm.runInContext("placeOwnedVehicleInGarage('market-blue')",context),true);
assert.strictEqual(state.vehicles.garage.slots['2'],'market-blue');
assert.strictEqual(vehicles[1].group.position.x,-30.5);assert.strictEqual(vehicles[1].group.position.z,46);
assert.strictEqual(vm.runInContext("storeOwnedVehicle('market-blue',true)",context),true);
assert.strictEqual(state.vehicles.garage.slots['2'],'');assert.strictEqual(state.vehicles.garage.stored['market-blue'],true);assert.strictEqual(vehicles[1].group.visible,false);
assert.strictEqual(vm.runInContext("setPrimaryPlayerVehicle('market-blue')",context),true);assert.strictEqual(state.vehicles.primaryId,'market-blue');
(async()=>{
  assert.strictEqual(await vm.runInContext("buyPlayerVehicle('city-white')",context),true);
  assert(state.vehicles.owned.includes('city-white'));assert.strictEqual(state.profile.coins,740);assert.strictEqual(state.vehicles.garage.slots['2'],'city-white');assert.strictEqual(vehicles[2].group.visible,true);
  context.player.x=180;context.player.z=180;vm.runInContext('updateParkedVehicleVisibility()',context);assert.strictEqual(vehicles[0].group.visible,false);assert.strictEqual(vehicles[1].group.visible,false);
  process.stdout.write(JSON.stringify({passed:true,checks:16,owned:state.vehicles.owned,slots:state.vehicles.garage.slots,coins:state.profile.coins,events:events.length})+'\n');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
