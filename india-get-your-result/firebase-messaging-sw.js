// IGYR Firebase Cloud Messaging (FCM) Background Service Worker
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

// Handle Background Push Notifications (even when website/PWA is closed)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'IGYR Exam Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New examination update available on IGYR.',
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    tag: 'igyr-exam-alert',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/search-result.html'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle Notification Click - Focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/search-result.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
