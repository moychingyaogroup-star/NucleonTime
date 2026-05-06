const STORY_TEMPLATES = [
  // 1. Retro Polaroid
  {
    id: "tpl_polaroid",
    html: `
      <div class="story-tpl-polaroid">
        <div class="polaroid-tape"></div>
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">📸</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Add a caption..."></div>
      </div>
    `
  },
  // 2. Win95 Error Popup
  {
    id: "tpl_win95",
    html: `
      <div class="story-tpl-win95">
        <div class="win95-header">
          <span>Error</span>
          <div class="win95-btn">X</div>
        </div>
        <div class="win95-content">
          <div class="story-edit-img-zone">
            <div class="placeholder-icon">⚠️</div>
          </div>
          <div class="story-edit-text-zone" contenteditable="true" data-placeholder="A fatal exception 0E has occurred..."></div>
          <div class="win95-ok-btn">OK</div>
        </div>
      </div>
    `
  },
  // 3. Torn Scrapbook Paper
  {
    id: "tpl_scrapbook",
    html: `
      <div class="story-tpl-scrapbook">
        <div class="scrapbook-paper">
          <div class="story-edit-img-zone">
            <div class="placeholder-icon">✂️</div>
          </div>
          <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Dear Diary..."></div>
        </div>
        <div class="scrapbook-tape"></div>
        <div class="scrapbook-tape t2"></div>
      </div>
    `
  },
  // 4. Y2K Sparkles
  {
    id: "tpl_y2k",
    html: `
      <div class="story-tpl-y2k">
        <div class="sparkle s1">✨</div>
        <div class="sparkle s2">💖</div>
        <div class="sparkle s3">✨</div>
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🦋</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="that's hot... "></div>
      </div>
    `
  },
  // 5. 8-Bit Retro
  {
    id: "tpl_8bit",
    html: `
      <div class="story-tpl-8bit">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">👾</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="INSERT COIN..."></div>
        <div class="pixel-hearts">❤️❤️❤️</div>
      </div>
    `
  },
  // 6. Vaporwave
  {
    id: "tpl_vaporwave",
    html: `
      <div class="story-tpl-vaporwave">
        <div class="vaporwave-grid"></div>
        <div class="vaporwave-sun"></div>
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🌴</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="a e s t h e t i c"></div>
      </div>
    `
  },
  // 7. Fake iOS Notification
  {
    id: "tpl_ios_notif",
    html: `
      <div class="story-tpl-ios-notif">
        <div class="story-edit-img-zone bg-img">
          <div class="placeholder-icon">📱</div>
        </div>
        <div class="ios-notif-bubble">
          <div class="ios-notif-header">
            <span class="app-icon">💬</span>
            <span class="app-name">MESSAGES</span>
            <span class="time">now</span>
          </div>
          <div class="story-edit-text-zone" contenteditable="true" data-placeholder="New message..."></div>
        </div>
      </div>
    `
  },
  // 8. VHS Glitch
  {
    id: "tpl_vhs",
    html: `
      <div class="story-tpl-vhs">
        <div class="vhs-overlay"></div>
        <div class="vhs-text-top">PLAY ►</div>
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">📼</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="12:00 AM"></div>
      </div>
    `
  },
  // 9. Film Strip
  {
    id: "tpl_filmstrip",
    html: `
      <div class="story-tpl-filmstrip">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🎞️</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Take 1..."></div>
      </div>
    `
  },
  // 10. Neon Sign
  {
    id: "tpl_neon",
    html: `
      <div class="story-tpl-neon">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🌃</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Open 24/7"></div>
      </div>
    `
  },
  // 11. Minimalist Magazine
  {
    id: "tpl_magazine",
    html: `
      <div class="story-tpl-magazine">
        <div class="mag-header">VOGUE</div>
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">📰</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Cover Story..."></div>
      </div>
    `
  },
  // 12. Receipt
  {
    id: "tpl_receipt",
    html: `
      <div class="story-tpl-receipt">
        <div class="receipt-header">THANK YOU</div>
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🧾</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Total: Priceless"></div>
        <div class="receipt-barcode">||| || ||| | ||</div>
      </div>
    `
  },
  // 13. Music Player
  {
    id: "tpl_music",
    html: `
      <div class="story-tpl-music">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🎵</div>
        </div>
        <div class="music-controls">
          <span>⏮</span> <span>▶️</span> <span>⏭</span>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Now playing..."></div>
      </div>
    `
  },
  // 14. Dreamy Cloud
  {
    id: "tpl_cloud",
    html: `
      <div class="story-tpl-cloud">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">☁️</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Head in the clouds..."></div>
      </div>
    `
  },
  // 15. Ransom Note
  {
    id: "tpl_ransom",
    html: `
      <div class="story-tpl-ransom">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">✂️</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="WE HAVE THE... "></div>
      </div>
    `
  },
  // 16. Cyberpunk
  {
    id: "tpl_cyberpunk",
    html: `
      <div class="story-tpl-cyberpunk">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🦾</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Night City..."></div>
      </div>
    `
  },
  // 17. Pastel Grid
  {
    id: "tpl_pastel",
    html: `
      <div class="story-tpl-pastel">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">🌸</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Soft vibes..."></div>
      </div>
    `
  },
  // 18. Holographic
  {
    id: "tpl_holo",
    html: `
      <div class="story-tpl-holo">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">💿</div>
        </div>
        <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Shiny..."></div>
      </div>
    `
  },
  // 19. Comic Book
  {
    id: "tpl_comic",
    html: `
      <div class="story-tpl-comic">
        <div class="story-edit-img-zone">
          <div class="placeholder-icon">💥</div>
        </div>
        <div class="comic-bubble">
          <div class="story-edit-text-zone" contenteditable="true" data-placeholder="POW!"></div>
        </div>
      </div>
    `
  },
  // 20. Gothic Frame
  {
    id: "tpl_gothic",
    html: `
      <div class="story-tpl-gothic">
        <div class="gothic-border">
          <div class="story-edit-img-zone">
            <div class="placeholder-icon">🦇</div>
          </div>
          <div class="story-edit-text-zone" contenteditable="true" data-placeholder="Darkness..."></div>
        </div>
      </div>
    `
  }
];

