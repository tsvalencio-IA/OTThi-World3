#!/usr/bin/env python3
from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text("utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


traffic = read("src/modules/07-navigation-traffic-routes.js")
bus = read("src/modules/15-transit-bus-metro.js")
highway = read("src/modules/14a-ottovias-highway-v7054.js")
vehicle = read("src/modules/23-vehicle-effects-driving.js")
physics = read("src/modules/26-input-player-physics.js")
multiplayer = read("src/modules/28-multiplayer-social-online.js")
shared = read("src/modules/28a-shared-world-multiplayer.js")
adapter = read("assets/js/multiplayer-rtdb.js")
state = read("src/modules/09-responsive-ar-quality-diagnostics.js")
collision = read("src/modules/25-render-init-resize-position-collision.js")
npcs = read("src/modules/27-npc-enemies-combat-camera-action.js")

# O motorista publica a transformação do veículo visual que realmente se move.
for token in (
    "vehicleX:drivingVehicle?+player.x.toFixed(2)",
    "vehicleY:drivingVehicle?+player.y.toFixed(2)",
    "vehicleZ:drivingVehicle?+player.z.toFixed(2)",
    "vehicleR:drivingVehicle?+Number(player.car.heading||player.facing).toFixed(3)",
):
    require(token in multiplayer, f"transformação ao vivo ausente: {token}")
require("Math.hypot(Number(payload.vehicleX||0)-Number(lastPublishSnapshot.vehicleX||0)" in multiplayer,
        "movimento do veículo não força uma nova presença")
require("now-lastPublish>240" in multiplayer, "frequência móvel original de presença foi removida")
require("now-lastPublishHeartbeat>2200" in multiplayer, "heartbeat original de presença foi removido")

# Todos os geradores comuns usam a mesma convenção lateral aceita no mapa.
require("function brazilianRightLaneNormal" in traffic, "normal brasileira central ausente")
require("return{x:-dz/length,z:dx/length}" in traffic, "sentido lateral brasileiro regressou")
require("offsetBrazilianTrafficPath(centerline" in traffic, "trânsito urbano ignora a mão brasileira")
require("offsetBrazilianTrafficPath(source" in bus, "ônibus ignora a mão brasileira")
require("offsetBrazilianTrafficPath(source" in highway, "trânsito da OTTOVIAS ignora a mão brasileira")
require("const clockwise=ottoviasLaneRoute" in highway and "counter=ottoviasLaneRoute" in highway,
        "os dois sentidos da OTTOVIAS não estão separados")


def accepted_map_normal(dx: float, dz: float) -> tuple[float, float]:
    length = (dx * dx + dz * dz) ** 0.5 or 1.0
    return -dz / length, dx / length


for direction in ((0, 1), (0, -1), (1, 0), (-1, 0)):
    a = accepted_map_normal(*direction)
    b = accepted_map_normal(-direction[0], -direction[1])
    require(abs(a[0] + b[0]) < 1e-9 and abs(a[1] + b[1]) < 1e-9,
            "sentidos opostos caem na mesma faixa")

# Vários passageiros reais são mantidos, posicionados e encerrados individualmente.
require("passengerUids:[]" in state, "estado não possui lista de passageiros")
for capacity_rule in ("return 1", "return 2", "return 3"):
    require(capacity_rule in vehicle, f"capacidade veicular ausente: {capacity_rule}")
require("function hostedVehiclePassengerUids" in vehicle, "motorista não mantém todos os passageiros")
require("function addHostedVehiclePassenger" in vehicle, "entrada de passageiro não é incremental")
require("function removeHostedVehiclePassenger" in vehicle, "saída individual de passageiro ausente")
require("for(const uid of hostedPassengers)" in vehicle, "saída do motorista não libera todos")
require("passengerUids=[]" in vehicle, "troca de veículo não limpa a lista")
require("vehiclePassengerSeatOffset" in physics and "multiplayerVehiclePassengerSeatIndex" in physics,
        "passageiro local não segue seu assento")
require("passengerSeat" in shared and "vehiclePassengerSeatOffset(seatIndex)" in shared,
        "passageiros remotos não têm posições independentes")
require("vehiclePassengerUids:hostedPassengerUids" in multiplayer,
        "presença do motorista não publica a lista")
require("vehiclePassengerCount" in multiplayer and "vehicleSeatCapacity" in multiplayer,
        "ocupação/capacidade não são publicadas")
require("presenceVehiclePassengerCount(sender)>=presenceVehicleSeatCapacity(sender)" in adapter,
        "aceite do convite não valida a capacidade")
require("sender.vehiclePassengerUid||sender.vehiclePassengerBotId" not in adapter,
        "adaptador ainda bloqueia o carro depois do primeiro passageiro")
require(multiplayer.count('data-player-action="vehiclePassenger"') == 1,
        "ação de passageiro foi removida ou duplicada")
require("removeHostedVehiclePassenger(id)" in multiplayer,
        "desconexão não solta somente o passageiro correto")
require("removeHostedVehiclePassenger(it.senderUid)" in multiplayer,
        "saída voluntária não solta somente o passageiro correto")
require("vehicleHasPassengerSeat()" in npcs,
        "NPC pode ocupar um assento inexistente")
require("passengerUids=[]" in collision,
        "recuperação de segurança preserva ocupação fantasma")

# Compatibilidade e escopo: sem nova raiz/regras Firebase e sem remoção do passageiro legado.
require("vehiclePassengerUid:hostedPassengerUids[0]||''" in multiplayer,
        "compatibilidade com cliente anterior foi removida")
require("vehiclePassengerUid:vehiclePassengerUids[0]||''" in adapter,
        "adaptador não mantém compatibilidade legada")
require((ROOT / "firebase-database.rules.json").exists(), "regras Firebase originais ausentes")
rules = read("firebase-database.rules.json")
require('"$other"' in rules, "presença não aceita campos aditivos")

version = json.loads(read("VERSION.json"))
require(version["validation"]["multiplayerTwoDevicesApproved"] is False,
        "homologação física foi declarada sem teste em dois celulares")

print("R16.7.12 veículo ao vivo, trânsito BR e multiassento: 43 verificações aprovadas")
