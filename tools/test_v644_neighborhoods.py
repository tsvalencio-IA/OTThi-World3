#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def add(name,passed,detail=''): checks.append({'name':name,'passed':bool(passed),'detail':str(detail)})
def text(rel): return (ROOT/rel).read_text('utf-8')

cfg=text('assets/js/core/runtime-config.js')
manager=text('assets/js/multiplayer/room-manager.js')
rtdb=text('assets/js/multiplayer-rtdb.js')
world=text('src/modules/31-neighborhood-world-controller.js')
nav=text('src/modules/07-navigation-traffic-routes.js')
mapjs=text('src/modules/08-map-parent-settings.js')
css=text('src/styles/13-neighborhood-world-map-v644.css')
rules=json.loads(text('firebase-database.rules.json'))
manifest=json.loads(text('src/module-order.json')); version=json.loads(text('VERSION.json')); asset_version=version.get('assetVersion',version['version']*10); cache=f"?v={asset_version}"
index=text('index.html'); sw=text('sw.js'); app=text('app.js')
room_ids=['bairro-central','bairro-floresta','bairro-lago','bairro-montanha','bairro-escola']
for rid in room_ids: add(f'Bairro configurado {rid}',rid in cfg)
add('Cinco bairros únicos',sum(cfg.count(f"id:'{rid}'") for rid in room_ids)==5)
add('Capacidade 10 em todos',cfg.count('capacity:10')==5,cfg.count('capacity:10'))
add('Limite multiplayer 10','maxPlayersPerRoom: 10' in cfg)
add('Entradas físicas dos bairros',cfg.count('entry:{x:')==5,cfg.count('entry:{x:'))
add('Limites cartográficos dos bairros',cfg.count('bounds:{xMin:')==5,cfg.count('bounds:{xMin:'))
room_pattern=re.compile(r"\{ id:'([^']+)', name:'([^']+)', icon:'([^']+)', capacity:(\d+), entry:\{x:([-\d.]+),z:([-\d.]+),yaw:([-\d.]+)\}, bounds:\{xMin:([-\d.]+),xMax:([-\d.]+),zMin:([-\d.]+),zMax:([-\d.]+)\}")
rooms=[]
for m in room_pattern.finditer(cfg):
    rid,name,icon,cap,ex,ez,yaw,xmin,xmax,zmin,zmax=m.groups()
    rooms.append(dict(id=rid,name=name,capacity=int(cap),entryX=float(ex),entryZ=float(ez),xMin=float(xmin),xMax=float(xmax),zMin=float(zmin),zMax=float(zmax)))
add('Cinco geometrias interpretadas',len(rooms)==5,len(rooms))
for room in rooms:
    add(f"Entrada dentro dos limites {room['id']}",room['xMin']<=room['entryX']<=room['xMax'] and room['zMin']<=room['entryZ']<=room['zMax'],room)
    add(f"Limites dentro do mundo {room['id']}",all(-116<=room[k]<=116 for k in ['xMin','xMax','zMin','zMax']),room)
add('Mapa completo usa os limites dinâmicos do mundo',all(token in mapjs for token in ['const b=v704WorldBounds()','b.maxX-b.minX','b.maxZ-b.minZ','(x-b.minX)/w*100','(b.maxZ-z)/d*100']))
add('Minimapa usa uma escala única X/Z','(x-player.x)*scale' in nav and '(z-player.z)*scale' in nav)
for token in ['fixedRoomSlotKeys','validRoomSlots','roomSlotCount','reserveRoomSlot','watchRoomCounts','refreshRoomCounts','roomCapacity','otthi:room-changing','otthi:room-changed','onDisconnect(reservation.slotRef).remove','runTransaction']:
    add(f'RTDB {token}',token in rtdb)
add('Reserva antes de desconectar',rtdb.index('reserveRoomSlot(next,name)')<rtdb.index("dispatch('otthi:room-changing'"))
add('Rollback para bairro anterior','ROOM_ID=previous' in rtdb and "await connect({name,room:ROOM_ID})" in rtdb)
add('Contadores por sala','roomCountsCache' in rtdb and "dispatch('otthi:room-counts'" in rtdb)
add('Somente dez nomes de slot','slot-${String(index+1).padStart(2' in rtdb and 'Math.min(10' in rtdb)
for token in ['clearRemoteRoomEntities','resetMobilityForRoomChange','applyRoomWorld','focusCurrentRoom','roomHouseMarkers','mapHouseLocations','mapRegionsMarkup']:
    add(f'Controlador {token}',f'function {token}' in world)
