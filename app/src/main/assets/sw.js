const CACHE_NAME = 'j3d-dashboard-v1.0.0';
const urlsToCache = [
  './J3DDashBoard.html',
  './css/Dashboard_estilo.css',
  './css/mobile.css',
  './js/Dashboard.js',
  './js/util.js',
  './js/compress.js',
  './images/Wallpaper_negro.png',
  './images/AdminUI.png',
  './images/AdminUIH.png',
  './images/Reports.png',
  './images/ReportsH.png',
  './images/UIEditor.png',
  './images/UIEditorH.png',
  './images/UIDisplay.png',
  './images/MainBar.png',
  './Apps/AdminUI/css/Admin_estilo.css',
  './Apps/Reports/css/Reports_estilo.css',
  './Apps/UIEditor/css/UIEditor_estilo.css',
  './Apps/UIDisplay/css/UIDisplay_estilo.css'
];

// Instalar Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Service Worker: Error al cachear archivos', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', function(event) {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // No cachear WebSocket connections
  if (event.request.url.includes('ws://') || event.request.url.includes('wss://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Devolver desde caché si existe
        if (response) {
          console.log('Service Worker: Sirviendo desde caché', event.request.url);
          return response;
        }

        // Intentar obtener desde red
        return fetch(event.request)
          .then(function(response) {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta porque es un stream
            var responseToCache = response.clone();

            // Agregar al caché si es un recurso estático
            if (event.request.url.match(/\.(css|js|png|jpg|gif|ico|html)$/)) {
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(function(error) {
            console.log('Service Worker: Error de red', error);
            
            // Mostrar página offline para navegación
            if (event.request.destination === 'document') {
              return caches.match('./offline.html');
            }
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({version: CACHE_NAME});
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Sincronización en segundo plano');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Aquí puedes implementar lógica para sincronizar datos
  // cuando la conexión se restablezca
  return fetch('./api/sync')
    .then(function(response) {
      return response.json();
    })
    .catch(function(error) {
      console.log('Sync falló:', error);
    });
}