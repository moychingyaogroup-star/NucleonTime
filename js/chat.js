// chat.js — Real friends via Firestore, real-time chat, schedule sharing

// ── Firestore helpers ─────────────────────────────────────────────────────────
const _fdb = () => window.TF_DB;
const _uid = () => window.TF_USER?.uid;

// chatId is always the two UIDs sorted and joined — deterministic
function _chatId(uid1, uid2) { return [uid1, uid2].sort().join('_'); }

// ── Active chat listener cleanup ─────────────────────────────────────────────
let _chatUnsub = null;

// ── In-memory friends cache (populated from Firestore on renderFriends) ──────
let _friendsCache = [];

// ════════════════════════════════════════════════════════════════════════════
// FRIENDS
// ════════════════════════════════════════════════════════════════════════════

async function addFriendByTag() {
  const input  = document.getElementById('add-friend-input');
  let   tag    = (input.value||'').trim().toUpperCase().replace(/\s+/g, '');
  if (!tag.startsWith('#')) tag = '#' + tag;
  if (tag.length < 4) { showToast('Enter a valid tag e.g. #ABG67852'); return; }
  if (!_uid()) { showToast('Not signed in'); return; }
  if (!_fdb()) { showToast('Database not ready. Try again.'); return; }

  // Can't add yourself
  if (tag === (window.TF_PROFILE?.friendTag||'').toUpperCase()) {
    showToast("That's your own tag!");
    return;
  }

  // Search Firestore for user with that tag
  let snap;
  try {
    snap = await _fdb().collection('users').where('friendTag','==',tag).limit(1).get();
  } catch(e) {
    console.error('Friend search failed:', e);
    showToast('Error searching friend tag. Please try again.');
    return;
  }

  if (snap.empty) { showToast('No user found with tag '+tag); return; }

  const friendDoc  = snap.docs[0];
  const friendUid  = friendDoc.id;
  const friendData = friendDoc.data() || {};

  // Check already friends
  try {
    const existing = await _fdb().collection('users').doc(_uid()).collection('friends').doc(friendUid).get();
    if (existing.exists) {
      showToast('Already friends with '+(friendData.displayName || 'this user'));
      input.value = '';
      return;
    }
  } catch(e) {
    console.warn('Could not check existing friend:', e);
  }

  // If that person already requested you, accept it immediately instead of creating a duplicate request.
  try {
    const incoming = await _fdb().collection('users').doc(_uid()).collection('friend_requests').doc(friendUid).get();
    if (incoming.exists) {
      const req = incoming.data() || {};
      await acceptFriendRequest(friendUid, req.displayName || friendData.displayName, req.photoURL || friendData.photoURL, req.friendTag || friendData.friendTag);
      input.value = '';
      return;
    }
  } catch(e) {
    console.warn('Could not check incoming request:', e);
  }

  // Check if a request was already sent.
  try {
    const pending = await _fdb().collection('users').doc(friendUid).collection('friend_requests').doc(_uid()).get();
    if (pending.exists) {
      showToast('Friend request already sent to '+(friendData.displayName || 'this user'));
      input.value = '';
      return;
    }
  } catch(e) {
    console.warn('Could not check pending request:', e);
  }

  const me = window.TF_PROFILE || {};
  const requestForThem = {
    uid: _uid(),
    displayName: window.TF_USER?.displayName || me.displayName || 'Friend',
    photoURL: window.TF_USER?.photoURL || me.photoURL || '',
    friendTag: me.friendTag || '',
    requestedAt: Date.now(),
    status: 'pending'
  };

  const outgoingForMe = {
    uid: friendUid,
    displayName: friendData.displayName || 'Friend',
    photoURL: friendData.photoURL || '',
    friendTag: friendData.friendTag || tag,
    requestedAt: Date.now(),
    status: 'pending'
  };

  try {
    const batch = _fdb().batch();
    batch.set(
      _fdb().collection('users').doc(friendUid).collection('friend_requests').doc(_uid()),
      requestForThem,
      { merge: true }
    );
    batch.set(
      _fdb().collection('users').doc(_uid()).collection('sent_friend_requests').doc(friendUid),
      outgoingForMe,
      { merge: true }
    );
    await batch.commit();

    input.value = '';
    showToast('Friend request sent to '+(friendData.displayName || 'friend')+'!');
    if (typeof renderFriendRequests === 'function') renderFriendRequests();
  } catch(e) {
    console.error('Send friend request failed:', e);
    showToast(e && e.code === 'permission-denied' ? 'Firebase rules need updating. Open FIREBASE_SETUP.md in the zip.' : 'Could not send request: '+(e.message || 'Please try again.'));
  }
}

