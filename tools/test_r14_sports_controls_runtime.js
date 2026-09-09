const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('src/modules/13a-sports-kart-v705.js','utf8')+`\nwindow.__R14_SPORT_RUNTIME_TEST={\n setFootball:v=>{SPORTS_V705.football=v;SPORTS_V705.active=null;SPORTS_V705.uiMode='football';},\n setActive:v=>{SPORTS_V705.football=null;SPORTS_V705.active=v;SPORTS_V705.uiMode=v?.type||'';},\n action:handleActiveSportActionV704,special:handleActiveSportSpecialV704,run:handleActiveSportRunControlV705,jump:handleActiveSportJumpControlV705,map:sportControlMapV705\n};`;
function fakeClass(){return{add(){},remove(){},toggle(){},contains(){return false}}}
function button(){return{icon:{textContent:''},text:{textContent:''},classList:fakeClass(),setAttribute(){}}}
const buttons={runBtn:button(),specialBtn:button(),actionBtn:button(),jumpBtn:button(),raceBadge:{querySelector(){return null},classList:fakeClass(),appendChild(){}}};
const sandbox={
 window:null,console,Math,Date,performance:{now:()=>10000},
 document:{body:{classList:fakeClass(),dataset:{}},createElement(){return{dataset:{},classList:fakeClass(),addEventListener(){},setAttribute(){}}}},
 els:buttons,input:{touchSprint:false,mobilityAccelerate:false,mobilityBrake:false},
 player:{x:0,y:0,z:0,vx:0,vy:0,vz:0,facing:Math.PI/2,vehicle:false,car:{speed:0}},
 $:(sel,root)=>sel==='b'?root?.icon:sel==='span'?root?.text:null,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),toast(){},vibrate(){},updateVehicleControlsUI(){},
 worldGroup:{add(){},remove(){}},world:{sportsV704:null},state:{},saveState(){},closeModal(){},addXP(){},addCoins(){},
 worldLayoutPoint(){return{x:0,z:0}},groundHeightAt(){return 0},updateWaypointMarker(){},clearRaceObjects(){},
 performanceGuardian:{},setTimeout(){return 0},clearTimeout(){},
}; sandbox.window=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'13a-sports-kart-v705.js'});
const T=sandbox.__R14_SPORT_RUNTIME_TEST, P=sandbox.player, input=sandbox.input;
const checks=[];function ok(name,cond,detail=''){checks.push({name,ok:!!cond,detail});console.log((cond?'OK':'FALHOU'),'-',name,detail)}
const pos=(x=0,z=0)=>({position:{x,z,y:1.8}}),ath=(x,z,label='Companheiro')=>({role:'field',label,group:pos(x,z)});
function football(){return{finished:false,countdown:0,lastTackleAt:0,ball:pos(.7,0),home:[ath(4,0,'Ala azul'),ath(6,2,'Meia azul')],away:[ath(1.4,.1,'Marcador vermelho')],cx:0,cz:0,w:30,d:18,vx:0,vz:0,cooldown:0,possession:0,score:[0,0],time:90};}
let f=football();T.setFootball(f);P.x=0;P.z=0;P.vx=P.vz=0;P.facing=Math.PI/2;
ok('Mapa futebol usa quatro controles nativos',JSON.stringify(T.map('football')).includes('Correr')&&JSON.stringify(T.map('football')).includes('Tocar')&&JSON.stringify(T.map('football')).includes('Chutar')&&JSON.stringify(T.map('football')).includes('Carrinho'));
const a=T.action();ok('AÇÃO é consumida pelo futebol',a===true);ok('CHUTAR altera velocidade da bola',Math.hypot(f.vx,f.vz)>5,`${f.vx.toFixed(2)},${f.vz.toFixed(2)}`);ok('CHUTAR dispara animação física',P.emoteType==='sport-kick',P.emoteType);
f=football();T.setFootball(f);P.vx=P.vz=0;const j=T.jump(true);ok('PULAR/CARRINHO é consumido pelo futebol',j===true);ok('CARRINHO cria impulso do jogador',Math.hypot(P.sportTackleVx||0,P.sportTackleVz||0)>9);ok('CARRINHO mantém janela física de deslizamento',P.sportTackleUntil>10000);ok('CARRINHO dispara animação',P.emoteType==='sport-tackle',P.emoteType);
f=football();T.setFootball(f);const sp=T.special();ok('PODER/TOCAR é consumido pelo futebol',sp===true);ok('TOCAR altera a bola',Math.hypot(f.vx,f.vz)>4);ok('TOCAR dispara animação de passe',P.emoteType==='sport-pass',P.emoteType);
f=football();T.setFootball(f);T.run(true);ok('CORRER ativa sprint durante futebol',input.touchSprint===true);T.run(false);ok('Soltar CORRER desativa sprint',input.touchSprint===false);
function court(type,foot=false){return{type,foot,state:'rally',serving:0,touches:[0,0],lastSide:-1,ball:pos(0,-.5),cx:0,cz:0,w:10,d:18,vx:0,vy:0,vz:0,team:[ath(1,-2,'Parceiro')],opponents:[],score:[0,0],pointLock:0};}
let c=court('volley',false);T.setActive(c);P.x=0;P.z=-1;P.vy=0;c.ball.position.y=2;T.jump(true);ok('Vôlei CORTAR gera velocidade de ataque',c.vz>8&&c.vy>=7,`${c.vy},${c.vz}`);ok('Vôlei CORTAR anima personagem',P.emoteType==='sport-spike',P.emoteType);
c=court('volley',false);T.setActive(c);P.x=0;P.z=-1;c.ball.position.y=2;T.run(true);ok('Vôlei BLOQUEAR executa ação física',P.emoteType==='sport-block'&&c.vz>7,P.emoteType);
let fv=court('footvolley',true);T.setActive(fv);P.x=0;P.z=-1;fv.ball.position.y=2;T.run(true);ok('Futevôlei CABECEAR executa ação física',P.emoteType==='sport-header'&&fv.vz>6,P.emoteType);
fv=court('footvolley',true);T.setActive(fv);P.x=0;P.z=-1;fv.ball.position.y=2;T.jump(true);ok('Futevôlei CHUTAR executa ação física',P.emoteType==='sport-kick'&&fv.vz>7,P.emoteType);
const failed=checks.filter(x=>!x.ok);console.log(JSON.stringify({passed:failed.length===0,counts:{passed:checks.length-failed.length,failed:failed.length,total:checks.length},failed},null,2));if(failed.length)process.exit(1);
