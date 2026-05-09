function renderProfile(){
  const inner=document.getElementById('profile-inner');inner.innerHTML='';
  const s=getStreak(),sc=getScore(),cc=getCharState();
  const level=Math.floor((sc.total||0)/500)+1;
  const xpInLevel=(sc.total||0)%500,xpPct=xpInLevel/500*100;
  const ac=CHARACTERS.find(c=>c.id===sc.activeChar)||CHARACTERS[0];

  // Use real Google name/photo if signed in, otherwise fall back to defaults
  const gUser    = window.TF_USER;
  const dispName = window.TF_PROFILE?.displayName || gUser?.displayName || 'Time Architect';
  const dispEmail= gUser?.email       || '';
  const photoURL = gUser?.photoURL    || '';
  const avatarHtml = photoURL
    ? `<img src="${photoURL}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--accent)" referrerpolicy="no-referrer"/>`
    : ac.emoji;

  inner.innerHTML=`
    <div class="view-title">Profile</div>
    <div class="view-sub">Your progress, characters &amp; achievements</div>
    <div class="profile-hero">
      <div class="ph-avatar" style="font-size:${photoURL?'0':'inherit'}">${avatarHtml}<div class="ph-lvl">Lv ${level}</div></div>
      <div class="ph-stats">
        <div class="ph-name">${escHtml(dispName)}<span onclick="editUsername()" style="cursor:pointer;font-size:14px;margin-left:6px;" title="Edit Username">✏️</span></div>
        ${dispEmail?`<div class="ph-tag" style="font-size:11px;color:var(--muted);margin-bottom:4px">${escHtml(dispEmail)}</div>`:''}
        <div class="ph-tag">Active: ${ac.name} (${ac.rarity}) · ${ac.bonus} bonus</div>
        <div class="profile-toggle-row">
          <div>
            <div class="profile-toggle-title">Flying bird bonus</div>
            <div class="profile-toggle-sub">Optional moving bonus icon. Default is off.</div>
          </div>
          <button class="profile-toggle-btn ${typeof getBirdEnabled === 'function' && getBirdEnabled() ? 'on' : ''}" onclick="toggleBirdEnabled()">${typeof getBirdEnabled === 'function' && getBirdEnabled() ? 'On' : 'Off'}</button>
        </div>
        <div class="ph-row">
          <div class="ph-stat"><div class="ph-stat-val">${(sc.total||0).toLocaleString()}</div><div class="ph-stat-lbl">Points</div></div>
          <div class="ph-stat"><div class="ph-stat-val">${s.count}</div><div class="ph-stat-lbl">Streak</div></div>
          <div class="ph-stat"><div class="ph-stat-val">${s.shields||0}</div><div class="ph-stat-lbl">Shields</div></div>
          <div class="ph-stat"><div class="ph-stat-val">${cc.unlocked.length}/${CHARACTERS.length}</div><div class="ph-stat-lbl">Characters</div></div>
        </div>
        <div class="xp-section">
          <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
          <div class="xp-label"><span>Lv ${level}</span><span>${xpInLevel}/500 XP</span><span>Lv ${level+1}</span></div>
        </div>
        <button onclick="signOutUser()" style="margin-top:14px;background:rgba(239,68,68,.12);color:#EF4444;border:1px solid rgba(239,68,68,.3);border-radius:9px;padding:8px 18px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
          Sign Out of Google
        </button>
      </div>
    </div>
    <div class="chars-section" id="chars-section"></div>
  `;
  const cs=document.getElementById('chars-section');
  ['common','rare','epic','legendary'].forEach(rarity=>{
    const chars=CHARACTERS.filter(c=>c.rarity===rarity);
    const section=document.createElement('div');
    const rc={common:'var(--r-common)',rare:'var(--r-rare,#5B8DD9)',epic:'var(--r-epic,#9B59B6)',legendary:'var(--r-legendary,#E6A817)'};
    section.innerHTML=`<div class="chars-rarity-label" style="color:${rc[rarity]}">${rarity}</div>`;
    const grid=document.createElement('div');grid.className='chars-grid';
    chars.forEach(ch=>{
      const unlocked=cc.unlocked.includes(ch.id);const isActive=sc.activeChar===ch.id;
      const card=document.createElement('div');card.className=`char-card r-${ch.rarity}${!unlocked?' locked':''}${isActive?' active-char':''}`;
      card.innerHTML=`${isActive?'<div class="char-active-badge">Active</div>':''}${!unlocked?'<div style="position:absolute;top:6px;right:6px;font-size:11px;opacity:.6">🔒</div>':''}
      <span class="char-emoji">${ch.emoji}</span><div class="char-name">${ch.name}</div>
      <div class="char-rarity r-${ch.rarity}">${ch.rarity}</div><div class="char-bonus">${ch.bonus}</div>
      <div class="char-pts">${unlocked?'✓ Unlocked':(ch.pts===0?'Starter':ch.pts.toLocaleString()+' pts')}</div>`;
      if(unlocked&&!isActive){card.title=`Click to activate ${ch.name}`;card.addEventListener('click',()=>{sc.activeChar=ch.id;ss('SCORE',sc);renderProfile();updateStreakUI();showToast(`${ch.emoji} ${ch.name} activated!`);beep('click');});}
      grid.appendChild(card);
    });
    section.appendChild(grid);cs.appendChild(section);
  });
}


