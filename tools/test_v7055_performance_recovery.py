#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,math
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ck(name,ok,detail=''):
    checks.append((name,bool(ok),str(detail)))
def text(rel): return (ROOT/rel).read_text('utf-8')
layout=text('src/modules/05a-world-layout-v704.js')
recovery=text('src/modules/25-render-init-resize-position-collision.js')
ott=text('src/modules/14a-ottovias-highway-v7054.js')
loop=text('src/modules/29-game-loop-controls-gamepad.js')
mapjs=text('src/modules/07-navigation-traffic-routes.js')
ver=json.loads(text('VERSION.json'))
ck('Recuperação usa limites dinâmicos',"bounds=typeof v704WorldBounds==='function'?v704WorldBounds()" in recovery and 'Math.abs(player.x)>130' not in recovery)
ck('Colisão local nunca cai em recuperação distante','safePointNear(player.x,player.z' in recovery and 'Math.hypot(local.x-player.x,local.z-player.z)<=1.45' in recovery and 'player.invalidSince=0;return false;' in recovery and 'const bounded=v704ClampWorldPoint(player.x,player.z,1)' in recovery)
ck('Estado OTTOVIAS não é recriado a cada frame','state.ottovias={passes:0' not in ott and 'const now=Date.now(),data=state.ottovias||ensureOttoviasState()' in ott)
ck('Segmentos OTTOVIAS são cacheados','function ottoviasSegments()' in ott and 'OTTOVIAS_RUNTIME.cachedSegments' in ott and 'v704HighwaySegments().filter' not in ott)
ck('Rodovia possui culling por distância','function updateOttoviasVisibility' in ott and 'item.group.visible=item.usesExistingRoad||nearest.distance<range' in ott and 'updateOttoviasVisibility();' in ott)
ck('Biomas podem ser ocultados por distância','OTTOVIAS_RUNTIME.biomeGroups' in ott and 'item.group.visible=Math.hypot' in ott)
ck('Patches de bioma não são superfícies críticas globais','function ottoviasFlatPatch' in ott and 'stableBox(w,.045,d' not in ott)
ck('Contador de uso não recria objeto por frame','const usage=state.usage||(state.usage=' in loop and 'state.usage={totalSeconds:0,sessionSeconds:0,sessionStartedAt:0,lastPlayedAt:0,sessionLockedAt:0,...(state.usage||{})};\n    state.usage.totalSeconds' not in loop)
perf_src=text('src/modules/09-responsive-ar-quality-diagnostics.js')
ck('Superfícies críticas usam culling por distância','function updateCriticalSurfaceDistanceVisibility' in perf_src and 'perf.criticalHidden=hidden' in perf_src)
ck('NPCs/recursos distantes são ocultados sem remover conteúdo','function updateDynamicEntityVisibility' in perf_src and 'world.npcs||[]' in perf_src and 'world.resources||[]' in perf_src)
ck('DPR móvel foi reduzido no modo automático','if(tier===\'low\') return mobile?.62:.95;' in perf_src and 'return mobile?.72:1.08;' in perf_src)
ck('Proteção de FPS móvel reage antes do travamento severo','lowRecommendationFps=perf.mobile?34:28' in perf_src and 'lowProtectionFps=perf.mobile?31:26' in perf_src)
# Michelle/central access
m=re.search(r"ottoviasOperations:\{x:([\-\d.]+),z:([\-\d.]+)\},ottoviasOperationsAccess:\{x:([\-\d.]+),z:([\-\d.]+)\},ottoviasMichelle:\{x:([\-\d.]+),z:([\-\d.]+)\}",layout)
ck('Pontos da Central/Michelle encontrados',bool(m))
if m:
    ox,oz,ax,az,mx,mz=map(float,m.groups())
    # prédio 13 x 7.2 => frente em oz+3.6. margem 1.4m para jogador
    ck('Michelle fica fora do collider do prédio',mz>oz+3.6+1.4,f'frente={oz+3.6:.1f}, Michelle={mz:.1f}')
    ck('Acesso fica fora do collider do prédio',az>oz+3.6+1.4,f'frente={oz+3.6:.1f}, acesso={az:.1f}')
    ck('Acesso fica perto da Michelle',math.hypot(ax-mx,az-mz)<=3.4,math.hypot(ax-mx,az-mz))
ck('Mapa aponta para acesso, não para dentro do prédio',"...mapPointV704('ottoviasOperationsAccess')" in mapjs)
ck('Final da ronda aponta para acesso seguro',"point:'ottoviasOperationsAccess'" in ott)
# highway geometry & culling range sanity
pts=[(float(x),float(z)) for x,z,b in re.findall(r"\{x:([-\d.]+),z:([-\d.]+),biome:'([^']+)'\}",layout)][:25]
def dist_seg(p,a,b):
    x,z=p; ax,az=a; bx,bz=b; dx=bx-ax; dz=bz-az; den=dx*dx+dz*dz or 1; t=max(0,min(1,((x-ax)*dx+(z-az)*dz)/den)); return math.hypot(x-(ax+dx*t),z-(az+dz*t))
if len(pts)==25:
    max_visible=0
    for p in pts:
        visible=sum(dist_seg(p,pts[i],pts[(i+1)%25])<90 for i in range(25)); max_visible=max(max_visible,visible)
    ck('Culling equilibrado limita segmentos simultâneos',max_visible<=9,max_visible)
else: ck('25 pontos da OTTOVIAS preservados',False,len(pts))
minor=int(str(ver.get('hotfix','0.0')).split('.')[-1]) if str(ver.get('hotfix','')).startswith('705.') else -1
ck('Release V705.5 ou posterior',minor>=5 and int(ver.get('assetVersion',0))>=7055)
failed=[x for x in checks if not x[1]]
for name,ok,detail in checks: print(('OK' if ok else 'FALHA'),'-',name,detail)
print(f'RESULTADO: {len(checks)-len(failed)}/{len(checks)}')
sys.exit(1 if failed else 0)
