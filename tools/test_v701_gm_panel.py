#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import hashlib, json, re, sys

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'
checks=[]

def add(name,passed,detail=''):
    checks.append({'name':name,'passed':bool(passed),'detail':str(detail)})

def text(rel): return (ROOT/rel).read_text('utf-8')
def sha(rel): return hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()
def ordered_subsequence(expected,current):
    it=iter(current)
    return all(any(value==wanted for value in it) for wanted in expected)

version=json.loads(text('VERSION.json'))
order=json.loads(text('src/module-order.json'))
release=json.loads(text('release-manifest.json'))
assets=json.loads(text('assets/world/pbr-manifest.json'))
rules=json.loads(text('firebase-database.rules.json'))
app=text('app.js'); style=text('style.css'); index=text('index.html'); sw=text('sw.js')
rtdb=text('assets/js/multiplayer-rtdb.js')
gm=text('src/modules/39-gm-admin-panel.js')
state=text('src/modules/02-state-save-cloud-account.js')
defaults=text('src/modules/01-build-persistence.js')
source='\n'.join(text(f'src/modules/{name}') for name in [
    '33-otthi-world-professional-core.js','34-avatar-studio-professional-v3.js',
    '35-world-render-pbr-environment.js','36-modular-build-machines.js',
    '37-hero-platform-gameplay.js','38-otthi-world-integration-bootstrap.js'])

add('Painel GM V701 preservado na versão atual',version.get('version',0)>=701 and order.get('version')==version.get('version') and order.get('build')==version.get('build'))
add('Nome do repositório preservado',version.get('name')=='OTTHI World' and "const repo = 'OTTHI-World'" in text('assets/js/core/runtime-config.js'))
add('Módulos JavaScript preservados e ampliados',len(order.get('javascript',[]))>=41,len(order.get('javascript',[])))
add('Módulos CSS preservados e ampliados',len(order.get('styles',[]))>=18,len(order.get('styles',[])))
add('Painel GM permanece no build',any(x.get('file')=='src/modules/39-gm-admin-panel.js' for x in order['javascript']))
add('CSS GM permanece no build',any(x.get('file')=='src/styles/17-gm-admin-panel-v701.css' for x in order['styles']))

baseline=json.loads(text('docs/BASELINE-V6466-VISUAL-FOUNDATION.json'))
functions=re.findall(r'^  (?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',app,re.M)
base=baseline['orderedFunctions']
coop_source=text('src/modules/32-cooperative-missions.js')
coop_functions=set(re.findall(r'^  (?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',coop_source,re.M))
base_without_relocated_coop=[name for name in base if name not in coop_functions]
functions_without_relocated_coop=[name for name in functions if name not in coop_functions]
add('Funções-base fora do módulo cooperativo permanecem na ordem relativa',ordered_subsequence(base_without_relocated_coop,functions_without_relocated_coop),f'{len(base_without_relocated_coop)} base / {len(functions_without_relocated_coop)} atuais')
add('Módulo cooperativo foi somente realocado antes do render',all(name in functions for name in coop_functions) and app.find('// ===== MODULE: 32-cooperative-missions.js =====')<app.find('// ===== MODULE: 25-render-init-resize-position-collision.js ====='),len(coop_functions))
add('Nenhuma função-base foi removida',set(base).issubset(functions),sorted(set(base)-set(functions))[:10])
add('Funções ampliadas',len(functions)>=820,len(functions))

critical={
 'firebase-config.js':'72d2fc80efc82b6df856c5b43fd9cc37990cf3fe6ea27c4d90060b4c960e56fd',
 'assets/vendor/three-r128.min.js':'9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2',
 'athos.glb':'98c8acdbd7e4160eeb34347a3706041b50fa12d2875a03d852e3b218b7959cdb'}
for rel,expected in critical.items(): add(f'Arquivo crítico preservado: {rel}',sha(rel)==expected,sha(rel))
add('Mesmo Realtime Database e mesma raiz',"firebaseRoot: 'otthosWorld'" in text('assets/js/core/runtime-config.js') and "ROOT=window.OTTHI_CONFIG?.firebaseRoot||'otthosWorld'" in rtdb)
add('Save V700 preservado sem reset',"const STORAGE_KEY = 'otthos_life_world_roleplay_v700'" in app and "'otthos_life_world_roleplay_v646'" in app)
add('Three.js r128 local preservado',f"./assets/vendor/three-r128.min.js?v={version.get('assetVersion',version.get('version')*10)}" in index and 'cdnjs.cloudflare.com/ajax/libs/three.js' not in index)

