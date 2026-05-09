// ── APPLE STICKER STORE + SCHEDULE/VIEWPOINT STICKERS ─────────────────────
// Uses original emoji/SVG stickers, so the pack is safe to reuse in the app.

const STICKER_STARTER_GIFT = 20;
const STICKER_PRICE = 5;
const STICKER_KEYS = {
  owned: 'tf_stickers_owned_v1',
  gift: 'tf_starter_apples_claimed_v1'
};

const STICKER_PACK = [
  {id:'this_is_fine', name:'This is Fine', src:'./assets/stickers/this_is_fine.png', cat:'Meme'},
  {id:'laughing_tears', name:'Laughing Tears', src:'./assets/stickers/laughing_tears.png', cat:'Funny'},
  {id:'hold_on', name:'Hold On', src:'./assets/stickers/hold_on.png', cat:'Meme'},
  {id:'wait_what', name:'Wait What', src:'./assets/stickers/wait_what.png', cat:'Meme'},
  {id:'shrug', name:'Shrug', src:'./assets/stickers/shrug.png', cat:'Funny'},
  {id:'omg', name:'OMG', src:'./assets/stickers/omg.png', cat:'Funny'},
  {id:'wow', name:'WOW', src:'./assets/stickers/wow.png', cat:'Funny'},
  {id:'thumbs_up', name:'Thumbs Up', src:'./assets/stickers/thumbs_up.png', cat:'Cute'},
  {id:'facepalm', name:'Facepalm', src:'./assets/stickers/facepalm.png', cat:'Meme'},
  {id:'side_eye', name:'Side Eye', src:'./assets/stickers/side_eye.png', cat:'Meme'},
  {id:'bunny_boba', name:'Bunny Boba', src:'./assets/stickers/bunny_boba.png', cat:'Cute'},
  {id:'bear_laptop', name:'Bear Laptop', src:'./assets/stickers/bear_laptop.png', cat:'Cute'},
  {id:'gamer_cat', name:'Gamer Cat', src:'./assets/stickers/gamer_cat.png', cat:'Cute'},
  {id:'coffee_fox', name:'Coffee Fox', src:'./assets/stickers/coffee_fox.png', cat:'Cute'},
  {id:'tiny_dino', name:'Tiny Dino', src:'./assets/stickers/tiny_dino.png', cat:'Chaos'},
  {id:'happy_plant', name:'Happy Plant', src:'./assets/stickers/happy_plant.png', cat:'Cute'},
  {id:'winged_star_heart', name:'Winged Star Heart', src:'./assets/stickers/winged_star_heart.png', cat:'Cute'},
  {id:'rainbow_clouds', name:'Rainbow Clouds', src:'./assets/stickers/rainbow_clouds.png', cat:'Cute'},
  {id:'workspace_hero', name:'Workspace Hero', src:'./assets/stickers/workspace_hero.png', cat:'Work'},
  {id:'pencil_notes', name:'Pencil Notes', src:'./assets/stickers/pencil_notes.png', cat:'Work'},
];

function stickerSvgData(sticker){
  return sticker?.src || './assets/stickers/this_is_fine.png';
}
function getStickerById(id){ return STICKER_PACK.find(s=>s.id===id); }
function getOwnedStickers(){ return gsRaw(STICKER_KEYS.owned) || []; }
function saveOwnedStickers(ids){ ssRaw(STICKER_KEYS.owned, Array.from(new Set(ids))); renderStickerStore(); }
function hasSticker(id){ return getOwnedStickers().includes(id); }

function ensureStarterAppleGift(){
  if(gsRaw(STICKER_KEYS.gift)) return;
  const current = getCurrency ? getCurrency() : 0;
  if(typeof saveCurrency === 'function') saveCurrency(current + STICKER_STARTER_GIFT);
  ssRaw(STICKER_KEYS.gift, {claimed:true, at:Date.now(), amount:STICKER_STARTER_GIFT});
  setTimeout(()=>showToast && showToast('Starter Gift: +20 apples for trying the Sticker Store 🍎'), 400);
}

