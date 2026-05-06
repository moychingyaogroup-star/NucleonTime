// ── EMPLOYEES FINANCES VIEW ──────────────────────────────────────────────────
function getEmployees() {
    return gsRaw('EMP_FINANCES') || [];
}

function saveEmployees(emps) {
    ssRaw('EMP_FINANCES', emps);
}

let currentEmpFilter = 'Today'; // Today, WTD, MTD, YTD

function renderEmployees() {
    const view = document.querySelector('#view-employees .view-inner');
    if (!view) return;

    const emps = getEmployees();

    // Calculations
    let ytdCost = 0;
    let mtdCost = 0;
    let activeEmployees = emps.length;

    emps.forEach(emp => {
        ytdCost += calculateCost(emp, 'YTD');
        mtdCost += calculateCost(emp, 'MTD');
    });

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2>Employee Finances</h2>
            <div style="display:flex; gap:10px;">
                <select class="tf-input" onchange="setEmpFilter(this.value)" style="width:auto;">
                    <option value="Today" ${currentEmpFilter === 'Today' ? 'selected' : ''}>Today</option>
                    <option value="WTD" ${currentEmpFilter === 'WTD' ? 'selected' : ''}>WTD</option>
                    <option value="MTD" ${currentEmpFilter === 'MTD' ? 'selected' : ''}>MTD</option>
                    <option value="YTD" ${currentEmpFilter === 'YTD' ? 'selected' : ''}>YTD</option>
                </select>
                <button class="task-add-btn" onclick="addEmpFinance()">+ Add Employee</button>
            </div>
        </div>

        <div style="display:flex; gap:15px; margin-bottom:20px;">
            <div class="card-base" style="flex:1; padding:20px; text-align:center;">
                <div style="font-size:24px; font-weight:bold; color:var(--accent);">$${ytdCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div style="color:var(--muted); font-size:12px; margin-top:5px;">Total YTD Cost</div>
            </div>
            <div class="card-base" style="flex:1; padding:20px; text-align:center;">
                <div style="font-size:24px; font-weight:bold; color:var(--accent);">$${mtdCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div style="color:var(--muted); font-size:12px; margin-top:5px;">Total MTD Cost</div>
            </div>
            <div class="card-base" style="flex:1; padding:20px; text-align:center;">
                <div style="font-size:24px; font-weight:bold; color:var(--text);">${activeEmployees}</div>
                <div style="color:var(--muted); font-size:12px; margin-top:5px;">Active Employees</div>
            </div>
        </div>

        <div class="card-base" style="padding:20px;">
            <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border); color:var(--muted);">
                        <th style="padding:10px;">Name</th>
                        <th style="padding:10px;">Pay Type</th>
                        <th style="padding:10px;">Pay Rate</th>
                        <th style="padding:10px;">Hours Work (${currentEmpFilter})</th>
                        <th style="padding:10px;">Leave (${currentEmpFilter})</th>
                        <th style="padding:10px;">Cost (${currentEmpFilter})</th>
                        <th style="padding:10px;">Actions</th>
                    </tr>
                </thead>
                <tbody id="emp-tbody">
    `;

    if (emps.length === 0) {
        html += `<tr><td colspan="7" style="padding:20px; text-align:center; color:var(--muted);">No employees added yet.</td></tr>`;
    } else {
        emps.forEach((emp, index) => {
            const cost = calculateCost(emp, currentEmpFilter);

            // Only allow hour edits for Hourly employees to prevent UX confusion
            const isHourly = emp.payType === 'Hourly';
            const inputAttr = isHourly ? '' : 'disabled title="Salary costs are fixed" style="opacity: 0.5"';

            html += `
                <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:10px;">${escHtml(emp.name)}</td>
                    <td style="padding:10px;">${escHtml(emp.payType)}</td>
                    <td style="padding:10px;">$${emp.payRate}${isHourly ? '/hr' : '/yr'}</td>
                    <td style="padding:10px;"><input type="number" class="tf-input" style="width:60px;" value="${emp.hours[currentEmpFilter] || 0}" onblur="updateEmpHours(${index}, '${currentEmpFilter}', 'worked', this.value)" ${inputAttr}/></td>
                    <td style="padding:10px;"><input type="number" class="tf-input" style="width:60px;" value="${emp.leave[currentEmpFilter] || 0}" onblur="updateEmpHours(${index}, '${currentEmpFilter}', 'leave', this.value)" ${inputAttr}/></td>
                    <td style="padding:10px; font-weight:bold;">$${cost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td style="padding:10px;"><button onclick="deleteEmpFinance(${index})" style="background:none; border:none; cursor:pointer; color:#EF4444; font-size:16px;">🗑</button></td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    view.innerHTML = html;
}

function setEmpFilter(val) {
    currentEmpFilter = val;
    renderEmployees();
}

function calculateCost(emp, period) {
    let cost = 0;
    const hours = Number(emp.hours[period]) || 0;
    const leave = Number(emp.leave[period]) || 0;

    if (emp.payType === 'Hourly') {
        cost = (hours + leave) * Number(emp.payRate);
    } else if (emp.payType === 'Salary') {
        const rate = Number(emp.payRate);
        if (period === 'Today') cost = rate / 260; // Approx working days in year
        else if (period === 'WTD') cost = rate / 52;
        else if (period === 'MTD') cost = rate / 12;
        else if (period === 'YTD') cost = rate;
    }

    return cost;
}

function updateEmpHours(index, period, type, val) {
    const emps = getEmployees();
    const numVal = parseFloat(val);
    const finalVal = isNaN(numVal) ? 0 : numVal;

    if (type === 'worked') {
        emps[index].hours[period] = finalVal;
    } else {
        emps[index].leave[period] = finalVal;
    }
    saveEmployees(emps);
    renderEmployees();
}

function addEmpFinance() {
    showModal({
        title: 'Add Employee',
        body: `
            <label class="tf-label">Name</label>
            <input class="tf-input" id="ef-name" placeholder="John Doe"/>
            <label class="tf-label" style="margin-top:10px;">Pay Type</label>
            <select class="tf-input" id="ef-type">
                <option value="Hourly">Hourly</option>
                <option value="Salary">Salary</option>
            </select>
            <label class="tf-label" style="margin-top:10px;">Pay Rate</label>
            <input class="tf-input" type="number" id="ef-rate" placeholder="e.g. 25 for Hourly, 60000 for Salary"/>
        `,
        btn: 'Add',
        onConfirm: () => {
            const name = document.getElementById('ef-name').value.trim();
            const payType = document.getElementById('ef-type').value;
            const payRate = parseFloat(document.getElementById('ef-rate').value) || 0;

            if (!name) return;

            const emps = getEmployees();
            emps.push({
                name,
                payType,
                payRate,
                hours: { 'Today': 0, 'WTD': 0, 'MTD': 0, 'YTD': 0 },
                leave: { 'Today': 0, 'WTD': 0, 'MTD': 0, 'YTD': 0 }
            });
            saveEmployees(emps);
            renderEmployees();
        }
    });
}

function deleteEmpFinance(index) {
    if (confirm("Are you sure you want to delete this employee?")) {
        const emps = getEmployees();
        emps.splice(index, 1);
        saveEmployees(emps);
        renderEmployees();
    }
}
