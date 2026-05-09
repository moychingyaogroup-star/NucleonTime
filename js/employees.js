// ── EMPLOYEES FINANCES VIEW ──────────────────────────────────────────────────
// Today / Monthly / Yearly employee finance system with proper resignation dates.
// Hourly workers use a resignation date. Monthly Salary workers use Last Month.
// Salary leave hours use Option B: daily salary × (leave hours ÷ work hours/day).

let currentEmpFilter = localStorage.getItem('tf_emp_filter_v2') || 'Today';
if (!['Today', 'Monthly', 'Yearly'].includes(currentEmpFilter)) currentEmpFilter = 'Today';

const EMP_DATE_KEYS = {
    Today: 'tf_emp_selected_day_v1',
    Monthly: 'tf_emp_selected_month_v1',
    Yearly: 'tf_emp_selected_year_v1'
};

function empTodayISO() { return fmtDate(new Date()); }
function empMonthISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function empYearISO(d = new Date()) { return String(d.getFullYear()); }
function getEmpSelectedValue(period = currentEmpFilter) {
    if (period === 'Today') return localStorage.getItem(EMP_DATE_KEYS.Today) || empTodayISO();
    if (period === 'Monthly') return localStorage.getItem(EMP_DATE_KEYS.Monthly) || empMonthISO();
    return localStorage.getItem(EMP_DATE_KEYS.Yearly) || empYearISO();
}
function setEmpSelectedValue(value) {
    if (!value) return;
    localStorage.setItem(EMP_DATE_KEYS[currentEmpFilter], value);
    renderEmployees();
}
function parseISODate(value) {
    if (!value) return null;
    const [y,m,d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m-1, d);
    dt.setHours(0,0,0,0);
    return dt;
}
function parseMonth(value) {
    if (!value) return null;
    const [y,m] = String(value).split('-').map(Number);
    if (!y || !m) return null;
    return {year:y, month:m};
}
function startOfMonth(y,m){ const d=new Date(y,m-1,1); d.setHours(0,0,0,0); return d; }
function endOfMonth(y,m){ const d=new Date(y,m,0); d.setHours(0,0,0,0); return d; }
function startOfYear(y){ const d=new Date(y,0,1); d.setHours(0,0,0,0); return d; }
function endOfYear(y){ const d=new Date(y,11,31); d.setHours(0,0,0,0); return d; }
function daysInclusive(a,b){ return Math.max(0, Math.floor((b-a)/86400000)+1); }
function minDate(a,b){ return a < b ? a : b; }
function getDaysInMonth(year, monthIndex) { return new Date(year, monthIndex + 1, 0).getDate(); }
function getDaysInYear(year) { return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365; }

function _safeEmpObj(emp) {
    emp = emp || {};
    if (emp.payType === 'Salary') {
        emp.payType = 'Monthly Salary';
        if (!emp.salaryMonthlyMigrated) {
            emp.payRate = (Number(emp.payRate) || 0) / 12;
            emp.salaryMonthlyMigrated = true;
        }
    }
    if (!emp.payType) emp.payType = 'Hourly';
    if (!emp.hours || typeof emp.hours !== 'object') emp.hours = {};
    if (!emp.leave || typeof emp.leave !== 'object') emp.leave = {};
    if (!emp.leaveDays || typeof emp.leaveDays !== 'object') emp.leaveDays = {};
    ['Today','Monthly','Yearly'].forEach(k => {
        if (emp.hours[k] === undefined) emp.hours[k] = 0;
        if (emp.leave[k] === undefined) emp.leave[k] = 0;
        if (emp.leaveDays[k] === undefined) emp.leaveDays[k] = 0;
    });
    if (!emp.hours.Monthly && emp.hours.MTD) emp.hours.Monthly = Number(emp.hours.MTD) || 0;
    if (!emp.hours.Yearly && emp.hours.YTD) emp.hours.Yearly = Number(emp.hours.YTD) || 0;
    if (!emp.leave.Monthly && emp.leave.MTD) emp.leave.Monthly = Number(emp.leave.MTD) || 0;
    if (!emp.leave.Yearly && emp.leave.YTD) emp.leave.Yearly = Number(emp.leave.YTD) || 0;
    if (!emp.leaveDays.Monthly && emp.leaveDays.MTD) emp.leaveDays.Monthly = Number(emp.leaveDays.MTD) || 0;
    if (!emp.leaveDays.Yearly && emp.leaveDays.YTD) emp.leaveDays.Yearly = Number(emp.leaveDays.YTD) || 0;
    emp.name = emp.name || 'Unnamed';
    emp.payRate = Number(emp.payRate) || 0;
    emp.resignationDate = emp.resignationDate || '';
    emp.lastMonth = emp.lastMonth || '';
    if (emp.payType === 'Monthly Salary' && (!emp.hoursPerDay || Number(emp.hoursPerDay) <= 0)) emp.hoursPerDay = Number(emp.hours.Today) || 8;
    return emp;
}
function getEmployees() {
    const raw = gsRaw('EMP_FINANCES') || [];
    const emps = Array.isArray(raw) ? raw.map(_safeEmpObj) : [];
    saveEmployees(emps);
    return emps;
}
function saveEmployees(emps) { ssRaw('EMP_FINANCES', Array.isArray(emps) ? emps : []); }

