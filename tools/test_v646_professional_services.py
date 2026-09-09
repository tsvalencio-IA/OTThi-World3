#!/usr/bin/env python3
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


def text(relative: str) -> str:
    return (ROOT / relative).read_text(encoding='utf-8')


def function_body(source: str, name: str) -> str:
    marker = f'function {name}'
    start = source.find(marker)
    if start < 0:
        raise AssertionError(f'Função ausente: {name}')
    brace = source.find('{', start)
    depth = 0
    quote = None
    escape = False
    for index in range(brace, len(source)):
        char = source[index]
        if quote:
            if escape:
                escape = False
            elif char == '\\':
                escape = True
            elif char == quote:
                quote = None
            continue
        if char in "'\"`":
            quote = char
        elif char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                return source[start:index + 1]
    raise AssertionError(f'Função incompleta: {name}')


class ProfessionalEmergencyServicesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.emergency = text('src/modules/16-emergency-services.js')
        cls.careers = text('src/modules/22-careers-jobs-uniforms.js')
        cls.jobs = text('src/modules/21-interactions-shop-social-races.js')
        cls.avatar = text('src/modules/11-render-materials-player-model.js')
        cls.traffic = text('src/modules/07-navigation-traffic-routes.js')
        cls.bus = text('src/modules/15-transit-bus-metro.js')
        cls.vehicle = text('src/modules/23-vehicle-effects-driving.js')
        cls.multiplayer = text('src/modules/28-multiplayer-social-online.js')

    def test_service_jobs_and_visual_uniforms_exist(self):
        for token in [
            "id:'police'", "id:'firefighter'", "id:'paramedic'",
            "paramedic:'paramedic'", "uniform==='police'",
            "uniform==='firefighter'", "uniform==='paramedic'",
            "'POLÍCIA'", "'BOMBEIROS'", "'RESGATE'",
        ]:
            self.assertIn(token, self.jobs + self.avatar)
        for token in ['addUniformLimb', 'addUniformPatch', 'reflective']:
            self.assertIn(token, self.avatar)

    def test_service_vehicles_are_distinct_enterable_and_reserved(self):
        for token in [
            'SERVICE_DEPOTS', 'registerServiceVehicle', "type:'serviceVehicle'",
            'enterServiceVehicle', 'reserveMissionServiceVehicle',
            'missionReservedFor', 'serviceVehicleId',
            "registerServiceVehicle(car,'police'",
            "registerServiceVehicle(truck,'firefighter'",
            "registerServiceVehicle(ambulance,'paramedic'",
        ]:
            self.assertIn(token, self.emergency)
        enter = function_body(self.emergency, 'enterServiceVehicle')
        self.assertIn('job.serviceVehicleId!==vehicle?.id', enter)
        self.assertIn('required!==kind', enter)

    def test_missions_require_correct_vehicle(self):
        self.assertIn("correctVehicle=isDrivingServiceVehicle('police')", self.careers)
        self.assertIn("isDrivingServiceVehicle('firefighter')", self.careers)
        self.assertIn("isDrivingServiceVehicle(kind)", self.emergency)
        fire_action = function_body(self.emergency, 'helpExtinguishFire')
        self.assertIn('!job.serviceVehicleArrived', fire_action)
        self.assertNotIn('job.serviceVehicleArrived=true', fire_action)
        arrival = function_body(self.emergency, 'markPlayerIncidentArrival')
        self.assertIn('job.serviceVehicleArrived=true', arrival)
        self.assertIn('isDrivingServiceVehicle(kind)', arrival)

    def test_accidents_stop_and_require_all_services(self):
        incident = function_body(self.emergency, 'createTrafficIncidentAt')
        self.assertIn('required:{police:true,paramedic:true,firefighter:true}', incident)
        self.assertIn('lockIncidentActor', incident)
        self.assertIn('dispatchIncidentResponders', incident)
        dispatch = function_body(self.emergency, 'dispatchIncidentResponders')
        for kind in ['police', 'paramedic', 'firefighter']:
            self.assertIn(f"dispatchIncidentResponder(incident,'{kind}')", dispatch)
        lock = function_body(self.emergency, 'lockIncidentActor')
        self.assertIn('incidentLocked=true', lock)
        self.assertIn('Number.MAX_SAFE_INTEGER', lock)
        update = function_body(self.emergency, 'updateTrafficIncidents')
        self.assertIn('required.every', update)
        self.assertIn('resolveTrafficIncident(incident)', update)
        self.assertNotRegex(update, r'setTimeout\s*\(\s*\(\)\s*=>\s*resolveTrafficIncident')

    def test_buses_and_traffic_have_collision_protection(self):
        self.assertIn('radius:3.05', self.bus)
        self.assertIn('incidentLocked:false', self.bus)
        speed = function_body(self.traffic, 'trafficSpeedFactor')
        overlap = function_body(self.traffic, 'resolveTrafficOverlaps')
        for token in ['trafficHoldUntil', 'futureGap', 'factor=0']:
            self.assertIn(token, speed)
        for token in ['for(let pass=0;pass<2;pass++)', 'currentSpeed=0', 'trafficHoldUntil', 'gap=']:
            self.assertIn(token, overlap)

    def test_service_vehicle_visuals_are_local_and_multiplayer_safe(self):
        for token in [
            'applyServiceVehicleVisual', 'OTTHI_SERVICE_', "signTexture('POLÍCIA'",
            "signTexture('RESGATE'", "signTexture('BOMBEIROS'",
        ]:
            self.assertIn(token, self.vehicle)
        for token in ['ghostVehicleKind', 'styleGhostVehicle', 'carServiceLayers']:
            self.assertIn(token, self.multiplayer)
        rules = json.loads(text('firebase-database.rules.json'))
        self.assertIn('rules', rules)


if __name__ == '__main__':
    unittest.main(verbosity=2)
