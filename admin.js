//
window.INVOICEPILOT_ENTRY_ROLE = 'admin';

function adminOverview() {
  if (!state.invoices.length && !state.customers.length) {
    const content = `
      <div class="content admin-overview-content">
        <div class="admin-heading">
          <div>
            <span class="admin-eyebrow">QUẢN TRỊ VIÊN</span>
            <h1>Tổng quan hệ thống</h1>
            <p>
              Xin chào ${escapeHTML(state.currentUser || 'Quản trị viên')},
              hãy bắt đầu thiết lập doanh nghiệp của bạn.
            </p>
          </div>
        </div>

        <section class="panel">
          <div class="panel-title">
            <div>
              <h2>Chưa có dữ liệu</h2>
              <p>
                Không gian doanh nghiệp mới đã được tạo trống. Thêm khách hàng
                và hóa đơn để xem số liệu thực tế.
              </p>
            </div>
          </div>

          <div class="summary-line">
            <span>Khách hàng</span>
            <strong>0</strong>
          </div>
          <div class="summary-line">
            <span>Hóa đơn</span>
            <strong>0</strong>
          </div>
          <div class="summary-line">
            <span>Tổng giá trị hóa đơn</span>
            <strong>${money(0)}</strong>
          </div>
        </section>
      </div>
    `;

    return shell(content);
  }

  const months = ['T5', 'T6', 'T7', 'T8', 'T9', 'T10'];
  const costs = [38, 52, 36, 61, 48, 67];
  const income = [58, 76, 64, 91, 81, 111];

  const bars = months
    .map((month, index) => `
      <div class="month-bars">
        <div class="month-pair">
          <i class="month-bar expense" style="height:${costs[index]}%"></i>
          <i class="month-bar income" style="height:${income[index]}%"></i>
        </div>
        <span>${month}</span>
      </div>
    `)
    .join('');

  const recent = state.invoices
    .slice(0, 3)
    .map(invoice => `
      <tr>
        <td>
          <a href="#" data-action="invoice-detail" data-id="${invoice.id}">
            ${invoice.id}
          </a>
        </td>
        <td>${invoice.customer}</td>
        <td>${invoice.date}</td>
        <td>${money(invoice.amount)}</td>
        <td>${money(invoice.amount)}</td>
        <td>${badge('Quá hạn')}</td>
      </tr>
    `);

  const content = `
    <div class="content admin-overview-content">
      <div class="admin-heading">
        <div>
          <span class="admin-eyebrow">QUẢN TRỊ VIÊN</span>
          <h1>Tổng quan doanh nghiệp</h1>
          <p>Xin chào Quản trị viên, đây là tình hình kinh doanh hôm nay.</p>
        </div>
        <button class="btn btn-soft date-button">Tháng 10, 2026⌄</button>
      </div>

      <div class="stats-grid admin-stats">
        ${cardStat('Khách hàng', '5', '↗ 3 · mới trong tháng', 'users')}
        ${cardStat('Đang có công nợ', '3', '↗ trên toàn hệ thống · kỳ này', 'clock')}
        ${cardStat('Tổng hóa đơn', '6', '↗ 6 · lập tháng này', 'invoice')}
        ${cardStat('Tổng giá trị hóa đơn', '326.900.000 ₫', '↗ ổn định · so với tháng trước', 'chart')}
      </div>

      <div class="grid admin-overview-row">
        <section class="panel admin-chart-panel">
          <div class="panel-title">
            <div>
              <h2>Thu chi theo tháng</h2>
              <p>Thu và chi thực tế · đơn vị triệu đồng</p>
            </div>
            <select class="field period-select">
              <option>6 tháng</option>
              <option>12 tháng</option>
            </select>
          </div>

          <div class="chart-total">
            <strong>115.700.000 ₫</strong>
            <span>↗ 12,5% <small>so với kỳ trước</small></span>
          </div>

          <div class="monthly-chart">
            <div class="chart-guides"><i></i><i></i><i></i><i></i></div>
            <div class="month-bars-row">${bars}</div>
          </div>

          <div class="chart-key">
            <span><i class="key-dot expense"></i>Chi phí</span>
            <span><i class="key-dot income"></i>Thu nhập</span>
          </div>
        </section>

        <section class="forecast-feature">
          <span class="forecast-label">DỰ BÁO THÁNG 10</span>
          <strong class="forecast-amount">248.224.000 ₫</strong>
          <p>Dòng tiền dự kiến dựa trên hóa đơn chưa thanh toán và lịch sử thu gần đây.</p>
          <div class="confidence">
            <div><i></i></div>
            <span>Độ tin cậy dự báo <b>72%</b></span>
          </div>
          <div class="forecast-row">
            <span>Khoản thu dự kiến</span>
            <strong>211.200.000 ₫</strong>
          </div>
          <div class="forecast-row">
            <span>Hóa đơn quá hạn</span>
            <strong>48.200.000 ₫</strong>
          </div>
        </section>
      </div>

      <section class="panel recent-invoices">
        <div class="panel-title">
          <div>
            <h2>Hóa đơn gần đây</h2>
            <p>Cập nhật trạng thái và theo dõi khoản thu</p>
          </div>
          <button class="text-link" data-route="admin-customers">Xem tất cả →</button>
        </div>
        ${table(recent, [
          'Mã hóa đơn',
          'Khách hàng',
          'Ngày lập',
          'Tổng hóa đơn',
          'Còn phải thu',
          'Trạng thái'
        ])}
      </section>
    </div>
  `;

  return shell(content);
}

