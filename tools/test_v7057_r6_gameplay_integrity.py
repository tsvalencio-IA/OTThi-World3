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


def function_block(source, name, next_name):
    start = source.find(f'function {name}')
    end = source.find(f'function {next_name}', start + 1)
    return source[start:end if end >= 0 else None]


version = json.loads(read('VERSION.json'))
police = read('src/modules/16-emergency-services.js')
rooms = read('src/modules/31-neighborhood-world-controller.js')
recovery = read('src/modules/25-render-init-resize-position-collision.js')
houses = read('src/modules/20-world-build-cloud-houses.js')
map_source = read('src/modules/08-map-parent-settings.js')
quality = read('src/modules/09-responsive-ar-quality-diagnostics.js')
ottovias = read('src/modules/14a-ottovias-highway-v7054.js')
css = read('src/styles/19-mobile-landscape-authority-v7051.css')
finish = function_block(police, 'finishSafetyStop', 'openSafetyLesson')

check('Release R6 ou posterior de integridade da jogabilidade', version.get('assetVersion', 0) >= 70576 and str(version.get('release', '')).startswith('705.7-'))
check('Abordagem não expulsa o jogador do veículo', 'exitVehicle' not in finish)
check('Abordagem não altera coordenadas do jogador', 'player.x=' not in finish and 'player.z=' not in finish and '68' not in finish and '-12.2' not in finish)
check('Policial sai fisicamente da viatura e se aproxima', all(token in police for token in ['roadsideDoorPivot', 'setPoliceRoadsideDoor', 'animatePoliceOfficerExit', 'officer.inside', 'officer.outside', 'exitProgress', "phase='officer-exiting'", "phase='approaching'", 'updatePoliceRoadsideStop']))
check('Policial conversa antes de registrar a multa', all(token in police for token in ["phase='officer-speaking'", 'roadsidePoliceSpeech', 'officerSpeech', '👮 Policial:', "phase='ticket-writing'"]))
check('Multa termina com liberação para seguir viagem', 'Seguir viagem' in police and 'você pode seguir viagem' in police and 'applyTollEvasionFine' in finish)
check('Reentrada na mesma sala não teleporta', 'const actualChange=' in rooms and 'teleport:actualChange' in rooms)
check('Teleporte de sala exige mudança real', "shouldTeleport=options.teleport!==false&&(changed||options.forceTeleport===true)" in rooms)
check('Posição salva fora da borda é limitada localmente', "if(!insideWorld){const bounded=v704ClampWorldPoint(x,z,margin)" in recovery)
check('Casa explícita usa a entrada real', "worldLayoutPoint('spawn',{x:-18,z:39})" in recovery)
check('Varredura de recuperação é espaçada no celular', 'player.nextRecoveryScanAt' in recovery and 'perf?.mobile?280:180' in recovery)
check('Casa principal independe da nuvem compartilhada', "if(h.id==='home')" in houses and 'state.houses.home=' in houses)
check('Porta da casa principal sempre oferece entrada', "if(house.id==='home')" in houses and 'data-enter-home' in houses)
check('Residências disponíveis podem ser visitadas', 'data-visit-house' in houses and "enterHouse(house)" in houses)
check('Mapa possui zoom de 100% a 280%', 'mapViewState' in map_source and 'data-map-zoom-in' in map_source and '2.8' in map_source)
check('Mapa possui pinça, arraste e roda', "addEventListener('pointermove'" in map_source and "mode:'pinch'" in map_source and "addEventListener('wheel'" in map_source)
check('Minha casa permanece identificada no mapa', 'data-map-my-home' in map_source and 'MINHA CASA' in map_source and '.map-marker.clean.my-home' in css)
check('Qualidade automática móvel bloqueia tier alto salvo', "mobile&&saved==='high'" in quality and 'resolvedStableAutoTier()' in quality)
check('FPS móvel baixo reduz rápido para econômica', "perf.lowSamples>=(perf.mobile?1:2)" in quality and "perf.sessionTier=perf.mobile?'low'" in quality)
check('Troca de tier não reativa todos os contornos', 'for(const line of world.outlines)' not in function_block(quality, 'lockStableSceneVisibility', 'freezeWorldFrustumCulling') and 'updateManagedOutlineVisibility()' in function_block(quality, 'lockStableSceneVisibility', 'freezeWorldFrustumCulling'))
check('Tráfego OTTOVIAS reutiliza decisão de velocidade', 'vehicle.nextTrafficDecisionAt' in ottovias and 'vehicle.cachedSpeedFactor' in ottovias)
check('Pedestres distantes da passarela deixam de animar', 'animateBridge' in ottovias and 'if(!animateBridge)continue' in ottovias)

for relative in [
    'src/modules/08-map-parent-settings.js',
    'src/modules/09-responsive-ar-quality-diagnostics.js',
    'src/modules/14a-ottovias-highway-v7054.js',
    'src/modules/16-emergency-services.js',
    'src/modules/20-world-build-cloud-houses.js',
    'src/modules/25-render-init-resize-position-collision.js',
    'src/modules/30-pause-tests-public-api-bootstrap.js',
    'src/modules/31-neighborhood-world-controller.js',
]:
    result = subprocess.run(['node', '--check', relative], cwd=ROOT, capture_output=True, text=True)
    check(f'Sintaxe válida: {relative}', result.returncode == 0, result.stderr.strip())

failed = [item for item in checks if not item['passed']]
print(json.dumps({'passed': not failed, 'counts': {'passed': len(checks) - len(failed), 'failed': len(failed), 'total': len(checks)}, 'failed': failed}, ensure_ascii=False, indent=2))
sys.exit(1 if failed else 0)