function buySticker(id){
  if(hasSticker(id)) return showToast('You already own this sticker.');
  const sticker = getStickerById(id); if(!sticker) return;
  const apples = getCurrency ? getCurrency() : 0;
  if(apples < STICKER_PRICE) return showToast('Not enough apples yet. Collect more from your plant 🍎');
  saveCurrency(apples - STICKER_PRICE);
  saveOwnedStickers([...getOwnedStickers(), id]);
  showToast(`${sticker.name} unlocked!`);
  if(typeof renderPlant === 'function') renderPlant();
}

function renderStickerStore(){
  const right = document.getElementById('right-panel'); if(!right) return;
  let box = document.getElementById('sticker-store-panel');
  if(!box){
    box = document.createElement('div');
    box.id = 'sticker-store-panel';
    box.className = 'rp-section sticker-store-panel';
    const plant = document.getElementById('plant-container');
    const plantSection = plant ? plant.closest('.rp-section') : null;
    if(plantSection && plantSection.parentNode){
      plantSection.insertAdjacentElement('afterend', box);
    }else{
      right.appendChild(box);
    }
  }
  const owned = getOwnedStickers();
  const apples = getCurrency ? getCurrency() : 0;
  const activeTab = box.dataset.tab || 'shop';
  const cats = [...new Set(STICKER_PACK.map(s=>s.cat))];
  box.innerHTML = `
    <div class="sticker-store-head">
      <div><div class="rp-title">🛍️ Sticker Store</div><div class="sticker-store-sub">Drag owned stickers into Schedule or ViewPoint grids.</div></div>
      <div class="sticker-apple-balance">🍎 ${apples}</div>
    </div>
    <div class="starter-gift-note">Judges/demo bonus: every account gets a one-time 20 apples starter gift.</div>
    <div class="sticker-tabs"><button class="${activeTab==='shop'?'active':''}" data-tab="shop">Shop</button><button class="${activeTab==='owned'?'active':''}" data-tab="owned">Owned</button></div>
    <div id="sticker-store-content"></div>`;
  box.querySelectorAll('.sticker-tabs button').forEach(btn=>btn.onclick=()=>{box.dataset.tab=btn.dataset.tab;renderStickerStore();});
  const content = box.querySelector('#sticker-store-content');
  if(activeTab==='owned'){
    const ownedList = STICKER_PACK.filter(s=>owned.includes(s.id));
    content.innerHTML = ownedList.length ? `<div class="sticker-owned-grid">${ownedList.map(stickerCardOwnedHtml).join('')}</div>` : '<div class="sticker-empty">No stickers yet. Buy one from the shop for 5 apples.</div>';
  }else{
    content.innerHTML = cats.map(cat=>`<div class="sticker-cat-title">${cat}</div><div class="sticker-shop-grid">${STICKER_PACK.filter(s=>s.cat===cat).map(stickerCardShopHtml).join('')}</div>`).join('');
  }
  bindStickerStoreCards(box);
}

function stickerCardShopHtml(s){
  const owned = hasSticker(s.id);
  return `<button class="sticker-card ${owned?'owned':''}" data-buy="${s.id}" type="button" title="${escHtml(s.name)}"><img src="${s.src}" alt=""><small>${owned?'✓':'🍎 5'}</small></button>`;
}
function stickerCardOwnedHtml(s){
  return `<div class="sticker-card owned draggable" draggable="true" data-sticker-id="${s.id}" title="${escHtml(s.name)}"><img src="${s.src}" alt=""></div>`;
}
function bindStickerStoreCards(root){
  root.querySelectorAll('[data-buy]').forEach(btn=>btn.onclick=()=>buySticker(btn.dataset.buy));
  root.querySelectorAll('[data-sticker-id]').forEach(card=>{
    card.addEventListener('dragstart',e=>{
      const id=card.dataset.stickerId;
      e.dataTransfer.setData('text/plain','owned-sticker');
      e.dataTransfer.setData('sticker-id',id);
      const s=getStickerById(id); if(s) e.dataTransfer.setData('sticker-src',stickerSvgData(s));
    });
  });
}