async function _loadFriends() {
  if (!_uid()) return [];
  try {
    const snap = await _fdb().collection('users').doc(_uid()).collection('friends').get();
    return snap.docs.map(d => d.data());
  } catch(e) { console.warn(e); return []; }
}

async function removeFriend(friendUid) {
  if (!_uid()) return;
  await _fdb().collection('users').doc(_uid()).collection('friends').doc(friendUid).delete().catch(console.error);
  await _fdb().collection('users').doc(friendUid).collection('friends').doc(_uid()).delete().catch(console.error);
  showToast('Friend removed');
  renderFriends();
}

// ── Schedule sharing ─────────────────────────────────────────────────────────
async function toggleScheduleShare(friendUid, btn) {
  const newVal = !window.TF_PROFILE?.shareSchedule;
  await updateProfile({ shareSchedule: newVal });
  if (newVal) {
    // Push today's schedule to Firestore so friends can see it
    syncScheduleNow();
    showToast('📅 Schedule sharing ON');
  } else {
    showToast('Schedule sharing OFF');
  }
  btn.textContent  = newVal ? '🔒 Hide Schedule' : '📅 Share Schedule';
  btn.style.background = newVal ? 'rgba(239,68,68,.2)' : '';
}

function syncScheduleNow() {
  if (!_uid() || !window.TF_PROFILE?.shareSchedule) return;
  const blocks = JSON.parse(localStorage.getItem(wsKey(currentDate))||'[]');
  _fdb().collection('schedules').doc(_uid())
    .collection('days').doc(currentDate)
    .set({ blocks, updatedAt: Date.now() }).catch(console.error);
}

