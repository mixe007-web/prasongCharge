const CACHE_NAME = 'ev-time-calculator-v1';
const urlsToCache = [
  './index.html',
  '/AC-EV-Charging-Time.html',
  '/offline.html',
  './icon-192.png',
  './icon-512.png'
];

// ติดตั้งและ cache ไฟล์
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing and caching files');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ดัก fetch
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('[SW] Serve from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // ถ้าโหลดไม่ได้ และเป็น HTML (document) → แสดง offline.html
        if (event.request.destination === 'document') {
          return caches.match('/offline.html'); // 👈 ตรงนี้คือจุดที่แก้แล้ว
        }
      });
    })
  );
});

// ล้าง cache เก่า
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
