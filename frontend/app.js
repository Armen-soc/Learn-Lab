// ════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════
const API = 'http://localhost:4000/api';

// ════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════
const S = {
  token: localStorage.getItem('ll_token') || null,
  user:  JSON.parse(localStorage.getItem('ll_user') || 'null'),
  courses: [],
  progress: {},
  openCourses: {},
  currentCourse: null,
  currentModule: null,
  editorValues: {},
};

// ════════════════════════════════════════════════
// API HELPERS
// ════════════════════════════════════════════════
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (S.token) opts.headers['Authorization'] = 'Bearer ' + S.token;
  if (body)    opts.body = JSON.stringify(body);

  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════
(async () => {
  if (S.token && S.user) {
    try {
      const me = await api('GET', '/auth/me');
      S.user = me;
      await enterApp();
    } catch { clearSession(); }
  }
})();

// ════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').classList.toggle('visible', tab === 'login');
  document.getElementById('register-form').classList.toggle('visible', tab === 'register');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const { token, user } = await api('POST', '/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-pass').value,
    });
    saveSession(token, user);
    await enterApp();
  } catch (err) {
    showToast(err.message, 'red');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign in →';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    const { token, user } = await api('POST', '/auth/register', {
      name:     document.getElementById('reg-name').value,
      email:    document.getElementById('reg-email').value,
      password: document.getElementById('reg-pass').value,
    });
    saveSession(token, user);
    await enterApp();
  } catch (err) {
    showToast(err.message, 'red');
  } finally {
    btn.disabled = false; btn.textContent = 'Create account →';
  }
}

function saveSession(token, user) {
  S.token = token; S.user = user;
  localStorage.setItem('ll_token', token);
  localStorage.setItem('ll_user', JSON.stringify(user));
}

function clearSession() {
  S.token = null; S.user = null;
  localStorage.removeItem('ll_token');
  localStorage.removeItem('ll_user');
}

function logout() {
  clearSession();
  S.courses = []; S.progress = {}; S.openCourses = {};
  S.currentCourse = null; S.currentModule = null;
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('app-page').style.display  = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
}

// ════════════════════════════════════════════════
// APP ENTRY
// ════════════════════════════════════════════════
async function enterApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app-page').style.display  = 'block';
  updateNavUser();

  try {
    const [courses, progress] = await Promise.all([
      api('GET', '/courses'),
      api('GET', '/progress'),
    ]);

    S.courses = courses;
    S.progress = {};
    for (const row of progress) {
      if (row.completed) {
        if (!S.progress[row.course_id]) S.progress[row.course_id] = new Set();
        S.progress[row.course_id].add(row.module_id);
      }
    }
    buildSidebar();
    showToast('Welcome back, ' + S.user.name.split(' ')[0] + '! 👋', 'green');
  } catch (err) {
    console.error('Failed to load app:', err);
  }
}

function updateNavUser() {
  if (!S.user) return;
  const initials = S.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name-nav').textContent = S.user.name.split(' ')[0];
}

// ════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════
function showPage(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (page === 'account') loadAccountPage();
}

// ════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════
function buildSidebar() {
  const list = document.getElementById('course-list');
  list.innerHTML = '';
  S.courses.forEach(course => {
    const wrap = document.createElement('div');
    const cBtn = document.createElement('button');
    cBtn.className = 'course-btn' + (S.openCourses[course.id] ? ' open' : '');
    cBtn.textContent = (S.openCourses[course.id] ? '▾ ' : '▸ ') + course.title;
    cBtn.onclick = () => toggleCourse(course.id);
    wrap.appendChild(cBtn);

    const mList = document.createElement('div');
    mList.id = 'mlist-' + course.id;
    mList.style.display = S.openCourses[course.id] ? 'block' : 'none';

    if (S.openCourses[course.id] && course.modules) {
      course.modules.forEach(mod => {
        mList.appendChild(buildModuleBtn(course, mod));
      });
    }
    wrap.appendChild(mList);
    list.appendChild(wrap);
  });
}

