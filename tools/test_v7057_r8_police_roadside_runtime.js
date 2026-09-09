#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'src/modules/16-emergency-services.js'), 'utf8');
const start = source.indexOf('  function policeRoadsideLocalPoint');
const end = source.indexOf('  function finishSafetyStop', start);
if (start < 0 || end < 0) throw new Error('Bloco da abordagem policial R8 não localizado.');
const code = source.slice(start, end);

let clock = 1000;
let finishCalls = 0;
const toasts = [];
const panels = [];

function vector3(){return {x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}};}
class Group {
  constructor(){this.position=vector3();this.rotation={x:0,y:0,z:0};this.scale={x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z;},setScalar(v){this.x=this.y=this.z=v;}};this.visible=true;this.children=[];this.name='';}
  add(child){this.children.push(child);return child;}
}
function part(){return {rotation:{x:0,y:0,z:0}};}

const context = {
  console,
  Math,
  THREE:{Group},
  performance:{now:()=>clock},
  worldGroup:{items:[],add(item){this.items.push(item);},remove(item){this.items=this.items.filter(x=>x!==item);}},
  world:{policeCars:[]},
  player:{x:12,z:25,vx:0,vz:0,vehicle:true,car:{speed:0,heading:0},facing:0},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  lerp:(a,b,t)=>a+(b-a)*t,
  lerpAngle:(a,b,t)=>a+(b-a)*t,
  groundHeightAt:()=>0,
  premiumBox:()=>part(),
  premiumCylinder:()=>part(),
  clearPolicePursuit:()=>{},
  clearMovementInputs:()=>{},
  updateSafetyPanel:(message='')=>panels.push(message),
  toast:(message,type,duration)=>toasts.push({message,type,duration}),
  finishSafetyStop:()=>{finishCalls++;},
};
vm.createContext(context);
vm.runInContext(code, context, {filename:'16-emergency-services.r8.runtime.js'});

function assert(condition, message){if(!condition)throw new Error(message);}
const doorPivot = new Group();
const car={id:'patrol-test',group:new Group(),currentSpeed:5,roadsideDoorPivot:doorPivot,roadsideDoorOpen:0};
car.group.position.set(10,0,20);car.group.rotation.y=0;context.world.policeCars.push(car);
const alert={carId:car.id,phase:'pursuit',reason:'toll-evasion',tollName:'Praça Teste',tollCost:5,fine:20};

assert(context.beginPoliceRoadsideStop(alert,car)===true,'A abordagem não iniciou.');
assert(alert.phase==='officer-exiting','A fase inicial não é officer-exiting.');
assert(alert.officer && alert.officer.group.visible===false,'O policial deve começar dentro da viatura e ainda oculto enquanto a porta inicia a abertura.');
const insideX=alert.officer.group.position.x;
assert(insideX>10.3 && insideX<10.8,'O policial não nasceu na região interna/lateral da viatura.');
assert(car.roadsideDoorOpen===0,'A porta deveria começar fechada.');

clock=1300;context.updatePoliceRoadsideStop(alert,car,.1);
assert(alert.phase==='officer-exiting','A saída terminou cedo demais.');
assert(alert.officer.group.visible===true,'O policial deveria estar aparecendo através da porta durante a saída.');
assert(car.roadsideDoorOpen>0.3,'A porta não abriu durante a saída.');
assert(alert.officer.group.position.x>insideX,'O policial não se deslocou do interior para fora.');

clock=2200;context.updatePoliceRoadsideStop(alert,car,.1);
assert(alert.phase==='approaching','A saída física não concluiu na fase approaching.');
assert(alert.officer.group.position.x>11.5,'O policial não terminou a saída do lado de fora da viatura.');
assert(car.roadsideDoorOpen>0.95,'A porta não permaneceu aberta no fim da saída.');

let guard=0;
while(alert.phase==='approaching' && guard++<80){clock+=100;context.updatePoliceRoadsideStop(alert,car,.1);}
assert(alert.phase==='officer-speaking','O policial não entrou na fase de conversa após se aproximar.');
assert(typeof alert.officerSpeech==='string' && alert.officerSpeech.includes('evasão'),'A bronca contextual da evasão não foi registrada.');
assert(toasts.some(x=>x.message.includes('👮 Policial:') && x.message.includes('evasão')),'A fala visível do policial não foi exibida.');
assert(panels.some(x=>x.includes('👮 Policial:')),'O painel da abordagem não exibiu a fala do policial.');
assert(car.roadsideDoorOpen<0.05,'A porta deveria fechar depois que o policial saiu.');

clock=alert.phaseAt+2700;context.updatePoliceRoadsideStop(alert,car,.1);
assert(alert.phase==='ticket-writing','A abordagem não avançou da conversa para o registro da multa.');
clock=alert.phaseAt+1500;context.updatePoliceRoadsideStop(alert,car,.1);
assert(finishCalls===1,'A abordagem não concluiu exatamente uma vez após o registro da multa.');

console.log(JSON.stringify({passed:true,phases:['officer-exiting','approaching','officer-speaking','ticket-writing','finished'],doorAnimation:true,visibleSpeech:true,finishCalls},null,2));
