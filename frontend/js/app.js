// ════════════════════════════════════════════════
// STATE MANAGEMENT
// ════════════════════════════════════════════════

const S = {
  token: localStorage.getItem('ll_token') || null,
  user: JSON.parse(localStorage.getItem('ll_user') || 'null'),
  courses: [],
  progress: {},
  openCourses: {},
  currentCourse: null,
  currentModule: null,
  editorValues: {},
};

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════

(async () => {
  if (S.token && S.user) {
    try {
      const me = await api('GET', '/auth/me');
      S.user = me;
      await enterApp();
    } catch {
      clearSession();
    }
  }
})();

// ════════════════════════════════════════════════
// APP ENTRY
// ════════════════════════════════════════════════

async function enterApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app-page').style.display = 'block';
  updateNavUser();
  I18N.updateUI();

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
    showToast('Welcome back, ' + S.user.name.split(' ')[0] + '! 👋', 'success');
  } catch (err) {
    console.error('Failed to load app:', err);
    showToast('Failed to load courses', 'error');
  }
}

// ════════════════════════════════════════════════
// SIDEBAR & NAVIGATION
// ════════════════════════════════════════════════

function buildSidebar() {
  const content = document.getElementById('sidebar-content');
  if (!content) return;
  
  content.innerHTML = '';
  
  S.courses.forEach(course => {
    const courseEl = document.createElement('div');
    
    const courseBtn = document.createElement('button');
    courseBtn.className = 'course-btn' + (S.openCourses[course.id] ? ' open' : '');
    courseBtn.innerHTML = `<span>${S.openCourses[course.id] ? '▾ ' : '▸ '}</span> ${escHtml(course.title)}`;
    courseBtn.onclick = () => toggleCourse(course.id);
    
    courseEl.appendChild(courseBtn);
    
    const modulesList = document.createElement('div');
    modulesList.className = 'sidebar-modules';
    modulesList.style.display = S.openCourses[course.id] ? 'block' : 'none';
    
    if (S.openCourses[course.id] && course.modules) {
      course.modules.forEach(mod => {
        const isDone = (S.progress[course.id] || new Set()).has(mod.id);
        const isActive = S.currentCourse === course.id && S.currentModule === mod.id;
        
        const moduleBtn = document.createElement('button');
        moduleBtn.className = 'module-btn' + (isActive ? ' active' : '') + (isDone ? ' completed' : '');
        moduleBtn.innerHTML = `${isDone ? '✓ ' : '○ '} ${escHtml(mod.title)}`;
        moduleBtn.onclick = () => loadModule(course.id, mod.id);
        
        modulesList.appendChild(moduleBtn);
      });
    }
    
    courseEl.appendChild(modulesList);
    content.appendChild(courseEl);
  });

  // Update language display
  const langBtn = document.getElementById('current-lang');
  if (langBtn) langBtn.textContent = I18N.currentLang.toUpperCase();
}

async function toggleCourse(courseId) {
  S.openCourses[courseId] = !S.openCourses[courseId];
  
  if (S.openCourses[courseId]) {
    const course = S.courses.find(c => c.id === courseId);
    if (!course.modules) {
      try {
        const full = await api('GET', '/courses/' + courseId);
        Object.assign(course, full);
      } catch (err) {
        showToast('Failed to load course modules', 'error');
      }
    }
  }
  
  buildSidebar();
}

// ════════════════════════════════════════════════
// MODULE LOADING & RENDERING
// ════════════════════════════════════════════════

async function loadModule(courseId, moduleId) {
  S.currentCourse = courseId;
  S.currentModule = moduleId;

  const mc = document.getElementById('module-content');
  mc.style.display = 'block';
  mc.innerHTML = `<div style="padding:3rem;color:var(--ink-muted);display:flex;gap:.75rem;align-items:center;"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Loading module…</div>`;

  try {
    const data = await api('GET', `/courses/${courseId}/modules/${moduleId}`);
    const course = data.course;
    const mod = data.module;

    renderModule(course, mod);
    buildSidebar();
    
    const problemsBtn = document.querySelector('[onclick*="showGraphPage"]');
    if (problemsBtn) {
      problemsBtn.onclick = showGraphPage;
    }
  } catch (err) {
    mc.innerHTML = `<div style="padding:3rem;color:var(--danger);"><strong>Error:</strong> ${escHtml(err.message)}</div>`;
  }
}

