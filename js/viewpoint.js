// ── VIEWPOINT: shared collaborative routine schedules ───────────────────────
let vpActiveId = null;
let vpActiveData = null;
let vpDate = fmtDate(new Date());
let vpUnsubBoards = null;
let vpUnsubDay = null;
let vpUnsubPresence = null;
let vpBlocks = [];
let vpEditingTimer = null;
let vpRemoteEditing = {};
let vpSaving = false;
let vpDragColor = null;
let vpSelectedBlock = null;
let vpStickers = [];

const vpDb = () => window.TF_DB;
const vpUid = () => window.TF_USER?.uid;
const vpName = () => window.TF_USER?.displayName || window.TF_PROFILE?.displayName || 'Friend';

function renderViewPoint(){
  const view = document.querySelector('#view-viewpoint .view-inner');
  if(!view) return;
  view.innerHTML = `
    <div class="viewpoint-shell">
      <div class="vp-head">
        <div>
          <div class="view-title">ViewPoint</div>
          <div class="view-sub">Create shared schedule routines that friends can edit together.</div>
        </div>
        <button class="task-add-btn" onclick="createViewPoint()">+ Create ViewPoint</button>
      </div>
      <div class="vp-layout">
        <aside class="vp-list-card card-base">
          <div class="vp-section-title">My ViewPoints</div>
          <div id="vp-my-list" class="vp-list-mini">Loading...</div>
          <div class="vp-section-title" style="margin-top:16px;">Shared With Me</div>
          <div id="vp-shared-list" class="vp-list-mini">Loading...</div>
          <div class="vp-section-title" style="margin-top:16px;">ViewPoint Requests</div>
          <div id="vp-invites-list" class="vp-list-mini">Loading...</div>
          <div class="vp-cat-card">
            <div class="vp-section-title">Drag to ViewPoint</div>
            <div id="vp-cat-panel"></div>
          </div>
        </aside>
        <main class="vp-board card-base">
          <div id="vp-board-empty" class="vp-empty">Select or create a ViewPoint to start.</div>
          <div id="vp-board-main" style="display:none;">
            <div class="vp-board-top">
              <div>
                <h2 id="vp-title">ViewPoint</h2>
                <div id="vp-desc" class="view-sub"></div>
                <div id="vp-editing" class="vp-editing"></div>
              </div>
              <div class="vp-controls">
                <input type="date" class="tf-input" id="vp-date" onchange="setVpDate(this.value)">
                <button class="friend-btn" onclick="shareViewPoint()">Share</button>
                <button class="friend-btn friend-btn-danger" onclick="leaveOrDeleteViewPoint()">Leave</button>
              </div>
            </div>
            <div class="vp-swatch-row" id="vp-swatches"></div>
            <div class="vp-grid-wrap">
              <div class="vp-time-col" id="vp-time-col"></div>
              <div class="vp-grid" id="vp-grid"></div>
            </div>
          </div>
        </main>
      </div>
    </div>`;
  renderVpScaffold();
  listenViewPoints();
  listenViewPointInvites();
}

function renderVpScaffold(){
  const timeCol = document.getElementById('vp-time-col');
  const grid = document.getElementById('vp-grid');
  const swatches = document.getElementById('vp-swatches');
  if(timeCol){
    timeCol.innerHTML='';
    for(let h=0;h<24;h++) timeCol.innerHTML += `<div class="vp-time-row">${fmt12h(h)}</div>`;
  }
  if(grid){
    grid.innerHTML='';
    for(let h=0;h<24;h++) grid.innerHTML += `<div class="vp-row" style="top:${h*ROW_H}px"></div>`;
    bindVpGridEvents(grid);
  }
  if(swatches){
    swatches.innerHTML='';
    BLOCK_COLORS.forEach(col=>{
      const chip=document.createElement('div');
      chip.className='vp-swatch'; chip.title=col.name; chip.draggable=true; chip.style.background=col.hex;
      chip.addEventListener('dragstart',e=>{vpDragColor=col;e.dataTransfer.setData('text/plain','vp-block');});
      chip.addEventListener('dragend',()=>{vpDragColor=null;});
      swatches.appendChild(chip);
    });
  }
  renderVpCategoryPanel();
}