function showModal({title,body,btn,onConfirm}){
  const ov=document.createElement('div');ov.className='modal-ov';
  ov.innerHTML=`<div class="modal"><button class="modal-close" onclick="this.closest('.modal-ov').remove()">✕</button><div class="modal-title">${title}</div>${body}<button class="modal-btn" id="modal-confirm-btn">${btn||'Confirm'}</button></div>`;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
  if(onConfirm){
    ov.querySelector('#modal-confirm-btn').addEventListener('click',()=>{if(onConfirm()!==false)ov.remove();});
  }
}



// Safe startup + lazy view rendering helpers
// A missing optional element should not stop the schedule grid or saved blocks from rendering.
function safeInitStep(label, fn){
  try { if (typeof fn === 'function') fn(); }
  catch (err) { console.error(`Startup step failed: ${label}`, err); }
}

const _lazyViewStarted = new Set();
function runViewRenderer(view){
  try {
    if(view==='analytics') return renderAnalytics();
    if(view==='viewpoint' && typeof renderViewPoint === 'function') return renderViewPoint();
    if(view==='categories') return renderCategoriesView();
    if(view==='important-dates') return renderDates();
    if(view==='friends') { if (typeof initFriendRequestListener === 'function') initFriendRequestListener(); return renderFriends(); }
    if(view==='messages') { if (typeof initFriendRequestListener === 'function') initFriendRequestListener(); return renderMsgList(); }
    if(view==='business') return renderBusiness();
    if(view==='employees') return renderEmployees();
    if(view==='finances' && typeof renderFinances === 'function') return renderFinances();
    if(view==='profile') return renderProfile();
    if(view==='stories') return renderStoryView();
    if(view==='news' && typeof renderNews === 'function') return renderNews();
  } catch (err) {
    console.error(`View render failed: ${view}`, err);
    if (typeof showToast === 'function') showToast(`Could not load ${VIEW_TITLES[view]||view}. Check console.`);
  }
}

const VIEW_TITLES={home:'Schedule',categories:'Categories','important-dates':'Important Dates',analytics:'Analytics',viewpoint:'ViewPoint',friends:'Friends',messages:'Messages',business:'Business',employees:'Employees',profile:'Profile',stories:'Stories',finances:'Finances',news:'News'};
function switchView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.mbn-item[data-view]').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('view-'+view);if(el)el.classList.add('active');
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');
  document.querySelector(`.mbn-item[data-view="${view}"]`)?.classList.add('active');
  const titleEl=document.getElementById('topbar-title');
  if(titleEl) titleEl.textContent=VIEW_TITLES[view]||view;
  const dateNav=document.getElementById('date-nav');
  if(dateNav) dateNav.classList.toggle('hidden',view!=='home');

  // Lazy-load heavier pages only when the user opens them.
  // Keep re-rendering data views so they stay accurate, but do not run them during app startup.
  if(view !== 'home') runViewRenderer(view);
  if(typeof beep === 'function') beep('click');
}



// ── TIMER LOGIC ─────────────────────────────────────────────────────────────
let timerInterval = null;
let timerSelectedSeconds = Number(localStorage.getItem('TF_TIMER_SELECTED_SECONDS')) || 25 * 60;
let timerSeconds = timerSelectedSeconds;
let timerMode = 'timer'; // 'timer' | 'stopwatch'
let timerRunning = false;
let timerEndTime = null;
let timerStartTime = null;

