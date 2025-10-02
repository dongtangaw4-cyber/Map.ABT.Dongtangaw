// sw.js
const VERSION = 'v17';                       // ← เปลี่ยนเลขทุกครั้งที่อัป
const STATIC_CACHE = `abt-static-${VERSION}`;

const STATIC_ASSETS = [
  './',
  './map.html',
  './offline.html',
  './manifest.json',
  './Background.png',
  './welcome.png',
  './logo.png',
  './icon.png',
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();                        // ใช้ SW ใหม่ทันที
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== STATIC_CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');
  if (isHTML) {
    event.respondWith(networkFirst(req));    // HTML → เวอร์ชันล่าสุดก่อน
  } else {
    event.respondWith(cacheFirst(req));      // ไฟล์อื่น cache-first
  }
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    const cache = await caches.open(STATIC_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cache = await caches.open(STATIC_CACHE);
    return (await cache.match(req)) || await cache.match('./offline.html');
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  cache.put(req, fresh.clone());
  return fresh;
}

// รับคำสั่งจากหน้าเว็บให้ข้าม waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }

});


