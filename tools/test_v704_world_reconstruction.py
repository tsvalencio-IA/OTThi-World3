#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def add(name,ok,detail=''): checks.append({'name':name,'passed':bool(ok),'detail':str(detail)})
def text(p): return (ROOT/p).read_text('utf-8')
version=json.loads(text('VERSION.json')); manifest=json.loads(text('src/module-order.json'))
layout=text('src/modules/05a-world-layout-v704.js'); sports=text('src/modules/13a-sports-kart-v705.js'); damage=text('src/modules/36a-vehicle-damage-repair-v704.js'); build=text('src/modules/24-construction-system.js'); world=text('src/modules/20-world-build-cloud-houses.js'); base=text('src/modules/13-houses-npcs-vehicles-base.js'); rtdb=text('assets/js/multiplayer-rtdb.js'); loop=text('src/modules/29-game-loop-controls-gamepad.js'); coop=text('src/modules/32-cooperative-missions.js'); district=text('src/modules/14-world-district-decoration.js')
add('Versão V705 sincronizada',version.get('version')==705 and manifest.get('version')==705 and version.get('build')==manifest.get('build'))
order=[x['file'] for x in manifest['javascript']]
for f in ['src/modules/05a-world-layout-v704.js','src/modules/13a-sports-kart-v705.js','src/modules/32-cooperative-missions.js','src/modules/36a-vehicle-damage-repair-v704.js']:
 add(f'Módulo presente: {f}',f in order)
add('Missões cooperativas antes do render/bootstrap',order.index('src/modules/32-cooperative-missions.js')<order.index('src/modules/25-render-init-resize-position-collision.js'))
node="""const fs=require('fs'),vm=require('vm');const c={window:{},console};vm.createContext(c);vm.runInContext(fs.readFileSync('src/modules/05a-world-layout-v704.js','utf8'),c);console.log(JSON.stringify(c.window.OTTHI_WORLD_LAYOUT_V704.staticAudit()));"""
r=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True)
audit=json.loads(r.stdout.strip()) if r.returncode==0 else {'passed':False,'problems':[r.stderr]}
add('Auditoria geométrica mestre sem conflitos',audit.get('passed') is True,audit.get('problems'))
for token in ['v704RuntimeWorldAudit','house-on-road','collider-in-protected-area','vehicle-on-road','destination-inaccessible','duplicate-world-system']:
 add(f'Auditoria materializada: {token}',token in layout)
add('Ginásio legado não cria segunda geometria',"return typeof createSportsComplexV704==='function'?createSportsComplexV704():world.gym" in base)
add('Mundo cria um único complexo esportivo',world.count('createSportsComplexV704()')==1,world.count('createSportsComplexV704()'))
add('Mundo cria um único kartódromo',world.count('createKartCircuitV704()')==1,world.count('createKartCircuitV704()'))
for token in ['startFootballV704','footballKickV704','updateFootballV704','v705UpdateScoreboard','startCourtV704','courtHitV704','v705CourtPoint','startKartRaceV704','updateKartRaceV704','Fora da pista']:
 add(f'Esporte jogável: {token}',token in sports)
add('Esportes atualizados no game loop','updateWorldSportsV704(dt)' in loop)
add('Bots cooperativos usam a pista oval real','rx=23.7+Number(bot.coopRaceLane||0)*.9' in coop and 'rz=12.4+Number(bot.coopRaceLane||0)*.45' in coop)
add('Anel aleatório de prédios invasores removido','118+Math.random' not in world and 'antigo anel aleatório de prédios foi removido' in world)
bounds_match=re.search(r"bounds:Object\.freeze\(\{minX:(-?\d+(?:\.\d+)?),maxX:(-?\d+(?:\.\d+)?),minZ:(-?\d+(?:\.\d+)?),maxZ:(-?\d+(?:\.\d+)?)\}\)",layout)
skyline_groups=re.findall(r"(\[\[.*?\]\])\.forEach\(v=>createBackdropBuilding",district,re.S)
skyline_z=[]
for group in skyline_groups:
 try:
  skyline_z.extend(float(item[1]) for item in __import__('ast').literal_eval(group))
 except Exception:
  pass
skyline_outside=bool(bounds_match and skyline_z) and all(z<float(bounds_match.group(3)) or z>float(bounds_match.group(4)) for z in skyline_z)
add('Skyline decorativo fora da área jogável','Skyline deslocado para fora dos novos limites da OTTOVIAS' in district and skyline_outside,skyline_z)
for token in ['vehicleDurabilityV704','vehicleBrokenV704','vehiclePerformanceV704','applyVehicleImpactDamageV704','repairVehicleV704','towVehicleToWorkshopV704','openBrokenVehicleOptionsV704','lastImpactAt<420']:
 add(f'Veículo: {token}',token in damage)
add('Veículo quebrado é imobilizado',all(x in damage for x in ['player.car.speed=0','player.vx=0','player.vz=0','não pode continuar']))
for token in ['migrateLegacyWorldBuildsV704','legacyPositionV704','v704NearestConstructionSlot','buildConflictsWithMasterWorldV704']:
 add(f'Migração de construções: {token}',token in build)
add('Login não depende da reserva de sala',"connect({name:publicName}).catch(()=>false);return{ok:true" in rtdb)
add('Save protegido não exige connected',"if(!api||!db)return{ok:false,error:'Serviço de conta indisponível'}" in rtdb)
add('Bundle contém V704','WORLD_LAYOUT_V704' in text('app.js') and 'vehicleBrokenV704' in text('app.js'))
failed=[c for c in checks if not c['passed']]
print(json.dumps({'version':705,'passed':not failed,'counts':{'passed':len(checks)-len(failed),'failed':len(failed),'total':len(checks)},'checks':checks},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
