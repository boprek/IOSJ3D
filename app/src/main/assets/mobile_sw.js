// Service Worker para J3D Mobile PWA
const CACHE_NAME = 'j3d-mobile-v1.0';
const urlsToCache = [
  './mobile_dashboard.html',
  './mobile_manifest.json',
  './Dashboard.ico'
];

// Instalar Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }
        
        // Si no, hacer petición normal
        return fetch(event.request).catch(function() {
          // Si falla la red y es una petición de HTML, devolver página offline
          if (event.request.destination === 'document') {
            return caches.match('./mobile_dashboard.html');
          }
        });
      }
    )
  );
});

// Activar Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});