packs=assets.get('packs',{})
channels={'baseColor','normal','roughness','ao','height','emissive'}
add('Ao menos 26 pacotes PBR locais',len(packs)>=26,len(packs))
add('Todos os pacotes PBR completos',all(channels.issubset(data.keys()) and all((ROOT/path.removeprefix('./')).is_file() for path in data.values()) for data in packs.values()))
stage_tokens={
 'Etapa 1 — fundação':['OTTHI_WORLD_STAGES','applyPbrPack','otthiWorldDiagnostics','openOtthiWorldCenter'],
 'Etapa 2 — avatar':['OTTHI_WORLD_AVATAR_CATALOG','applyWorldAvatarV3','openAvatarStudioWorld','procedural-fallback'],
 'Etapa 3 — render':['createOtthiWorldProfessionalLayer','createWorldInstancedDetails','updateOtthiWorldEnvironment','upgradeCoreMaterialsToWorldPbr'],
 'Etapa 4 — máquinas':['OTTHI_WORLD_VEHICLE_CATALOG','openWorldModularGarage','applyWorldVehicleModulesToGroup','garageRack'],
 'Etapa 5 — aventura':['OTTHI_WORLD_HERO_POWERS','createWorldHeroAdventure','startWorldHeroChallenge','activateWorldHeroPower']}
for name,tokens in stage_tokens.items(): add(name,all(token in source or token in app for token in tokens),[x for x in tokens if x not in source and x not in app])
add('Identidade OTTHI preservada com quatro famílias visuais solicitadas',version.get('name')=='OTTHI World' and all(token in source.lower() for token in ['minecraft','lego','playmobil','mario']) and 'OTTHI_WORLD_AVATAR_CATALOG' in source and 'OTTHI_PLAYER_VEHICLE_CATALOG' in source)

# GM UI and access
add('Assinatura possui gatilho isolado','id="gmSignature"' in index and 'Powered by thIAguinho Soluções Digitais' in index)
add('Cinco toques consecutivos exigidos','gmTapTimes.length>=5' in gm and 'GM_TAP_WINDOW_MS=2600' in gm)
add('Código *177 exigido sem ser autorização única','String.fromCharCode(42,49,55,55)' in gm and 'isCurrentUserGM' in gm)
add('Conta GM precisa estar vinculada','account.anonymous' in gm and 'Minha conta' in gm)
add('Painel lista, pesquisa e seleciona usuários',all(token in gm for token in ['gmListUsers','data-gm-search','data-gm-users','gmSelectUser']))
add('Painel exibe perfil, dinheiro e inventário',all(token in gm for token in ['profile.coins','profile.xp','profile.level','profile.reputation','progress.inventory']))
add('Interface oferece apenas adições positivas','gmPositiveInt' in gm and 'min="0"' in gm and 'Os valores serão somente adicionados.' in gm and 'Diminuir' not in gm)
add('Aplicação soma sem substituir saldos','state.profile.coins=Math.max(0,Number(state.profile.coins||0))+grant.coins' in gm and 'state.inventory[key]=Math.max(0,Number(state.inventory[key]||0))+amount' in gm)
add('Limite de segurança por concessão','GM_MAX_ADD=1000000' in gm and 'GM_MAX_ADD=1000000' in rtdb)

# GM backend, rules, idempotency and recovery
api_tokens=['isCurrentUserGM','gmListUsers','gmReadUser','gmCreateGrant','gmListAudit','claimGMGrant','completeGMGrant']
add('API GM completa no RTDB',all(token in rtdb for token in api_tokens),[x for x in api_tokens if x not in rtdb])
add('Concessão e auditoria são gravadas juntas',"updates[`gmGrants/${targetUid}/${grantId}`]=record" in rtdb and "updates[`gmAudit/${grantId}`]=record" in rtdb)
add('Usuários recebem concessões online ou na próxima conexão','onChildAdded(refs.gmGrants,emitGMGrant' in rtdb and "dispatch('otthi:gm-grant'" in rtdb)
add('Ledger GM é salvo localmente e na nuvem','gm: { appliedGrantIds: [], lastGrantAt: 0 }' in defaults and 'gm:{appliedGrantIds:' in state and 'remote.gm?.appliedGrantIds' in state)
add('Concessão é idempotente','appliedGrantIds.includes(grant.grantId)' in gm and 'claimGMGrant' in gm and 'completeGMGrant' in gm)
add('Login aguarda recuperação antes de aplicar concessão','__OTTHI_ACCOUNT_RECOVERING' in state and 'gmWaitForStableAccountState' in gm and 'otthi:account-state-ready' in state)
add('Recibo só conclui após persistência','const persisted=localSaved!==false&&progressSaved!==false&&accountSaved!==false' in gm and 'persisted?await backend?.completeGMGrant' in gm)

