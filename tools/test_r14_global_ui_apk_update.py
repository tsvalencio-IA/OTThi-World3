#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def text(rel): return (ROOT/rel).read_text('utf-8')
def ck(name,ok,detail=''):
    checks.append((name,bool(ok),str(detail)))
    print(('OK' if ok else 'FALHA'),'-',name,detail)

v=json.loads(text('VERSION.json')); order=json.loads(text('src/module-order.json'))
style=text('style.css'); responsive=text('src/styles/20-global-readability-responsive-r14.css'); floor=text('src/styles/19z-global-microtype-floor-r14.css')
sports=text('src/modules/13a-sports-kart-v705.js'); physics=text('src/modules/26-input-player-physics.js'); ui=text('src/modules/08-map-parent-settings.js')
main=text('android-app/app/src/main/java/br/com/thiaguinhosolucoes/otthos/MainActivity.java'); manifest=text('android-app/app/src/main/AndroidManifest.xml'); gradle=text('android-app/app/build.gradle'); workflow=text('.github/workflows/gerar-apk.yml')
index=text('index.html'); sw=text('sw.js'); webmanifest=text('manifest.webmanifest')

ck('R14 é camada final de CSS',order['styles'][-2]['file'].endswith('19z-global-microtype-floor-r14.css') and order['styles'][-1]['file'].endswith('20-global-readability-responsive-r14.css'))
ck('Piso de microtipografia auditou centenas de regras',floor.count('font-size:11px!important')>=200,floor.count('font-size:11px!important'))
ck('Card/modal possui contraste explícito','.modal-card{' in responsive and 'color:#f8fbff!important' in responsive and 'background:linear-gradient' in responsive)
ck('Botão dinâmico de modal não usa fundo branco nativo','.modal-body button{color:#fff!important;background-color:#153e5a' in responsive)
ck('button-grid do futebol tem estilo explícito','.modal-body .button-grid{' in responsive and '.modal-body .button-grid>button' in responsive)
ck('Botões do modal têm área de toque mínima','--otthi-touch-min:44px' in responsive and 'min-height:var(--otthi-touch-min)!important' in responsive)
ck('Modal respeita viewport real','100dvh' in responsive and 'overflow-y:auto!important' in responsive)
ck('Retrato estreito coberto','@media(max-width:520px)' in responsive and '.modal-body .button-grid{grid-template-columns:1fr!important}' in responsive)
ck('Paisagem baixa coberta','@media(orientation:landscape) and (max-height:560px)' in responsive)
ck('Nenhum dock esportivo sobreposto','.sport-action-dock' not in style and '.sport-action-btn' not in style)

for label in ['Correr','Tocar','Chutar','Carrinho','Bloquear','Levantar','Sacar/Receber','Cortar','Cabecear','Erguer']:
    ck(f'Controle esportivo {label}',label in sports)
ck('Carrinho possui impulso persistente','sportTackleUntil' in sports and 'sportTackleVx' in sports and 'sportTackleUntil' in physics)
ck('Carrinho possui animação visível',"v705PlayerSportAnimation('tackle'" in sports and "emoteType==='sport-tackle'" in physics)
ck('Chute possui animação e feedback',"v705PlayerSportAnimation('kick'" in sports and "toast('Chute!'" in sports and "emoteType==='sport-kick'" in physics)
ck('Ação esportiva é consumida antes da ação genérica',"if(SPORTS_V705.football){footballKickV704();return true;}" in sports)
ck('Lobby Trilha adaptativa está ligado',"learningPathBtn.onclick" in ui and 'OTTHI_LEARNING?.open' in ui)
ck('Lobby Bairros online está ligado',"neighborhoodBtn.onclick=openMultiplayerConfig" in ui)

asset=str(v.get('assetVersion'))
ck('Cache web foi incrementado',int(asset)>=70591 and index.count(f'?v={asset}')>=10 and f'otthi-v{asset}-' in sw and f'?v={asset}' in webmanifest)
ck('Android versionCode é incremental',v.get('androidVersionCode')>=70591 and f"versionCode {v.get('androidVersionCode')}" in gradle)
ck('APK exibe V704 R14',str(v.get('apkDisplayVersion','')).startswith('V704') and f'versionName "{v.get("androidVersionName")}"' in gradle)
ck('APK monitora retorno da internet','ACCESS_NETWORK_STATE' in manifest and 'registerDefaultNetworkCallback' in main and 'onAvailable(Network network)' in main)
ck('APK consulta GitHub Release sem cache','api.github.com/repos/tsvalencio-IA/OTTHI-World/releases/latest' in main and 'Cache-Control' in main and 'setUseCaches(false)' in main)
ck('APK compara versionCode da release','tag.startsWith("apk-")' in main and 'remoteVersionCode <= BuildConfig.VERSION_CODE' in main)
ck('APK mostra solicitação de atualização','showUpdateDialog' in main and 'R.string.update_now' in main and 'R.string.update_later' in main)
ck('URL de atualização usa asset oficial validado','browser_download_url' in main and 'OTTHI-WORLD.apk' in main and 'RELEASE_DOWNLOAD_PREFIX' in main)
ck('Workflow usa assinatura permanente',all(x in workflow for x in ['OTTHI_ANDROID_KEYSTORE_B64','OTTHI_ANDROID_KEYSTORE_PASSWORD','OTTHI_ANDROID_KEY_ALIAS','OTTHI_ANDROID_KEY_PASSWORD']))
ck('Workflow não volta a debug','assembleRelease' in workflow and 'assembleDebug' not in workflow and 'app-release.apk' in workflow)
ck('Workflow verifica assinatura','apksigner" verify --verbose --print-certs' in workflow)
ck('Workflow publica asset estável','gh release create' in workflow and 'apk-pronto/OTTHI-WORLD.apk' in workflow and '--latest' in workflow)
ck('Build central sincronizado',v.get('build')==order.get('build') and v.get('build') in index and v.get('build') in sw)

failed=[name for name,ok,_ in checks if not ok]
print(f'RESULTADO R14: {len(checks)-len(failed)}/{len(checks)}')
if failed: print('FALHAS:',failed)
sys.exit(1 if failed else 0)
