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


const VIEW_TITLES={home:'Schedule',categories:'Categories','important-dates':'Important Dates',analytics:'Analytics',friends:'Friends',messages:'Messages',business:'Business',employees:'Employees',profile:'Profile',stories:'Stories'};
function switchView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.mbn-item[data-view]').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('view-'+view);if(el)el.classList.add('active');
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');
  document.querySelector(`.mbn-item[data-view="${view}"]`)?.classList.add('active');
  document.getElementById('topbar-title').textContent=VIEW_TITLES[view]||view;
  document.getElementById('date-nav').classList.toggle('hidden',view!=='home');
  // On-switch renders
  if(view==='analytics')renderAnalytics();
  if(view==='categories')renderCategoriesView();
  if(view==='important-dates')renderDates();
  if(view==='friends')renderFriends();
  if(view==='messages')renderMsgList();
  if(view==='business')renderBusiness();
  if(view==='employees')renderEmployees();
  if(view==='profile')renderProfile();
  if(view==='stories')renderStoryView();
  if(view==='news') {
      if(typeof renderNews === 'function') renderNews();
  }
  beep('click');
}



// ── TIMER LOGIC ─────────────────────────────────────────────────────────────
let timerInterval = null;
let timerSeconds = 25 * 60; // 25 min default
let timerMode = 'pomodoro'; // 'pomodoro' | 'stopwatch' | 'break'
let timerRunning = false;
let timerEndTime = null;
let timerStartTime = null;

function formatTimer(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  const disp = document.getElementById('timer-display');
  if(disp) disp.textContent = formatTimer(timerSeconds);
  const btn = document.getElementById('timer-start-btn');
  if(btn) btn.textContent = timerRunning ? 'Pause' : 'Start';
}

