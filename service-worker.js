// ===============================
// ⚡ AC-EV-Charging-Time Service Worker (Auto-Update v4)
// ===============================

const CACHE_NAME = 'ev-time-calculator-v5'; // ← เปลี่ยน version ทุกครั้งที่อัปโหลด
const urlsToCache = [
  './index.html',
  './AC-EV-Charging-Time.html',
  './offline.html',
  './icon-192.png',
  './icon-512.png'
];

// -------------------------------
// 📦 INSTALL
// -------------------------------
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

  // ⚡ สำคัญ: บังคับให้ SW ตัวใหม่ activate ทันที
  self.skipWaiting();
});

// -------------------------------
// ♻️ ACTIVATE (อัปเดตอัตโนมัติ)
// -------------------------------
self.addEventListener('activate', event => {
  console.log('[SW] Activated — clearing old cache...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] 🗑️ Removing old cache:', name);
            return caches.delete(name);
          }
        })
      )
    ).then(async () => {
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        // ✅ แจ้งให้หน้าเว็บ reload เอง
        client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
      }
    })
  );
});


// -------------------------------
// 🌐 FETCH
// -------------------------------
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  try {
    const reqURL = new URL(event.request.url);
    if (reqURL.protocol.startsWith('chrome-extension')) return;
  } catch {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./offline.html');
        }
      });
    })
  );
});

console.log('[SW] ⚡ AC-EV-Charging-Time Service Worker v4 ready.');
