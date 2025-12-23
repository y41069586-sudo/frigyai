// Fridgie Service Worker for Push Notifications
const CACHE_NAME = 'fridgie-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Fridgie SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Fridgie SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[Fridgie SW] Push received:', event);
  
  let data = {
    title: 'Fridgie',
    body: 'Du hast eine neue Benachrichtigung!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'open', title: 'Öffnen' },
      { action: 'dismiss', title: 'Schließen' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Fridgie SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          const url = event.notification.data?.url || '/';
          return self.clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('[Fridgie SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders() {
  // This could sync with the server when online
  console.log('[Fridgie SW] Syncing reminders...');
}

// Periodic sync for recurring reminders
self.addEventListener('periodicsync', (event) => {
  console.log('[Fridgie SW] Periodic sync:', event.tag);
  
  if (event.tag === 'water-reminder') {
    event.waitUntil(showWaterReminder());
  }
});

async function showWaterReminder() {
  const options = {
    body: 'Bleib hydriert - trink ein Glas Wasser!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'water-reminder',
  };
  
  await self.registration.showNotification('💧 Zeit für Wasser!', options);
}