function adminNotifications() {
  if (!state.invoices.length) return shell(`<div class="content">${pageHead('Thông báo', 'Thông báo của doanh nghiệp.')}<section class="panel"><div class="empty-state">Chưa có thông báo mới.</div></section></div>`);
  const unread = state.notificationsRead?.admin !== true;
  const mark = unread ? 'unread' : '';
  const dot = unread ? '<span class="notification-dot"></span>' : '';
  const content = `<div class="content">${pageHead('Thông báo', 'Cập nhật hoạt động trong không gian làm việc.', button('Đánh dấu đã đọc', 'btn-soft', 'mark-read', 'check'))}<section class="panel notification-list"><div class="notification-item ${mark}"><span class="notification-icon">${icon('invoice', 16)}</span><div><strong>Hóa đơn mới được phát hành</strong><p>IP-2026-009 · Công ty TNHH Minh Anh</p><small>10/10/2026 · 09:42</small></div>${dot}</div><div class="notification-item ${mark}"><span class="notification-icon warning">${icon('clock', 16)}</span><div><strong>Hóa đơn sắp đến hạn thanh toán</strong><p>IP-2026-006 · Còn 2 ngày đến hạn</p><small>10/10/2026 · 08:10</small></div>${dot}</div><div class="notification-item"><span class="notification-icon success">${icon('check', 16)}</span><div><strong>Đã ghi nhận thanh toán</strong><p>Công ty TNHH Sao Mai · 16.500.000 ₫</p><small>09/10/2026 · 16:20</small></div></div></section></div>`;
  shell(content)
}

