// ===============================
// ⚡ AC-EV-Charging-Time Service Worker
// ===============================

const CACHE_NAME = 'ev-static-cache-v1';

// cache เฉพาะ static files
const STATIC_FILES = [
  './offline.html',
  './icon-192.png',
  './icon-512.png'
];

// -------------------------------
// INSTALL
// -------------------------------
self.addEventListener('install', event => {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
  );

});

// -------------------------------
// ACTIVATE
// -------------------------------
self.addEventListener('activate', event => {

  event.waitUntil(

    caches.keys().then(names => {

      return Promise.all(

        names.map(name => {

          if (name !== CACHE_NAME) {

            console.log('[SW] Delete old cache:', name);

            return caches.delete(name);

          }

        })

      );

    }).then(() => self.clients.claim())

  );

});

// -------------------------------
// FETCH
// -------------------------------
self.addEventListener('fetch', event => {

  // GET only
  if (event.request.method !== 'GET') return;

  // ข้าม browser-extension
  if (
    event.request.url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // ---------------------------
  // HTML = Network First
  // ---------------------------
  if (event.request.destination === 'document') {

    event.respondWith(

      fetch(event.request)
        .then(response => {

          return response;

        })
        .catch(() => {

          return caches.match('./offline.html');

        })

    );

    return;

  }

  // ---------------------------
  // Static files = Cache First
  // ---------------------------
  event.respondWith(

    caches.match(event.request)
      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then(response => {

            // response invalid
            if (!response || response.status !== 200) {
              return response;
            }

            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });

            return response;

          });

      })

  );

});

console.log('[SW] Ready');