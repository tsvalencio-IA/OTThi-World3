#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import csv, json, re, hashlib, bisect

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
MANIFEST = json.loads((ROOT/'src/module-order.json').read_text('utf-8'))

records=[]
for item in MANIFEST['javascript']:
    path=ROOT/item['file']
    text=path.read_text('utf-8').split('// @otthi-module-body',1)[1].lstrip('\r\n')
    for original_line,line in enumerate(text.splitlines(), item['startLine']):
        records.append({'line':original_line,'text':line,'module':Path(item['file']).name,'description':item['description']})
records.sort(key=lambda r:r['line'])
source='\n'.join(r['text'] for r in records)+'\n'
line_starts=[0]
for m in re.finditer('\n',source): line_starts.append(m.end())
first_line=records[0]['line']

def pos_to_index(pos:int)->int:
    return bisect.bisect_right(line_starts,pos)-1

def pos_to_line(pos:int)->int:
    return first_line+pos_to_index(pos)

def record_for_pos(pos:int):
    return records[pos_to_index(pos)]

def module_for_line(line:int):
    for item in MANIFEST['javascript']:
        if item['startLine']<=line<=item['endLine']:
            return Path(item['file']).name,item['description']
    return '', ''

# Top-level named declarations. Function boundaries use the next top-level function declaration.
func_matches=list(re.finditer(r'^  function\s+([A-Za-z_$][\w$]*)\s*\(',source,re.M))
functions=[]
for idx,m in enumerate(func_matches):
    name=m.group(1)
    next_pos=func_matches[idx+1].start() if idx+1<len(func_matches) else len(source)
    start_line=pos_to_line(m.start())
    end_line=max(start_line,pos_to_line(max(m.start(),next_pos-1)))
    module,desc=module_for_line(start_line)
    body=source[m.start():next_pos]
    functions.append({'function':name,'module':module,'description':desc,'startLine':start_line,'endBoundaryLine':end_line,'startPos':m.start(),'endPos':next_pos,'body':body})
known={f['function'] for f in functions}
func_to_module={f['function']:f['module'] for f in functions}
logic_patterns={
    'if':re.compile(r'\bif\s*\('),'else':re.compile(r'\belse\b'),'switch':re.compile(r'\bswitch\s*\('),
    'case':re.compile(r'\bcase\b'),'for':re.compile(r'\bfor\s*\('),'while':re.compile(r'\bwhile\s*\('),
    'catch':re.compile(r'\bcatch\b'),'return':re.compile(r'\breturn\b'),'throw':re.compile(r'\bthrow\b')
}
call_pattern=re.compile(r'(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(')
for f in functions:
    calls=[x for x in call_pattern.findall(f['body']) if x in known and x!=f['function']]
    f['calls']=sorted(set(calls));f['callOccurrences']=len(calls);f['bodyBoundarySha256']=hashlib.sha256(f['body'].encode()).hexdigest()
    for k,p in logic_patterns.items():f[k]=len(list(p.finditer(f['body'])))
    f['ternaryTokensApprox']=f['body'].count('?')

fields=['function','module','description','startLine','endBoundaryLine','bodyBoundarySha256','callOccurrences','if','else','switch','case','for','while','catch','return','throw','ternaryTokensApprox','calls']
with (DOCS/'INVENTARIO-FUNCOES-DETALHADO.csv').open('w',newline='',encoding='utf-8-sig') as fh:
    w=csv.DictWriter(fh,fieldnames=fields);w.writeheader()
    for f in functions:
        row={k:f[k] for k in fields};row['calls']=' | '.join(f['calls']);w.writerow(row)
(DOCS/'INVENTARIO-FUNCOES-DETALHADO.json').write_text(json.dumps([{k:v for k,v in f.items() if k not in ('body','startPos','endPos')} for f in functions],ensure_ascii=False,indent=2)+'\n','utf-8')

# Find owner by nearest top-level function boundary.
starts=[f['startPos'] for f in functions]
def owner_for_pos(pos:int):
    i=bisect.bisect_right(starts,pos)-1
    return functions[i]['function'] if i>=0 and pos<functions[i]['endPos'] else ''

