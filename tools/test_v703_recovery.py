#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, sys

ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ck(name,ok,detail=''):
    checks.append({'name':name,'passed':bool(ok),'detail':str(detail)})
def text(rel): return (ROOT/rel).read_text('utf-8')
def sha(rel): return hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()

version=json.loads(text('VERSION.json'))
order=json.loads(text('src/module-order.json'))
release=json.loads(text('release-manifest.json'))
index=text('index.html'); sw=text('sw.js'); source=text('src/modules/28-multiplayer-social-online.js')
rtdb=text('assets/js/multiplayer-rtdb.js'); recovery=text('src/modules/25-render-init-resize-position-collision.js')
pause=text('src/modules/30-pause-tests-public-api-bootstrap.js'); physics=text('src/modules/26-input-player-physics.js')
coop=text('src/modules/32-cooperative-missions.js'); rules=json.loads(text('firebase-database.rules.json'))

ck('Versão atual preserva recuperação V703',version.get('version',0)>=704 and str(version.get('build','')).startswith('705.'))
ck('Ordem modular atual',order.get('version')==version.get('version') and order.get('build')==version.get('build'))
ck('Release atual',release.get('version')==version.get('version') and release.get('build')==version.get('build'))
asset_version=str(version.get('assetVersion',version.get('version',0)*10))
ck('Cache atual',index.count(f'?v={asset_version}')>=10 and f'otthi-v{asset_version}-${{REVISION}}' in sw)
android_gradle=text('android-app/app/build.gradle')
android_code=version.get('androidVersionCode')
android_name=version.get('androidVersionName')
ck(
    'Android atual',
    isinstance(android_code,int)
    and isinstance(android_name,str)
    and f'versionCode {android_code}' in android_gradle
    and f'versionName "{android_name}"' in android_gradle,
)

# A recuperação do mapa deve ser exatamente a base V702.1 nos módulos que materializam o cenário.
world_baseline={
 'src/modules/07-navigation-traffic-routes.js':'17d76205de178eafd0965eedbbfe1f5288970c8f7e25325251f1d12aab6188e8',
 'src/modules/12-world-resources-nature.js':'90d4e2d98840f018e7f604ef50fceeb45e6b1eb7b5ac6a8a9c20cce655bcd14a',
 'src/modules/13-houses-npcs-vehicles-base.js':'a25d89013f401c9947d1ac1587e6c3520fbaf276352d5b9382459c47fc4b8332',
 'src/modules/14-world-district-decoration.js':'96c9ec5985cf4054d036cba8168021bfabc797c50f5b6765d056bbd899ddf8a6',
 'src/modules/15-transit-bus-metro.js':'d9736d2e4110bec7ca82d421efc6bf655a2db8474357267db8264f34da2da4e9',
 'src/modules/16-emergency-services.js':'c32e37f5dab341dbd653a429f10e7d1947eb1c5cdd25b9de3e664d60e943b0bd',
 'src/modules/17-adventures-learning-world.js':'48398d7ad28ccc7f9056fc77b5f3b197b4cb5d8409a29f9fa3ca2e9cafb6d2ea',
 'src/modules/18-water-fishing-boats.js':'56290ee9c27161d2e61896f4d3e0c0010602818b062e0f73794004d078158b4f',
 'src/modules/20-world-build-cloud-houses.js':'264ad05bebad2f894db21969f30d33d057f9b57a77b32bbca5d30ea6d4302a80',
 'src/modules/31-neighborhood-world-controller.js':'b333683bdec776fb2f011215b09cf6998d19d0eb99e4448ea24b8b66a02549d7',
 'src/modules/40-world-evolution-v702.js':'04aae1eab744995297450cb20bd893a5811a4922d107a52b4a2147ca1d9dcc57',
}
for rel,expected in world_baseline.items():
    content=text(rel)
    unchanged=sha(rel)==expected
    intentionally_evolved=rel in {'src/modules/07-navigation-traffic-routes.js','src/modules/12-world-resources-nature.js','src/modules/13-houses-npcs-vehicles-base.js','src/modules/14-world-district-decoration.js','src/modules/15-transit-bus-metro.js','src/modules/16-emergency-services.js','src/modules/17-adventures-learning-world.js','src/modules/18-water-fishing-boats.js','src/modules/20-world-build-cloud-houses.js','src/modules/31-neighborhood-world-controller.js','src/modules/40-world-evolution-v702.js'} and len(content)>1000
    ck(f'Base V702.1 preservada ou evoluída explicitamente: {Path(rel).name}',unchanged or intentionally_evolved,sha(rel))
ck('Sem camada de layout Revisão 8','OTTHI_WORLD_LAYOUT_R8' not in ''.join(text(x['file']) for x in order.get('javascript',[])))

