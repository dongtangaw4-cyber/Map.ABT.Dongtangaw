// sw.js
const VERSION = 'v7';               // <-- เปลี่ยนเลขทุกครั้งที่แก้โค้ดสำคัญ
const STATIC_CACHE = `static-${VERSION}`;

const STATIC_ASSETS = [
  '/',               // เผื่อกรณีเปิด root
  '/map.html',
  '/manifest.json',
  '/Background.png',
  '/welcome.png',
  '/logo.png',
  // ถ้ามีไฟล์อื่น ๆ ใส่เพิ่มได้ เช่น icon ต่าง ๆ
];

// ติดตั้ง: cache ไฟล์คงที่
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();               // ข้ามรอเวอร์ชันเก่า
});

// เปิดใช้งาน: ลบ cache เก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== STATIC_CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();             // ควบคุมแท็บทันที
});

// กลยุทธ์ดึงไฟล์
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ให้ HTML เป็น network-first (ได้เวอร์ชันล่าสุดก่อนเสมอ)
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(networkFirst(req));
  } else {
    // อื่น ๆ ใช้ cache-first
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    const cache = await caches.open(STATIC_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    return cached || new Response('Offline', { status: 503 });
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

// รับข้อความจากหน้าเว็บเพื่อสั่ง skipWaiting (กรณีแจ้งผู้ใช้ก่อน)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});