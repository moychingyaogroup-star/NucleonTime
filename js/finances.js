// Finances view — monthly weekly tracker
// Keeps data local to this browser, matching the rest of the app's local-first style.
const FINANCE_KEY = 'TF_FINANCES_V1';
const FINANCE_WEEKS = 5;
const FINANCE_DEFAULTS = [
  { earn: 2000, exp: 1500, use: 0 },
  { earn: 2500, exp: 1200, use: 800 },
  { earn: 1800, exp: 2100, use: 0 },
  { earn: 3000, exp: 1000, use: 1500 },
  { earn: 500, exp: 300, use: 0 }
];

function getFinanceData() {
  try {
    const raw = localStorage.getItem(FINANCE_KEY);
    if (!raw) return FINANCE_DEFAULTS.map(x => ({ ...x }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return FINANCE_DEFAULTS.map(x => ({ ...x }));
    return Array.from({ length: FINANCE_WEEKS }, (_, i) => ({
      earn: Number(parsed[i]?.earn) || 0,
      exp: Number(parsed[i]?.exp) || 0,
      use: Number(parsed[i]?.use) || 0
    }));
  } catch (_) {
    return FINANCE_DEFAULTS.map(x => ({ ...x }));
  }
}

function saveFinanceData(data) {
  localStorage.setItem(FINANCE_KEY, JSON.stringify(data));
}

function financeMoney(value) {
  const safe = Number(value) || 0;
  return `RM ${safe.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function renderFinances() {
  const form = document.getElementById('finance-form');
  if (!form) return;
  const data = getFinanceData();

  form.innerHTML = data.map((week, idx) => {
    const i = idx + 1;
    return `
      <div class="finance-week-group">
        <div class="finance-week-title">Week ${i}</div>
        <label class="finance-input-row">Earnings <span class="finance-input-wrap">RM <input type="number" min="0" inputmode="decimal" id="finance-earn-${i}" value="${week.earn}"></span></label>
        <label class="finance-input-row">Expenses & Debts <span class="finance-input-wrap">RM <input type="number" min="0" inputmode="decimal" id="finance-exp-${i}" value="${week.exp}"></span></label>
        <label class="finance-input-row">Cash Usage <span class="finance-input-wrap">RM <input type="number" min="0" inputmode="decimal" id="finance-use-${i}" value="${week.use}"></span></label>
      </div>
    `;
  }).join('');

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateFinanceDashboard);
  });

  updateFinanceDashboard();
}

function readFinanceInputs() {
  return Array.from({ length: FINANCE_WEEKS }, (_, idx) => {
    const i = idx + 1;
    return {
      earn: Number(document.getElementById(`finance-earn-${i}`)?.value) || 0,
      exp: Number(document.getElementById(`finance-exp-${i}`)?.value) || 0,
      use: Number(document.getElementById(`finance-use-${i}`)?.value) || 0
    };
  });
}

function updateFinanceDashboard() {
  const data = readFinanceInputs();
  saveFinanceData(data);

  let totalEarnings = 0;
  let totalExpenses = 0;
  let reserve = 0;
  const earnings = [];
  const expenses = [];
  const reserves = [];

  data.forEach(week => {
    totalEarnings += week.earn;
    totalExpenses += week.exp;
    earnings.push(week.earn);
    expenses.push(week.exp);
    reserve += week.earn - week.exp - week.use;
    reserves.push(reserve);
  });

  const earnEl = document.getElementById('finance-total-earnings');
  const expEl = document.getElementById('finance-total-expenses');
  const reserveEl = document.getElementById('finance-final-reserve');
  if (earnEl) earnEl.textContent = financeMoney(totalEarnings);
  if (expEl) expEl.textContent = financeMoney(totalExpenses);
  if (reserveEl) {
    reserveEl.textContent = financeMoney(reserve);
    reserveEl.classList.toggle('finance-bad', reserve < 0);
    reserveEl.classList.toggle('finance-accent', reserve >= 0);
  }

  drawFinanceChart('finance-cash-chart', [
    { label: 'Earnings', values: earnings, color: '#22C55E' },
    { label: 'Expenses', values: expenses, color: '#EF4444' }
  ]);
  drawFinanceChart('finance-reserve-chart', [
    { label: 'Reserve', values: reserves, color: '#3B82F6' }
  ]);
}

function drawFinanceChart(canvasId, series) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(320, Math.floor(rect.width || canvas.parentElement?.clientWidth || 620));
  const cssH = Math.max(220, Math.floor(rect.height || 260));
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const styles = getComputedStyle(document.documentElement);
  const text = styles.getPropertyValue('--text2').trim() || '#D1D5DB';
  const muted = styles.getPropertyValue('--muted').trim() || '#9CA3AF';
  const border = styles.getPropertyValue('--border2').trim() || 'rgba(255,255,255,.12)';
  const pad = { left: 58, right: 18, top: 24, bottom: 42 };
  const plotW = cssW - pad.left - pad.right;
  const plotH = cssH - pad.top - pad.bottom;
  const allValues = series.flatMap(s => s.values);
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(100, ...allValues);
  const range = maxValue - minValue || 1;
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const xFor = i => pad.left + (plotW * i) / Math.max(1, labels.length - 1);
  const yFor = v => pad.top + plotH - ((v - minValue) / range) * plotH;

  ctx.font = '10px DM Sans, sans-serif';
  ctx.lineWidth = 1;
  ctx.strokeStyle = border;
  ctx.fillStyle = muted;

  for (let g = 0; g <= 4; g++) {
    const y = pad.top + (plotH * g) / 4;
    const val = maxValue - (range * g) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(cssW - pad.right, y);
    ctx.stroke();
    ctx.fillText(`RM ${Math.round(val).toLocaleString()}`, 6, y + 4);
  }

  labels.forEach((label, i) => {
    ctx.fillStyle = muted;
    ctx.fillText(label, xFor(i) - 8, cssH - 18);
  });

  series.forEach((item, idx) => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    item.values.forEach((v, i) => {
      const x = xFor(i), y = yFor(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    item.values.forEach((v, i) => {
      const x = xFor(i), y = yFor(v);
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = text;
    ctx.font = '11px DM Sans, sans-serif';
    ctx.fillText(item.label, pad.left + idx * 90, 14);
    ctx.fillStyle = item.color;
    ctx.fillRect(pad.left + idx * 90 - 14, 6, 9, 9);
  });
}

function resetFinances() {
  if (!confirm('Reset the finance tracker back to the starter month?')) return;
  saveFinanceData(FINANCE_DEFAULTS.map(x => ({ ...x })));
  renderFinances();
  if (typeof showToast === 'function') showToast('Finances reset.');
}

window.addEventListener('resize', () => {
  if (document.getElementById('view-finances')?.classList.contains('active')) updateFinanceDashboard();
});
