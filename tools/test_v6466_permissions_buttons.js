'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const rules = JSON.parse(read('firebase-database.rules.json')).rules.otthosWorld;
const multiplayer = read('assets/js/multiplayer-rtdb.js');
const coop = read('src/modules/32-cooperative-missions.js');
const social = read('src/modules/28-multiplayer-social-online.js');

let passed = 0;
function check(label, test) {
  assert.ok(test, label);
  passed++;
}

function hasValidation(node) {
  if (!node || typeof node !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(node, '.validate')) return true;
  return Object.entries(node).some(([key, value]) => !key.startsWith('.') && hasValidation(value));
}

function hasNestedWrite(node) {
  if (!node || typeof node !== 'object') return false;
  return Object.entries(node).some(([key, value]) => {
    if (key.startsWith('.')) return false;
    return Boolean(value && typeof value === 'object' && (
      Object.prototype.hasOwnProperty.call(value, '.write') || hasNestedWrite(value)
    ));
  });
}

const users = rules.users['$uid'];
const room = rules.rooms['$roomId'];

for (const [branchName, recordKey, identityToken] of [
  ['inbox', '$giftId', 'senderUid'],
  ['interactions', '$eventId', 'senderUid'],
  ['challenges', '$challengeId', 'fromUid'],
  ['socialRequests', '$requestId', 'fromUid']
]) {
  const record = users[branchName][recordKey];
  check(`${branchName}: escrita autenticada e vinculada à identidade`, typeof record['.write'] === 'string' && record['.write'].includes('auth.uid') && record['.write'].includes(identityToken));
  check(`${branchName}: sem validação bloqueadora`, !hasValidation(record));
}

const presenceRecord = room.presence['$uid'];
check('presence: próprio UID ou GM escreve', presenceRecord['.write'].includes('auth.uid === $uid') && presenceRecord['.write'].includes('admins'));
check('presence: sem validação bloqueadora de campos compatíveis', !hasValidation(presenceRecord));

for (const [branchName, recordKey, identityToken] of [
  ['chat', '$messageId', 'senderUid'],
  ['houses', '$houseId', 'ownerUid'],
  ['gameSessions', '$sessionId', 'fromUid'],
  ['boats', '$boatId', 'driverUid'],
  ['campfires', '$ownerUid', '$ownerUid'],
  ['houseExtensions', '$ownerUid', '$ownerUid'],
  ['slots', '$slotId', 'uid'],
  ['coopMissions', '$missionId', 'hostUid']
]) {
  const record = room[branchName][recordKey];
  check(`${branchName}: gameplay autenticado com vínculo de identidade`, typeof record['.write'] === 'string' && record['.write'].includes('auth') && record['.write'].includes(identityToken));
  check(`${branchName}: sem validação bloqueadora`, !hasValidation(record));
}

check('Gameplay usa regras internas somente para identidade/progresso', room.coopMissions['$missionId'].participants['$participantUid']['.write'].includes('auth.uid === $participantUid') && room.coopMissions['$missionId'].progress['.write'].includes('participants'));

check('Moderação: somente GM pode alterar usuário comum', rules.userModeration['$uid']['.write'].includes('admins') && rules.userModeration['$uid']['.write'].includes('auth.uid !== $uid') && rules.userModeration['$uid']['.write'].includes("admins').child($uid).val() !== true"));
check('Moderação: usuário lê somente o próprio estado', rules.userModeration['$uid']['.read'].includes('auth.uid === $uid') && rules.userModeration['$uid']['.read'].includes('admins'));
check('Auditoria de moderação: somente GM e append-only', rules.gmModerationAudit['$eventId']['.write'].includes('admins') && rules.gmModerationAudit['$eventId']['.write'].includes('!data.exists()'));
check('Conta permanece privada e permite exclusão pelo GM', rules.gameAccounts['$uid']['.write'].includes('auth.uid === $uid') && rules.gameAccounts['$uid']['.write'].includes('admins'));
check('Progresso permanece privado', users.progress['.write'] === 'auth != null && auth.uid === $uid');
check('Limite de tempo exige conta e autenticação recente', users.guardianSettings['.write'].includes('auth.token.email') && users.guardianSettings['.write'].includes('auth_time'));
check('Slots não escrevem o nó pai', !room.slots['.write']);

const reserveBody = multiplayer.slice(multiplayer.indexOf('async function reserveRoomSlot('), multiplayer.indexOf('function configure('));
check('Reserva usa transação individual', reserveBody.includes('reserveRoomSlotIndividually'));
check('Reserva não tenta transação no nó pai', !reserveBody.includes('runTransaction(slotsRef'));
const listenerBody = multiplayer.slice(multiplayer.indexOf('function listenerError('), multiplayer.indexOf('async function connect('));
check('Erro opcional não derruba o multiplayer', !listenerBody.includes("'otthos:mp-status'") && listenerBody.includes("'otthos:firebase-warning'"));
check('Interação remota trata falha sem exceção', multiplayer.includes("listenerError('interação')(error);return false"));
check('Resposta social não depende da notificação secundária', multiplayer.includes("sendInteraction(request.fromUid,{type:'socialRequestResult'") && multiplayer.includes('.catch(()=>false)'));

for (const id of ['firefighter', 'paramedic', 'police', 'fishing', 'school', 'streetRace', 'ovalRace']) {
  check(`Missão ${id} disponível`, coop.includes(`${id}:{id:'${id}'`));
}

for (const selector of [
  'data-create-coop',
  'data-create-competitive',
  'data-create-solo',
  'data-join-coop',
  'data-coop-role',
  'data-coop-ready',
  'data-coop-start',
  'data-coop-solo',
  'data-coop-gps',
  'data-coop-offline',
  'data-coop-leave'
]) {
  check(`Botão ${selector} renderizado`, coop.includes(selector));
}

check('Botões cooperativos têm trava contra clique duplo', coop.includes('bindCoopActionButton') && coop.includes("dataset.coopBusy==='1'"));
check('Coop tem fallback solo para regra antiga', coop.includes('coopPermissionDenied') && coop.includes("coopLocalRecord(template,'solo',role)"));
check('Botões do jogador têm trava contra clique duplo', social.includes("dataset.actionBusy==='1'"));
check('Falha de presente e aceno permanece visível', social.includes('A ação não foi enviada. Confirme se as regras Firebase'));
check('Desafios educacionais continuam ligados', social.includes("data-challenge-type=\"math\"") && social.includes('sendGameChallenge'));
check('Jogos online continuam ligados', social.includes('data-play-session') && social.includes('launchSessionWithCountdown'));

console.log(`V646.6 permissões e botões: ${passed}/${passed} aprovados.`);