function empPickerHtml() {
    const val = getEmpSelectedValue();
    if (currentEmpFilter === 'Today') return `<span class="tf-picker-wrap day"><input type="date" class="tf-input tf-date-compact" value="${val}" onchange="setEmpSelectedValue(this.value)" title="Choose day"></span>`;
    if (currentEmpFilter === 'Monthly') return `<span class="tf-picker-wrap month"><input type="month" class="tf-input tf-date-compact" value="${val}" onchange="setEmpSelectedValue(this.value)" title="Choose month"></span>`;
    return `<span class="tf-picker-wrap year"><input type="number" class="tf-input tf-date-compact" value="${val}" min="2000" max="2100" step="1" onchange="setEmpSelectedValue(this.value)" title="Choose year"></span>`;
}

function periodRange(period) {
    if (period === 'Today') {
        const d = parseISODate(getEmpSelectedValue('Today')) || new Date();
        d.setHours(0,0,0,0);
        return {start:d,end:d,days:1,monthDays:getDaysInMonth(d.getFullYear(),d.getMonth()),year:d.getFullYear(),month:d.getMonth()+1};
    }
    if (period === 'Monthly') {
        const m = parseMonth(getEmpSelectedValue('Monthly')) || parseMonth(empMonthISO());
        const start = startOfMonth(m.year,m.month), end = endOfMonth(m.year,m.month);
        return {start,end,days:daysInclusive(start,end),monthDays:daysInclusive(start,end),year:m.year,month:m.month};
    }
    const y = Number(getEmpSelectedValue('Yearly')) || new Date().getFullYear();
    return {start:startOfYear(y),end:endOfYear(y),days:getDaysInYear(y),monthDays:12,year:y};
}

function activeDaysForHourly(emp, period) {
    const r = periodRange(period);
    const resign = parseISODate(emp.resignationDate);
    if (resign && resign < r.start) return 0;
    const activeEnd = resign ? minDate(resign, r.end) : r.end;
    if (activeEnd < r.start) return 0;
    return daysInclusive(r.start, activeEnd);
}
function activeMonthsForSalary(emp, period) {
    const r = periodRange(period);
    const lm = parseMonth(emp.lastMonth);
    if (period === 'Today' || period === 'Monthly') {
        if (!lm) return 1;
        const currentYM = r.year*12 + r.month;
        const lastYM = lm.year*12 + lm.month;
        return currentYM <= lastYM ? 1 : 0;
    }
    if (!lm) return 12;
    if (r.year < lm.year) return 12;
    if (r.year > lm.year) return 0;
    return Math.max(0, Math.min(12, lm.month));
}
function activeCalendarDaysForSalary(emp, period) {
    if (period === 'Today') return activeMonthsForSalary(emp, period) ? 1 : 0;
    if (period === 'Monthly') {
        const r = periodRange(period);
        return activeMonthsForSalary(emp, period) ? r.monthDays : 0;
    }
    const r = periodRange(period);
    const months = activeMonthsForSalary(emp, period);
    let days = 0;
    for (let m=1; m<=months; m++) days += getDaysInMonth(r.year, m-1);
    return days;
}
function boundedLeaveDays(period, raw) {
    const n = Math.max(0, Number(raw) || 0);
    return period === 'Today' ? Math.min(1, n) : n;
}
function salaryHoursPerDay(emp) { return Math.max(1, Number(emp.hoursPerDay) || Number(emp.hours?.Today) || 8); }

