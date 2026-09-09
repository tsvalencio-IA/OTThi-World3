#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, os, re, shutil, subprocess, sys

if hasattr(sys.stdout,'reconfigure'): sys.stdout.reconfigure(encoding='utf-8',errors='replace')
ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'
NODE=os.environ.get('OTTHI_NODE') or shutil.which('node') or 'node'
PYTHON=sys.executable
checks=[]; errors=[]

def add(name,passed,detail=''):
    item={'name':name,'passed':bool(passed),'detail':str(detail)}; checks.append(item)
    if not passed: errors.append(f'{name}: {detail}')

def run(command,name):
    try:
        result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
        detail=(result.stderr or result.stdout or '').strip()[-3000:]
        add(name,result.returncode==0,detail)
    except Exception as error: add(name,False,error)

def read_json(rel):
    try:
        value=json.loads((ROOT/rel).read_text('utf-8')); add(f'JSON {rel}',True); return value
    except Exception as error: add(f'JSON {rel}',False,error); return {}

class HtmlAudit(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]; self.local=[]
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        if values.get('id'): self.ids.append(values['id'])
        ref=values.get('src') if tag in {'script','img','source'} else values.get('href') if tag=='link' else None
        if ref and ref.startswith('./'): self.local.append(ref.split('?',1)[0].split('#',1)[0][2:])

def body(path,marker):
    value=path.read_text('utf-8')
    if marker not in value: raise ValueError(f'{marker} ausente em {path}')
    return value.split(marker,1)[1].lstrip('\r\n')

def expected_bundles(order):
    js=['(() => {\n']; css=[]
    for item in order.get('javascript',[]):
        p=ROOT/item['file']; content=body(p,'// @otthi-module-body'); digest=hashlib.sha256(content.encode()).hexdigest()
        add(f"Hash-fonte {item['file']}",digest==item.get('sha256Body'),digest)
        js.extend([f'\n  // ===== MODULE: {p.name} =====\n',content])
    js.append('\n})();\n')
    for item in order.get('styles',[]):
        p=ROOT/item['file']; content=body(p,'/* @otthi-style-body */'); digest=hashlib.sha256(content.encode()).hexdigest()
        add(f"Hash-fonte {item['file']}",digest==item.get('sha256Body'),digest)
        css.extend([f'\n/* ===== MODULE: {p.name} ===== */\n',content])
    return ''.join(js),''.join(css).lstrip()

