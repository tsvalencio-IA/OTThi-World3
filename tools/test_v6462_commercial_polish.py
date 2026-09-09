#!/usr/bin/env python3
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]


def text(relative: str) -> str:
    return (ROOT / relative).read_text('utf-8')


class CommercialPolishTests(unittest.TestCase):
    def test_map_is_dynamic_square_and_viewport_fitted(self):
        source = text('src/modules/08-map-parent-settings.js')
        css = text('src/styles/14-commercial-responsive-map-missions-furniture.css')
        for token in ['missionMapLocations', 'serviceVehicleMapLocation', 'fitMapToViewport', 'mapMarkerPlacements', "mission-target"]:
            self.assertIn(token, source)
        self.assertIn("aspect-ratio:1/1!important", css)
        self.assertIn("grid-template-rows:minmax(0,1fr) auto auto", css)
        self.assertIn("@media(orientation:landscape) and (max-height:520px)", css)
        self.assertIn("@media(orientation:portrait)", css)
        self.assertNotIn("ResizeObserver", source, 'O modal não deve deixar observers órfãos ao fechar')

    def test_assigned_service_vehicle_is_real_map_target(self):
        emergency = text('src/modules/16-emergency-services.js')
        map_source = text('src/modules/08-map-parent-settings.js')
        careers = text('src/modules/22-careers-jobs-uniforms.js')
        for token in ['serviceVehicleMapLocation', 'serviceMissionVehicle', 'missionTarget:true', "id:`service-${vehicle.id}`", 'reserveMissionServiceVehicle']:
            self.assertIn(token, emergency)
        self.assertIn('...missionMapLocations()', map_source)
        self.assertIn('missionBriefingMarkup', careers)
        self.assertIn('marcado no GPS', careers)
        self.assertIn('missionInstructionSteps', careers)

    def test_mission_card_opens_one_clear_briefing(self):
        missions = text('src/modules/06-missions-profile-hud-inventory-tools.js')
        css = text('src/styles/14-commercial-responsive-map-missions-furniture.css')
        self.assertIn('missionBriefingMarkup(job)', missions)
        self.assertIn('Marcar próximo passo no GPS', missions)
        self.assertEqual(missions.count("$('[data-objective-map]',root)?.addEventListener"), 1)
        self.assertIn("TOQUE PARA VER A MISSÃO", css)
        self.assertIn('.mission-step-list', css)

    def test_room_furniture_is_persistent_and_editable(self):
        defaults = text('src/modules/01-build-persistence.js')
        persistence = text('src/modules/02-state-save-cloud-account.js')
        life = text('src/modules/19-campfire-hunting-house-extensions.js')
        diagnostics = text('src/modules/09-responsive-ar-quality-diagnostics.js')
        self.assertIn('roomFurniture: []', defaults)
        self.assertIn('roomFurniture:', persistence)
        self.assertIn('mergeEntityCollections(state.roomFurniture,remote.roomFurniture)', persistence)
        self.assertIn('extensionFurniture:[]', diagnostics)
        for token in [
            'ROOM_FURNITURE_CATALOG', 'openFurnitureManager', 'openFurniturePlacement',
            'renderExtensionFurniture', 'removeRoomFurniture', 'data-add-furniture',
            'data-move-furniture', 'data-remove-furniture', 'data-furniture-rotate'
        ]:
            self.assertIn(token, life)
        for room in ['bedroom', 'living', 'kitchen', 'bathroom', 'workroom', 'porch', 'storage']:
            self.assertIn(f'{room}:[', life)

    def test_uniforms_follow_animated_limbs(self):
        avatar = text('src/modules/11-render-materials-player-model.js')
        for token in [
            'avatarPartLayer', 'avatarAttachments', "parts.leftArm", "parts.rightArm",
            "parts.leftLeg", "parts.rightLeg", 'dressAnimatedAvatar', 'uniformPalette',
            "'POLÍCIA'", "'BOMBEIROS'", "'RESGATE'", 'addUniformPatch'
        ]:
            self.assertIn(token, avatar)
        self.assertIn("playerModel.userData.avatarAttachments=[]", avatar)

    def test_new_style_is_last_and_build_outputs_match(self):
        order = json.loads(text('src/module-order.json'))
        self.assertIn('src/styles/14-commercial-responsive-map-missions-furniture.css', [item['file'] for item in order['styles']])
        self.assertLess([item['file'] for item in order['styles']].index('src/styles/15-coop-map-responsive-v6463.css'), [item['file'] for item in order['styles']].index('src/styles/16-otthi-world-professional-v700.css'))
        self.assertLess([item['file'] for item in order['styles']].index('src/styles/16-otthi-world-professional-v700.css'), [item['file'] for item in order['styles']].index('src/styles/17-gm-admin-panel-v701.css'))
        self.assertLess([item['file'] for item in order['styles']].index('src/styles/17-gm-admin-panel-v701.css'), [item['file'] for item in order['styles']].index('src/styles/18-world-evolution-v702.css'))
        self.assertLess([item['file'] for item in order['styles']].index('src/styles/18-world-evolution-v702.css'), [item['file'] for item in order['styles']].index('src/styles/19-mobile-landscape-authority-v7051.css'))
        self.assertIn('src/styles/19-mobile-landscape-authority-v7051.css', [x['file'] for x in order['styles']])
        self.assertEqual(order['styles'][-1]['file'], 'src/styles/20-global-readability-responsive-r14.css')
        app = text('app.js')
        style = text('style.css')
        for token in ['serviceVehicleMapLocation', 'openFurnitureManager', 'dressAnimatedAvatar']:
            self.assertIn(token, app)
        self.assertIn('Camada final intencional: resolve conflitos históricos', style)


if __name__ == '__main__':
    unittest.main(verbosity=2)
