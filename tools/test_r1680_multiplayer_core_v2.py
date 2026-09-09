#!/usr/bin/env python3
from pathlib import Path
import json, subprocess
ROOT=Path(__file__).resolve().parents[1]

def read(rel): return (ROOT/rel).read_text('utf-8')
def require(cond,msg):
    if not cond: raise AssertionError(msg)

version=json.loads(read('VERSION.json')); order=json.loads(read('src/module-order.json')); rules=json.loads(read('firebase-database.rules.json'))
core=read('src/modules/28b-multiplayer-core-v2.js'); mp=read('src/modules/28-multiplayer-social-online.js'); adapter=read('assets/js/multiplayer-rtdb.js'); loop=read('src/modules/29-game-loop-controls-gamepad.js'); physics=read('src/modules/26-input-player-physics.js'); shared=read('src/modules/28a-shared-world-multiplayer.js'); sports=read('src/modules/13a-sports-kart-v705.js'); diag=read('src/modules/09-responsive-ar-quality-diagnostics.js')
checks=0
def ok(cond,msg):
    global checks; require(cond,msg); checks+=1

files=[x['file'] for x in order['javascript']]
i28=files.index('src/modules/28-multiplayer-social-online.js')
ok(files[i28-1].endswith('28b-multiplayer-core-v2.js'),'Core V2 deve carregar antes do multiplayer legado')
ok(files[i28+1].endswith('28a-shared-world-multiplayer.js'),'28/28a legado deve continuar adjacente')
ok(files[i28+2].endswith('29-game-loop-controls-gamepad.js'),'28a deve continuar antes do loop')
for token in ['MULTIPLAYER_CORE_V2_PROTOCOL=2','multiplayerV2Hermite','multiplayerV2RemotePose','updateMultiplayerRenderV2','updateMultiplayerNetworkV2','multiplayerV2Diagnostics']:
    ok(token in core,f'Core V2 ausente: {token}')
for token in ['publishMotionV2','claimWorldAuthorityV2','publishWorldV2','sendEventV2','claimSportAuthorityV2','joinSportMatchV2','publishSportStateV2','publishSportInputV2']:
    ok(f'function {token}' in adapter or token in adapter,f'RTDB V2 ausente: {token}')
for path in ['motionV2','worldV2','eventsV2','matchesV2']:
    ok(path in adapter,f'canal RTDB ausente: {path}')
ok("updateMultiplayerNetworkV2(dt)" in loop,'rede V2 não roda por frame')
ok("updateMultiplayerRenderV2(dt)" in loop,'render remoto V2 não roda por frame')
ok("updateMultiplayer(step)" in loop,'fallback multiplayer V1 removido')
ok("multiplayerV2GhostControlled" in mp and "if(!v2Controlled)" in mp,'V1 ainda sobrescreve pose V2')
ok("shared=v2Active?{sharedAuthority:'',sharedScene:null" in mp,'snapshot pesado ainda viaja no presence V2')
ok('now-lastPublish>240' in mp and 'now-lastPublishHeartbeat>2200' in mp,'cadência V1 legada removida')
ok('multiplayerV2RemotePose(car.passengerOf,target,true)' in physics,'passageiro não usa pose do host V2')
ok('if(v2Pose){player.x=tx;player.z=tz' in physics,'passageiro V2 não está rigidamente preso ao assento')
ok('smoothPassengerHostPose' in physics,'fallback R16.7.15 removido')
ok("source:'local-host'" in core,'passageiro remoto do veículo local não usa transform direto do host')
ok('multiplayerV2WorldAuthorityId' in shared,'mundo compartilhado não prefere autoridade V2')
ok('multiplayerV2WorldSnapshot' in shared,'réplica de mundo não consome worldV2')
ok("![SHARED_WORLD_PROTOCOL,2].includes" in shared,'shared world não aceita protocolos V1/V2')
ok('function sharedWorldCaptureScene(minInterval=360)' in shared and 'sharedWorldCaptureScene(220)' in core,'worldV2 não possui captura rápida preservando V1')
for typ in ['football','volley','footvolley','kart']:
    ok(typ in core and typ in sports,f'esporte V2 não integrado: {typ}')
