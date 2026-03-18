// ════════════════════════════════════════════════
// UI UTILITIES & HELPERS
// ════════════════════════════════════════════════

/**
 * Escape HTML special characters
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Show notification toast
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/**
 * Update navigation user display
 */
function updateNavUser() {
  const avatar = document.getElementById('nav-avatar');
  const nameEl = document.getElementById('nav-name');
  
  if (S.user) {
    const initials = S.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    avatar.textContent = initials;
    nameEl.textContent = S.user.name.split(' ')[0];
  }
}

/**
 * Format bytes to readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format time in milliseconds
 */
function formatTime(ms) {
  if (ms < 1000) return Math.round(ms) + 'ms';
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch (err) {
    showToast('Failed to copy', 'error');
  }
}

/**
 * Get percentage of completion
 */
function getCompletionPercentage(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Show page
 */
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Hide all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Show selected page
  const page = document.getElementById(pageName + '-page');
  if (page) {
    page.classList.add('active');
  }
  
  // Mark nav link as active
  event?.target?.classList.add('active');
  
  // Load page-specific data
  if (pageName === 'account') {
    loadAccountPage();
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

/**
 * Create code editor with language selection
 */
function createCodeEditor(value, language = 'javascript') {
  const container = document.createElement('div');
  container.className = 'editor-container';
  
  container.innerHTML = `
    <div class="editor-header">
      <div class="editor-language">
        <button class="editor-lang-btn ${language === 'javascript' ? 'active' : ''}" 
                onclick="switchEditorLanguage(this, 'javascript', event)" 
                data-editor>
          JavaScript
        </button>
        <button class="editor-lang-btn ${language === 'python' ? 'active' : ''}" 
                onclick="switchEditorLanguage(this, 'python', event)" 
                data-editor>
          Python
        </button>
        <button class="editor-lang-btn ${language === 'cpp' ? 'active' : ''}" 
                onclick="switchEditorLanguage(this, 'cpp', event)" 
                data-editor>
          C++
        </button>
      </div>
    </div>
    <textarea id="code-editor" data-language="${language}">${escHtml(value)}</textarea>
  `;
  
  return container;
}

/**
 * Switch code editor language
 */
function switchEditorLanguage(btn, lang, event) {
  event?.preventDefault?.();
  
  const editors = btn.parentElement.querySelectorAll('button');
  editors.forEach(e => e.classList.remove('active'));
  btn.classList.add('active');
  
  const editor = document.getElementById('code-editor');
  if (editor) {
    editor.dataset.language = lang;
  }
}

/**
 * Get current code editor value
 */
function getEditorValue() {
  const editor = document.getElementById('code-editor');
  return editor ? editor.value : '';
}

/**
 * Set code editor value
 */
function setEditorValue(value) {
  const editor = document.getElementById('code-editor');
  if (editor) {
    editor.value = value;
  }
}

/**
 * Get selected code editor language
 */
function getEditorLanguage() {
  const editor = document.getElementById('code-editor');
  return editor ? editor.dataset.language || 'javascript' : 'javascript';
}