function toggleTimerMode() {
  const sel = document.getElementById('timer-mode-sel');
  timerMode = sel ? sel.value : 'pomodoro';
  if(timerRunning) toggleTimer(); // Stop it on switch
  timerSeconds = timerMode === 'pomodoro' ? 25 * 60 : (timerMode === 'break' ? 5 * 60 : 0);
  updateTimerUI();
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  } else {
    timerRunning = true;
    const now = Date.now();
    if (timerMode === 'pomodoro' || timerMode === 'break') {
        timerEndTime = now + (timerSeconds * 1000);
    } else {
        timerStartTime = now - (timerSeconds * 1000);
    }

    timerInterval = setInterval(() => {
      const current = Date.now();
      if (timerMode === 'pomodoro' || timerMode === 'break') {
        timerSeconds = Math.max(0, Math.ceil((timerEndTime - current) / 1000));
        if (timerSeconds <= 0) {
          timerComplete();
        }
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

  if (timerMode === 'pomodoro') {
      if (typeof awardPoints === 'function') awardPoints(50, null, null);

      const linkSel = document.getElementById('timer-block-link');
      if(linkSel && linkSel.value) {
         const bId = linkSel.value;
         const target = document.querySelector(`.block[data-bid="${bId}"]`);
         if(target && typeof toggleBlockDone === 'function') {
             const chk = target.querySelector('.block-check');
             if(chk && target.dataset.done !== '1') {
                 toggleBlockDone(target, chk);
             }
         }
         linkSel.value = ""; // clear link after completion
      }
      if(typeof showToast === 'function') showToast('Pomodoro Complete! Time for a 5 min break. 🎉');

      // Auto switch to break mode
      timerMode = 'break';
      const sel = document.getElementById('timer-mode-sel');
      // Create option if it doesn't exist
      if(sel && !sel.querySelector('option[value="break"]')) {
          const opt = document.createElement('option');
          opt.value = 'break';
          opt.textContent = 'Break (5m)';
          sel.appendChild(opt);
      }
      if(sel) sel.value = 'break';
      timerSeconds = 5 * 60;
  } else if (timerMode === 'break') {
      if(typeof showToast === 'function') showToast('Break Over! Back to work.');
      timerMode = 'pomodoro';
      const sel = document.getElementById('timer-mode-sel');
      if(sel) sel.value = 'pomodoro';
      timerSeconds = 25 * 60;
  }
  updateTimerUI();
}

document.addEventListener('mouseup', () => setTimeout(updateTimerBlockOptions, 100));

function init(){
  const cc=getCharState(); if(!cc.unlocked.includes('neko')){cc.unlocked.push('neko'); ss('CHARS',cc);} 
  initTheme(); buildTimeGrid(); updateNowLine(); setInterval(updateNowLine,60000); setupGridDrop(); updateStreakUI(); updateNotifBadge(); renderRightPanel(); renderPresetBar(); renderDates(); setCurrentDate(fmtDate(today));
  setTimeout(()=>{const ws=document.getElementById('ws-scroll'); if(ws) ws.scrollTop=Math.max(0,today.getHours()*ROW_H-120);},200);
  document.getElementById('cat-side-panel').classList.add('open');
  document.getElementById('dnav-label').textContent=dateDisplayStr(fmtDate(today));
  const dates=getDates(); document.getElementById('nb-dates').textContent=dates.filter(d=>d.pinned).length||''; document.getElementById('nb-dates').style.display=dates.filter(d=>d.pinned).length?'':'none';
  document.addEventListener('click',()=>{closeDD(); closeNotif();});
  document.querySelector('.topbar-hamburger')?.addEventListener('click',()=>{ if(window.innerWidth<=768){ document.getElementById('sidebar').classList.toggle('mobile-open'); } });
  document.addEventListener('click',e=>{ if(window.innerWidth<=768 && !e.target.closest('#sidebar') && !e.target.closest('.topbar-hamburger')) document.getElementById('sidebar').classList.remove('mobile-open'); }, true);
  setBizViewMode('week');
  showToast('⌨️ Select block → Delete to remove · Ctrl+drag to duplicate');
}
// init() is called by auth.js after Google sign-in resolves.
// Do NOT call it here directly — auth.js owns the boot sequence.

function editUsername() {
  const newName = prompt("Enter a new username:");
  if (newName && newName.trim() !== '') {
    window.TF_PROFILE.displayName = newName.trim();
    if (typeof updateProfile === 'function') {
      updateProfile({ displayName: newName.trim() });
    }
    if (window.TF_USER && typeof _updateSidebarUser === 'function') {
      _updateSidebarUser(window.TF_USER, window.TF_PROFILE);
    }
    renderProfile();
  }
}

// BACKGROUND CUSTOMIZATION
function showBgModal() {
  const body = `
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
      <button onclick="setBg('default')" class="modal-btn" style="background:var(--surface);color:var(--text);border:1px solid var(--border);">Mountain Night (Default)</button>
      <button onclick="setBg('dark')" class="modal-btn" style="background:#111;color:#fff;border:1px solid var(--border);">Simple Dark</button>
      <button onclick="setBg('bright')" class="modal-btn" style="background:#f5f5f5;color:#111;border:1px solid var(--border);">Simple Bright</button>
      <div style="margin-top:10px; font-size:12px; color:var(--muted);">Upload Custom Photo:</div>
      <input type="file" id="bg-upload-input" accept="image/*" style="font-size:12px; color:var(--text);" onchange="handleBgUpload(event)">
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

  if(type === 'default') {
    appContainer.style.backgroundImage = "url('https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3')";
    localStorage.setItem('tf_bg', 'default');
  } else if (type === 'dark') {
    appContainer.style.backgroundColor = "#111";
    localStorage.setItem('tf_bg', 'dark');
  } else if (type === 'bright') {
    appContainer.style.backgroundColor = "#f5f5f5";
    localStorage.setItem('tf_bg', 'bright');
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
  const savedBg = localStorage.getItem('tf_bg');
  if (savedBg) {
    if (savedBg === 'default' || savedBg === 'dark' || savedBg === 'bright') {
      setBg(savedBg);
    } else {
      setBg('custom', savedBg);
    }
  }
});
