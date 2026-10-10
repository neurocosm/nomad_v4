const CACHE_NAME = 'nomad-avionics-suite-v4-10102026-1017';

const ASSETS_TO_CACHE = [
  '/',
  '/nomad_suite/',
  '/nomad_suite/index.html',
  '/digit.html',
  '/roadtrip.html',
  '/hyperspace.html',
  '/features.html',
  '/geek-stats.html',
  '/visualizer.html',
  '/manifest.json',
  '/version.js',
  '/js/nomad-menu.js',
  '/js/nomad-return.js',
  '/js/kinetic-bubbles.js',
  '/js/vehicle-safezone.js',
  '/js/location-bar.js',
  '/js/modals.js',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
];

// Message Event: Allow force purge or skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_PURGE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map(k => caches.delete(k)));
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install Event: Cache Core App Shell & Assets (Skip waiting immediately)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Some non-critical assets skipped during precache:', err);
      });
    })
  );
});

// Activate Event: Cleanup Stale Caches, Claim Clients & Force Open Tabs to Refresh
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          if (client.url && typeof client.navigate === 'function') {
            client.navigate(client.url);
          }
        });
      });
    })
  );
});

// Fetch Event: Network-First for Navigation & Scripts / Cache-First for static media
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-First for Navigation requests (HTML pages) and dynamic script/json updates
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.json') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Network-First for Live Weather and Reverse Geocoding
  if (url.hostname.includes('open-meteo.com') || url.hostname.includes('openstreetmap.org')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache-First with Dynamic Fallback for App Shell & Static CDN Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});