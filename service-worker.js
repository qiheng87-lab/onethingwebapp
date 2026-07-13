// service-worker.js - Disable caching, allow live updates
const CACHE_NAME = 'devotional-app-v1';
// Skip caching on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
// Skip waiting on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
// Network-first strategy (always get fresh content)
self.addEventListener('fetch', (event) => {
  // For HTML, JSON, CSS, JS - always fetch fresh
  if (event.request.url.includes('.html') ||
      event.request.url.includes('.json') ||
      event.request.url.includes('.css') ||
      event.request.url.includes('.js')) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
  } else {
    // For other assets, use cache
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});