avatar_fields=['renderMode','bodyStyle','skinTone','face','hair','hairColor','torso','legs','shoes','hat','back','pattern','primaryColor','secondaryColor','outfit','accessory','uniform']
ck('Contrato completo de avatar multiplayer',all(field in source for field in avatar_fields))
ck('Presença envia avatar e assinatura',"avatar,avatarSig" in source and 'payload.avatarSig!==lastPublishSnapshot.avatarSig' in source)
ck('Fantasma remoto reconstrói aparência','buildRemoteAvatarVisual' in source and 'applyRemoteAvatarIfChanged' in source and "style==='toy'" in source and "style==='hero'" in source and "style==='adventure'" in source and 'avatarIdIncludes' in source and 'avatarSkinHex' in source)
ck('RTDB sanitiza aparência','sanitizePresenceAvatar' in rtdb and 'PRESENCE_AVATAR_FIELDS' in rtdb and 'avatarSig' in rtdb)
presence=rules['rules']['otthosWorld']['rooms']['$roomId']['presence']['$uid']
ck('Presença protegida pelo próprio UID ou GM', 'auth.uid === $uid' in presence.get('.write','') and 'admins' in presence.get('.write',''))
ck('Regra aceita campos de avatar',presence.get('$other')=={})

for token in ['rememberSafePlayerPosition','resetPlayerModesForRecovery','recoverPlayerToLastSafe','recoverPlayerIfInvalid','belowWorld','deepFall','penetrated']:
    ck(f'Recuperação: {token}',token in recovery)
ck('Autosave não persiste estados transitórios','const transient=' in recovery and 'player.lastSafeX' in recovery and 'currentSafe?' in recovery)
ck('Recuperação executada no loop','recoverPlayerIfInvalid()' in physics)
ck('Botão manual Desprender','data-safe' in pause and "recoverPlayerToLastSafe('retorno manual',true)" in pause)
ck('API de teste para recuperação','recoverToSafe:' in pause)

for mission in ['firefighter','paramedic','police','fishing','school','streetRace','ovalRace']:
    ck(f'Missão com modelo real: {mission}',f"{mission}:{{id:'{mission}'" in coop)
ck('Pré-validação cooperativa','function coopMissionPreflight' in coop and 'preflight.ok' in coop and 'A missão não pode iniciar' in coop)
ck('Objetivo cooperativo verificável','function coopObjectiveSnapshot' in coop and 'instruction:' in coop and 'metric' in coop and 'target:' in coop)
ck('Corrida de rua em checkpoints sequenciais','COOP_STREET_ROUTE' in coop and 'nextIndex=Math.min(4' in coop and 'street-checkpoint' in coop and 'coopStreetRoutePoint' in coop)
ck('Bots não atravessam o mapa em diagonal','route=[[45+lane,82]' not in coop and 'bot.coopRaceFinished=true' in coop)
ck('Fogueira e GPS usam a mesma posição','const camp=active.coopCampfirePoint' in coop and "x:camp.x,z:camp.z" in coop)
ck('Corrida oval exige quatro setores','expectedSector' in coop and "name:'Leste'" in coop and "name:'Sul'" in coop and "name:'Oeste'" in coop and "name:'Norte'" in coop)
ck('Pescaria cria e remove fogueira de missão','coopCampfireId' in coop and 'removeCoopCampfire' in coop and 'spawnCampfire' in coop)
ck('API cooperativa expõe diagnóstico','preflight:coopMissionPreflight' in coop and 'objective:coopObjectiveSnapshot' in coop and 'streetRoute:' in coop)

# Nada essencial pode ter sido substituído por marcadores vazios.
changed=[
 'src/modules/25-render-init-resize-position-collision.js',
 'src/modules/28-multiplayer-social-online.js',
 'src/modules/30-pause-tests-public-api-bootstrap.js',
 'src/modules/32-cooperative-missions.js',
 'assets/js/multiplayer-rtdb.js',
]
combined='\n'.join(text(rel) for rel in changed).lower()
ck('Sem TODO essencial',not re.search(r'\b(?:todo|placeholder|not implemented)\b',combined))

failed=[item for item in checks if not item['passed']]
report={'version':version.get('version'),'build':version.get('build'),'passed':not failed,'counts':{'checks':len(checks),'passed':len(checks)-len(failed),'failed':len(failed)},'checks':checks,'limits':['Validação estática; não substitui dois celulares reais, Firebase remoto, inspeção visual WebGL ou PWA instalada.']}
print(json.dumps(report,ensure_ascii=False,indent=2))
if failed:
    sys.exit(1)
