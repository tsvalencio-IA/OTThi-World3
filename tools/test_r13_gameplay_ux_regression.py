from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
sports=(root/'src/modules/13a-sports-kart-v705.js').read_text()
css=(root/'src/styles/19-mobile-landscape-authority-v7051.css').read_text()
jobs=(root/'src/modules/21-interactions-shop-social-races.js').read_text()
careers=(root/'src/modules/22-careers-jobs-uniforms.js').read_text()
damage=(root/'src/modules/36a-vehicle-damage-repair-v704.js').read_text()
controls=(root/'src/modules/29-game-loop-controls-gamepad.js').read_text()
action=(root/'src/modules/27-npc-enemies-combat-camera-action.js').read_text()
physics=(root/'src/modules/26-input-player-physics.js').read_text()
checks={
 'futebol chutar':"action:['⚽','Chutar']" in sports,
 'futebol correr':"run:['💨','Correr']" in sports,
 'futebol tocar':"special:['↗️','Tocar']" in sports,
 'futebol carrinho':"jump:['🦶','Carrinho']" in sports and 'v705FootballTackle' in sports,
 'volei bloquear':"run:['🧱','Bloquear']" in sports,
 'volei cortar':"jump:['💥','Cortar']" in sports,
 'futevolei erguer':"special:['⬆️','Erguer']" in sports,
 'futevolei cabecar':"run:['🧠','Cabecear']" in sports,
 'kart acelerar':"run:['▲','Acelerar']" in sports,
 'kart frear':"jump:['■','Frear']" in sports,
 'kart largada 3 voltas':'k.countdown=3.4' in sports and 'k.lap>=3' in sports,
 'sem dock sobreposto':'.sport-action-dock' not in css and 'data-sport-action-dock' not in sports,
 'controles nativos':'syncSportControlsV705' in sports and 'handleActiveSportRunControlV705' in sports and 'handleActiveSportJumpControlV705' in sports,
 'toque correr roteado':"handleActiveSportRunControlV705(active)" in controls,
 'toque quarto botao roteado':"handleActiveSportJumpControlV705(active)" in controls,
 'acao esportiva antes de sair veiculo':action.find('handleActiveSportActionV704') < action.find('if(player.vehicle){exitVehicle()'),
 'pulo/gamepad respeita esporte':"handleActiveSportJumpControlV705(true)" in physics,
 'hub contraste escuro':'.sports-hub-grid button{' in css and 'color:#fff!important' in css,
 'fonte primaria legivel':'primary-actions .round span{font-size:10px!important' in css,
 'fonte quick legivel':'quick-bar button span{font-size:10px!important' in css,
 'policia acao explicita':'performPoliceCheckpointAction' in careers and 'Abordagem segura' in careers,
 'policia nao auto conclui':'job.progress=(job.progress||0)+1' in careers and 'policeCheckpointReady' in careers,
 'professor 3 etapas':'Aula prática • etapa ${step+1}/3' in careers,
 'mecanico real':'Mecânico da Oficina' in jobs and 'reparo real na bancada' in jobs,
 'mecanico completa via reparo':'mechanic-training-repair' in damage and 'mechanicRepairCompleted=true' in damage,
 'mecanico nao coleta madeira':"if(job.id==='gather')return[{text:'Coletar 3 madeiras'" not in careers,
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('OK  ' if v else 'FAIL'),k)
print(f'RESULTADO: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
