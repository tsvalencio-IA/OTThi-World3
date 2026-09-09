#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,struct
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def add(name,passed,detail=''):checks.append({'name':name,'passed':bool(passed),'detail':detail})
def text(rel):return (ROOT/rel).read_text('utf-8')
nav=text('src/modules/07-navigation-traffic-routes.js'); buses=text('src/modules/15-transit-bus-metro.js'); routes=text('src/modules/14-world-district-decoration.js'); emergency=text('src/modules/16-emergency-services.js'); fish=text('src/modules/18-water-fishing-boats.js'); life=text('src/modules/19-campfire-hunting-house-extensions.js'); npc=text('src/modules/27-npc-enemies-combat-camera-action.js'); css=text('src/styles/11-mobility-traffic-fishing-v643.css')
# Pesca viva
fisher_ids=re.findall(r"\['shore-fisher-[^']+'",fish)
add('Cinco pescadores de margem',len(fisher_ids)==5,str(len(fisher_ids)))
for token in ['createShoreFisher','createShoreFishingLife','updateShoreFishers','fishingActivity','bobber','line.geometry.attributes.position.needsUpdate']:
 add(f'Pesca viva: {token}',token in fish or token in npc)
add('Pesca viva criada na expansão do lago','createShoreFishingLife()' in life)
# Textura PNG
png=ROOT/'assets/textures/water-ripples-v643.png'
valid=False;dims=None
if png.exists():
 data=png.read_bytes()
 if data[:8]==b'\x89PNG\r\n\x1a\n' and len(data)>=24:
  dims=struct.unpack('>II',data[16:24]);valid=dims[0]>=128 and dims[1]>=128
add('Textura de água PNG válida',valid,str(dims))
foundation=text('src/modules/00a-visual-foundation-avatar-v2.js')
render=text('src/modules/11-render-materials-player-model.js')
add('Textura de água usada no material','water-ripples-v643.png' in foundation and 'OTTHI_VISUAL_ASSETS.textures.water' in render)
# Ônibus e trânsito
route_copies={m.group(1):int(m.group(2)) for m in re.finditer(r"id:'([^']+)'.*?copies:(\d+)",routes)}
add('Frota inicial limitada',sum(route_copies.values())<=7,str(route_copies))
add('Circular da Cidade com uma unidade',route_copies.get('circular')==1,str(route_copies.get('circular')))
for token in ['trafficPriority','trafficSpeedFactor','captureTrafficPositions','resolveTrafficOverlaps','trafficHoldUntil']:
 add(f'Trânsito: {token}',token in nav)
for token in ['busSpawnIndex','buildBusRoadPath','recoverBusRoute','validateBusCoverage','laneOffset']:
 add(f'Ônibus: {token}',token in buses or token in routes)
add('Serviços de emergência respeitam retenção',emergency.count('trafficHoldUntil')>=3,str(emergency.count('trafficHoldUntil')))
add('NPCs/veículos respeitam retenção','trafficHoldUntil' in npc)
# Interface de mobilidade
for token in ['mode-mobility-driver #runBtn','mode-mobility-driver #jumpBtn','orientation:portrait','orientation:landscape','mode-passenger']:
 add(f'CSS mobilidade: {token}',token in css)
# Preservação profissional
all_js='\n'.join(p.read_text('utf-8',errors='ignore') for p in (ROOT/'src/modules').glob('*.js'))
for system,tokens in {'bombeiros':['createFireTruck','activateFireIncident'],'policia':['createPoliceCar','startPoliceAlert'],'ambulancia':['createAmbulance','resolveTrafficIncident'],'roupas':['applyAvatarCustomization','JOB_UNIFORMS'],'skills':['setScaleMode','toggleCrouch','spinPlayer']}.items():
 add(f'Preservação: {system}',all(t in all_js for t in tokens),','.join(tokens))
report={'version':643,'passed':all(x['passed'] for x in checks),'counts':{'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'total':len(checks)},'checks':checks}
out=ROOT/'docs/RELATORIO-TESTE-MUNDO-V643.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(0 if report['passed'] else 1)