function buildModuleBtn(course, mod) {
  const isDone   = (S.progress[course.id] || new Set()).has(mod.id);
  const isActive = S.currentCourse === course.id && S.currentModule === mod.id;
  const b = document.createElement('button');
  b.className = 'module-btn' + (isActive ? ' active' : '') + (isDone ? ' done' : '');
  b.innerHTML = `<span class="module-dot"></span>${mod.title}`;
  b.onclick = () => loadModule(course.id, mod.id);
  return b;
}

async function toggleCourse(courseId) {
  S.openCourses[courseId] = !S.openCourses[courseId];
  if (S.openCourses[courseId]) {
    const existing = S.courses.find(c => c.id === courseId);
    if (!existing.modules) {
      try {
        const full = await api('GET', '/courses/' + courseId);
        Object.assign(existing, full);
      } catch (err) { showToast('Failed to load course', 'red'); }
    }
  }
  buildSidebar();
}

// ════════════════════════════════════════════════
// MODULE CONTENT
// ════════════════════════════════════════════════
async function loadModule(courseId, moduleId) {
  S.currentCourse = courseId;
  S.currentModule = moduleId;

  document.getElementById('welcome-screen').style.display = 'none';
  const mc = document.getElementById('module-content');
  mc.style.display = 'block';
  mc.innerHTML = `<div style="padding:3rem;color:var(--ink-muted);display:flex;gap:.75rem;align-items:center;"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Loading module…</div>`;

  try {
    const data = await api('GET', `/courses/${courseId}/modules/${moduleId}`);
    const course = data.course;
    const mod = data.module;

    const courseObj = S.courses.find(c => c.id === courseId);
    if (courseObj && !courseObj.modules) {
      const full = await api('GET', '/courses/' + courseId).catch(() => null);
      if (full) Object.assign(courseObj, full);
    }
    let prevMod = null, nextMod = null;
    if (courseObj && courseObj.modules) {
      const modIndex = courseObj.modules.findIndex(m => m.id === moduleId);
      prevMod = courseObj.modules[modIndex - 1];
      nextMod = courseObj.modules[modIndex + 1];
    }
    renderModule(course, mod, prevMod, nextMod);
    buildSidebar();
  } catch (err) {
    showToast('Failed to load module: ' + err.message, 'red');
  }
}

function renderModule(course, mod, prevMod, nextMod) {
  const mc = document.getElementById('module-content');
  const editorKey = course.id + '-' + mod.id;
  const savedCode = S.editorValues[editorKey] || mod.challenge.starterCode;
  const lang = mod.challenge.language || 'python';

  mc.innerHTML = `
    <div class="breadcrumb"><span>${escHtml(course.title)}</span><span style="opacity:.4">›</span><span>${escHtml(mod.title)}</span></div>
    <div class="content-title">${escHtml(mod.title)}</div>
    <div class="content-body" id="content-body"></div>

    <div class="challenge-section">
      <div class="challenge-header">
        <div class="challenge-icon">⌨️</div>
        <div><div class="challenge-title">Coding Challenge</div><div class="challenge-sub">Write and run your solution below</div></div>
      </div>

      <div class="instructions-box">${escHtml(mod.challenge.instructions)}</div>
      <div class="lang-selector">Language: <span class="lang-badge">${lang}</span></div>

      <div class="code-editor-wrap">
        <div class="editor-toolbar">
          <div class="editor-dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
          <div class="editor-lang">${lang}</div>
        </div>
        <textarea class="code-textarea" id="code-editor" spellcheck="false">${escHtml(savedCode)}</textarea>
        <div class="run-bar">
          <div class="run-hint">Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run</div>
          <button class="btn-run" id="run-btn" onclick="runCode('${escHtml(course.id)}','${escHtml(mod.id)}','${lang}')">▶ Run Code</button>
        </div>
      </div>

      <div id="output-area"></div>
      <div class="expected-box"><strong>Expected output:</strong> ${escHtml(mod.challenge.expectedOutput)}</div>
    </div>

    <div class="module-nav">
      ${prevMod ? `<button class="btn btn-outline" onclick="loadModule('${escHtml(course.id)}','${escHtml(prevMod.id)}')">← ${escHtml(prevMod.title)}</button>` : '<div></div>'}
      ${nextMod
        ? `<button class="btn btn-primary" style="width:auto;" onclick="loadModule('${escHtml(course.id)}','${escHtml(nextMod.id)}')">Next: ${escHtml(nextMod.title)} →</button>`
        : `<button class="btn btn-primary" style="width:auto;" onclick="markComplete('${escHtml(course.id)}','${escHtml(mod.id)}')">✓ Mark Complete</button>`}
    </div>`;

  renderContent(mod.content);

  const editor = document.getElementById('code-editor');
  editor.addEventListener('input', () => { S.editorValues[editorKey] = editor.value; });
  editor.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(course.id, mod.id, lang); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
    }
  });
}