function renderVpCategoryPanel(){
  const wrap=document.getElementById('vp-cat-panel'); if(!wrap)return;
  wrap.innerHTML='';
  const swTitle=document.createElement('div'); swTitle.className='vp-mini-title'; swTitle.textContent='Colored blocks'; wrap.appendChild(swTitle);
  const swGrid=document.createElement('div'); swGrid.className='vp-side-swatches';
  BLOCK_COLORS.forEach(col=>{ const chip=document.createElement('div'); chip.className='vp-side-swatch'; chip.style.background=col.hex; chip.draggable=true; chip.title=col.name; chip.addEventListener('dragstart',e=>{vpDragColor=col;e.dataTransfer.setData('text/plain','vp-block');}); chip.addEventListener('dragend',()=>{vpDragColor=null;}); swGrid.appendChild(chip); });
  wrap.appendChild(swGrid);
  const catTitle=document.createElement('div'); catTitle.className='vp-mini-title'; catTitle.textContent='Categories → block'; wrap.appendChild(catTitle);
  CATEGORIES.forEach(cat=>{ const item=document.createElement('div'); item.className='vp-side-cat'; item.draggable=true; item.innerHTML=`<span class="cat-dot" style="background:${cat.color}"></span><b>${cat.emoji} ${escHtml(cat.name)}</b>`; item.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain','vp-cat-tag');e.dataTransfer.setData('cat-id',cat.id);}); wrap.appendChild(item); });
}

function bindVpGridEvents(grid){
  if(grid.dataset.bound) return;
  grid.dataset.bound='1';
  grid.addEventListener('dragover',e=>{e.preventDefault();});
  grid.addEventListener('drop',e=>{
    e.preventDefault();
    const type=e.dataTransfer.getData('text/plain');
    if(type==='vp-cat-tag'){
      const catId=e.dataTransfer.getData('cat-id');
      const blk=document.elementFromPoint(e.clientX,e.clientY)?.closest('.vp-block');
      if(blk&&catId){ applyVpBlockCat(blk.dataset.id, catId); showToast('Category applied ✓'); }
      else showToast('Drop a category onto a ViewPoint block.');
      return;
    }
    if(type==='owned-sticker'){
      const stickerId=e.dataTransfer.getData('sticker-id');
      if(typeof addVpSticker === 'function'){
        const r=grid.getBoundingClientRect(); addVpSticker(stickerId, Math.max(0,e.clientX-r.left-36), Math.max(0,e.clientY-r.top-36));
      }
      return;
    }
    if(type !== 'vp-block') return;
    const r=grid.getBoundingClientRect();
    const col=vpDragColor || BLOCK_COLORS[0];
    const block={id:'vp_'+Date.now(),left:Math.max(0,e.clientX-r.left-105),top:snapY(e.clientY-r.top),width:210,height:ROW_H-6,text:'',hex:col.hex,fg:col.fg,name:col.name||'',catIds:[]};
    vpBlocks.push(block); markVpEditing(); renderVpBlocks(); saveVpDay();
  });
  grid.addEventListener('click',e=>{ if(e.target===grid || e.target.classList.contains('vp-row')) selectVpBlock(null); });
}

function listenViewPoints(){
  if(vpUnsubBoards) vpUnsubBoards();
  if(!vpUid() || !vpDb()) return;
  vpUnsubBoards = vpDb().collection('viewpoints').where('members','array-contains',vpUid()).onSnapshot(snap=>{
    const boards=snap.docs.map(d=>({id:d.id,...d.data()}));
    const mine=boards.filter(b=>b.ownerId===vpUid());
    const shared=boards.filter(b=>b.ownerId!==vpUid());
    renderVpBoardList('vp-my-list', mine);
    renderVpBoardList('vp-shared-list', shared);
    if(vpActiveId && !boards.some(b=>b.id===vpActiveId)){vpActiveId=null;vpActiveData=null;showVpEmpty();}
  }, err=>console.warn('ViewPoint list failed', err));
}

function renderVpBoardList(id, boards){
  const el=document.getElementById(id); if(!el)return;
  if(!boards.length){ el.innerHTML='<div class="vp-muted">None yet.</div>'; return; }
  el.innerHTML='';
  boards.forEach(b=>{
    const item=document.createElement('button');
    item.className='vp-list-item'+(b.id===vpActiveId?' active':'');
    item.innerHTML=`<b>${escHtml(b.title||'Untitled')}</b><span>${escHtml(b.description||'')}</span>`;
    item.onclick=()=>openViewPoint(b.id);
    el.appendChild(item);
  });
}

function listenViewPointInvites(){
  if(!vpUid() || !vpDb()) return;
  vpDb().collection('users').doc(vpUid()).collection('viewpointInvites').where('status','==','pending').onSnapshot(snap=>{
    const list=document.getElementById('vp-invites-list'); if(!list)return;
    if(snap.empty){list.innerHTML='<div class="vp-muted">No requests.</div>';return;}
    list.innerHTML='';
    snap.docs.forEach(doc=>{
      const inv=doc.data();
      const seenKey = 'vp_invite_seen_' + doc.id;
      if(!localStorage.getItem(_pfx(seenKey))){
        localStorage.setItem(_pfx(seenKey),'1');
        if(typeof addNotif === 'function') addNotif('👁️','ViewPoint invite received');
      }
      const row=document.createElement('div'); row.className='vp-invite';
      row.innerHTML=`<b>${escHtml(inv.title||'ViewPoint')}</b><span>from ${escHtml(inv.fromName||'Friend')}</span><div><button class="friend-btn" onclick="acceptViewPointInvite('${doc.id}')">Accept</button><button class="friend-btn friend-btn-danger" onclick="declineViewPointInvite('${doc.id}')">Decline</button></div>`;
      list.appendChild(row);
    });
  }, err=>console.warn('ViewPoint invite listener failed',err));
}

async function createViewPoint(){
  showModal({title:'Create ViewPoint',body:`
    <label class="tf-label">Name</label><input class="tf-input" id="vp-new-title" placeholder="e.g. Sprint Workout Routine">
    <label class="tf-label" style="margin-top:10px;">Description</label><input class="tf-input" id="vp-new-desc" placeholder="What is this shared routine for?">
  `,btn:'Create',onConfirm:()=>{
    const title=document.getElementById('vp-new-title').value.trim();
    const description=document.getElementById('vp-new-desc').value.trim();
    if(!title){showToast('Name your ViewPoint first.');return false;}
    createViewPointDoc(title,description); return true;
  }});
}

async function createViewPointDoc(title, description){
  if(!vpUid()) return showToast('Sign in first.');
  const ref=vpDb().collection('viewpoints').doc();
  await ref.set({title,description,ownerId:vpUid(),ownerName:vpName(),members:[vpUid()],pendingMembers:[],memberNames:{[vpUid()]:vpName()},createdAt:Date.now(),updatedAt:Date.now()});
  showToast('ViewPoint created.'); openViewPoint(ref.id);
}

async function openViewPoint(id){
  vpActiveId=id;
  const doc=await vpDb().collection('viewpoints').doc(id).get();
  if(!doc.exists){showToast('ViewPoint not found.');return;}
  vpActiveData={id:doc.id,...doc.data()};
  document.getElementById('vp-board-empty').style.display='none';
  document.getElementById('vp-board-main').style.display='block';
  document.getElementById('vp-title').textContent=vpActiveData.title||'ViewPoint';
  document.getElementById('vp-desc').textContent=vpActiveData.description||'';
  document.getElementById('vp-date').value=vpDate;
  listenVpDay(); listenVpPresence(); renderViewPointListsActive();
}
function renderViewPointListsActive(){ document.querySelectorAll('.vp-list-item').forEach(x=>x.classList.remove('active')); }
function showVpEmpty(){document.getElementById('vp-board-empty').style.display='block';document.getElementById('vp-board-main').style.display='none';}
function setVpDate(val){vpDate=val||fmtDate(new Date()); listenVpDay();}
function vpDayRef(){return vpDb().collection('viewpoints').doc(vpActiveId).collection('days').doc(vpDate);}

function listenVpDay(){
  if(vpUnsubDay) vpUnsubDay();
  if(!vpActiveId)return;
  vpUnsubDay=vpDayRef().onSnapshot(doc=>{
    if(vpSaving){vpSaving=false;return;}
    const data=doc.data()||{}; vpBlocks=Array.isArray(data.blocks)?data.blocks:[]; vpStickers=Array.isArray(data.stickers)?data.stickers:[]; renderVpBlocks(); renderVpStickers();
  }, err=>console.warn('ViewPoint day failed',err));
}

function renderVpBlocks(){
  const grid=document.getElementById('vp-grid'); if(!grid)return;
  grid.querySelectorAll('.vp-block').forEach(b=>b.remove());
  vpBlocks.forEach(b=>grid.appendChild(makeVpBlockEl(b)));
}
function renderVpStickers(){
  const grid=document.getElementById('vp-grid'); if(!grid)return;
  grid.querySelectorAll('.vp-placed-sticker').forEach(x=>x.remove());
  vpStickers.forEach(s=>grid.appendChild(makePlacedStickerEl(s,'viewpoint')));
}
function collectVpStickers(){
  const grid=document.getElementById('vp-grid'); if(!grid)return [];
  return Array.from(grid.querySelectorAll('.vp-placed-sticker')).map(el=>({id:el.dataset.id, stickerId:el.dataset.stickerId, src:el.dataset.src, ownerId:el.dataset.ownerId||'', left:parseFloat(el.style.left)||0, top:parseFloat(el.style.top)||0, width:parseFloat(el.style.width)||72, height:parseFloat(el.style.height)||72, rotate:parseFloat(el.dataset.rotate)||0}));
}
function addVpSticker(stickerId,x,y){
  if(typeof hasSticker !== 'function' || !hasSticker(stickerId)) return showToast('Buy this sticker first.');
  const st=getStickerById(stickerId); if(!st)return;
  const data={id:'vpst_'+Date.now(),stickerId,src:stickerSvgData(st),ownerId:vpUid(),left:x,top:y,width:72,height:72,rotate:0};
  vpStickers.push(data); document.getElementById('vp-grid')?.appendChild(makePlacedStickerEl(data,'viewpoint')); markVpEditing(); saveVpDay();
}
function saveVpStickers(){ vpStickers=collectVpStickers(); markVpEditing(); saveVpDayDebounced(); }

function makeVpBlockEl(data){
  const b=document.createElement('div'); b.className='vp-block'; b.dataset.id=data.id;
  b.style.cssText=`left:${data.left||0}px;top:${data.top||0}px;width:${data.width||210}px;height:${data.height||ROW_H-6}px;background:${data.hex||'#38BDF8'};color:${data.fg||'#07111f'}`;
  const cats=(data.catIds||[]).map(id=>CAT_MAP[id]).filter(Boolean);
  const dots=cats.length?cats.map(c=>`<span class="vp-cat-dot" style="background:${c.color}" title="${escHtml(c.name)}"></span>`).join(''):'<span class="vp-cat-dot empty"></span>';
  b.innerHTML=`<div class="vp-block-top"><span class="vp-cat-dots">${dots}</span><button type="button">×</button></div><div class="vp-block-text" contenteditable="true" data-ph="Shared routine...">${_sanitizeBlockHtml(data.text||'')}</div><div class="vp-resize"></div>`;
  const txt=b.querySelector('.vp-block-text');
  txt.addEventListener('mousedown',e=>e.stopPropagation());
  txt.addEventListener('input',()=>{ data.text=txt.innerHTML; markVpEditing(); saveVpDayDebounced(); });
  b.querySelector('button').onclick=e=>{e.stopPropagation(); vpBlocks=vpBlocks.filter(x=>x.id!==data.id); markVpEditing(); renderVpBlocks(); saveVpDay();};
  b.addEventListener('mousedown',e=>{ if(e.target.closest('.vp-block-text,.vp-resize,button'))return; selectVpBlock(b); dragVpBlock(e,b,data); });
  b.querySelector('.vp-resize').addEventListener('mousedown',e=>{e.stopPropagation(); resizeVpBlock(e,b,data);});
  return b;
}
function applyVpBlockCat(blockId, catId){
  const data=vpBlocks.find(b=>b.id===blockId); if(!data)return;
  data.catIds=Array.isArray(data.catIds)?data.catIds:[];
  if(data.catIds.includes(catId)) data.catIds=data.catIds.filter(x=>x!==catId);
  else if(data.catIds.length<2) data.catIds.push(catId);
  else data.catIds[1]=catId;
  markVpEditing(); renderVpBlocks(); renderVpStickers(); saveVpDay();
}
function selectVpBlock(el){ if(vpSelectedBlock&&vpSelectedBlock!==el)vpSelectedBlock.classList.remove('selected'); vpSelectedBlock=el; if(el)el.classList.add('selected'); }
function dragVpBlock(e,el,data){
  e.preventDefault(); markVpEditing(); const grid=document.getElementById('vp-grid'); const gr=grid.getBoundingClientRect(); const br=el.getBoundingClientRect(); const ox=e.clientX-br.left, oy=e.clientY-br.top;
  const mm=ev=>{data.left=Math.max(0,ev.clientX-gr.left-ox); data.top=Math.max(0,Math.min(24*ROW_H-el.offsetHeight,snapY(ev.clientY-gr.top-oy))); el.style.left=data.left+'px'; el.style.top=data.top+'px';};
  const mu=()=>{saveVpDay();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
}
function resizeVpBlock(e,el,data){
  e.preventDefault(); markVpEditing(); const sy=e.clientY, sh=el.offsetHeight, top=parseFloat(el.style.top)||0;
  const mm=ev=>{data.height=Math.max(ROW_H-6,Math.min(sh+(ev.clientY-sy),24*ROW_H-top-6)); el.style.height=data.height+'px';};
  const mu=()=>{data.height=(Math.max(1,Math.round(el.offsetHeight/ROW_H))*ROW_H-6);el.style.height=data.height+'px';saveVpDay();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
}
function saveVpDayDebounced(){clearTimeout(saveVpDayDebounced._t);saveVpDayDebounced._t=setTimeout(saveVpDay,450);}
async function saveVpDay(){ if(!vpActiveId)return; vpSaving=true; vpStickers=collectVpStickers(); await vpDayRef().set({blocks:vpBlocks,stickers:vpStickers,updatedAt:Date.now(),updatedBy:vpUid()},{merge:true}); await vpDb().collection('viewpoints').doc(vpActiveId).set({updatedAt:Date.now()},{merge:true}); }

async function shareViewPoint(){
  if(!vpActiveId)return;
  const friends=_friendsCache.length?_friendsCache:await _loadFriends();
  if(!friends.length)return showToast('Add friends first.');
  const body = `<div class="vp-share-list">${friends.map((f,i)=>`<button class="vp-share-friend" type="button" data-idx="${i}">${escHtml(f.displayName||'Friend')}<span>${escHtml(f.friendTag||'')}</span></button>`).join('')}</div>`;
  showModal({title:'Share ViewPoint',body,btn:'Close',onConfirm:()=>true});
  document.querySelectorAll('.vp-share-friend').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const f=friends[Number(btn.dataset.idx)];
      if(f) sendViewPointInvite(f.uid, f.displayName || 'Friend');
    });
  });
}