let currentStoryTemplate = null;

function plainStoryText(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || div.innerText || '').trim();
}

function getScheduleBlocksForStoryLink() {
  try {
    const blocks = JSON.parse(localStorage.getItem(wsKey(currentDate)) || '[]');
    return blocks.map((b, index) => {
      const startH = Math.round((parseFloat(b.top) || 0) / ROW_H);
      const durH = Math.max(1, Math.round(((parseFloat(b.height) || ROW_H) + 6) / ROW_H));
      const cat = (typeof CAT_MAP !== 'undefined' && b.catId) ? CAT_MAP[b.catId] : null;
      const label = plainStoryText(b.text) || b.name || cat?.name || `Schedule block ${index + 1}`;
      return {
        id: b.id || String(index),
        label,
        date: currentDate,
        startH,
        durationH: durH,
        catId: b.catId || '',
        catName: cat?.name || '',
        catEmoji: cat?.emoji || '📌',
        color: b.hex || '#38BDF8'
      };
    });
  } catch (e) {
    console.warn('Could not load schedule blocks for story link:', e);
    return [];
  }
}

function formatStoryScheduleTime(block) {
  if (!block) return '';
  const time = typeof fmt12h === 'function' ? fmt12h(block.startH || 0) : `${block.startH || 0}:00`;
  const duration = block.durationH ? ` · ${block.durationH}h` : '';
  return `${time}${duration}`;
}

function renderStoryView() {
  const container = document.getElementById('stories-inner');
  if (!container) return;
  
  let feedWrap = document.getElementById('story-feed-wrap');
  if (!feedWrap) {
    feedWrap = document.createElement('div');
    feedWrap.id = 'story-feed-wrap';
    container.appendChild(feedWrap);
  }
  
  let galleryWrap = document.getElementById('story-gallery-wrap');
  if (!galleryWrap) {
    galleryWrap = document.createElement('div');
    galleryWrap.id = 'story-gallery-wrap';
    galleryWrap.innerHTML = '<div class="view-title" style="margin-top:20px;">Template Gallery</div><div class="story-gallery" id="story-gallery"></div>';
    container.appendChild(galleryWrap);
  }
  
  const gallery = document.getElementById('story-gallery');
  gallery.innerHTML = '';
  
  STORY_TEMPLATES.forEach((tpl, index) => {
    const card = document.createElement('div');
    card.className = 'story-gallery-card';
    card.innerHTML = `<div class="story-gallery-preview">${tpl.html}</div>`;
    card.onclick = () => openStoryPreview(index);
    gallery.appendChild(card);
  });
  
  renderStoryFeed();
}

