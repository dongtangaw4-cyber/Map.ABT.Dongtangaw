// sw.js
const VERSION = 'v20'; // ← เปลี่ยนเลขทุกครั้งที่อัป
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
  './updates.json',
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap'
];

// ติดตั้ง Service Worker และแคชไฟล์ทั้งหมด
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // ใช้ SW ใหม่ทันที
});

// ล้างแคชเก่าเมื่อเวอร์ชันใหม่มา
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== STATIC_CACHE) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// กลยุทธ์ cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

// ดึง HTML ใหม่ก่อน ถ้าไม่ได้ให้ใช้ cache/offline.html
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

// ดึงจาก cache ก่อน ถ้าไม่มีค่อยโหลดใหม่
async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  cache.put(req, fresh.clone());
  return fresh;
}

// ฟังข้อความจากหน้าเว็บเพื่อ skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});