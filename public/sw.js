// Hidden Property Intel — Service Worker v2
// Network-first strategy: no JS chunk caching (prevents stale React copies).
// Caches only the navigation shell for basic offline support + PWA installability.

const CACHE_VERSION = 'hpi-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;

// Only cache the root navigation request, not JS/CSS/API chunks.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add('/')).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept API calls, auth, or backend functions — always go to network.
  if (
    url.pathname.startsWith('/functions/') ||
    url.hostname.includes('base44.app') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis.com')
  ) {
    return;
  }

  // Navigation requests (page loads): network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('/').then((r) => r || caches.match(request)))
    );
    return;
  }

  // Static assets (images, fonts): stale-while-revalidate.
  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
