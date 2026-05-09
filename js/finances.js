// Finances view — 12-month business tracker
// Data is saved by real year, so each year keeps its own monthly finances.
const FINANCE_KEY = 'TF_FINANCES_BY_YEAR_V2';
const FINANCE_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let financeYear = new Date().getFullYear();
let financeSelectedMonth = new Date().getMonth();

function blankFinanceYear(){
  return FINANCE_MONTHS.map(() => ({ earn: 0, exp: 0, use: 0 }));
}

function getFinanceStore(){
  try{
    const raw = localStorage.getItem(FINANCE_KEY);
    if(raw) return JSON.parse(raw) || { years:{} };

    // Gentle migration from the old 5-week finance version, if it exists.
    const old = JSON.parse(localStorage.getItem('TF_FINANCES_V1') || 'null');
    if(Array.isArray(old)){
      const months = blankFinanceYear();
      const total = old.reduce((a,w)=>({
        earn:a.earn+(Number(w?.earn)||0),
        exp:a.exp+(Number(w?.exp)||0),
        use:a.use+(Number(w?.use)||0)
      }), {earn:0,exp:0,use:0});
      months[financeSelectedMonth] = total;
      return { years: { [financeYear]: months } };
    }
  }catch(_){/* ignore bad saved data */}
  return { years:{} };
}

function saveFinanceStore(store){
  localStorage.setItem(FINANCE_KEY, JSON.stringify(store));
}

function getFinanceYearData(year = financeYear){
  const store = getFinanceStore();
  if(!store.years) store.years = {};
  if(!Array.isArray(store.years[year])) store.years[year] = blankFinanceYear();
  store.years[year] = Array.from({length:12}, (_,i) => ({
    earn: Number(store.years[year][i]?.earn) || 0,
    exp: Number(store.years[year][i]?.exp) || 0,
    use: Number(store.years[year][i]?.use) || 0
  }));
  saveFinanceStore(store);
  return store.years[year];
}

function setFinanceYearData(year, data){
  const store = getFinanceStore();
  if(!store.years) store.years = {};
  store.years[year] = data;
  saveFinanceStore(store);
}

