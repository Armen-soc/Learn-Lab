// ════════════════════════════════════════════════
// API CONFIGURATION & HELPERS
// ════════════════════════════════════════════════

const API = 'http://localhost:4000/api';

/**
 * Make API requests with auth token
 */
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (S.token) {
    opts.headers['Authorization'] = 'Bearer ' + S.token;
  }
  
  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    logout();
    throw new Error('Session expired');
  }
  
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  
  return data;
}
