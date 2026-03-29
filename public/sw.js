const CACHE_VERSION = 'v2';
const CACHE_NAME = 'clear-field-' + CACHE_VERSION;
const API_CACHE = 'clear-api-' + CACHE_VERSION;
const API_HOST = 'friendly-achievement-production.up.railway.app';

self.addEventListener('install', (e) => {
  // Force activate immediately — don't wait for old tabs
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API: network-first, cache fallback
  if (url.hostname === API_HOST) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok && e.request.method === 'GET') {
            const clone = res.clone();
            caches.open(API_CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // HTML pages: ALWAYS network-first (never serve stale HTML)
  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (JS/CSS/images): cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
