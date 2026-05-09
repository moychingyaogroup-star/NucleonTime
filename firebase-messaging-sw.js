// Firebase Messaging service worker for background/closed-tab notifications.
// This file must stay in the project root, beside index.html.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyArU10zwd41PATcY2y_8FD_S7LjR1ptXCE',
  authDomain:        'timeblocks1.firebaseapp.com',
  projectId:         'timeblocks1',
  storageBucket:     'timeblocks1.firebasestorage.app',
  messagingSenderId: '465443568359',
  appId:             '1:465443568359:web:a42b056897aaa08cbd4042',
  measurementId:     'G-REDSQV5JEK'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || payload.data?.title || 'NucleonTime';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification.',
    icon: './favicon.ico',
    badge: './favicon.ico',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = './';
  if (data.view) url = `./#${data.view}`;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (data.view) client.postMessage({ type: 'OPEN_VIEW', view: data.view, friendUid: data.friendUid || null });
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
