// IGYR Official Service Worker (PWA Install & Performance)
const CACHE_NAME = 'igyr-pwa-cache-v1';
const PRECACHE_ASSETS = [
    '/',
    '/favicon.ico',
    '/favicon.png',
    '/favicon-192x192.png',
    '/favicon-512x512.png',
    '/site.webmanifest'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('PWA Precache warning:', err);
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

// Network-first strategy with cache fallback for offline resilience
// API calls always bypass cache to guarantee 100% live database sync
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Bypass service worker cache for API endpoints
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
