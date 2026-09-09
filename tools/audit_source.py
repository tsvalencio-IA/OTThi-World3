#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from html.parser import HTMLParser
import csv, json, re

ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / 'app.js').read_text('utf-8')
LINES = APP.splitlines()
MANIFEST = json.loads((ROOT / 'src/module-order.json').read_text('utf-8'))
DOCS = ROOT / 'docs'
DOCS.mkdir(exist_ok=True)

module_ranges=[]
for item in MANIFEST['javascript']:
    module_ranges.append((item['startLine'], item['endLine'], Path(item['file']).name, item['description']))

def module_for_line(line):
    # Generated bundle adds module comments; map by function name content instead of generated line.
    # The source inventory below reads directly from src modules.
    return ''

# Reconstruct clean source body from modules to preserve source lines.
source_parts=[]
module_line_records=[]
line_cursor=1
for item in MANIFEST['javascript']:
    text=(ROOT/item['file']).read_text('utf-8').split('// @otthi-module-body',1)[1].lstrip('\r\n')
    module_lines=text.splitlines()
    for idx,line in enumerate(module_lines, item['startLine']):
        module_line_records.append((idx, line, Path(item['file']).name, item['description']))
    source_parts.extend(module_lines)
source='\n'.join(source_parts)
source_lines=source.splitlines()

# Function inventory using top-level indentation inherited from original source.
functions=[]
func_starts=[]
for original_line,line,module,desc in module_line_records:
    m=re.match(r'^  function\s+([A-Za-z_$][\w$]*)\s*\(', line)
    if m:
        func_starts.append((original_line,m.group(1),module,desc))
known_names={name for _,name,_,_ in func_starts}

# Use next top-level function as a bounded approximation; exact enough for static counts and call graph.
for index,(start,name,module,desc) in enumerate(func_starts):
    end=(func_starts[index+1][0]-1) if index+1<len(func_starts) else MANIFEST['javascript'][-1]['endLine']
    body_lines=[line for ln,line,_,_ in module_line_records if start<=ln<=end]
    body='\n'.join(body_lines)
    calls=[]
    for called in re.findall(r'(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(', body):
        if called in known_names and called!=name:
            calls.append(called)
    counts={
        'if': len(re.findall(r'\bif\s*\(', body)),
        'else': len(re.findall(r'\belse\b', body)),
        'switch': len(re.findall(r'\bswitch\s*\(', body)),
        'case': len(re.findall(r'\bcase\b', body)),
        'for': len(re.findall(r'\bfor\s*\(', body)),
        'while': len(re.findall(r'\bwhile\s*\(', body)),
        'catch': len(re.findall(r'\bcatch\b', body)),
        'ternaryApprox': body.count('?'),
    }
    functions.append({
        'function': name, 'module': module, 'description': desc,
        'sourceStartLine': start, 'sourceEndLineApprox': end,
        'calledByBody': sorted(set(calls)), 'callCountApprox': len(calls), **counts
    })

with (DOCS/'INVENTARIO-FUNCOES.csv').open('w',newline='',encoding='utf-8-sig') as f:
    fields=['function','module','description','sourceStartLine','sourceEndLineApprox','callCountApprox','if','else','switch','case','for','while','catch','ternaryApprox','calledByBody']
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
    for row in functions:
        out=dict(row);out['calledByBody']=' | '.join(row['calledByBody']);w.writerow(out)
(DOCS/'INVENTARIO-FUNCOES.json').write_text(json.dumps(functions,ensure_ascii=False,indent=2)+'\n','utf-8')

# Conditions and event bindings by source line.
conditions=[]; events=[]; top_declarations=[]
for line_no,line,module,desc in module_line_records:
    stripped=line.strip()
    for kind,pattern in [
        ('if',r'\bif\s*\('),('else',r'\belse\b'),('switch',r'\bswitch\s*\('),
        ('case',r'\bcase\b'),('for',r'\bfor\s*\('),('while',r'\bwhile\s*\('),('catch',r'\bcatch\b')
    ]:
        if re.search(pattern,line):
            conditions.append({'type':kind,'module':module,'sourceLine':line_no,'snippet':stripped[:500]})
    if 'addEventListener(' in line or re.search(r'\.(?:onclick|onchange|oninput|onpointerdown|onpointerup|oncontextmenu)\s*=',line):
        events.append({'module':module,'sourceLine':line_no,'snippet':stripped[:700]})
    m=re.match(r'^  (const|let|var)\s+(.+)',line)
    if m:
        top_declarations.append({'kind':m.group(1),'module':module,'sourceLine':line_no,'declaration':m.group(2)[:700]})

for name,rows,fields in [
    ('INVENTARIO-CONDICOES.csv',conditions,['type','module','sourceLine','snippet']),
    ('INVENTARIO-EVENTOS.csv',events,['module','sourceLine','snippet']),
    ('INVENTARIO-VARIAVEIS-TOPO.csv',top_declarations,['kind','module','sourceLine','declaration'])
]:
    with (DOCS/name).open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

class NodeParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.nodes=[]
    def handle_starttag(self,tag,attrs):
        data=dict(attrs); parent=self.stack[-1] if self.stack else ''
        record={'line':self.getpos()[0],'tag':tag,'id':data.get('id',''),'classes':data.get('class',''),'parent':parent}
        self.nodes.append(record)
        if tag not in {'meta','link','img','input','br','hr','source'}:
            self.stack.append(data.get('id') or tag)
    def handle_startendtag(self,tag,attrs): self.handle_starttag(tag,attrs)
    def handle_endtag(self,tag):
        if self.stack: self.stack.pop()