function formatTimer(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function syncTimerDurationSelect() {
  const dur = document.getElementById('timer-duration-sel');
  if (!dur) return;
  const allowed = Array.from(dur.options).map(o => Number(o.value));
  if (!allowed.includes(timerSelectedSeconds)) timerSelectedSeconds = 25 * 60;
  dur.value = String(timerSelectedSeconds);
}

function updateTimerUI() {
  const disp = document.getElementById('timer-display');
  if(disp) disp.textContent = formatTimer(timerSeconds);
  const btn = document.getElementById('timer-start-btn');
  if(btn) btn.textContent = timerRunning ? 'Pause' : 'Start';
  const dur = document.getElementById('timer-duration-sel');
  if(dur) dur.style.display = timerMode === 'timer' ? '' : 'none';
}

function toggleTimerMode() {
  const sel = document.getElementById('timer-mode-sel');
  timerMode = sel ? sel.value : 'timer';
  if(timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  }
  timerSeconds = timerMode === 'timer' ? timerSelectedSeconds : 0;
  updateTimerUI();
}

function changeTimerDuration() {
  const dur = document.getElementById('timer-duration-sel');
  const next = Number(dur?.value) || 25 * 60;
  timerSelectedSeconds = next;
  localStorage.setItem('TF_TIMER_SELECTED_SECONDS', String(timerSelectedSeconds));
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  }
  timerMode = 'timer';
  const modeSel = document.getElementById('timer-mode-sel');
  if(modeSel) modeSel.value = 'timer';
  timerSeconds = timerSelectedSeconds;
  updateTimerUI();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerMode === 'timer' ? timerSelectedSeconds : 0;
  updateTimerUI();
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  } else {
    timerRunning = true;
    const now = Date.now();
    if (timerMode === 'timer') timerEndTime = now + (timerSeconds * 1000);
    else timerStartTime = now - (timerSeconds * 1000);

    timerInterval = setInterval(() => {
      const current = Date.now();
      if (timerMode === 'timer') {
        timerSeconds = Math.max(0, Math.ceil((timerEndTime - current) / 1000));
        if (timerSeconds <= 0) timerComplete();
      } else {
        timerSeconds = Math.floor((current - timerStartTime) / 1000);
      }
      updateTimerUI();
    }, 500);
  }
  updateTimerUI();
}

function updateTimerBlockOptions() {
  const linkSel = document.getElementById('timer-block-link');
  if(!linkSel) return;
  const currentVal = linkSel.value;
  linkSel.innerHTML = '<option value="">No Block Link</option>';

  document.querySelectorAll('#grid-area .block').forEach(b => {
     if(b.dataset.done !== '1') {
       const text = b.querySelector('.block-text')?.textContent?.substring(0, 15) || 'Block';
       const opt = document.createElement('option');
       opt.value = b.dataset.bid;
       opt.textContent = text;
       linkSel.appendChild(opt);
     }
  });
  if(currentVal) linkSel.value = currentVal;
}

function timerComplete() {
  clearInterval(timerInterval);
  timerRunning = false;
  if (typeof beep === 'function') beep('complete');
  const linkSel = document.getElementById('timer-block-link');
  if(linkSel && linkSel.value) {
     const bId = linkSel.value;
     const target = document.querySelector(`.block[data-bid="${bId}"]`);
     if(target && typeof toggleBlockDone === 'function') {
         const chk = target.querySelector('.block-check');
         if(chk && target.dataset.done !== '1') toggleBlockDone(target, chk);
     }
     linkSel.value = '';
  }
  if(typeof showToast === 'function') showToast('Timer complete!');
  timerSeconds = timerSelectedSeconds;
  updateTimerUI();
}

document.addEventListener('mouseup', () => setTimeout(updateTimerBlockOptions, 100));
document.addEventListener('DOMContentLoaded', () => { syncTimerDurationSelect(); timerSeconds = timerSelectedSeconds; updateTimerUI(); });


// Responsive sidebar toggle: desktop/tablet landscape collapses the sidebar;
// phone portrait opens it as a slide-out drawer.
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const isPhonePortrait = window.matchMedia('(max-width: 599px) and (orientation: portrait)').matches;
  if (isPhonePortrait) {
    sidebar.classList.toggle('mobile-open');
    sidebar.classList.remove('collapsed');
  } else {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.remove('mobile-open');
  }
}

