#!/usr/bin/env python3
"""Contratos determinísticos da evolução multiplayer e cooperativa V647."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


checks: list[tuple[str, bool]] = []


def check(name: str, condition: bool) -> None:
    checks.append((name, bool(condition)))


multiplayer = read("assets/js/multiplayer-rtdb.js")
missions = read("src/modules/32-cooperative-missions.js")
navigation = read("src/modules/07-navigation-traffic-routes.js")
map_source = read("src/modules/08-map-parent-settings.js")
styles = read("src/styles/15-coop-map-responsive-v6463.css")
rules_text = read("firebase-database.rules.json")
rules = json.loads(rules_text)
user_rules = rules["rules"]["otthosWorld"]["users"]["$uid"]
room_rules = rules["rules"]["otthosWorld"]["rooms"]["$roomId"]

check("Navegação aguarda worldGroup", "if(!worldGroup||!window.THREE)return false" in navigation)
check("Reserva atômica de sala preservada", "reserveSlotSnapshot" in multiplayer)
check("Fallback por transação individual", "reserveRoomSlotIndividually" in multiplayer)
check("Reserva individual testável", "reserveSlotRecord" in multiplayer)
check("Participante fica registrado ao desconectar", "armCoopParticipantDisconnect" in multiplayer and
      "update({ready:false" in multiplayer)
check("Evento cooperativo idempotente", "if(existing&&(patch.reserveEvent||existing.uid===user.uid))return current" in multiplayer)
check("Cancelamento pelo remetente", "cancelSocialRequest" in multiplayer)
coop_write = room_rules["coopMissions"]["$missionId"][".write"]
slot_write = room_rules["slots"]["$slotId"][".write"]
social_write = user_rules["socialRequests"]["$requestId"][".write"]
check("Modo competitivo sincronizado com autoridade do host", "options.mode==='competitive'" in multiplayer and "data.child('hostUid').val() === auth.uid" in coop_write)
check("Regras aceitam transação individual segura", '"slots": {' in rules_text and "newData.child('uid').val() === auth.uid" in slot_write and ".write" not in room_rules["slots"])
check("Convites autenticados preservam remetente e destinatário", "newData.child('fromUid').val() === auth.uid" in social_write and "newData.child('toUid').val() === $uid" in social_write and "auth.uid === $uid" in social_write)

for token in (
    "Controlar o fogo progressivamente",
    "safety-release",
    "patient-loaded",
    "patient-delivered",
    "suspect-escorted",
    "student-delivered",
    "coopReserveEvent",
    "coopIndividualCount",
    "coopRaceStandings",
    "continueCoopMissionOffline",
    "createCoopOvalTrackWorld",
):
    check(f"Missões incluem {token}", token in missions)

check("Maca exige dois participantes", "coopNearbyParticipantCount(5)<2" in missions)
check("Papéis não podem exceder a capacidade", "coopRoleCapacity" in missions and "coopRoleTaken" in missions)
check("Todos precisam estar prontos", "participants.some(item=>!item.ready)" in missions)
check("Bots usam rota viária e velocidade determinísticas", "bot.coopRaceT=0" in missions and
      "bot.coopRaceSpeed=.055+index*.004" in missions and "coopStreetRoutePoint" in missions)
check("Bots desaceleram perto do jogador", "nearPlayer?.55:1" in missions)
check("Bots não fecham volta em diagonal", "route=[[45+lane,82]" not in missions and "bot.coopRaceFinished=true" in missions)
check("Mapa inclui participantes online", "onlinePlayerMapLocations" in map_source and
      "group:'Jogadores online'" in map_source)
check("Missão ativa tem prioridade no agrupamento", "loc.missionTarget" in map_source and
      "loc.coopTarget" in map_source)
check("Mapa recalcula em resize e orientação", "refreshOpenMapAfterResize" in map_source and
      "orientationchange" in map_source)
check("Tela baixa tem regra dedicada", "max-height:430px" in styles)
check("Modal usa dimensões reais do aparelho", "100dvh" in styles and "100vw" in styles)

failed = [name for name, passed in checks if not passed]
summary = {
    "passed": not failed,
    "counts": {"passed": len(checks) - len(failed), "failed": len(failed), "total": len(checks)},
    "checks": [{"name": name, "passed": passed} for name, passed in checks],
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
raise SystemExit(1 if failed else 0)