// ════════════════════════════════════════════════
// CODE EXECUTION
// ════════════════════════════════════════════════
async function runCode(courseId, moduleId, language) {
  const code = document.getElementById('code-editor').value;
  const btn  = document.getElementById('run-btn');
  const out  = document.getElementById('output-area');

  if (!code.trim()) { showToast('Write some code first!', ''); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Running…';

  out.innerHTML = `
    <div class="output-box">
      <div class="output-header running"><span class="spinner"></span> Saving your submission…</div>
      <div class="output-body">Sending code to server…</div>
    </div>`;

  try {
    const result = await api('POST', '/execute', { code, language, courseId, moduleId });

    if (result.pending) {
      out.innerHTML = `
        <div class="output-box">
          <div class="output-header idle">💾 Submission #${result.submissionId} saved</div>
          <div class="output-body" style="color:#a0c4ff;">Your code has been saved to the database.</div>
        </div>`;
      showToast('Code saved ✓', 'green');
      markComplete(courseId, moduleId);
    } else {
      const isError = result.exitCode !== 0;
      const label   = isError ? `✕ Exited with code ${result.exitCode}` : `✓ Executed in ${result.runtime_ms}ms`;
      let bodyHtml  = '';
      if (result.stdout) bodyHtml += escHtml(result.stdout);
      if (result.stderr) bodyHtml += (bodyHtml ? '\n' : '') + `<span style="color:#f47a7a;">${escHtml(result.stderr)}</span>`;
      if (!bodyHtml)     bodyHtml  = '<span style="opacity:.5">(no output)</span>';
      out.innerHTML = `
        <div class="output-box">
          <div class="output-header ${isError ? 'error' : 'success'}">${label}</div>
          <div class="output-body">${bodyHtml}</div>
        </div>`;
      if (!isError) markComplete(courseId, moduleId);
    }
  } catch (err) {
    out.innerHTML = `
      <div class="output-box">
        <div class="output-header error">✕ Error</div>
        <div class="output-body error-text">${escHtml(err.message)}</div>
      </div>`;
    showToast('Submission failed: ' + err.message, 'red');
  }

  btn.disabled = false;
  btn.innerHTML = '▶ Run Code';
}

// ════════════════════════════════════════════════
// PROGRESS
// ════════════════════════════════════════════════
async function markComplete(courseId, moduleId) {
  try {
    await api('POST', `/progress/${courseId}/${moduleId}/complete`);
    if (!S.progress[courseId]) S.progress[courseId] = new Set();
    S.progress[courseId].add(moduleId);
    buildSidebar();
  } catch (err) { console.error('markComplete failed:', err.message); }
}

// ════════════════════════════════════════════════
// ACCOUNT PAGE
// ════════════════════════════════════════════════
async function loadAccountPage() {
  if (!S.user) return;
  document.getElementById('profile-name').value  = S.user.name  || '';
  document.getElementById('profile-email').value = S.user.email || '';
  document.getElementById('stat-since').textContent = S.user.created_at
    ? new Date(S.user.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long' })
    : '—';

  try {
    const stats = await api('GET', '/progress/stats');
    document.getElementById('stat-completed').textContent   = stats.modulesCompleted;
    document.getElementById('stat-submissions').textContent = stats.totalSubmissions;
  } catch {}

  const list = document.getElementById('progress-list');
  list.innerHTML = '';
  for (const course of S.courses) {
    let modules = course.modules;
    if (!modules) {
      try { const full = await api('GET', '/courses/' + course.id); modules = full.modules; Object.assign(course, full); }
      catch { modules = []; }
    }
    const done  = (S.progress[course.id] || new Set()).size;
    const total = modules.length;
    const pct   = total ? Math.round(done / total * 100) : 0;
    list.innerHTML += `
      <div class="progress-row">
        <div class="progress-label"><span>${escHtml(course.title)}</span><span>${done}/${total} modules</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }
  if (!S.courses.length) list.innerHTML = '<div style="color:var(--ink-muted);font-size:.88rem;">No courses found.</div>';
}

async function saveProfile() {
  try {
    const updated = await api('PATCH', '/auth/me', {
      name:  document.getElementById('profile-name').value,
      email: document.getElementById('profile-email').value,
    });
    S.user = { ...S.user, ...updated };
    localStorage.setItem('ll_user', JSON.stringify(S.user));
    updateNavUser();
    showToast('Profile saved ✓', 'green');
  } catch (err) { showToast(err.message, 'red'); }
}

async function changePassword() {
  const cur = document.getElementById('cur-pass').value;
  const nw  = document.getElementById('new-pass').value;
  if (!cur || !nw) { showToast('Please fill both fields.', 'red'); return; }
  try {
    await api('POST', '/auth/change-password', { currentPassword: cur, newPassword: nw });
    document.getElementById('cur-pass').value = '';
    document.getElementById('new-pass').value = '';
    showToast('Password updated ✓', 'green');
  } catch (err) { showToast(err.message, 'red'); }
}

// ════════════════════════════════════════════════
// CONTENT RENDERER
// ════════════════════════════════════════════════
function renderContent(text) {
  const el = document.getElementById('content-body');
  let html = escHtml(text);
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/((?:^- .+\n?)+)/gm, m => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  html = '<p>' + html.replace(/\n\n(?![<])/g, '</p><p>') + '</p>';
  html = html.replace(/<p>(<(?:pre|ul))/g, '$1').replace(/(<\/(?:pre|ul)>)<\/p>/g, '$1');
  el.innerHTML = html;
}

// ════════════════════════════════════════════════
// GRAPH PROBLEMS
// ════════════════════════════════════════════════
async function showGraphPage() {
  document.getElementById('welcome-screen').style.display = 'none';
  const mc = document.getElementById('module-content');
  mc.style.display = 'block';
  mc.innerHTML = `<div style="padding:3rem;color:var(--ink-muted);display:flex;gap:.75rem;align-items:center;"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Loading problems…</div>`;
  
  try {
    await loadGraphProblems();
  } catch (err) {
    mc.innerHTML = `<div style="padding:3rem;color:var(--danger);"><strong>Error loading problems:</strong> ${escHtml(err.message)}</div>`;
  }
}

async function loadGraphProblems() {
  const response = await api('GET', '/graph/problems');
  const problems = response.problems || response.data || (Array.isArray(response) ? response : []);
  displayProblems(problems);
}

function displayProblems(problems) {
  const mc = document.getElementById('module-content');
  
  let html = `
    <div class="breadcrumb"><span>Graph Algorithms</span></div>
    <div class="content-title">Graph Algorithm Problems</div>
    <div class="content-body">
      <p>Solve graph algorithm challenges. Each problem has multiple test cases with time and memory limits.</p>
    </div>
    <div class="problems-list">`;
  
  problems.forEach(p => {
    html += `
      <div class="problem-card" onclick="selectProblem('${p.id}')">
        <div class="problem-header">
          <h3>${escHtml(p.title)}</h3>
          <span class="problem-badge difficulty-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        </div>
        <p class="problem-desc">${escHtml(p.description.substring(0, 100))}…</p>
        <div class="problem-meta">
          <span>⏱️ Time: ${p.timeLimit}s</span>
          <span>💾 Memory: ${p.memoryLimit}MB</span>
          <span>🧪 ${p.testCases ? p.testCases.length : 0} test cases</span>
        </div>
      </div>`;
  });
  
  html += `</div>`;
  mc.innerHTML = html;
}

async function selectProblem(problemId) {
  const mc = document.getElementById('module-content');
  mc.innerHTML = `<div style="padding:3rem;color:var(--ink-muted);display:flex;gap:.75rem;align-items:center;"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Loading problem…</div>`;
  
  try {
    const response = await api('GET', `/graph/problems/${problemId}`);
    const problem = response.problem || response;
    displayProblemDetail(problem);
  } catch (err) {
    mc.innerHTML = `<div style="padding:3rem;color:var(--danger);"><strong>Error:</strong> ${escHtml(err.message)}</div>`;
  }
}

function displayProblemDetail(problem) {
  const mc = document.getElementById('module-content');
  const editorKey = 'graph-' + problem.id;
  const savedCode = S.editorValues[editorKey] || `// Write  ${problem.title} solution here\n// Language: JavaScript or Python\n\n`;
  
  let html = `
    <div class="breadcrumb"><span>Graph Algorithms</span><span style="opacity:.4">›</span><span>${escHtml(problem.title)}</span></div>
    <div class="content-title">${escHtml(problem.title)}</div>
    <div class="content-body"><p>${escHtml(problem.description)}</p></div>
    
    <div class="challenge-section">
      <div class="challenge-header">
        <div class="challenge-icon">🔀</div>
        <div>
          <div class="challenge-title">Algorithm Challenge</div>
          <div class="challenge-sub">Implement the solution and pass all test cases</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0;">
        <div style="padding:1rem;background:var(--bg);border-radius:8px;">
          <strong>⏱️ Time Limit:</strong> ${problem.timeLimit}s
        </div>
        <div style="padding:1rem;background:var(--bg);border-radius:8px;">
          <strong>💾 Memory Limit:</strong> ${problem.memoryLimit}MB
        </div>
      </div>
      
      <div class="instructions-box" style="white-space:pre-wrap;font-family:var(--font-mono);">${escHtml(problem.fullDescription || problem.description)}</div>
      
      <div style="margin-top:1.5rem;">
        <strong>Sample Test Cases:</strong>
        <div class="test-cases" style="margin-top:0.5rem;">`;
  
  (problem.testCases || []).slice(0, 2).forEach((tc, i) => {
    html += `
          <details style="margin-bottom:0.75rem;padding:0.75rem;background:var(--bg);border-radius:6px;">
            <summary style="cursor:pointer;font-weight:500;">Test Case ${i + 1}: ${escHtml(tc.description)}</summary>
            <div style="margin-top:0.5rem;font-size:0.85rem;font-family:var(--font-mono);white-space:pre-wrap;color:var(--ink-muted);">
Input: ${escHtml(typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input, null, 2))}
Expected: ${escHtml(typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected, null, 2))}
            </div>
          </details>`;
  });
  
  html += `
        </div>
      </div>
      
      <div class="code-editor-wrap" style="margin-top:1.5rem;">
        <div class="editor-toolbar">
          <div class="editor-dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
          <div class="editor-lang">JavaScript / Python</div>
        </div>
        <textarea class="code-textarea" id="code-editor" spellcheck="false">${escHtml(savedCode)}</textarea>
        <div class="run-bar">
          <div class="run-hint">Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to submit</div>
          <button class="btn-run" id="run-btn" onclick="submitGraphSolution(${problem.id})">▶ Submit Solution</button>
        </div>
      </div>
      
      <div id="output-area"></div>
    </div>
    
    <div class="module-nav">
      <button class="btn btn-outline" onclick="showGraphPage()">← Back to Problems</button>
    </div>`;
  
  mc.innerHTML = html;
  
  const editor = document.getElementById('code-editor');
  editor.addEventListener('input', () => { S.editorValues[editorKey] = editor.value; });
  editor.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submitGraphSolution(problem.id); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
    }
  });
}

