'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const VERSION_INFO = JSON.parse(fs.readFileSync(path.join(ROOT, 'VERSION.json'), 'utf8'));
const ASSET_VERSION = String(VERSION_INFO.assetVersion ?? (Number(VERSION_INFO.version || 0) * 10));

function loadMultiplayerTestingApi() {
  const source = fs.readFileSync(path.join(ROOT, 'assets/js/multiplayer-rtdb.js'), 'utf8');
  const runtime = {
    console,
    crypto: webcrypto,
    performance,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    CustomEvent: class CustomEvent {
      constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
    },
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {},
    },
  };
  runtime.window = runtime;
  runtime.globalThis = runtime;
  runtime.dispatchEvent = () => true;
  runtime.addEventListener = () => {};
  runtime.OTTHI_CONFIG = {
    firebaseRoot: 'otthosWorld',
    defaultRoom: 'bairro-central',
    rooms: [
      'bairro-central',
      'bairro-floresta',
      'bairro-lago',
      'bairro-montanha',
      'bairro-escola',
    ].map(id => ({ id, capacity: 10 })),
    multiplayer: { maxPlayersPerRoom: 10 },
  };
  vm.runInNewContext(source, runtime, { filename: 'multiplayer-rtdb.js' });
  return runtime.OTTHOS_RTDB.__testing;
}

function testProductionSlotUpdater() {
  const api = loadMultiplayerTestingApi();
  let slots = {};
  for (let index = 1; index <= 10; index += 1) {
    const uid = `user-${index}`;
    const result = api.reserveSlotSnapshot(slots, {
      uid,
      name: `Jogador ${index}`,
      room: 'bairro-central',
      capacity: 10,
      nowClient: 100000,
      nowServer: 100000,
      serverTimestamp: 100000,
    });
    assert.ok(result, `reserva ${index} deveria existir`);
    slots = result.slots;
  }
  assert.equal(Object.keys(slots).length, 10);
  assert.equal(new Set(Object.values(slots).map(item => item.uid)).size, 10);
  assert.equal(api.reserveSlotSnapshot(slots, {
    uid: 'user-11',
    name: 'Jogador 11',
    room: 'bairro-central',
    capacity: 10,
    nowClient: 120000,
    nowServer: 120000,
    serverTimestamp: 120000,
  }), null);

  const sameUser = api.reserveSlotSnapshot(slots, {
    uid: 'user-3',
    name: 'Jogador 3',
    room: 'bairro-central',
    capacity: 10,
    nowClient: 120000,
    nowServer: 120000,
    serverTimestamp: 120000,
  });
  assert.equal(sameUser.slotKey, 'slot-03');
  assert.equal(Object.values(sameUser.slots).filter(item => item.uid === 'user-3').length, 1);

  const staleSlots = structuredClone(slots);
  staleSlots['slot-04'].updatedAt = 1;
  staleSlots['slot-04'].updatedAtClient = 1;
  const recovered = api.reserveSlotSnapshot(staleSlots, {
    uid: 'new-user',
    name: 'Jogador novo',
    room: 'bairro-central',
    capacity: 10,
    nowClient: 120000,
    nowServer: 120000,
    serverTimestamp: 120000,
  });
  assert.equal(recovered.slotKey, 'slot-04');
  assert.equal(recovered.slots['slot-04'].uid, 'new-user');
  assert.deepEqual(Array.from(api.fixedRoomSlotKeys(10)), [
    'slot-01','slot-02','slot-03','slot-04','slot-05',
    'slot-06','slot-07','slot-08','slot-09','slot-10',
  ]);

  const childReservation = api.reserveSlotRecord(null, {
    slotKey: 'slot-01',
    uid: 'child-user',
    name: 'Jogador TEST',
    room: 'bairro-central',
    nowClient: 200000,
    nowServer: 200000,
    serverTimestamp: 200000,
  });
  assert.equal(childReservation.uid, 'child-user');
  assert.equal(childReservation.slot, 'slot-01');
  assert.equal(api.reserveSlotRecord({...childReservation,uid:'other-user',updatedAt:199999}, {
    slotKey: 'slot-01',
    uid: 'child-user',
    name: 'Jogador TEST',
    room: 'bairro-central',
    nowClient: 200000,
    nowServer: 200000,
    serverTimestamp: 200000,
  }), null, 'a reserva individual não pode tomar uma vaga recente');
  assert.equal(api.reserveSlotRecord({...childReservation,uid:'stale-user',updatedAt:1}, {
    slotKey: 'slot-01',
    uid: 'child-user',
    name: 'Jogador TEST',
    room: 'bairro-central',
    nowClient: 200000,
    nowServer: 200000,
    serverTimestamp: 200000,
  }).uid, 'child-user', 'uma vaga individual expirada deve ser recuperável');
}