condition_rows=[]
for kind,pattern in logic_patterns.items():
    for occurrence,m in enumerate(pattern.finditer(source),1):
        rec=record_for_pos(m.start());line_start=source.rfind('\n',0,m.start())+1
        condition_rows.append({'type':kind,'occurrence':occurrence,'module':rec['module'],'functionBoundaryOwner':owner_for_pos(m.start()),'line':rec['line'],'column':m.start()-line_start+1,'snippet':rec['text'].strip()[:1000]})
condition_rows.sort(key=lambda x:(x['line'],x['column'],x['type']))
with (DOCS/'INVENTARIO-CONDICOES-DETALHADO.csv').open('w',newline='',encoding='utf-8-sig') as fh:
    fields2=['type','occurrence','module','functionBoundaryOwner','line','column','snippet'];w=csv.DictWriter(fh,fieldnames=fields2);w.writeheader();w.writerows(condition_rows)

arrow_rows=[]
for occurrence,m in enumerate(re.finditer(r'=>',source),1):
    rec=record_for_pos(m.start());line_start=source.rfind('\n',0,m.start())+1
    arrow_rows.append({'occurrence':occurrence,'module':rec['module'],'functionBoundaryOwner':owner_for_pos(m.start()),'line':rec['line'],'column':m.start()-line_start+1,'snippet':rec['text'].strip()[:1000]})
with (DOCS/'INVENTARIO-ARROW-CALLBACKS.csv').open('w',newline='',encoding='utf-8-sig') as fh:
    fields3=['occurrence','module','functionBoundaryOwner','line','column','snippet'];w=csv.DictWriter(fh,fieldnames=fields3);w.writeheader();w.writerows(arrow_rows)

event_patterns=[('addEventListener',re.compile(r'addEventListener\s*\(')),('onclick',re.compile(r'\.onclick\s*=')),('onchange',re.compile(r'\.onchange\s*=')),('oninput',re.compile(r'\.oninput\s*=')),('pointer-property',re.compile(r'\.onpointer(?:down|up|move|cancel)\s*='))]
event_rows=[]
for kind,pattern in event_patterns:
    for m in pattern.finditer(source):
        rec=record_for_pos(m.start());line_start=source.rfind('\n',0,m.start())+1
        event_rows.append({'type':kind,'module':rec['module'],'functionBoundaryOwner':owner_for_pos(m.start()),'line':rec['line'],'column':m.start()-line_start+1,'snippet':rec['text'].strip()[:1000]})
event_rows.sort(key=lambda x:(x['line'],x['column']))
with (DOCS/'INVENTARIO-EVENTOS-DETALHADO.csv').open('w',newline='',encoding='utf-8-sig') as fh:
    fields4=['type','module','functionBoundaryOwner','line','column','snippet'];w=csv.DictWriter(fh,fieldnames=fields4);w.writeheader();w.writerows(event_rows)

# Dependency graph.
deps={}
for f in functions:
    all_calls=[x for x in call_pattern.findall(f['body']) if x in known and x!=f['function']]
    for called in set(all_calls):
        target=func_to_module.get(called,'')
        if not target or target==f['module']:continue
        key=(f['module'],target)
        e=deps.setdefault(key,{'sourceModule':f['module'],'targetModule':target,'callerFunctions':set(),'calledFunctions':set(),'edgeOccurrences':0})
        e['callerFunctions'].add(f['function']);e['calledFunctions'].add(called);e['edgeOccurrences']+=all_calls.count(called)
dep_rows=[]
for e in deps.values():
    dep_rows.append({'sourceModule':e['sourceModule'],'targetModule':e['targetModule'],'edgeOccurrences':e['edgeOccurrences'],'callerFunctions':' | '.join(sorted(e['callerFunctions'])),'calledFunctions':' | '.join(sorted(e['calledFunctions']))})
dep_rows.sort(key=lambda x:(x['sourceModule'],x['targetModule']))
with (DOCS/'DEPENDENCIAS-MODULOS.csv').open('w',newline='',encoding='utf-8-sig') as fh:
    fields5=['sourceModule','targetModule','edgeOccurrences','callerFunctions','calledFunctions'];w=csv.DictWriter(fh,fieldnames=fields5);w.writeheader();w.writerows(dep_rows)

