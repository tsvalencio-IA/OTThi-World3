#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def text(rel): return (ROOT/rel).read_text('utf-8')
def check(name,passed,detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':str(detail)})
    print(('OK' if passed else 'FALHA'),'-',name,detail)
version=json.loads(text('VERSION.json'))
ott=text('src/modules/14a-ottovias-highway-v7054.js')
npc=text('src/modules/13-houses-npcs-vehicles-base.js')
avatar=text('src/modules/34-avatar-studio-professional-v3.js')
vehicles=text('src/modules/36-modular-build-machines.js')
world=text('src/modules/20-world-build-cloud-houses.js')
render=text('src/modules/11-render-materials-player-model.js')
check('Release R10 de fidelidade visual',int(version.get('assetVersion',0))>=70580 and str(version.get('release','')).startswith('705.7-'))
check('Discos verticais gigantes removidos da OTTOVIAS','CylinderGeometry(Number(h.width||12.4)/2+.1' not in ott and 'joint.rotation.x=Math.PI/2' not in ott)
check('Rede OTTOVIAS continua construída','createOttoviasRoadSegment(points[i],points[(i+1)%points.length],i,root,h)' in ott)
check('Pedágios continuam preservados','createOttoviasToll' in ott and 'payOttoviasToll' in ott and 'raiseOttoviasTollGate' in ott)
for theme in ['lego','minecraft','playmobil','mario-world']:
    check(f'Skin do usuário contém {theme}',f"['{theme}'" in avatar)
check('Skin substitui visual-base em vez de sobrepor','hideLegacyAvatarForToySkin' in avatar and 'avatarLayer.visible=false' in avatar)
check('LEGO usa cabeça cilíndrica e stud','toySkinCylinder(headLayer,.43,.74' in avatar and 'toySkinCylinder(headLayer,.14,.09' in avatar)
check('Minecraft usa cabeça e corpo cúbicos','toySkinBox(headLayer,1.02,1.02,1.02' in avatar and "theme==='minecraft'" in avatar)
check('Playmobil usa cabeça arredondada e torso cilíndrico','toySkinSphere(headLayer,.58' in avatar and 'toySkinCylinder(bodyLayer,.48,1.02' in avatar)
check('Mario World usa rosto, boné e bigode dedicados','MARIO_CAP' in avatar and '0x2b1712' in avatar and ('toySkinSphere(headLayer,.11,skin' in avatar or 'toySkinSphere(headLayer,.115,skin' in avatar))
check('NPCs principais distribuem os quatro estilos',all(token in npc for token in ["nino:'lego'","luna:'minecraft'","teo:'playmobil'","bia:'mario-world'"]))
check('Michelle permanece fora da troca automática',"npc.id==='michelle-ottovias'" in npc or "id!=='michelle-ottovias'" in npc)
check('Veículo ativo e estacionado usam o mesmo construtor temático','buildThemedVehicleGeometry(vehicleVisual' in render and 'buildThemedVehicleGeometry(group' in npc and 'applyVehicleAppearance' in npc)
# Catalog themes/categories
catalog=re.search(r"const OTTHI_PLAYER_VEHICLE_CATALOG=Object\.freeze\(\[(.*?)\]\);",vehicles,re.S)
block=catalog.group(1) if catalog else ''
ids=re.findall(r"id:'([^']+)'",block)
check('Catálogo possui pelo menos 16 veículos jogáveis',len(ids)>=16,len(ids))
for theme in ['lego','minecraft','playmobil','mario-world']:
    for category in ['small','moto','utility','truck']:
        check(f'Catálogo {theme} possui {category}',f"theme:'{theme}',category:'{category}'" in block)
check('Garagem cria veículos com tema e categoria',all(token in vehicles for token in ['theme:parts.theme','bodyType:parts.bodyType','kind:parts.kind']))
check('Mundo inicial preserva exatamente dez veículos civis',world.count('createToyCar(')==10,world.count('createToyCar('))
for rel in ['src/modules/11-render-materials-player-model.js','src/modules/13-houses-npcs-vehicles-base.js','src/modules/14a-ottovias-highway-v7054.js','src/modules/20-world-build-cloud-houses.js','src/modules/33-otthi-world-professional-core.js','src/modules/34-avatar-studio-professional-v3.js','src/modules/36-modular-build-machines.js']:
    proc=subprocess.run(['node','--check',str(ROOT/rel)],capture_output=True,text=True)
    check(f'Sintaxe válida: {rel}',proc.returncode==0,(proc.stderr or '').strip())
failed=[c for c in checks if not c['passed']]
report={'passed':not failed,'counts':{'passed':len(checks)-len(failed),'failed':len(failed),'total':len(checks)},'failed':failed}
print(json.dumps(report,ensure_ascii=False,indent=2))
sys.exit(0 if not failed else 1)
