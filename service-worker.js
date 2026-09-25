const CACHE_NAME = 'One Thing (Web App)';
// Same-origin app shell — adjust paths if deployed to a GitHub Pages project subfolder
const STATIC_ASSETS = [
  '/onethingwebapp/',
  '/onethingwebapp/index.html',
  '/onethingwebapp/app.js',
  '/onethingwebapp/sync-widget.js',
  '/onethingwebapp/manifest.json',
  '/onethingwebapp/icon-192x192.png',
  '/onethingwebapp/icon-512x512.png'
];
/* ---------- INSTALL: precache core shell ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});
/* ---------- ACTIVATE: clean outdated caches ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});
/* ---------- FETCH: route by destination ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // 1. NEVER cache Google APIs or Firebase Auth endpoints
  if (
    url.hostname === 'www.googleapis.com' ||          // Drive API
    url.hostname === 'identitytoolkit.googleapis.com' || // Firebase Auth
    url.hostname === 'securetoken.googleapis.com' ||     // Firebase token refresh
    url.hostname === 'oauth2.googleapis.com' ||          // OAuth
    url.hostname.includes('firebaseapp.com')             // Firebase Auth handlers
  ) {
    return; // let the browser handle normally
  }
  // 2. Cache external static assets (Firebase SDK modules, Google Fonts)
  if (
    url.hostname.includes('gstatic.com') ||      // Firebase JS + font files
    url.hostname === 'fonts.googleapis.com'      // Google Fonts CSS
  ) {
    event.respondWith(runtimeCacheFirst(request));
    return;
  }
  // 3. Same-origin app shell: stale-while-revalidate
  //    (instant offline load + background freshness check)
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});
/* ---------- Strategy helpers ---------- */
// For local HTML/JS: return cache immediately, refresh in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {}); // silent fail if offline; cached copy already returned
  return cached || networkFetch;
}
// For external static assets: cache-first
async function runtimeCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}
