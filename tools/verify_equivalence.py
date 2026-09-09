#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import hashlib,json,re,sys
ROOT=Path(__file__).resolve().parents[1]; DOCS=ROOT/'docs'; DOCS.mkdir(exist_ok=True)
BASELINE_PATH=DOCS/'BASELINE-V641-FUNCOES-E-ASSETS.json'
APPROVED_MUTABLE_ASSETS={
    '.nojekyll',
    'firebase-config.js',
    'assets/js/multiplayer-rtdb.js',
    'assets/js/multiplayer/room-manager.js',
    'assets/js/safety/child-safety.js',
    'firebase-database.rules.json',
    'android-app/app/src/main/res/values/strings.xml',
}
# Alterações sensíveis fora da lista mutável só são aceitas quando o conteúdo
# coincide exatamente com uma revisão auditada. Esta revisão do manifesto
# habilita a rotação automática solicitada (`fullSensor`) sem liberar mudanças
# futuras e arbitrárias em permissões ou componentes Android.
APPROVED_MUTABLE_ASSET_HASHES={
    'android-app/app/src/main/AndroidManifest.xml': {
        '325c878dda188d14b23572b4aa605cbd7ec204312cd3e4640fd95ce937a92ef4',
        # R12: remoção de RECORD_AUDIO não utilizado + allowBackup=false; fullSensor preservado.
        '9e7984ba30f3e538f5b25d352f4d868015a98a087b62980190b47cd9bc93eb34',
        # R14: ACCESS_NETWORK_STATE para detectar retorno da internet e consultar atualização do APK.
        '6b6f54bcd3504dfa9ec3449933056092323e0bce209db92ae002ddd50ada2e56',
    },
}

def sha(path:Path): return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
def function_order(text:str): return re.findall(r'^  (?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',text,re.M)

def main():
    baseline=json.loads(BASELINE_PATH.read_text('utf-8'))
    app=(ROOT/'app.js').read_text('utf-8'); all_js='\n'.join(p.read_text('utf-8',errors='ignore') for p in ROOT.rglob('*.js'))
    expected=baseline['functionOrder']; current=function_order(app)
    missing=[x for x in expected if x not in current]
    positions=[current.index(x) for x in expected if x in current]
    order_preserved=not missing and positions==sorted(positions)
    added=[x for x in current if x not in expected]
    required_added=[
        'trafficPriority','busSpawnIndex','createShoreFisher','createShoreFishingLife',
        'updateShoreFishers','mobilityDriverActive','updateMobilityControlLabels',
        'mobilityThrottleIntent','miniMapLogicalSize','miniMapScale','currentMapLocations',
        'roomWorldInfo','roomHouseMarkers','mapHouseLocations','mapRegionsMarkup',
        'clearRemoteRoomEntities','resetMobilityForRoomChange','canChangeRoom',
        'focusCurrentRoom','applyRoomWorld'
    ]
    asset_results=[]
    for rel,expected_sha in baseline['preservedAssetHashes'].items():
        path=ROOT/rel; actual=sha(path)
        approved=rel in APPROVED_MUTABLE_ASSETS or actual in APPROVED_MUTABLE_ASSET_HASHES.get(rel,set())
        unchanged=actual==expected_sha
        asset_results.append({
            'file':rel,'exists':path.exists(),'unchanged':unchanged,'approvedChange':approved,
            'accepted':path.exists() and (unchanged or approved),
            'expectedSha256':expected_sha,'actualSha256':actual
        })
    required_tokens={
      'roupas_e_avatar':['applyAvatarCustomization','openAvatarStudio','uniform'],
      'skills':['setScaleMode','toggleCrouch','spinPlayer'],
      'bombeiros':['createFireTruck','openFireStationDesk','activateFireIncident'],
      'policia':['createPoliceCar','startPoliceAlert','updatePoliceSystem'],
      'ambulancias':['createAmbulance','createTrafficIncident','resolveTrafficIncident'],
      'construcao':['beginBuildMode','placeBuild','reconcileWorldBuilds'],
      'pescaria':['startFishing','updateFishingVisual','restoreFishingCamera','createShoreFishingLife'],
      'transporte':['createBusModel','enterBus','openMetroStation','trafficPriority','busSpawnIndex'],
      'mobilidade_v643':['mobilityThrottleIntent','updateMobilityControlLabels','mobilityAccelerate','mobilityBrake'],
      'multiplayer':['remotePlayerEvent','openSocialHub','updateMultiplayer','applyRoomWorld','clearRemoteRoomEntities'],
      'bairros_v644':['miniMapScale','currentMapLocations','mapRegionsMarkup','roomHouseMarkers','focusCurrentRoom'],
      'educacao':['openEducationHub','runEducationGame','OTTHI_LEARNING'],
    }
    systems={k:{'required':v,'present':[t for t in v if t in all_js],'complete':all(t in all_js for t in v)} for k,v in required_tokens.items()}
    failures=[x for x in asset_results if not x['accepted']]
    approved_changes=[x for x in asset_results if x['approvedChange'] and not x['unchanged']]
    result={
      'baseline':'OTTHI World Edu V641 / fonte modular V642',
      'candidate':'OTTHI World V700 — cinco etapas profissionais sobre a base preservada',
      'functionCountBaseline':len(expected),'functionCountActual':len(current),
      'baselineFunctionsPreserved':not missing,'baselineFunctionOrderPreserved':order_preserved,
      'missingFunctions':missing,'addedFunctions':added,
      'requiredV644FunctionsPresent':all(x in current for x in required_added),
      'requiredV644Functions':required_added,
      'preservedAssetsChecked':len(asset_results),
      'preservedAssetsUnchanged':sum(x['unchanged'] for x in asset_results),
      'approvedMutableAssetChanges':[x['file'] for x in approved_changes],
      'preservedAssetFailures':failures,
      'requiredSystemTokens':systems,
    }
    result['passed']=all([
        result['baselineFunctionsPreserved'],result['baselineFunctionOrderPreserved'],
        result['requiredV644FunctionsPresent'],not failures,all(x['complete'] for x in systems.values())
    ])
    (DOCS/'RELATORIO-PRESERVACAO-V642-V644.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
    md=['# Relatório de preservação — V642 → V644','',f"- Resultado: **{'APROVADO' if result['passed'] else 'REPROVADO'}**",f"- Funções-base preservadas: **{len(expected)-len(missing)} / {len(expected)}**",f"- Funções atuais: **{len(current)}**",f"- Ordem das funções-base preservada: **{'sim' if order_preserved else 'não'}**",f"- Funções V643/V644 esperadas: **{sum(x in current for x in required_added)} / {len(required_added)}**",f"- Assets imutáveis preservados sem alteração: **{result['preservedAssetsUnchanged']} / {result['preservedAssetsChecked']}**",f"- Alterações aprovadas de integração: **{len(approved_changes)}**",'', '## Sistemas obrigatórios','']
    for k,v in systems.items(): md.append(f"- [{'x' if v['complete'] else ' '}] `{k}` — {', '.join(v['present'])}")
    md += ['', '## Alterações de assets aprovadas','']+[f"- `{x['file']}`" for x in approved_changes]
    md += ['', '## Funções adicionadas depois da base','']+[f'- `{x}()`' for x in added]
    if missing: md += ['', '## Funções-base ausentes','']+[f'- `{x}()`' for x in missing]
    (DOCS/'RELATORIO-PRESERVACAO-V642-V644.md').write_text('\n'.join(md)+'\n','utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2)); return 0 if result['passed'] else 1
if __name__=='__main__': sys.exit(main())
