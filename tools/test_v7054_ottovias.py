#!/usr/bin/env python3
from pathlib import Path
import json, math, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ck(name,ok,detail=''):
    checks.append({'name':name,'passed':bool(ok),'detail':str(detail)})
    print(('OK' if ok else 'FALHA'),'-',name,detail)
def text(rel): return (ROOT/rel).read_text('utf-8')

version=json.loads(text('VERSION.json'))
order=json.loads(text('src/module-order.json'))
index=text('index.html'); sw=text('sw.js'); manifest=json.loads(text('manifest.webmanifest'))
ott=text('src/modules/14a-ottovias-highway-v7054.js')
world=text('src/modules/20-world-build-cloud-houses.js')
loop=text('src/modules/29-game-loop-controls-gamepad.js')
nav=text('src/modules/07-navigation-traffic-routes.js')
mapjs=text('src/modules/08-map-parent-settings.js')
defaults=text('src/modules/01-build-persistence.js')
persistence=text('src/modules/02-state-save-cloud-account.js')
physics='\n'.join(text(x) for x in ['src/modules/25-render-init-resize-position-collision.js','src/modules/26-input-player-physics.js','src/modules/30-pause-tests-public-api-bootstrap.js'])
app=text('app.js')

node="""const fs=require('fs'),vm=require('vm');const c={window:{},console};vm.createContext(c);vm.runInContext(fs.readFileSync('src/modules/05a-world-layout-v704.js','utf8'),c);const api=c.window.OTTHI_WORLD_LAYOUT_V704;console.log(JSON.stringify({layout:api.layout,audit:api.staticAudit()}));"""
r=subprocess.run(['node','-e',node],cwd=ROOT,text=True,capture_output=True,encoding='utf-8')
if r.returncode:
    print(r.stderr);sys.exit(1)
data=json.loads(r.stdout.strip()); layout=data['layout']; audit=data['audit']

hotfix=str(version.get('hotfix','')); minor=int(hotfix.split('.')[-1]) if hotfix.startswith('705.') and hotfix.split('.')[-1].isdigit() else -1
ck('Release preserva OTTOVIAS V705.4 ou posterior',version.get('version')==705 and minor>=4 and int(version.get('assetVersion',0))>=7054)
files=[x['file'] for x in order['javascript']]
newmod='src/modules/14a-ottovias-highway-v7054.js'
ck('Módulo OTTOVIAS ativo exatamente uma vez',files.count(newmod)==1)
ck('Módulo OTTOVIAS depois da decoração e antes do trânsito pesado',files.index('src/modules/14-world-district-decoration.js')<files.index(newmod)<files.index('src/modules/15-transit-bus-metro.js'))
ck('Auditoria mestre sem conflitos',audit.get('passed') is True,audit.get('problems'))

bounds=layout['bounds']; highways=layout.get('highways',[])
routes={item.get('id'):item for item in highways if str(item.get('id','')).startswith('ottovias')}
ck('Rede OTTOVIAS possui circuito externo, travessia urbana e ligação norte',set(routes)=={'ottovias','ottovias-urban','ottovias-north-connector'},sorted(routes))
h=routes.get('ottovias',{})
urban=routes.get('ottovias-urban',{})
north=routes.get('ottovias-north-connector',{})
ck('Travessia urbana reutiliza a Avenida Central',urban.get('closed') is False and urban.get('usesExistingRoad') is True and len(urban.get('points',[]))>=6,urban)
ck('Ligação norte é rodovia física aberta',north.get('closed') is False and not north.get('usesExistingRoad',False) and len(north.get('points',[]))>=3,north)
pts=h.get('points',[])
ck('OTTOVIAS é circuito fechado',h.get('closed') is True and len(pts)>=25,len(pts))
ck('Rodovia tem pista larga e acostamento',float(h.get('width',0))>=12 and float(h.get('shoulder',0))>=1.5,(h.get('width'),h.get('shoulder')))
ck('Quatro biomas rodoviários existem',{'desert','field','snow','beach'}.issubset({p.get('biome') for p in pts}))
margin=float(h.get('width',0))/2+float(h.get('shoulder',0))
inside=all(bounds['minX']+margin<=p['x']<=bounds['maxX']-margin and bounds['minZ']+margin<=p['z']<=bounds['maxZ']-margin for p in pts)
ck('Toda a pista e acostamento ficam dentro do mundo',inside)
ck('Mundo expandido sem mover o núcleo antigo',bounds=={'minX':-190,'maxX':190,'minZ':-190,'maxZ':190})

# Interseções próprias do circuito, ignorando pares adjacentes e fechamento.
def orient(a,b,c): return (b['x']-a['x'])*(c['z']-a['z'])-(b['z']-a['z'])*(c['x']-a['x'])
def proper_intersect(a,b,c,d):
    o1,o2,o3,o4=orient(a,b,c),orient(a,b,d),orient(c,d,a),orient(c,d,b)
    eps=1e-8
    return ((o1>eps and o2<-eps) or (o1<-eps and o2>eps)) and ((o3>eps and o4<-eps) or (o3<-eps and o4>eps))
intersections=[]; n=len(pts)
for i in range(n):
    a,b=pts[i],pts[(i+1)%n]
    for j in range(i+1,n):
        if j==i or j==(i+1)%n or i==(j+1)%n: continue
        if i==0 and j==n-1: continue
        c,d=pts[j],pts[(j+1)%n]
        if proper_intersect(a,b,c,d): intersections.append((i,j))