function createWorkerRuntime(fetchImpl, cacheImpl, deletedCaches = [], workerConsole = console) {
  class ScopedRequest extends Request {
    constructor(input, options) {
      const source = typeof input === 'string' ? new URL(input, 'https://example.test/').href : input;
      super(source, options);
    }
  }
  const listeners = {};
  const self = {
    location: { origin: 'https://example.test' },
    registration: { scope: 'https://example.test/' },
    clients: {
      claim: async () => {},
      matchAll: async () => [],
    },
    skipWaiting: async () => {},
    addEventListener(type, listener) { listeners[type] = listener; },
  };
  const caches = {
    open: async () => cacheImpl,
    delete: async name => { deletedCaches.push(name); return true; },
    keys: async () => ['otthi-v645-stable'],
  };
  const runtime = {
    self,
    caches,
    fetch: fetchImpl,
    Request: ScopedRequest,
    Response,
    URL,
    crypto: webcrypto,
    console: workerConsole,
    TextEncoder,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(runtime);
  const source = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  new vm.Script(source, { filename: 'sw.js' }).runInContext(runtime);
  return { runtime, listeners };
}

async function testWorkerUsesCacheFor503() {
  let cacheReads = 0;
  const cache = {
    async match(key) {
      cacheReads += 1;
      const url = typeof key === 'string' ? key : key.url;
      if (url.includes('app.js')) return new Response('cached-app', { status: 200 });
      return null;
    },
    async put() {},
  };
  const { runtime } = createWorkerRuntime(
    async () => new Response('server-failure', { status: 503 }),
    cache,
  );
  const networkFirst = vm.runInContext('networkFirst', runtime);
  const response = await networkFirst(new Request(`https://example.test/app.js?v=${ASSET_VERSION}`), false);
  assert.equal(await response.text(), 'cached-app');
  assert.ok(cacheReads > 0, 'o fallback precisa consultar o cache');
}

async function testFailedInstallKeepsPreviousRevision() {
  const source = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const revision = source.match(/const REVISION = '([a-f0-9]+)'/)?.[1];
  assert.ok(revision, 'a revisão imutável deve ser gerada antes do teste');
  const manifest = {
    version: VERSION_INFO.version,
    build: VERSION_INFO.build,
    revision,
    algorithm: 'SHA-256',
    files: { 'app.js': '0'.repeat(64) },
  };
  let fetchCount = 0;
  const deletedCaches = [];
  const cache = { async match() { return null; }, async put() {} };
  const { listeners } = createWorkerRuntime(async request => {
    fetchCount += 1;
    if (String(request.url).includes('release-manifest.json')) {
      return new Response(JSON.stringify(manifest), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('incomplete upload', { status: 503 });
  }, cache, deletedCaches, { log() {}, warn() {}, error() {} });
  let installPromise;
  listeners.install({ waitUntil(promise) { installPromise = promise; } });
  await assert.rejects(installPromise);
  assert.ok(fetchCount >= 2);
  assert.ok(deletedCaches.includes(`otthi-v${ASSET_VERSION}-${revision}`));
  assert.ok(!deletedCaches.includes('otthi-v645-stable'));
}

function testRevisionCoherence() {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'release-manifest.json'), 'utf8'));
  const indexRevision = index.match(/data-otthi-revision="([a-f0-9]+)"/)?.[1];
  const workerRevision = sw.match(/const REVISION = '([a-f0-9]+)'/)?.[1];
  assert.equal(indexRevision, release.revision);
  assert.equal(workerRevision, release.revision);
  assert.ok(sw.includes(`const CACHE = \`otthi-v${ASSET_VERSION}-\${REVISION}\``));
  assert.ok(index.includes(`./assets/vendor/three-r128.min.js?v=${ASSET_VERSION}`));
  assert.ok(!index.includes('cdnjs.cloudflare.com/ajax/libs/three.js'));
}

(async () => {
  testProductionSlotUpdater();
  await testWorkerUsesCacheFor503();
  await testFailedInstallKeepsPreviousRevision();
  testRevisionCoherence();
  console.log('V704 runtime: slots reais, fallback 503, instalação incompleta e revisão coerente aprovados.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