def main():
    required=['index.html','app.js','style.css','sw.js','manifest.webmanifest','release-manifest.json','VERSION.json','firebase-config.js','firebase-database.rules.json','athos.glb','src/module-order.json','assets/world/pbr-manifest.json','tools/build_project.py','tools/test_v701_gm_panel.py','tools/test_v703_recovery.py','tools/test_v7031_startup_order.py','tools/test_v704_world_reconstruction.py','tools/test_v7054_ottovias.py','tools/test_v7055_performance_recovery.py','tools/test_v7056_world_precision.py','tools/test_v7057_r3_ottovias_flow.py','tools/test_v7057_r4_world_integrity.py','tools/test_v7057_r5_vehicle_actions.py','tools/test_v7057_r6_gameplay_integrity.py','tools/test_v7057_r7_player_garage.py','tools/test_v7057_r7_garage_runtime.js','tools/test_v7057_r8_police_roadside_runtime.js','tools/test_v7057_r10_visual_fidelity.py','tools/test_v7057_r11_focus.py','tools/test_r1680_multiplayer_core_v2.py','src/modules/33-otthi-world-professional-core.js','src/modules/34-avatar-studio-professional-v3.js','src/modules/35-world-render-pbr-environment.js','src/modules/36-modular-build-machines.js','src/modules/37-hero-platform-gameplay.js','src/modules/38-otthi-world-integration-bootstrap.js','src/modules/39-gm-admin-panel.js','src/modules/40-world-evolution-v702.js','src/styles/16-otthi-world-professional-v700.css','src/styles/17-gm-admin-panel-v701.css','src/styles/18-world-evolution-v702.css','.github/workflows/build-modular-app.yml','.github/workflows/gerar-apk.yml']
    for rel in required: add(f'Arquivo obrigatório {rel}',(ROOT/rel).is_file())
    version=read_json('VERSION.json'); order=read_json('src/module-order.json'); webmanifest=read_json('manifest.webmanifest'); release=read_json('release-manifest.json'); read_json('firebase-database.rules.json'); read_json('assets/world/pbr-manifest.json')
    js_modules=sorted((ROOT/'src/modules').glob('*.js')); css_modules=sorted((ROOT/'src/styles').glob('*.css'))
    # Stubs de compatibilidade permanecem fisicamente no repositório para permitir
    # atualização manual pelo celular sem exigir exclusão de arquivos antigos.
    # Eles não são módulos ativos, não entram no module-order.json nem no app.js.
    active_js_modules=[p for p in js_modules if 'OTTHI_COMPATIBILITY_STUB' not in p.read_text('utf-8',errors='ignore')]
    add('Módulos JavaScript encontrados',len(active_js_modules)>=45,len(active_js_modules)); add('Módulos CSS encontrados',len(css_modules)>=19,len(css_modules))
    add('Manifesto JS completo',len(order.get('javascript',[]))==len(active_js_modules))
    add('Manifesto CSS completo',len(order.get('styles',[]))==len(css_modules))
    manifest_js=[Path(x['file']).name for x in order.get('javascript',[])]
    add('Manifesto JS corresponde exatamente aos arquivos',len(manifest_js)==len(set(manifest_js)) and set(manifest_js)=={p.name for p in active_js_modules})
    add('Ordem CSS corresponde aos arquivos',[Path(x['file']).name for x in order.get('styles',[])]==[p.name for p in css_modules])
    add('Versão central V705',version.get('version')==705 and str(version.get('build','')).startswith('705.') and order.get('version')==705 and order.get('build')==version.get('build'))

    run([NODE,'--check','app.js'],'Sintaxe app.js'); run([NODE,'--check','sw.js'],'Sintaxe sw.js')
    for path in js_modules: run([NODE,'--check',str(path.relative_to(ROOT))],f'Sintaxe {path.relative_to(ROOT)}')
    for path in sorted((ROOT/'assets/js').rglob('*.js')): run([NODE,'--check',str(path.relative_to(ROOT))],f'Sintaxe {path.relative_to(ROOT)}')

    suites=[
      ([NODE,'tools/test_v643_mobility.js'],'Mobilidade determinística'),
      ([PYTHON,'tools/test_v643_world_systems.py'],'Sistemas do mundo preservados'),
      ([PYTHON,'tools/test_v644_neighborhoods.py'],'Bairros, mapa e salas'),
      ([NODE,'tools/test_v646_runtime.js'],'Slots, PWA e revisão'),
      ([NODE,'tools/test_v6466_permissions_buttons.js'],'Permissões e botões'),
      ([PYTHON,'tools/test_v647_multiplayer_missions.py'],'Multiplayer e missões'),
      ([PYTHON,'tools/test_v646_professional_services.py'],'Serviços profissionais'),
      ([PYTHON,'tools/test_v6462_commercial_polish.py'],'Mapa, móveis e roupas'),
      ([PYTHON,'tools/test_v6463_coop_responsive.py'],'Cooperativo e responsividade'),
      ([PYTHON,'tools/test_v701_gm_panel.py'],'Painel GM V701 preservado'),
      ([PYTHON,'tools/test_v702_world_evolution.py'],'Camada mundial V702 preservada'),
      ([PYTHON,'tools/test_v703_recovery.py'],'Recuperação funcional V703'),
      ([PYTHON,'tools/test_v7031_startup_order.py'],'Ordem de inicialização V703.1'),
      ([PYTHON,'tools/test_v704_world_reconstruction.py'],'Reconstrução mundial V704'),
      ([PYTHON,'tools/test_v705_playable_world.py'],'Esportes, NPCs e kart V705'),
      ([PYTHON,'tools/test_v7054_ottovias.py'],'Rodovia OTTOVIAS V705.4+'),
      ([PYTHON,'tools/test_v7055_performance_recovery.py'],'Desempenho e recuperação V705.5+'),
      ([PYTHON,'tools/test_v7056_world_precision.py'],'Precisão integral do mundo V705.6'),
      ([PYTHON,'tools/test_v7057_r3_ottovias_flow.py'],'Fluxo profissional da OTTOVIAS V705.7 R3'),
      ([PYTHON,'tools/test_v7057_r4_world_integrity.py'],'Integridade mundial V705.7 R4'),
      ([PYTHON,'tools/test_v7057_r5_vehicle_actions.py'],'Ações veiculares e antirreset V705.7 R5'),
      ([PYTHON,'tools/test_v7057_r6_gameplay_integrity.py'],'Integridade da jogabilidade V705.7 R6'),
      ([PYTHON,'tools/test_v7057_r7_player_garage.py'],'Garagem própria e oficina V705.7 R7'),
      ([NODE,'tools/test_v7057_r7_garage_runtime.js'],'Runtime da garagem própria V705.7 R7'),
      ([NODE,'tools/test_v7057_r8_police_roadside_runtime.js'],'Runtime da abordagem policial V705.7 R8'),
      ([PYTHON,'tools/test_v7057_r10_visual_fidelity.py'],'Fidelidade visual solicitada V705.7 R10'),
      ([PYTHON,'tools/test_r14_global_ui_apk_update.py'],'R14: responsividade global, esportes e atualização APK'),
      ([NODE,'tools/test_r14_sports_controls_runtime.js'],'R14: ações esportivas físicas em runtime'),
      ([PYTHON,'tools/test_v7057_r11_focus.py'],'Foco R11: skins, GM e saída dos esportes'),
      ([PYTHON,'tools/test_r1680_multiplayer_core_v2.py'],'R16.8.0: Multiplayer Core V2 completo'),
      ([NODE,'tools/test_v704_world_materialization.js'],'Materialização real do mundo V704'),
      ([NODE,'tools/test_v704_vehicle_runtime.js'],'Dano, quebra, reboque e reparo V704'),
      ([PYTHON,'tools/audit_world_v704.py'],'Auditoria geométrica, rotas e áreas jogáveis V704')]
    for command,name in suites: run(command,name)

    index=(ROOT/'index.html').read_text('utf-8'); app=(ROOT/'app.js').read_text('utf-8'); style=(ROOT/'style.css').read_text('utf-8'); sw=(ROOT/'sw.js').read_text('utf-8')
    asset_version=version.get('assetVersion',version.get('version',0)*10); cache_token=f'?v={asset_version}'
    audit=HtmlAudit(); audit.feed(index)
    duplicates=sorted({x for x in audit.ids if audit.ids.count(x)>1}); missing=sorted(x for x in audit.local if not (ROOT/x).exists())
    add('IDs HTML únicos',not duplicates,duplicates); add('Referências locais existem',not missing,missing)
    add('Cache-busting V705',index.count(cache_token)>=10,index.count(cache_token))
    add('Three.js local',f'./assets/vendor/three-r128.min.js{cache_token}' in index and 'cdnjs.cloudflare.com/ajax/libs/three.js' not in index)
    add('Manifesto PWA V705',webmanifest.get('name')=='OTTHI World' and f'v={asset_version}' in webmanifest.get('start_url',''))
    add('Service Worker V705',f"const CACHE = `otthi-v{asset_version}-${{REVISION}}`" in sw and f"const BUILD = '{version.get('build')}'" in sw and "const VERSION = '705'" in sw)

    expected_app,expected_style=expected_bundles(order)
    add('app.js sincronizado com fontes',app==expected_app); add('style.css sincronizado com fontes',style==expected_style)
    functions=re.findall(r'^  (?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',app,re.M)
    add('Funções preservadas e ampliadas',len(functions)>=800,len(functions))
    bad=[rel for rel,digest in release.get('files',{}).items() if not (ROOT/rel).is_file() or hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()!=digest]
    add('Release V705 coerente',release.get('version')==705 and release.get('build')==version.get('build') and release.get('algorithm')=='SHA-256')
    add('Hashes da release conferem',not bad,bad)
    rev_i=re.search(r'data-otthi-revision="([a-f0-9]{16})"',index); rev_s=re.search(r"const REVISION = '([a-f0-9]{16})';",sw)
    add('Revisão HTML/SW/manifesto coerente',bool(rev_i and rev_s) and release.get('revision')==rev_i.group(1)==rev_s.group(1))
    add('Firebase remoto ainda não declarado aprovado',version.get('validation',{}).get('firebaseRemoteApproved') is False)
    add('Dispositivo físico ainda não declarado aprovado',version.get('validation',{}).get('physicalDeviceApproved') is False)

    report={'version':version.get('version'),'build':version.get('build'),'passed':not errors,'counts':{'checks':len(checks),'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'functionsIncludingAsync':len(functions),'javascriptModules':len(js_modules),'styleModules':len(css_modules),'htmlIds':len(audit.ids)},'checks':checks,'errors':errors,'hashes':{rel:hashlib.sha256((ROOT/rel).read_bytes()).hexdigest() for rel in ['app.js','style.css','src/module-order.json','release-manifest.json','firebase-config.js','firebase-database.rules.json']},'limits':['Não substitui teste em Android físico, Firebase remoto, multiplayer entre dois aparelhos, PWA instalada, AR ou APK assinado.']}
    DOCS.mkdir(exist_ok=True)
    (DOCS/'VALIDACAO-ESTRUTURAL-V704.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
    md=['# Validação estrutural automática — OTTHI World V704','',f"- Resultado: **{'APROVADO' if report['passed'] else 'REPROVADO'}**",f"- Verificações: **{report['counts']['passed']} aprovadas / {report['counts']['failed']} falhas**",f"- Funções incluindo async: **{len(functions)}**",'', '## Verificações','']+[f"- [{'x' if x['passed'] else ' '}] {x['name']}{' — '+x['detail'] if x['detail'] else ''}" for x in checks]+['','## Limites','',*['- '+x for x in report['limits']]]
    (DOCS/'VALIDACAO-ESTRUTURAL-V704.md').write_text('\n'.join(md)+'\n','utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2)); return 0 if report['passed'] else 1

if __name__=='__main__': sys.exit(main())