async function viewFriendSchedule(friend) {
  if (!friend.shareSchedule) { showToast(friend.displayName+' hasn\'t shared their schedule'); return; }
  const panel = document.getElementById('friend-sched-panel');
  const overlay = document.getElementById('friend-sched-overlay');
  document.getElementById('friend-sched-name').textContent = friend.displayName + '\'s Schedule — Today';
  const content = document.getElementById('friend-sched-content');
  content.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Loading…</div>';
  overlay.classList.add('open');

  try {
    const snap = await _fdb().collection('schedules').doc(friend.uid)
      .collection('days').doc(fmtDate(new Date())).get();
    if (!snap.exists || !snap.data().blocks?.length) {
      content.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">No schedule shared for today.</div>';
      return;
    }
    const blocks = snap.data().blocks;
    content.innerHTML = '<div style="padding:12px;display:flex;flex-direction:column;gap:6px">' +
      blocks.map(b => {
        const cat = CAT_MAP[b.catId];
        const startH = Math.round(b.top / 64); // ROW_H=64
        const durH   = Math.round((b.height + 6) / 64);
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:${b.hex};color:${b.fg||'#fff'}">
          <div style="font-size:18px">${cat?.emoji||'📌'}</div>
          <div>
            <div style="font-weight:600;font-size:13px">${escHtml(b.text||'(no label)')}</div>
            <div style="font-size:11px;opacity:.8">${fmt12h(startH)} · ${durH}h${cat?' · '+cat.name:''}</div>
          </div>
        </div>`;
      }).join('') + '</div>';
  } catch(e) {
    content.innerHTML = '<div style="padding:20px;text-align:center;color:#EF4444">Error loading schedule.</div>';
  }
}

function closeFriendSched() {
  document.getElementById('friend-sched-overlay').classList.remove('open');
}

// ── Render Friends tab ───────────────────────────────────────────────────────
async function acceptFriendRequest(friendUid, friendName, friendPhoto, friendTag) {
  if (!_uid()) return;

  const myUid = _uid();
  const me = window.TF_PROFILE || {};

  try {
    // IMPORTANT:
    // Do the receiver-owned writes first, because these are the writes Firebase rules
    // will always allow for the logged-in user. Do NOT put cross-user cleanup in the
    // same batch, because one denied cross-user write makes the whole batch fail.
    await _fdb().collection('users').doc(myUid).collection('friends').doc(friendUid).set({
      uid: friendUid,
      displayName: friendName || 'Friend',
      photoURL: friendPhoto || '',
      friendTag: friendTag || '',
      addedAt: Date.now(),
    }, { merge: true });

    await _fdb().collection('users').doc(myUid).collection('friend_requests').doc(friendUid).delete();

    // Best-effort mirrored writes. If Firebase rules block these, the accept action
    // should still succeed for the receiver instead of showing an error.
    _fdb().collection('users').doc(friendUid).collection('friends').doc(myUid).set({
      uid: myUid,
      displayName: window.TF_USER?.displayName || me.displayName || 'Friend',
      photoURL: window.TF_USER?.photoURL || me.photoURL || '',
      friendTag: me.friendTag || '',
      addedAt: Date.now(),
    }, { merge: true }).catch(err => console.warn('Mirror friend write skipped:', err));

    _fdb().collection('users').doc(friendUid).collection('sent_friend_requests').doc(myUid).delete()
      .catch(err => console.warn('Sender sent-request cleanup skipped:', err));

    showToast('🎉 ' + (friendName || 'Friend') + ' is now your friend!');
    beep('complete');
    renderFriendRequests();
    renderFriends();
    if (typeof renderChatFriendList === 'function') renderChatFriendList();
  } catch(e) {
    console.error('Accept friend request failed:', e);
    showToast('Could not accept request: '+(e.message || 'Please try again.'));
  }
}

async function rejectFriendRequest(friendUid) {
  if (!_uid()) return;

  const myUid = _uid();

  try {
    // Delete the receiver-owned incoming request first.
    // Cross-user cleanup is best-effort so Firebase rules cannot block the reject.
    await _fdb().collection('users').doc(myUid).collection('friend_requests').doc(friendUid).delete();

    _fdb().collection('users').doc(friendUid).collection('sent_friend_requests').doc(myUid).delete()
      .catch(err => console.warn('Sender sent-request cleanup skipped:', err));

    showToast('Friend request rejected');
    renderFriendRequests();
  } catch(e) {
    console.error('Reject friend request failed:', e);
    showToast('Could not reject request: '+(e.message || 'Please try again.'));
  }
}

async function cancelFriendRequest(friendUid) {
  if (!_uid()) return;
  try {
    const batch = _fdb().batch();
    batch.delete(_fdb().collection('users').doc(_uid()).collection('sent_friend_requests').doc(friendUid));
    batch.delete(_fdb().collection('users').doc(friendUid).collection('friend_requests').doc(_uid()));
    await batch.commit();
    showToast('Friend request cancelled');
    renderFriendRequests();
  } catch(e) {
    console.error('Cancel friend request failed:', e);
    showToast('Could not cancel request');
  }
}

function _friendReqCard(data, id, type) {
  const safeName = escHtml(data.displayName || 'Friend');
  const safeTag = escHtml(data.friendTag || '');
  const safePhoto = escHtml(data.photoURL || '');
  const avatarHtml = data.photoURL
    ? `<img src="${safePhoto}" style="width:38px;height:38px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/>`
    : `<div style="width:38px;height:38px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${(data.displayName||'?')[0].toUpperCase()}</div>`;

  const payload = encodeURIComponent(JSON.stringify({
    uid: id,
    displayName: data.displayName || 'Friend',
    photoURL: data.photoURL || '',
    friendTag: data.friendTag || ''
  }));

  const actions = type === 'incoming'
    ? `<button onclick="acceptFriendRequestFromPayload('${payload}')" style="background:#10B981;color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;margin-right:5px">Accept</button>
       <button onclick="rejectFriendRequest('${id}')" style="background:#EF4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer">Reject</button>`
    : `<button onclick="cancelFriendRequest('${id}')" style="background:#6B7280;color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer">Cancel</button>`;

  const label = type === 'incoming' ? 'wants to be friends' : 'request pending';
  return `
    <div class="friend-card" style="margin-bottom:10px">
      <div class="friend-av">${avatarHtml}</div>
      <div class="friend-info">
        <div class="friend-name">${safeName}</div>
        <div class="friend-meta">${safeTag} · ${label}</div>
      </div>
      <div class="friend-actions">${actions}</div>
    </div>`;
}

function acceptFriendRequestFromPayload(payload) {
  try {
    const data = JSON.parse(decodeURIComponent(payload));
    acceptFriendRequest(data.uid, data.displayName, data.photoURL, data.friendTag);
  } catch(e) {
    console.error('Bad friend request payload:', e);
    showToast('Could not open request');
  }
}

async function renderFriendRequests() {
  if (!_uid()) return;
  const targets = [
    document.getElementById('friend-requests-list'),
    document.getElementById('friend-requests-list-main')
  ].filter(Boolean);
  if (!targets.length) return;

  try {
    const [incomingSnap, outgoingSnap] = await Promise.all([
      _fdb().collection('users').doc(_uid()).collection('friend_requests').get(),
      _fdb().collection('users').doc(_uid()).collection('sent_friend_requests').get()
    ]);

    let html = '';
    if (!incomingSnap.empty) {
      html += '<div style="margin-bottom:10px;font-weight:bold;color:var(--text)">Friend Requests</div>';
      incomingSnap.forEach(doc => { html += _friendReqCard(doc.data() || {}, doc.id, 'incoming'); });
    }
    if (!outgoingSnap.empty) {
      html += '<div style="margin:14px 0 10px;font-weight:bold;color:var(--text)">Sent Requests</div>';
      outgoingSnap.forEach(doc => { html += _friendReqCard(doc.data() || {}, doc.id, 'outgoing'); });
    }

    targets.forEach(el => { el.innerHTML = html; });
  } catch(e) {
    console.error('Render friend requests failed:', e);
    targets.forEach(el => { el.innerHTML = '<div style="padding:12px;color:#EF4444">Could not load friend requests. Update Firebase rules using FIREBASE_SETUP.md.</div>'; });
  }
}

async function renderFriends() {
  if (typeof renderFriendRequests === 'function') renderFriendRequests();
  const list = document.getElementById('friend-list');
  list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Loading friends…</div>';

  // Show user's own tag
  const tagEl = document.getElementById('my-tag-val');
  if (tagEl) tagEl.textContent = window.TF_PROFILE?.friendTag||'…';

  const sc = getScore(), s = getStreak();
  const me = {
    uid:'me', id:'me', displayName:'You',
    photoURL: window.TF_USER?.photoURL||'',
    friendTag: window.TF_PROFILE?.friendTag||'',
    streak: s.count, score: sc.total||0,
    shareSchedule: window.TF_PROFILE?.shareSchedule||false,
    isSelf: true,
  };

  const friends = await _loadFriends();
  _friendsCache = friends;

  // Load sharing status for each friend
  const enriched = await Promise.all(friends.map(async f => {
    try {
      const doc = await _fdb().collection('users').doc(f.uid).get();
      return { ...f, shareSchedule: doc.data()?.shareSchedule||false };
    } catch { return { ...f, shareSchedule: false }; }
  }));

  const all = [me, ...enriched].sort((a,b)=>(b.score||0)-(a.score||0));
  list.innerHTML = '';

  all.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'friend-card';

    const avatarHtml = f.photoURL
      ? `<img src="${f.photoURL}" style="width:38px;height:38px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/>`
      : `<div style="width:38px;height:38px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${(f.displayName||'?')[0].toUpperCase()}</div>`;

    const actionsHtml = f.isSelf
      ? `<button class="friend-btn" onclick="switchView('profile')">View Profile</button>`
      : `<button class="friend-btn" onclick="openChatWith('${f.uid}','${escHtml(f.displayName)}','${escHtml(f.photoURL||'')}')">💬 Chat</button>
         <button class="friend-btn ${f.shareSchedule?'':'friend-btn-muted'}" title="${f.shareSchedule?'View their schedule':'Schedule not shared'}" onclick="viewFriendSchedule(${JSON.stringify(f).replace(/"/g,'&quot;')})">📅</button>
         <button class="friend-btn friend-btn-danger" onclick="removeFriend('${f.uid}')" title="Remove friend">✕</button>`;

    card.innerHTML = `
      <div class="friend-av">${avatarHtml}</div>
      <div class="friend-info">
        <div class="friend-name">${escHtml(f.displayName)}${f.isSelf?' (You)':''}</div>
        <div class="friend-meta">#${i+1} · 🔥 ${f.streak||0}d · ${(f.score||0).toLocaleString()} pts</div>
        <div class="friend-tag-badge">${f.friendTag||''}</div>
      </div>
      <div class="friend-actions">${actionsHtml}</div>`;

    if (f.isSelf) {
      // Share schedule toggle for self
      const shareToggle = document.createElement('button');
      shareToggle.className = 'friend-btn';
      shareToggle.style.cssText = 'margin-top:4px;width:100%;font-size:10px;' + (me.shareSchedule?'background:rgba(239,68,68,.2)':'');
      shareToggle.textContent = me.shareSchedule ? '🔒 Stop Sharing Schedule' : '📅 Share My Schedule';
      shareToggle.onclick = () => toggleScheduleShare(null, shareToggle);
      card.querySelector('.friend-actions').appendChild(shareToggle);
    }

    list.appendChild(card);
  });

  if (friends.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:var(--muted);padding:30px;font-size:13px';
    empty.innerHTML = '👥<br><br>No friends yet.<br>Share your tag above to connect!';
    list.appendChild(empty);
  }
}

async function renderMsgList() {
  const list = document.getElementById('msg-friend-list');
  list.innerHTML = '';
  const friends = _friendsCache.length ? _friendsCache : await _loadFriends();
  if (!friends.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Add friends in the Friends tab to start chatting.</div>';
    return;
  }
  friends.forEach(f => {
    const card = document.createElement('div');
    card.className = 'friend-card';
    const av = f.photoURL
      ? `<img src="${f.photoURL}" style="width:38px;height:38px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/>`
      : `<div style="width:38px;height:38px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${(f.displayName||'?')[0].toUpperCase()}</div>`;
    card.innerHTML = `<div class="friend-av">${av}</div><div class="friend-info"><div class="friend-name">${escHtml(f.displayName)}</div><div class="friend-meta">Tap to chat</div></div><div class="friend-actions"><button class="friend-btn" onclick="openChatWith('${f.uid}','${escHtml(f.displayName)}','${escHtml(f.photoURL||'')}')">Open Chat</button></div>`;
    list.appendChild(card);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT  — Firestore real-time
// ════════════════════════════════════════════════════════════════════════════

function toggleChat() {
  const ov = document.getElementById('chat-overlay');
  if (ov.classList.contains('open')) { ov.classList.remove('open'); _cleanupChat(); }
  else {
    renderFriendRequests();
    renderChatFriendList();
    ov.classList.add('open');
    backToChatList();
  }
}
function handleChatOvClick(e) { if (e.target.id === 'chat-overlay') toggleChat(); }

async function renderChatFriendList() {
  const list = document.getElementById('chat-friend-list');
  list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted)">Loading…</div>';
  const friends = _friendsCache.length ? _friendsCache : await _loadFriends();
  list.innerHTML = '';
  if (!friends.length) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">No friends yet — add them in the Friends tab.</div>';
    return;
  }
  friends.forEach(f => {
    const item = document.createElement('div');
    item.className = 'chat-fitem';
    const av = f.photoURL
      ? `<img src="${f.photoURL}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/>`
      : `<div style="width:36px;height:36px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px">${(f.displayName||'?')[0].toUpperCase()}</div>`;
    item.innerHTML = `<div class="cfi-av">${av}</div><div class="cfi-info"><div class="cfi-name">${escHtml(f.displayName)}</div><div class="cfi-preview">${f.friendTag||''}</div></div>`;
    item.addEventListener('click', () => openChatWith(f.uid, f.displayName, f.photoURL||''));
    list.appendChild(item);
  });
}

function openChatWith(friendUid, friendName, friendPhoto) {
  if (!_uid()) { showToast('Not signed in'); return; }
  activeChatId = friendUid;

  const ov = document.getElementById('chat-overlay');
  if (!ov.classList.contains('open')) ov.classList.add('open');

  // Header
  const avEl = document.getElementById('chat-av');
  if (friendPhoto) {
    avEl.innerHTML = `<img src="${friendPhoto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/>`;
  } else {
    avEl.textContent = (friendName||'?')[0].toUpperCase();
  }
  document.getElementById('chat-name').textContent   = friendName;
  document.getElementById('chat-status').textContent = 'Online';

  document.getElementById('chat-list-view').style.display = 'none';
  document.getElementById('chat-msgs-view').classList.add('active');

  const scroll = document.getElementById('chat-scroll');
  scroll.innerHTML = '';
  _cleanupChat();

  // Firestore real-time listener
  const cid = _chatId(_uid(), friendUid);
  _chatUnsub = _fdb()
    .collection('chats').doc(cid).collection('messages')
    .orderBy('time', 'asc')
    .onSnapshot(snap => {
      const scroll2 = document.getElementById('chat-scroll');
      scroll2.innerHTML = '';
      snap.docs.forEach(doc => {
        const m = doc.data();
        _appendMsg(scroll2, m, friendPhoto, friendName);
      });
      scroll2.scrollTop = scroll2.scrollHeight;
    }, err => console.warn('Chat listener error', err));

  // Focus input
  setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
}

function _appendMsg(scroll, m, friendPhoto, friendName) {
  const isMe = m.from === _uid();
  const row   = document.createElement('div');
  row.className = 'msg-row ' + (isMe ? 'me' : 'them');

  let avHtml = '';
  if (!isMe) {
    avHtml = friendPhoto
      ? `<div class="msg-av"><img src="${friendPhoto}" style="width:26px;height:26px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/></div>`
      : `<div class="msg-av">${(friendName||'?')[0]}</div>`;
  }

  // ── FIX: use textContent via DOM, never innerHTML for message text ──────
  // This prevents the vertical-character CSS rendering bug entirely.
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = m.text; // safe, no HTML injection, no layout issues

  const timeDiv = document.createElement('div');
  timeDiv.className = 'msg-time';
  timeDiv.textContent = formatTime(m.time);

  const content = document.createElement('div');
  content.className = 'msg-content';
  content.appendChild(bubble);
  content.appendChild(timeDiv);

  row.innerHTML = avHtml;
  row.appendChild(content);
  scroll.appendChild(row);
}

function _cleanupChat() {
  if (_chatUnsub) { _chatUnsub(); _chatUnsub = null; }
}

function backToChatList() {
  _cleanupChat();
  activeChatId = null;
  document.getElementById('chat-list-view').style.display = '';
  document.getElementById('chat-msgs-view').classList.remove('active');
  renderChatFriendList();
}

// ── BUG FIX: single Enter handler, reads input.value correctly ───────────────
// Old code had TWO keydown handlers (onkeydown attr + addEventListener)
// causing double-fire issues. Now only ONE handler via addEventListener.
document.addEventListener('DOMContentLoaded', () => {
  const ci = document.getElementById('chat-input');
  if (!ci) return;
  ci.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
});

function sendMsg() {
  const input = document.getElementById('chat-input');
  // ── FIX: read value from the input element directly, trim whitespace ──────
  const text = input.value.trim();
  if (!text || !activeChatId || !_uid()) return;
  input.value = ''; // clear BEFORE the async write so UI feels instant

  const cid = _chatId(_uid(), activeChatId);
  const msg = { from: _uid(), text: text, time: Date.now() };

  _fdb().collection('chats').doc(cid).collection('messages').add(msg)
    .catch(err => {
      showToast('Failed to send: ' + err.message);
      input.value = text; // restore on error
    });

  beep('click');
}

// ── chatKey exposed globally for index.html compatibility ─────────────────────
function chatKey(e) { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }

// ════════════════════════════════════════════════════════════════════════════
// RIGHT PANEL & LEADERBOARD
// ════════════════════════════════════════════════════════════════════════════
function renderRightPanel() {
  const lb = document.getElementById('rp-lb'); lb.innerHTML = '';
  const sc = getScore(), s = getStreak();
  const me = { name:'You', avatar: window.TF_USER?.photoURL||'👤', streak:s.count, score:sc.total||0 };
  const all = [me, ...(_friendsCache.map(f=>({ name:f.displayName, avatar:f.photoURL||'👤', streak:0, score:0 })))].sort((a,b)=>b.score-a.score);
  all.forEach((f,i) => {
    const rank = i+1;
    const medal = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank+'';
    const avHtml = f.avatar && f.avatar.startsWith('http')
      ? `<img src="${f.avatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer"/>`
      : `<div style="font-size:18px">${f.avatar}</div>`;
    lb.innerHTML += `<div class="lb-item"><div class="lb-rank ${rank<=3?'r'+rank:''}">${medal}</div><div class="lb-av">${avHtml}</div><div class="lb-info"><div class="lb-name">${escHtml(f.name)}</div><div class="lb-meta">🔥 ${f.streak}d</div></div><div class="lb-score">${(f.score).toLocaleString()}</div></div>`;
  });
  const act = document.getElementById('rp-activity'); act.innerHTML = '';
  const activities = [
    {icon:'🔥',text:'Keep your streak going!',time:'now'},
    {icon:'📅',text:'Plan your day for bonus points',time:''},
    {icon:'🏆',text:'Complete blocks to climb the leaderboard',time:''},
  ];
  activities.forEach(a => { act.innerHTML += `<div class="activity-item"><div class="act-icon">${a.icon}</div><div class="act-body"><div class="act-text">${a.text}</div><div class="act-time">${a.time}</div></div></div>`; });
}
function toggleRightPanel() { document.getElementById('right-panel').classList.toggle('hidden'); }
function toggleCalSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }


// ── Emoji Picker Logic ────────────────────────────────────────────────────────
const EMOJIS = [String.fromCodePoint(128512),String.fromCodePoint(128515),String.fromCodePoint(128516),String.fromCodePoint(128513),String.fromCodePoint(128518),String.fromCodePoint(128517),String.fromCodePoint(128514),String.fromCodePoint(129315),String.fromCodePoint(129394),String.fromCodePoint(9786,65039),String.fromCodePoint(128522),String.fromCodePoint(128519),String.fromCodePoint(128578),String.fromCodePoint(128579),String.fromCodePoint(128521),String.fromCodePoint(128524),String.fromCodePoint(128525),String.fromCodePoint(129392),String.fromCodePoint(128536),String.fromCodePoint(128535),String.fromCodePoint(128537),String.fromCodePoint(128538),String.fromCodePoint(128523),String.fromCodePoint(128539),String.fromCodePoint(128541),String.fromCodePoint(128540),String.fromCodePoint(129322),String.fromCodePoint(129320),String.fromCodePoint(129488),String.fromCodePoint(129299),String.fromCodePoint(128526),String.fromCodePoint(129400),String.fromCodePoint(129321),String.fromCodePoint(129395),String.fromCodePoint(128527),String.fromCodePoint(128530),String.fromCodePoint(128542),String.fromCodePoint(128532),String.fromCodePoint(128543),String.fromCodePoint(128533),String.fromCodePoint(128577),String.fromCodePoint(9785,65039),String.fromCodePoint(128547),String.fromCodePoint(128534),String.fromCodePoint(128555),String.fromCodePoint(128553),String.fromCodePoint(129402),String.fromCodePoint(128546),String.fromCodePoint(128557),String.fromCodePoint(128548),String.fromCodePoint(128544),String.fromCodePoint(128545),String.fromCodePoint(129324),String.fromCodePoint(129327),String.fromCodePoint(128563),String.fromCodePoint(129397),String.fromCodePoint(129398),String.fromCodePoint(128561),String.fromCodePoint(128552),String.fromCodePoint(128560),String.fromCodePoint(128549),String.fromCodePoint(128531),String.fromCodePoint(129303),String.fromCodePoint(129300),String.fromCodePoint(129325),String.fromCodePoint(129323),String.fromCodePoint(129317),String.fromCodePoint(128566),String.fromCodePoint(128528),String.fromCodePoint(128529),String.fromCodePoint(128556),String.fromCodePoint(128580),String.fromCodePoint(128559),String.fromCodePoint(128550),String.fromCodePoint(128551),String.fromCodePoint(128558),String.fromCodePoint(128562),String.fromCodePoint(129393),String.fromCodePoint(128564),String.fromCodePoint(129316),String.fromCodePoint(128554),String.fromCodePoint(128565),String.fromCodePoint(129296),String.fromCodePoint(129396),String.fromCodePoint(129314),String.fromCodePoint(129326),String.fromCodePoint(129319),String.fromCodePoint(128567),String.fromCodePoint(129298),String.fromCodePoint(129301),String.fromCodePoint(129297),String.fromCodePoint(129312),String.fromCodePoint(128520),String.fromCodePoint(128127),String.fromCodePoint(128121),String.fromCodePoint(128122),String.fromCodePoint(129313),String.fromCodePoint(128169),String.fromCodePoint(128123),String.fromCodePoint(128128),String.fromCodePoint(9760,65039),String.fromCodePoint(128125),String.fromCodePoint(128126),String.fromCodePoint(129302),String.fromCodePoint(127875),String.fromCodePoint(128570),String.fromCodePoint(128568),String.fromCodePoint(128569),String.fromCodePoint(128571),String.fromCodePoint(128572),String.fromCodePoint(128573),String.fromCodePoint(128576),String.fromCodePoint(128575),String.fromCodePoint(128574)];

document.addEventListener('DOMContentLoaded', () => {
  const inputArea = document.getElementById('chat-input-area');
  if (!inputArea) return;

  const emojiBtnContainer = document.createElement('div');
  emojiBtnContainer.id = 'emoji-picker-container';

  const emojiBtn = document.createElement('button');
  emojiBtn.id = 'chat-emoji-btn';
  emojiBtn.textContent = String.fromCodePoint(128512);
  emojiBtn.onclick = (e) => {
    e.stopPropagation();
    const picker = document.getElementById('emoji-picker');
    picker.classList.toggle('open');
  };

  const emojiPicker = document.createElement('div');
  emojiPicker.id = 'emoji-picker';

  EMOJIS.forEach(emoji => {
    const opt = document.createElement('div');
    opt.className = 'emoji-option';
    opt.textContent = emoji;
    opt.onclick = (e) => {
      e.stopPropagation();
      const input = document.getElementById('chat-input');
      input.value += emoji;
      input.focus();
    };
    emojiPicker.appendChild(opt);
  });

  emojiBtnContainer.appendChild(emojiBtn);
  emojiBtnContainer.appendChild(emojiPicker);

  // Insert before the send button
  const sendBtn = document.getElementById('chat-send');
  inputArea.insertBefore(emojiBtnContainer, sendBtn);

  document.addEventListener('click', (e) => {
    if (!emojiBtnContainer.contains(e.target)) {
      emojiPicker.classList.remove('open');
    }
  });
});

// Allow pressing Enter in the Add Friend input.
document.addEventListener('DOMContentLoaded', function () {
  const addFriendInput = document.getElementById('add-friend-input');
  if (addFriendInput && !addFriendInput.dataset.enterBound) {
    addFriendInput.dataset.enterBound = '1';
    addFriendInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addFriendByTag();
    });
  }
});