function renderModule(course, mod) {
  const isDone = (S.progress[course.id] || new Set()).has(mod.id);
  const savedCode = S.editorValues[mod.id] || `// ${mod.title} solution\n\n`;

  let html = `
    <div class="breadcrumb"><span>${escHtml(course.title)}</span><span style="opacity:.4">›</span><span>${escHtml(mod.title)}</span></div>
    <div class="content-title">${escHtml(mod.title)}</div>
    <div class="content-body">${escHtml(mod.description || '')}</div>
  `;

  if (mod.type === 'lesson') {
    html += `
      <div class="card">
        <div class="card-title">📖 Content</div>
        ${escHtml(mod.content || '')}
      </div>
    `;
  } else if (mod.type === 'challenge') {
    html += `
      <div class="challenge-section">
        <div class="challenge-header">
          <h3>Solve this challenge</h3>
          <button class="btn btn-outline btn-sm" onclick="showGraphPage()">View all problems</button>
        </div>
        ${createCodeEditor(savedCode).outerHTML}
        <button class="btn btn-primary" onclick="submitModuleSolution('${course.id}', '${mod.id}')">Submit Solution</button>
      </div>
    `;
  }

  if (isDone) {
    html = `<div style="padding: 1rem; background: var(--success-bg); border: 1px solid var(--success); border-radius: var(--radius); color: var(--success); margin-bottom: 1.5rem;">✓ You've completed this module</div>` + html;
  }

  document.getElementById('module-content').innerHTML = html;
}