function financeMoney(value){
  const safe = Number(value) || 0;
  const sign = safe < 0 ? '-' : '';
  return `${sign}RM ${Math.abs(safe).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function renderFinances(){
  const form = document.getElementById('finance-form');
  if(!form) return;
  const data = getFinanceYearData();
  const label = document.getElementById('finance-period-label');
  if(label) label.textContent = `${financeYear} • selected month: ${FINANCE_MONTHS[financeSelectedMonth]}`;

  form.innerHTML = data.map((month, idx) => `
    <div class="finance-week-group finance-month-group ${idx===financeSelectedMonth?'selected':''}" onclick="selectFinanceMonth(${idx})">
      <div class="finance-week-title">${FINANCE_MONTHS[idx]} ${financeYear}</div>
      <label class="finance-input-row">Earnings <span class="finance-input-wrap">RM <input type="number" min="0" inputmode="decimal" id="finance-earn-${idx}" value="${month.earn}"></span></label>
      <label class="finance-input-row">Costs & Debts <span class="finance-input-wrap">RM <input type="number" min="0" inputmode="decimal" id="finance-exp-${idx}" value="${month.exp}"></span></label>
      <label class="finance-input-row">Cash Used <span class="finance-input-wrap">RM <input type="number" min="0" inputmode="decimal" id="finance-use-${idx}" value="${month.use}"></span></label>
    </div>
  `).join('');

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('input', updateFinanceDashboard);
  });
  updateFinanceDashboard();
}

function readFinanceInputs(){
  return Array.from({length:12}, (_, idx) => ({
    earn: Number(document.getElementById(`finance-earn-${idx}`)?.value) || 0,
    exp: Number(document.getElementById(`finance-exp-${idx}`)?.value) || 0,
    use: Number(document.getElementById(`finance-use-${idx}`)?.value) || 0
  }));
}

function selectFinanceMonth(idx){
  financeSelectedMonth = idx;
  document.querySelectorAll('.finance-month-group').forEach((el,i)=>el.classList.toggle('selected', i===idx));
  const label = document.getElementById('finance-period-label');
  if(label) label.textContent = `${financeYear} • selected month: ${FINANCE_MONTHS[financeSelectedMonth]}`;
  updateFinanceDashboard();
}

function updateFinanceDashboard(){
  const data = readFinanceInputs();
  if(data.some(m => document.getElementById(`finance-earn-${data.indexOf(m)}`))) setFinanceYearData(financeYear, data);

  let totalEarnings = 0, totalExpenses = 0, totalUse = 0, reserve = 0;
  const earnings = [], expenses = [], reserves = [], profits = [];

  data.forEach(month => {
    const profit = month.earn - month.exp;
    totalEarnings += month.earn;
    totalExpenses += month.exp;
    totalUse += month.use;
    reserve += profit - month.use;
    earnings.push(month.earn);
    expenses.push(month.exp);
    profits.push(profit);
    reserves.push(reserve);
  });

  const yearProfit = totalEarnings - totalExpenses;
  const avgProfit = yearProfit / 12;
  const bestIdx = profits.indexOf(Math.max(...profits));
  const worstIdx = profits.indexOf(Math.min(...profits));
  const m = data[financeSelectedMonth] || {earn:0,exp:0,use:0};
  const monthProfit = m.earn - m.exp;
  const monthReserve = monthProfit - m.use;

  const setText = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  setText('finance-total-earnings', financeMoney(totalEarnings));
  setText('finance-total-expenses', financeMoney(totalExpenses));
  setText('finance-year-profit', financeMoney(yearProfit));
  setText('finance-final-reserve', financeMoney(reserve));
  setText('finance-month-profit', financeMoney(monthProfit));
  setText('finance-best-month', `${FINANCE_MONTHS[bestIdx]} • ${financeMoney(profits[bestIdx])}`);
  setText('finance-worst-month', `${FINANCE_MONTHS[worstIdx]} • ${financeMoney(profits[worstIdx])}`);
  setText('finance-average-profit', financeMoney(avgProfit));
  setText('finance-month-summary', `${FINANCE_MONTHS[financeSelectedMonth]}: ${financeMoney(m.earn)} in, ${financeMoney(m.exp)} out, ${financeMoney(m.use)} used, ${financeMoney(monthReserve)} reserve impact.`);

  ['finance-year-profit','finance-month-profit','finance-final-reserve','finance-average-profit'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    const value = id==='finance-year-profit'?yearProfit:id==='finance-month-profit'?monthProfit:id==='finance-final-reserve'?reserve:avgProfit;
    el.classList.toggle('finance-good', value >= 0);
    el.classList.toggle('finance-bad', value < 0);
  });

  drawFinanceChart('finance-cash-chart', [
    { label:'Earnings', values:earnings, color:'#22C55E' },
    { label:'Costs', values:expenses, color:'#EF4444' },
    { label:'Profit', values:profits, color:'#06B6D4' }
  ], FINANCE_MONTHS);
  drawFinanceChart('finance-reserve-chart', [
    { label:'Reserve', values:reserves, color:'#8B5CF6' }
  ], FINANCE_MONTHS);
}

function showFinanceCalendar(){
  if(typeof showModal !== 'function') return;
  const years = Array.from({length:7}, (_,i)=>financeYear-3+i);
  showModal({
    title:'Choose Finance Period',
    body:`
      <label class="tf-label">Year</label>
      <select class="tf-select" id="finance-year-picker">${years.map(y=>`<option value="${y}" ${y===financeYear?'selected':''}>${y}</option>`).join('')}</select>
      <div class="finance-month-picker">
        ${FINANCE_MONTHS.map((mo,i)=>`<button type="button" class="finance-month-pick ${i===financeSelectedMonth?'active':''}" data-month="${i}">${mo}</button>`).join('')}
      </div>
    `,
    btn:'Open Period',
    onConfirm:()=>{
      const y = Number(document.getElementById('finance-year-picker')?.value) || new Date().getFullYear();
      const active = document.querySelector('.finance-month-pick.active');
      financeYear = y;
      financeSelectedMonth = Number(active?.dataset.month) || 0;
      renderFinances();
    }
  });
  setTimeout(()=>{
    document.querySelectorAll('.finance-month-pick').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.finance-month-pick').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },0);
}

function drawFinanceChart(canvasId, series, labels){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(320, Math.floor(rect.width || canvas.parentElement?.clientWidth || 620));
  const cssH = Math.max(220, Math.floor(rect.height || 260));
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cssW,cssH);

  const styles = getComputedStyle(document.documentElement);
  const text = styles.getPropertyValue('--text2').trim() || '#D1D5DB';
  const muted = styles.getPropertyValue('--muted').trim() || '#9CA3AF';
  const border = styles.getPropertyValue('--border2').trim() || 'rgba(255,255,255,.12)';
  const pad = { left:58, right:18, top:28, bottom:42 };
  const plotW = cssW - pad.left - pad.right;
  const plotH = cssH - pad.top - pad.bottom;
  const allValues = series.flatMap(s=>s.values);
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(100, ...allValues);
  const range = maxValue - minValue || 1;
  const xFor = i => pad.left + (plotW * i) / Math.max(1, labels.length - 1);
  const yFor = v => pad.top + plotH - ((v - minValue) / range) * plotH;

  ctx.font = '10px DM Sans, sans-serif';
  ctx.lineWidth = 1;
  ctx.strokeStyle = border;
  ctx.fillStyle = muted;
  for(let g=0; g<=4; g++){
    const y = pad.top + (plotH*g)/4;
    const val = maxValue - (range*g)/4;
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(cssW-pad.right,y); ctx.stroke();
    ctx.fillText(`RM ${Math.round(val).toLocaleString()}`, 6, y+4);
  }
  labels.forEach((label,i)=>{ ctx.fillStyle=muted; ctx.fillText(label, xFor(i)-9, cssH-18); });

  series.forEach((item,idx)=>{
    ctx.strokeStyle=item.color; ctx.lineWidth=2.3; ctx.beginPath();
    item.values.forEach((v,i)=>{ const x=xFor(i), y=yFor(v); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();
    item.values.forEach((v,i)=>{ const x=xFor(i), y=yFor(v); ctx.fillStyle=item.color; ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle=text; ctx.font='11px DM Sans, sans-serif';
    ctx.fillText(item.label, pad.left + idx*88, 16);
    ctx.fillStyle=item.color; ctx.fillRect(pad.left + idx*88 - 14, 8, 9, 9);
  });
}

function resetFinances(){
  if(!confirm(`Reset all finance values for ${financeYear}?`)) return;
  setFinanceYearData(financeYear, blankFinanceYear());
  renderFinances();
  if(typeof showToast === 'function') showToast('Finance year reset.');
}

window.addEventListener('resize', () => {
  if(document.getElementById('view-finances')?.classList.contains('active')) updateFinanceDashboard();
});