for token in ['v705SportStateSnapshot','v705ApplySportReplica','v705GuestSportAction','v705ApplyRemoteSportInputV2','v705ConsumeRemoteSportInputs']:
    ok(f'function {token}' in sports,f'helper autoritativo ausente: {token}')
ok("multiplayerV2PrepareSport('football')" in sports,'futebol não entra em sessão V2')
ok("multiplayerV2PrepareSport(type)" in sports,'quadras não entram em sessão V2')
ok("multiplayerV2PrepareSport('kart')" in sports,'kart não entra em sessão V2')
ok("!multiplayerV2SportIsHost('football')" in sports,'futebol convidado ainda simula física própria')
ok("!multiplayerV2SportIsHost(c.type)" in sports,'quadra convidada ainda simula física própria')
ok("guestV2" in sports and "if(!guestV2)for(const ai of k.ai)" in sports,'kart convidado ainda simula IA própria')
ok("v705GuestSportAction('football','kick')" in sports,'chute remoto não vira input')
ok("v705GuestSportAction('football','pass')" in sports,'passe remoto não vira input')
ok("v705GuestSportAction('football','tackle')" in sports,'carrinho remoto não vira input')
ok("v705GuestSportAction(c.type" in sports,'ações de vôlei/futevôlei não viram input')
ok("multiplayerV2PublishSportState" in sports,'host não publica estado autoritativo')
ok('function v705RemoteFootballCarry' in sports,'jogador remoto não consegue conduzir a bola autoritativa')
ok('function v705KartSharedPlayers' in sports,'ranking do kart não inclui jogadores reais')
ok("MP Core V2" in diag and "jitter" in diag and "Dados estimados V2" in diag,'diagnóstico multiplayer V2 incompleto')
room=rules['rules']['otthosWorld']['rooms']['$roomId']
for node in ['motionV2','worldV2','eventsV2','matchesV2']:
    ok(node in room,f'Rules sem {node}')
ok("auth.uid === $uid" in room['motionV2']['$uid']['.write'],'motionV2 permite escrever outro usuário')
ok('leaseUntilClient' in room['worldV2']['authority']['.write'],'autoridade mundial sem lease')
ok('actorUid' in room['eventsV2']['$eventId']['.write'],'eventsV2 sem autoria')
ok('!newData.exists()' in room['eventsV2']['$eventId']['.write'] and '!newData.exists()' in room['eventsV2']['$eventId']['.validate'],'eventsV2 não permite limpeza segura pelo autor')
ok('setTimeout(()=>{api?.remove?.(ref)' in adapter,'eventos V2 não têm limpeza automática')
ok('authority' in room['matchesV2']['$type'] and 'participants' in room['matchesV2']['$type'] and 'inputs' in room['matchesV2']['$type'],'matchesV2 incompleto')
# contratos legados que já causaram regressão devem continuar
for token in ['carServiceLayers','vehiclePassengerUids','vehiclePassengerOf','vehicleRole','garageFleet','workshopActionSig']:
    ok(token in mp or token in adapter or token in shared,f'contrato legado removido: {token}')
ok(version['revisionLabel'].startswith('R16.8.0-'),'revisionLabel não identifica R16.8.0')
ok(version['assetVersion']>=70614,'cache V2 não foi renovado')
ok(version['validation'].get('multiplayerCoreV2StaticApproved') is True,'flag estática V2 ausente')
ok(version['validation'].get('multiplayerTwoDevicesApproved') is False,'teste físico foi declarado indevidamente')
for rel in ['assets/js/multiplayer-rtdb.js','src/modules/28b-multiplayer-core-v2.js','src/modules/28-multiplayer-social-online.js','src/modules/13a-sports-kart-v705.js','src/modules/29-game-loop-controls-gamepad.js']:
    r=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True);ok(r.returncode==0,f'sintaxe inválida: {rel}: {r.stderr}')
print(f'R16.8.0 Multiplayer Core V2: {checks} verificações aprovadas')
