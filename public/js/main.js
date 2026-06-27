/**
 * Quickfix App v2 — Toast & Helpers
 * Usage: showToast('Pesan', 'success'|'error'|'info')
 */

// ── Toast ──
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer')
    || (() => { const c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); return c; })();

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icons[type] || ''} ${message}`;
  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ── API Helper ──
async function api(url, options = {}) {
  const token = getCookie('token');
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    try { const d = await res.json(); if (d.code === 'TOKEN_EXPIRED') { showToast('Sesi berakhir. Silakan login kembali.', 'error'); setTimeout(() => window.location.href = '/', 1500); } } catch (_) {}
  }
  return res;
}

// ── Cookie Helpers ──
function getCookie(name) { const m = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)'); return m ? m[2] : null; }
function setCookie(name, value, days = 7) { const d = new Date(); d.setTime(d.getTime() + days * 864e5); document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`; }
function deleteCookie(name) { document.cookie = `${name}=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/`; }

// ── Formatters ──
function formatDate(d) { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function formatIDR(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); }

// ── Confirm ──
async function confirmAction(msg) { return confirm(msg); }

// ── Loading State ──
function setLoading(btn, text = 'Loading...') { btn.disabled = true; btn.dataset.origText = btn.textContent; btn.innerHTML = '<span class="spinner"></span> ' + text; }
function resetLoading(btn) { btn.disabled = false; btn.textContent = btn.dataset.origText || btn.textContent; }

// ── Status Badge ──
function statusBadge(status) {
  const map = { pending: 'badge-pending', assigned: 'badge-assigned', on_the_way: 'badge-otw', in_progress: 'badge-in_progress', done: 'badge-done', cancelled: 'badge-cancelled' };
  const labels = { pending: 'Pending', assigned: 'Assigned', on_the_way: 'OTW', in_progress: 'In Progress', done: 'Selesai', cancelled: 'Batal' };
  return `<span class="badge ${map[status] || 'badge-pending'}">${labels[status] || status}</span>`;
}

// ── XSS Sanitizer ──
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Pagination ──
function renderPagination(pagination, loadFn) {
  if (!pagination || pagination.total_pages <= 1) return '';
  const { page, total_pages } = pagination;
  let html = '<div class="pagination" style="display:flex;justify-content:center;gap:4px;margin-top:1rem;flex-wrap:wrap">';
  if (page > 1) html += `<button class="btn btn-sm btn-outline" onclick="${loadFn}(${page-1})">← Prev</button>`;
  for (let i = Math.max(1,page-2); i <= Math.min(total_pages,page+2); i++) {
    html += `<button class="btn btn-sm ${i===page?'btn-primary':'btn-outline'}" onclick="${loadFn}(${i})">${i}</button>`;
  }
  if (page < total_pages) html += `<button class="btn btn-sm btn-outline" onclick="${loadFn}(${page+1})">Next →</button>`;
  html += '</div>';
  return html;
}

// ── Password Toggle ──
function setupPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁️';
    });
  });
}