function calculateCost(emp, period = currentEmpFilter) {
    emp = _safeEmpObj(emp);
    const rate = Number(emp.payRate) || 0;
    if (emp.payType === 'Hourly') {
        if (activeDaysForHourly(emp, period) <= 0) return 0;
        const hours = period === 'Today' ? (Number(emp.hours.Today)||0) : (Number(emp.hours[period])||0);
        const leaveHours = Number(emp.leave[period]) || 0;
        const leaveDays = boundedLeaveDays(period, emp.leaveDays[period]);
        const activeDays = activeDaysForHourly(emp, period);
        const avgHoursPerDay = activeDays > 0 ? hours / activeDays : 0;
        const payableHours = Math.max(0, hours - leaveHours - (leaveDays * avgHoursPerDay));
        return payableHours * rate;
    }
    if (emp.payType === 'Monthly Salary') {
        const activeMonths = activeMonthsForSalary(emp, period);
        if (activeMonths <= 0) return 0;
        const activeDays = activeCalendarDaysForSalary(emp, period);
        if (activeDays <= 0) return 0;
        let base = 0;
        if (period === 'Today') base = rate / periodRange(period).monthDays;
        else if (period === 'Monthly') base = rate;
        else base = rate * activeMonths;
        const dailySalary = period === 'Today' ? base : base / activeDays;
        const hourlySalary = dailySalary / salaryHoursPerDay(emp);
        const leaveDays = boundedLeaveDays(period, emp.leaveDays[period]);
        const leaveHours = Number(emp.leave[period]) || 0;
        return Math.max(0, base - (leaveDays * dailySalary) - (leaveHours * hourlySalary));
    }
    return 0;
}
function isEmployeeActiveInPeriod(emp, period=currentEmpFilter) {
    emp = _safeEmpObj(emp);
    if (emp.payType === 'Hourly') return activeDaysForHourly(emp, period) > 0;
    return activeMonthsForSalary(emp, period) > 0;
}

