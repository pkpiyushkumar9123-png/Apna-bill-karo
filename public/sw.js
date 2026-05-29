const CACHE_NAME = 'novabill-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.ico',
];

// Install Event: pre-caches the static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core application shell');
      // We wrap with Promise.allSettled or cache.addAll with catch to handle potential missing resources gracefully
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('[Service Worker] Failed to pre-cache asset:', url, err);
          });
        })
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: cleans up old caches and claims active clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Pruning obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: Network-First with Cache Fallback for resources of GET request method
self.addEventListener('fetch', (event) => {
  // Exclude non-GET, extension requests, DevServer HMR connections or remote cloud-integration endpoints
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('socket.io') ||
    event.request.url.includes('hmr') ||
    event.request.url.includes('http-bind')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If request is successful, clone response and write to cache
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch((err) => {
        console.log('[Service Worker] Fetch failed, returning cached asset for:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigating to another page but offline, serve index.html to support React Router SPAs
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Internet connection offline.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