function init(){
  safeInitStep('ensure starter character',()=>{const cc=getCharState(); if(!cc.unlocked.includes('neko')){cc.unlocked.push('neko'); ss('CHARS',cc);}});
  safeInitStep('theme', initTheme);
  safeInitStep('time grid', buildTimeGrid);
  safeInitStep('now line',()=>{updateNowLine(); if(!window._tfNowLineTimer){window._tfNowLineTimer=setInterval(updateNowLine,60000);}});
  safeInitStep('grid drop', setupGridDrop);
  safeInitStep('sticker drops',()=>{ if(typeof setupScheduleStickerDrop==='function') setupScheduleStickerDrop(); });
  safeInitStep('streak UI', updateStreakUI);
  safeInitStep('notification badge', updateNotifBadge);
  safeInitStep('right panel', renderRightPanel);
  safeInitStep('tasks',()=>{ if(typeof renderTasks==='function') renderTasks(); });
  safeInitStep('plant',()=>{ if(typeof renderPlant==='function') renderPlant(); if(typeof renderStickerStore==='function') renderStickerStore(); });
  safeInitStep('bird preference',()=>{ if(typeof applyBirdPreference==='function') applyBirdPreference(); });
  safeInitStep('preset bar', renderPresetBar);
  safeInitStep('home date',()=>setCurrentDate(fmtDate(today)));
  safeInitStep('scroll to current hour',()=>setTimeout(()=>{const ws=document.getElementById('ws-scroll'); if(ws) ws.scrollTop=Math.max(0,today.getHours()*ROW_H-120);},200));
  safeInitStep('category side panel',()=>{document.getElementById('cat-side-panel')?.classList.add('open'); if(typeof updateCatPanelToggle==='function') updateCatPanelToggle();});
  safeInitStep('date nav label',()=>{const el=document.getElementById('dnav-label'); if(el) el.textContent=dateDisplayStr(fmtDate(today));});
  safeInitStep('date badge',()=>{const dates=getDates(); const pinned=dates.filter(d=>d.pinned).length; const el=document.getElementById('nb-dates'); if(el){el.textContent=pinned||''; el.style.display=pinned?'':'none';}});
  safeInitStep('global click handlers',()=>{
    if(!window._tfGlobalClicksBound){
      document.addEventListener('click',()=>{closeDD(); closeNotif();});
      document.addEventListener('click',e=>{ const sb=document.getElementById('sidebar'); if(window.innerWidth<=768 && sb && !e.target.closest('#sidebar') && !e.target.closest('.topbar-hamburger')) sb.classList.remove('mobile-open'); }, true);
      window._tfGlobalClicksBound=true;
    }
  });
  // Business, employees, friends, messages, stories, news, and finances now render only when opened.
  if(typeof showToast === 'function') showToast('⌨️ Select block → Delete to remove · Ctrl+drag to duplicate');
}
// init() is called by auth.js after Google sign-in resolves.
// Do NOT call it here directly — auth.js owns the boot sequence.

function editUsername() {
  const currentName = window.TF_PROFILE?.displayName || window.TF_USER?.displayName || '';
  showModal({
    title: 'Change username',
    body: `<label class="tf-label" for="username-modal-input">New username</label>
      <input id="username-modal-input" class="tf-input" maxlength="32" value="${escHtml(currentName)}" placeholder="Enter a new username" autofocus>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">This updates the name shown inside NucleonTime.</div>`,
    btn: 'Save Username',
    onConfirm: () => {
      const input = document.getElementById('username-modal-input');
      const newName = input?.value?.trim();
      if (!newName) {
        showToast('Please enter a username.');
        input?.focus();
        return false;
      }
      window.TF_PROFILE = window.TF_PROFILE || {};
      window.TF_PROFILE.displayName = newName;
      if (typeof updateProfile === 'function') updateProfile({ displayName: newName });
      if (window.TF_USER && typeof _updateSidebarUser === 'function') _updateSidebarUser(window.TF_USER, window.TF_PROFILE);
      renderProfile();
      showToast('Username updated ✓');
    }
  });
  setTimeout(()=>document.getElementById('username-modal-input')?.focus(),50);
}

