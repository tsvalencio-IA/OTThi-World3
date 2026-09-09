#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
NODE=r"""
const fs=require('fs'),vm=require('vm');
const c={window:{},console};vm.createContext(c);
for(const f of ['src/modules/05a-world-layout-v704.js','src/modules/14-world-district-decoration.js']){
 const source=fs.readFileSync(f,'utf8').split(/\/\/ @otthi-module-body\r?\n/,2)[1];
 vm.runInContext(source,c,{filename:f});
}
const api=c.window.OTTHI_WORLD_LAYOUT_V704,layout=api.layout,routes=c.window.OTTHI_BUS_ROUTES_V704||[];
const routeProblems=[];
for(const route of routes){
 for(let i=0;i<route.points.length;i++){
  const a=route.points[i],b=route.points[(i+1)%route.points.length],dist=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(dist/1.5));
  for(let s=0;s<=steps;s++){
   const t=s/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   if(!api.roadAt(x,z,2.2,true)){routeProblems.push({type:'bus-route-off-road',route:route.id,segment:i,x:+x.toFixed(2),z:+z.toFixed(2)});break;}
  }
 }
}
const staticAudit=api.staticAudit();
const structures=layout.structures.map(s=>api.structure(s.id));
const sports=['stadium','football-field','volley','footvolley'],kart=['kart-circuit','kart-boxes'];
const protectedConflicts=[];
function overlap(a,b,m=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+m&&Math.abs(a.z-b.z)<(a.d+b.d)/2+m;}
for(const areaId of [...sports,...kart]){
 const area=api.structure(areaId); if(!area)continue;
 for(const item of structures){
  if(item.id===areaId||item.inside===areaId||area.inside===item.id||['stadium|football-field','football-field|stadium','kart-circuit|kart-boxes','kart-boxes|kart-circuit'].includes(`${areaId}|${item.id}`))continue;
  if(overlap(area,item,.1))protectedConflicts.push({type:'object-in-play-area',area:areaId,object:item.id});
 }
}
const result={version:704,passed:staticAudit.passed&&routeProblems.length===0&&protectedConflicts.length===0,staticAudit,routeAudit:{routes:routes.length,segments:routes.reduce((n,r)=>n+r.points.length,0),problems:routeProblems},playAreaAudit:{areas:[...sports,...kart],problems:protectedConflicts},counts:{roads:layout.roads.length,zones:Object.keys(layout.zones).length,structures:layout.structures.length,paths:layout.paths.length,busRoutes:routes.length}};
console.log(JSON.stringify(result));
"""
r=subprocess.run(['node','-e',NODE],cwd=ROOT,text=True,capture_output=True)
if r.returncode:
 print(r.stderr,file=sys.stderr);sys.exit(r.returncode)
result=json.loads(r.stdout)
out=ROOT/'docs'/'AUDITORIA-LAYOUT-V704.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
(ROOT/'AUDITORIA-LAYOUT-V704.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2));sys.exit(0 if result['passed'] else 1)