# Top-level declarations and callable arrows.
top_rows=[];callable_rows=[]
for rec in records:
    m=re.match(r'^  (const|let|var)\s+(.+)',rec['text'])
    if m:
        top_rows.append({'kind':m.group(1),'module':rec['module'],'line':rec['line'],'declaration':m.group(2)[:1200]})
        am=re.match(r'^  (?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=.*=>',rec['text'])
        if am:callable_rows.append({'type':'top-level-arrow','name':am.group(1),'module':rec['module'],'line':rec['line'],'snippet':rec['text'].strip()[:1200]})
for f in functions:callable_rows.append({'type':'function-declaration','name':f['function'],'module':f['module'],'line':f['startLine'],'snippet':''})
with (DOCS/'INVENTARIO-CALLABLES.csv').open('w',newline='',encoding='utf-8-sig') as fh:
    fields6=['type','name','module','line','snippet'];w=csv.DictWriter(fh,fieldnames=fields6);w.writeheader();w.writerows(sorted(callable_rows,key=lambda x:(x['line'],x['name'])))

summary={'version':644,'namedFunctionDeclarations':len(functions),'topLevelArrowFunctions':sum(1 for x in callable_rows if x['type']=='top-level-arrow'),'arrowTokensIncludingCallbacks':len(arrow_rows),'controlFlowOccurrences':len(condition_rows),'eventBindings':len(event_rows),'moduleDependencyPairs':len(dep_rows),'conditionsByType':{}}
for r in condition_rows:summary['conditionsByType'][r['type']]=summary['conditionsByType'].get(r['type'],0)+1
(DOCS/'AUDITORIA-PROFUNDA-RESUMO.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n','utf-8')

# Completa o checklist principal com a contagem profunda de todas as ocorrências.
checklist=DOCS/'CHECKLIST-COMPLETO-FUNCOES-JOGABILIDADES.md'
if checklist.exists():
    text=checklist.read_text('utf-8')
    marker='## Auditoria profunda de condições, callbacks e dependências'
    if marker in text:
        text=text.split(marker,1)[0].rstrip()+'\n'
    lines=[
        '', marker, '',
        f"- [x] Declarações de função nomeadas: **{summary['namedFunctionDeclarations']}**",
        f"- [x] Funções arrow de topo: **{summary['topLevelArrowFunctions']}**",
        f"- [x] Tokens `=>` incluindo callbacks: **{summary['arrowTokensIncludingCallbacks']}**",
        f"- [x] Ocorrências de fluxo (`if/else/switch/case/for/while/catch/return/throw`): **{summary['controlFlowOccurrences']}**",
        f"- [x] Bindings de evento detalhados: **{summary['eventBindings']}**",
        f"- [x] Pares de dependência entre módulos: **{summary['moduleDependencyPairs']}**",
        '', '### Fluxo por tipo', ''
    ]
    for key,value in sorted(summary['conditionsByType'].items()):
        lines.append(f'- [x] `{key}`: **{value}** ocorrências')
    lines += [
        '', '### Inventários profundos', '',
        '- `INVENTARIO-FUNCOES-DETALHADO.csv`',
        '- `INVENTARIO-FUNCOES-DETALHADO.json`',
        '- `INVENTARIO-CONDICOES-DETALHADO.csv`',
        '- `INVENTARIO-ARROW-CALLBACKS.csv`',
        '- `INVENTARIO-EVENTOS-DETALHADO.csv`',
        '- `INVENTARIO-CALLABLES.csv`',
        '- `DEPENDENCIAS-MODULOS.csv`',
        '- `AUDITORIA-PROFUNDA-RESUMO.json`',
        '- `RELATORIO-PRESERVACAO-V642-V644.md`',
        '- `RELATORIO-PRESERVACAO-V642-V644.json`',
        f"- `CHECKLIST-{summary['namedFunctionDeclarations']}-FUNCOES.md`",
        '- `CHECKLIST-FLUXO-IF-ELSE-SWITCH-LOOPS.md`',
        f"- `CHECKLIST-{summary['eventBindings']}-EVENTOS.md`",
        '- `CHECKLIST-263-NOS-HTML.md`',
        '- `MATRIZ-COMPLETA-JOGABILIDADES-E-TESTES.md`',
    ]
    checklist.write_text(text+'\n'.join(lines)+'\n','utf-8')