root_rules=rules['rules']['otthosWorld']
add('Admins não podem ser criados pelo cliente',root_rules['admins']['$uid']['.write'] is False)
add('Somente UID GM lê todos os usuários',"admins" in root_rules['users']['.read'] and "auth.uid" in root_rules['users']['.read'])
grant_rule=root_rules['gmGrants']['$uid']['$grantId']
add('Somente GM cria concessão imutável',"admins" in grant_rule['.write'] and '!data.exists()' in grant_rule['.write'])
add('Itens negativos e zero são recusados',"newData.val() > 0" in grant_rule['items']['$itemKey']['.validate'])
add('Moedas negativas são recusadas',"newData.child('coins').val() >= 0" in grant_rule['.validate'])
receipt_rule=root_rules['gmGrantReceipts']['$uid']['$grantId']['.write']
add('Recibo exige concessão real e dono correto',"gmGrants" in receipt_rule and 'auth.uid === $uid' in receipt_rule)
add('Recibo aplicado não pode ser reaberto',"data.child('state').val() !== 'applied'" in receipt_rule)
add('Auditoria é imutável e exclusiva do GM','!data.exists()' in root_rules['gmAudit']['$grantId']['.write'] and 'admins' in root_rules['gmAudit']['$grantId']['.write'])

asset_version=version.get('assetVersion',version.get('version')*10); cache_token=f"?v={asset_version}"
add('Index versionado na release atual',index.count(cache_token)>=10,index.count(cache_token))
add('Service Worker na release atual',f"const CACHE = `otthi-v{asset_version}-${{REVISION}}`" in sw and f"const BUILD = '{version.get('build')}';" in sw)
add('Manifesto PWA preservado',json.loads(text('manifest.webmanifest')).get('name')=='OTTHI World' and cache_token in json.loads(text('manifest.webmanifest')).get('start_url',''))
gradle=text('android-app/app/build.gradle')
add('Android na release atual',f"versionCode {version.get('androidVersionCode')}" in gradle and f"versionName \"{version.get('androidVersionName')}\"" in gradle)
add('Aprovação física permanece pendente',version.get('validation',{}).get('physicalDeviceApproved') is False)
add('Firebase remoto permanece pendente',version.get('validation',{}).get('firebaseRemoteApproved') is False)

bad=[]
for rel,expected in release.get('files',{}).items():
    path=ROOT/rel
    if not path.is_file() or sha(rel)!=expected: bad.append(rel)
add('Manifesto de release coerente',release.get('version')==version.get('version') and release.get('build')==version.get('build') and release.get('algorithm')=='SHA-256')
add('Hashes de release conferem',not bad,bad)
rev_html=re.search(r'data-otthi-revision="([a-f0-9]{16})"',index)
rev_sw=re.search(r"const REVISION = '([a-f0-9]{16})';",sw)
add('Revisão PWA coerente',bool(rev_html and rev_sw) and release.get('revision')==rev_html.group(1)==rev_sw.group(1))

failed=[x for x in checks if not x['passed']]
report={'version':version.get('version'),'build':version.get('build'),'passed':not failed,'counts':{'checks':len(checks),'passed':len(checks)-len(failed),'failed':len(failed),'functionsIncludingAsync':len(functions),'pbrPacks':len(packs)},'checks':checks,'limits':['Validação estática e local não substitui Android físico, publicação das regras no Firebase remoto, multiplayer entre aparelhos, PWA instalada, AR ou APK assinado.']}
DOCS.mkdir(exist_ok=True)
(DOCS/'VALIDACAO-PAINEL-GM-PRESERVADO-V702.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
md=['# Validação OTTHI World V702 — painel GM V701 preservado','',f"- Resultado: **{'APROVADO' if report['passed'] else 'REPROVADO'}**",f"- Verificações: **{report['counts']['passed']} aprovadas / {report['counts']['failed']} falhas**",f"- Funções incluindo async: **{len(functions)}**",'', '## Verificações','']+[f"- [{'x' if c['passed'] else ' '}] {c['name']}{' — '+c['detail'] if c['detail'] else ''}" for c in checks]+['','## Limites','',*['- '+x for x in report['limits']]]
(DOCS/'VALIDACAO-PAINEL-GM-PRESERVADO-V702.md').write_text('\n'.join(md)+'\n','utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
sys.exit(0 if report['passed'] else 1)