function openStoryPreview(templateIndex) {
  currentStoryTemplate = STORY_TEMPLATES[templateIndex];
  
  const overlay = document.createElement('div');
  overlay.id = 'story-preview-overlay';
  
  const content = document.createElement('div');
  content.className = 'story-preview-content';
  content.innerHTML = currentStoryTemplate.html;
  
  // Set up image upload
  const imgZone = content.querySelector('.story-edit-img-zone');
  if (imgZone) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
      uploadStoryImage(e.target.files[0], imgZone);
    };
    
    imgZone.onclick = () => fileInput.click();
  }
  
  // Controls
  const controls = document.createElement('div');
  controls.className = 'story-preview-controls';
  
  const scheduleBlocks = getScheduleBlocksForStoryLink();
  const scheduleLinkWrap = document.createElement('div');
  scheduleLinkWrap.className = 'story-schedule-link-wrap';

  const scheduleLabel = document.createElement('label');
  scheduleLabel.className = 'story-schedule-link-label';
  scheduleLabel.textContent = 'Link this story to schedule:';

  const scheduleSelect = document.createElement('select');
  scheduleSelect.className = 'story-schedule-link-select';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = scheduleBlocks.length ? 'Choose a schedule block' : 'No schedule blocks today';
  scheduleSelect.appendChild(placeholder);

  scheduleBlocks.forEach((block, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${block.catEmoji} ${block.label} — ${formatStoryScheduleTime(block)}`;
    scheduleSelect.appendChild(option);
  });

  scheduleLinkWrap.appendChild(scheduleLabel);
  scheduleLinkWrap.appendChild(scheduleSelect);

  const postBtn = document.createElement('button');
  postBtn.className = 'tf-btn';
  postBtn.textContent = 'Post Story';
  postBtn.onclick = () => {
    const selectedIndex = scheduleSelect.value;
    if (selectedIndex === '') {
      showToast(scheduleBlocks.length ? 'Please choose which schedule block this story is linked to.' : 'Add a schedule block first, then post your story.');
      return;
    }

    const textZone = content.querySelector('.story-edit-text-zone');
    const text = textZone ? textZone.innerText.trim() : '';
    let imgUrl = imgZone?.dataset?.cloudUrl || '';
    const linkedSchedule = scheduleBlocks[Number(selectedIndex)] || null;
    
    postStory(currentStoryTemplate.id, text, imgUrl, linkedSchedule);
    document.body.removeChild(overlay);
  };
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tf-btn tf-btn-secondary';
  closeBtn.textContent = 'Cancel';
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
  };
  
  controls.appendChild(scheduleLinkWrap);
  controls.appendChild(closeBtn);
  controls.appendChild(postBtn);
  
  overlay.appendChild(content);
  overlay.appendChild(controls);
  document.body.appendChild(overlay);
}

function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); 
      const MAX_WIDTH = 1080; // Perfect width for 9:16 stories
      let scaleSize = 1;
      if (img.width > MAX_WIDTH) { scaleSize = MAX_WIDTH / img.width; }
      canvas.width = img.width * scaleSize; 
      canvas.height = img.height * scaleSize;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      // Compress to 80% JPEG to keep file sizes tiny
      canvas.toBlob(blob => callback(blob), 'image/jpeg', 0.8); 
    }; 
    img.src = e.target.result;
  }; 
  reader.readAsDataURL(file);
}

function uploadStoryImage(file, imgZone) {
  if (!file) return;
  if (typeof showToast === 'function') showToast('Compressing & Uploading...');
  
  compressImage(file, blob => {
    const formData = new FormData(); 
    formData.append('file', blob); 
    formData.append('upload_preset', 'spottitime_preset'); // Our unauthenticated upload preset
    
    fetch('https://api.cloudinary.com/v1_1/dqcx0wg2i/image/upload', { 
      method: 'POST', 
      body: formData 
    })
    .then(response => response.json())
    .then(data => {
      if (data.secure_url) {
         // 1. Apply to the UI
         imgZone.style.backgroundImage = `url('${data.secure_url}')`;
         imgZone.style.backgroundSize = 'cover';
         imgZone.style.backgroundPosition = 'center';
         // 2. Store the URL safely on the element for the postStory payload
         imgZone.dataset.cloudUrl = data.secure_url; 
         if (typeof showToast === 'function') showToast('Image uploaded! 📸');
      }
    }).catch(err => {
      if (typeof showToast === 'function') showToast('Upload Error: ' + err.message);
    });
  });
}

async function postStory(templateId, text, imgUrl, linkedSchedule) {
  const uid = _uid();
  if (!uid) { showToast('Not logged in'); return; }
  if (!window.TF_DB) { showToast('Database not ready. Try again.'); return; }
  
  const docData = {
    uid,
    authorName: window.TF_USER?.displayName || window.TF_PROFILE?.displayName || 'Unknown',
    authorPhoto: window.TF_USER?.photoURL || window.TF_PROFILE?.photoURL || '🐱',
    templateId,
    text,
    imgUrl,
    linkedSchedule: linkedSchedule || null,
    createdAt: Date.now(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    await window.TF_DB.collection('stories').add(docData);
    showToast('Story Published! 🎉');
    renderStoryFeed();
  } catch (e) {
    console.error('Error posting story:', e);
    showToast('Error posting story: ' + e.message);
  }
}

async function getStoryVisibleUids() {
  const uid = _uid();
  if (!uid || !window.TF_DB) return [];

  const ids = new Set([uid]);

  // Do not rely only on _friendsCache. If the user opens Stories before Friends,
  // the cache can still be empty, so friends' stories would not show.
  try {
    const snap = await window.TF_DB.collection('users').doc(uid).collection('friends').get();
    snap.forEach(doc => {
      const data = doc.data() || {};
      ids.add(data.uid || doc.id);
    });
  } catch (e) {
    console.warn('Could not load friends for stories:', e);
    if (Array.isArray(window._friendsCache)) {
      window._friendsCache.forEach(f => f?.uid && ids.add(f.uid));
    } else if (typeof _friendsCache !== 'undefined') {
      _friendsCache.forEach(f => f?.uid && ids.add(f.uid));
    }
  }

  return Array.from(ids);
}

function storyTimestampMillis(story) {
  if (story.timestamp && typeof story.timestamp.toMillis === 'function') {
    return story.timestamp.toMillis();
  }
  if (typeof story.createdAt === 'number') return story.createdAt;
  return 0;
}

let STORY_VIEW_GROUPS = [];
let STORY_VIEW_GROUP_INDEX = 0;
let STORY_VIEW_ITEM_INDEX = 0;

function groupStoriesByAuthor(stories, currentUid) {
  const map = new Map();

  stories.forEach(story => {
    const key = story.uid || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        uid: key,
        authorName: key === currentUid ? 'You' : (story.authorName || 'Friend'),
        authorPhoto: story.authorPhoto || '👤',
        latestTime: story._timeMs || 0,
        stories: []
      });
    }

    const group = map.get(key);
    group.latestTime = Math.max(group.latestTime, story._timeMs || 0);
    if (story.authorName) group.authorName = key === currentUid ? 'You' : story.authorName;
    if (story.authorPhoto) group.authorPhoto = story.authorPhoto;
    group.stories.push(story);
  });

  const groups = Array.from(map.values());
  groups.forEach(group => group.stories.sort((a, b) => (a._timeMs || 0) - (b._timeMs || 0)));
  groups.sort((a, b) => (b.latestTime || 0) - (a.latestTime || 0));
  return groups;
}

function fillStoryTemplate(root, story) {
  const tpl = STORY_TEMPLATES.find(t => t.id === story.templateId) || STORY_TEMPLATES[0];
  root.innerHTML = tpl.html;

  const imgZone = root.querySelector('.story-edit-img-zone');
  if (imgZone && story.imgUrl) {
    imgZone.style.backgroundImage = `url('${story.imgUrl}')`;
    imgZone.style.backgroundSize = 'cover';
    imgZone.style.backgroundPosition = 'center';
    const icon = imgZone.querySelector('.placeholder-icon');
    if (icon) icon.style.display = 'none';
  }

  const textZone = root.querySelector('.story-edit-text-zone');
  if (textZone) {
    textZone.innerText = story.text || '';
    textZone.contentEditable = 'false';
  }

  if (story.linkedSchedule) {
    const schedule = story.linkedSchedule;
    const badge = document.createElement('div');
    badge.className = 'story-linked-schedule-badge';
    badge.innerHTML = `<span>${escHtml(schedule.catEmoji || '📌')}</span><div><strong>${escHtml(schedule.label || 'Schedule')}</strong><small>${escHtml(formatStoryScheduleTime(schedule))}</small></div>`;
    root.appendChild(badge);
  }
}

function renderStoryAvatar(authorPhoto, authorName) {
  if (authorPhoto && typeof authorPhoto === 'string' && authorPhoto.startsWith('http')) {
    return `<img src="${authorPhoto}" alt="${authorName || 'Story'}" class="story-bubble-avatar-img">`;
  }
  return `<div class="story-bubble-avatar-emoji">${authorPhoto || '👤'}</div>`;
}

function openStoryViewer(groupIndex = 0, itemIndex = 0) {
  if (!STORY_VIEW_GROUPS.length) return;

  STORY_VIEW_GROUP_INDEX = groupIndex;
  STORY_VIEW_ITEM_INDEX = itemIndex;

  let overlay = document.getElementById('story-viewer-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'story-viewer-overlay';
    overlay.innerHTML = `
      <div class="story-viewer-shell">
        <div class="story-viewer-progress" id="story-viewer-progress"></div>
        <div class="story-viewer-header">
          <div class="story-viewer-author" id="story-viewer-author"></div>
          <button class="story-viewer-delete" id="story-viewer-delete" title="Delete this story" style="display:none;">Delete</button>
          <button class="story-viewer-close" id="story-viewer-close">×</button>
        </div>
        <div class="story-viewer-content" id="story-viewer-content"></div>
        <button class="story-viewer-nav story-viewer-prev" id="story-viewer-prev" aria-label="Previous story"></button>
        <button class="story-viewer-nav story-viewer-next" id="story-viewer-next" aria-label="Next story"></button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#story-viewer-close').onclick = closeStoryViewer;
    overlay.querySelector('#story-viewer-delete').onclick = (event) => {
      event.stopPropagation();
      deleteCurrentStoryItem();
    };
    overlay.querySelector('#story-viewer-prev').onclick = (event) => {
      event.stopPropagation();
      showPreviousStoryItem();
    };
    overlay.querySelector('#story-viewer-next').onclick = (event) => {
      event.stopPropagation();
      showNextStoryItem();
    };
  }

  overlay.style.display = 'flex';
  renderCurrentStoryItem();
}

