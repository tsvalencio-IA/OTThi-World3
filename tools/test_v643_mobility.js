#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');

function extractFunction(source,name){
  const marker=`function ${name}(`;
  const start=source.indexOf(marker);
  if(start<0)throw new Error(`Função ${name} não encontrada`);
  const brace=source.indexOf('{',start);
  let depth=0, quote='', escaped=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(ch==='\\'){escaped=true;continue;}
      if(ch===quote)quote='';
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Fim da função ${name} não encontrado`);
}

const vehicleSource=fs.readFileSync(path.join(ROOT,'src/modules/26-input-player-physics.js'),'utf8');
const boatSource=fs.readFileSync(path.join(ROOT,'src/modules/18-water-fishing-boats.js'),'utf8');
const functions=[
  extractFunction(vehicleSource,'mobilityThrottleIntent'),
  extractFunction(vehicleSource,'updateVehiclePhysics'),
  extractFunction(boatSource,'updateBoatPhysics')
].join('\n');

const context={
  Math,Number,Map,console,
  performance:{now:()=>100000},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  lerp:(a,b,t)=>a+(b-a)*t,
  approachNumber:(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount),
  input:{mobilityAccelerate:false,mobilityBrake:false},
  player:{
    vx:0,vz:0,facing:0,vehicle:true,boating:false,
    car:{heading:0,speed:0,steerVisual:0,drift:0,passengerOf:'',incidentUntil:0},
    boat:{heading:0,speed:0,steerVisual:0,passengerOf:''}
  },
  world:{ghosts:new Map()},
  sprintRequested:()=>false,
  updateMobilityControlLabels:()=>{},
  toast:()=>{},exitVehicle:()=>{},exitBoat:()=>{}
};
vm.createContext(context);
vm.runInContext(functions,context);

const dt=1/60;
function resetCar(){
  Object.assign(context.player,{vx:0,vz:0,facing:0,vehicle:true,boating:false});
  Object.assign(context.player.car,{heading:0,speed:0,steerVisual:0,drift:0,passengerOf:'',incidentUntil:0});
  context.input.mobilityAccelerate=false;context.input.mobilityBrake=false;
}
function stepCar(frames,steer=0,analogThrottle=0){
  let x=0,z=0;
  for(let i=0;i<frames;i++){
    context.updateVehiclePhysics(dt,steer,analogThrottle);
    x+=context.player.vx*dt;z+=context.player.vz*dt;
  }
  return{x,z,heading:context.player.car.heading,speed:context.player.car.speed};
}
function resetBoat(){
  Object.assign(context.player,{vx:0,vz:0,facing:0,vehicle:false,boating:true});
  Object.assign(context.player.boat,{heading:0,speed:0,steerVisual:0,passengerOf:''});
  context.input.mobilityAccelerate=false;context.input.mobilityBrake=false;
}
function stepBoat(frames,steer=0,analogThrottle=0){
  let x=0,z=0;
  for(let i=0;i<frames;i++){
    context.updateBoatPhysics(dt,steer,analogThrottle);
    x+=context.player.vx*dt;z+=context.player.vz*dt;
  }
  return{x,z,heading:context.player.boat.heading,speed:context.player.boat.speed};
}

const tests=[];
function check(name,condition,detail){tests.push({name,passed:!!condition,detail});}

resetCar();context.input.mobilityAccelerate=true;const carStraight=stepCar(120,0,0);
check('Carro acelera apenas pelo botão',carStraight.speed>8&&carStraight.z>6,carStraight);

resetCar();context.input.mobilityAccelerate=true;const carRight=stepCar(120,.8,0);
check('Carro: comando direita produz curva visual à direita',carRight.heading<0&&carRight.x<0,carRight);
resetCar();context.input.mobilityAccelerate=true;const carLeft=stepCar(120,-.8,0);
check('Carro: comando esquerda produz curva visual à esquerda',carLeft.heading>0&&carLeft.x>0,carLeft);
check('Carro: curvas laterais são simétricas e opostas',Math.sign(carRight.heading)===-Math.sign(carLeft.heading)&&Math.abs(Math.abs(carRight.heading)-Math.abs(carLeft.heading))<.08,{right:carRight,left:carLeft});

resetCar();context.input.mobilityAccelerate=true;stepCar(90,0,0);const speedBeforeBrake=context.player.car.speed;
context.input.mobilityAccelerate=false;context.input.mobilityBrake=true;const carBrake=stepCar(28,0,0);const carReverse=stepCar(100,0,0);
check('Carro: Freio reduz a velocidade antes da ré',speedBeforeBrake>0&&carBrake.speed<speedBeforeBrake,{speedBeforeBrake,afterBrake:carBrake.speed});
check('Carro: botão Freio/Ré engata ré depois de parar',carReverse.speed<-.5&&carReverse.z<carBrake.z,{afterBrake:carBrake,afterReverse:carReverse});

resetCar();context.input.mobilityBrake=true;stepCar(70,0,0);const reverseSpeed=context.player.car.speed;
context.input.mobilityBrake=false;context.input.mobilityAccelerate=true;const recoverForward=stepCar(140,0,0);
check('Carro: Acelerar freia a ré e volta ao avanço',reverseSpeed<0&&recoverForward.speed>0,{reverseSpeed,recoverForward});

resetBoat();context.input.mobilityAccelerate=true;const boatStraight=stepBoat(120,0,0);
check('Barco acelera apenas pelo botão',boatStraight.speed>4&&boatStraight.z>4,boatStraight);
resetBoat();context.input.mobilityAccelerate=true;const boatRight=stepBoat(150,.8,0);
check('Barco: comando direita produz curva visual à direita',boatRight.heading<0&&boatRight.x<0,boatRight);
resetBoat();context.input.mobilityAccelerate=true;const boatLeft=stepBoat(150,-.8,0);
check('Barco: comando esquerda produz curva visual à esquerda',boatLeft.heading>0&&boatLeft.x>0,boatLeft);

resetBoat();context.input.mobilityAccelerate=true;stepBoat(100,0,0);const boatBeforeBrake=context.player.boat.speed;
context.input.mobilityAccelerate=false;context.input.mobilityBrake=true;const boatBrake=stepBoat(40,0,0);const boatReverse=stepBoat(100,0,0);
check('Barco: Freio reduz antes da ré',boatBeforeBrake>0&&boatBrake.speed<boatBeforeBrake,{boatBeforeBrake,boatBrake});
check('Barco: Freio/Ré engata ré após parar',boatReverse.speed<-.3,{boatBrake,boatReverse});

const report={version:643,sourceFunctions:['mobilityThrottleIntent','updateVehiclePhysics','updateBoatPhysics'],passed:tests.every(t=>t.passed),counts:{passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length},tests};
const out=path.join(ROOT,'docs/RELATORIO-TESTE-MOBILIDADE-V643.json');
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.table(tests.map(t=>({teste:t.name,resultado:t.passed?'APROVADO':'FALHOU'})));
console.log(JSON.stringify(report.counts));
if(!report.passed)process.exit(1);