function scheduleStickerKey(ds){ return `tf_schedule_stickers_${ds}`; }
function getScheduleStickers(ds=currentDate){ return gsRaw(scheduleStickerKey(ds)) || []; }
function saveScheduleStickers(ds=currentDate, stickers=null){ ssRaw(scheduleStickerKey(ds), stickers || collectScheduleStickers()); }
function collectScheduleStickers(){
  return Array.from(document.querySelectorAll('#grid-area .schedule-sticker')).map(el=>({
    id:el.dataset.id, stickerId:el.dataset.stickerId, src:el.dataset.src,
    left:parseFloat(el.style.left)||0, top:parseFloat(el.style.top)||0,
    width:parseFloat(el.style.width)||70, height:parseFloat(el.style.height)||70,
    rotate:parseFloat(el.dataset.rotate)||0, ownerId:el.dataset.ownerId||vpUid?.()||''
  }));
}
function loadScheduleStickers(ds=currentDate){
  const grid=document.getElementById('grid-area'); if(!grid)return;
  grid.querySelectorAll('.schedule-sticker').forEach(x=>x.remove());
  getScheduleStickers(ds).forEach(s=>grid.appendChild(makePlacedStickerEl(s, 'schedule')));
}
function addScheduleSticker(stickerId, x, y){
  const sticker=getStickerById(stickerId); if(!sticker || !hasSticker(stickerId)) return;
  const grid=document.getElementById('grid-area'); if(!grid)return;
  const data={id:'st_'+Date.now(),stickerId,src:stickerSvgData(sticker),left:x,top:y,width:72,height:72,rotate:0,ownerId:vpUid?.()||''};
  grid.appendChild(makePlacedStickerEl(data,'schedule')); saveScheduleStickers();
}
function setupScheduleStickerDrop(){
  const grid=document.getElementById('grid-area'); if(!grid || grid.dataset.stickerDropBound)return;
  grid.dataset.stickerDropBound='1';
  grid.addEventListener('dragover',e=>{ if(e.dataTransfer.types.includes('text/plain')) e.preventDefault(); });
  grid.addEventListener('drop',e=>{
    if(e.dataTransfer.getData('text/plain')!=='owned-sticker') return;
    e.preventDefault();
    const id=e.dataTransfer.getData('sticker-id');
    const r=grid.getBoundingClientRect();
    addScheduleSticker(id, Math.max(0,e.clientX-r.left-36), Math.max(0,e.clientY-r.top-36));
  });
}

