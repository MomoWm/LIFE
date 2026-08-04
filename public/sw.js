// LIFE app-shell service worker.
//
// Expo's static web export content-hashes every JS/CSS file under
// _expo/static/ (the filename changes when the content does), so those are
// safe to cache-first forever. index.html and manifest.json are not
// hashed — they're the pointer to "which hashed bundle is current" — so they
// go network-first with a cache fallback for offline launches.
//
// Bump CACHE_VERSION to force every existing install to throw its cache away
// on the next activate. That is the only lever that reaches an install which
// has already cached something it should not have.
//
// v2: never cache a response that isn't ok. `fetch` only rejects on network
// failure — a 404 or a 500 resolves normally, so the previous version took the
// success path on an error page, stored it under '/', and served it as the app
// from then on. A deployment alias going away was enough to permanently freeze
// an installed app on Vercel's "deployment not found" page, with no way back
// short of deleting the install: the cache fallback that exists for offline use
// was being handed the error page as its idea of the app.
const CACHE_VERSION = 'life-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

/**
 * Only real, same-origin, successful responses are worth keeping. Opaque
 * cross-origin responses report status 0 and cannot be inspected, so caching
 * one means caching something that might be an error.
 */
function isCacheable(response) {
  return !!response && response.ok && response.type !== 'opaque';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // `addAll` rejects the whole install if any single entry fails, which
      // would leave the app with no worker at all. Each entry is optional.
      .then((cache) =>
        Promise.all(
          APP_SHELL.map((path) =>
            fetch(path)
              .then((response) => (isCacheable(response) ? cache.put(path, response) : undefined))
              .catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
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
          if (isCacheable(response)) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for the app shell, falling back to cache so a
  // previously-installed app still opens with no connection.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        }
        // An error response is still the truth about this request when we have
        // nothing better — but it never becomes the cached app. Prefer a good
        // cached shell if one exists, so a momentarily broken deploy shows the
        // last working app instead of a host error page.
        return caches.match(request).then((cached) => cached ?? caches.match('/index.html')).then((cached) => cached ?? response);
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/index.html')))
  );
});
