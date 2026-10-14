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
  const isRecoveryCallback = authCallbackParams.get('type') === 'recovery' || authCallbackQuery.get('type') === 'recovery';

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
    async inviteMember({ email, fullName, temporaryPassword, role }) {
      if (!supabaseClient) throw new Error('Chưa kết nối được Supabase.');
      const { data, error } = await supabaseClient.functions.invoke('invite-member', {
        body: { email, full_name: fullName, temporary_password: temporaryPassword, role }
      });
      if (error) throw new Error(error.message || 'Không gửi được lời mời.');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    async listCompanyMembers() {
      if (!supabaseClient || !window.IP_AUTH_PROFILE?.id) throw new Error('Phiên đăng nhập không hợp lệ.');
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, role, invite_status, created_at')
        .eq('company_admin_id', window.IP_AUTH_PROFILE.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async deleteCompanyMember(memberId) {
      if (!supabaseClient) throw new Error('Chưa kết nối được Supabase.');
      const { data, error } = await supabaseClient.functions.invoke('delete-member', {
        body: { member_id: memberId }
      });
      if (error) throw new Error(error.message || 'Không xóa được tài khoản thành viên.');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    async updateOwnPassword(password) {
      if (!supabaseClient) throw new Error('Chưa kết nối được Supabase.');
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;
    },
    async getCompanyBusinessData() {
      if (!supabaseClient || !window.IP_AUTH_PROFILE?.id) throw new Error('Phiên đăng nhập không hợp lệ.');
      const companyAdminId = window.IP_AUTH_PROFILE.company_admin_id || window.IP_AUTH_PROFILE.id;
      const [customersResult, invoicesResult] = await Promise.all([
        supabaseClient.from('ip_customers').select('*').eq('company_admin_id', companyAdminId).order('created_at', { ascending: false }),
        supabaseClient.from('ip_invoices').select('*').eq('company_admin_id', companyAdminId).order('issue_date', { ascending: false })
      ]);
      if (customersResult.error) throw customersResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      const invoiceRows = invoicesResult.data || [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const formatDate = value => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`)) : '—';
      const invoices = invoiceRows.map(row => {
        const customer = (customersResult.data || []).find(item => item.id === row.customer_id);
        const paid = Number(row.amount_paid) || 0;
        const status = paid >= Number(row.amount) ? 'Đã thanh toán' : new Date(`${row.due_date}T00:00:00`) < today ? 'Quá hạn' : 'Chưa thanh toán';
        return { dbId: row.id, id: row.invoice_no, customerId: row.customer_id, customer: customer?.name || 'Khách hàng đã lưu trữ', issued: formatDate(row.issue_date), due: formatDate(row.due_date), issueDate: row.issue_date, dueDate: row.due_date, amount: Number(row.amount) || 0, amountPaid: paid, balance: Math.max(0, (Number(row.amount) || 0) - paid), description: row.description || '', status };
      });
      const customers = (customersResult.data || []).map(row => {
        const customerInvoices = invoices.filter(invoice => invoice.customerId === row.id);
        const invoiceDebt = customerInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);
        return { id: row.id, name: row.name, tax: row.tax_code || '', contact: row.contact_name || '', email: row.contact_email || '', phone: row.phone || '', status: row.status || 'Đang hoạt động', openingBalance: Number(row.opening_balance) || 0, debt: invoiceDebt + (Number(row.opening_balance) || 0), invoices: customerInvoices.length, due: customerInvoices.find(invoice => invoice.balance > 0)?.due || '—' };
      });
      return { customers, invoices };
    },
    async createCompanyCustomer(customer) {
      if (!supabaseClient || !window.IP_AUTH_PROFILE?.id) throw new Error('Phiên đăng nhập không hợp lệ.');
      const companyAdminId = window.IP_AUTH_PROFILE.company_admin_id || window.IP_AUTH_PROFILE.id;
      const { data, error } = await supabaseClient.from('ip_customers').insert({
        company_admin_id: companyAdminId,
        name: String(customer.name || '').trim(),
        tax_code: String(customer.tax || '').trim(),
        contact_name: String(customer.contact || '').trim(),
        contact_email: String(customer.email || '').trim(),
        phone: String(customer.phone || '').trim(),
        status: String(customer.status || 'Đang hoạt động'),
        opening_balance: Number(customer.openingBalance) || 0
      }).select('*').single();
      if (error) throw error;
      return data;
    },
    async updateCompanyCustomer(customerId, customer) {
      if (!supabaseClient) throw new Error('Chưa kết nối được Supabase.');
      const { data, error } = await supabaseClient.from('ip_customers').update({
        name: String(customer.name || '').trim(), tax_code: String(customer.tax || '').trim(),
        contact_name: String(customer.contact || '').trim(), contact_email: String(customer.email || '').trim(),
        phone: String(customer.phone || '').trim(), status: String(customer.status || 'Đang hoạt động')
      }).eq('id', customerId).select('*').single();
      if (error) throw error;
      return data;
    },
    async createCompanyInvoice(invoice) {
      if (!supabaseClient || !window.IP_AUTH_PROFILE?.id) throw new Error('Phiên đăng nhập không hợp lệ.');
      const companyAdminId = window.IP_AUTH_PROFILE.company_admin_id || window.IP_AUTH_PROFILE.id;
      const { data, error } = await supabaseClient.from('ip_invoices').insert({
        company_admin_id: companyAdminId, customer_id: invoice.customerId, invoice_no: invoice.id,
        issue_date: invoice.issueDate, due_date: invoice.dueDate, amount: Number(invoice.amount) || 0,
        description: String(invoice.description || '').trim()
      }).select('*').single();
      if (error) throw error;
      return data;
    },
    subscribeCompanyBusinessData(onChange) {
      if (!supabaseClient || !window.IP_AUTH_PROFILE?.id) return null;
      const companyAdminId = window.IP_AUTH_PROFILE.company_admin_id || window.IP_AUTH_PROFILE.id;
      return supabaseClient.channel(`business-data:${companyAdminId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ip_customers', filter: `company_admin_id=eq.${companyAdminId}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ip_invoices', filter: `company_admin_id=eq.${companyAdminId}` }, onChange)
        .subscribe();
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
          .from('profiles').select('role, full_name, company_name, tax_code, company_admin_id').eq('id', session.user.id).single();
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
  const resetPasswordForm = document.getElementById('reset-password-form');
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
        .from('profiles').select('role, full_name, company_name, invite_status').eq('id', authData.user.id).single();
      if (profileError) throw profileError;
      if (profile.invite_status === 'invited') {
        loginForm.hidden = true;
        invitePasswordForm.hidden = false;
        document.getElementById('invite-password')?.focus();
        document.getElementById('invite-password-message').textContent = 'Đây là lần đăng nhập đầu tiên. Hãy tạo mật khẩu riêng để tiếp tục.';
        return;
      }
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
    const showResetPasswordForm = session => {
      if (!isRecoveryCallback || !session?.user || !resetPasswordForm) return false;
      loginForm.hidden = true;
      invitePasswordForm.hidden = true;
      document.getElementById('forgot-password-form').hidden = true;
      resetPasswordForm.hidden = false;
      document.getElementById('reset-new-password')?.focus();
      return true;
    };
    const showInvitePasswordForm = async session => {
      if (showResetPasswordForm(session)) return;
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
      if (!data.session && isRecoveryCallback && loginMessage) {
        loginMessage.textContent = 'Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Hãy yêu cầu gửi liên kết mới.';
        return;
      }
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
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles').select('role').eq('id', sessionData.session.user.id).single();
        if (profileError) throw profileError;
        history.replaceState(null, '', window.location.pathname);
        invitePasswordForm.hidden = true;
        loginForm.hidden = false;
        invitePasswordForm.reset();
        window.IPCommon.goToRole(profile.role, sessionData.session.user.email);
      } catch (error) {
        message.textContent = friendlyAuthError(error);
        button.disabled = false;
      }
    });
  }

  const forgotLink = document.getElementById('forgot-link');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotLink && forgotPasswordForm && loginForm) forgotLink.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('reset-email').value = document.getElementById('login-email')?.value.trim() || '';
    document.getElementById('reset-request-message').textContent = supabaseClient ? '' : 'Chưa kết nối được Supabase. Hãy thử lại sau.';
    forgotPasswordForm.hidden = false;
    loginForm.hidden = true;
    document.getElementById('reset-email').focus();
  });
  document.querySelectorAll('[data-show-login]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    forgotPasswordForm.hidden = true;
    loginForm.hidden = false;
    document.getElementById('login-email')?.focus();
  }));
  if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = document.getElementById('reset-request-message');
    const email = document.getElementById('reset-email').value.trim();
    if (!supabaseClient) { message.textContent = 'Chưa kết nối được Supabase. Hãy thử lại sau.'; return; }
    const button = forgotPasswordForm.querySelector('[type="submit"]');
    button.disabled = true;
    message.classList.remove('is-success');
    message.textContent = 'Đang gửi liên kết…';
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: emailRedirectUrl() });
      if (error) throw error;
      message.classList.add('is-success');
      message.textContent = 'Nếu email này đã đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi tới hộp thư. Kiểm tra cả mục thư rác.';
    } catch (error) {
      message.textContent = friendlyAuthError(error);
      button.disabled = false;
    }
  });
  if (resetPasswordForm) resetPasswordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const message = document.getElementById('reset-password-message');
    const password = document.getElementById('reset-new-password').value;
    const confirmation = document.getElementById('reset-confirm-password').value;
    if (password.length < 8) { message.textContent = 'Mật khẩu cần có ít nhất 8 ký tự.'; return; }
    if (password !== confirmation) { message.textContent = 'Mật khẩu xác nhận chưa khớp.'; return; }
    const button = resetPasswordForm.querySelector('[type="submit"]');
    button.disabled = true;
    message.textContent = 'Đang lưu mật khẩu mới…';
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;
      await supabaseClient.auth.signOut();
      history.replaceState(null, '', window.location.pathname);
      resetPasswordForm.hidden = true;
      loginForm.hidden = false;
      document.getElementById('login-message').classList.add('is-success');
      document.getElementById('login-message').textContent = 'Đã đổi mật khẩu. Đăng nhập bằng mật khẩu mới của bạn.';
    } catch (error) {
      message.textContent = friendlyAuthError(error);
      button.disabled = false;
    }
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