function renderEmployees() {
    const view = document.querySelector('#view-employees .view-inner');
    if (!view) return;
    const emps = getEmployees();
    let yearlyCost = 0, monthlyCost = 0, periodCost = 0, activeEmployees = 0;
    emps.forEach(emp => {
        const monthly = calculateCost(emp, 'Monthly');
        const yearly = calculateCost(emp, 'Yearly');
        const current = calculateCost(emp, currentEmpFilter);
        monthlyCost += monthly;
        yearlyCost += yearly;
        periodCost += current;
        if (current > 0 || isEmployeeActiveInPeriod(emp, currentEmpFilter)) activeEmployees++;
    });
    const selectedLabel = getEmpSelectedValue();
    const hoursLabel = currentEmpFilter === 'Today' ? 'Hours Worked' : 'Total Hours';
    const leaveDaysLabel = currentEmpFilter === 'Today' ? 'Leave Day (0/1)' : 'Leave Days';
    let html = `
        <div class="emp-header-row">
            <div><h2>Employee Finances</h2><div class="view-sub">Showing ${currentEmpFilter}: ${escHtml(selectedLabel)}</div></div>
            <div class="emp-toolbar">
                <select class="tf-input tf-select-glass" onchange="setEmpFilter(this.value)">
                    <option value="Today" ${currentEmpFilter === 'Today' ? 'selected' : ''}>Today</option>
                    <option value="Monthly" ${currentEmpFilter === 'Monthly' ? 'selected' : ''}>Monthly</option>
                    <option value="Yearly" ${currentEmpFilter === 'Yearly' ? 'selected' : ''}>Yearly</option>
                </select>
                ${empPickerHtml()}
                <button class="task-add-btn" onclick="addEmpFinance()">+ Add Employee</button>
            </div>
        </div>
        <div class="emp-summary-grid">
            <div class="card-base emp-summary-card"><div>$${yearlyCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><span>Total Yearly Cost</span></div>
            <div class="card-base emp-summary-card"><div>$${monthlyCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><span>Total Monthly Cost</span></div>
            <div class="card-base emp-summary-card"><div>$${periodCost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><span>Cost (${currentEmpFilter})</span></div>
            <div class="card-base emp-summary-card"><div>${activeEmployees}</div><span>Employees Counted</span></div>
        </div>
        <div class="card-base" style="padding:20px; overflow:auto;">
            <table class="emp-table">
                <thead><tr>
                    <th>Name</th><th>Pay Type</th><th>Pay Rate</th><th>${hoursLabel}<br><small>${currentEmpFilter==='Today'?'Salary: hours/day':'Hourly: total, Salary: hours/day'}</small></th>
                    <th>Leave Hours<br><small>${currentEmpFilter}</small></th><th>${leaveDaysLabel}<br><small>${currentEmpFilter}</small></th>
                    <th>Cost (${currentEmpFilter})</th><th>${currentEmpFilter === 'Today' ? 'End / Last Month' : 'Resignation / Last Month'}</th><th>Actions</th>
                </tr></thead><tbody>`;
    if (!emps.length) {
        html += `<tr><td colspan="9" class="emp-empty">No employees added yet.</td></tr>`;
    } else {
        emps.forEach((emp,index)=>{
            const isHourly = emp.payType === 'Hourly';
            const cost = calculateCost(emp, currentEmpFilter);
            const hoursValue = isHourly ? (Number(emp.hours?.[currentEmpFilter])||0) : salaryHoursPerDay(emp);
            const leaveHours = Number(emp.leave?.[currentEmpFilter])||0;
            const leaveDays = boundedLeaveDays(currentEmpFilter, emp.leaveDays?.[currentEmpFilter]);
            const endField = isHourly
                ? `<span class="tf-picker-wrap day"><input type="date" class="tf-input tf-date-compact" value="${emp.resignationDate||''}" onchange="updateEmpEnd(${index}, this.value)"></span>`
                : `<span class="tf-picker-wrap month"><input type="month" class="tf-input tf-date-compact" value="${emp.lastMonth||''}" onchange="updateEmpLastMonth(${index}, this.value)" title="Last paid month, inclusive"></span>`;
            html += `<tr>
                <td>${escHtml(emp.name)}</td>
                <td>${escHtml(emp.payType)}</td>
                <td>$${Number(emp.payRate||0).toLocaleString()}${isHourly?'/hr':'/month'}</td>
                <td><input type="number" class="tf-input emp-mini-input" value="${hoursValue}" min="0" onblur="updateEmpHours(${index}, '${currentEmpFilter}', '${isHourly?'worked':'salaryHoursPerDay'}', this.value)"></td>
                <td><input type="number" class="tf-input emp-mini-input" value="${leaveHours}" min="0" onblur="updateEmpHours(${index}, '${currentEmpFilter}', 'leave', this.value)"></td>
                <td><input type="number" class="tf-input emp-mini-input" value="${leaveDays}" min="0" ${currentEmpFilter==='Today'?'max="1" step="1"':''} onblur="updateEmpHours(${index}, '${currentEmpFilter}', 'leaveDays', this.value)"></td>
                <td class="emp-cost">$${cost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td>${endField}<div class="emp-field-hint">${isHourly?'Resignation date inclusive':'Last paid month inclusive'}</div></td>
                <td><button onclick="deleteEmpFinance(${index})" class="icon-danger-btn">🗑</button></td>
            </tr>`;
        });
    }
    html += `</tbody></table></div>
        <div class="emp-note">Hourly: Today uses hours worked; Monthly/Yearly use total hours in the selected period. Monthly Salary: Last Month is inclusive. Leave Days reduce full daily salary; Leave Hours use Option B: daily salary ÷ hours/day.</div>`;
    view.innerHTML = html;
}