async function sendViewPointInvite(friendUid, friendName){
  const b=vpActiveData; if(!b)return;
  const id=`${vpActiveId}_${vpUid()}`;
  await vpDb().collection('viewpoints').doc(vpActiveId).set({pendingMembers:firebase.firestore.FieldValue.arrayUnion(friendUid),memberNames:{...(b.memberNames||{}),[friendUid]:friendName},updatedAt:Date.now()},{merge:true});
  await vpDb().collection('users').doc(friendUid).collection('viewpointInvites').doc(id).set({viewpointId:vpActiveId,toUid:friendUid,fromUid:vpUid(),fromName:vpName(),title:b.title||'ViewPoint',description:b.description||'',status:'pending',createdAt:Date.now()},{merge:true});
  addNotif('👁️','ViewPoint invite sent.'); showToast('ViewPoint invite sent.'); document.querySelector('.modal-ov')?.remove();
}

async function acceptViewPointInvite(inviteId){
  const ref=vpDb().collection('users').doc(vpUid()).collection('viewpointInvites').doc(inviteId); const doc=await ref.get(); if(!doc.exists)return;
  const inv=doc.data();
  await vpDb().collection('viewpoints').doc(inv.viewpointId).set({members:firebase.firestore.FieldValue.arrayUnion(vpUid()),pendingMembers:firebase.firestore.FieldValue.arrayRemove(vpUid()),memberNames:{[vpUid()]:vpName()},updatedAt:Date.now()},{merge:true});
  await ref.set({status:'accepted',acceptedAt:Date.now()},{merge:true});
  showToast('ViewPoint accepted.'); openViewPoint(inv.viewpointId);
}
async function declineViewPointInvite(inviteId){
  const ref=vpDb().collection('users').doc(vpUid()).collection('viewpointInvites').doc(inviteId); const doc=await ref.get();
  if(doc.exists){ const inv=doc.data(); await vpDb().collection('viewpoints').doc(inv.viewpointId).set({pendingMembers:firebase.firestore.FieldValue.arrayRemove(vpUid())},{merge:true}).catch(()=>{}); }
  await ref.set({status:'declined',declinedAt:Date.now()},{merge:true}); showToast('Invite declined.');
}

