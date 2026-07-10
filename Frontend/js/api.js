/* ═══════════════════════════════════════════════════════════
   LifePulse — Central API Layer
   Backend: http://localhost:3000/api
   Auth response shape: { accessToken, user }
   Inventory field: quantityUnits (not units)
═══════════════════════════════════════════════════════════ */

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : '/api';

// ─── Token / Session Management ──────────────────────────────
const Auth = {
  getToken:    () => localStorage.getItem('lp_token'),
  setToken:    (t) => localStorage.setItem('lp_token', t),
  removeToken: () => localStorage.removeItem('lp_token'),

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('lp_user') || 'null'); }
    catch { return null; }
  },
  setUser:    (u) => localStorage.setItem('lp_user', JSON.stringify(u)),
  removeUser: () => localStorage.removeItem('lp_user'),

  isLoggedIn: () => !!localStorage.getItem('lp_token'),

  logout: () => {
    localStorage.removeItem('lp_token');
    localStorage.removeItem('lp_user');
    // Works from /pages/ and from root
    const path = window.location.pathname;
    window.location.href = path.includes('/pages/') ? 'login.html' : 'pages/login.html';
  },

  getRole: () => { const u = Auth.getUser(); return u ? u.role : null; },
};

// ─── Core Fetch ───────────────────────────────────────────────
async function request(method, endpoint, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      Auth.logout();
      return { error: 'Unauthorized', status: 401, ok: false };
    }
    return { data, status: res.status, ok: res.ok };
  } catch (err) {
    return { error: err.message, status: 0, ok: false };
  }
}

const get   = (ep, auth = true)        => request('GET',    ep, null, auth);
const post  = (ep, body, auth = true)  => request('POST',   ep, body, auth);
const patch = (ep, body, auth = true)  => request('PATCH',  ep, body, auth);
const del   = (ep, auth = true)        => request('DELETE', ep, null, auth);

// ─── API Modules ──────────────────────────────────────────────
const API = {
  auth: {
    register: (d)  => post('/auth/register', d, false),
    login:    (d)  => post('/auth/login', d, false),
    logout:   ()   => post('/auth/logout', {}),
    me:       ()   => get('/auth/me'),
  },

  users: {
    findAll:    ()      => get('/users'),
    findOne:    (id)    => get(`/users/${id}`),
    update:     (id, d) => patch(`/users/${id}`, d),
    updateRole: (id, d) => patch(`/users/${id}/role`, d),
    remove:     (id)    => del(`/users/${id}`),
  },

  donors: {
    create:     (d)       => post('/donors', d),
    findAll:    (q = '')  => get(`/donors${q}`),
    search:     (q)       => get(`/donors/search?${q}`),
    findOne:    (id)      => get(`/donors/${id}`),
    update:     (id, d)   => patch(`/donors/${id}`, d),
    remove:     (id)      => del(`/donors/${id}`),
    hardDelete: (id)      => del(`/donors/${id}/hard`),
  },

  donations: {
    create:       (d)       => post('/donations', d),
    findAll:      (q = '')  => get(`/donations${q}`),
    findOne:      (id)      => get(`/donations/${id}`),
    findByDonor:  (dId)     => get(`/donations/donor/${dId}`),
    getStats:     ()        => get('/donations/stats'),
    cancel:       (id)      => patch(`/donations/${id}/cancel`, {}),
  },

  appointments: {
    create:       (d)       => post('/appointments', d),
    findAll:      (q = '')  => get(`/appointments${q}`),
    findUpcoming: ()        => get('/appointments/upcoming'),
    findByDonor:  (dId)     => get(`/appointments/donor/${dId}`),
    findOne:      (id)      => get(`/appointments/${id}`),
    update:       (id, d)   => patch(`/appointments/${id}`, d),
    updateStatus: (id, d)   => patch(`/appointments/${id}/status`, d),
  },

  inventory: {
    findAll:           ()            => get('/inventory'),
    getLowStock:       ()            => get('/inventory/low-stock'),
    // Returns boolean from backend
    checkAvailability: (bg, units)   => get(`/inventory/check/${encodeURIComponent(bg)}/${units}`),
    findOne:           (bg)          => get(`/inventory/${encodeURIComponent(bg)}`),
    addStock:          (d)           => post('/inventory/add', d),
    issueStock:        (d)           => post('/inventory/issue', d),
    // Backend: POST /inventory/expire/:bloodGroup — body may include units
    markExpired:       (bg, units)   => post(`/inventory/expire/${encodeURIComponent(bg)}`, { units }),
    update:            (bg, d)       => patch(`/inventory/${encodeURIComponent(bg)}`, d),
  },

  requests: {
    create:       (d)       => post('/requests', d),
    findAll:      (q = '')  => get(`/requests${q}`),
    findOne:      (id)      => get(`/requests/${id}`),
    updateStatus: (id, d)   => patch(`/requests/${id}/status`, d),
    cancel:       (id)      => patch(`/requests/${id}/cancel`, {}),
  },

  hospitals: {
    create:  (d)       => post('/hospitals', d),
    findAll: ()        => get('/hospitals'),
    findOne: (id)      => get(`/hospitals/${id}`),
    update:  (id, d)   => patch(`/hospitals/${id}`, d),
    remove:  (id)      => del(`/hospitals/${id}`),
  },

  camps: {
    create:      (d)     => post('/camps', d),
    findAll:     ()      => get('/camps'),
    findUpcoming:()      => get('/camps/upcoming'),
    findOne:     (id)    => get(`/camps/${id}`),
    update:      (id, d) => patch(`/camps/${id}`, d),
    remove:      (id)    => del(`/camps/${id}`),
  },

  eligibility: {
    check:            (d)     => post('/eligibility/check', d),
    findAllByDonor:   (dId)   => get(`/eligibility/donor/${dId}`),
    findLatestByDonor:(dId)   => get(`/eligibility/donor/${dId}/latest`),
  },

  notifications: {
    create:           (d)     => post('/notifications', d),
    findAllByDonor:   (dId)   => get(`/notifications/donor/${dId}`),
    findUnreadByDonor:(dId)   => get(`/notifications/donor/${dId}/unread`),
    markAsRead:       (id)    => patch(`/notifications/${id}/read`, {}),
    markAllAsRead:    (dId)   => patch(`/notifications/donor/${dId}/read-all`, {}),
    remove:           (id)    => del(`/notifications/${id}`),
  },

  dashboard: { getStats: () => get('/dashboard/stats') },
  feedback:  { getStats: () => get('/feedback/stats')  },
};

