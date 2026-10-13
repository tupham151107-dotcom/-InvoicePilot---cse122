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

  function accountStorageKey(name) {
    const userId = window.IP_AUTH_PROFILE?.id;
    return userId ? `${name}:${userId}` : name;
  }

  const supabaseClient = (() => {
    const config = window.INVOICEPILOT_SUPABASE;
    if (!config?.url || !config?.publishableKey || !window.supabase?.createClient) return null;
    return window.supabase.createClient(config.url, config.publishableKey);
  })();

  const authCallbackParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const authCallbackQuery = new URLSearchParams(window.location.search);
  const isInviteCallback = authCallbackParams.get('type') === 'invite' || authCallbackQuery.get('type') === 'invite';

  function friendlyAuthError(error) {
    const text = String(error?.message || '');
    if (/invalid login credentials/i.test(text)) return 'Email hoặc mật khẩu chưa chính xác.';
    if (/email not confirmed/i.test(text)) return 'Bạn cần xác nhận email trước khi đăng nhập.';
    if (/user already registered/i.test(text)) return 'Email này đã được đăng ký.';
    if (/password/i.test(text) && /least|short|characters/i.test(text)) return 'Mật khẩu chưa đủ độ dài yêu cầu.';
    if (/email rate limit/i.test(text)) return 'Bạn thao tác quá nhanh. Hãy đợi một lúc rồi thử lại.';
    if (/fetch|network/i.test(text)) return 'Không kết nối được Supabase. Kiểm tra mạng rồi thử lại.';
    return text || 'Không thể kết nối Supabase. Hãy thử lại.';
  }

  function showLoginNotice(message) {
    try { sessionStorage.setItem('invoicepilot-auth-notice', message); } catch { /* Storage can be unavailable in private browsing. */ }
  }

  function takeLoginNotice() {
    try {
      const message = sessionStorage.getItem('invoicepilot-auth-notice');
      sessionStorage.removeItem('invoicepilot-auth-notice');
      return message;
    } catch { return ''; }
  }

  function emailRedirectUrl() {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return new URL('index.html', window.location.href).href;
    }
    return window.INVOICEPILOT_SUPABASE?.authRedirectUrl || undefined;
  }

  window.IPCommon = {
    money(amount) {
      return new Intl.NumberFormat('vi-VN').format(Number(amount) || 0) + ' ₫';
    },
    saveDemoState,
    accountStorageKey,
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
    async inviteMember({ email, fullName, role }) {
      if (!supabaseClient) throw new Error('Chưa kết nối được Supabase.');
      const { data, error } = await supabaseClient.functions.invoke('invite-member', {
        body: { email, full_name: fullName, role }
      });
      if (error) throw new Error(error.message || 'Không gửi được lời mời.');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    async listCompanyMembers() {
      if (!supabaseClient || !window.IP_AUTH_PROFILE?.id) throw new Error('Phiên đăng nhập không hợp lệ.');
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('company_admin_id', window.IP_AUTH_PROFILE.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async requireRole(role) {
      const loginUrl = '../common/index.html';
      if (!supabaseClient) {
        showLoginNotice('Chưa kết nối được Supabase. Hãy kiểm tra cấu hình đăng nhập.');
        window.location.replace(loginUrl);
        return null;
      }
      try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) {
          showLoginNotice('Vui lòng đăng nhập để vào khu vực này.');
          window.location.replace(loginUrl);
          return null;
        }
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles').select('role, full_name, company_name, tax_code').eq('id', session.user.id).single();
        if (profileError) throw profileError;
        if (profile.role !== role) {
          await supabaseClient.auth.signOut();
          showLoginNotice('Vai trò của tài khoản không có quyền vào khu vực này.');
          window.location.replace(loginUrl);
          return null;
        }
        window.IP_AUTH_PROFILE = { ...profile, id: session.user.id, email: session.user.email || '' };
        return window.IP_AUTH_PROFILE;
      } catch (error) {
        console.error('Không thể kiểm tra phiên InvoicePilot:', error);
        showLoginNotice('Không đọc được hồ sơ tài khoản. Hãy đăng nhập lại hoặc kiểm tra cấu hình Supabase.');
        window.location.replace(loginUrl);
        return null;
      }
    },
    async signOut() {
      if (supabaseClient) await supabaseClient.auth.signOut();
      window.IP_AUTH_PROFILE = null;
    },
    mountShell({ role, active, nav, searchItems = [] }) {
      const app = document.getElementById('workspace');
      if (!app) return;
      const label = this.roleLabel(role);
      const displayNames = { admin: 'Admin', manager: 'Nguyễn Nguyên', accountant: 'Lê Thu Hà', sales: 'Nguyễn Minh Anh' };
      const displayName = window.IP_AUTH_PROFILE?.full_name || displayNames[role] || label;
      const companyName = window.IP_AUTH_PROFILE?.company_name || 'Doanh nghiệp của bạn';
      app.innerHTML = `
        <aside class="shared-sidebar">
          <a class="brand" href="../common/index.html"><span class="brand-mark">IP</span><span>InvoicePilot</span></a>
          <div class="shared-company"><strong>${companyName}</strong><small>Không gian làm việc</small></div>
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
      app.querySelector('[data-shared-logout]')?.addEventListener('click', async () => {
        try { await this.signOut(); } finally { window.location.href = '../common/index.html'; }
      });
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
  const invitePasswordForm = document.getElementById('invite-password-form');
  const loginMessage = document.getElementById('login-message');
  if (loginMessage) loginMessage.textContent = takeLoginNotice();
  if (loginForm) loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const message = document.getElementById('login-message');
    if (password.length < 1 || !email.includes('@')) {
      message.textContent = 'Vui lòng nhập email và mật khẩu.';
      return;
    }
    if (!supabaseClient) {
      message.textContent = 'Chưa cấu hình kết nối Supabase. Hãy thêm URL và publishable key vào common/supabase-config.js.';
      return;
    }
    const button = loginForm.querySelector('[type="submit"]');
    button.disabled = true;
    message.textContent = 'Đang xác thực…';
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles').select('role, full_name, company_name').eq('id', authData.user.id).single();
      if (profileError) throw profileError;
      window.IPCommon.goToRole(profile.role, authData.user.email);
    } catch (error) {
      await supabaseClient.auth.signOut().catch(() => {});
      message.textContent = friendlyAuthError(error);
      button.disabled = false;
    }
  });

  if (supabaseClient && loginForm && invitePasswordForm) {
    const callbackError = authCallbackParams.get('error_description') || authCallbackQuery.get('error_description');
    if (callbackError && loginMessage) loginMessage.textContent = callbackError;

    let inviteCheckRunning = false;
    const showInvitePasswordForm = async session => {
      if (!session?.user || inviteCheckRunning || !invitePasswordForm.hidden) return;
      inviteCheckRunning = true;
      try {
        let profile;
        for (let attempt = 0; attempt < 6; attempt++) {
          const { data, error } = await supabaseClient.from('profiles')
            .select('invite_status, role').eq('id', session.user.id).maybeSingle();
          if (error) throw error;
          profile = data;
          if (profile || attempt === 5) break;
          await new Promise(resolve => window.setTimeout(resolve, 250));
        }

        const invitedRole = ['manager', 'accountant', 'sales'].includes(profile?.role);
        if (profile?.invite_status === 'invited' || (isInviteCallback && invitedRole)) {
          loginForm.hidden = true;
          invitePasswordForm.hidden = false;
          document.getElementById('invite-password')?.focus();
          return;
        }
        if (isInviteCallback && loginMessage) {
          loginMessage.textContent = 'Không tìm thấy hồ sơ lời mời đang chờ. Hãy nhờ quản trị viên gửi lại lời mời mới.';
        }
      } catch (error) {
        if (loginMessage) loginMessage.textContent = `Không xác minh được lời mời: ${friendlyAuthError(error)}`;
      } finally {
        inviteCheckRunning = false;
      }
    };

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session) window.setTimeout(() => { void showInvitePasswordForm(session); }, 0);
    });
    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (!data.session && isInviteCallback && loginMessage) {
        loginMessage.textContent = 'Liên kết lời mời chưa xác thực được. Hãy mở lại email mời hoặc nhờ quản trị viên gửi lời mời mới.';
        return;
      }
      return showInvitePasswordForm(data.session);
    }).catch(error => {
      if (loginMessage) loginMessage.textContent = `Không xác minh được lời mời: ${friendlyAuthError(error)}`;
    });
    invitePasswordForm.addEventListener('submit', async event => {
      event.preventDefault();
      const message = document.getElementById('invite-password-message');
      const password = document.getElementById('invite-password').value;
      const confirm = document.getElementById('invite-password-confirm').value;
      if (password.length < 8) { message.textContent = 'Mật khẩu cần có ít nhất 8 ký tự.'; return; }
      if (password !== confirm) { message.textContent = 'Mật khẩu xác nhận chưa khớp.'; return; }
      const button = invitePasswordForm.querySelector('[type="submit"]');
      button.disabled = true;
      message.textContent = 'Đang lưu mật khẩu…';
      try {
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;
        await supabaseClient.auth.signOut();
        history.replaceState(null, '', window.location.pathname);
        invitePasswordForm.hidden = true;
        loginForm.hidden = false;
        loginMessage.textContent = 'Đã tạo mật khẩu. Đăng nhập bằng email được mời và mật khẩu mới.';
      } catch (error) {
        message.textContent = friendlyAuthError(error);
        button.disabled = false;
      }
    });
  }

  const forgotLink = document.getElementById('forgot-link');
  if (forgotLink) forgotLink.addEventListener('click', event => {
    event.preventDefault();
    const message = document.getElementById('login-message');
    if (supabaseClient) {
      const email = document.getElementById('login-email')?.value.trim();
      if (!email) { message.textContent = 'Nhập email trước để nhận liên kết đặt lại mật khẩu.'; return; }
      supabaseClient.auth.resetPasswordForEmail(email, emailRedirectUrl() ? { redirectTo: emailRedirectUrl() } : undefined)
        .then(({ error }) => { message.textContent = error ? friendlyAuthError(error) : 'Đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn.'; })
        .catch(error => { message.textContent = friendlyAuthError(error); });
      return;
    }
    message.textContent = 'Nhập email rồi dùng chức năng quên mật khẩu sau khi cấu hình Supabase.';
  });

  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(signupForm);
    const message = document.getElementById('signup-message');
    const email = String(data.get('email') || '').trim().toLowerCase();
    const company = String(data.get('company') || '').trim();
    const tax = String(data.get('tax') || '').trim();
    const owner = String(data.get('owner') || '').trim();
    const role = 'admin';
    const password = String(data.get('password') || '');
    if (!company || !tax || !owner || !email) {
      message.textContent = 'Vui lòng điền đầy đủ thông tin doanh nghiệp và tài khoản.';
      return;
    }
    if (password.length < 8) {
      message.textContent = 'Mật khẩu cần có ít nhất 8 ký tự.';
      return;
    }
    if (password !== data.get('confirm')) {
      message.textContent = 'Mật khẩu xác nhận chưa khớp.';
      return;
    }
    if (!supabaseClient) {
      message.textContent = 'Chưa cấu hình kết nối Supabase. Hãy thêm URL và publishable key vào common/supabase-config.js.';
      return;
    }
    const submitButton = signupForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    message.textContent = 'Đang tạo tài khoản…';
    try {
      const { data: authData, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: {
          company_name: company,
          tax_code: tax,
          full_name: owner,
          role
        }, ...(emailRedirectUrl() ? { emailRedirectTo: emailRedirectUrl() } : {}) }
      });
      if (error) throw error;
      if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        throw new Error('User already registered');
      }
      message.style.color = 'var(--color-success)';
      message.textContent = authData.session
        ? `Đăng ký thành công. Hồ sơ ${window.IPCommon.roleLabel(role)} và doanh nghiệp đã được lưu; bạn có thể đăng nhập.`
        : 'Đã tạo tài khoản. Hãy xác nhận email theo liên kết Supabase gửi tới, sau đó đăng nhập.';
      signupForm.reset();
      if (authData.session) window.setTimeout(() => { window.location.href = 'index.html'; }, 1600);
      else submitButton.disabled = false;
    } catch (error) {
      message.textContent = friendlyAuthError(error);
      submitButton.disabled = false;
    }
  });

})();


