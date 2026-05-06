function renderAnalytics(){
  const content=document.getElementById('analytics-content');content.innerHTML='';
  const blocks=getBlocks();const s=getStreak(),sc=getScore();

  if(!blocks.length){
    content.innerHTML='<div class="an-card" style="text-align:center;padding:40px 20px;color:var(--muted)">📊<br><br>No blocks on today\'s schedule yet.<br>Head to <strong>Schedule</strong> to plan your day.</div>';
    return;
  }

  // ── Core metrics ────────────────────────────────────────────────────────────
  // FIX: durationH now reads from style.height (not offsetHeight) so it is
  //      correct even when the home view is hidden. See blocks.js getBlocks().
  const totalH=blocks.reduce((s,b)=>s+b.durationH,0);
  const doneCount=blocks.filter(b=>b.done).length;
  const completedH=blocks.filter(b=>b.done).reduce((s,b)=>s+b.durationH,0);
  const freeH=Math.max(0,24-totalH);

  // FIX: Productivity = completed hours / total scheduled hours × 100.
  //      Old formula (totalH/16×100) measured schedule density, not completion.
  //      When no blocks are done yet, score is 0 — accurate, not a bug.
  const prodScore=totalH>0?Math.min(100,Math.round(completedH/totalH*100)):0;

  // Hourly density array for bar chart
  const hourLoad=new Array(24).fill(0);
  blocks.forEach(b=>{
    const st=Math.floor(b.startH),en=Math.min(24,Math.ceil(b.startH+b.durationH));
    for(let h=st;h<en;h++)hourLoad[h]++;
  });
  const busiestH=hourLoad.indexOf(Math.max(...hourLoad));

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statHtml=`<div class="stat-row">
    <div class="stat-card"><div class="stat-val">${blocks.length}</div><div class="stat-lbl">Blocks</div></div>
    <div class="stat-card"><div class="stat-val">${totalH.toFixed(1)}h</div><div class="stat-lbl">Scheduled</div></div>
    <div class="stat-card"><div class="stat-val">${completedH.toFixed(1)}h</div><div class="stat-lbl">Completed</div></div>
    <div class="stat-card"><div class="stat-val">${prodScore}%</div><div class="stat-lbl">Productivity</div></div>
  </div>`;
  content.innerHTML=statHtml;

  const anGrid=document.createElement('div');anGrid.className='an-grid';

  // ── Pie chart — by category ─────────────────────────────────────────────────
  // FIX: categories now accumulate correctly because durationH is non-zero.
  const catMap={};
  blocks.forEach(b=>{
    const k=b.catId||'__none';
    if(!catMap[k])catMap[k]={catId:k,hours:0,cat:CAT_MAP[b.catId]};
    catMap[k].hours+=b.durationH;
  });
  if(freeH>0)catMap['__free']={catId:'__free',hours:freeH,cat:{name:'Free',color:'#374151',emoji:'🕐'}};
  const slices=Object.values(catMap).sort((a,b)=>b.hours-a.hours);
  const totalAll=slices.reduce((s,x)=>s+x.hours,0);

  const pieCard=document.createElement('div');pieCard.className='an-card';
  pieCard.innerHTML=`<div class="an-card-title">Time by Category</div><div class="an-card-sub">Today's time distribution</div>`;
  const pw=document.createElement('div');pw.className='pie-wrap';
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.width = '100%';
  canvasWrapper.style.maxWidth = '200px';
  canvasWrapper.style.aspectRatio = '1';
  canvasWrapper.style.position = 'relative';

  const canvas=document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  pw.appendChild(canvasWrapper);

  const legend=document.createElement('div');legend.className='pie-legend';
  slices.forEach(s=>{
    const pct=(s.hours/24*100).toFixed(0);const col=(s.cat?.color)||'#6B7280';
    const nm=s.cat?`${s.cat.emoji||''} ${s.cat.name}`:'Uncategorised';
    legend.innerHTML+=`<div class="pie-legend-item"><div class="pie-legend-dot" style="background:${col}"></div><span style="flex:1">${nm}</span><span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">${pct}%</span></div>`;
  });
  pw.appendChild(legend);pieCard.appendChild(pw);anGrid.appendChild(pieCard);

  const drawChart = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasWrapper.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx=canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) * 0.9;

    let a=-Math.PI/2;
    slices.forEach(s=>{
      const sw=s.hours/24*Math.PI*2;const col=(s.cat?.color)||'#6B7280';
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+sw);ctx.closePath();
      ctx.fillStyle=col;ctx.fill();
      ctx.strokeStyle=document.documentElement.getAttribute('data-theme')==='dark'?'#0D0D14':'#F4F3FF';
      ctx.lineWidth=2;ctx.stroke();a+=sw;
    });
    ctx.beginPath();ctx.arc(cx,cy,r*0.4,0,Math.PI*2);
    ctx.fillStyle=document.documentElement.getAttribute('data-theme')==='dark'?'#16161F':'#FFFFFF';ctx.fill();
    ctx.fillStyle=document.documentElement.getAttribute('data-theme')==='dark'?'#fff':'#111';
    ctx.textAlign='center';

    const fontSizeVal = Math.max(9, w * 0.08);
    ctx.font=`bold ${fontSizeVal}px DM Sans,sans-serif`;
    ctx.fillText(totalH.toFixed(1)+'h',cx,cy + fontSizeVal * 0.1);

    const subFontSizeVal = Math.max(8, w * 0.06);
    ctx.font=`${subFontSizeVal}px DM Sans,sans-serif`;
    ctx.fillStyle='rgba(128,128,128,.8)';
    ctx.fillText('scheduled',cx,cy + fontSizeVal * 0.1 + subFontSizeVal * 1.2);
  };

  requestAnimationFrame(drawChart);
  window.addEventListener('resize', () => {
    if (document.getElementById('analytics-content')) {
      requestAnimationFrame(drawChart);
    }
  });

  // ── Bar chart — hourly density ──────────────────────────────────────────────
  const barCard=document.createElement('div');barCard.className='an-card';
  barCard.innerHTML=`<div class="an-card-title">Hourly Distribution</div><div class="an-card-sub">Block density across the day</div>`;
  const bc=document.createElement('div');bc.className='bar-chart';
  const maxL=Math.max(...hourLoad,1);
  for(let h=0;h<24;h++){
    const col=document.createElement('div');col.className='bar-col';
    const fill=document.createElement('div');fill.className='bar-fill';
    fill.style.background=hourLoad[h]>0?`hsl(${258+h*3},65%,${55-hourLoad[h]*5}%)`:'rgba(255,255,255,.05)';
    fill.style.height=(hourLoad[h]/maxL*90)+'%';
    // FIX: tooltip uses 12-hour AM/PM format
    fill.setAttribute('data-tip',`${fmt12h(h)} · ${hourLoad[h]} block${hourLoad[h]!==1?'s':''}`);
    const lbl=document.createElement('div');lbl.className='bar-lbl';
    // Show label every 4 hours using 12h format
    lbl.textContent=h%4===0?(h===0?'12a':h===12?'12p':h<12?`${h}a`:`${h-12}p`):'';
    col.appendChild(fill);col.appendChild(lbl);bc.appendChild(col);
  }
  barCard.appendChild(bc);anGrid.appendChild(barCard);


  // ── Persona Classification ──────────────────────────────────────────────────
  const getCatPct = (id) => (catMap[id]?.hours || 0) / 24 * 100;

  const personas = [
    {
      name: "Typical High School Student",
      reality: "heavy school + sleep, moderate distractions",
      profile: { sleep: 30, school: 25, study: 10, social: 8, entertain: 8, hangout: 5, eat: 5, transport: 4, personal: 3, chores: 2, exercise: 1, family: 2, hobbies: 2, compete: 0, work: 0 }
    },
    {
      name: "High-Performing Student",
      reality: "less distraction, more study + structured time",
      profile: { sleep: 30, school: 25, study: 15, exercise: 5, eat: 5, transport: 4, personal: 4, family: 3, hobbies: 3, chores: 2, social: 2, entertain: 1.5, hangout: 1.5, compete: 1.5, work: 0 }
    },
    {
      name: "Athlete-Focused Person",
      reality: "more sleep + training, less wasted time",
      profile: { sleep: 32, school: 22.5, exercise: 12.5, eat: 6, study: 8, personal: 5, transport: 4, family: 3, entertain: 3, social: 2, hangout: 2, chores: 2, hobbies: 1.5, compete: 3, work: 0 }
    },
    {
      name: "Unstructured / Distracted Student",
      reality: "high time waste → low productivity",
      profile: { sleep: 25, school: 25, social: 15, entertain: 15, study: 5, hangout: 5, eat: 5, transport: 3, personal: 2, chores: 1.5, exercise: 0.5, family: 1.5, hobbies: 1.5, compete: 0, work: 0 }
    },
    {
      name: "Balanced Lifestyle Person",
      reality: "sustainable, not extreme",
      profile: { sleep: 30, school: 25, study: 8, exercise: 5, eat: 6, transport: 4, personal: 4, family: 4, hobbies: 4, entertain: 3, social: 2.5, hangout: 3, chores: 2, compete: 0.5, work: 1 }
    }
  ];

  let bestPersona = personas[0];
  let minDiff = Infinity;

  personas.forEach(p => {
    let diff = 0;
    ['sleep', 'school', 'study', 'social', 'entertain', 'hangout', 'eat', 'transport', 'personal', 'chores', 'exercise', 'family', 'hobbies', 'compete', 'work'].forEach(cat => {
      diff += Math.pow(getCatPct(cat) - p.profile[cat], 2);
    });
    if (diff < minDiff) {
      minDiff = diff;
      bestPersona = p;
    }
  });

  const personaCard = document.createElement('div');
  personaCard.className = 'an-card full';
  personaCard.innerHTML = `<div class="an-card-title">Time Persona</div>
    <div class="an-card-sub">Based on your daily schedule distribution</div>
    <div style="margin-top:10px; padding:12px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid rgba(255,255,255,0.1)">
      <div style="font-weight:bold; font-size:16px; color:var(--accent); margin-bottom:4px">📊 ${bestPersona.name}</div>
      <div style="font-size:13px; color:var(--text)"><em>Reality:</em> ${bestPersona.reality}</div>
    </div>`;
  anGrid.appendChild(personaCard);

  // ── Insight card ─────────────────────────────────────────────────────────────
  // FIX: insights were generating but data was all-zero (totalH=0) due to the
  //      offsetHeight bug. Now they compute correctly.
  const ignored=['sleep','work','study'];
  const catRanked=Object.values(catMap).filter(x=>!ignored.includes(x.catId)&&x.catId!=='__free').sort((a,b)=>b.hours-a.hours);
  const topCat=catRanked[0];
  const studyH=(catMap['study']?.hours||0);
  const sleepH=(catMap['sleep']?.hours||0);
  const workH=(catMap['work']?.hours||0);

  // Busiest hour label
  const busiestLabel=fmt12h(busiestH);

  let insight=`You've scheduled <strong>${totalH.toFixed(1)} hours</strong> today`;
  if(doneCount>0){
    insight+=`, completing <strong>${completedH.toFixed(1)}h</strong> with a productivity score of <strong>${prodScore}%</strong>`;
  } else {
    insight+=` — start completing blocks to track your productivity`;
  }
  insight+='.';
  if(topCat)insight+=` Your top activity outside work & study is <strong>${topCat.cat?.name||'Uncategorised'}</strong> at ${topCat.hours.toFixed(1)}h.`;
  if(totalH>0)insight+=` Peak hour: <strong>${busiestLabel}</strong>.`;

  const suggestions=[];
  if(sleepH<7&&sleepH>0)suggestions.push({icon:'😴',text:`You've scheduled ${sleepH.toFixed(1)}h of sleep — aim for at least 7h for peak performance`});
  if(sleepH===0)suggestions.push({icon:'😴',text:'Consider adding a sleep block — 7–9 hours helps memory and recovery'});
  if(studyH<1)suggestions.push({icon:'📚',text:'Try to include at least 1h of study or learning time'});
  if(totalH<8)suggestions.push({icon:'📅',text:'Your schedule has a lot of free time — consider adding more structured activities'});
  if(doneCount===0&&blocks.length>0)suggestions.push({icon:'✅',text:'Tick the ✓ on any block when you finish it to earn reward points!'});
  if(prodScore>0&&prodScore<50)suggestions.push({icon:'🎯',text:`You're at ${prodScore}% completion — keep going, you can do it!`});
  if(prodScore>=80&&doneCount>0)suggestions.push({icon:'🏆',text:`Outstanding! ${prodScore}% completion rate today — keep that momentum!`});

  // Completion trend (percentage display)
  const completionBar=doneCount>0?`<div style="margin-top:10px">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:4px"><span>Completion</span><span>${doneCount}/${blocks.length} blocks</span></div>
    <div style="height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden"><div style="height:100%;width:${prodScore}%;background:var(--accent);border-radius:3px;transition:width .4s"></div></div>
  </div>`:'';

  const insCard=document.createElement('div');insCard.className='an-card full';
  insCard.innerHTML=`<div class="an-card-title">AI Insights</div><div class="an-card-sub">Smart analysis of your schedule</div>
  <div class="insight-box"><div class="insight-text">${insight}</div>${completionBar}</div>
  ${suggestions.length?`<div style="margin-top:12px"><div class="an-card-sub" style="margin-bottom:8px">💡 Suggestions</div>${suggestions.map(sg=>`<div class="suggestion-item"><span class="suggestion-icon">${sg.icon}</span>${sg.text}</div>`).join('')}</div>`:''}`;
  anGrid.appendChild(insCard);
  content.appendChild(anGrid);
}