function adminCustomers() {
  const totalReceivable = state.customers.reduce((sum, customer) => sum + (Number(customer[5]) || 0), 0);
  const content = `<div class="content customer-content"><div class="role-page-head"><div><span class="admin-eyebrow">QUẢN TRỊ VIÊN</span><h1>Quản lý khách hàng</h1><p>Lưu thông tin liên hệ, mã số thuế và trạng thái công nợ.</p></div>${button('Thêm khách hàng', 'btn-primary', 'add-customer', 'plus')}</div><div class="stats-grid customer-stats"><article class="stat-card"><div class="stat-top">Tổng khách hàng</div><div class="stat-value">${state.customers.length}</div></article><article class="stat-card"><div class="stat-top">Đang có công nợ</div><div class="stat-value">${state.customers.filter(x => x[5] > 0).length}</div></article><article class="stat-card"><div class="stat-top">Tổng phải thu</div><div class="stat-value">${money(totalReceivable)}</div></article></div><section class="panel customer-panel"><div class="panel-title"><div><h2>Danh sách khách hàng</h2><p><span id="customer-count">${state.customers.length}</span> khách hàng</p></div><input class="field customer-search" id="customer-search" placeholder="Tên, email hoặc MST..."></div><div id="customer-table">${customerTable(state.customers)}</div></section></div>`;
  shell(content);
  document.getElementById('customer-search').oninput = filterCustomers;
}
function customerTable(list) {
  return table(list.map((x) => {
    const i = state.customers.indexOf(x);
    const initials = x[0].split(/\s+/).slice(0, 2).map(t => t[0]).join('').toUpperCase();
    return `<tr><td><div class="customer-name-cell"><span class="customer-avatar tone-${i % 5}">${initials}</span><span><strong>${x[0]}</strong><small>MST ${x[1]}</small></span></div></td><td>${x[3] || '—'}<br><small class="cell-sub">${x[4] || '—'}</small></td><td>${x[2] === 'Cần theo dõi' ? '<span class="badge badge-red status-pill">● &nbsp;Cần theo dõi</span>' : '<span class="badge badge-green status-pill">● &nbsp;Đang hoạt động</span>'}</td><td><strong class="debt-value">${money(x[5] || 0)}</strong></td><td><button class="btn btn-soft btn-sm" data-action="edit-customer" data-index="${i}">Chi tiết</button></td></tr>`
  }), ['Khách hàng', 'Người liên hệ', 'Trạng thái', 'Công nợ', ''])
}
function filterCustomers() {
  const q = document.getElementById('customer-search').value.toLowerCase();
  const list = state.customers.filter(x => (x[0] + x[1] + x[3] + x[4]).toLowerCase().includes(q));
  document.getElementById('customer-table').innerHTML = customerTable(list);
  document.getElementById('customer-count').textContent = list.length
}

