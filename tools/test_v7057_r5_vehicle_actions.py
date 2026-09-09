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
index = read('index.html')
layout = read('src/modules/05a-world-layout-v704.js')
elements = read('src/modules/01-build-persistence.js')
player = read('src/modules/09-responsive-ar-quality-diagnostics.js')
services = read('src/modules/16-emergency-services.js')
driving = read('src/modules/23-vehicle-effects-driving.js')
recovery = read('src/modules/25-render-init-resize-position-collision.js')
physics = read('src/modules/26-input-player-physics.js')
actions = read('src/modules/27-npc-enemies-combat-camera-action.js')
controls = read('src/modules/29-game-loop-controls-gamepad.js')
bootstrap = read('src/modules/30-pause-tests-public-api-bootstrap.js')
ottovias = read('src/modules/14a-ottovias-highway-v7054.js')
css = read('src/styles/19-mobile-landscape-authority-v7051.css')

check('Release R5 ou posterior', version.get('assetVersion', 0) >= 70575 and str(version.get('release', '')).startswith('705.7-'))
check('Jogar e Continuar preservam posição', bootstrap.count('startGame(false)') >= 2 and 'startGame(true)' not in bootstrap)
check('Recuperação automática finita é local', 'const bounded=v704ClampWorldPoint(player.x,player.z,1)' in recovery and 'if(!finite)return recoverPlayerToLastSafe' in recovery)
check('Condução não dispara queda automática', "belowWorld=finite&&!player.swimming&&!player.vehicle&&!player.boating&&!player.transit.mode" in recovery)
check('Botão veicular existe no HTML', 'id="vehicleActionBtn"' in index and 'Ação veicular' in index)
check('Botão veicular registrado', "vehicleActionBtn: $('#vehicleActionBtn')" in elements and 'currentVehicleContext' in player)
check('Botão veicular conectado ao controle', 'press(els.vehicleActionBtn,doVehicleContextAction)' in controls)
check('SAIR é independente e permanente', "if(player.vehicle){exitVehicle();updateContext(true);return;}" in actions and "actionLabel:'Sair'" in actions)
check('Pedágio usa botão contextual separado', 'nearestVehicleContextInteractable' in actions and 'doVehicleContextAction' in actions and 'Use o botão extra' in actions)
check('Layout responsivo do botão extra', '.vehicle-context-action.is-available' in css and 'body.ui-landscape.otthi-v705-world .vehicle-context-action' in css)
check('Carro comum possui Turbo', "label:'Turbo'" in driving and 'player.car.turboUntil=now+2800' in driving and 'maxSpeed=turbo?31:23.5' in physics)
check('Viatura e ambulância possuem Sirene', "kind==='police'||kind==='paramedic'" in driving and 'player.car.sirenActive=!player.car.sirenActive' in driving)
check('Caminhão possui Canhão de Água', "kind==='firefighter'" in driving and 'usePlayerFireTruckWaterCannon' in services)
check('Pedágio mantém somente duas cabines externas', 'for(const bx of[-7.45,7.45])' in ottovias and '[-6.1,-2.05,2.05,6.1]' not in ottovias)
check('Três corredores de pedágio permanecem', 'for(const laneX of[-4.2,0,4.2])' in ottovias)
check('Túnel inadequado integralmente removido', 'createOttoviasTunnel' not in ottovias and 'OTTHI_OTTOVIAS_TUNNEL' not in ottovias and 'ottoviasTunnel' not in layout)
check('Foto real da Michelle não integra o jogo', 'michelle-profile.png' not in read('app.js') and 'michelle-profile.png' not in read('index.html') and 'michelle-profile.png' not in read('sw.js'))

for relative in [
    'src/modules/01-build-persistence.js',
    'src/modules/09-responsive-ar-quality-diagnostics.js',
    'src/modules/14a-ottovias-highway-v7054.js',
    'src/modules/16-emergency-services.js',
    'src/modules/23-vehicle-effects-driving.js',
    'src/modules/25-render-init-resize-position-collision.js',
    'src/modules/26-input-player-physics.js',
    'src/modules/27-npc-enemies-combat-camera-action.js',
    'src/modules/29-game-loop-controls-gamepad.js',
    'src/modules/30-pause-tests-public-api-bootstrap.js',
]:
    result = subprocess.run(['node', '--check', relative], cwd=ROOT, capture_output=True, text=True)
    check(f'Sintaxe válida: {relative}', result.returncode == 0, result.stderr.strip())

failed = [item for item in checks if not item['passed']]
print(json.dumps({'passed': not failed, 'counts': {'passed': len(checks)-len(failed), 'failed': len(failed), 'total': len(checks)}, 'failed': failed}, ensure_ascii=False, indent=2))
sys.exit(1 if failed else 0)