function setEmpFilter(val) {
    currentEmpFilter = ['Today','Monthly','Yearly'].includes(val) ? val : 'Today';
    localStorage.setItem('tf_emp_filter_v2', currentEmpFilter);
    renderEmployees();
}
function updateEmpHours(index, period, type, val) {
    const emps = getEmployees();
    if (!emps[index]) return;
    const num = parseFloat(val);
    let finalVal = isNaN(num) ? 0 : Math.max(0, num);
    emps[index].hours = emps[index].hours || {};
    emps[index].leave = emps[index].leave || {};
    emps[index].leaveDays = emps[index].leaveDays || {};
    if (type === 'worked') emps[index].hours[period] = finalVal;
    else if (type === 'salaryHoursPerDay') emps[index].hoursPerDay = Math.max(1, finalVal || 8);
    else if (type === 'leaveDays') {
        if (period === 'Today') finalVal = Math.min(1, Math.round(finalVal));
        emps[index].leaveDays[period] = finalVal;
    } else emps[index].leave[period] = finalVal;
    saveEmployees(emps); renderEmployees();
}
function addEmpFinance() {
    showModal({
        title: 'Add Employee',
        body: `
            <label class="tf-label">Name</label><input class="tf-input" id="ef-name" placeholder="John Doe"/>
            <label class="tf-label" style="margin-top:10px;">Pay Type</label>
            <select class="tf-input tf-select-glass" id="ef-type"><option value="Hourly">Hourly</option><option value="Monthly Salary">Monthly Salary</option></select>
            <label class="tf-label" style="margin-top:10px;">Pay Rate</label>
            <input class="tf-input" type="number" id="ef-rate" placeholder="e.g. 25 hourly, 4000 monthly salary"/>
        `,
        btn: 'Add',
        onConfirm: () => {
            const name = document.getElementById('ef-name').value.trim();
            const payType = document.getElementById('ef-type').value;
            const payRate = parseFloat(document.getElementById('ef-rate').value) || 0;
            if (!name) return false;
            const emps = getEmployees();
            emps.push({ name, payType, payRate, hours:{Today:0,Monthly:0,Yearly:0}, hoursPerDay:8, leave:{Today:0,Monthly:0,Yearly:0}, leaveDays:{Today:0,Monthly:0,Yearly:0}, resignationDate:'', lastMonth:'' });
            saveEmployees(emps); renderEmployees();
        }
    });
}
function deleteEmpFinance(index) {
    if (confirm('Are you sure you want to delete this employee?')) {
        const emps = getEmployees(); emps.splice(index,1); saveEmployees(emps); renderEmployees();
    }
}
function updateEmpEnd(index, val) { const emps=getEmployees(); if(!emps[index])return; emps[index].resignationDate=val; saveEmployees(emps); renderEmployees(); }
function updateEmpResignation(index, val) { updateEmpEnd(index, val); }
function updateEmpLastMonth(index, val) { const emps=getEmployees(); if(!emps[index])return; emps[index].lastMonth=val; saveEmployees(emps); renderEmployees(); }
function isEmployeeActive(emp, today = new Date()) {
    emp = _safeEmpObj(emp);
    if (emp.payType === 'Hourly') {
        if (!emp.resignationDate) return true;
        const resign = parseISODate(emp.resignationDate);
        today = new Date(today); today.setHours(0,0,0,0);
        return !resign || resign >= today;
    }
    if (!emp.lastMonth) return true;
    const lm = parseMonth(emp.lastMonth);
    const nowYM = today.getFullYear()*12 + (today.getMonth()+1);
    return nowYM <= lm.year*12 + lm.month;
}
