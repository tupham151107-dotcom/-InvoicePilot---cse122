IPCommon.requireRole('accountant').then(profile => {
  if (!profile) return;
  const invoiceStorageKey = IPCommon.accountStorageKey('invoicepilot-accountant-invoices');
  const settingsStorageKey = IPCommon.accountStorageKey('invoicepilot-accountant-settings');
  let invoices = [];
  try {
    const savedInvoices = JSON.parse(localStorage.getItem(invoiceStorageKey) || 'null');
    if (Array.isArray(savedInvoices)) invoices = savedInvoices;
  } catch { /* Start with an empty account workspace if storage is unavailable. */ }
  const payments = [];
  const customers = [];
  const nav = [
    { id: 'overview', label: 'Tổng quan', href: '#overview', icon: '▦' },
    { id: 'invoices', label: 'Hóa đơn', href: '#invoices', icon: '▤' },
    { id: 'payments', label: 'Thanh toán', href: '#payments', icon: '◷' },
    { id: 'customers', label: 'Khách hàng', href: '#customers', icon: '♙' },
    { id: 'settings', label: 'Cài đặt', href: '#settings', icon: '⚙' }
  ];
  const format = amount => IPCommon.money(amount);
  const globalSearchItems = [
    ...invoices.map(item => ({ title: item.id, kind: 'Hóa đơn', description: `${item.customer} · ${format(item.amount)}`, searchText: `${item.id} ${item.customer} ${item.status}`, section: 'invoices', filter: 'invoice', query: item.id })),
    ...customers.map(item => ({ title: item.name, kind: 'Khách hàng', description: `${item.contact} · ${item.email}`, searchText: `${item.name} ${item.contact} ${item.email} ${item.tax}`, section: 'customers', filter: 'customer', query: item.name }))
  ];
  const safe = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const content = document.getElementById('role-content');
  const workspace = document.getElementById('workspace');

  function invoiceTable(items) {
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Mã hóa đơn</th><th>Khách hàng</th><th>Ngày đến hạn</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>${items.map(row => `<tr><td><strong>${row.id}</strong></td><td>${row.customer}</td><td>${row.due}</td><td><strong>${format(row.amount)}</strong></td><td><span class="role-badge ${row.status === 'Quá hạn' ? 'pending' : ''}">${row.status}</span></td><td><button type="button" data-invoice-id="${row.id}">Chi tiết</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function paymentTable(items) {
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Mã giao dịch</th><th>Mã hóa đơn</th><th>Khách hàng</th><th>Ngày nhận</th><th>Số tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>${items.map(row => `<tr><td><strong>${row.id}</strong></td><td>${row.invoice}</td><td>${row.customer}</td><td>${row.date}</td><td><strong>${format(row.amount)}</strong></td><td><span class="role-badge ${row.status === 'Chờ đối soát' ? 'pending' : ''}">${row.status}</span></td><td>${row.status === 'Chờ đối soát' ? `<button type="button" data-reconcile="${row.id}">Đối soát</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function customerTable(items) {
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Khách hàng</th><th>Người liên hệ</th><th>Email</th><th>Số hóa đơn</th><th>Công nợ</th><th></th></tr></thead><tbody>${items.map(row => `<tr><td><strong>${row.name}</strong></td><td>${row.contact}</td><td>${row.email}</td><td>${row.invoices}</td><td><strong>${format(row.debt)}</strong></td><td><button type="button" data-customer="${safe(row.name)}">Chi tiết</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function showCompanyProfile(companyName, focusInvoiceId = '') {
    document.querySelector('[data-company-profile-modal]')?.remove();
    const company = customers.find(item => item.name === companyName);
    if (!company) return;
    const companyInvoices = invoices.filter(item => item.customer === company.name);
    const invoiceRows = companyInvoices.map(item => `<tr class="${item.id === focusInvoiceId ? 'is-focused' : ''}"><td><strong>${item.id}</strong>${item.id === focusInvoiceId ? '<small class="detail-focus-tag">Hóa đơn đang xem</small>' : ''}</td><td>${item.due}</td><td><strong>${format(item.amount)}</strong></td><td><span class="role-badge ${item.status === 'Quá hạn' ? 'pending' : ''}">${item.status}</span></td><td><button type="button" data-modal-invoice="${item.id}">Xem hóa đơn</button></td></tr>`).join('');
    const modal = document.createElement('div');
    modal.className = 'accountant-modal-backdrop';
    modal.dataset.companyProfileModal = '';
    modal.innerHTML = `<section class="accountant-modal" role="dialog" aria-modal="true" aria-labelledby="company-profile-title">
      <header class="accountant-modal-header"><div><span class="eyebrow">HỒ SƠ KHÁCH HÀNG</span><h2 id="company-profile-title">${safe(company.name)}</h2></div><button class="accountant-modal-close" type="button" aria-label="Đóng" data-close-accountant-modal>×</button></header>
      <div class="company-profile-grid"><div class="company-profile-info"><h3>Thông tin công ty</h3><dl><div><dt>Mã số thuế</dt><dd>${company.tax}</dd></div><div><dt>Người liên hệ</dt><dd>${safe(company.contact)}</dd></div><div><dt>Email</dt><dd>${safe(company.email)}</dd></div><div><dt>Số điện thoại</dt><dd>${company.phone}</dd></div></dl></div><div class="company-profile-balance"><small>CÔNG NỢ HIỆN TẠI</small><strong>${format(company.debt)}</strong><span>${company.invoices} hóa đơn trong hồ sơ</span></div></div>
      <div class="accountant-modal-invoices"><div class="role-panel-heading"><div><h3>Hóa đơn của công ty</h3><p>${companyInvoices.length} hóa đơn đang có trong dữ liệu mẫu.</p></div></div>${companyInvoices.length ? `<div class="table-scroll"><table class="role-table"><thead><tr><th>Mã hóa đơn</th><th>Ngày đến hạn</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>${invoiceRows}</tbody></table></div>` : '<p class="company-empty">Công ty chưa có hóa đơn trong dữ liệu tài khoản.</p>'}</div>
      <footer class="accountant-modal-footer"><button class="button button-primary" type="button" data-close-accountant-modal>Đóng hồ sơ</button></footer>
    </section>`;
    workspace.append(modal);
    modal.querySelector('[data-close-accountant-modal]')?.focus();
  }

  function showInvoicePreview(invoiceId) {
    document.querySelector('[data-company-profile-modal]')?.remove();
    const invoice = invoices.find(item => item.id === invoiceId);
    if (!invoice) return;
    const company = customers.find(item => item.name === invoice.customer);
    const subtotal = Math.round(invoice.amount / 1.1);
    const tax = invoice.amount - subtotal;
    const balance = invoice.status === 'Đã thanh toán' ? 0 : invoice.amount;
    const modal = document.createElement('div');
    modal.className = 'accountant-modal-backdrop invoice-preview-backdrop';
    modal.dataset.companyProfileModal = '';
    modal.innerHTML = `<section class="accountant-modal invoice-preview-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-preview-title">
      <header class="accountant-modal-header invoice-modal-toolbar"><div><span class="eyebrow">CHI TIẾT HÓA ĐƠN</span><h2 id="invoice-preview-title">${invoice.id}</h2></div><div class="invoice-toolbar-actions"><button class="button" type="button" data-print-invoice>In / lưu PDF</button><button class="accountant-modal-close" type="button" aria-label="Đóng" data-close-accountant-modal>×</button></div></header>
      <article class="invoice-paper">
        <div class="invoice-paper-top"><div><span class="invoice-brand-mark">IP</span><h3>CÔNG TY TNHH ÁNH DƯƠNG</h3><p>Mã số thuế: 0312456789<br />Email: ketoan@anhduong.example.vn</p></div><div class="invoice-title-block"><h1>HÓA ĐƠN</h1><span class="role-badge ${invoice.status === 'Quá hạn' ? 'pending' : ''}">${invoice.status}</span></div></div>
        <div class="invoice-meta-grid"><div><small>KHÁCH HÀNG</small><strong>${safe(invoice.customer)}</strong><span>${safe(company?.contact || '')}</span><span>${safe(company?.email || '')}</span><span>MST: ${company?.tax || '—'}</span></div><div><small>THÔNG TIN HÓA ĐƠN</small><strong>${invoice.id}</strong><span>Ngày phát hành: ${invoice.issued}</span><span>Hạn thanh toán: ${invoice.due}</span><span>Loại tiền: VND</span></div></div>
        <div class="invoice-items-wrap"><table class="invoice-items"><thead><tr><th>#</th><th>Hạng mục / mô tả</th><th>SL</th><th>Đơn giá</th><th>Thuế</th><th>Thành tiền</th></tr></thead><tbody><tr><td>1</td><td><strong>Dịch vụ theo hợp đồng</strong><small>Dịch vụ cung cấp trong kỳ tháng 09/2026</small></td><td>1</td><td>${format(subtotal)}</td><td>10%</td><td><strong>${format(invoice.amount)}</strong></td></tr></tbody></table></div>
        <div class="invoice-summary"><div class="invoice-note"><strong>Ghi chú thanh toán</strong><p>Vui lòng ghi mã hóa đơn ${invoice.id} trong nội dung chuyển khoản.</p><p>Vietcombank · Công ty TNHH Ánh Dương<br />0123 4567 890</p></div><div class="invoice-totals"><div><span>Tạm tính</span><strong>${format(subtotal)}</strong></div><div><span>Thuế GTGT (10%)</span><strong>${format(tax)}</strong></div><div class="invoice-grand-total"><span>Tổng cộng</span><strong>${format(invoice.amount)}</strong></div><div><span>Đã thanh toán</span><strong>${format(invoice.amount - balance)}</strong></div><div class="invoice-balance"><span>Còn phải thu</span><strong>${format(balance)}</strong></div></div></div>
        <footer class="invoice-paper-footer">InvoicePilot · Cảm ơn Quý khách đã sử dụng dịch vụ.</footer>
      </article>
      <footer class="accountant-modal-footer invoice-modal-toolbar"><button class="button" type="button" data-close-accountant-modal>Đóng</button><button class="button button-primary" type="button" data-print-invoice>In / lưu PDF</button></footer>
    </section>`;
    workspace.append(modal);
    modal.querySelector('[data-close-accountant-modal]')?.focus();
  }

  function showCreateInvoiceForm() {
    workspace.querySelector('[data-create-invoice-modal]')?.remove();
    const modal = document.createElement('div');
    modal.className = 'accountant-modal-backdrop';
    modal.dataset.createInvoiceModal = '';
    const today = new Date();
    const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const due = new Date(today);
    due.setDate(due.getDate() + 30);
    const dueISO = new Date(due.getTime() - due.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    modal.innerHTML = `<section class="accountant-modal invoice-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-invoice-title"><header class="accountant-modal-header"><div><span class="eyebrow">KẾ TOÁN</span><h2 id="create-invoice-title">Tạo hóa đơn</h2></div><button class="accountant-modal-close" type="button" aria-label="Đóng" data-close-accountant-modal>×</button></header><form class="invoice-create-form" data-create-invoice-form><label>Khách hàng<select name="customer" required>${customers.map(customer => `<option value="${safe(customer.name)}">${safe(customer.name)}</option>`).join('')}</select></label><div class="invoice-create-fields"><label>Ngày phát hành<input name="issued" type="date" value="${todayISO}" required></label><label>Hạn thanh toán<input name="due" type="date" value="${dueISO}" required></label></div><label>Mô tả hàng hóa / dịch vụ<input name="description" type="text" placeholder="Ví dụ: Dịch vụ theo hợp đồng" required></label><label>Tổng tiền (₫)<input name="amount" type="text" inputmode="numeric" autocomplete="off" placeholder="Ví dụ: 12.000.000" required></label><footer class="accountant-modal-footer"><button class="button" type="button" data-close-accountant-modal>Hủy</button><button class="button button-primary" type="submit">Tạo hóa đơn</button></footer></form></section>`;
    workspace.append(modal);
    modal.querySelector('[name="customer"]')?.focus();
  }

  function dateLabel(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  function pageMarkup(section) {
    if (section === 'overview') return `
      <section class="role-heading"><div><span class="eyebrow">KẾ TOÁN</span><h1>Tổng quan kế toán</h1><p>Tình hình hóa đơn, thanh toán và công nợ trong tháng.</p></div><button class="button button-primary accountant-action" data-accountant-action="new-invoice">+ Tạo hóa đơn</button></section>
      <section class="role-stats"><article class="role-card"><small>Hóa đơn cần xử lý</small><strong>${invoices.length}</strong><span>${invoices.filter(item => item.status === 'Quá hạn').length} hóa đơn quá hạn</span></article><article class="role-card"><small>Khoản đã thu tháng này</small><strong>${format(payments.reduce((sum, item) => sum + item.amount, 0))}</strong><span class="positive">Tổng khoản đã ghi nhận</span></article><article class="role-card"><small>Chờ đối soát</small><strong>${payments.filter(item => item.status === 'Chờ đối soát').length}</strong><span>${format(payments.filter(item => item.status === 'Chờ đối soát').reduce((sum, item) => sum + item.amount, 0))}</span></article></section>
      <section class="role-panel"><div class="role-panel-heading"><div><h2>Hóa đơn gần đây</h2><p>Chọn một hóa đơn để xem thông tin.</p></div><a class="role-inline-link" href="#invoices" data-section="invoices">Tất cả hóa đơn →</a></div>${invoiceTable(invoices.slice(0, 3))}</section><div class="role-message" data-accountant-message role="status"></div>`;
    if (section === 'invoices') return `
      <section class="role-heading"><div><span class="eyebrow">KẾ TOÁN</span><h1>Quản lý hóa đơn</h1><p>Theo dõi hạn thanh toán và trạng thái các hóa đơn.</p></div><button class="button button-primary accountant-action" data-accountant-action="new-invoice">+ Tạo hóa đơn</button></section>
      <section class="role-panel"><div class="role-panel-heading"><div><h2>Danh sách hóa đơn</h2><p>${invoices.length} hóa đơn trong dữ liệu tài khoản.</p></div><input class="role-search" type="search" placeholder="Tìm mã hóa đơn hoặc khách hàng" data-search="invoice" /></div><div data-invoice-list>${invoiceTable(invoices)}</div></section><div class="role-message" data-accountant-message role="status"></div>`;
    if (section === 'payments') return `
      <section class="role-heading"><div><span class="eyebrow">KẾ TOÁN</span><h1>Thanh toán &amp; đối soát</h1><p>Kiểm tra khoản tiền nhận được và đối chiếu với hóa đơn.</p></div></section>
      <section class="role-stats"><article class="role-card"><small>Giao dịch tháng này</small><strong>${payments.length}</strong><span>Ghi nhận trong tháng 10</span></article><article class="role-card"><small>Tổng tiền nhận</small><strong>${format(payments.reduce((sum, item) => sum + item.amount, 0))}</strong><span>Trong dữ liệu tài khoản</span></article><article class="role-card"><small>Chờ đối soát</small><strong>${payments.filter(item => item.status === 'Chờ đối soát').length}</strong><span>Cần kiểm tra chứng từ</span></article></section>
      <section class="role-panel"><div class="role-panel-heading"><div><h2>Danh sách thanh toán</h2><p>Đối soát các giao dịch đang chờ xác nhận.</p></div><input class="role-search" type="search" placeholder="Tìm giao dịch hoặc khách hàng" data-search="payment" /></div><div data-payment-list>${paymentTable(payments)}</div></section><div class="role-message" data-accountant-message role="status"></div>`;
    if (section === 'settings') return `
      <section class="role-heading"><div><span class="eyebrow">TÙY CHỈNH</span><h1>Cài đặt</h1><p>Quản lý tùy chọn sử dụng tài khoản Kế toán.</p></div></section>
      <section class="accountant-settings-profile"><div class="accountant-settings-profile-heading"><div><h2>Hồ sơ</h2><p>Thông tin tài khoản đang đăng nhập.</p></div><span class="accountant-settings-avatar">${safe(profile.full_name || 'KT').slice(0, 2).toLocaleUpperCase('vi')}</span></div><div class="accountant-settings-profile-grid"><div><small>Họ và tên</small><strong>${safe(profile.full_name || '')}</strong></div><div><small>Email</small><strong>${safe(profile.email || '')}</strong></div><div><small>Vai trò</small><strong>Kế toán</strong></div><div><small>Không gian làm việc</small><strong>${safe(profile.company_name || '')}</strong></div></div></section>
      <section class="accountant-settings-list">
        <article class="accountant-settings-card"><div><h2>Thông báo</h2><p>Nhận nhắc nhở về hóa đơn và thanh toán cần xử lý.</p></div><label class="accountant-toggle"><input type="checkbox" checked data-setting="notifications"><span></span><b>Bật thông báo</b></label></article>
        <article class="accountant-settings-card"><div><h2>Nhắc hóa đơn đến hạn</h2><p>Hiển thị nhắc nhở khi hóa đơn sắp đến hạn hoặc quá hạn.</p></div><label class="accountant-toggle"><input type="checkbox" checked data-setting="invoice-reminders"><span></span><b>Bật nhắc hạn</b></label></article>
        <article class="accountant-settings-card"><div><h2>Ngôn ngữ</h2><p>Ngôn ngữ sử dụng trong giao diện.</p></div><select class="role-search accountant-language"><option selected>Tiếng Việt</option><option>English</option></select></article>
      </section><button class="button button-primary accountant-settings-save" type="button" data-save-accountant-settings>Lưu cài đặt</button><div class="role-message" data-accountant-message role="status" aria-live="polite"></div>`;
    return `
      <section class="role-heading"><div><span class="eyebrow">KẾ TOÁN</span><h1>Khách hàng</h1><p>Thông tin liên hệ, hóa đơn và công nợ của khách hàng.</p></div></section>
      <section class="role-stats"><article class="role-card"><small>Tổng khách hàng</small><strong>${customers.length}</strong><span>Trong dữ liệu tài khoản</span></article><article class="role-card"><small>Khách hàng có công nợ</small><strong>${customers.filter(item => item.debt > 0).length}</strong><span>Cần theo dõi thanh toán</span></article><article class="role-card"><small>Tổng phải thu</small><strong>${format(customers.reduce((sum, item) => sum + item.debt, 0))}</strong><span>Tổng công nợ hiện tại</span></article></section>
      <section class="role-panel"><div class="role-panel-heading"><div><h2>Danh sách khách hàng</h2><p>Tra cứu người liên hệ và công nợ.</p></div><input class="role-search" type="search" placeholder="Tìm tên, email hoặc người liên hệ" data-search="customer" /></div><div data-customer-list>${customerTable(customers)}</div></section><div class="role-message" data-accountant-message role="status"></div>`;
  }

  function render(section = location.hash.slice(1)) {
    if (!nav.some(item => item.id === section)) section = 'overview';
    content.innerHTML = pageMarkup(section);
    IPCommon.mountShell({ role: 'accountant', active: nav.find(item => item.id === section).label, nav, searchItems: globalSearchItems });
    if (section === 'settings') {
      try {
        const settings = JSON.parse(localStorage.getItem(settingsStorageKey) || '{}');
        for (const input of workspace.querySelectorAll('[data-setting]')) {
          if (typeof settings[input.dataset.setting] === 'boolean') input.checked = settings[input.dataset.setting];
        }
        if (settings.language) workspace.querySelector('.accountant-language').value = settings.language;
      } catch { /* Settings remain usable when browser storage is unavailable. */ }
    }
    const bell = workspace.querySelector('[data-shared-notification-bell="accountant"]');
    bell?.addEventListener('click', () => {
      const oldPanel = workspace.querySelector('.accountant-notification-menu');
      if (oldPanel) { oldPanel.remove(); return; }
      const unread = IPCommon.hasUnreadNotifications('accountant');
      const panel = document.createElement('section');
      panel.className = 'accountant-notification-menu';
      panel.innerHTML = `<div class="accountant-notification-heading"><strong>Thông báo Kế toán</strong><span>${unread ? 'Mới' : 'Đã xem'}</span></div><article><b>Có khoản thanh toán chờ đối soát</b><small>3 giao dịch mới cần kiểm tra trong mục Thanh toán.</small><button type="button" class="accountant-notification-link" data-section="payments">Mở thanh toán</button></article><button type="button" class="accountant-notification-mark" data-accountant-mark-read ${unread ? '' : 'disabled'}>Đánh dấu đã đọc</button>`;
      bell.closest('.shared-header-actions').append(panel);
    });
  }

  window.addEventListener('invoicepilot:global-search-select', event => {
    const { role, section, filter, query } = event.detail || {};
    if (role !== 'accountant') return;
    history.pushState(null, '', `#${section}`);
    render(section);
    const input = workspace.querySelector(`[data-search="${filter}"]`);
    if (input) { input.value = query; filterList(input); }
  });

  function filterList(input) {
    const query = input.value.toLocaleLowerCase('vi');
    const type = input.dataset.search;
    if (type === 'invoice') document.querySelector('[data-invoice-list]').innerHTML = invoiceTable(invoices.filter(row => `${row.id} ${row.customer}`.toLocaleLowerCase('vi').includes(query)));
    if (type === 'payment') document.querySelector('[data-payment-list]').innerHTML = paymentTable(payments.filter(row => `${row.id} ${row.invoice} ${row.customer}`.toLocaleLowerCase('vi').includes(query)));
    if (type === 'customer') document.querySelector('[data-customer-list]').innerHTML = customerTable(customers.filter(row => `${row.name} ${row.contact} ${row.email}`.toLocaleLowerCase('vi').includes(query)));
  }

  workspace.addEventListener('click', event => {
    const bell = event.target.closest('[data-shared-notification-bell="accountant"]');
    if (bell) return;
    const markRead = event.target.closest('[data-accountant-mark-read]');
    if (markRead) {
      IPCommon.markNotificationsRead('accountant');
      workspace.querySelector('.accountant-notification-menu')?.remove();
      workspace.querySelector('[data-shared-notification-bell="accountant"] .notification-dot-indicator')?.remove();
      return;
    }
    const link = event.target.closest('.shared-nav-link, [data-section]');
    if (link) {
      event.preventDefault();
      const section = link.dataset.section || link.getAttribute('href').slice(1);
      history.replaceState(null, '', `#${section}`);
      render(section);
      return;
    }
    if (event.target.closest('[data-save-accountant-settings]')) {
      const settings = Object.fromEntries([...workspace.querySelectorAll('[data-setting]')].map(input => [input.dataset.setting, input.checked]));
      settings.language = workspace.querySelector('.accountant-language')?.value || 'Tiếng Việt';
      try { localStorage.setItem(settingsStorageKey, JSON.stringify(settings)); } catch { /* Keep the current settings visible for this visit. */ }
      const message = workspace.querySelector('[data-accountant-message]');
      if (message) message.textContent = 'Đã lưu cài đặt.';
      return;
    }
    const reconcile = event.target.closest('[data-reconcile]');
    if (reconcile) {
      const payment = payments.find(item => item.id === reconcile.dataset.reconcile);
      if (payment) payment.status = 'Đã đối soát';
      render('payments');
      document.querySelector('[data-accountant-message]').textContent = `Đã đối soát giao dịch ${reconcile.dataset.reconcile}.`;
      return;
    }
    const modalInvoice = event.target.closest('[data-modal-invoice]');
    if (modalInvoice) {
      showInvoicePreview(modalInvoice.dataset.modalInvoice);
      return;
    }
    if (event.target.closest('[data-print-invoice]')) {
      window.print();
      return;
    }
    const modalBackdrop = event.target.closest('[data-company-profile-modal], [data-create-invoice-modal]');
    if (event.target.closest('[data-close-accountant-modal]') || (modalBackdrop && event.target === modalBackdrop)) {
      modalBackdrop?.remove();
      return;
    }
    const invoice = event.target.closest('[data-invoice-id]');
    const customer = event.target.closest('[data-customer]');
    const action = event.target.closest('[data-accountant-action]');
    const message = document.querySelector('[data-accountant-message]');
    if (invoice) {
      const selectedInvoice = invoices.find(item => item.id === invoice.dataset.invoiceId);
      if (selectedInvoice) showCompanyProfile(selectedInvoice.customer, selectedInvoice.id);
    } else if (customer) showCompanyProfile(customer.dataset.customer);
    else if (action?.dataset.accountantAction === 'new-invoice') showCreateInvoiceForm();
  });
  workspace.addEventListener('submit', event => {
    const form = event.target.closest('[data-create-invoice-form]');
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const amount = Number(String(data.get('amount')).replace(/\D/g, ''));
    const maxNumber = invoices.reduce((max, item) => Math.max(max, Number(item.id.match(/(\d+)$/)?.[1] || 0)), 0);
    const invoice = {
      id: `IP-${new Date().getFullYear()}-${String(maxNumber + 1).padStart(3, '0')}`,
      customer: String(data.get('customer')),
      issued: dateLabel(String(data.get('issued'))),
      due: dateLabel(String(data.get('due'))),
      amount,
      description: String(data.get('description')).trim(),
      status: 'Chưa thanh toán'
    };
    invoices.unshift(invoice);
    try { localStorage.setItem(invoiceStorageKey, JSON.stringify(invoices)); } catch { /* Keep the new invoice for this visit. */ }
    workspace.querySelector('[data-create-invoice-modal]')?.remove();
    const section = location.hash.slice(1) || 'overview';
    render(section);
    const message = workspace.querySelector('[data-accountant-message]');
    if (message) message.textContent = `Đã tạo hóa đơn ${invoice.id} cho ${invoice.customer}.`;
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.accountant-notification-menu') && !event.target.closest('[data-shared-notification-bell="accountant"]')) workspace.querySelector('.accountant-notification-menu')?.remove();
  });
  workspace.addEventListener('input', event => {
    const amountInput = event.target.closest('[data-create-invoice-form] [name="amount"]');
    if (amountInput) {
      const digits = amountInput.value.replace(/\D/g, '');
      amountInput.value = digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
      return;
    }
    if (event.target.matches('[data-search]')) filterList(event.target);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('[data-company-profile-modal]')?.remove();
  });
  render();
});