// ─── Route Guard ──────────────────────────────────────────────
function requireAuth(allowedRoles = []) {
  if (!Auth.isLoggedIn()) {
    Auth.logout();
    return false;
  }
  if (allowedRoles.length > 0) {
    const role = Auth.getRole();
    if (!allowedRoles.includes(role)) {
      showToast('Access denied for your role.', 'error');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      return false;
    }
  }
  return true;
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Confirm Dialog ───────────────────────────────────────────
function showConfirm(title, message, onConfirm, danger = true) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon">${danger ? '🗑️' : '❓'}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" onclick="this.closest('.confirm-overlay').remove()">Cancel</button>
        <button class="btn ${danger ? 'btn-primary' : 'btn-success'}" id="_confirm-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#_confirm-ok').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

// ─── Modal Helpers ────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeAllModals(); });

// ─── Utility Helpers ──────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatTime = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};
const timeAgo = (d) => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const initials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};
const statusBadge = (status) => {
  const map = {
    active:'green', completed:'green', approved:'green', fulfilled:'green', available:'green',
    pending:'yellow', booked:'blue', scheduled:'blue', upcoming:'blue', ongoing:'blue', low:'yellow', urgent:'yellow', rescheduled:'yellow', reserved:'yellow',
    cancelled:'gray', inactive:'gray', no_show:'gray', normal:'blue',
    expired:'red', rejected:'red', failed:'red', suspended:'red', critical:'red',
  };
  const color = map[status?.toLowerCase()] || 'gray';
  return `<span class="badge badge-${color}">${status || '—'}</span>`;
};
const bloodBadge = (bg) => `<span class="blood-badge blood-badge-sm">${bg || '—'}</span>`;
const emptyState = (icon, title, msg) =>
  `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${msg}</p></div>`;
const loadingState = () =>
  `<div class="loading-overlay"><div class="loading-spinner"></div><p>Loading…</p></div>`;

function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) { btn.dataset.orig = btn.innerHTML; btn.innerHTML = '⏳ Please wait…'; }
  else btn.innerHTML = btn.dataset.orig || btn.innerHTML;
}

// ─── Sidebar Init ─────────────────────────────────────────────
function initSidebar() {
  const toggle  = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
  }
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay.classList.remove('visible');
  });

  // Mark active nav item
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === current) item.classList.add('active');
  });

  // Populate user display
  const user = Auth.getUser();
  if (user) {
    const nameEl   = document.getElementById('sidebar-user-name');
    const roleEl   = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl)   nameEl.textContent   = user.fullName || user.email;
    if (roleEl)   roleEl.textContent   = user.role;
    if (avatarEl) avatarEl.textContent = initials(user.fullName || user.email);
  }

  loadNotifCount();
}

async function loadNotifCount() {
  const user = Auth.getUser();
  if (!user || user.role !== 'donor' || !user.donorId) return;
  try {
    const res = await API.notifications.findUnreadByDonor(user.donorId);
    if (res.ok) {
      const count = Array.isArray(res.data) ? res.data.length : (res.data?.data?.length || 0);
      ['notif-count','topbar-notif'].forEach(id => {
        const el = document.getElementById(id);
        if (el && count > 0) { el.textContent = count; el.style.display = 'flex'; }
      });
    }
  } catch { /* silent */ }
}

function handleLogout() {
  showConfirm('Logout', 'Are you sure you want to logout?', () => {
    API.auth.logout().finally(() => Auth.logout());
  }, false);
}

// ─── Landing page: public donor search ───────────────────────
window.searchPublicDonors = async function () {
  const bg   = document.getElementById('donor-bg-filter')?.value;
  const city = document.getElementById('donor-city-filter')?.value;
  const container = document.getElementById('public-donors');
  if (!container) return;
  container.innerHTML = loadingState();
  let q = '';
  if (bg)   q += `bloodGroup=${encodeURIComponent(bg)}&`;
  if (city) q += `city=${encodeURIComponent(city)}&`;
  const res = await API.donors.search(q);
  if (!res.ok) { container.innerHTML = emptyState('❌', 'Error', res.data?.message || 'Failed to load'); return; }
  const donors = Array.isArray(res.data) ? res.data : (res.data?.data || []);
  if (!donors.length) { container.innerHTML = emptyState('🔍', 'No donors found', 'Try a different blood group or city.'); return; }
  container.innerHTML = donors.map(d => `
    <div class="donor-pub-card">
      <div class="blood-badge">${d.bloodGroup}</div>
      <div class="donor-pub-info">
        <h4>${d.fullName}</h4>
        <p>📍 ${d.city}, ${d.state}</p>
        <p>📞 ${d.phone}</p>
      </div>
    </div>`).join('');
};

// ─── Inventory display helper (shared) ───────────────────────
// Maps quantityUnits → display as "units"
function normalizeInventoryItem(item) {
  return {
    ...item,
    units: item.quantityUnits ?? item.units ?? 0,
  };
}
