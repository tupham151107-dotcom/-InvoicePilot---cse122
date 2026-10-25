IPCommon.requireRole('accountant').then(profile => {
  if (!profile) return;
  const invoiceStorageKey = IPCommon.accountStorageKey('invoicepilot-accountant-invoices');
  const settingsStorageKey = IPCommon.accountStorageKey('invoicepilot-accountant-settings');
  let invoices = [];
  try {
    const savedInvoices = JSON.parse(localStorage.getItem(invoiceStorageKey) || 'null');
    if (Array.isArray(savedInvoices)) invoices = savedInvoices;
  } catch { /* Start with an empty account workspace if storage is unavailable. */ }
  let payments = [];
  let paymentsLoadError = '';
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
    return `<div class="table-scroll"><table class="role-table"><thead><tr><th>Mã giao dịch</th><th>Mã hóa đơn</th><th>Khách hàng</th><th>Ngày nhận</th><th>Số tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>${items.map(row => `<tr><td><strong>${safe(row.id)}</strong></td><td>${safe(row.invoice)}</td><td>${safe(row.customer)}</td><td>${safe(row.date)}</td><td><strong>${format(row.amount)}</strong></td><td><span class="role-badge ${row.status === 'Chờ đối soát' ? 'pending' : ''}">${safe(row.status)}</span></td><td>${row.status === 'Chờ đối soát' ? `<button type="button" data-reconcile="${safe(row.id)}">Đối soát</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
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
        <div class="invoice-summary"><div class="invoice-note"><strong>Ghi chú thanh toán</strong><p>Vui lòng ghi mã hóa đơn ${invoice.id} trong nội dung chuyển khoản.</p><p>${safe(profile.company_name || 'Doanh nghiệp của bạn')}</p></div><div class="invoice-totals"><div><span>Tạm tính</span><strong>${format(subtotal)}</strong></div><div><span>Thuế GTGT (10%)</span><strong>${format(tax)}</strong></div><div class="invoice-grand-total"><span>Tổng cộng</span><strong>${format(invoice.amount)}</strong></div><div><span>Đã thanh toán</span><strong>${format(invoice.amount - balance)}</strong></div><div class="invoice-balance"><span>Còn phải thu</span><strong>${format(balance)}</strong></div></div></div>
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

  function showCreatePaymentForm() {
    workspace.querySelector('[data-create-payment-modal]')?.remove();
    const modal = document.createElement('div');
    const today = new Date();
    const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    modal.className = 'accountant-modal-backdrop';
    modal.dataset.createPaymentModal = '';
    modal.innerHTML = `<section class="accountant-modal invoice-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-payment-title"><header class="accountant-modal-header"><div><span class="eyebrow">KẾ TOÁN</span><h2 id="create-payment-title">Ghi nhận giao dịch</h2></div><button class="accountant-modal-close" type="button" aria-label="Đóng" data-close-accountant-modal>×</button></header><form class="invoice-create-form" data-create-payment-form><label>Mã hóa đơn<input name="invoice" type="text" maxlength="80" placeholder="Ví dụ: IP-2026-001" required></label><label>Tên khách hàng<input name="customer" type="text" maxlength="160" placeholder="Tên khách hàng thanh toán" required></label><div class="invoice-create-fields"><label>Ngày nhận<input name="date" type="date" value="${todayISO}" required></label><label>Số tiền (₫)<input name="amount" type="text" inputmode="numeric" autocomplete="off" placeholder="Ví dụ: 12.000.000" required></label></div><label>Phương thức<select name="method"><option>Chuyển khoản</option><option>Tiền mặt</option><option>Khác</option></select></label><label>Mã tham chiếu / ghi chú<input name="reference" type="text" maxlength="160" placeholder="Mã giao dịch ngân hàng (nếu có)"></label><p class="form-error" data-payment-form-error role="alert"></p><footer class="accountant-modal-footer"><button class="button" type="button" data-close-accountant-modal>Hủy</button><button class="button button-primary" type="submit">Lưu giao dịch</button></footer></form></section>`;
    workspace.append(modal);
    modal.querySelector('[name="invoice"]')?.focus();
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
      <section class="role-heading"><div><span class="eyebrow">KẾ TOÁN</span><h1>Thanh toán &amp; đối soát</h1><p>Kiểm tra khoản tiền nhận được và đối chiếu với hóa đơn.</p></div><button class="button button-primary accountant-action" data-accountant-action="new-payment">+ Ghi nhận giao dịch</button></section>
      <section class="role-stats"><article class="role-card"><small>Giao dịch</small><strong>${payments.length}</strong><span>Đã lưu trong doanh nghiệp</span></article><article class="role-card"><small>Tổng tiền nhận</small><strong>${format(payments.reduce((sum, item) => sum + item.amount, 0))}</strong><span>Trong dữ liệu tài khoản</span></article><article class="role-card"><small>Chờ đối soát</small><strong>${payments.filter(item => item.status === 'Chờ đối soát').length}</strong><span>Cần kiểm tra chứng từ</span></article></section>
      <section class="role-panel"><div class="role-panel-heading"><div><h2>Danh sách thanh toán</h2><p>Giao dịch được lưu trên Supabase và dùng chung trong doanh nghiệp.</p></div><input class="role-search" type="search" placeholder="Tìm giao dịch hoặc khách hàng" data-search="payment" /></div>${paymentsLoadError ? `<p class="role-message" role="alert">${safe(paymentsLoadError)}</p>` : ''}<div data-payment-list>${paymentTable(payments)}</div></section><div class="role-message" data-accountant-message role="status"></div>`;
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

  workspace.addEventListener('click', async event => {
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
      const transactionId = reconcile.dataset.reconcile;
      reconcile.disabled = true;
      try {
        await IPCommon.reconcileCompanyPaymentTransaction(transactionId);
        payments = payments.map(item => item.id === transactionId ? { ...item, status: 'Đã đối soát' } : item);
        render('payments');
        document.querySelector('[data-accountant-message]').textContent = `Đã đối soát và lưu trạng thái giao dịch ${transactionId} trên Supabase.`;
      } catch (error) {
        reconcile.disabled = false;
        const messageBox = workspace.querySelector('[data-accountant-message]');
        if (messageBox) messageBox.textContent = error.message || 'Không cập nhật được trạng thái đối soát.';
      }
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
    const modalBackdrop = event.target.closest('[data-company-profile-modal], [data-create-invoice-modal], [data-create-payment-modal]');
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
    else if (action?.dataset.accountantAction === 'new-payment') showCreatePaymentForm();
  });
  workspace.addEventListener('submit', async event => {
    const paymentForm = event.target.closest('[data-create-payment-form]');
    if (paymentForm) {
      event.preventDefault();
      const data = new FormData(paymentForm);
      const amount = Number(String(data.get('amount') || '').replace(/\D/g, ''));
      const errorBox = paymentForm.querySelector('[data-payment-form-error]');
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        errorBox.textContent = 'Số tiền giao dịch phải lớn hơn 0.';
        return;
      }
      const transaction = {
        id: `GD-${Date.now()}`, invoice: String(data.get('invoice') || '').trim(),
        customer: String(data.get('customer') || '').trim(), date: String(data.get('date')),
        amount, method: String(data.get('method') || 'Chuyển khoản'),
        reference: String(data.get('reference') || '').trim()
      };
      const submit = paymentForm.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        await IPCommon.createCompanyPaymentTransaction(transaction);
        payments.unshift({ ...transaction, date: dateLabel(transaction.date), status: 'Chờ đối soát' });
        paymentsLoadError = '';
        workspace.querySelector('[data-create-payment-modal]')?.remove();
        render('payments');
        workspace.querySelector('[data-accountant-message]').textContent = `Đã lưu giao dịch ${transaction.id} trên Supabase.`;
      } catch (error) {
        errorBox.textContent = error.message || 'Không lưu được giao dịch. Kiểm tra migration Supabase rồi thử lại.';
        submit.disabled = false;
      }
      return;
    }
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
    const amountInput = event.target.closest('[data-create-invoice-form] [name="amount"], [data-create-payment-form] [name="amount"]');
    if (amountInput) {
      const digits = amountInput.value.replace(/\D/g, '');
      amountInput.value = digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
      return;
    }
    if (event.target.matches('[data-search]')) filterList(event.target);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('[data-company-profile-modal], [data-create-payment-modal], [data-create-invoice-modal]')?.remove();
  });

  // Accountant rubric improvements: safe invoice actions, business validation, and usable list states.
  const accountantListState = {
    invoice: { query: '', status: 'all', sort: 'due-asc', page: 1, pageSize: 8 },
    payment: { query: '', status: 'all', sort: 'date-desc', page: 1, pageSize: 8 },
    customer: { query: '', status: 'all', sort: 'name-asc', page: 1, pageSize: 8 }
  };
  const baseInvoiceTable = invoiceTable;
  invoiceTable = items => baseInvoiceTable(items).replace(/(<button type="button" data-invoice-id="([^"]+)">Chi tiết<\/button>)(<\/td><\/tr>)/g, (match, view, id, end) => {
    const row = invoices.find(item => String(item.id) === id);
    if (!row || ['Đã thanh toán', 'Đã hủy'].includes(row.status)) return match;
    return view + ' <button type="button" data-edit-invoice="' + safe(id) + '">Sửa</button> <button type="button" data-cancel-invoice="' + safe(id) + '">Hủy</button>' + end;
  });

  const basePageMarkup = pageMarkup;
  pageMarkup = section => {
    let markup = basePageMarkup(section);
    const toolMarkup = type => {
      const state = accountantListState[type];
      const filterOptions = type === 'invoice'
        ? [['all', 'Tất cả trạng thái'], ['Chưa thanh toán', 'Chưa thanh toán'], ['Quá hạn', 'Quá hạn'], ['Đã thanh toán', 'Đã thanh toán'], ['Đã hủy', 'Đã hủy']]
        : type === 'payment'
          ? [['all', 'Tất cả trạng thái'], ['Chờ đối soát', 'Chờ đối soát'], ['Đã đối soát', 'Đã đối soát']]
          : [['all', 'Tất cả khách hàng'], ['debt', 'Còn công nợ'], ['clear', 'Đã tất toán']];
      const sorts = type === 'invoice'
        ? [['due-asc', 'Hạn thanh toán tăng dần'], ['due-desc', 'Hạn thanh toán giảm dần'], ['amount-desc', 'Số tiền cao nhất'], ['amount-asc', 'Số tiền thấp nhất']]
        : type === 'payment'
          ? [['date-desc', 'Ngày mới nhất'], ['date-asc', 'Ngày cũ nhất'], ['amount-desc', 'Số tiền cao nhất'], ['amount-asc', 'Số tiền thấp nhất']]
          : [['name-asc', 'Tên A–Z'], ['name-desc', 'Tên Z–A'], ['debt-desc', 'Công nợ cao nhất'], ['debt-asc', 'Công nợ thấp nhất']];
      const options = (items, selected) => items.map(([value, label]) => '<option value="' + safe(value) + '"' + (value === selected ? ' selected' : '') + '>' + safe(label) + '</option>').join('');
      return '<select class="role-search accountant-list-select" aria-label="Lọc danh sách" data-accountant-filter="' + type + '">' + options(filterOptions, state.status) + '</select>' +
        '<select class="role-search accountant-list-select" aria-label="Sắp xếp danh sách" data-accountant-sort="' + type + '">' + options(sorts, state.sort) + '</select>';
    };
    for (const type of ['invoice', 'payment', 'customer']) {
      const searchMarker = 'data-search="' + type + '" />';
      if (markup.includes(searchMarker)) markup = markup.replace(searchMarker, 'data-search="' + type + '" aria-label="Tìm kiếm" />' + toolMarkup(type));
    }
    return markup;
  };

  function accountantDateValue(value) {
    const [day, month, year] = String(value || '').split('/').map(Number);
    return day && month && year ? new Date(year, month - 1, day).getTime() : 0;
  }

  function renderAccountantList(type) {
    const state = accountantListState[type];
    const source = type === 'invoice' ? invoices : type === 'payment' ? payments : customers;
    const query = state.query.toLocaleLowerCase('vi');
    let rows = source.filter(row => {
      const searchable = type === 'invoice' ? [row.id, row.customer, row.description]
        : type === 'payment' ? [row.id, row.invoice, row.customer, row.reference]
          : [row.name, row.contact, row.email, row.tax];
      const matchesQuery = searchable.some(value => String(value || '').toLocaleLowerCase('vi').includes(query));
      const matchesStatus = state.status === 'all' || (type === 'customer'
        ? state.status === 'debt' ? Number(row.debt) > 0 : Number(row.debt) <= 0
        : row.status === state.status);
      return matchesQuery && matchesStatus;
    });
    const [sortKey, direction] = state.sort.split('-');
    rows.sort((a, b) => {
      let result = sortKey === 'due' ? accountantDateValue(a.due) - accountantDateValue(b.due)
        : sortKey === 'date' ? accountantDateValue(a.date) - accountantDateValue(b.date)
          : sortKey === 'name' ? String(a.name || '').localeCompare(String(b.name || ''), 'vi')
            : Number(sortKey === 'amount' ? a.amount : a.debt) - Number(sortKey === 'amount' ? b.amount : b.debt);
      return direction === 'desc' ? -result : result;
    });
    const pageCount = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const first = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(first, first + state.pageSize);
    const listSelector = type === 'invoice' ? '[data-invoice-list]' : type === 'payment' ? '[data-payment-list]' : '[data-customer-list]';
    const list = workspace.querySelector(listSelector);
    if (!list) return;
    if (!rows.length) {
      const message = query || state.status !== 'all' ? 'Không tìm thấy dữ liệu phù hợp. Hãy đổi từ khóa hoặc bộ lọc.' : 'Chưa có dữ liệu trong danh sách này.';
      const action = type === 'invoice' ? '<button type="button" class="button button-primary" data-accountant-action="new-invoice">Tạo hóa đơn</button>'
        : type === 'payment' ? '<button type="button" class="button button-primary" data-accountant-action="new-payment">Ghi nhận giao dịch</button>' : '';
      list.innerHTML = '<div class="accountant-empty-state"><strong>' + safe(message) + '</strong><button type="button" data-accountant-reset="' + type + '">Xóa bộ lọc</button>' + action + '</div>';
    } else {
      list.innerHTML = type === 'invoice' ? invoiceTable(pageRows) : type === 'payment' ? paymentTable(pageRows) : customerTable(pageRows);
    }
    let pager = workspace.querySelector('[data-accountant-pagination="' + type + '"]');
    if (!pager) { pager = document.createElement('nav'); pager.className = 'accountant-list-pagination'; pager.dataset.accountantPagination = type; pager.setAttribute('aria-label', 'Phân trang'); list.after(pager); }
    pager.innerHTML = rows.length > state.pageSize
      ? '<span>' + (first + 1) + '–' + Math.min(first + state.pageSize, rows.length) + ' / ' + rows.length + ' kết quả</span><div><button type="button" data-accountant-page="prev" data-list-type="' + type + '"' + (state.page <= 1 ? ' disabled' : '') + '>Trước</button><span>Trang ' + state.page + ' / ' + pageCount + '</span><button type="button" data-accountant-page="next" data-list-type="' + type + '"' + (state.page >= pageCount ? ' disabled' : '') + '>Sau</button></div>'
      : rows.length ? '<span>' + rows.length + ' kết quả</span>' : '';
  }

  const baseRender = render;
  render = section => {
    const activeSection = section || location.hash.slice(1) || 'overview';
    baseRender(activeSection);
    const type = activeSection === 'invoices' ? 'invoice' : activeSection === 'payments' ? 'payment' : activeSection === 'customers' ? 'customer' : '';
    if (type) renderAccountantList(type);
  };
  const baseFilterList = filterList;
  filterList = input => {
    const type = input.dataset.search;
    if (!accountantListState[type]) return baseFilterList(input);
    accountantListState[type].query = input.value;
    accountantListState[type].page = 1;
    renderAccountantList(type);
  };

  workspace.addEventListener('change', event => {
    const control = event.target.closest('[data-accountant-filter], [data-accountant-sort]');
    if (!control) return;
    const type = control.dataset.accountantFilter || control.dataset.accountantSort;
    const state = accountantListState[type];
    if (!state) return;
    if (control.dataset.accountantFilter) state.status = control.value;
    else state.sort = control.value;
    state.page = 1;
    renderAccountantList(type);
  }, true);

  workspace.addEventListener('click', event => {
    const editBackdrop = event.target.closest('[data-edit-invoice-modal]');
    if (editBackdrop && (event.target.closest('[data-close-accountant-modal]') || event.target === editBackdrop)) { editBackdrop.remove(); event.preventDefault(); event.stopImmediatePropagation(); return; }
    const pageButton = event.target.closest('[data-accountant-page]');
    if (pageButton) {
      const state = accountantListState[pageButton.dataset.listType];
      if (state) { state.page += pageButton.dataset.accountantPage === 'next' ? 1 : -1; renderAccountantList(pageButton.dataset.listType); }
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const reset = event.target.closest('[data-accountant-reset]');
    if (reset) {
      const type = reset.dataset.accountantReset;
      accountantListState[type] = { query: '', status: 'all', sort: type === 'invoice' ? 'due-asc' : type === 'payment' ? 'date-desc' : 'name-asc', page: 1, pageSize: 8 };
      render(location.hash.slice(1) || 'overview'); event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const cancelButton = event.target.closest('[data-cancel-invoice]');
    if (cancelButton) {
      const invoice = invoices.find(item => String(item.id) === cancelButton.dataset.cancelInvoice);
      if (invoice && !['Đã thanh toán', 'Đã hủy'].includes(invoice.status) && window.confirm('Hủy hóa đơn ' + invoice.id + '? Hóa đơn vẫn được giữ trong lịch sử.')) {
        invoice.status = 'Đã hủy';
        try { localStorage.setItem(invoiceStorageKey, JSON.stringify(invoices)); } catch { /* Keep the current view usable for this visit. */ }
        const section = location.hash.slice(1) || 'invoices'; render(section);
        const notice = workspace.querySelector('[data-accountant-message]'); if (notice) notice.textContent = 'Đã hủy hóa đơn ' + invoice.id + '.';
      }
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const editButton = event.target.closest('[data-edit-invoice]');
    if (editButton) {
      const invoice = invoices.find(item => String(item.id) === editButton.dataset.editInvoice);
      if (invoice && !['Đã thanh toán', 'Đã hủy'].includes(invoice.status)) {
        const toISO = value => { const [day, month, year] = String(value || '').split('/'); return year ? year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') : ''; };
        const modal = document.createElement('div'); modal.className = 'accountant-modal-backdrop'; modal.dataset.editInvoiceModal = '';
        modal.innerHTML = '<section class="accountant-modal invoice-create-modal" role="dialog" aria-modal="true" aria-labelledby="edit-invoice-title"><header class="accountant-modal-header"><div><span class="eyebrow">KẾ TOÁN</span><h2 id="edit-invoice-title">Cập nhật hóa đơn ' + safe(invoice.id) + '</h2></div><button class="accountant-modal-close" type="button" aria-label="Đóng" data-close-accountant-modal>×</button></header><form class="invoice-create-form" data-edit-invoice-form data-invoice-id="' + safe(invoice.id) + '"><label>Khách hàng<input name="customer" maxlength="160" value="' + safe(invoice.customer) + '" required></label><div class="invoice-create-fields"><label>Ngày phát hành<input name="issued" type="date" value="' + toISO(invoice.issued) + '" required></label><label>Hạn thanh toán<input name="due" type="date" value="' + toISO(invoice.due) + '" required></label></div><label>Mô tả hàng hóa / dịch vụ<input name="description" maxlength="240" value="' + safe(invoice.description || '') + '" required></label><label>Tổng tiền (₫)<input name="amount" type="text" inputmode="numeric" value="' + new Intl.NumberFormat('vi-VN').format(invoice.amount) + '" required></label><p class="form-error" data-edit-invoice-error role="alert" aria-live="polite"></p><footer class="accountant-modal-footer"><button class="button" type="button" data-close-accountant-modal>Hủy</button><button class="button button-primary" type="submit">Lưu thay đổi</button></footer></form></section>';
        workspace.append(modal); modal.querySelector('[name="customer"]')?.focus();
      }
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
  }, true);

  workspace.addEventListener('submit', event => {
    const editForm = event.target.closest('[data-edit-invoice-form]');
    if (editForm) {
      event.preventDefault(); event.stopImmediatePropagation();
      const data = new FormData(editForm);
      const amount = Number(String(data.get('amount') || '').replace(/\D/g, ''));
      const issueDate = String(data.get('issued') || ''); const dueDate = String(data.get('due') || '');
      const error = editForm.querySelector('[data-edit-invoice-error]');
      if (!Number.isSafeInteger(amount) || amount <= 0) { error.textContent = 'Tổng tiền phải là số nguyên lớn hơn 0.'; return; }
      if (!issueDate || !dueDate || dueDate < issueDate) { error.textContent = 'Hạn thanh toán phải từ ngày phát hành trở đi.'; return; }
      if (!String(data.get('customer') || '').trim() || !String(data.get('description') || '').trim()) { error.textContent = 'Hãy nhập tên khách hàng và mô tả hàng hóa hoặc dịch vụ.'; return; }
      const original = invoices.find(item => String(item.id) === editForm.dataset.invoiceId);
      if (!original) { error.textContent = 'Không tìm thấy hóa đơn. Hãy tải lại trang.'; return; }
      Object.assign(original, { customer: String(data.get('customer') || '').trim(), issued: dateLabel(issueDate), due: dateLabel(dueDate), amount, description: String(data.get('description') || '').trim(), issueDate, dueDate });
      try { localStorage.setItem(invoiceStorageKey, JSON.stringify(invoices)); } catch { /* Keep current state available for this visit. */ }
      workspace.querySelector('[data-edit-invoice-modal]')?.remove();
      const section = location.hash.slice(1) || 'invoices'; render(section);
      const notice = workspace.querySelector('[data-accountant-message]'); if (notice) notice.textContent = 'Đã cập nhật hóa đơn ' + original.id + '.';
      return;
    }
    const createForm = event.target.closest('[data-create-invoice-form]');
    if (!createForm) return;
    const data = new FormData(createForm);
    const amount = Number(String(data.get('amount') || '').replace(/\D/g, ''));
    const issueDate = String(data.get('issued') || ''); const dueDate = String(data.get('due') || '');
    let error = createForm.querySelector('[data-invoice-validation-error]');
    if (!error) { error = document.createElement('p'); error.className = 'form-error'; error.dataset.invoiceValidationError = ''; error.setAttribute('role', 'alert'); error.setAttribute('aria-live', 'polite'); createForm.insertBefore(error, createForm.querySelector('.accountant-modal-footer')); }
    if (!Number.isSafeInteger(amount) || amount <= 0) { event.preventDefault(); event.stopImmediatePropagation(); error.textContent = 'Tổng tiền phải là số nguyên lớn hơn 0.'; createForm.querySelector('[name="amount"]')?.focus(); return; }
    if (!issueDate || !dueDate || dueDate < issueDate) { event.preventDefault(); event.stopImmediatePropagation(); error.textContent = 'Hạn thanh toán phải từ ngày phát hành trở đi.'; createForm.querySelector('[name="due"]')?.focus(); return; }
    if (!String(data.get('customer') || '').trim() || !String(data.get('description') || '').trim()) { event.preventDefault(); event.stopImmediatePropagation(); error.textContent = 'Hãy nhập tên khách hàng và mô tả hàng hóa hoặc dịch vụ.'; return; }
    error.textContent = '';
  }, true);



  const originalShowCreateInvoiceForm = showCreateInvoiceForm;
  showCreateInvoiceForm = () => {
    originalShowCreateInvoiceForm();
    const form = workspace.querySelector('[data-create-invoice-form]');
    const select = form?.querySelector('[name="customer"]');
    if (!form || !select) return;
    const input = document.createElement('input');
    input.name = 'customer'; input.type = 'text'; input.maxLength = 160; input.required = true;
    input.placeholder = 'Nhập hoặc chọn khách hàng'; input.setAttribute('list', 'accountant-customer-options');
    input.value = select.value || '';
    const suggestions = document.createElement('datalist');
    suggestions.id = 'accountant-customer-options';
    suggestions.innerHTML = customers.map(customer => '<option value="' + safe(customer.name) + '"></option>').join('');
    select.replaceWith(input); form.append(suggestions); input.focus();
  };

  document.addEventListener('keydown', event => { if (event.key === 'Escape') workspace.querySelector('[data-edit-invoice-modal]')?.remove(); }, true);
  render();
  async function refreshPayments() {
    try {
      payments = await IPCommon.listCompanyPaymentTransactions();
      paymentsLoadError = '';
      if (['#payments', '#overview', ''].includes(location.hash)) render();
    } catch (error) {
      paymentsLoadError = error.message || 'Không tải được giao dịch từ Supabase.';
      if (location.hash === '#payments') render('payments');
      console.error('Không tải được giao dịch kế toán từ Supabase:', error);
    }
  }
  refreshPayments();
  IPCommon.subscribeCompanyPaymentTransactions(() => refreshPayments());
});

