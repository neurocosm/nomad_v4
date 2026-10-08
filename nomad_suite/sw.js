const CACHE_NAME = 'nomad-avionics-suite-v4-10072026-2006';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './digit.html',
  './roadtrip.html',
  './hyperspace.html',
  './features.html',
  './geek-stats.html',
  './visualizer.html',
  './manifest.json',
  './version.js',
  './js/nomad-menu.js',
  './js/nomad-return.js',
  './js/nomad-cockpit-engine.js',
  './js/nomad-telemetry-engine.js',
  './js/kinetic-bubbles.js',
  './js/vehicle-safezone.js',
  './js/location-bar.js',
  './js/modals.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
];

// Message Event: Allow force purge from unified menu
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_PURGE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map(k => caches.delete(k)));
    });
  }
});

// Install Event: Cache Core App Shell & Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Some non-critical assets skipped during precache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup Stale Caches & Claim Clients
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for Navigation & APIs / Cache-First with fallback for Static Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-First for Navigation requests (HTML pages)
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
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