function closeStoryViewer() {
  const overlay = document.getElementById('story-viewer-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showNextStoryItem() {
  const group = STORY_VIEW_GROUPS[STORY_VIEW_GROUP_INDEX];
  if (!group) return closeStoryViewer();

  if (STORY_VIEW_ITEM_INDEX < group.stories.length - 1) {
    STORY_VIEW_ITEM_INDEX += 1;
  } else if (STORY_VIEW_GROUP_INDEX < STORY_VIEW_GROUPS.length - 1) {
    STORY_VIEW_GROUP_INDEX += 1;
    STORY_VIEW_ITEM_INDEX = 0;
  } else {
    return closeStoryViewer();
  }

  renderCurrentStoryItem();
}

function showPreviousStoryItem() {
  if (STORY_VIEW_ITEM_INDEX > 0) {
    STORY_VIEW_ITEM_INDEX -= 1;
  } else if (STORY_VIEW_GROUP_INDEX > 0) {
    STORY_VIEW_GROUP_INDEX -= 1;
    const previousGroup = STORY_VIEW_GROUPS[STORY_VIEW_GROUP_INDEX];
    STORY_VIEW_ITEM_INDEX = Math.max(0, previousGroup.stories.length - 1);
  } else {
    STORY_VIEW_ITEM_INDEX = 0;
  }

  renderCurrentStoryItem();
}


async function deleteCurrentStoryItem() {
  const uid = _uid();
  const group = STORY_VIEW_GROUPS[STORY_VIEW_GROUP_INDEX];
  const story = group?.stories?.[STORY_VIEW_ITEM_INDEX];

  if (!uid || !story || story.uid !== uid) {
    if (typeof showToast === 'function') showToast('You can only delete your own story.');
    return;
  }
  if (!window.TF_DB) {
    if (typeof showToast === 'function') showToast('Database not ready. Try again.');
    return;
  }

  const confirmed = window.confirm('Delete this story?');
  if (!confirmed) return;

  try {
    await window.TF_DB.collection('stories').doc(story.id).delete();

    group.stories.splice(STORY_VIEW_ITEM_INDEX, 1);
    if (group.stories.length === 0) {
      STORY_VIEW_GROUPS.splice(STORY_VIEW_GROUP_INDEX, 1);
      if (STORY_VIEW_GROUPS.length === 0) {
        closeStoryViewer();
        await renderStoryFeed();
        if (typeof showToast === 'function') showToast('Story deleted.');
        return;
      }
      STORY_VIEW_GROUP_INDEX = Math.min(STORY_VIEW_GROUP_INDEX, STORY_VIEW_GROUPS.length - 1);
      STORY_VIEW_ITEM_INDEX = 0;
    } else {
      STORY_VIEW_ITEM_INDEX = Math.min(STORY_VIEW_ITEM_INDEX, group.stories.length - 1);
      group.latestTime = Math.max(...group.stories.map(s => s._timeMs || 0));
    }

    await renderStoryFeed();
    renderCurrentStoryItem();
    if (typeof showToast === 'function') showToast('Story deleted.');
  } catch (e) {
    console.error('Error deleting story:', e);
    if (typeof showToast === 'function') showToast('Cannot delete story: ' + e.message);
  }
}

function renderCurrentStoryItem() {
  const group = STORY_VIEW_GROUPS[STORY_VIEW_GROUP_INDEX];
  if (!group || !group.stories.length) return closeStoryViewer();

  STORY_VIEW_ITEM_INDEX = Math.min(Math.max(STORY_VIEW_ITEM_INDEX, 0), group.stories.length - 1);
  const story = group.stories[STORY_VIEW_ITEM_INDEX];

  const deleteBtn = document.getElementById('story-viewer-delete');
  if (deleteBtn) {
    deleteBtn.style.display = story.uid === _uid() ? 'inline-flex' : 'none';
  }

  const progress = document.getElementById('story-viewer-progress');
  if (progress) {
    progress.innerHTML = group.stories.map((_, index) => `
      <div class="story-progress-bar"><div class="story-progress-fill ${index <= STORY_VIEW_ITEM_INDEX ? 'active' : ''}"></div></div>
    `).join('');
  }

  const author = document.getElementById('story-viewer-author');
  if (author) {
    author.innerHTML = `${renderStoryAvatar(group.authorPhoto, group.authorName)}<span>${group.authorName || 'Friend'}</span><span class="story-viewer-count">${STORY_VIEW_ITEM_INDEX + 1}/${group.stories.length}</span>`;
  }

  const content = document.getElementById('story-viewer-content');
  if (content) fillStoryTemplate(content, story);
}

async function renderStoryFeed() {
  const feedWrap = document.getElementById('story-feed-wrap');
  if (!feedWrap) return;
  
  feedWrap.innerHTML = '<div class="view-title">Active Stories</div><div class="story-feed" id="story-feed"></div>';
  const feed = document.getElementById('story-feed');
  
  const uid = _uid();
  if (!uid) return;
  if (!window.TF_DB) {
    feed.innerHTML = '<div style="color:var(--muted);padding:10px;">Database not ready. Please refresh.</div>';
    return;
  }
  
  const visibleUids = await getStoryVisibleUids();
  const visibleSet = new Set(visibleUids);
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  try {
    // Load recent stories, then filter to me + my friends in code.
    // This avoids Firestore's where("in") 10-user limit and works for any number of friends.
    const snap = await window.TF_DB.collection('stories')
      .orderBy('timestamp', 'desc')
      .limit(150)
      .get();
      
    const stories = [];
    snap.forEach(doc => {
      const data = doc.data() || {};
      const timeMs = storyTimestampMillis(data);
      if (visibleSet.has(data.uid) && timeMs >= oneDayAgo) {
        stories.push({ id: doc.id, ...data, _timeMs: timeMs });
      }
    });

    stories.sort((a, b) => (b._timeMs || 0) - (a._timeMs || 0));
    STORY_VIEW_GROUPS = groupStoriesByAuthor(stories, uid);
    
    if (STORY_VIEW_GROUPS.length === 0) {
      feed.innerHTML = '<div style="color:var(--muted);padding:10px;">No recent stories from you or your friends.</div>';
      return;
    }
    
    STORY_VIEW_GROUPS.forEach((group, groupIndex) => {
      const latestStory = group.stories[group.stories.length - 1];
      const card = document.createElement('div');
      card.className = 'story-feed-card story-group-card';
      card.onclick = () => openStoryViewer(groupIndex, 0);
      card.innerHTML = `
        <div class="story-feed-preview"></div>
        <div class="story-count-badge">${group.stories.length}</div>
        <div class="story-feed-author">${group.authorName || 'Friend'}</div>
      `;

      const preview = card.querySelector('.story-feed-preview');
      fillStoryTemplate(preview, latestStory);
      feed.appendChild(card);
    });
  } catch (e) {
    console.error('Error fetching stories:', e);
    feed.innerHTML = '<div style="color:var(--muted);padding:10px;">Failed to load stories. Check Firestore rules for the stories collection.</div>';
  }
}
