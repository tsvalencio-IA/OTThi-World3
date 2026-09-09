#!/usr/bin/env python3
from pathlib import Path
import json, math, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ck(name,ok,detail=''):
    checks.append({'name':name,'passed':bool(ok),'detail':str(detail)})
    print(('OK' if ok else 'FALHA'),'-',name,detail)
def text(rel): return (ROOT/rel).read_text('utf-8')

version=json.loads(text('VERSION.json'))
layout_src=text('src/modules/05a-world-layout-v704.js')
world=text('src/modules/20-world-build-cloud-houses.js')
ott=text('src/modules/14a-ottovias-highway-v7054.js')
nav=text('src/modules/07-navigation-traffic-routes.js')
physics=text('src/modules/26-input-player-physics.js')
recovery=text('src/modules/25-render-init-resize-position-collision.js')
npcs=text('src/modules/27-npc-enemies-combat-camera-action.js')
index=text('index.html'); sw=text('sw.js'); manifest=json.loads(text('manifest.webmanifest'))

node="""const fs=require('fs'),vm=require('vm');const c={window:{},console};vm.createContext(c);vm.runInContext(fs.readFileSync('src/modules/05a-world-layout-v704.js','utf8'),c);const a=c.window.OTTHI_WORLD_LAYOUT_V704;const signs=(a.layout.signs||[]).map(s=>({spec:s,point:s.kind==='highway'?a.highwaySignPoint(s):{x:s.x,z:s.z}}));console.log(JSON.stringify({layout:a.layout,audit:a.staticAudit(),signs}));"""
r=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True,encoding='utf-8')
if r.returncode:
    print(r.stderr);sys.exit(1)
data=json.loads(r.stdout); layout=data['layout']; audit=data['audit']; signs=data['signs']

asset_version=int(version.get('assetVersion',0))
ck('Release V705.7 R2 ou posterior',version.get('hotfix')=='705.7' and asset_version>=70572 and str(version.get('release','')).startswith('705.7-'))
ck('Auditoria mestre integral aprovada',audit.get('passed') is True,audit.get('problems'))
ck('Auditoria cobre estruturas, zonas, caminhos e sinalização',audit.get('structures',0)>=28 and audit.get('zones',0)>=20 and audit.get('paths',0)>=12 and audit.get('signs',0)>=16,audit)

routes={h['id']:h for h in layout.get('highways',[]) if h.get('id','').startswith('ottovias')}
ck('Rede OTTOVIAS tem 3 trechos integrados',set(routes)=={'ottovias','ottovias-urban','ottovias-north-connector'},sorted(routes))
outer=routes.get('ottovias',{}); urban=routes.get('ottovias-urban',{}); north=routes.get('ottovias-north-connector',{})
ck('Circuito externo permanece fechado',outer.get('closed') is True and len(outer.get('points',[]))>=25,len(outer.get('points',[])))
ck('OTTOVIAS realmente atravessa a cidade',urban.get('usesExistingRoad') is True and urban.get('closed') is False and any(abs(p['x'])<.01 and -20<=p['z']<=20 for p in urban.get('points',[])),urban.get('points'))
ck('Travessia urbana não duplica asfalto',"if(!h.usesExistingRoad)" in ott and "Travessia urbana OTTOVIAS sobre a Avenida Central existente — sem duplicar asfalto" in ott)
ck('Ligação norte conecta cidade ao circuito externo',north.get('closed') is False and len(north.get('points',[]))>=3,north.get('points'))
edges={tuple(e) for e in layout.get('edges',[])}
for e in [('VS','OV0'),('VN','OVN1'),('OVN1','OV12')]: ck(f'Conexão viária {e[0]} → {e[1]}',e in edges)
ck('Núcleo da cidade preservado dentro da expansão',layout.get('bounds')=={'minX':-190,'maxX':190,'minZ':-190,'maxZ':190})

# Sinalização: nomes claros, posições válidas e placas rodoviárias fora da faixa de rolamento.
guide=[x for x in signs if x['spec'].get('kind')=='guide']; highway=[x for x in signs if x['spec'].get('kind')=='highway']
ck('Sinalização mestre possui guias e placas rodoviárias',len(guide)>=9 and len(highway)>=7,(len(guide),len(highway)))
for entry in signs:
    spec,p=entry['spec'],entry['point']; ck(f"Placa com texto: {spec.get('id')}",bool((spec.get('text') or spec.get('title')) and p))
for entry in highway:
    spec,p=entry['spec'],entry['point']; h=routes.get(spec.get('highwayId'))
    if not h: ck(f"Placa ligada à rodovia: {spec.get('id')}",False,'rota ausente'); continue
    # distância aproximada ao eixo do próprio segmento deve ser maior que meia pista + acostamento
    i=int(spec['segmentIndex']); pts=h['points']; a=pts[i]; b=pts[(i+1)%len(pts)]; dx=b['x']-a['x']; dz=b['z']-a['z']; den=dx*dx+dz*dz or 1; t=max(0,min(1,((p['x']-a['x'])*dx+(p['z']-a['z'])*dz)/den)); qx=a['x']+dx*t; qz=a['z']+dz*t; dist=math.hypot(p['x']-qx,p['z']-qz); minimum=float(h.get('width',10))/2+float(h.get('shoulder',0))+.4
    ck(f"Placa fora da pista: {spec.get('id')}",dist>=minimum,f'{dist:.2f} >= {minimum:.2f}')