async function submitGraphSolution(problemId) {
  const code = document.getElementById('code-editor').value;
  const btn  = document.getElementById('run-btn');
  const out  = document.getElementById('output-area');
  
  if (!code.trim()) { showToast('Write some code first!', 'red'); return; }
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Running tests…';
  
  out.innerHTML = `
    <div class="output-box">
      <div class="output-header running"><span class="spinner"></span> Executing your code…</div>
    </div>`;
  
  try {
    const language = (code.includes('function') || code.includes('const ') || code.includes('let ')) ? 'javascript' : 'python';
    
    const result = await api('POST', '/graph/submit', {
      problemId,
      code,
      language,
      courseId: 'graph-course',
      moduleId: 'graph-module'
    });
    
    displayTestResults(result);
    showToast(result.status === 'success' ? '✓ All tests passed!' : `${result.testsPassed}/${result.totalTests} tests passed`, 
              result.status === 'success' ? 'green' : 'orange');
  } catch (err) {
    out.innerHTML = `
      <div class="output-box">
        <div class="output-header error">✕ Error</div>
        <div class="output-body error-text">${escHtml(err.message)}</div>
      </div>`;
    showToast('Submission failed: ' + err.message, 'red');
  }
  
  btn.disabled = false;
  btn.innerHTML = '▶ Submit Solution';
}