function adminUsers() {
  const content = `<div class="content">${pageHead('Quản lý người dùng', 'Mời thành viên bằng email; họ tự tạo mật khẩu để đăng nhập.', button('Mời thành viên', 'btn-primary', 'add-member', 'plus'))}<section class="panel"><div class="panel-title"><div><h2>Thành viên doanh nghiệp</h2><p>Danh sách tài khoản thuộc doanh nghiệp của bạn</p></div></div><div class="toolbar-row"><input class="field search" id="member-search" placeholder="⌕  Tìm theo email"><select class="field" id="member-role"><option value="all">Vai trò · Tất cả</option><option>Quản lý</option><option>Kế toán</option><option>Kinh doanh</option></select><select class="field" id="member-status"><option value="all">Trạng thái · Tất cả</option><option>Hoạt động</option><option>Đã mời</option></select></div><div id="member-table">${memberTable(state.members)}</div><div class="table-foot"><span>${state.members.length} thành viên</span><span>Thành viên đăng nhập bằng email được mời và mật khẩu tự tạo</span></div></section><section class="panel" style="margin-top:14px"><div class="panel-title"><div><h2>Quyền theo vai trò</h2><p>Tóm tắt phạm vi truy cập trong workspace</p></div></div><div class="grid bottom-grid"><div class="forecast-box"><strong>Quản trị viên</strong>Quản lý khách hàng, thành viên và thiết lập hóa đơn.</div><div class="forecast-box"><strong>Quản lý</strong>Xem tổng quan phải thu, theo dõi quá hạn và dự báo dòng tiền.</div></div></section></div>`;
  shell(content);
  document.getElementById('member-search').oninput = filterMembers;
  document.getElementById('member-role').onchange = filterMembers;
  document.getElementById('member-status').onchange = filterMembers;
}
function memberTable(list) {
  return table(list.map(x => `<tr><td><strong>${escapeHTML(x.name || '')}</strong><br><span class="form-help">${escapeHTML(x.email || '')}</span></td><td>${escapeHTML(x.role || '')}</td><td>${badge(x.status || 'Chưa rõ')}</td><td>${x.id === window.IP_AUTH_PROFILE?.id ? 'Chủ doanh nghiệp' : ''}</td></tr>`), ['Thành viên', 'Vai trò', 'Trạng thái', 'Thao tác'])
}
function filterMembers() {
  const q = document.getElementById('member-search').value.toLowerCase(), r = document.getElementById('member-role').value, s = document.getElementById('member-status').value;
  const list = state.members.filter(x => (x.email + x.name).toLowerCase().includes(q) && (r === 'all' || x.role === r) && (s === 'all' || x.status === s));
  document.getElementById('member-table').innerHTML = memberTable(list)
}
function adminSettingsLegacy() {
  const s = state.settings;
  const content = `<div class="content">${pageHead('Thiết lập hóa đơn', 'Cài đặt chung của doanh nghiệp · Không phải cài đặt cá nhân.', button('Quản lý người dùng', 'btn-soft', 'users') + button('Lưu thiết lập', 'btn-primary', 'save-settings', 'check'))}<div class="grid settings-grid"><div class="section-stack"><section class="form-card"><h2>Đánh số &amp; tiền tệ</h2><div class="form-grid"><div class="form-group"><label>Tiền tố hóa đơn</label><input class="input setting" data-setting="prefix" value="${s.prefix}"></div><div class="form-group"><label>Số tiếp theo</label><input class="input setting" data-setting="nextNumber" value="${s.nextNumber}"></div><div class="form-group"><label>Tiền tệ</label><select class="input setting" data-setting="currency"><option>${s.currency}</option><option>USD - $</option></select></div><div class="form-group"><label>Thuế suất mặc định</label><select class="input setting" data-setting="tax"><option>${s.tax}</option><option>8%</option><option>0%</option></select></div><div class="form-group wide"><label>Điều khoản thanh toán</label><input class="input setting" data-setting="due" value="${s.due}"></div></div><div class="forecast-box" style="margin-top:10px">Xem trước hóa đơn<br><strong>IP-2026-009</strong> Số đã phát hành không thay đổi.</div></section><section class="form-card"><h2>Thông tin thanh toán</h2><div class="form-grid"><div class="form-group wide"><label>Ngân hàng</label><input class="input setting" data-setting="bank" value="${s.bank}"></div><div class="form-group"><label>Chủ tài khoản</label><input class="input setting" data-setting="accountName" value="${s.accountName}"></div><div class="form-group"><label>Số tài khoản</label><input class="input setting" data-setting="accountNumber" value="${s.accountNumber}"></div><div class="form-group wide"><label>Ghi chú chuyển khoản</label><input class="input setting" data-setting="transferNote" value="${s.transferNote}"></div></div></section></div><section class="form-card"><h2>Mẫu nhắc thanh toán</h2><div class="form-grid"><div class="form-group wide"><label>Tiêu đề mẫu</label><input class="input setting" data-setting="reminderTitle" value="${s.reminderTitle}"></div><div class="form-group wide"><label>Nội dung</label><textarea>Chào {ten_khach_hang}, hóa đơn {ma_hoa_don} còn khoản phải thu {so_tien}. Quý công ty vui lòng thanh toán theo hạn {han_thanh_toan}. Cảm ơn {ten_doanh_nghiep}.</textarea><span class="form-help">Biến hỗ trợ: {ten_khach_hang}, {ma_hoa_don}, {so_tien}, {han_thanh_toan}.</span></div><div class="form-group wide"><label>Nhắc sau khi phát hành (ngày)</label><input class="input setting" data-setting="reminderDays" value="${s.reminderDays}"></div></div><div class="notice-box">Chỉ áp dụng cho hóa đơn chưa thanh toán. Thay đổi mẫu không làm thay đổi hóa đơn đã phát hành.</div><div class="settings-actions">${button('Hủy', 'btn-soft')}${button('Lưu thiết lập', 'btn-primary', 'save-settings')}</div></section></div></div>`;
  return shell(content)
}
function adminSettings() {
  const tab = state.settingsTab || 'company', s = state.settings, c = state.company;
  const tabs = [['company', 'Doanh nghiệp'], ['invoices', 'Hóa đơn & nhắc nợ'], ['members', 'Thành viên & quyền'], ['account', 'Tài khoản'], ['profile', 'Hồ sơ']];
  let body = '';
  if (tab === 'company') body = `<div class="grid settings-grid ref-settings-grid"><section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Thông tin doanh nghiệp</h2><p>Thông tin hiển thị trên chứng từ và thông báo</p></div></div><div class="settings-body"><div class="form-grid"><div class="form-group wide"><label>Tên doanh nghiệp</label><input class="input company-setting" data-company="name" value="${c.name}"></div><div class="form-group"><label>Mã số thuế</label><input class="input company-setting" data-company="tax" value="${c.tax}"></div><div class="form-group"><label>Email kế toán</label><input class="input company-setting" data-company="email" value="${c.email}"></div><div class="form-group wide"><label>Tài khoản nhận thanh toán</label><input class="input company-setting" data-company="bank" value="${c.bank}"></div></div></div></section><section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Không gian làm việc</h2><p>Phạm vi áp dụng của dữ liệu demo</p></div></div><div class="settings-body workspace-setting"><div><strong>${c.name}</strong><p>Hóa đơn, khách hàng và cấu hình dùng chung cho thành viên trong công ty.</p></div><span class="badge badge-blue">● &nbsp;Cục bộ</span></div></section></div>`;
  if (tab === 'invoices') body = `<div class="grid settings-grid ref-settings-grid"><div class="section-stack"><section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Hóa đơn & tiền tệ</h2><p>Thiết lập mặc định khi tạo hóa đơn</p></div></div><div class="settings-body"><div class="form-grid"><div class="form-group"><label>Tiền tố hóa đơn</label><input class="input setting" data-setting="prefix" value="${s.prefix}"></div><div class="form-group"><label>Số tiếp theo</label><input class="input setting" data-setting="nextNumber" value="${s.nextNumber}"></div><div class="form-group"><label>Tiền tệ</label><select class="input setting" data-setting="currency"><option>${s.currency}</option><option>USD - $</option></select></div><div class="form-group"><label>Thuế suất mặc định</label><select class="input setting" data-setting="tax"><option>${s.tax}</option><option>8%</option><option>0%</option></select></div><div class="form-group wide"><label>Điều khoản thanh toán</label><input class="input setting" data-setting="due" value="${s.due}"></div></div></div></section><section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Thanh toán</h2><p>Thông tin nhận tiền hiển thị trên hóa đơn</p></div></div><div class="settings-body"><div class="form-grid"><div class="form-group wide"><label>Ngân hàng</label><input class="input setting" data-setting="bank" value="${s.bank}"></div><div class="form-group"><label>Chủ tài khoản</label><input class="input setting" data-setting="accountName" value="${s.accountName}"></div><div class="form-group"><label>Số tài khoản</label><input class="input setting" data-setting="accountNumber" value="${s.accountNumber}"></div><div class="form-group wide"><label>Ghi chú chuyển khoản</label><input class="input setting" data-setting="transferNote" value="${s.transferNote}"></div></div></div></section></div><section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Mẫu nhắc nợ</h2><p>Nội dung nhắc thanh toán cho khách hàng</p></div></div><div class="settings-body"><div class="form-grid"><div class="form-group wide"><label>Tiêu đề</label><input class="input setting" data-setting="reminderTitle" value="${s.reminderTitle}"></div><div class="form-group wide"><label>Nội dung</label><textarea>Chào {ten_khach_hang}, hóa đơn {ma_hoa_don} còn khoản phải thu {so_tien}. Quý công ty vui lòng thanh toán theo hạn {han_thanh_toan}. Cảm ơn {ten_doanh_nghiep}.</textarea><span class="form-help">Biến: {ten_khach_hang}, {ma_hoa_don}, {so_tien}, {han_thanh_toan}.</span></div><div class="form-group wide"><label>Nhắc sau khi phát hành (ngày)</label><input class="input setting" data-setting="reminderDays" value="${s.reminderDays}"></div></div></div></section></div>`;
  if (tab === 'members') body = `<section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Thành viên & quyền</h2><p>Mời bằng email; thành viên tự đặt mật khẩu từ thư mời.</p></div>${button('Mời thành viên', 'btn-primary', 'add-member', 'plus')}</div><div class="settings-body">${state.memberLoadError ? `<p class="form-message">${escapeHTML(state.memberLoadError)}</p>` : ''}${memberTable(state.members)}</div></section><div class="grid bottom-grid" style="margin-top:14px"><div class="forecast-box"><strong>Quản trị viên</strong>Quản lý doanh nghiệp, khách hàng, thành viên và thiết lập hóa đơn.</div><div class="forecast-box"><strong>Quản lý</strong>Theo dõi công nợ, hóa đơn quá hạn và dự báo dòng tiền.</div></div>`;
  if (tab === 'account') body = `<section class="panel ref-settings-panel"><div class="panel-title"><div><h2>Tài khoản của tôi</h2><p>Thông tin hồ sơ và bảo mật đăng nhập</p></div></div><div class="settings-body"><div class="form-grid" style="max-width:600px"><div class="form-group"><label>Họ tên</label><input class="input" value="${state.currentUser}"></div><div class="form-group"><label>Vai trò</label><input class="input" value="Quản trị viên" readonly></div><div class="form-group wide"><label>Email đăng nhập</label><input class="input" value="admin@minhphat.example.vn" readonly></div><div class="form-group wide"><label>Mật khẩu hiện tại</label><input class="input" type="password" placeholder="Nhập mật khẩu hiện tại"></div><div class="form-group"><label>Mật khẩu mới</label><input class="input" type="password" placeholder="Ít nhất 8 ký tự"></div><div class="form-group"><label>Xác nhận mật khẩu mới</label><input class="input" type="password" placeholder="Nhập lại mật khẩu"></div></div><div class="settings-actions">${button('Cập nhật tài khoản', 'btn-primary', 'save-settings')}</div></div></section>`;
  if (tab === 'profile') body = `<section class="panel ref-settings-panel" style="max-width:820px"><div class="panel-title"><div><h2>Hồ sơ Quản trị viên</h2><p>Thông tin tài khoản đang đăng nhập</p></div><span class="avatar">AD</span></div><div class="settings-body"><div class="form-grid"><div class="form-group"><label>Họ tên</label><input class="input" value="${state.currentUser && state.currentUser !== 'demo' ? state.currentUser : 'Quản trị viên'}" readonly></div><div class="form-group"><label>Vai trò</label><input class="input" value="Quản trị viên" readonly></div><div class="form-group wide"><label>Email đăng nhập</label><input class="input" value="${entryParams.get('email') || window.IP_AUTH_PROFILE?.email || ''}" readonly></div><div class="form-group wide"><label>Không gian làm việc</label><input class="input" value="${c.name}" readonly></div></div></div></section>`;
  const content = `<div class="content settings-content"><div class="role-page-head"><div><span class="admin-eyebrow">QUẢN TRỊ VIÊN</span><h1>Cài đặt</h1><p>Quản lý doanh nghiệp, hóa đơn, thành viên và tùy chọn tài khoản.</p></div>${button('✓ Đã lưu cấu hình', 'btn-soft', 'save-settings')}</div><div class="settings-tabs">${tabs.map(([id, label]) => `<button class="settings-tab ${tab === id ? 'active' : ''}" data-setting-tab="${id}">${label}</button>`).join('')}</div>${body}<footer class="settings-footer"><span>InvoicePilot Demo</span><span>Dữ liệu mẫu được lưu trên trình duyệt này</span></footer></div>`;
  shell(content);
  document.querySelectorAll('[data-setting-tab]').forEach(el => el.onclick = () => {
    state.settingsTab = el.dataset.settingTab;
    render()
  });
}
function saveSettings() {
  document.querySelectorAll('.setting').forEach(el => state.settings[el.dataset.setting] = el.value);
  document.querySelectorAll('.company-setting').forEach(el => state.company[el.dataset.company] = el.value);
  persist();
  const companyLabel = document.querySelector('.company-switch strong');
  if (companyLabel) companyLabel.textContent = state.company.name;
  toast('Đã lưu cấu hình.')
}