ck('Guias antigos hardcoded removidos do buildWorld',"createSignpost(12,4,'Vila do Sol'" not in world and "for(const sign of L.signs||[])" in world)
ck('Placas OTTOVIAS vêm do layout mestre',"for(const spec of WORLD_LAYOUT_V704.signs||[])" in ott and 'v704HighwaySignPoint(spec)' in ott)
for bad in ['Mercado e Oficina','Praça Pedagio','PEDAGIO PRAIA']:
    ck(f'Texto incorreto ausente: {bad}',bad not in layout_src and bad not in ott)

# Michelle: aparência, papel e interação única.
for token in ['styleMichelleOttovias','0xa66f50','0x24160f','cabelos-cacheados','assessora-comunicacao-ottovias']:
    ck(f'Michelle: {token}',token in ott)
ck('Michelle permanece fixa em seu posto',"michelle.stationary=true" in ott and "michelle.ottoviasRole='comunicacao'" in ott)
ck('Michelle tem uma única ação reutilizando o NPC',"world.interactables.find(it=>it.id==='npc-michelle-ottovias')" in ott and 'michelle-ottovias-communication' not in ott and "action.priority=420" in ott and "action.radius=5.6" in ott)
for token in ['Plantão de Comunicação','OTTOVIAS_COMM_STOPS','startOttoviasCommunicationMission','completeOttoviasCommunicationMission']:
    ck(f'Missão de comunicação: {token}',token in ott)
for token in ['OTTOVIAS_OTTO_STOPS','isOttoOttoviasPlayer','Operação Repórter Mirim','ottoviasReporterMirim']:
    ck(f'Missão especial Otto: {token}',token in ott)
ck('Missão da Michelle atualiza GPS por etapa','ottoviasSetCommunicationWaypoint' in ott and 'buildRoutePoints(player,state.waypoint)' in ott and 'data.communication.index++' in ott)
ck('NPC profissional não recebe sociedade aleatória','world.npcs.filter(n=>!n.stationary&&!n.ottoviasRole)' in npcs)

# Pedestre na rodovia e reação real de tráfego.
for token in ['function trafficPedestrianFactor','forward=dx*fx+dz*fz','side=Math.abs(dx*rx+dz*rz)','pedestrianHornAt','actor.currentSpeed=0']:
    ck(f'Tráfego reage ao pedestre: {token}',token in nav)
ck('Fator de pedestre limita a velocidade normal','factor=Math.min(factor,trafficPedestrianFactor(actor,heading,lookAhead))' in nav)
ck('Carros buzinam com cooldown em vez de spam','actor.pedestrianHornAt=now+2400+Math.random()*1200' in nav and "beep(type==='moto'?470:385" in nav)
road_geometry=ott[ott.find('function createOttoviasRoadSegment'):ott.find('function createOttoviasHighwayGeometry')]
ck('Pedestre não é proibido na OTTOVIAS','player.vehicle||player.boating||player.transit?.mode||currentHouse' in nav and 'registerCollider' not in road_geometry)

# Recuperação: colisão normal nunca teleporta longe.
ck('Limite/queda finitos recebem correção local',"const reason=!finite?'coordenada inválida':outside?'fora dos limites':heightInvalid?'altura inválida':belowWorld?'abaixo do terreno':deepFall?'queda sem retorno':''" in recovery and 'const bounded=v704ClampWorldPoint(player.x,player.z,1)' in recovery)
ck('Penetração tenta correção local curta','distances:[.38,.58,.82,1.08,1.38]' in recovery and 'Math.hypot(local.x-player.x,local.z-player.z)<=1.45' in recovery)
ck('Penetração falha sem teleporte distante','player.invalidSince=0;return false;' in recovery)

# Pulo duplo.
for token in ['function canGroundJump','function canAirJump','player.airJumpAvailable!==false','doJump(true)','player.airJumpAvailable=false','+8.7','player.airJumpAvailable=true']:
    ck(f'Pulo duplo: {token}',token in physics)
ck('Segundo pulo só existe no ar','!player.grounded&&player.airJumpAvailable!==false' in physics)
ck('Pulo aéreo recarrega ao pousar','player.grounded=true;player.airJumpAvailable=true;player.lastJumpWasAir=false' in physics)

# Cache/release.
cache=f'?v={asset_version}'
ck('Index usa cache da release',index.count(cache)>=10,index.count(cache))
ck('Service Worker usa cache da release',f'otthi-v{asset_version}-${{REVISION}}' in sw and f'./app.js?v={asset_version}' in sw)
ck('Manifesto usa cache da release',f'v={asset_version}' in manifest.get('start_url','') and f'v={asset_version}' in manifest.get('id',''))

failed=[c for c in checks if not c['passed']]
print(json.dumps({'passed':not failed,'counts':{'passed':len(checks)-len(failed),'failed':len(failed),'total':len(checks)},'failed':failed},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
