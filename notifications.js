// =====================================================
// IGYR FIREBASE CLOUD MESSAGING (FCM) NOTIFICATION CLIENT
// =====================================================

const IGYR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA3jEyzAmql8FvnYmt1r8wwCT60s-7rKMw",
  authDomain: "igyr-53359.firebaseapp.com",
  projectId: "igyr-53359",
  storageBucket: "igyr-53359.firebasestorage.app",
  messagingSenderId: "995531291288",
  appId: "1:995531291288:web:e54f04d2c095d38189eeed",
  measurementId: "G-QDT94Z4R0G"
};

let igyrMessaging = null;

function getNotificationApiBase() {
  if (typeof API_BASE !== 'undefined') return API_BASE;
  return (window.location.protocol === 'file:') ? 'http://127.0.0.1:5005/api' : '/api';
}

function initIgyrFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[FCM] Firebase SDK scripts not loaded yet.');
    return null;
  }
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(IGYR_FIREBASE_CONFIG);
  }
  if (!igyrMessaging && firebase.messaging) {
    try {
      igyrMessaging = firebase.messaging();
      
      // Foreground notification listener (when user is browsing IGYR)
      igyrMessaging.onMessage((payload) => {
        console.log('[FCM] Foreground notification received:', payload);
        const title = payload.notification?.title || payload.data?.title || 'IGYR Exam Alert';
        const body = payload.notification?.body || payload.data?.body || 'New examination update available.';
        const targetUrl = payload.data?.url || '/search-result.html';
        
        // 1. Show in-app banner toast
        showIgyrInAppNotification(title, body, targetUrl);

        // 2. Also trigger native Android / OS notification banner if permitted
        if (Notification.permission === 'granted' && navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body: body,
              icon: '/favicon-192x192.png',
              badge: '/favicon-96x96.png',
              tag: 'igyr-exam-alert',
              renotify: true,
              vibrate: [200, 100, 200],
              data: { url: targetUrl }
            });
          }).catch((err) => console.warn('Foreground system notification error:', err));
        }
      });
    } catch (e) {
      console.warn('[FCM] Firebase messaging not supported or error:', e);
    }
  }
  return igyrMessaging;
}

// In-App Toast Popup for foreground alerts
function showIgyrInAppNotification(title, body, targetUrl) {
  const existing = document.getElementById('igyr-push-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'igyr-push-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #071d49;
    color: #ffffff;
    border: 2px solid #38bdf8;
    border-radius: 14px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.35);
    padding: 16px 20px;
    max-width: 360px;
    z-index: 1000000;
    font-family: 'Inter', -apple-system, sans-serif;
    animation: igyrPwaSlideDown 0.3s ease-out;
  `;
  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="background: rgba(56, 189, 248, 0.2); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
        🔔
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 800; font-size: 14px; color: #38bdf8; margin-bottom: 3px;">${title}</div>
        <div style="font-size: 13px; color: #e2e8f0; line-height: 1.4; margin-bottom: 8px;">${body}</div>
        <div style="display: flex; gap: 8px;">
          <a href="${targetUrl}" style="background: #1266d6; color: white; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;">View Now →</a>
          <button onclick="document.getElementById('igyr-push-toast').remove()" style="background: transparent; color: #94a3b8; border: 1px solid #475569; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Dismiss</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(toast);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (toast && toast.parentNode) toast.remove();
  }, 10000);
}

// Request Notification Permission & Register Token
async function subscribeToIgyrPush() {
  if (!('Notification' in window)) {
    alert('Push notifications are not supported by your current browser.');
    return false;
  }

  const currentToken = localStorage.getItem('igyr_fcm_token');
  if (currentToken && Notification.permission === 'granted') {
    if (confirm("🔔 Result alerts are currently active on this device.\n\nDo you want to turn off notifications on this device?")) {
      return unsubscribeFromIgyrPush();
    }
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Notification permission was denied. Please allow notifications in your browser settings to receive instant result alerts.');
      updatePushButtons(false);
      return false;
    }

    const messaging = initIgyrFirebase();
    if (!messaging) {
      alert('Could not initialize Firebase Messaging.');
      return false;
    }

    // Register the FCM background service worker
    let reg;
    try {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
    } catch(swErr) {
      console.warn("SW register fallback:", swErr);
      reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    }

    // Retrieve FCM Device Token
    const token = await messaging.getToken({
      serviceWorkerRegistration: reg
    });

    if (token) {
      console.log('[FCM] Device Token obtained:', token);

      // Save token into MongoDB via Flask API
      const apiBase = getNotificationApiBase();
      const res = await fetch(apiBase + '/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          device: navigator.userAgent,
          platform: navigator.platform || 'Unknown',
          subscribedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        localStorage.setItem('igyr_fcm_token', token);
        updatePushButtons(true);
        if (typeof showCustomToast === 'function') {
          showCustomToast("✅ Result Alerts Activated! You will receive push notifications when new marks are published.");
        } else {
          alert("✅ Result Alerts Activated!\nYou will now receive instant push alerts directly on your device whenever new exam results or notices are published.");
        }
        return true;
      }
    } else {
      console.warn('[FCM] No registration token available.');
      alert('Could not generate notification token. Please ensure your device has internet access.');
      return false;
    }
  } catch (err) {
    console.error('[FCM] Error subscribing to push notifications:', err);
    alert('Notification subscription error: ' + (err.message || err));
    return false;
  }
}

// Unsubscribe Device from Notifications
async function unsubscribeFromIgyrPush() {
  const token = localStorage.getItem('igyr_fcm_token');
  if (token) {
    try {
      const apiBase = getNotificationApiBase();
      await fetch(apiBase + '/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      });
    } catch(err) {
      console.warn('[FCM] Error reporting unsubscribe to backend:', err);
    }
    localStorage.removeItem('igyr_fcm_token');
  }
  updatePushButtons(false);
  if (typeof showCustomToast === 'function') {
    showCustomToast("🔕 Result alerts have been disabled on this device.");
  } else {
    alert("🔕 Result alerts have been disabled on this device.");
  }
  return true;
}

function updatePushButtons(isActive) {
  const btns = document.querySelectorAll('.igyr-notify-btn, #btn-enable-notifications, #nav-notify-btn');
  btns.forEach(btn => {
    if (isActive) {
      btn.innerHTML = '🔔 Result Alerts Active';
      btn.style.background = '#059669';
      btn.style.color = '#ffffff';
      btn.style.borderColor = '#059669';
      btn.title = 'Result alerts are active on this device. Click to turn off.';
    } else {
      btn.innerHTML = '🔔 Get Result Alerts';
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.title = 'Click to enable instant push notifications for results';
    }
  });
}

// Check status on load
document.addEventListener('DOMContentLoaded', () => {
  initIgyrFirebase();
  const savedToken = localStorage.getItem('igyr_fcm_token');
  if (savedToken) {
    if (Notification.permission === 'granted') {
      updatePushButtons(true);
    } else {
      // User blocked or reset notification permissions -> remove from active list
      unsubscribeFromIgyrPush();
    }
  }
});

window.subscribeToIgyrPush = subscribeToIgyrPush;
window.unsubscribeFromIgyrPush = unsubscribeFromIgyrPush;
window.initIgyrFirebase = initIgyrFirebase;

