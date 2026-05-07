// ── TASKS SYSTEM ─────────────────────────────────────────────────────────────
function getTasks() {
    return gs('TASKS') || [
        { id: 1, text: "Organize my schedule for the week", done: false },
        { id: 2, text: "Finish math homework", done: false }
    ];
}

function saveTasks(t) {
    ss('TASKS', t);
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;
    taskList.innerHTML = '';
    const tasks = getTasks();
    tasks.forEach(t => {
        const item = document.createElement('div');
        item.className = 'task-item' + (t.done ? ' done' : '');
        item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--surface); border:1px solid var(--border); border-radius:8px; margin-bottom:8px;';

        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" ${t.done ? 'checked disabled' : ''} style="cursor:pointer; width:18px; height:18px;" onchange="completeTask(${t.id}, event)">
                <span style="text-decoration:${t.done ? 'line-through' : 'none'}; color:${t.done ? 'var(--muted)' : 'var(--text)'};">${escHtml(t.text)}</span>
            </div>
            ${t.done ? '' : `<button onclick="deleteTask(${t.id})" style="background:none; border:none; cursor:pointer; color:#EF4444; font-size:16px;">🗑</button>`}
        `;
        taskList.appendChild(item);
    });
}

function completeTask(id, e) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (t && !t.done) {
        t.done = true;
        saveTasks(tasks);

        // Award 50 points
        const rect = e.target.getBoundingClientRect();
        awardPoints(50, rect.left + window.scrollX, rect.top + window.scrollY);
        showToast('Task Complete! +50 pts 🎉');
        beep('complete');

        renderTasks();
    }
}

function deleteTask(id) {
    const tasks = getTasks().filter(x => x.id !== id);
    saveTasks(tasks);
    renderTasks();
}

function addTask() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
    if (!text) return;

    const tasks = getTasks();
    tasks.push({ id: Date.now(), text, done: false });
    saveTasks(tasks);
    input.value = '';
    renderTasks();
}


// ── BIRD ANIMATION ───────────────────────────────────────────────────────────
function initBird() {
    const bird = document.createElement('div');
    bird.id = 'flappy-bird';
    bird.style.cssText = `
        position: fixed;
        top: 20%;
        left: -50px;
        font-size: 32px;
        cursor: pointer;
        z-index: 9999;
        transition: transform 0.1s;
        user-select: none;
    `;
    bird.innerHTML = '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.928 2.627a1 1 0 0 0-1.216-.484L2.83 8.351a1 1 0 0 0 .114 1.884l5.633 1.878 1.878 5.633a1 1 0 0 0 1.884.114l6.208-17.882a1 1 0 0 0-.619-1.351z" fill="var(--accent)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.577 10.229l4.5 4.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
    document.body.appendChild(bird);

    let birdX, birdY, baseY, direction;
    let amplitude = 50;
    let time = 0;
    let isVanishing = false;

    function resetBird() {
        direction = Math.random() > 0.5 ? 1 : -1;
        baseY = window.innerHeight * (0.15 + Math.random() * 0.65);
        birdX = direction === 1 ? -100 : window.innerWidth + 100;
        birdY = baseY;
        bird.style.transition = 'transform 0.1s';
    }

    resetBird();

    function animateBird() {
        if (!isVanishing) {
            birdX += 2 * direction;
            time += 0.05;
            birdY = baseY + Math.sin(time) * amplitude;

            // Flap effect
            let scaleX = direction === 1 ? 1 : -1;
            let scaleY = Math.sin(time * 5) > 0 ? 0.8 : 1;

            bird.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
            bird.style.left = birdX + 'px';
            bird.style.top = birdY + 'px';

            if ((direction === 1 && birdX > window.innerWidth + 100) ||
                (direction === -1 && birdX < -100)) {
                resetBird();
            }
        }

        requestAnimationFrame(animateBird);
    }

    bird.addEventListener('click', (e) => {
        if (isVanishing) return;
        // Award 25 points
        awardPoints(25, e.clientX, e.clientY, { ignoreBonus: true });
        showToast('Caught the bird! +25 pts 🦅');
        beep('milestone');

        isVanishing = true;
        bird.style.transition = 'transform 0.5s';
        bird.style.transform = 'scale(0) rotate(360deg)';

        setTimeout(() => {
            isVanishing = false;
            resetBird();
        }, 500);
    });

    animateBird();
}

document.addEventListener('DOMContentLoaded', () => {
    // We will initialize the bird on the home view or globally
    initBird();
    // Wait for the UI to exist
    setTimeout(renderTasks, 500);
});
