// ── CURRENCY & PLANT SYSTEM ──────────────────────────────────────────────────

function getPlantState() {
    const state = gs('PLANT_STATE') || {
        level: 1, // 1 to 10
        lastWateredDate: null,
        goldenApplesAvailable: 0
    };
    if (typeof state.level === 'undefined') state.level = 1;
    if (typeof state.goldenApplesAvailable === 'undefined') state.goldenApplesAvailable = 0;
    return state;
}

function savePlantState(state) {
    ss('PLANT_STATE', state);
}

function getCurrency() {
    return gs('GOLDEN_APPLES') || 0;
}

function saveCurrency(amt) {
    ss('GOLDEN_APPLES', amt);
}

function renderPlant() {
    const container = document.getElementById('plant-container');
    if (!container) return;

    const state = getPlantState();
    const currency = getCurrency();
    const todayStr = new Date().toDateString();
    const canWater = state.lastWateredDate !== todayStr;

    // Determine plant emoji based on level
    let plantEmoji = '🌱';
    let plantSize = 40 + (state.level * 5); // Grow bigger

    if (state.level >= 3 && state.level <= 5) plantEmoji = '🌿';
    if (state.level >= 6) plantEmoji = '🌳';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="font-weight:bold; color:var(--text);">My Sapling (Lv ${state.level})</div>
            <div style="font-weight:bold; color:#EAB308;">🍎 ${currency}</div>
        </div>
        <div style="text-align:center; position:relative; height: 120px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center;">
            <div style="font-size:${plantSize}px; transition:all 0.5s;">${plantEmoji}</div>
            <div style="width:60px; height:8px; background:rgba(0,0,0,0.2); border-radius:50%; margin-top:-5px;"></div>
    `;

    // Golden apples to collect
    if (state.goldenApplesAvailable > 0) {
        html += `
            <button onclick="collectApples()" style="position:absolute; top:10px; right:10px; background:#EAB308; color:#fff; border:none; border-radius:8px; padding:6px 12px; font-weight:bold; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.2); animation: bounce 1s infinite;">
                Collect 🍎 (+${state.goldenApplesAvailable})
            </button>
        `;
    }

    html += `</div>`;

    if (canWater) {
        html += `
            <button onclick="waterPlant()" style="width:100%; margin-top:10px; background:#3B82F6; color:#fff; border:none; border-radius:8px; padding:8px; font-weight:bold; cursor:pointer;">
                💧 Water Plant
            </button>
        `;
    } else {
        html += `
            <button disabled style="width:100%; margin-top:10px; background:var(--surface); color:var(--muted); border:1px solid var(--border); border-radius:8px; padding:8px; font-weight:bold;">
                💧 Watered Today
            </button>
        `;
    }

    container.innerHTML = html;
}

function waterPlant() {
    const state = getPlantState();
    const todayStr = new Date().toDateString();

    if (state.lastWateredDate === todayStr) return; // Already watered

    state.lastWateredDate = todayStr;

    // Grow plant logic
    if (state.level < 10) {
        state.level += 1;
    }

    // If level 6-10, produce apples
    if (state.level >= 6) {
        state.goldenApplesAvailable += 5;
    }

    savePlantState(state);

    showToast('Plant watered! 💧 It grew bigger!');
    beep('milestone'); // Some nice sound
    renderPlant();
}

function collectApples() {
    const state = getPlantState();
    if (state.goldenApplesAvailable <= 0) return;

    let currency = getCurrency();
    currency += state.goldenApplesAvailable;

    const earned = state.goldenApplesAvailable;
    state.goldenApplesAvailable = 0;

    saveCurrency(currency);
    savePlantState(state);

    showToast(`Collected ${earned} Golden Apples! 🍎`);
    beep('unlock');
    renderPlant();
}

// Global animation styles
if (!document.getElementById('currency-styles')) {
    const style = document.createElement('style');
    style.id = 'currency-styles';
    style.innerHTML = `
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderPlant, 600);
});
