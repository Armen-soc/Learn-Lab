// ════════════════════════════════════════════════
// AUTHENTICATION FUNCTIONS
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
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  
  try {
    const { token, user } = await api('POST', '/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-pass').value,
    });
    saveSession(token, user);
    await enterApp();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in →';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  
  try {
    const { token, user } = await api('POST', '/auth/register', {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-pass').value,
    });
    saveSession(token, user);
    await enterApp();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create account →';
  }
}

function saveSession(token, user) {
  S.token = token;
  S.user = user;
  localStorage.setItem('ll_token', token);
  localStorage.setItem('ll_user', JSON.stringify(user));
}

function clearSession() {
  S.token = null;
  S.user = null;
  localStorage.removeItem('ll_token');
  localStorage.removeItem('ll_user');
}

function logout() {
  clearSession();
  S.courses = [];
  S.progress = {};
  S.openCourses = {};
  S.currentCourse = null;
  S.currentModule = null;
  
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('app-page').style.display = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
}
