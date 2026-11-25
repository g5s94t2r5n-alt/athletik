// Offline-Cache: App läuft im Gym auch ohne Netz. Claude-Anfragen gehen immer live ans Netz.
// App-Dateien werden bei jedem Laden beim Server nachgefragt (no-cache = Revalidierung),
// damit Updates sofort ankommen und nicht im Browser-Cache hängen bleiben.
const VERSION = 'athletik-v40';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/design-d.css',
  'js/app.js', 'js/store.js', 'js/engine.js', 'js/exercises.js', 'js/coach.js', 'js/charts.js', 'js/goals.js', 'js/demo.js', 'trailer.html',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' → frisch vom Server, nie aus einem veralteten Browser-Cache
  e.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (e) => {
  if (e.data === 'version' && e.source) e.source.postMessage({ type: 'version', version: VERSION });
});

const fresh = (req) => {
  if (req.mode === 'navigate') {
    return fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => (res.redirected ? Response.redirect(res.url, 302) : res));
  }
  return fetch(req, { cache: 'no-cache' });
};

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname === 'api.anthropic.com') return;
  // Claude-SDK vom CDN: versioniert, daher Cache zuerst
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
  // App-Dateien: Netz zuerst (frisch), offline aus dem Cache
  e.respondWith(fresh(e.request).then((res) => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then((r) => r || caches.match('index.html'))));
});
