const REVISION = '6a8ca173f2dcabe5';
const CACHE = `otthi-v70615-${REVISION}`;
const CACHE_PREFIXES = ['otthi-','otthi-game-web-','otthos-life-world-main-'];
const BUILD = '705.16.7.16-multiplayer-core-v2-r1680';
const VERSION = '705';
const RELEASE_MANIFEST = './release-manifest.json?v=70615';

const REQUIRED_SHELL = [
  './index.html?v=70615',
  './style.css?v=70615',
  './assets/vendor/three-r128.min.js?v=70615',
  './assets/js/core/runtime-config.js?v=70615',
  './assets/js/core/safe-pointer.js?v=70615',
  './assets/js/core/viewport-manager.js?v=70615',
  './assets/js/save-db.js?v=70615',
  './firebase-config.js?v=70615',
  './assets/js/game-account.js?v=70615',
  './assets/js/multiplayer-rtdb.js?v=70615',
  './app.js?v=70615',
  './assets/js/ui/shared-modal.js?v=70615',
  './assets/js/core/performance-guardian.js?v=70615',
  './assets/js/multiplayer/room-manager.js?v=70615',
  './assets/js/education/adaptive-learning.js?v=70615',
  './assets/js/safety/child-safety.js?v=70615',
  './manifest.webmanifest?v=70615'
];

