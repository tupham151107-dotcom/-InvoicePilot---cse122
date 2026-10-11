/* Shared browser helpers and the common login/register behavior. */
(function () {
  const destinations = {
    admin: '../admin-manager/index.html',
    manager: '../admin-manager/index.html',
    accountant: '../accountant/index.html',
    sales: '../sales/index.html'
  };

  function readDemoState() {
    try { return JSON.parse(localStorage.getItem('invoicepilot-demo') || '{}'); }
    catch { return {}; }
  }

  function saveDemoState(patch) {
    const state = { ...readDemoState(), ...patch };
    try { localStorage.setItem('invoicepilot-demo', JSON.stringify(state)); } catch { /* file:// privacy settings may disable storage */ }
    return state;
  }

  window.IPCommon = {
    money(amount) {
      return new Intl.NumberFormat('vi-VN').format(Number(amount) || 0) + ' ₫';
    },
    saveDemoState,
    roleLabel(role) {
      return ({ admin: 'Quản trị viên', manager: 'Quản lý', accountant: 'Kế toán', sales: 'Kinh doanh' })[role] || 'Thành viên';
    },
    hasUnreadNotifications(role) {
      return readDemoState().notificationsRead?.[role] !== true;
    },
    markNotificationsRead(role) {
      const state = readDemoState();
      saveDemoState({ notificationsRead: { ...(state.notificationsRead || {}), [role]: true } });
    },
    mountShell({ role, active, nav, searchItems = [] }) {
      const app = document.getElementById('workspace');
      if (!app) return;
      const label = this.roleLabel(role);
      const displayNames = { admin: 'Admin', manager: 'Nguyễn Nguyên', accountant: 'Lê Thu Hà', sales: 'Nguyễn Minh Anh' };
      const displayName = displayNames[role] || label;
      app.innerHTML = `
        <aside class="shared-sidebar">
          <a class="brand" href="../common/index.html"><span class="brand-mark">IP</span><span>InvoicePilot</span></a>
          <div class="shared-company"><strong>Công ty Minh Phát</strong><small>Không gian làm việc</small></div>
          <nav class="shared-nav" aria-label="Điều hướng chính">
            ${nav.map(item => `<a class="shared-nav-link ${item.label === active ? 'active' : ''}" href="${item.href}"><span aria-hidden="true">${item.icon || '•'}</span>${item.label}</a>`).join('')}
          </nav>
          <div class="shared-sidebar-bottom"><small>Đang đăng nhập</small><strong>${label}</strong></div>
        </aside>
        <main class="shared-main">
          <header class="shared-header"><span><strong>${active}</strong></span><div class="shared-header-actions"><input type="search" placeholder="Tìm hóa đơn, khách hàng..." aria-label="Tìm kiếm"><button class="notification-bell shared-bell" type="button" aria-label="Thông báo" data-shared-notification-bell="${role}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>${this.hasUnreadNotifications(role) ? '<i class="dot notification-dot-indicator"></i>' : ''}</button><span class="shared-avatar">${displayName.slice(0, 2).toUpperCase()}</span><span class="shared-user-meta"><strong>${displayName}</strong><small>${label}</small></span><button class="shared-logout" type="button" data-shared-logout>Đăng xuất</button></div></header>
          <div class="shared-content">${document.getElementById('role-content')?.innerHTML || ''}</div>
        </main>`;
      const searchInput = app.querySelector('.shared-header-actions input[type="search"]');
      if (searchInput) {
        const resultPanel = document.createElement('div');
        resultPanel.className = 'shared-search-results';
        resultPanel.hidden = true;
        searchInput.closest('.shared-header-actions').append(resultPanel);
        searchInput.addEventListener('input', () => {
          const query = searchInput.value.trim().toLocaleLowerCase('vi');
          resultPanel.replaceChildren();
          if (!query) { resultPanel.hidden = true; return; }
          const matches = searchItems.filter(item => `${item.title} ${item.description} ${item.searchText}`.toLocaleLowerCase('vi').includes(query)).slice(0, 7);
          if (!matches.length) {
            const empty = document.createElement('p'); empty.className = 'shared-search-empty'; empty.textContent = 'Không tìm thấy hóa đơn hoặc khách hàng.';
            resultPanel.append(empty);
          } else matches.forEach(item => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'shared-search-result';
            const title = document.createElement('strong'); title.textContent = item.title;
            const description = document.createElement('small'); description.textContent = `${item.kind} · ${item.description}`;
            button.append(title, description);
            button.addEventListener('click', () => {
              resultPanel.hidden = true;
              window.dispatchEvent(new CustomEvent('invoicepilot:global-search-select', { detail: { role, section: item.section, filter: item.filter, query: item.query } }));
            });
            resultPanel.append(button);
          });
          resultPanel.hidden = false;
        });
        searchInput.addEventListener('keydown', event => { if (event.key === 'Escape') resultPanel.hidden = true; });
      }
      app.querySelector('[data-shared-logout]')?.addEventListener('click', () => { window.location.href = '../common/index.html'; });
    },
    goToRole(role, email) {
      saveDemoState({
        role,
        route: role === 'admin' ? 'admin-overview' : role === 'manager' ? 'manager-overview' : 'dashboard',
        currentUser: email ? email.split('@')[0] : 'Nguyễn Nguyên',
        authMode: 'login'
      });
      const query = new URLSearchParams({ role, email: email || '' });
      window.location.href = `${destinations[role] || destinations.manager}?${query}`;
    }
  };

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const role = String(data.get('role') || 'manager');
    const message = document.getElementById('login-message');
    if (password.length < 1 || !email.includes('@')) {
      message.textContent = 'Vui lòng nhập email và mật khẩu hợp lệ.';
      return;
    }
    window.IPCommon.goToRole(role, email);
  });

  const forgotLink = document.getElementById('forgot-link');
  if (forgotLink) forgotLink.addEventListener('click', event => {
    event.preventDefault();
    const message = document.getElementById('login-message');
    message.textContent = 'Liên hệ quản trị viên để đặt lại mật khẩu trong bản demo.';
  });

  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(signupForm);
    const message = document.getElementById('signup-message');
    if (data.get('password') !== data.get('confirm')) {
      message.textContent = 'Mật khẩu xác nhận chưa khớp.';
      return;
    }
    message.style.color = 'var(--color-success)';
    message.textContent = 'Thông tin hợp lệ. Tạo tài khoản thật cần backend xác thực.';
  });

})();


