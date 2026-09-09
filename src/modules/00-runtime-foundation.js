/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 00-runtime-foundation.js
 * Escopo: Runtime, utilitários, versão, storage e chaves de migração
 * Linhas de origem V642: 2-26
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  'use strict';

  const OTTHI_GAME_LIVE_BASE = new URL('./', window.location.href).href;
  const OTTHI_GAME_WEB_BUILD = '705.16.7.16-multiplayer-core-v2-r1680';
  window.OTTHI_GAME_VERSION = 705;
  window.OTTHI_GAME_BUILD = OTTHI_GAME_WEB_BUILD;
  const OTTHI_INDEX_BUILD = document.documentElement?.dataset?.otthiBuild || '';
  const OTTHI_RELEASE_REVISION = document.documentElement?.dataset?.otthiRevision || '';
  window.OTTHI_RELEASE_REVISION = OTTHI_RELEASE_REVISION;
  const OTTHI_CONFIG_BUILD = window.OTTHI_CONFIG?.build || '';
  window.OTTHI_RELEASE_COHERENT = OTTHI_INDEX_BUILD === OTTHI_GAME_WEB_BUILD
    && OTTHI_CONFIG_BUILD === OTTHI_GAME_WEB_BUILD;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const approachNumber=(value,target,step)=>value<target?Math.min(target,value+Math.abs(step)):Math.max(target,value-Math.abs(step));
  const lerpAngle = (a, b, t) => { let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI; if(d<-Math.PI)d+=Math.PI*2; return a+d*t; };
  const distance2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const safePointerCapture=(element,pointerId)=>{try{if(element?.setPointerCapture&&Number.isInteger(pointerId))element.setPointerCapture(pointerId);return true;}catch{return false;}};
  const safePointerRelease=(element,pointerId)=>{try{if(element?.hasPointerCapture?.(pointerId))element.releasePointerCapture(pointerId);return true;}catch{return false;}};
  const APP_VERSION = 705;
  const STORAGE_KEY = 'otthos_life_world_roleplay_v700';
  const LEGACY_STORAGE_KEYS = ['otthos_life_world_roleplay_v646','otthos_life_world_roleplay_v645','otthos_life_world_roleplay_v644','otthos_life_world_roleplay_v643','otthos_life_world_roleplay_v642','otthos_life_world_roleplay_v641','otthos_life_world_roleplay_v640','otthos_life_world_roleplay_v639','otthos_life_world_roleplay_v638','otthos_life_world_roleplay_v637','otthos_life_world_roleplay_v636','otthos_life_world_roleplay_v635','otthos_life_world_roleplay_v634','otthos_life_world_roleplay_v633','otthos_life_world_roleplay_v632','otthos_life_world_roleplay_v631','otthos_life_world_roleplay_v630','otthos_life_world_roleplay_v629','otthos_life_world_roleplay_v628','otthos_life_world_roleplay_v627','otthos_life_world_roleplay_v626','otthos_life_world_roleplay_v625','otthos_life_world_roleplay_v624','otthos_life_world_roleplay_v623','otthos_life_world_roleplay_v622','otthos_life_world_roleplay_v621','otthos_life_world_roleplay_v620','otthos_life_world_roleplay_v619','otthos_life_world_roleplay_v618','otthos_life_world_roleplay_v617','otthos_life_world_roleplay_v616','otthos_life_world_roleplay_v615','otthos_life_world_roleplay_v614','otthos_life_world_roleplay_v613','otthos_life_world_roleplay_v612','otthos_life_world_roleplay_v611','otthos_life_world_roleplay_v610','otthos_life_world_roleplay_v609','otthos_life_world_roleplay_v608','otthos_life_world_roleplay_v607','otthos_life_world_roleplay_v606','otthos_life_world_roleplay_v605','otthos_life_world_roleplay_v604','otthos_life_world_roleplay_v603','otthos_life_world_roleplay_v602','otthos_life_world_roleplay_v601','otthos_life_world_complete_v600'];
  const safeLocalGet = key => { try { return window.localStorage?.getItem(key) ?? null; } catch { return null; } };
  const safeLocalSet = (key, value) => { try { window.localStorage?.setItem(key, value); return true; } catch { return false; } };
  const safeLocalRemove = key => { try { window.localStorage?.removeItem(key); return true; } catch { return false; } };
  const configuredRoomIds = () => (window.OTTHI_CONFIG?.rooms || []).map(item => item.id);
  const normalizeRoomId = value => {
    const candidate = String(value || '').trim();
    const allowed = configuredRoomIds();
    const configuredDefault = String(window.OTTHI_CONFIG?.defaultRoom || '').trim();
    return allowed.includes(candidate)
      ? candidate
      : (allowed.includes(configuredDefault) ? configuredDefault : (allowed[0] || 'bairro-central'));
  };
  const roomDisplayName = value => {
    const id = normalizeRoomId(value);
    return window.OTTHI_CONFIG?.rooms?.find(item => item.id === id)?.name || 'Bairro Central';
  };


  // V638: construções são entidades persistentes. Um save remoto antigo nunca pode apagar o save local.