ck('Circuito da OTTOVIAS não se cruza',not intersections,intersections)

# Pedágios e conexão ao grafo.
tolls=h.get('tolls',[])
ck('Três praças de pedágio',len(tolls)==3,[x.get('id') for x in tolls])
ck('Todos os pedágios custam 5 moedas',len(tolls)==3 and all(x.get('cost')==5 for x in tolls))
ck('Pedágios estão em segmentos distintos',len({x.get('routeIndex') for x in tolls})==3)
edges={tuple(x) for x in layout.get('edges',[])}
expected={('VS','OV0'),('VN','OVN1'),('OVN1','OV12'),('OV24','OV0')}|{(f'OV{i}',f'OV{i+1}') for i in range(24)}
ck('Rede OTTOVIAS conectada ao sul e ao norte da cidade',expected.issubset(edges),sorted(expected-edges))
for point in ['ottoviasEntry','ottoviasOperations','ottoviasOperationsAccess','ottoviasMichelle','ottoviasTollSouth','ottoviasTollField','ottoviasTollBeach','ottoviasDesert','ottoviasField','ottoviasSnow','ottoviasBeach']:
    ck(f'Ponto mestre presente: {point}',point in layout.get('points',{}))
for zone in ['ottoviasDesert','ottoviasField','ottoviasSnow','ottoviasBeach']:
    ck(f'Zona de bioma presente: {zone}',zone in layout.get('zones',{}))

# Implementação funcional, não apenas geometria.
for token in ['createOttoviasBiomes','createOttoviasHighwayGeometry','createOttoviasToll','payOttoviasToll','openMichelleOttovias','createOttoviasOperations','createOttoviasPatrol','startOttoviasTour','completeOttoviasTour','updateOttoviasHighway']:
    ck(f'Runtime OTTOVIAS: {token}',token in ott)
ck('Michelle é NPC fixo da comunicação',all(x in ott for x in ["createNPC('michelle-ottovias','Michelle'","michelle.ottoviasRole='comunicacao'","michelle.stationary=true","Michelle • Comunicação OTTOVIAS",'styleMichelleOttovias']))
ck('Ronda passa por deserto, campo, neve, praia e central',all(x in ott for x in ["point:'ottoviasDesert'","point:'ottoviasField'","point:'ottoviasSnow'","point:'ottoviasBeach'","point:'ottoviasOperationsAccess'"]))
ck('Cancela realmente bloqueia veículo até liberar',all(x in ott for x in ['gateDistance<5.2)player.car.speed','gateDistance<1.45)player.car.speed=0','toll.openUntil=Date.now()+14000']))
ck('Equipe de inspeção percorre todos os pontos da rodovia',"const route=h.points.map(p=>[p.x,p.z])" in ott)
ck('buildWorld inicializa OTTOVIAS uma vez',world.count('createOttoviasWorld()')==1,world.count('createOttoviasWorld()'))
ck('Game loop atualiza OTTOVIAS uma vez',loop.count('updateOttoviasHighway(dt)')==1,loop.count('updateOttoviasHighway(dt)'))

# GPS / mapa / limites.
ck('Mapa desenha a rodovia completa','function worldHighwaysSvgMarkup' in nav and 'WORLD_LAYOUT_V704.highways' in nav and 'worldHighwaysSvgMarkup()' in mapjs)
ck('Mapa lista Michelle, pedágios e quatro biomas',all(x in nav for x in ['Central OTTOVIAS — Michelle','Praça Sul','Praça Campo','Praça Praia','trecho Deserto','trecho Campo','trecho Neve','trecho Praia']))
ck('Mapa usa limites dinâmicos',all(x in mapjs for x in ['const b=v704WorldBounds()','b.maxX-b.minX','b.maxZ-b.minZ']))
ck('Física usa limites mestres e não clamp antigo', 'v704WorldBounds()' in physics and not re.search(r'clamp\([^\n]{0,90}-116\s*,\s*116',physics))

# Persistência local e nuvem da nova progressão sem remover campos antigos.
ck('Estado padrão inclui OTTOVIAS','ottovias: { passes:0, spent:0' in defaults)
ck('Normalização preserva OTTOVIAS e a ronda','ottovias: { ...fresh.ottovias' in persistence and 'saved.ottovias?.tour' in persistence)
ck('Cloud save envia progresso OTTOVIAS','ottovias:{...(state.ottovias||{}),tour:' in persistence)
ck('Cloud merge recupera progresso OTTOVIAS','...(remote.ottovias||{})' in persistence and 'remote.ottovias?.tour' in persistence)

# Cache e bundle final.
asset_version=int(version.get('assetVersion',7054)); token=f'?v={asset_version}'
ck('Cache da release atual no index',index.count(token)>=10,index.count(token))
ck('Service Worker da release atual',f'otthi-v{asset_version}-${{REVISION}}' in sw and f'./app.js?v={asset_version}' in sw)
ck('Manifesto PWA da release atual',f'v={asset_version}' in manifest.get('start_url',''))
ck('Bundle contém OTTOVIAS','OTTHI_OTTOVIAS' in app and 'createOttoviasWorld' in app and 'Michelle • Comunicação OTTOVIAS' in app)

failed=[x for x in checks if not x['passed']]
print(json.dumps({'passed':not failed,'counts':{'passed':len(checks)-len(failed),'failed':len(failed),'total':len(checks)},'failed':failed},ensure_ascii=False,indent=2))
sys.exit(1 if failed else 0)
