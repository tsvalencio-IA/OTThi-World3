#!/usr/bin/env python3
from pathlib import Path
import ast,json,re,sys,math
ROOT=Path(__file__).resolve().parents[1]
def text(p): return (ROOT/p).read_text('utf-8')
checks=[]
def ck(name,ok,detail=''): checks.append((name,bool(ok),detail)); print(('OK' if ok else 'FALHA'),'-',name,detail)
v=json.loads(text('VERSION.json')); order=json.loads(text('src/module-order.json')); sports=text('src/modules/13a-sports-kart-v705.js'); race=text('src/modules/21-interactions-shop-social-races.js'); npcbase=text('src/modules/13-houses-npcs-vehicles-base.js'); npclogic=text('src/modules/27-npc-enemies-combat-camera-action.js'); coop=text('src/modules/32-cooperative-missions.js'); css=text('src/styles/19-mobile-landscape-authority-v7051.css'); damage=text('src/modules/36a-vehicle-damage-repair-v704.js'); app=text('app.js')
hotfix_parts=str(v.get('hotfix','0.0')).split('.',1); hotfix_minor=int(hotfix_parts[1]) if len(hotfix_parts)>1 and hotfix_parts[1].isdigit() else -1
ck('Release V705.2 ou posterior',v.get('version')==705 and v.get('assetVersion',0)>=7052 and hotfix_parts[0]=='705' and hotfix_minor>=2)
legacy=text('src/modules/13a-sports-kart-v704.js') if (ROOT/'src/modules/13a-sports-kart-v704.js').exists() else ''
ck('Uma única fonte esportiva','src/modules/13a-sports-kart-v705.js' in [x['file'] for x in order['javascript']] and 'src/modules/13a-sports-kart-v704.js' not in [x['file'] for x in order['javascript']] and 'retired' in legacy)
ck('Futebol 4x4 com papéis reais',all(token in sports for token in ['Ala azul','Meia azul','Goleiro azul','Marcador vermelho','Ala vermelho','Atacante vermelho','Goleiro vermelho']))
ck('Futebol possui condução, chute, passe e desarme',all(token in sports for token in ['f.possession=0','footballKickV704','v705FootballPass','v705FootballTackle']))
ck('Futebol possui goleiros e IA de cobertura','function v705Keeper' in sports and 'homeChaser' in sports and 'awayChaser' in sports)
ck('Vôlei/futevôlei 2x2','c.team=[v705Athlete' in sports and 'c.opponents=[v705Athlete' in sports)
ck('Vôlei/futevôlei têm janela de contato móvel','v705CourtContactWindow' in sports and 'AÇÃO AGORA' in sports)
ck('Regra de três toques','c.touches[0]>3' in sports and 'c.touches[1]>3' in sports)
ck('Recepção, levantamento e ataque diferenciados','setForPlayer' in sports and 'v705CourtSet' in sports and 'attack=c.touches' in sports)
ck('Pontuação de set até 11 com dois de vantagem','c.score[side]>=11' in sports and 'Math.abs(c.score[0]-c.score[1])>=2' in sports)
ck('Atletismo usa pista e setores ordenados',all(token in race for token in ['athleticsRacePoint','athleticsRaceProgress','nextGate:1','gateCount:12','cortar o campo não valida']))
ck('Atletismo não usa mais chegada por coordenada X','player.x>=gym.finishX' not in race and 'race.playerLap>=race.lapsTarget' in race)
ck('Atletismo oferece uma e duas voltas','data-race="sprint"' in race and 'data-race="twoLaps"' in race and "lapsTarget=type==='twoLaps'?2:1" in race)
ck('Pega-medalhas usa a pista real','spawnRaceCoins(gym' in race and 'athleticsRacePoint(gym,(i+.5)/12' in race)
ck('Kart usa spline centrípeta','THREE.CatmullRomCurve3' in sports and "'centripetal'" in sports)
m=re.search(r'local=(\[\[.*?\]\]),points=local',sports)
pts=ast.literal_eval(m.group(1)) if m else []
ck('Kart tem traçado com pelo menos 18 pontos',len(pts)>=18,len(pts))
ck('Traçado cabe na zona reservada',bool(pts) and all(abs(x)<=18 and abs(z)<=16 for x,z in pts),str(pts))
# Curvas variam bastante e o traçado não é um oval matemático.
r=[math.hypot(x,z) for x,z in pts] if pts else [0]
ck('Traçado tem variação real de curvas',max(r)-min(r)>6.0,f'raios {min(r):.2f}..{max(r):.2f}')
ck('Kart tem 14 checkpoints','Array.from({length:14}' in sports)
ck('Kart tem três faixas de turbo','[.18,.52,.80].map' in sports and 'kartBoostUntil' in sports)
ck('IA do kart reduz em curvas','v705KartCurvature' in sports and 'curvePenalty' in sports)
ck('Kart mostra melhor volta e classificação','k.best' in sports and "'Você',progress:exactProgress" in sports)
ck('Kart tem grid, boxes, zebras/barreiras','for(let i=0;i<4;i++)' in sports and "'BOXES'" in sports and 'curbA' in sports and 'kartBarrier' in sports)
ck('Kart penaliza fora da pista','v705TrackDistance' in sports and 'Fora da pista' in sports)
ck('Karts têm velocidade própria e boost sem remover dano','boosting?29:25.5' in damage and 'vehicleBrokenV704' in damage)
ck('NPC visual arredondado','THREE.SphereGeometry(.39' in npcbase and 'THREE.CylinderGeometry(shoulder' in npcbase)
ck('NPC possui traços individuais e memória','traits={cautious:' in npclogic and 'memory:[]' in npclogic and 'v705NpcRemember' in npclogic)
ck('NPC calcula tempo para colisão','ttc=' in npclogic and 'miss=' in npclogic and 'v705NpcVehicleThreat' in npclogic)
ck('NPC reage à buzina','player.hornUntil' in npclogic and 'Ouvi a buzina' in npclogic)
ck('NPC evita vias e obstáculos','v704RoadAt' in npclogic and 'positionBlockedForPlayer' in npclogic)
ck('NPC mantém espaço pessoal','v705NpcSeparation' in npclogic and 'd<1.15' in npclogic)
ck('NPC possui encontros sociais','v705NpcSocialPeer' in npclogic and "b.state='peer-social'" in npclogic)
ck('Missão possui diretor do objetivo','coopDirectCurrentObjective' in coop and 'coopObjectiveDirectorKey' in coop and 'AGORA:' in coop)
ck('Missão atualiza GPS junto da etapa','if(target)coopSetWaypoint(target)' in coop and 'coopDirectCurrentObjective(false)' in coop)
ck('Briefing mostra próximo local e distância','PRÓXIMO LOCAL' in coop and 'Math.round(distance)' in coop)
ck('Paisagem separa habilidades dos controles','bottom:calc(var(--land-bottom) + (var(--land-action)*2) + 10px)' in css and '--land-left-reserve' in css and '--land-right-reserve' in css)
ck('Menu rápido é painel lateral em paisagem','grid-template-columns:repeat(2,56px)' in css and 'overflow-y:auto' in css)
ck('Contexto some com painéis abertos','skills-open .context-prompt' in css and 'quick-open .context-prompt' in css)
ck('Botão poder integrado a esporte','handleActiveSportSpecialV704' in npclogic and 'function firePower' in npclogic)
ck('Bundle contém alterações V705.2','v705KartCurvature' in app and 'coopDirectCurrentObjective' in app and 'v705NpcSeparation' in app)
failed=[x for x in checks if not x[1]]
print(f'RESULTADO: {len(checks)-len(failed)}/{len(checks)}')
sys.exit(1 if failed else 0)