async function submitModuleSolution(courseId, moduleId) {
  const code = getEditorValue();
  const language = getEditorLanguage();

  if (!code.trim()) {
    showToast('Please write some code', 'warning');
    return;
  }

  try {
    const result = await api('POST', '/code/execute', {
      code,
      language,
      moduleId,
      courseId,
    });

    if (result.success) {
      showToast('Solution accepted! 🎉', 'success');
      S.progress[courseId] = S.progress[courseId] || new Set();
      S.progress[courseId].add(moduleId);
      buildSidebar();
      loadModule(courseId, moduleId);
    } else {
      showToast(result.error || 'Solution incorrect', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════
// GRAPH PROBLEMS
// ════════════════════════════════════════════════

async function showGraphPage(difficulty = 'all') {
  // Update filter buttons UI
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
  });

  const mc = document.getElementById('module-content');
  mc.style.display = 'block';
  mc.innerHTML = `<div style="padding:3rem;color:var(--ink-muted);display:flex;gap:.75rem;align-items:center;"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Loading problems…</div>`;
  
  try {
    const response = await api('GET', '/graph/problems');
    let problems = response.problems || response.data || (Array.isArray(response) ? response : []);
    
    if (difficulty !== 'all') {
      problems = problems.filter(p => p.difficulty === difficulty);
    }
    
    displayProblems(problems);
  } catch (err) {
    mc.innerHTML = `<div style="padding:3rem;color:var(--danger);"><strong>Error loading problems:</strong> ${escHtml(err.message)}</div>`;
  }
}

async function loadGraphProblems() {
  await showGraphPage('all');
}

function displayProblems(problems) {
  const mc = document.getElementById('module-content');
  
  let html = `
    <div class="breadcrumb"><span data-i18n="side_graphs">Graph Algorithms</span></div>
    <div class="content-title" data-i18n="graph_title">Graph Algorithm Problems</div>
    <div class="content-body">
      <p data-i18n="graph_subtitle">Solve graph algorithm challenges. Each problem has multiple test cases with time and memory limits.</p>
    </div>
    <div class="problems-list">`;
  
  if (problems.length === 0) {
    html += `<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--ink-muted);">No problems found for this difficulty.</div>`;
  }

  problems.forEach(p => {
    html += `
      <div class="problem-card" onclick="selectProblem('${p.id}')">
        <div class="problem-header">
          <h3>${escHtml(p.title)}</h3>
          <span class="problem-badge difficulty-${p.difficulty.toLowerCase()}">${p.difficulty}</span>
        </div>
        <p class="problem-desc">${escHtml(p.description.substring(0, 100))}…</p>
        <div class="problem-meta">
          <span>⏱️ ${p.timeLimit}ms</span>
          <span>💾 ${p.memoryLimit}MB</span>
          <span>🧪 ${p.testCaseCount || 0} tests</span>
        </div>
      </div>`;
  });
  
  html += `</div>`;
  mc.innerHTML = html;
  I18N.updateUI();
}

async function selectProblem(problemId) {
  const mc = document.getElementById('module-content');
  mc.innerHTML = `<div style="padding:3rem;color:var(--ink-muted);display:flex;gap:.75rem;align-items:center;"><span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> <span data-i18n="common_loading">Loading...</span></div>`;
  I18N.updateUI();
  
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
  const savedCode = S.editorValues[editorKey] || `// Write  ${problem.title} solution here\n\n`;
  
  let html = `
    <div class="problem-detail-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 2rem;">
      <div class="breadcrumb-container">
        <div class="breadcrumb" style="margin-bottom:0.5rem;"><span data-i18n="side_graphs">Graph Algorithms</span><span style="opacity:.4">›</span><span>${escHtml(problem.title)}</span></div>
        <div class="content-title" style="margin:0;">${escHtml(problem.title)}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="showGraphPage()" data-i18n="graph_back">← Back to Problems</button>
    </div>
    
    <div class="content-body"><p>${escHtml(problem.description)}</p></div>
    
    <div class="challenge-section">
      <div class="challenge-header">
        <div style="flex:1;">
          <span style="color:var(--ink-muted);font-size:0.85rem;">⏱️ ${problem.timeLimit}ms • 💾 ${problem.memoryLimit}MB</span>
        </div>
        <div class="problem-badge difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</div>
      </div>
      ${createCodeEditor(savedCode).outerHTML}
      <div class="editor-actions">
        <button class="btn btn-primary" onclick="submitGraphSolution('${problem.id}')">
          <span data-i18n="graph_run_tests">Run Tests</span>
        </button>
      </div>
    </div>
  `;
  
  mc.innerHTML = html;
  I18N.updateUI();
}

async function submitGraphSolution(problemId) {
  const code = getEditorValue();
  const language = getEditorLanguage();

  if (!code.trim()) {
    showToast(I18N.t('common_enter_code'), 'warning');
    return;
  }

  const btn = event?.currentTarget || document.querySelector('[onclick*="submitGraphSolution"]');
  const originalText = btn.innerHTML;
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px;"></span> <span data-i18n="graph_running">${I18N.t('graph_running')}</span>`;
  }

  try {
    const result = await api('POST', '/graph/submit', {
      code,
      language,
      problemId,
      courseId: S.currentCourse || 'graph',
      moduleId: S.currentModule || 'problems',
    });

    displayResults(result);
    
    if (result.success) {
      showToast(I18N.t('graph_all_passed'), 'success');
    } else {
      showToast(`${result.testsFailed} ${I18N.t('graph_failed')}`, 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
      I18N.updateUI();
    }
  }
}

function displayResults(result) {
  const mc = document.getElementById('module-content');
  let existingResults = mc.querySelector('[id="test-results"]');
  
  if (!existingResults) {
    const div = document.createElement('div');
    div.id = 'test-results';
    div.className = 'test-results-container';
    mc.appendChild(div);
    existingResults = div;
  }

  const passedCount = result.testsPassed || 0;
  const totalCount = result.totalTests || 0;
  const percent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  let html = `
    <div class="results-header">
      <h3 data-i18n="graph_test_results">Test Results</h3>
      <div class="results-summary ${result.success ? 'success' : 'failed'}">
        ${passedCount} / ${totalCount} Passed
      </div>
    </div>

    <div class="results-progress-bar">
      <div class="results-progress-fill ${result.success ? 'success' : 'failed'}" style="width: ${percent}%"></div>
    </div>
  `;

  if (result.results) {
    html += `<div class="test-cases-grid">`;
    result.results.forEach((test, idx) => {
      const passed = test.status === 'passed';
      html += `
        <div class="test-case-card ${passed ? 'passed' : 'failed'}">
          <div class="test-case-header">
            <span class="test-status-icon">${passed ? '✓' : '✗'}</span>
            <span class="test-name">Test Case ${idx + 1}</span>
            <span class="test-time">${test.executionTime ? formatTime(test.executionTime) : ''}</span>
          </div>
          ${!passed && test.error ? `
            <div class="test-error-msg">
              <strong>Error:</strong> ${escHtml(test.error)}
            </div>
          ` : ''}
          ${!passed && (test.expected || test.actual) ? `
            <div class="test-diff">
              <div class="diff-item">
                <span class="diff-label">Expected:</span>
                <pre class="diff-value">${escHtml(test.expected || '')}</pre>
              </div>
              <div class="diff-item">
                <span class="diff-label">Actual:</span>
                <pre class="diff-value">${escHtml(test.actual || '')}</pre>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });
    html += `</div>`;
  }

  existingResults.innerHTML = html;
  I18N.updateUI();
  
  // Scroll to results
  existingResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ════════════════════════════════════════════════
// ACCOUNT PAGE
// ════════════════════════════════════════════════

async function loadAccountPage() {
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileJoined = document.getElementById('profile-joined');
  const progressStats = document.getElementById('progress-stats');

  if (S.user) {
    profileName.textContent = S.user.name;
    profileEmail.textContent = S.user.email;
    
    // Format the joined date
    if (S.user.created_at) {
      const joinDate = new Date(S.user.created_at);
      profileJoined.textContent = joinDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  // Build module progress section
  let progressHtml = '';
  let totalCompleted = 0;
  let totalModules = 0;

  S.courses.forEach(course => {
    const completed = (S.progress[course.id] || new Set()).size;
    const total = course.modules ? course.modules.length : 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    totalCompleted += completed;
    totalModules += total;

    progressHtml += `
      <div class="progress-row">
        <div class="progress-label">
          <span>${escHtml(course.title)}</span>
          <span>${completed}/${total}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  });

  const totalPercentage = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
  
  // Build graph problems progress section
  let graphProgressHtml = '';
  try {
    const graphData = await api('GET', '/progress/graph-problems');
    
    const solvedByDiff = graphData.solvedByDifficulty || {};
    const totalSolved = graphData.totalSolved || 0;
    const solvedProblems = graphData.solvedProblems || [];
    
    // Difficulty stats
    const easy = solvedByDiff.easy || 0;
    const medium = solvedByDiff.medium || 0;
    const hard = solvedByDiff.hard || 0;
    
    graphProgressHtml += `
      <div style="margin-bottom: 1.5rem;">
        <div style="margin-bottom: 1rem;">
          <h3 style="margin: 0 0 1rem 0; color: var(--ink); font-size: .95rem;">Problem Solving by Difficulty</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 4px solid #4ade80;">
              <div style="font-size: .85rem; color: var(--ink-muted); margin-bottom: .5rem;">Easy</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #4ade80;">${easy}</div>
            </div>
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 4px solid #f59e0b;">
              <div style="font-size: .85rem; color: var(--ink-muted); margin-bottom: .5rem;">Medium</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${medium}</div>
            </div>
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 4px solid #ef4444;">
              <div style="font-size: .85rem; color: var(--ink-muted); margin-bottom: .5rem;">Hard</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${hard}</div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size: .85rem; color: var(--ink-muted); margin-bottom: .5rem;">Overall Problems Solved</div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="flex: 1;">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${totalSolved > 0 ? 100 : 0}%; background: linear-gradient(90deg, #4ade80, #f59e0b, #ef4444);"></div>
              </div>
            </div>
            <div style="font-weight: 700; color: var(--ink);">${totalSolved}</div>
          </div>
        </div>
      </div>
    `;
    
    // Show solved problems list
    if (solvedProblems.length > 0) {
      graphProgressHtml += `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
          <h3 style="margin: 0 0 1rem 0; color: var(--ink); font-size: .95rem;">🏆 Solved Problems</h3>
          <div style="display: flex; flex-direction: column; gap: .75rem;">
      `;
      
      solvedProblems.forEach(problem => {
        const diffColor = problem.difficulty === 'easy' ? '#4ade80' : 
                          problem.difficulty === 'medium' ? '#f59e0b' : '#ef4444';
        const diffBg = problem.difficulty === 'easy' ? '#dcfce7' : 
                       problem.difficulty === 'medium' ? '#fef3c7' : '#fee2e2';
        const solvedDate = new Date(problem.submitted_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        graphProgressHtml += `
          <div style="padding: .75rem; background: var(--bg-secondary); border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div style="font-weight: 500; color: var(--ink); margin-bottom: .25rem;">${escHtml(problem.problem_title)}</div>
              <div style="font-size: .8rem; color: var(--ink-muted);">✓ All tests passed (${problem.tests_passed}/${problem.total_tests})</div>
            </div>
            <div style="display: flex; gap: .5rem; align-items: center;">
              <span style="padding: .25rem .75rem; background: ${diffBg}; color: ${diffColor}; border-radius: 4px; font-size: .75rem; font-weight: 600; text-transform: capitalize;">${problem.difficulty}</span>
              <span style="font-size: .8rem; color: var(--ink-muted);">${solvedDate}</span>
            </div>
          </div>
        `;
      });
      
      graphProgressHtml += `
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Failed to load graph progress:', err);
  }
  
  progressStats.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div class="progress-label">
        <strong>Overall Course Progress</strong>
        <strong>${totalPercentage}%</strong>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${totalPercentage}%"></div>
      </div>
    </div>
    ${progressHtml}
    ${graphProgressHtml}
  `;
}