function customerModal(customer = null, index = null) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${customer ? 'Cập nhật khách hàng' : 'Thêm khách hàng'}</h2><p>Thông tin doanh nghiệp và người liên hệ</p></div><button class="modal-close" data-action="close">×</button></div><form id="modal-form" class="form-grid"><div class="form-group wide"><label>Tên doanh nghiệp *</label><input class="input" id="m-name" value="${customer?.[0] || ''}" required placeholder="Công ty Minh Phát"></div><div class="form-group"><label>Mã số thuế *</label><input class="input" id="m-tax" value="${customer?.[1] || ''}" required placeholder="0312345678"></div><div class="form-group"><label>Trạng thái</label><select class="input" id="m-status"><option ${customer?.[2] === 'Hoạt động' ? 'selected' : ''}>Hoạt động</option><option ${customer?.[2] === 'Cần theo dõi' ? 'selected' : ''}>Cần theo dõi</option></select></div><div class="form-group"><label>Người liên hệ</label><input class="input" id="m-contact" value="${customer?.[3] || ''}" placeholder="Nguyễn Minh Anh"></div><div class="form-group"><label>Email liên hệ</label><input class="input" id="m-email" type="email" value="${customer?.[4] || ''}" placeholder="contact@example.vn"></div><div class="modal-actions form-group wide"><button type="button" class="btn btn-soft" data-action="close">Hủy</button><button class="btn btn-primary" type="submit">${customer ? 'Lưu thay đổi' : 'Thêm khách hàng'}</button></div></form></div></div>`;
  root.querySelectorAll('[data-action="close"]').forEach(el => el.onclick = () => root.innerHTML = '');
  root.querySelector('.modal-backdrop').onclick = e => {
    if (e.target === e.currentTarget) root.innerHTML = ''
  };
  root.querySelector('#modal-form').onsubmit = e => {
    e.preventDefault();
    const row = [root.querySelector('#m-name').value, root.querySelector('#m-tax').value, root.querySelector('#m-status').value, root.querySelector('#m-contact').value, root.querySelector('#m-email').value, customer?.[5] || 0];
    if (index === null) state.customers.unshift(row); else state.customers[index] = row;
    persist();
    root.innerHTML = '';
    render();
    toast(index === null ? 'Đã thêm khách hàng mới.' : 'Đã lưu khách hàng.')
  };
}
function memberModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="member-invite-title"><div class="modal-head"><div><h2 id="member-invite-title">Mời thành viên</h2><p>Supabase sẽ gửi email để thành viên tạo mật khẩu riêng.</p></div><button class="modal-close" type="button" data-action="close">×</button></div><form id="member-invite-form" class="form-grid"><div class="form-group wide"><label>Họ tên *</label><input class="input" id="m-name" autocomplete="name" required></div><div class="form-group wide"><label>Email công việc *</label><input class="input" id="m-email" type="email" autocomplete="email" required></div><div class="form-group wide"><label>Vai trò *</label><select class="input" id="m-role" required><option value="manager">Quản lý</option><option value="accountant">Kế toán</option><option value="sales">Kinh doanh</option></select></div><p class="form-help wide" id="member-invite-error" role="alert"></p><div class="modal-actions form-group wide"><button type="button" class="btn btn-soft" data-action="close">Hủy</button><button class="btn btn-primary" id="member-invite-submit" type="submit">Gửi lời mời</button></div></form></div></div>`;
  root.querySelectorAll('[data-action="close"]').forEach(el => el.onclick = () => root.innerHTML = '');
  root.querySelector('#member-invite-form').onsubmit = async e => {
    e.preventDefault();
    const submit = root.querySelector('#member-invite-submit'), errorBox = root.querySelector('#member-invite-error');
    submit.disabled = true;
    submit.textContent = 'Đang gửi…';
    errorBox.textContent = '';
    try {
      const result = await IPCommon.inviteMember({ fullName: root.querySelector('#m-name').value.trim(), email: root.querySelector('#m-email').value.trim(), role: root.querySelector('#m-role').value });
      root.innerHTML = '';
      await refreshCompanyMembers();
      render();
      toast(`Đã gửi lời mời đến ${result.email}. Thành viên hãy mở email để tạo mật khẩu.`)
    } catch (error) {
      errorBox.textContent = error.message || 'Không gửi được lời mời. Hãy thử lại.';
      submit.disabled = false;
      submit.textContent = 'Gửi lời mời'
    }
  };
}
async function refreshCompanyMembers() {
  const rows = await IPCommon.listCompanyMembers();
  state.members = rows.map(row => ({ id: row.id, name: row.full_name, email: row.email, role: IPCommon.roleLabel(row.role), status: row.invite_status === 'invited' ? 'Đã mời' : 'Hoạt động' }));
  persist()
}
