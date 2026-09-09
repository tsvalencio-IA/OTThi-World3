#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ck(name,ok): checks.append((name,bool(ok)))
version=json.loads((ROOT/'VERSION.json').read_text('utf-8'))
ck('versão atual preserva a camada V702',version.get('version',0)>=703)
js=(ROOT/'src/modules/40-world-evolution-v702.js').read_text('utf-8')
css=(ROOT/'src/styles/18-world-evolution-v702.css').read_text('utf-8')
for token in ['professionalTerrainHeightAt','createLakeDepthLayers','player.swimming','createFarmingSystem','createDigSites','createThemedCitizens','cameraPitchUpBtn','OTTHI_WORLD_V702']:
    ck(token,token in js)
for token in ['body.ui-landscape.otthi-v702-world .mini-nav','body.ui-landscape.otthi-v702-world .primary-actions','shop-complete-grid']:
    ck(token,token in css)
shop=(ROOT/'src/modules/21-interactions-shop-social-races.js').read_text('utf-8')
for token in ["name:'Iscas'","name:'Sementes'","tool:'hoe'","tool:'shovel'"]:
    ck('shop '+token,token in shop)
physics=(ROOT/'src/modules/26-input-player-physics.js').read_text('utf-8')
ck('swim physics','player.swimming?' in physics and 'state.stats.swum' in physics)
for pack in ['dirt','sand','farmland','cliff','deep-water','shore','mud']:
    for channel in ['basecolor','normal','roughness','ao','height','emissive']:
        ck(f'{pack}-{channel}',(ROOT/f'assets/world/textures/{pack}-{channel}.png').is_file())
failed=[n for n,o in checks if not o]
print(f'Versão atual / camada V702: {len(checks)-len(failed)}/{len(checks)}')
if failed:
    print('\n'.join('FALHOU: '+x for x in failed));sys.exit(1)