function displayTestResults(result) {
  const out = document.getElementById('output-area');
  
  const passed = result.testsPassed || 0;
  const total = result.totalTests || 0;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  const allPass = result.status === 'success';
  
  let html = `
    <div class="output-box">
      <div class="output-header ${allPass ? 'success' : pct > 50 ? 'warning' : 'error'}">
        ${allPass ? '✓ All tests passed!' : `${passed}/${total} tests passed (${pct}%)`}
      </div>
      
      <div class="stats-bar">
        <div class="stat-box">
          <div class="stat-label">Tests Passed</div>
          <div class="stat-value">${passed}/${total}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Success Rate</div>
          <div class="stat-value">${pct}%</div>
        </div>
      </div>
      
      <div style="margin-top:1rem;">
        <strong>Test Details:</strong>
        <div class="test-results">`;
  
  (result.testDetails || []).forEach((tr, i) => {
    const status = tr.passed ? '✓' : '✗';
    const statusClass = tr.passed ? 'success' : 'error';
    html += `
          <details style="margin-bottom:0.75rem;padding:0.75rem;border-left:3px solid ${tr.passed ? '#66c61e' : '#f47a7a'};background:var(--bg);border-radius:4px;cursor:pointer;">
            <summary><span class="test-badge ${statusClass}">${status}</span> Test ${i + 1}: ${escHtml(tr.description || 'Test case')}</summary>
            <div style="margin-top:0.75rem;font-family:var(--font-mono);font-size:0.85rem;white-space:pre-wrap;">
              ${tr.output !== undefined ? `<div><strong>Output:</strong><div style="color:var(--ink-muted);">${escHtml(JSON.stringify(tr.output, null, 2))}</div></div>` : ''}
              ${tr.expected !== undefined ? `<div><strong>Expected:</strong><div style="color:var(--ink-muted);">${escHtml(JSON.stringify(tr.expected, null, 2))}</div></div>` : ''}
              ${tr.error ? `<div style="color:#f47a7a;"><strong>Error:</strong> ${escHtml(tr.error)}</div>` : ''}
            </div>
          </details>`;
  });
  
  html += `
        </div>
      </div>
      
      ${result.submissionId ? `<div style="margin-top:1rem;font-size:0.85rem;color:var(--ink-muted);">Submission ID: ${result.submissionId}</div>` : ''}
    </div>`;
  
  out.innerHTML = html;
}

// ════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let _toastTimer;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}