const OPTIONAL_ASSETS = [
  './404.html',
  './athos.glb',
  './assets/textures/asphalt-v628.png',
  './assets/textures/brick-v628.png',
  './assets/textures/bus-seat-v628.png',
  './assets/textures/gold-ore-v628.png',
  './assets/textures/grass-v628.png',
  './assets/textures/interior-floor-v628.png',
  './assets/textures/police-wall-v628.png',
  './assets/textures/roof-v628.png',
  './assets/textures/school-wall-v628.png',
  './assets/textures/stone-v628.png',
  './assets/textures/wood-v628.png',
  './assets/textures/sidewalk-v632.png',
  './assets/textures/interior-wall-v632.png',
  './assets/textures/home-floor-v632.png',
  './assets/textures/market-floor-v632.png',
  './assets/textures/market-wall-v632.png',
  './assets/textures/school-floor-v632.png',
  './assets/textures/fire-station-wall-v632.png',
  './assets/textures/concrete-v632.png',
  './assets/textures/city-glass-v632.png',
  './assets/textures/emergency-metal-v632.png',
  './assets/world/pbr-manifest.json',
  './assets/branding/thiaguinho-solucoes-digitais.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];

function freshRequest(resource) {
  const source = typeof resource === 'string' ? resource : resource.url;
  const external = /^https?:/i.test(source) && new URL(source).origin !== self.location.origin;
  return new Request(source, {
    cache: 'no-store',
    mode: external ? 'cors' : 'same-origin',
    credentials: external ? 'omit' : 'same-origin'
  });
}

function releasePath(resource) {
  const source = typeof resource === 'string' ? resource : resource.url;
  const url = new URL(source, self.registration.scope);
  const scope = new URL(self.registration.scope);
  let path = decodeURIComponent(url.pathname);
  if (path.startsWith(scope.pathname)) path = path.slice(scope.pathname.length);
  path = path.replace(/^\.?\//, '');
  return !path || path.endsWith('/') ? 'index.html' : path;
}

async function sha256(response) {
  const bytes = await response.clone().arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function verifyResponse(response, resource, manifest) {
  if (!response || !response.ok) throw new Error(`HTTP ${response?.status || 0}`);
  const path = releasePath(resource);
  const expected = manifest?.files?.[path];
  if (!/^[a-f0-9]{64}$/.test(String(expected || ''))) {
    throw new Error(`Hash ausente para ${path}`);
  }
  const actual = await sha256(response);
  if (actual !== expected) throw new Error(`SHA-256 divergente em ${path}`);
  return response;
}

async function fetchReleaseManifest() {
  const response = await fetch(freshRequest(RELEASE_MANIFEST));
  if (!response?.ok) throw new Error(`Manifesto da release: HTTP ${response?.status || 0}`);
  const manifest = await response.clone().json();
  if (String(manifest?.version) !== VERSION || manifest?.build !== BUILD
    || manifest?.revision !== REVISION || manifest?.algorithm !== 'SHA-256') {
    throw new Error('Manifesto e service worker pertencem a versões diferentes');
  }
  if (!manifest.files || typeof manifest.files !== 'object') throw new Error('Manifesto sem hashes');
  return { manifest, response };
}

async function fetchAndCacheOptional(cache, resource) {
  try {
    const response = await fetch(freshRequest(resource));
    if (!response || (!response.ok && response.type !== 'opaque')) throw new Error(`HTTP ${response?.status || 0}`);
    await cache.put(resource, response.clone());
    return { resource, ok:true };
  } catch (error) {
    return { resource, ok:false, error:String(error?.message || error) };
  }
}

async function cacheApplicationShell() {
  const { manifest, response:manifestResponse } = await fetchReleaseManifest();
  const verified = [];
  for (const resource of REQUIRED_SHELL) {
    const response = await fetch(freshRequest(resource));
    await verifyResponse(response, resource, manifest);
    verified.push({ resource, response });
  }
  await caches.delete(CACHE);
  const cache = await caches.open(CACHE);
  await cache.put(RELEASE_MANIFEST, manifestResponse.clone());
  for (const { resource, response } of verified) {
    await cache.put(resource, response.clone());
    if (releasePath(resource) === 'index.html') await cache.put('./', response.clone());
  }
  const optional = await Promise.all(OPTIONAL_ASSETS.map(resource => fetchAndCacheOptional(cache, resource)));
  const failed = optional.filter(item => !item.ok);
  if (failed.length) console.warn('[OTTHI SW] Recursos opcionais não pré-cacheados:', failed);
}

self.addEventListener('install', event => {
  event.waitUntil(cacheApplicationShell()
    .then(() => self.skipWaiting())
    .catch(async error => {
      await caches.delete(CACHE);
      console.error('[OTTHI SW] Release incompleta; cache anterior preservado.', error);
      throw error;
    }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => CACHE_PREFIXES.some(prefix => name.startsWith(prefix)) && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    clients.forEach(client => client.postMessage({ type:'OTTHI_GAME_UPDATE_READY', build:BUILD, version:VERSION }));
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'PURGE_OTTHI_GAME_CACHE') {
    event.waitUntil(caches.keys().then(names => Promise.all(
      names.filter(name => CACHE_PREFIXES.some(prefix => name.startsWith(prefix))).map(name => caches.delete(name))
    )));
  }
});

async function activeReleaseManifest(cache) {
  const response = await cache.match(RELEASE_MANIFEST);
  if (!response) throw new Error('Manifesto da release ativa ausente');
  const manifest = await response.json();
  if (String(manifest?.version) !== VERSION || manifest?.build !== BUILD || manifest?.revision !== REVISION) {
    throw new Error('Manifesto da release ativa inválido');
  }
  return manifest;
}

async function cachedFallback(cache, request, navigation) {
  if (navigation) {
    return await cache.match('./index.html?v=70615') || await cache.match('./') || null;
  }
  return await cache.match(request, { ignoreSearch:false })
    || await cache.match(new URL(request.url).pathname, { ignoreSearch:true })
    || null;
}

async function networkFirst(request, navigation = false) {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  const probe = url.searchParams.has('otthi_probe');
  if (probe) return fetch(request, { cache:'no-store' });
  if (releasePath(request) === 'release-manifest.json') {
    return await cache.match(RELEASE_MANIFEST) || fetch(request, { cache:'no-store' });
  }
  try {
    const response = await fetch(request, { cache:'no-store' });
    if (!response?.ok) {
      const cached = await cachedFallback(cache, request, navigation);
      return cached || response;
    }
    const manifest = await activeReleaseManifest(cache);
    const protectedFile = Object.prototype.hasOwnProperty.call(manifest.files || {}, releasePath(request));
    if (protectedFile) {
      try {
        await verifyResponse(response, request, manifest);
      } catch (error) {
        const cached = await cachedFallback(cache, request, navigation);
        if (cached) return cached;
        throw error;
      }
    }
    if (navigation) {
      await cache.put('./', response.clone());
    } else {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cachedFallback(cache, request, navigation);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch:false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;

  const navigation = event.request.mode === 'navigate';
  const code = /\.(?:js|css|html|webmanifest|json)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (navigation || code || url.searchParams.has('otthi_probe')) {
    event.respondWith(networkFirst(event.request, navigation));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});
