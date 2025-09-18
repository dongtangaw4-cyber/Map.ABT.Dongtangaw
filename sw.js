// sw.js
const CACHE = 'abt-map-v1';
const SHELL = [
  './',
  './map.html',
  './manifest.json',
  './icon.png',
  './offline.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./offline.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});