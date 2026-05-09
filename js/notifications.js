// notifications.js — Browser + Firebase Cloud Messaging notification support
// Works in two layers:
// 1) Browser notifications while the app is open.
// 2) Real push notifications when the app is backgrounded/closed, after Firebase Cloud Functions are deployed.

let _fcmRegistration = null;
let _fcmToken = null;
let _notifInitStarted = false;

function notificationsSupported() {
  return !!(window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator && window.firebase && firebase.messaging);
}

function _shortTokenId(token) {
  // Firestore document IDs cannot contain '/', so hash when possible.
  if (!window.crypto?.subtle) return btoa(token).replace(/[\/=+]/g, '').slice(0, 120);
  const enc = new TextEncoder().encode(token);
  return crypto.subtle.digest('SHA-256', enc).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

function _setRealNotifStatus(text) {
  const el = document.getElementById('real-notif-status');
  if (el) el.textContent = text;
  const btn = document.getElementById('enable-real-notifs-btn');
  if (btn && text === 'On') btn.textContent = '🔔 Phone/PC notifications enabled';
}

async function saveNotificationToken(token) {
  if (!token || !window.TF_DB || !window.TF_USER?.uid) return;
  const tokenId = await _shortTokenId(token);
  await window.TF_DB
    .collection('users')
    .doc(window.TF_USER.uid)
    .collection('notificationTokens')
    .doc(tokenId)
    .set({
      token,
      platform: 'web',
      userAgent: navigator.userAgent || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function enableRealNotifications() {
  if (!notificationsSupported()) {
    showToast('This browser does not support web push notifications.');
    _setRealNotifStatus('Unsupported');
    return false;
  }

  if (!window.TF_USER?.uid) {
    showToast('Sign in first, then enable notifications.');
    return false;
  }

  const vapidKey = window.TF_FCM_VAPID_KEY;
  if (!vapidKey || vapidKey.includes('PASTE_YOUR')) {
    showToast('Add your Firebase VAPID key in index.html first.');
    _setRealNotifStatus('Needs VAPID key');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    showToast('Notifications were not allowed.');
    _setRealNotifStatus('Blocked');
    return false;
  }

  try {
    _fcmRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    const messaging = firebase.messaging();
    _fcmToken = await messaging.getToken({ vapidKey, serviceWorkerRegistration: _fcmRegistration });
    if (!_fcmToken) throw new Error('No notification token returned.');
    await saveNotificationToken(_fcmToken);
    _setRealNotifStatus('On');
    showToast('Phone/PC notifications enabled ✓');
    checkImportantDateBrowserNotifications();
    return true;
  } catch (err) {
    console.error('Could not enable notifications:', err);
    showToast('Could not enable notifications. Check console/Firebase setup.');
    _setRealNotifStatus('Error');
    return false;
  }
}

async function initRealNotifications() {
  if (_notifInitStarted) return;
  _notifInitStarted = true;

  if (!notificationsSupported()) {
    _setRealNotifStatus('Unsupported');
    return;
  }

  if (Notification.permission === 'granted') {
    _setRealNotifStatus('On');
    // Re-save token after sign-in so new devices/browsers stay registered.
    setTimeout(() => enableRealNotifications().catch(console.warn), 1200);
  } else if (Notification.permission === 'denied') {
    _setRealNotifStatus('Blocked');
  } else {
    _setRealNotifStatus('Off');
  }

  try {
    const messaging = firebase.messaging();
    messaging.onMessage(payload => {
      const title = payload.notification?.title || payload.data?.title || 'NucleonTime';
      const body = payload.notification?.body || payload.data?.body || 'You have a new notification.';
      addNotif(payload.data?.icon || '🔔', title === body ? body : `${title}: ${body}`);
      showBrowserNotification(title, body, payload.data || {});
    });
  } catch (e) {
    console.warn('Foreground FCM listener not available:', e);
  }

  setTimeout(checkImportantDateBrowserNotifications, 2000);
  if (!window._tfImportantDateNotifTimer) {
    window._tfImportantDateNotifTimer = setInterval(checkImportantDateBrowserNotifications, 60 * 60 * 1000);
  }
}

function showBrowserNotification(title, body, data = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: './favicon.ico',
      badge: './favicon.ico',
      data
    });
    n.onclick = () => {
      window.focus();
      if (data.view && typeof switchView === 'function') switchView(data.view);
      if (data.friendUid && typeof openChatWith === 'function') switchView('messages');
      n.close();
    };
  } catch (e) {
    console.warn('Browser notification failed:', e);
  }
}

function notifyIncomingMessage(msg, friend = {}) {
  const sender = friend.displayName || msg.senderName || 'Someone';
  showBrowserNotification('Message Received', `${sender} sent you a message.`, {
    type: 'message',
    view: 'messages',
    friendUid: friend.uid || msg.from || ''
  });
}

function _dateOnly(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function checkImportantDateBrowserNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (typeof getDates !== 'function') return;
  const dates = getDates();
  const today = _dateOnly(new Date());

  dates.forEach(item => {
    if (!item.date) return;
    const target = _dateOnly(item.date + 'T00:00:00');
    const diffDays = Math.round((target - today) / 86400000);
    if (diffDays !== 0 && diffDays !== 1) return;

    const key = `important-date-notified:${item.id || item.title}:${item.date}:${diffDays}`;
    if (localStorage.getItem(key)) return;

    const when = diffDays === 0 ? 'today' : 'tomorrow';
    showBrowserNotification('Important Date Soon', `${item.emoji || '📌'} ${item.title} is ${when}.`, {
      type: 'important-date',
      view: 'important-dates',
      dateId: item.id || ''
    });
    addNotif('📌', `${item.title} is ${when}`);
    localStorage.setItem(key, String(Date.now()));
  });
}

async function syncImportantDatesForNotifications(ds) {
  if (!window.TF_DB || !window.TF_USER?.uid || !Array.isArray(ds)) return;
  const ref = window.TF_DB.collection('users').doc(window.TF_USER.uid).collection('importantDates');
  try {
    const old = await ref.get();
    const batch = window.TF_DB.batch();
    old.forEach(doc => batch.delete(doc.ref));
    ds.forEach(d => {
      if (!d.id || !d.date || !d.title) return;
      batch.set(ref.doc(String(d.id)), {
        title: d.title,
        date: d.date,
        emoji: d.emoji || '📌',
        desc: d.desc || '',
        pinned: !!d.pinned,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Could not sync important dates for notifications:', err);
  }
}

// Expose functions for inline HTML and other scripts.
window.enableRealNotifications = enableRealNotifications;
window.initRealNotifications = initRealNotifications;
window.showBrowserNotification = showBrowserNotification;
window.notifyIncomingMessage = notifyIncomingMessage;
window.checkImportantDateBrowserNotifications = checkImportantDateBrowserNotifications;
window.syncImportantDatesForNotifications = syncImportantDatesForNotifications;


function _openNotificationTarget(view, friendUid) {
  if (view && typeof switchView === 'function') switchView(view);
  if (view === 'messages' && friendUid && typeof renderMsgList === 'function') {
    setTimeout(() => {
      const card = document.querySelector(`[data-chat-uid="${friendUid}"]`);
      if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 600);
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type === 'OPEN_VIEW') _openNotificationTarget(data.view, data.friendUid);
  });
}

function openViewFromHash() {
  const view = location.hash.replace('#', '').trim();
  if (view) setTimeout(() => _openNotificationTarget(view, null), 1200);
}

// Start gently after the app has had time to sign in.
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initRealNotifications, 2500);
  openViewFromHash();
});
