// CatchTrace landing-site app: keeps the app shell on the device so the page
// opens with no connection. It never touches API calls - those go straight to
// the network, and unsent records are held in the page's own queue.
const CACHE = 'ct-landing-shell-v1';
const SHELL = ['./', 'index.html', 'config.json', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  // Serve the saved copy at once; refresh it in the background for next time.
  e.respondWith(caches.open(CACHE).then((cache) => cache.match(req, { ignoreSearch: true }).then((hit) => {
    const fresh = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; });
    if (hit) { fresh.catch(() => {}); return hit; }
    return fresh;
  })));
});
