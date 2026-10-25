// IGYR Unified Service Worker (PWA Offline Caching & Firebase Cloud Messaging Push)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA3jEyzAmql8FvnYmt1r8wwCT60s-7rKMw",
  authDomain: "igyr-53359.firebaseapp.com",
  projectId: "igyr-53359",
  storageBucket: "igyr-53359.firebasestorage.app",
  messagingSenderId: "995531291288",
  appId: "1:995531291288:web:e54f04d2c095d38189eeed",
  measurementId: "G-QDT94Z4R0G"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle Background Push Notifications via Firebase Compat
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] onBackgroundMessage received:', payload);

  const title = payload.notification?.title || payload.data?.title || 'IGYR Exam Alert';
  const body = payload.notification?.body || payload.data?.body || 'New examination update available on IGYR.';
  const targetUrl = payload.data?.url || payload.fcmOptions?.link || '/search-result.html';

  const options = {
    body: body,
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    tag: 'igyr-exam-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: targetUrl
    }
  };

  return self.registration.showNotification(title, options);
});

// Fallback native push event listener (ensures Android Chrome delivers notification even if payload is raw data)
self.addEventListener('push', (event) => {
  console.log('[FCM SW] Native push event caught:', event);
  let title = 'IGYR Exam Alert';
  let body = 'New examination update available on IGYR.';
  let targetUrl = '/search-result.html';
  let icon = '/favicon-192x192.png';

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.notification) {
        title = data.notification.title || title;
        body = data.notification.body || body;
        icon = data.notification.icon || icon;
      }
      if (data.data) {
        title = data.data.title || title;
        body = data.data.body || body;
        targetUrl = data.data.url || targetUrl;
      }
    } catch(e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: '/favicon-96x96.png',
    tag: 'igyr-exam-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: targetUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle Notification Click - Focus existing tab or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/search-result.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url && client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ==========================================
// PWA Offline Caching & Performance Engine
// ==========================================
const CACHE_NAME = 'igyr-pwa-cache-v3';
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass cache for all dynamic API endpoints & Firebase scripts
  if (url.pathname.startsWith('/api/') || url.pathname.includes('googleapis') || url.pathname.includes('gstatic')) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => networkResponse)
      .catch(() => caches.match(event.request))
  );
});
