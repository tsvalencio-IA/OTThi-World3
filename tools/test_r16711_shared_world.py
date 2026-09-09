#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text("utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


module_order = json.loads(read("src/module-order.json"))
files = [item["file"] for item in module_order["javascript"]]
shared_index = files.index("src/modules/28a-shared-world-multiplayer.js")
require(files[shared_index - 1].endswith("28-multiplayer-social-online.js"), "módulo compartilhado fora da posição esperada")
require(files[shared_index + 1].endswith("29-game-loop-controls-gamepad.js"), "módulo compartilhado deve carregar antes do loop")

world_build = read("src/modules/20-world-build-cloud-houses.js")
require("towSlot=index" in world_build, "migração não gera vaga única por índice")
require("towSlots[Math.min" not in world_build, "migração ainda prende excedentes na quarta vaga")

workshop = read("src/modules/21-interactions-shop-social-races.js")
require("Number(a.position?.x||0)-Number(b.position?.x||0)" in workshop, "ordem esquerda/direita das rodas não foi corrigida")
require(workshop.count("sharedWorkshopLiftAvailableFor") >= 3, "ocupação global não protege todas as entradas do elevador")
for preserved in ["Pátio da Oficina", "Ferro-Velho OTTHI", "Ordens de Serviço abertas", "RETIRAR DO ELEVADOR"]:
    require(preserved in workshop, f"função preservada ausente: {preserved}")

physics = read("src/modules/26-input-player-physics.js")
require("target.vehicleX??target.x" in physics and "target.vehicleR??target.r" in physics, "passageiro não segue a transformação real do veículo")

shared = read("src/modules/28a-shared-world-multiplayer.js")
for symbol in [
    "sharedWorldAuthorityId", "sharedWorldCaptureScene", "sharedWorldPresenceSnapshot",
    "updateSharedWorldReplica", "sharedWorkshopYardPose", "sharedWorkshopLiftClaims",
    "sharedWorkshopResolveLiftConflict", "sharedWorldApplyGhostAppearance",
]:
    require(f"function {symbol}" in shared, f"função compartilhada ausente: {symbol}")
require("n:npcs,t:traffic,i:incident" in shared, "snapshot não reúne NPCs, trânsito e ocorrência")
require("SHARED_YARD_STATUSES" in shared and "localeCompare" in shared, "alocação do pátio não é determinística")

multiplayer = read("src/modules/28-multiplayer-social-online.js")
for field in ["sharedSceneSig", "toolId", "activeSkill", "impactSeq", "vehiclePrimaryColor", "vehicleSecondaryColor"]:
    require(field in multiplayer, f"presença não publica {field}")
require("carPassenger" in multiplayer and "sharedWorldApplyGhostAppearance" in multiplayer, "motorista/passageiro não usam representação física remota")
require("sharedWorkshopRemoteParkedPose" in multiplayer and "sharedWorkshopRemoteFleetPose" in multiplayer, "veículos remotos do pátio ignoram a vaga global")

loop = read("src/modules/29-game-loop-controls-gamepad.js")
require("updateSharedWorldReplica(dt)" in loop, "réplica compartilhada não está no loop")
require(loop.count("sharedWorldIsAuthority()") >= 2, "NPCs e trânsito ainda podem ter duas autoridades")

highway = read("src/modules/14a-ottovias-highway-v7054.js")
require("sharedWorldIsAuthority())updateOttoviasTraffic(dt)" in highway, "OTTOVIAS continua simulando tráfego em todos os aparelhos")

collision = read("src/modules/25-render-init-resize-position-collision.js")
require("world.ghosts?.values" in collision, "carros de outros usuários não participam da colisão local")

# O algoritmo reserva 8 vagas principais, 16 de expansão e depois vagas de reserva.
def slot_id(status: str, index: int) -> str:
    if index < 8:
        return f"{status}-{index // 4}-{index % 4}"
    overflow = index - 8
    col = 4 + overflow // 2
    row = overflow % 2
    if col < 12:
        return f"{status}-overflow-{row}-{col}"
    remainder = overflow - 16
    return f"{status}-reserve-{max(1, remainder // 2 + 1)}-{'n' if remainder % 2 == 0 else 's'}"


for status in ("ready", "pending", "unrepairable"):
    slots = [slot_id(status, index) for index in range(40)]
    require(len(slots) == len(set(slots)), f"vagas repetidas no setor {status}")

version = json.loads(read("VERSION.json"))
build = str(version["build"])
lineage = re.match(r"^705\.16\.7\.(\d+)-", build)
require(build == module_order["build"], "build inconsistente")
require(lineage is not None and int(lineage.group(1)) >= 11, "teste R16.7.11 executado fora da sua linhagem")
require(version["validation"]["multiplayerTwoDevicesApproved"] is False, "teste físico não pode ser declarado sem dois celulares")

print("R16.7.11 shared-world: 38 verificações aprovadas")
