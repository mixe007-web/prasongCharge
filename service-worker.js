// ===============================
// ⚡ AC-EV-Charging-Time Service Worker (Fixed v2)
// ===============================

const CACHE_NAME = 'ev-time-calculator-v2';
const urlsToCache = [
  './index.html',
  './AC-EV-Charging-Time.html',
  './offline.html',
  './icon-192.png',
  './icon-512.png'
];

// ติดตั้งและ cache ไฟล์
self.addEventListener('install', event => {
  console.log('[SW] Installing and caching files...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(async url => {
          try {
            await cache.add(url);
            console.log('[SW] ✅ Cached:', url);
          } catch (err) {
            console.warn('[SW] ⚠️ Skipped:', url, err);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// ดัก fetch
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  try {
    const reqURL = new URL(event.request.url);
    if (reqURL.protocol.startsWith('chrome-extension')) return;
  } catch (err) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('[SW] Serve from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // ถ้าโหลดไม่ได้ และเป็น HTML (document) → แสดง offline.html
        if (event.request.destination === 'document') {
          console.warn('[SW] Offline fallback triggered');
          return caches.match('./offline.html');
        }
      });
    })
  );
});

// ล้าง cache เก่า
self.addEventListener('activate', event => {
  console.log('[SW] Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

console.log('[SW] ⚡ AC-EV-Charging-Time Service Worker v2 ready.');
