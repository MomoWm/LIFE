// LIFE app-shell service worker.
//
// Expo's static web export content-hashes every JS/CSS file under
// _expo/static/ (the filename changes when the content does), so those are
// safe to cache-first forever. index.html and manifest.json are not
// hashed — they're the pointer to "which hashed bundle is current" — so they
// go network-first with a cache fallback for offline launches. Bumping
// CACHE_VERSION busts everything at once; deploys otherwise never leave a
// user stuck on a stale bundle, since network-first for index.html means the
// next online load always picks up the new asset references.
const CACHE_VERSION = 'life-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isHashedAsset(url) {
  return url.pathname.startsWith('/_expo/static/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for the app shell itself, falling back to cache so a
  // previously-installed app still opens with no connection.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/index.html')))
  );
});