function makePlacedStickerEl(data, mode){
  const el=document.createElement('div');
  el.className=(mode==='viewpoint'?'vp-placed-sticker':'schedule-sticker')+' placed-sticker';
  el.dataset.id=data.id; el.dataset.stickerId=data.stickerId; el.dataset.src=data.src; el.dataset.ownerId=data.ownerId||''; el.dataset.rotate=data.rotate||0;
  el.style.left=(data.left||0)+'px'; el.style.top=(data.top||0)+'px'; el.style.width=(data.width||72)+'px'; el.style.height=(data.height||72)+'px'; el.style.transform=`rotate(${data.rotate||0}deg)`;
  el.innerHTML=`<img src="${data.src}" draggable="false"><button class="sticker-delete" title="Delete">×</button><button class="sticker-rotate" title="Rotate">↻</button><span class="sticker-resize"></span>`;
  bindPlacedStickerControls(el, data, mode);
  return el;
}
function bindPlacedStickerControls(el, data, mode){
  const save=()=>{
    data.left=parseFloat(el.style.left)||0; data.top=parseFloat(el.style.top)||0; data.width=parseFloat(el.style.width)||72; data.height=parseFloat(el.style.height)||72; data.rotate=parseFloat(el.dataset.rotate)||0;
    if(mode==='viewpoint'){ if(typeof saveVpStickers === 'function') saveVpStickers(); else if(typeof saveVpDay==='function') saveVpDay(); }
    else saveScheduleStickers();
  };
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const getPoint=(e)=> e.touches?.[0] || e.changedTouches?.[0] || e;
  el.querySelector('.sticker-delete').onclick=e=>{e.stopPropagation(); el.remove(); save();};

  const rotateHandle = el.querySelector('.sticker-rotate');
  const startRotate = e=>{
    e.preventDefault(); e.stopPropagation();
    const startPt=getPoint(e);
    const rect=el.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const startAngle=Math.atan2(startPt.clientY-cy,startPt.clientX-cx)*180/Math.PI;
    const baseRotate=parseFloat(el.dataset.rotate)||0;
    const move=ev=>{
      const pt=getPoint(ev);
      const now=Math.atan2(pt.clientY-cy,pt.clientX-cx)*180/Math.PI;
      const rot=(baseRotate + (now-startAngle) + 360) % 360;
      el.dataset.rotate=rot.toFixed(1);
      el.style.transform=`rotate(${rot}deg)`;
    };
    const up=()=>{save();document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);document.removeEventListener('touchmove',move);document.removeEventListener('touchend',up);};
    document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
    document.addEventListener('touchmove',move,{passive:false});document.addEventListener('touchend',up);
  };
  rotateHandle.addEventListener('mousedown',startRotate);
  rotateHandle.addEventListener('touchstart',startRotate,{passive:false});

  el.addEventListener('mousedown',e=>{
    if(e.target.closest('button,.sticker-resize,.sticker-rotate'))return;
    e.preventDefault(); e.stopPropagation();
    const parent=el.parentElement, pr=parent.getBoundingClientRect(); const sx=e.clientX, sy=e.clientY, ox=parseFloat(el.style.left)||0, oy=parseFloat(el.style.top)||0;
    const mm=ev=>{el.style.left=clamp(ox+ev.clientX-sx,0,pr.width-el.offsetWidth)+'px'; el.style.top=clamp(oy+ev.clientY-sy,0,pr.height-el.offsetHeight)+'px';};
    const mu=()=>{save();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });
  el.addEventListener('touchstart',e=>{
    if(e.target.closest('button,.sticker-resize,.sticker-rotate'))return;
    e.preventDefault(); e.stopPropagation();
    const pt=getPoint(e), parent=el.parentElement, pr=parent.getBoundingClientRect(); const sx=pt.clientX, sy=pt.clientY, ox=parseFloat(el.style.left)||0, oy=parseFloat(el.style.top)||0;
    const mm=ev=>{const p=getPoint(ev);el.style.left=clamp(ox+p.clientX-sx,0,pr.width-el.offsetWidth)+'px'; el.style.top=clamp(oy+p.clientY-sy,0,pr.height-el.offsetHeight)+'px';};
    const mu=()=>{save();document.removeEventListener('touchmove',mm);document.removeEventListener('touchend',mu);};
    document.addEventListener('touchmove',mm,{passive:false});document.addEventListener('touchend',mu);
  },{passive:false});
  el.querySelector('.sticker-resize').addEventListener('mousedown',e=>{
    e.stopPropagation(); e.preventDefault(); const sx=e.clientX, sw=el.offsetWidth, sh=el.offsetHeight;
    const mm=ev=>{const size=Math.max(42,sw+ev.clientX-sx); el.style.width=size+'px'; el.style.height=Math.max(42,sh+ev.clientX-sx)+'px';};
    const mu=()=>{save();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });
}


window.ensureStarterAppleGift=ensureStarterAppleGift;
window.renderStickerStore=renderStickerStore;
window.setupScheduleStickerDrop=setupScheduleStickerDrop;
window.loadScheduleStickers=loadScheduleStickers;
window.addScheduleSticker=addScheduleSticker;
window.makePlacedStickerEl=makePlacedStickerEl;
window.STICKER_PACK=STICKER_PACK;
window.hasSticker=hasSticker;
window.getStickerById=getStickerById;
window.stickerSvgData=stickerSvgData;