// BACKGROUND CUSTOMIZATION
function showBgModal() {
  const body = `
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
      <button onclick="setBg('mountain')" class="modal-btn" style="background:var(--surface);color:var(--text);border:1px solid var(--border);">Mountain Night</button>
      <button onclick="setBg('dark')" class="modal-btn" style="background:#111;color:#fff;border:1px solid var(--border);">Simple Dark (Default)</button>
      <button onclick="setBg('bright')" class="modal-btn" style="background:#f5f5f5;color:#111;border:1px solid var(--border);">Simple Bright</button>
      <div style="margin-top:10px; font-size:12px; color:var(--muted);">Upload Custom Photo:</div>
      <label class="tf-btn tf-btn-secondary" style="text-align:center; cursor:pointer;">
        Choose File
        <input type="file" id="bg-upload-input" accept="image/*" style="display:none;" onchange="handleBgUpload(event)">
      </label>
    </div>
  `;
  showModal({title:'Customize Background', body, btn:'Close', onConfirm:()=>true});
}

function setBg(type, url) {
  const appContainer = document.body;
  if (!appContainer) return;

  // Clear previous inline styles on body related to background
  appContainer.style.backgroundImage = "";
  appContainer.style.backgroundColor = "";
  appContainer.style.backgroundSize = "cover";
  appContainer.style.backgroundPosition = "center";
  appContainer.style.backgroundAttachment = "fixed";

  if(type === 'mountain') {
    appContainer.style.backgroundImage = "url('https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3')";
    localStorage.setItem('tf_bg', 'mountain');
    document.documentElement.dataset.theme = 'dark';
  } else if (type === 'dark') {
    appContainer.style.backgroundColor = "#111";
    localStorage.setItem('tf_bg', 'dark');
    document.documentElement.dataset.theme = 'dark';
  } else if (type === 'bright') {
    appContainer.style.backgroundColor = "#f5f5f5";
    localStorage.setItem('tf_bg', 'bright');
    document.documentElement.dataset.theme = 'light';
  } else if (type === 'custom') {
    // Add dimming overlay for readability on custom images
    appContainer.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${url}')`;
    localStorage.setItem('tf_bg', url);
  }
}

function handleBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Create a canvas to resize/compress the image
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const MAX_SIZE = 1920;
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setBg('custom', dataUrl);
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedBg = localStorage.getItem('tf_bg') || 'dark';
  if (savedBg === 'default') {
    setBg('dark');
  } else if (savedBg === 'mountain' || savedBg === 'dark' || savedBg === 'bright') {
    setBg(savedBg);
  } else {
    setBg('custom', savedBg);
  }
});

// Mobile usability: keep the right Activity/Store panel closed as a drawer on phones
// so it does not block the main workspace. Users can open it from the bottom Store button.
(function(){
  function isMobileLayout(){
    return window.matchMedia('(max-width: 700px), (max-height: 520px) and (orientation: landscape), (hover: none) and (pointer: coarse)').matches;
  }
  function syncMobileLayout(){
    const rp = document.getElementById('right-panel');
    const tb = document.getElementById('topbar');
    if (tb) document.documentElement.style.setProperty('--mobile-topbar-h', `${Math.ceil(tb.getBoundingClientRect().height)}px`);
    if (rp && isMobileLayout() && !rp.dataset.mobileTouched) rp.classList.add('hidden');
    if (rp && !isMobileLayout()) { rp.dataset.mobileTouched = ''; }
  }
  const oldToggleRightPanel = window.toggleRightPanel;
  window.toggleRightPanel = function(){
    const rp = document.getElementById('right-panel');
    if (rp && isMobileLayout()) rp.dataset.mobileTouched = '1';
    if (typeof oldToggleRightPanel === 'function') oldToggleRightPanel();
    else if (rp) rp.classList.toggle('hidden');
    syncMobileLayout();
  };
  const oldSwitchView = window.switchView;
  window.switchView = function(view){
    const out = oldSwitchView ? oldSwitchView.apply(this, arguments) : undefined;
    if (isMobileLayout()) {
      document.getElementById('sidebar')?.classList.remove('mobile-open');
      const rp = document.getElementById('right-panel');
      if (rp) rp.classList.add('hidden');
      document.getElementById('cat-side-panel')?.classList.remove('open');
    }
    setTimeout(syncMobileLayout, 50);
    return out;
  };
  window.addEventListener('resize', syncMobileLayout);
  window.addEventListener('orientationchange', () => setTimeout(syncMobileLayout, 200));
  document.addEventListener('DOMContentLoaded', () => setTimeout(syncMobileLayout, 80));
})();
