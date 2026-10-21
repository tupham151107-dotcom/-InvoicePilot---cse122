IPCommon.requireRole('sales').then(async profile => {
  if (!profile) return;
  const salesStorageKey = IPCommon.accountStorageKey('invoicepilot-sales');
  const salesSettingsStorageKey = IPCommon.accountStorageKey('invoicepilot-sales-settings');
  let customers = [];
  let opportunities = [];
  let reminders = [];
  try {
    const saved = JSON.parse(localStorage.getItem(salesStorageKey) || '{}');
    if (Array.isArray(saved.opportunities)) opportunities = saved.opportunities;
    if (Array.isArray(saved.reminders)) reminders = saved.reminders;
  } catch { /* Start with an empty account workspace if storage is unavailable. */ }
  const nav = [
    { id: 'overview', label: 'Tổng quan', href: '#overview', icon: '▦' },
    { id: 'customers', label: 'Khách hàng', href: '#customers', icon: '♙' },
    { id: 'opportunities', label: 'Cơ hội', href: '#opportunities', icon: '◇' },
    { id: 'reminders', label: 'Nhắc thanh toán', href: '#reminders', icon: '◷' },
    { id: 'settings', label: 'Cài đặt', href: '#settings', icon: '⚙' }
  ];
  const money = amount => IPCommon.money(amount);
  const getGlobalSearchItems = () => [
    ...reminders.map(item => ({ title: item.invoice, kind: 'Hóa đơn', description: `${item.customer} · ${money(item.amount)}`, searchText: `${item.invoice} ${item.customer} ${item.status}`, section: 'reminders', filter: 'reminders', query: item.invoice })),
    ...customers.map(item => ({ title: item.name, kind: 'Khách hàng', description: `${item.contact} · ${item.email}`, searchText: `${item.name} ${item.contact} ${item.email}`, section: 'customers', filter: 'customers', query: item.name }))
  ];
  const workspace = document.getElementById('workspace');
  const content = document.getElementById('role-content');
  const safe = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  function customersTable(items) {
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Khách hàng</th><th>Người liên hệ</th><th>Công nợ</th><th>Hạn gần nhất</th><th>Trạng thái</th><th></th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${safe(item.name)}</strong></td><td>${safe(item.contact)}<br><small>${safe(item.email)}</small></td><td><strong>${money(item.debt)}</strong></td><td>${safe(item.due)}</td><td><span class="role-badge ${item.status === 'Cần liên hệ' || item.status === 'Đang theo dõi' ? 'pending' : ''}">${safe(item.status)}</span></td><td><button type="button" data-customer="${safe(item.name)}">Chi tiết</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function opportunityTable(items) {
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Mã cơ hội</th><th>Cơ hội / khách hàng</th><th>Giá trị dự kiến</th><th>Giai đoạn</th><th>Dự kiến chốt</th><th></th></tr></thead><tbody>${items.map(item => `<tr><td><strong>${safe(item.id)}</strong></td><td><strong>${safe(item.name)}</strong><br><small>${safe(item.customer)}</small></td><td><strong>${money(item.value)}</strong></td><td><span class="role-badge">${safe(item.stage)}</span></td><td>${safe(item.close)}</td><td><button type="button" data-opportunity="${safe(item.id)}">Chi tiết</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function reminderTable(items) {
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Khách hàng</th><th>Mã hóa đơn</th><th>Hạn thanh toán</th><th>Còn phải thu</th><th>Trạng thái</th><th>Nhắc khách</th></tr></thead><tbody>${items.map(item => { const index = reminders.indexOf(item); return `<tr><td><strong>${item.customer}</strong></td><td>${item.invoice}</td><td>${item.due}</td><td><strong>${money(item.amount)}</strong></td><td><span class="role-badge ${item.status === 'Quá hạn' ? 'pending' : ''}">${item.status}</span></td><td>${item.reminded ? `<span class="positive">Đã nhắc${item.remindedAt ? `<br><small>${item.remindedAt}</small>` : ''}</span>` : `<button type="button" data-remind="${index}">Soạn nhắc</button>`}</td></tr>`; }).join('')}</tbody></table></div>`;
  }

  function reminderDraft(item) {
    const customer = customers.find(row => row.name === item.customer);
    const contact = customer?.contact || 'Quý khách';
    return {
      customer,
      subject: `Nhắc thanh toán hóa đơn ${item.invoice}`,
      message: `Kính gửi ${contact},\n\nInvoicePilot xin phép nhắc Quý khách về hóa đơn ${item.invoice} của ${item.customer}.\nSố tiền còn phải thanh toán: ${money(item.amount)}.\nHạn thanh toán: ${item.due}.\n\nQuý khách vui lòng kiểm tra và phản hồi giúp chúng tôi về kế hoạch thanh toán. Nếu đã thanh toán, xin vui lòng bỏ qua tin nhắn này và gửi lại xác nhận để chúng tôi đối soát.\n\nTrân trọng,\nBộ phận Kinh doanh · InvoicePilot`
    };
  }

  function openReminder(index) {
    const item = reminders[index];
    if (!item) return;
    const { customer, subject, message } = reminderDraft(item);
    document.querySelector('[data-reminder-modal]')?.remove();
    const modal = document.createElement('div');
    modal.className = 'sales-reminder-backdrop';
    modal.dataset.reminderModal = '';
    modal.innerHTML = `<section class="sales-reminder-modal" role="dialog" aria-modal="true" aria-labelledby="sales-reminder-title"><header><div><span class="eyebrow">SOẠN THÔNG BÁO</span><h2 id="sales-reminder-title">Nhắc thanh toán · ${item.invoice}</h2></div><button type="button" class="sales-reminder-close" aria-label="Đóng" data-close-reminder>×</button></header><div class="sales-reminder-recipient"><div><small>KHÁCH HÀNG</small><strong>${safe(item.customer)}</strong></div><div><small>NGƯỜI LIÊN HỆ</small><strong>${safe(customer?.contact || '—')}</strong></div><div><small>EMAIL</small><strong>${safe(customer?.email || 'Chưa có email')}</strong></div><div><small>CÒN PHẢI THANH TOÁN</small><strong>${money(item.amount)}</strong></div></div><label class="sales-reminder-label" for="reminder-subject">Tiêu đề</label><input id="reminder-subject" class="sales-reminder-input" value="${safe(subject)}" /><label class="sales-reminder-label" for="reminder-message">Nội dung nhắc</label><textarea id="reminder-message" class="sales-reminder-textarea" data-reminder-message>${safe(message)}</textarea><p class="sales-reminder-hint">Bản demo không tự gửi email. Bạn có thể sao chép nội dung hoặc mở ứng dụng email để kiểm tra và tự gửi.</p><footer><button type="button" class="button" data-copy-reminder>Sao chép nội dung</button>${customer?.email ? `<a class="button button-primary" href="mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}">Mở email</a>` : ''}<button type="button" class="button button-primary" data-mark-reminded="${index}">Ghi nhận đã nhắc</button></footer></section>`;
    workspace.append(modal);
    modal.querySelector('[data-close-reminder]')?.focus();
  }

  function saveReminders() {
    saveSalesData();
  }

  function saveSalesData() {
    try { localStorage.setItem(salesStorageKey, JSON.stringify({ opportunities, reminders })); } catch { /* Keep edits for this visit if browser storage is unavailable. */ }
  }

  const salesModals = window.InvoicePilotSalesModals.create({
    workspace, customers, opportunities, money,
    onCustomerAdded: async (customer, modal) => {
      const saved = await IPCommon.createCompanyCustomer(customer);
      customers.unshift({ ...customer, id: saved.id, tax: saved.tax_code, invoiceCount: 0 });
      saveSalesData(); modal.remove(); render('customers'); workspace.querySelector('[data-sales-message]').textContent = `Đã thêm khách hàng ${customer.name}. Dữ liệu đã đồng bộ cho doanh nghiệp.`;
    },
    onOpportunityAdded: (name, modal) => { saveSalesData(); modal.remove(); render('opportunities'); workspace.querySelector('[data-sales-message]').textContent = `Đã thêm cơ hội ${name}.`; }
  });

  function pageMarkup(section) {
    if (section === 'settings') return `<section class="role-heading"><div><span class="eyebrow">TÙY CHỈNH</span><h1>Cài đặt</h1><p>Hồ sơ và tùy chọn riêng cho tài khoản Kinh doanh.</p></div></section><section class="accountant-settings-profile"><div class="accountant-settings-profile-heading"><div><h2>Hồ sơ</h2><p>Thông tin tài khoản đang đăng nhập.</p></div><span class="accountant-settings-avatar">${safe(profile.full_name || 'KD').slice(0, 2).toLocaleUpperCase('vi')}</span></div><div class="accountant-settings-profile-grid"><div><small>Họ và tên</small><strong>${safe(profile.full_name || '')}</strong></div><div><small>Email</small><strong>${safe(profile.email || '')}</strong></div><div><small>Vai trò</small><strong>Kinh doanh</strong></div><div><small>Không gian làm việc</small><strong>${safe(profile.company_name || '')}</strong></div></div></section><section class="accountant-settings-list"><article class="accountant-settings-card"><div><h2>Thông báo</h2><p>Nhận thông báo về khách hàng và cơ hội cần theo dõi.</p></div><label class="accountant-toggle"><input type="checkbox" checked data-sales-setting="notifications"><span></span><b>Bật thông báo</b></label></article><article class="accountant-settings-card"><div><h2>Nhắc thanh toán</h2><p>Hiển thị nhắc nhở hóa đơn sắp đến hạn và quá hạn.</p></div><label class="accountant-toggle"><input type="checkbox" checked data-sales-setting="payment-reminders"><span></span><b>Bật nhắc hạn</b></label></article></section><button class="button button-primary accountant-settings-save" type="button" data-save-sales-settings>Lưu cài đặt</button><div class="role-message" data-sales-message role="status" aria-live="polite"></div>`;
    if (section === 'customers') return `<section class="role-heading"><div><span class="eyebrow">KINH DOANH</span><h1>Khách hàng của tôi</h1><p>Thông tin liên hệ, công nợ và tình trạng chăm sóc.</p></div><button class="button button-primary sales-action" data-sales-action="add-customer">+ Thêm khách hàng</button></section><section class="role-stats"><article class="role-card"><small>Khách hàng phụ trách</small><strong>${customers.length}</strong><span>Khách hàng trong danh sách</span></article><article class="role-card"><small>Đang có công nợ</small><strong>${customers.filter(item => item.debt > 0).length}</strong><span>${money(customers.reduce((sum, item) => sum + item.debt, 0))} cần theo dõi</span></article><article class="role-card"><small>Đã thu tháng này</small><strong>${money(0)}</strong><span class="positive">Chưa có khoản thu</span></article></section><section class="role-panel"><div class="role-panel-heading"><div><h2>Danh sách khách hàng</h2><p>Tra cứu thông tin và trạng thái theo dõi.</p></div><input class="role-search" type="search" placeholder="Tìm tên, email hoặc người liên hệ" data-sales-search="customers" /></div><div data-sales-list="customers">${customersTable(customers)}</div></section><div class="role-message" data-sales-message role="status"></div>`;
    if (section === 'opportunities') return `<section class="role-heading"><div><span class="eyebrow">KINH DOANH</span><h1>Cơ hội kinh doanh</h1><p>Quản lý cơ hội bán hàng và dự kiến chốt hợp đồng.</p></div><button class="button button-primary" data-sales-action="add-opportunity">+ Thêm cơ hội</button></section><section class="role-stats"><article class="role-card"><small>Cơ hội đang mở</small><strong>${opportunities.length}</strong><span>Trong pipeline hiện tại</span></article><article class="role-card"><small>Tổng giá trị dự kiến</small><strong>${money(opportunities.reduce((sum, item) => sum + item.value, 0))}</strong><span>Giá trị các cơ hội đang mở</span></article><article class="role-card"><small>Dự kiến chốt tháng này</small><strong>${opportunities.filter(item => item.stage === 'Đề xuất').length}</strong><span>Cơ hội ở giai đoạn đề xuất</span></article></section><section class="role-panel"><div class="role-panel-heading"><div><h2>Pipeline cơ hội</h2><p>Theo dõi giai đoạn và ngày dự kiến chốt.</p></div><input class="role-search" type="search" placeholder="Tìm cơ hội hoặc khách hàng" data-sales-search="opportunities" /></div><div data-sales-list="opportunities">${opportunityTable(opportunities)}</div></section><div class="role-message" data-sales-message role="status"></div>`;
    if (section === 'reminders') return `<section class="role-heading"><div><span class="eyebrow">KINH DOANH</span><h1>Nhắc thanh toán</h1><p>Phối hợp theo sát hóa đơn sắp đến hạn và quá hạn.</p></div></section><section class="role-stats"><article class="role-card"><small>Khoản cần nhắc</small><strong>${reminders.filter(item => !item.reminded).length}</strong><span>Chưa ghi nhận đã liên hệ</span></article><article class="role-card"><small>Công nợ cần theo dõi</small><strong>${money(reminders.reduce((sum, item) => sum + item.amount, 0))}</strong><span>${reminders.length} hóa đơn trong danh sách</span></article><article class="role-card"><small>Đã nhắc khách</small><strong>${reminders.filter(item => item.reminded).length}</strong><span>Trong dữ liệu tài khoản</span></article></section><section class="role-panel"><div class="role-panel-heading"><div><h2>Lịch nhắc thanh toán</h2><p>Ghi nhận trạng thái liên hệ khách hàng.</p></div><input class="role-search" type="search" placeholder="Tìm hóa đơn hoặc khách hàng" data-sales-search="reminders" /></div><div data-sales-list="reminders">${reminderTable(reminders)}</div></section><div class="role-message" data-sales-message role="status"></div>`;
    return `<section class="role-heading"><div><span class="eyebrow">KINH DOANH</span><h1>Tổng quan kinh doanh</h1><p>Khách hàng, cơ hội bán hàng và khoản thu cần phối hợp theo dõi.</p></div><button class="button button-primary" data-section="opportunities">Xem cơ hội →</button></section><section class="role-stats"><article class="role-card"><small>Khách hàng phụ trách</small><strong>${customers.length}</strong><span>Khách hàng trong danh sách</span></article><article class="role-card"><small>Cơ hội đang mở</small><strong>${opportunities.length}</strong><span>${money(opportunities.reduce((sum, item) => sum + item.value, 0))} giá trị dự kiến</span></article><article class="role-card"><small>Khoản thu cần theo dõi</small><strong>${reminders.filter(item => !item.reminded).length}</strong><span>${reminders.filter(item => item.status === 'Quá hạn').length} hóa đơn quá hạn</span></article></section><section class="role-panel"><div class="role-panel-heading"><div><h2>Cơ hội gần đây</h2><p>Các cơ hội đang được phụ trách.</p></div><a class="role-inline-link" href="#opportunities" data-section="opportunities">Tất cả cơ hội →</a></div>${opportunityTable(opportunities.slice(0, 2))}</section><section class="role-panel sales-overview-customers"><div class="role-panel-heading"><div><h2>Khách hàng cần theo dõi</h2><p>Khách hàng có khoản thu hoặc tương tác cần chú ý.</p></div><a class="role-inline-link" href="#customers" data-section="customers">Tất cả khách hàng →</a></div>${customersTable(customers.filter(item => item.status !== 'Đang hoạt động'))}</section><div class="role-message" data-sales-message role="status"></div>`;
  }

  function render(section = location.hash.slice(1)) {
    if (!nav.some(item => item.id === section)) section = 'overview';
    content.innerHTML = pageMarkup(section);
    IPCommon.mountShell({ role: 'sales', active: nav.find(item => item.id === section).label, nav, searchItems: getGlobalSearchItems() });
    if (section === 'settings') {
      try {
        const settings = JSON.parse(localStorage.getItem(salesSettingsStorageKey) || '{}');
        workspace.querySelectorAll('[data-sales-setting]').forEach(input => {
          if (typeof settings[input.dataset.salesSetting] === 'boolean') input.checked = settings[input.dataset.salesSetting];
        });
      } catch { /* Settings remain usable when browser storage is unavailable. */ }
    }
    // The shared shell loads company notifications from Supabase for every role.
  }

  window.addEventListener('invoicepilot:global-search-select', event => {
    const { role, section, filter, query } = event.detail || {};
    if (role !== 'sales') return;
    history.pushState(null, '', `#${section}`);
    render(section);
    const input = workspace.querySelector(`[data-sales-search="${filter}"]`);
    if (input) { input.value = query; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });

  workspace.addEventListener('click', event => {
    if (event.target.closest('[data-save-sales-settings]')) {
      const settings = Object.fromEntries([...workspace.querySelectorAll('[data-sales-setting]')].map(input => [input.dataset.salesSetting, input.checked]));
      try { localStorage.setItem(salesSettingsStorageKey, JSON.stringify(settings)); } catch { /* Keep current choices visible for this visit. */ }
      const message = workspace.querySelector('[data-sales-message]');
      if (message) message.textContent = 'Đã lưu cài đặt Kinh doanh.';
      return;
    }
    const navLink = event.target.closest('.shared-nav-link, [data-section]');
    if (navLink) {
      event.preventDefault();
      const section = navLink.dataset.section || navLink.getAttribute('href').slice(1);
      history.pushState(null, '', `#${section}`);
      render(section);
      return;
    }
    const remind = event.target.closest('[data-remind]');
    if (remind) {
      openReminder(Number(remind.dataset.remind));
      return;
    }
    if (event.target.closest('[data-close-reminder]') || event.target.matches('[data-reminder-modal]')) {
      event.target.closest('[data-reminder-modal]')?.remove();
      return;
    }
    const copyReminder = event.target.closest('[data-copy-reminder]');
    if (copyReminder) {
      const text = document.querySelector('[data-reminder-message]')?.value || '';
      const done = () => { copyReminder.textContent = 'Đã sao chép'; };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(() => { const area=document.querySelector('[data-reminder-message]'); area?.select(); document.execCommand('copy'); done(); });
      else { const area=document.querySelector('[data-reminder-message]'); area?.select(); document.execCommand('copy'); done(); }
      return;
    }
    const markReminded = event.target.closest('[data-mark-reminded]');
    if (markReminded) {
      const item = reminders[Number(markReminded.dataset.markReminded)];
      if (item) { item.reminded = true; item.remindedAt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()); }
      saveReminders();
      document.querySelector('[data-reminder-modal]')?.remove();
      render('reminders');
      document.querySelector('[data-sales-message]').textContent = 'Đã ghi nhận đã liên hệ khách hàng về hóa đơn.';
      return;
    }
    const message = document.querySelector('[data-sales-message]');
    const action = event.target.closest('[data-sales-action]');
    const customer = event.target.closest('[data-customer]');
    const opportunity = event.target.closest('[data-opportunity]');
    if (action?.dataset.salesAction === 'add-customer') salesModals.openCustomerForm();
    else if (action?.dataset.salesAction === 'add-opportunity') salesModals.openOpportunityForm();
    else if (customer) salesModals.showCustomer(customer.dataset.customer);
    else if (opportunity) salesModals.showOpportunity(opportunity.dataset.opportunity);
  });
  document.addEventListener('click', event => {
  });

  workspace.addEventListener('input', event => {
    const input = event.target.closest('[data-sales-search]');
    if (!input) return;
    const query = input.value.toLocaleLowerCase('vi');
    const type = input.dataset.salesSearch;
    const target = document.querySelector(`[data-sales-list="${type}"]`);
    if (!target) return;
    if (type === 'customers') target.innerHTML = customersTable(customers.filter(item => `${item.name} ${item.contact} ${item.email}`.toLocaleLowerCase('vi').includes(query)));
    if (type === 'opportunities') target.innerHTML = opportunityTable(opportunities.filter(item => `${item.id} ${item.name} ${item.customer}`.toLocaleLowerCase('vi').includes(query)));
    if (type === 'reminders') target.innerHTML = reminderTable(reminders.filter(item => `${item.customer} ${item.invoice}`.toLocaleLowerCase('vi').includes(query)));
  });
  window.addEventListener('popstate', () => render());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('[data-reminder-modal]')?.remove();
  });
  async function refreshSharedBusinessData() {
    const shared = await IPCommon.getCompanyBusinessData();
    customers.splice(0, customers.length, ...shared.customers);
    const savedReminders = new Map(reminders.map(item => [item.invoice, item]));
    reminders = shared.invoices.filter(item => item.balance > 0).map(item => {
      const old = savedReminders.get(item.id);
      return { invoice: item.id, customer: item.customer, due: item.due, amount: item.balance, status: item.status, reminded: Boolean(old?.reminded), remindedAt: old?.remindedAt || '' };
    });
    saveSalesData();
    render(location.hash.slice(1) || 'overview');
  }

  try {
    await refreshSharedBusinessData();
    IPCommon.subscribeCompanyBusinessData(() => { void refreshSharedBusinessData().catch(error => console.error('Không đồng bộ được dữ liệu doanh nghiệp:', error)); });
  } catch (error) {
    console.error('Không tải được dữ liệu dùng chung:', error);
    content.innerHTML = `<section class="role-panel"><div class="empty-state">Không tải được dữ liệu chung của doanh nghiệp: ${safe(error.message || 'Hãy kiểm tra cấu hình Supabase.')}</div></section>`;
    IPCommon.mountShell({ role: 'sales', active: 'Khách hàng', nav, searchItems: [] });
  }
});

