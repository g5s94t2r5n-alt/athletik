// Offline-Cache: App läuft im Gym auch ohne Netz. Claude-Anfragen gehen immer live ans Netz.
const VERSION = 'athletik-v14';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/design-d.css',
  'js/app.js', 'js/store.js', 'js/engine.js', 'js/exercises.js', 'js/coach.js', 'js/charts.js', 'js/goals.js', 'js/demo.js', 'trailer.html',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname === 'api.anthropic.com') return;
  // App-Dateien: erst Netz (für Updates), dann Cache. SDK vom CDN: Cache zuerst (versioniert).
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
