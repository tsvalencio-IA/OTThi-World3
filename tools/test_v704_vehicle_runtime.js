#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/modules/36a-vehicle-damage-repair-v704.js','utf8').split('// @otthi-module-body',2)[1];
const vehicle={id:'test-car',label:'Carro de teste',kind:'car',x:0,z:0,heading:0,group:{position:{x:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},rotation:{y:0},visible:true}};
let modalOpened=0,legacyPhysicsCalls=0,legacyImpactCalls=0,saves=0,towed=0,towStatus='';
const context={
 console,Math,Date,Number,String,Array,Object,JSON,performance:{now:()=>1000},
 setTimeout:fn=>{fn();return 1;},clearTimeout:()=>{},
 window:{},
 state:{profile:{coins:500},inventory:{stone:10,wood:10},vehicles:{lastUsedId:'test-car',parked:{},partDurability:{},broken:{},damageHistory:[]}},
 player:{x:0,z:0,vx:7,vz:3,vehicle:true,car:{id:'test-car',kind:'car',speed:20,heading:0,broken:false,passengerOf:null}},
 world:{vehicles:[vehicle],interactables:[],vehicle},worldGroup:{remove:()=>{}},vehicleVisual:{},
 els:{vehicleBadge:{textContent:'CARRO'}},
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
 currentVehicleRef:()=>vehicle,vehicleById:id=>id===vehicle.id?vehicle:null,
 applyWorldVehicleModulesToGroup:()=>true,
 box:()=>({userData:{},position:{x:0,y:1,z:0},rotation:{x:0,z:0}}),
 stopEngineSound:()=>{},vibrate:()=>{},toast:()=>{},saveState:()=>{saves++;},updateHUD:()=>{},updateMobilityControlLabels:()=>{},
 disposeDetachedVisual:()=>{},
 addCoins:n=>{context.state.profile.coins=Math.max(0,context.state.profile.coins+Math.round(n));},
 enterVehicle:()=>true,registerVehicleImpact:()=>{legacyImpactCalls++;},updateVehiclePhysics:()=>{legacyPhysicsCalls++;},updateVehicleFX:()=>{},
 openWorldModularGarage:()=>true,createWorldModularGarageInteractable:()=>true,
 openModal:(title,html,bind)=>{modalOpened++; if(bind)bind({});},closeModal:()=>{},escapeHtml:String,
 $:()=>({}),
 exitVehicle:()=>{context.player.vehicle=false;},
	 worldLayoutPoint:id=>id==='workshop'?{x:22,z:-18}:id==='repairParking'?{x:32,z:-18}:{x:0,z:0},groundHeightAt:()=>0,
	 persistParkedVehicle:()=>{towed++;},workshopMoveVehicleToYard:(target,status)=>{towStatus=status;target.group.position.set(44,0,-25);context.persistParkedVehicle(target);return true;},registerInteractable:item=>{context.world.interactables.push(item);return item;}
};
vm.createContext(context);vm.runInContext(source,context,{filename:'36a-vehicle-damage-repair-v704.js'});
const api=context.window.OTTHI_VEHICLE_DAMAGE_V704;
assert(api,'API de dano ausente');
assert.strictEqual(api.durability(vehicle),100,'durabilidade inicial');
api.damage(vehicle,18,100);
assert.strictEqual(api.durability(vehicle),0,'impacto destrutivo precisa zerar a integridade');
assert.strictEqual(api.broken(vehicle),true,'veículo precisa ficar quebrado');
assert.strictEqual(context.player.car.speed,0,'veículo quebrado precisa parar');
assert.strictEqual(context.player.vx,0);assert.strictEqual(context.player.vz,0);
assert(modalOpened>=1,'opções de reparo/reboque precisam abrir após quebra');
context.player.car.speed=12;context.player.vx=3;context.player.vz=4;
context.updateVehiclePhysics(1/60,1,1);
assert.strictEqual(context.player.car.speed,0,'física não pode mover carro quebrado');
assert.strictEqual(legacyPhysicsCalls,0,'física legada não pode rodar no carro quebrado');
const coinsBefore=context.state.profile.coins;
assert.strictEqual(api.repair(vehicle),true,'reparo com recursos precisa funcionar');
assert.strictEqual(api.durability(vehicle),100);assert.strictEqual(api.broken(vehicle),false);
assert(context.state.profile.coins<coinsBefore,'reparo precisa consumir moedas');
api.damage(vehicle,10,100);
assert.strictEqual(api.durability(vehicle),80,'batida média precisa reduzir integridade sem destruir');
context.player.vehicle=true;
assert.strictEqual(api.tow(vehicle),true,'reboque precisa funcionar');
assert.strictEqual(vehicle.group.position.x,44);assert.strictEqual(vehicle.group.position.z,-25);assert.notStrictEqual(vehicle.group.position.x,33.4,'reboque não pode usar a coordenada única do elevador');assert.strictEqual(towStatus,'pending');assert.strictEqual(towed,1);
assert(saves>=3,'dano, reparo e reboque precisam persistir');
console.log(JSON.stringify({passed:true,checks:14,durability:api.durability(vehicle),coins:context.state.profile.coins,modalOpened,legacyImpactCalls,legacyPhysicsCalls,towed,saves}));