async function leaveOrDeleteViewPoint(){
  if(!vpActiveData)return;
  if(!confirm('Leave this ViewPoint? Shared friends keep their copy.'))return;
  await vpDb().collection('viewpoints').doc(vpActiveId).set({members:firebase.firestore.FieldValue.arrayRemove(vpUid()),updatedAt:Date.now()},{merge:true});
  vpActiveId=null; vpActiveData=null; showVpEmpty(); showToast('Left ViewPoint.');
}

function listenVpPresence(){
  if(vpUnsubPresence) vpUnsubPresence();
  if(!vpActiveId)return;
  vpUnsubPresence=vpDb().collection('viewpoints').doc(vpActiveId).collection('presence').onSnapshot(snap=>{
    vpRemoteEditing={}; const now=Date.now();
    snap.docs.forEach(d=>{const x=d.data(); if(d.id!==vpUid() && x.editing && now-(x.updatedAt||0)<8000) vpRemoteEditing[d.id]=x.name||'Other side';});
    renderVpEditingText();
  });
}
function markVpEditing(){
  if(!vpActiveId||!vpUid())return;
  vpDb().collection('viewpoints').doc(vpActiveId).collection('presence').doc(vpUid()).set({name:vpName(),editing:true,updatedAt:Date.now()},{merge:true}).catch(()=>{});
  clearTimeout(vpEditingTimer); vpEditingTimer=setTimeout(()=>vpDb().collection('viewpoints').doc(vpActiveId).collection('presence').doc(vpUid()).set({editing:false,updatedAt:Date.now()},{merge:true}).catch(()=>{}),5000);
}
function renderVpEditingText(){
  const el=document.getElementById('vp-editing'); if(!el)return;
  const names=Object.values(vpRemoteEditing);
  el.textContent=names.length?`${names[0]} is editing...`:'';
}

window.renderViewPoint=renderViewPoint;
window.createViewPoint=createViewPoint;
window.openViewPoint=openViewPoint;
window.setVpDate=setVpDate;
window.shareViewPoint=shareViewPoint;
window.sendViewPointInvite=sendViewPointInvite;
window.acceptViewPointInvite=acceptViewPointInvite;
window.declineViewPointInvite=declineViewPointInvite;
window.leaveOrDeleteViewPoint=leaveOrDeleteViewPoint;
window.saveVpStickers=saveVpStickers;
window.addVpSticker=addVpSticker;