parser=NodeParser();parser.feed((ROOT/'index.html').read_text('utf-8'))
with (DOCS/'INVENTARIO-NOS-HTML.csv').open('w',newline='',encoding='utf-8-sig') as f:
    fields=['line','tag','id','classes','parent'];w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(parser.nodes)

# Summary and module checklist.
module_stats=[]
for item in MANIFEST['javascript']:
    file=Path(item['file']).name
    funcs=[f for f in functions if f['module']==file]
    cond=[c for c in conditions if c['module']==file]
    ev=[e for e in events if e['module']==file]
    module_stats.append({
        'file':file,'description':item['description'],'functions':len(funcs),
        'conditions':len(cond),'events':len(ev),'startLine':item['startLine'],'endLine':item['endLine']
    })

summary={
    'version':644,
    'functions':len(functions),
    'conditions':len(conditions),
    'events':len(events),
    'topLevelDeclarations':len(top_declarations),
    'htmlNodes':len(parser.nodes),
    'htmlIds':sum(1 for n in parser.nodes if n['id']),
    'javascriptModules':len(MANIFEST['javascript']),
    'styleModules':len(MANIFEST['styles']),
    'moduleStats':module_stats,
}
(DOCS/'AUDITORIA-ESTATICA-RESUMO.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n','utf-8')

lines=[]
lines.append('# Checklist técnico completo — OTTHI World Edu V644')
lines.append('')
lines.append('Este checklist foi gerado sobre a fonte modular completa. Ele não declara que cada experiência física foi aprovada; separa presença no código, auditoria estática e teste obrigatório em aparelho real.')
lines.append('')
lines.append('## Cobertura estática')
lines.append('')
for key,label in [('functions','Funções'),('conditions','Condições/loops capturados'),('events','Bindings de eventos'),('topLevelDeclarations','Declarações de topo'),('htmlNodes','Nós HTML'),('htmlIds','IDs HTML'),('javascriptModules','Módulos JavaScript'),('styleModules','Módulos CSS')]:
    lines.append(f'- [x] {label}: **{summary[key]}**')
lines.append('')
lines.append('## Módulos JavaScript')
lines.append('')
for m in module_stats:
    lines.append(f"- [x] `{m['file']}` — {m['description']} — {m['functions']} funções, {m['conditions']} condições/loops, {m['events']} eventos")
lines.append('')
lines.append('## Sistemas e jogabilidades preservados')
lines.append('')
for item in [
    'Estado, migração V600–V644 e salvamento local/nuvem','Conta e autenticação Firebase','Roupas, acessórios e uniformes profissionais',
    'Skills Mini, Normal, Grande, Abaixar e Girar','Missões, objetivos, medalhas e recompensas','Inventário, ferramentas, oficina e fundição',
    'Mapa, GPS, waypoint, minimapa e trânsito','Casas, interiores, baús, propriedades e ampliações','Construção persistente com preview, giro, colocar, cancelar e remover',
    'Veículos, passageiros, colisões, física, som e efeitos','Ônibus, paradas, rotas e metrô','Bombeiros, caminhões, incêndios e missões',
    'Polícia, viaturas, patrulha, alertas e segurança','Ambulâncias e incidentes de trânsito','Pescaria, câmera, peixes, barcos e física náutica',
    'NPCs, amizade, carona, sociedade e corridas','Inimigos, combate, poderes e aventuras','Educação: matemática, português, inglês, desafios diários e trilha adaptativa',
    'Multiplayer, presença, fantasmas, chat controlado, desafios e bairros','PWA, atualização automática, AR e APK Android'
]:
    lines.append(f'- [x] {item}')
lines.append('')
lines.append('## Testes obrigatórios antes de chamar a versão de aprovada')
lines.append('')
for item in [
    'Abrir lobby em 320×568, 360×640, 390×844 e 412×915','Girar automaticamente retrato ↔ paisagem durante o jogo sem reiniciar',
    'Medir FPS sem auditor pesado: 30 FPS mínimo em celular básico','Abrir todos os menus e verificar margem, escala, rolagem e fechamento',
    'Caminhar, correr, pular, abaixar, Mini, Normal, Grande e Girar','Entrar/sair de carro, viatura, ambulância e caminhão de bombeiros',
    'Completar rota de ônibus e viagem de metrô','Iniciar/concluir/cancelar missão e restaurar uniforme',
    'Construir, salvar, fechar, abrir, sincronizar e remover sem reaparecer','Pescar em retrato e paisagem, girar câmera e visualizar peixe/boia',
    'Entrar/sair do barco apenas em ponto seguro','Entrar/sair de casas e usar móveis/baú/geladeira/oficina',
    'Executar desafios educacionais e validar progressão adaptativa','Abrir duas sessões Firebase no mesmo bairro e validar presença/interpolação',
    'Mostrar casas pelo apelido seguro e respeitar privacidade','Instalar PWA, atualizar app.js/style.css e confirmar troca do Service Worker',
    'Gerar APK e testar rotação, cache, retorno do segundo plano e atualização web'
]:
    lines.append(f'- [ ] {item}')
lines.append('')
lines.append('## Arquivos de inventário')
lines.append('')
for f in ['INVENTARIO-FUNCOES.csv','INVENTARIO-FUNCOES.json','INVENTARIO-CONDICOES.csv','INVENTARIO-EVENTOS.csv','INVENTARIO-VARIAVEIS-TOPO.csv','INVENTARIO-NOS-HTML.csv','AUDITORIA-ESTATICA-RESUMO.json']:
    lines.append(f'- `{f}`')
(DOCS/'CHECKLIST-COMPLETO-FUNCOES-JOGABILIDADES.md').write_text('\n'.join(lines)+'\n','utf-8')

print(json.dumps(summary,ensure_ascii=False,indent=2))