print(json.dumps(summary,ensure_ascii=False,indent=2))

# Checklists literais completos para inspeção humana.
function_md=[f"# Checklist das {summary['namedFunctionDeclarations']} funções — OTTHI World Edu V644",'',
             'Cada item confirma presença na fonte modular. `endBoundaryLine` termina na próxima declaração de função de topo; não é uma afirmação de parsing semântico do corpo JavaScript.','']
current_module=None
for f in functions:
    if f['module']!=current_module:
        current_module=f['module'];function_md += ['',f"## `{current_module}`",'']
    logic=', '.join(f"{k}={f[k]}" for k in ['if','else','switch','case','for','while','catch','return','throw'] if f[k]) or 'sem fluxo contado'
    calls=', '.join(f['calls'][:12]) if f['calls'] else 'nenhuma função nomeada detectada'
    if len(f['calls'])>12:calls+=f" (+{len(f['calls'])-12})"
    function_md.append(f"- [x] `{f['function']}()` — linhas {f['startLine']}–{f['endBoundaryLine']} — {logic} — chama: {calls}")
(DOCS/f"CHECKLIST-{summary['namedFunctionDeclarations']}-FUNCOES.md").write_text('\n'.join(function_md)+'\n','utf-8')

flow_md=['# Checklist das ocorrências de fluxo — OTTHI World Edu V644','',
         'Inventário lexical de todas as ocorrências encontradas de `if`, `else`, `switch`, `case`, `for`, `while`, `catch`, `return` e `throw`. Um trecho pode conter mais de uma ocorrência.','']
current_module=None
for row in condition_rows:
    if row['module']!=current_module:
        current_module=row['module'];flow_md += ['',f"## `{current_module}`",'']
    owner=f" em `{row['functionBoundaryOwner']}()`" if row['functionBoundaryOwner'] else ''
    snippet=row['snippet'].replace('`','\\`')
    flow_md.append(f"- [x] `{row['type']}` — linha {row['line']}, coluna {row['column']}{owner} — `{snippet}`")
(DOCS/'CHECKLIST-FLUXO-IF-ELSE-SWITCH-LOOPS.md').write_text('\n'.join(flow_md)+'\n','utf-8')

event_md=[f"# Checklist dos {summary['eventBindings']} bindings de evento — OTTHI World Edu V644",'']
current_module=None
for row in event_rows:
    if row['module']!=current_module:
        current_module=row['module'];event_md += ['',f"## `{current_module}`",'']
    owner=f" em `{row['functionBoundaryOwner']}()`" if row['functionBoundaryOwner'] else ''
    snippet=row['snippet'].replace('`','\\`')
    event_md.append(f"- [x] `{row['type']}` — linha {row['line']}{owner} — `{snippet}`")
(DOCS/f"CHECKLIST-{summary['eventBindings']}-EVENTOS.md").write_text('\n'.join(event_md)+'\n','utf-8')

# Reaproveita o inventário de nós HTML gerado pelo auditor estático.
html_csv=DOCS/'INVENTARIO-NOS-HTML.csv'
node_md=['# Checklist dos nós HTML — OTTHI World Edu V644','']
if html_csv.exists():
    with html_csv.open('r',encoding='utf-8-sig',newline='') as fh:
        html_rows=list(csv.DictReader(fh))
    for row in html_rows:
        identity=f"#{row['id']}" if row['id'] else row['tag']
        classes=f" class=\"{row['classes']}\"" if row['classes'] else ''
        parent=f" — pai `{row['parent']}`" if row['parent'] else ''
        node_md.append(f"- [x] linha {row['line']} — `<{row['tag']}>` `{identity}`{classes}{parent}")
(DOCS/f"CHECKLIST-{len(html_rows)}-NOS-HTML.md").write_text('\n'.join(node_md)+'\n','utf-8')
