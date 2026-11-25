// Pixelwright offline support: the app, its icons and the libraries are kept so it opens without a connection.
const CACHE = 'pixelwright-v6';
const LOCAL = ['./', './index.html', './manifest.webmanifest', './privacy.html', './support.html', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const OPTIONAL = ['./vendor/three.min.js', './vendor/peerjs.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(LOCAL).then(() => Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate'){ // the page itself: newest when online, saved copy when not
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  const keep = url.origin === location.origin || ['cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com'].includes(url.hostname) || url.hostname.endsWith('gstatic.com');
  if (!keep) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque'){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