add('Troca limpa mundo antes de conectar',"addEventListener('otthi:room-changing'" in world)
add('Transporte para entrada real','safePointNear(room.entry.x,room.entry.z' in world)
add('Estado salva bairro','state.multiplayer.room=room.id' in world)
add('Jogadores antigos removidos','world.ghosts.clear()' in world and 'remotePresence.clear()' in world)
add('Casas antigas removidas','cloudHouses.clear()' in world)
for token in ['miniMapLogicalSize','miniMapScale','OTTHI_ROOM_WORLD?.houseMarkers','room.bounds','room.accent']:
    add(f'Minimapa {token}',token in nav)
for token in ['currentMapLocations','mapRegionsMarkup','mapHouseLocations','mapLocations']:
    add(f'Mapa completo {token}',token in mapjs or token in world)
add('Mapa completo quadrado','aspect-ratio:1/1!important' in css)
add('Mapa retrato responsivo','@media(orientation:portrait)' in css and '42dvh' in css)
add('Mapa paisagem responsivo','@media(orientation:landscape)' in css)
add('Canvas minimapa acompanha caixa','.mini-nav canvas' in css and 'width:100%!important' in css)
slots=rules['rules']['otthosWorld']['rooms']['$roomId'].get('slots',{})
slot_rule=slots.get('$slotId',{})
add('Regras possuem slots fixos',bool(slot_rule))
for n in range(1,11): add(f'Cliente gera slot-{n:02d}','slot-${String(index+1).padStart(2' in rtdb)
add('Regra de vaga não aceita numChildren','numChildren' not in json.dumps(slot_rule))
slot_write=slot_rule.get('.write','')
add('Vaga restringe reserva ao próprio UID',"newData.child('uid').val() === auth.uid" in slot_write and "data.child('uid').val() === auth.uid" in slot_write and 'now - 25000' in slot_write)
add('Reserva ocorre por vaga individual','reserveRoomSlotIndividually(f,{room:next' in rtdb)
add('Reserva não grava o conjunto inteiro',".child('slots')).transaction" not in rtdb)
add('Vaga sem validação bloqueadora','.validate' not in slot_rule)
add('UI mostra ocupação','${count}/${capacity}' in manager)
add('UI bloqueia lotado',"full||switching?'disabled'" in manager and 'Bairro lotado' in manager)
add('UI só seleciona após sucesso',manager.index('if(!result?.ok)')<manager.index('selected=room.id'))
add('Módulo 31 no manifesto',any(x.get('file')=='src/modules/31-neighborhood-world-controller.js' for x in manifest['javascript']))
add('CSS 13 no manifesto',any(x.get('file')=='src/styles/13-neighborhood-world-map-v644.css' for x in manifest['styles']))
add('Versão consolidada no index',index.count(cache)>=10,index.count(cache))
add('Runtime consolidado',f"window.OTTHI_GAME_VERSION = {version['version']};" in app and f"const APP_VERSION = {version['version']};" in app)
add('Service Worker consolidado',f"const CACHE = `otthi-v{asset_version}-${{REVISION}}`" in sw and version['build'] in sw)
report={'version':version['version'],'passed':all(x['passed'] for x in checks),'counts':{'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'total':len(checks)},'checks':checks}
(ROOT/'docs/RELATORIO-TESTE-BAIRROS-V646.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
md=['# Relatório de teste — bairros consolidados V646','',f"- Resultado: **{'APROVADO' if report['passed'] else 'REPROVADO'}**",f"- Aprovados: **{report['counts']['passed']}**",f"- Falhas: **{report['counts']['failed']}**",'', '## Verificações','']+[f"- [{'x' if c['passed'] else ' '}] {c['name']}{' — '+c['detail'] if c['detail'] else ''}" for c in checks]
(ROOT/'docs/RELATORIO-TESTE-BAIRROS-V646.md').write_text('\n'.join(md)+'\n','utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
sys.exit(0 if report['passed'] else 1)
