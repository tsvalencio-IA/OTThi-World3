#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
checks = []

def read(relative):
    return (ROOT / relative).read_text('utf-8')

def check(name, condition, detail=''):
    checks.append({'name': name, 'passed': bool(condition), 'detail': str(detail)})
    print(('OK' if condition else 'FALHA'), '-', name, detail)

version = json.loads(read('VERSION.json'))
layout = read('src/modules/05a-world-layout-v704.js')
position = read('src/modules/25-render-init-resize-position-collision.js')
driving = read('src/modules/23-vehicle-effects-driving.js')
vehicles = read('src/modules/13-houses-npcs-vehicles-base.js')
water = read('src/modules/12-world-resources-nature.js')
build = read('src/modules/20-world-build-cloud-houses.js')
metro = read('src/modules/15-transit-bus-metro.js')
tunnel = read('src/modules/14a-ottovias-highway-v7054.js')

check('Release R4+ de integridade mundial', version.get('assetVersion', 0) >= 70574 and str(version.get('release', '')).startswith('705.7-'))
check('Restauração usa os limites reais do mundo', 'const bounds=v704WorldBounds()' in position and 'v704ClampWorldPoint(x,z,margin)' in position)
check('Limite legado de 110 removido', 'Math.abs(x)>110' not in position and 'Math.abs(z)>110' not in position)
check('Entrada no veículo preserva origem segura', 'originValid' in driving and 'player.lastSafeX=player.x' in driving and 'state.position=' in driving)
check('Veículo salvo é limitado ao mundo', 'spawn=v704ClampWorldPoint' in vehicles and 'board=v704ClampWorldPoint' in driving)
check('Represa principal fora da rua', "lake:{id:'lake',name:'Represa principal',x:-88,z:54,w:50,d:22}" in layout)
check('Represa é uma bacia conectada', 'function createReservoirBasin' in water and 'reservoir:true' in water and 'createReservoirBasin(lake,lakeNorth)' in build)
check('Auditoria proíbe água sobre rua', "type:'water-on-road'" in layout)
check('Metrô da represa possui ponto seco dedicado', "metroLake:{x:-45,z:56}" in layout and 'isInsideLakeNavigable(station.x,station.z)' in metro)
check('Túnel visual inadequado não é criado', 'createOttoviasTunnel' not in tunnel and 'OTTHI_OTTOVIAS_TUNNEL' not in tunnel and 'ottoviasTunnel' not in layout)
check('Foto real da Michelle não integra o jogo', 'michelle-profile.png' not in read('app.js') and 'michelle-profile.png' not in read('index.html') and 'michelle-profile.png' not in read('sw.js'))

for relative in [
    'src/modules/05a-world-layout-v704.js',
    'src/modules/12-world-resources-nature.js',
    'src/modules/13-houses-npcs-vehicles-base.js',
    'src/modules/14a-ottovias-highway-v7054.js',
    'src/modules/15-transit-bus-metro.js',
    'src/modules/23-vehicle-effects-driving.js',
    'src/modules/25-render-init-resize-position-collision.js',
]:
    result = subprocess.run(['node', '--check', relative], cwd=ROOT, capture_output=True, text=True)
    check(f'Sintaxe válida: {relative}', result.returncode == 0, result.stderr.strip())

failed = [item for item in checks if not item['passed']]
print(json.dumps({'passed': not failed, 'counts': {'passed': len(checks)-len(failed), 'failed': len(failed), 'total': len(checks)}, 'failed': failed}, ensure_ascii=False, indent=2))
sys.exit(1 if failed else 0)
