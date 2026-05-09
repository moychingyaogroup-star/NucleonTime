const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

async function getUserTokens(uid) {
  const snap = await db.collection('users').doc(uid).collection('notificationTokens').get();
  const tokens = [];
  snap.forEach(doc => {
    const token = doc.data()?.token;
    if (token) tokens.push({ token, ref: doc.ref });
  });
  return tokens;
}

async function sendToUser(uid, payload) {
  const tokens = await getUserTokens(uid);
  if (!tokens.length) return;

  const results = await Promise.allSettled(tokens.map(t =>
    messaging.send({
      token: t.token,
      notification: payload.notification,
      data: payload.data || {},
      webpush: {
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        },
        fcmOptions: {
          link: payload.link || 'https://moychingyaogroup-star.github.io/'
        }
      }
    })
  ));

  // Remove dead/invalid tokens so future sends stay clean.
  await Promise.all(results.map((r, i) => {
    if (r.status === 'rejected') {
      const code = r.reason?.code || '';
      if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
        return tokens[i].ref.delete().catch(() => null);
      }
    }
    return null;
  }));
}

exports.sendMessageNotification = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const msg = event.data?.data() || {};
  const receiverUid = msg.to;
  const senderUid = msg.from;
  if (!receiverUid || !senderUid || receiverUid === senderUid) return;

  await sendToUser(receiverUid, {
    notification: {
      title: 'Message Received',
      body: `${msg.senderName || 'Someone'} sent you a message.`
    },
    data: {
      type: 'message',
      view: 'messages',
      friendUid: senderUid,
      title: 'Message Received',
      body: `${msg.senderName || 'Someone'} sent you a message.`,
      icon: '💬'
    },
    link: 'https://moychingyaogroup-star.github.io/#messages'
  });
});

exports.sendImportantDateReminders = onSchedule('every day 08:00', async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const users = await db.collection('users').get();
  const jobs = [];

  users.forEach(userDoc => {
    jobs.push((async () => {
      const dates = await userDoc.ref.collection('importantDates').get();
      for (const dateDoc of dates.docs) {
        const d = dateDoc.data() || {};
        if (d.date !== todayStr && d.date !== tomorrowStr) continue;
        const when = d.date === todayStr ? 'today' : 'tomorrow';
        const sentKey = `importantDateReminder_${dateDoc.id}_${d.date}_${when}`;
        const userData = userDoc.data() || {};
        if (userData[sentKey]) continue;

        await sendToUser(userDoc.id, {
          notification: {
            title: 'Important Date Soon',
            body: `${d.emoji || '📌'} ${d.title || 'Important date'} is ${when}.`
          },
          data: {
            type: 'important-date',
            view: 'important-dates',
            dateId: dateDoc.id,
            title: 'Important Date Soon',
            body: `${d.title || 'Important date'} is ${when}.`,
            icon: '📌'
          },
          link: 'https://moychingyaogroup-star.github.io/#important-dates'
        });
        await userDoc.ref.set({ [sentKey]: Date.now() }, { merge: true });
      }
    })());
  });

  await Promise.all(jobs);
});
