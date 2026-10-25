/* Shared customers and invoices; private pipeline and care tasks remain on this browser. */
(() => {
  'use strict';
  const workspace = document.getElementById('workspace'), content = document.getElementById('role-content');
  const safe = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fatal(message) { workspace.innerHTML = `<main class="sales-standalone"><h1>Không mở được khu vực Kinh doanh</h1><p role="alert">${safe(message)}</p><button type="button" data-reload>Thử lại</button> <a href="../common/index.html">Về đăng nhập</a></main>`; workspace.querySelector('[data-reload]').onclick = () => location.reload(); }
  async function start() {
    if (!window.IPCommon || !window.InvoicePilotSalesModals) throw new Error('Không tải được tài nguyên. Kiểm tra mạng rồi tải lại trang.');
    const profile = await IPCommon.requireRole('sales'); if (!profile) return;
    const key = IPCommon.accountStorageKey('invoicepilot-sales'), settingsKey = IPCommon.accountStorageKey('invoicepilot-sales-settings');
    const money = amount => IPCommon.money(amount);
    let customers = [], invoices = [], payments = [], opportunities = [], reminders = [], tasks = [], hiddenCustomers = [], filters = {}, settings = {};
    let paymentDataAvailable = false;
    let state = 'loading', notice = '', warning = '', errorText = '', refreshing = false, refreshAgain = false, aiTimer;
    const nav = [['overview','Tổng quan','◈'],['customers','Khách hàng','♙'],['opportunities','Cơ hội','◇'],['care','Chăm sóc','✓'],['reminders','Nhắc thanh toán','◷'],['assistant','Gợi ý chăm sóc','✧'],['settings','Cài đặt','⚙']].map(([id,label,icon]) => ({id,label,icon,href:`#${id}`}));
    let section = nav.some(x => x.id === location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
    const id = prefix => `${prefix}-${crypto.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2)}`;
    const isoDate = value => { if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value; const m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` : ''; };
    const activeOpportunity = item => !item.archived && !['Thành công','Thất bại'].includes(item.stage);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      opportunities = Array.isArray(saved.opportunities) ? saved.opportunities.filter(x => x && typeof x.id === 'string').map(x => ({...x,closeISO:x.closeISO || isoDate(x.close)})) : [];
      reminders = Array.isArray(saved.reminders) ? saved.reminders.filter(x => x && typeof x.invoice === 'string') : [];
      tasks = Array.isArray(saved.tasks) ? saved.tasks.filter(x => x && typeof x.id === 'string') : [];
      filters = saved.filters && typeof saved.filters === 'object' ? saved.filters : {};
      hiddenCustomers = Array.isArray(saved.hiddenCustomers) ? saved.hiddenCustomers : [];
      settings = JSON.parse(localStorage.getItem(settingsKey) || '{}') || {};
    } catch { warning = 'Không đọc được dữ liệu riêng trong trình duyệt. Dữ liệu doanh nghiệp vẫn được tải từ máy chủ.'; }
    function persist(patch = {}) { try { localStorage.setItem(key,JSON.stringify({opportunities,reminders,tasks,filters,hiddenCustomers,...patch})); } catch { throw new Error('Không lưu được trong trình duyệt. Kiểm tra dung lượng hoặc quyền lưu trữ rồi thử lại.'); } }
    const log = (item,text) => [...(Array.isArray(item.history) ? item.history : []),{at:new Date().toISOString(),text}];
    const dialogs = InvoicePilotSalesModals.create({workspace,getCustomers:() => customers,
      saveCustomer:async item => {
        const existing = Boolean(item.id);
        const saved = await (existing ? IPCommon.updateCompanyCustomer(item.id,item) : IPCommon.createCompanyCustomer(item));
        const row = {...item,id:saved.id,debt:existing ? item.debt : item.openingBalance,due:item.due || '—'}, index = customers.findIndex(x => x.id === saved.id);
        if (index < 0) customers.unshift(row); else customers[index] = row;
        section = 'customers'; notice = existing ? 'Đã cập nhật khách hàng trên hệ thống doanh nghiệp.' : 'Đã thêm khách hàng trên hệ thống doanh nghiệp.'; render();
      },
      saveOpportunity:async item => {
        const row = {...item,id:item.id || id('CH'),history:log(item,item.id ? `Cập nhật giai đoạn: ${item.stage}` : 'Tạo cơ hội')};
        const next = opportunities.some(x => x.id === row.id) ? opportunities.map(x => x.id === row.id ? row : x) : [row,...opportunities];
        persist({opportunities:next}); opportunities = next; section = 'opportunities'; notice = 'Đã lưu cơ hội trên trình duyệt này.'; render();
      },
      saveTask:async item => {
        const row = {...item,id:item.id || id('CS'),history:log(item,item.id ? `Cập nhật: ${item.status}` : 'Tạo lịch chăm sóc')};
        const next = tasks.some(x => x.id === row.id) ? tasks.map(x => x.id === row.id ? row : x) : [row,...tasks];
        persist({tasks:next}); tasks = next; section = 'care'; notice = 'Đã lưu lịch chăm sóc trên trình duyệt này.'; render();
      }
    });
    const button = (text,action,value = '',primary = false) => `<button type="button" class="button ${primary ? 'button-primary' : ''}" data-action="${action}" data-id="${safe(value)}">${text}</button>`;
    const heading = (title,text,action = '') => `<section class="role-heading"><div><span class="eyebrow">KINH DOANH</span><h1 tabindex="-1">${title}</h1><p>${text}</p></div>${action}</section>`;
    const stats = rows => `<section class="role-stats">${rows.map(([title,value,help]) => `<article class="role-card"><small>${title}</small><strong>${safe(value)}</strong><span>${help}</span></article>`).join('')}</section>`;
    const badge = text => `<span class="role-badge ${['Quá hạn','Thất bại','Cần liên hệ'].includes(text) ? 'pending' : ''}">${safe(text)}</span>`;
    const table = (headers,rows) => `<div class="table-scroll" tabindex="0" role="region" aria-label="Bảng dữ liệu, có thể cuộn ngang"><table class="role-table"><thead><tr>${headers.map(x => `<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
    const tools = {
      customers:{statuses:['Đang hoạt động','Đang theo dõi','Cần liên hệ','Cần theo dõi'],second:[['all','Mọi công nợ'],['debt','Còn công nợ'],['clear','Không công nợ']],sort:[['name','Tên A–Z'],['amount','Công nợ giảm dần']]},
      opportunities:{statuses:['Tiềm năng','Đủ điều kiện','Đang trao đổi','Đề xuất','Đàm phán','Thành công','Thất bại'],second:[['all','Mọi giá trị'],['large','Từ 50 triệu'],['small','Dưới 50 triệu']],sort:[['date','Ngày chốt gần nhất'],['amount','Giá trị giảm dần'],['name','Tên A–Z']]},
      care:{statuses:['Chưa hoàn thành','Hoàn thành'],second:[['all','Mọi thời hạn'],['late','Đã đến hạn'],['future','Chưa đến hạn']],sort:[['date','Thời gian gần nhất'],['name','Tên A–Z']]},
      reminders:{statuses:['Quá hạn','Chưa thanh toán','Đã thanh toán một phần'],second:[['all','Mọi liên hệ'],['pending','Chưa nhắc'],['done','Đã nhắc']],sort:[['date','Hạn gần nhất'],['amount','Số tiền giảm dần'],['name','Tên A–Z']]}
    };
    const filterValue = type => ({query:'',status:'',second:'all',sort:type === 'customers' ? 'name' : 'date',archive:'active',page:1,...(filters[type] || {})});
    function toolbar() {
      const cfg = tools[section], f = filterValue(section);
      const select = (label,name,rows) => `<label>${label}<select data-filter="${name}">${rows.map(([id,text]) => `<option value="${safe(id)}" ${id === f[name] ? 'selected' : ''}>${safe(text)}</option>`).join('')}</select></label>`;
      return `<div class="sales-toolbar"><label>Tìm kiếm<input type="search" data-filter="query" value="${safe(f.query)}" placeholder="Tên, email, mã hóa đơn…"></label>${select('Trạng thái','status',[['','Tất cả trạng thái'],...cfg.statuses.map(x => [x,x])])}${select('Điều kiện','second',cfg.second)}${select('Sắp xếp','sort',cfg.sort)}${section !== 'reminders' ? select('Hiển thị','archive',[['active','Đang theo dõi'],['archived',section === 'customers' ? 'Đã ẩn trên máy này' : 'Đã lưu trữ']]) : ''}${button('Xuất CSV','export')}</div>`;
    }
    function rowsFor(type) {
      const f = filterValue(type), source = type === 'customers' ? customers : type === 'opportunities' ? opportunities : type === 'care' ? tasks : reminders;
      return source.filter(item => {
        if (type !== 'reminders' && (type === 'customers' ? hiddenCustomers.includes(item.id) : Boolean(item.archived)) !== (f.archive === 'archived')) return false;
        if (f.status && (item.stage || item.status) !== f.status) return false;
        if (f.query && ![item.name,item.contact,item.email,item.customer,item.invoice,item.title].filter(Boolean).join(' ').toLocaleLowerCase('vi').includes(f.query.toLocaleLowerCase('vi').trim())) return false;
        if (type === 'customers' && ((f.second === 'debt' && !(item.debt > 0)) || (f.second === 'clear' && item.debt > 0))) return false;
        if (type === 'opportunities' && ((f.second === 'large' && item.value < 50000000) || (f.second === 'small' && item.value >= 50000000))) return false;
        if (type === 'reminders' && ((f.second === 'pending' && item.reminded) || (f.second === 'done' && !item.reminded))) return false;
        if (type === 'care' && ((f.second === 'late' && new Date(item.when) > new Date()) || (f.second === 'future' && new Date(item.when) <= new Date()))) return false;
        return true;
      }).sort((a,b) => f.sort === 'name' ? String(a.name || a.title || a.customer).localeCompare(String(b.name || b.title || b.customer),'vi') : f.sort === 'amount' ? (b.value || b.debt || b.amount || 0) - (a.value || a.debt || a.amount || 0) : String(a.closeISO || a.when || a.dueDate || '').localeCompare(String(b.closeISO || b.when || b.dueDate || '')));
    }
    function listMarkup() {
      const all = rowsFor(section), f = filterValue(section), pages = Math.max(1,Math.ceil(all.length / 8)), page = Math.max(1,Math.min(Number(f.page) || 1,pages)), rows = all.slice((page-1)*8,page*8);
      if (!rows.length) return `<div class="sales-empty"><h2>Chưa có kết quả phù hợp</h2><p>Thêm dữ liệu hoặc điều chỉnh bộ lọc để tiếp tục.</p>${section !== 'reminders' ? button('Tạo bản ghi đầu tiên',section === 'customers' ? 'add-customer' : section === 'care' ? 'add-task' : 'add-opportunity','',true) : ''}${button('Xóa bộ lọc','clear')}</div>`;
      let html = '';
      if (section === 'customers') html = table(['Khách hàng','Liên hệ','Công nợ','Hạn hóa đơn','Trạng thái','Thao tác'],rows.map(x => `<tr><td><strong>${safe(x.name)}</strong><br>${safe(x.tax)}</td><td>${safe(x.contact)}<br>${safe(x.email)}</td><td>${money(x.debt)}</td><td>${safe(x.due)}</td><td>${badge(x.status)}</td><td class="sales-row-actions">${button('Xem / sửa','edit-customer',x.id)}${button(f.archive === 'archived' ? 'Hiện lại' : 'Ẩn trên máy này','hide-customer',x.id)}</td></tr>`));
      if (section === 'opportunities') html = table(['Cơ hội','Khách hàng','Giá trị','Giai đoạn','Ngày chốt','Thao tác'],rows.map(x => `<tr><td>${safe(x.name)}</td><td>${safe(customers.find(c => String(c.id) === x.customerId)?.name || x.customer)}</td><td>${money(x.value)}</td><td>${badge(x.stage)}</td><td>${safe(x.close)}</td><td class="sales-row-actions">${button('Sửa','edit-opportunity',x.id)}${button('Lịch sử','history-opportunity',x.id)}${button(x.archived ? 'Khôi phục' : 'Lưu trữ','archive-opportunity',x.id)}</td></tr>`));
      if (section === 'care') html = table(['Công việc','Khách hàng','Thời gian','Trạng thái','Kết quả','Thao tác'],rows.map(x => `<tr><td>${safe(x.title)}</td><td>${safe(x.customer)}</td><td>${safe(new Date(x.when).toLocaleString('vi-VN'))}</td><td>${badge(x.status)}</td><td>${safe(x.note)}</td><td class="sales-row-actions">${button('Sửa / ghi kết quả','edit-task',x.id)}${button('Lịch sử','history-task',x.id)}${button(x.archived ? 'Khôi phục' : 'Lưu trữ','archive-task',x.id)}</td></tr>`));
      if (section === 'reminders') html = table(['Khách hàng','Hóa đơn','Hạn thanh toán','Còn phải thu','Trạng thái','Liên hệ'],rows.map(x => `<tr><td>${safe(x.customer)}</td><td>${safe(x.invoice)}</td><td>${safe(x.due)}</td><td>${money(x.amount)}</td><td>${badge(x.status)}</td><td>${button(x.reminded ? 'Xem / nhắc lại' : 'Soạn nhắc','remind',x.invoice)}${x.reminded ? '<small>Đã ghi nhận liên hệ</small>' : ''}</td></tr>`));
      return html + `<div class="sales-pagination"><span>${all.length} kết quả · Trang ${page}/${pages}</span><button type="button" data-page="${page-1}" ${page === 1 ? 'disabled' : ''}>Trước</button><button type="button" data-page="${page+1}" ${page === pages ? 'disabled' : ''}>Sau</button></div>`;
    }
    function renderList() { const target = workspace.querySelector('[data-results]'); if (target) target.innerHTML = listMarkup(); }
    function pageMarkup() {
      if (state === 'loading') return heading('Đang tải dữ liệu','Đang kết nối dữ liệu doanh nghiệp…') + '<div class="sales-empty" role="status"><span class="sales-spinner" aria-hidden="true"></span>Đang tải khách hàng và hóa đơn…</div>';
      if (state === 'error') return heading('Chưa tải được dữ liệu','Bạn có thể thử kết nối lại.') + `<div class="sales-empty"><p role="alert">${safe(errorText)}</p>${button('Thử lại','retry','',true)}<a class="button" href="../common/index.html">Về đăng nhập</a></div>`;
      const open = opportunities.filter(activeOpportunity), now = new Date();
      if (section === 'overview') {
        const paid = payments.filter(x => { const date = new Date(x.paidAt); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).reduce((sum,x) => sum + Number(x.amount || 0),0);
        return heading('Tổng quan kinh doanh','Khách hàng dùng chung; cơ hội và chăm sóc lưu riêng trên trình duyệt.',button('Tải lại dữ liệu','retry')) + stats([['Khách hàng doanh nghiệp',customers.length,'Đồng bộ từ Supabase'],['Cơ hội đang mở',open.length,money(open.reduce((sum,x) => sum + Number(x.value || 0),0))],['Đã thu tháng này',paymentDataAvailable ? money(paid) : 'Chưa có dữ liệu',paymentDataAvailable ? 'Theo các khoản thanh toán API trả về' : 'API hiện tại chưa cung cấp lịch sử thanh toán']]) + `<section class="role-panel sales-summary"><h2>Việc cần theo dõi</h2>${settings['payment-reminders'] !== false ? `<p>${reminders.filter(x => x.status === 'Quá hạn').length} hóa đơn quá hạn.</p>` : ''}${settings.notifications !== false ? `<p>${tasks.filter(x => !x.archived && x.status !== 'Hoàn thành').length} việc chăm sóc chưa hoàn thành.</p>` : ''}<div class="sales-actions">${button('Khách hàng','goto','customers')}${button('Cơ hội','goto','opportunities')}${button('Chăm sóc','goto','care')}${button('Gợi ý chăm sóc','goto','assistant')}</div></section>`;
      }
      if (tools[section]) {
        const cfg = {customers:['Khách hàng doanh nghiệp','Sửa hồ sơ đồng bộ cho các vai trò. Ẩn chỉ thay đổi danh sách trên máy này.','add-customer','Thêm khách hàng'],opportunities:['Cơ hội kinh doanh','Từ tiềm năng đến thắng/thua. Lưu riêng trên trình duyệt này.','add-opportunity','Thêm cơ hội'],care:['Chăm sóc khách hàng','Lịch liên hệ và kết quả lưu riêng trên trình duyệt này.','add-task','Thêm lịch chăm sóc'],reminders:['Nhắc thanh toán','Hóa đơn còn số dư; lịch sử nhắc lưu riêng trên trình duyệt này.','','']}[section];
        const monthClose = open.filter(x => { const date = new Date(`${x.closeISO}T00:00:00`); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).length;
        return heading(cfg[0],cfg[1],cfg[2] ? button(cfg[3],cfg[2],'',true) : '') + (section === 'opportunities' ? stats([['Đang mở',open.length,'Không gồm thắng/thua, lưu trữ'],['Giá trị đang mở',money(open.reduce((sum,x) => sum+Number(x.value || 0),0)),'Tổng giá trị dự kiến'],['Chốt tháng này',monthClose,'Theo ngày dự kiến chốt']]) : '') + `<section class="role-panel">${toolbar()}<div data-results aria-live="polite">${listMarkup()}</div></section>`;
      }
      if (section === 'assistant') return heading('Gợi ý chăm sóc','Mô phỏng theo quy tắc công nợ, không phải dự đoán của mô hình AI.') + `<section class="role-panel sales-summary"><form data-assistant><label>Khách hàng<select name="customer" required><option value="">Chọn khách hàng</option>${customers.map(x => `<option value="${safe(x.id)}">${safe(x.name)}</option>`).join('')}</select></label><label>Mục tiêu chăm sóc<textarea name="goal" required maxlength="500" placeholder="Ví dụ: Hỏi kế hoạch thanh toán và hẹn ngày liên hệ tiếp theo"></textarea></label><p class="sales-form-error" role="alert" data-ai-error></p><button type="submit" class="button button-primary" ${customers.length ? '' : 'disabled'}>Tạo gợi ý</button>${!customers.length ? '<p>Thêm khách hàng trước khi tạo gợi ý.</p>' : ''}</form><div data-ai-result aria-live="polite"></div></section>`;
      return heading('Cài đặt','Tùy chọn trên trình duyệt, không bật gửi email tự động.') + `<section class="role-panel sales-summary"><h2>${safe(profile.full_name || 'Tài khoản kinh doanh')}</h2><p>${safe(profile.email)}</p><form data-settings><label><input type="checkbox" name="notifications" ${settings.notifications !== false ? 'checked' : ''}> Hiển thị số việc cần theo dõi</label><label><input type="checkbox" name="payment-reminders" ${settings['payment-reminders'] !== false ? 'checked' : ''}> Hiển thị nhắc hạn trên tổng quan</label><button type="submit" class="button button-primary">Lưu tùy chọn</button></form></section>`;
    }
    function render() {
      clearTimeout(aiTimer); document.body.dataset.salesWorkspace = 'true';
      content.innerHTML = `${warning ? `<p class="sales-warning" role="alert">${safe(warning)} ${button('Tải lại dữ liệu','retry')}</p>` : ''}${pageMarkup()}<p class="role-message" role="status" aria-live="polite">${safe(notice)}</p>`;
      IPCommon.mountShell({role:'sales',active:nav.find(x => x.id === section)?.label || 'Tổng quan',nav,searchItems:customers.map(x => ({title:x.name,kind:'Khách hàng',description:x.email || '',searchText:`${x.name} ${x.contact}`,section:'customers',query:x.name}))});
    }
    async function refresh() {
      if (refreshing) { refreshAgain = true; return; } refreshing = true;
      try {
        const shared = await IPCommon.getCompanyBusinessData(); customers = shared.customers || []; invoices = shared.invoices || []; payments = shared.payments || []; paymentDataAvailable = Array.isArray(shared.payments);
        const previous = new Map(reminders.map(x => [x.invoice,x]));
        reminders = invoices.filter(x => x.balance > 0).map(x => ({invoice:x.id,customerId:x.customerId,customer:x.customer,due:x.due,dueDate:x.dueDate || isoDate(x.due),amount:x.balance,status:x.status,reminded:Boolean(previous.get(x.id)?.reminded),remindedAt:previous.get(x.id)?.remindedAt || ''}));
        state = 'ready'; errorText = '';
      } catch (error) { errorText = error.message || 'Kiểm tra kết nối mạng hoặc cấu hình dữ liệu.'; if (state === 'ready') warning = `Chưa cập nhật được dữ liệu mới: ${errorText}`; else state = 'error'; }
      finally { refreshing = false; render(); if (refreshAgain) { refreshAgain = false; void refresh(); } }
    }
    function navigate(next) { if (!nav.some(x => x.id === next)) return; dialogs.close(); section = next; notice = ''; history.pushState(null,'',`#${next}`); render(); workspace.querySelector('h1')?.focus(); }
    function remind(invoice) {
      const item = reminders.find(x => x.invoice === invoice); if (!item) return;
      const customer = customers.find(x => x.id === item.customerId) || customers.find(x => x.name === item.customer);
      const message = `Kính gửi ${customer?.contact || 'Quý khách'},\n\nXin nhắc về hóa đơn ${item.invoice} của ${item.customer}.\nSố tiền còn lại: ${money(item.amount)}. Hạn thanh toán: ${item.due}.\nVui lòng phản hồi kế hoạch thanh toán. Nếu đã thanh toán, vui lòng gửi xác nhận để đối soát.\n\nTrân trọng,\nBộ phận Kinh doanh · InvoicePilot`;
      const box = dialogs.open('Soạn nhắc thanh toán',`<p>${safe(item.customer)} · ${safe(customer?.email || 'Chưa có email')}</p><label class="sales-reminder-label">Tiêu đề<input class="sales-reminder-input" data-subject value="${safe(`Nhắc thanh toán hóa đơn ${item.invoice}`)}"></label><label class="sales-reminder-label">Nội dung<textarea class="sales-reminder-textarea" data-message>${safe(message)}</textarea></label><p>Ứng dụng không tự gửi email. Kiểm tra và tự gửi trong ứng dụng email.</p><p role="status" data-reminder-status></p><footer>${button('Sao chép','copy-draft')}${customer?.email ? '<a class="button" data-email>Mở email</a>' : ''}${button('Ghi nhận đã liên hệ','mark-reminded',invoice,true)}</footer>`);
      const email = box.querySelector('[data-email]'), update = () => { if (email) email.href = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(box.querySelector('[data-subject]').value)}&body=${encodeURIComponent(box.querySelector('[data-message]').value)}`; }; box.addEventListener('input',update); update();
    }
    function showHistory(item) { if (!item) return; dialogs.open('Lịch sử cập nhật',`<ol class="sales-history">${(item.history || []).map(x => `<li><time>${safe(new Date(x.at).toLocaleString('vi-VN'))}</time><p>${safe(x.text)}</p></li>`).join('') || '<li>Chưa có lịch sử cho dữ liệu cũ.</li>'}</ol>`); }
    async function action(name,value,target) {
      if (name === 'goto') return navigate(value);
      if (name === 'retry') { if (state !== 'ready') { state = 'loading'; render(); } warning = ''; return refresh(); }
      if (state !== 'ready') return;
      if (name === 'add-customer') return dialogs.customerForm();
      if (name === 'edit-customer') return dialogs.customerForm(customers.find(x => String(x.id) === value));
      if (name === 'add-opportunity') return dialogs.opportunityForm();
      if (name === 'edit-opportunity') return dialogs.opportunityForm(opportunities.find(x => x.id === value));
      if (name === 'add-task') return dialogs.taskForm();
      if (name === 'edit-task') return dialogs.taskForm(tasks.find(x => x.id === value));
      if (name === 'clear') { persist({filters:{...filters,[section]:{}}}); filters[section] = {}; return render(); }
      if (name === 'hide-customer') { const hidden = hiddenCustomers.includes(value); return dialogs.confirm(hidden ? 'Hiện lại khách hàng trên máy này' : 'Ẩn trên máy này — không xóa khách hàng doanh nghiệp',() => { const next = hidden ? hiddenCustomers.filter(x => x !== value) : [...hiddenCustomers,value]; persist({hiddenCustomers:next}); hiddenCustomers = next; notice = 'Đã cập nhật danh sách riêng trên trình duyệt.'; render(); }); }
      if (name === 'archive-task' || name === 'archive-opportunity') {
        const isTask = name === 'archive-task', rows = isTask ? tasks : opportunities, item = rows.find(x => x.id === value); if (!item) return;
        return dialogs.confirm(item.archived ? 'Khôi phục bản ghi' : 'Lưu trữ bản ghi',reason => { const next = rows.map(x => x.id === value ? {...x,archived:!x.archived,history:log(x,`${x.archived ? 'Khôi phục' : 'Lưu trữ'}: ${reason}`)} : x); persist(isTask ? {tasks:next} : {opportunities:next}); if (isTask) tasks = next; else opportunities = next; notice = 'Đã cập nhật bản ghi.'; render(); });
      }
      if (name === 'history-task' || name === 'history-opportunity') return showHistory((name === 'history-task' ? tasks : opportunities).find(x => x.id === value));
      if (name === 'remind') return remind(value);
      if (name === 'copy-draft') { const modal = target.closest('.sales-reminder-modal'); try { await navigator.clipboard.writeText(modal.querySelector('[data-message]').value); modal.querySelector('[data-reminder-status]').textContent = 'Đã sao chép.'; } catch { modal.querySelector('[data-reminder-status]').textContent = 'Không truy cập được clipboard. Hãy chọn và sao chép thủ công.'; modal.querySelector('[data-message]').select(); } return; }
      if (name === 'mark-reminded') { const next = reminders.map(x => x.invoice === value ? {...x,reminded:true,remindedAt:new Date().toISOString()} : x); persist({reminders:next}); reminders = next; dialogs.close(); notice = 'Đã ghi nhận liên hệ trên trình duyệt này.'; return render(); }
      if (name === 'export') {
        const fields = section === 'customers' ? ['name','contact','email','debt','status'] : section === 'opportunities' ? ['name','customer','value','stage','closeISO'] : section === 'care' ? ['title','customer','when','status','note'] : ['invoice','customer','due','amount','status'];
        const cell = value => `"${String(value ?? '').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')}"`;
        const csv = [fields,...rowsFor(section).map(x => fields.map(field => x[field]))].map(row => row.map(cell).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'})), link = document.createElement('a'); link.href = url; link.download = `sales-${section}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000); return;
      }
      if (name === 'dismiss-ai') { workspace.querySelector('[data-ai-result]').replaceChildren(); return; }
      if (name === 'regenerate-ai') { workspace.querySelector('[data-assistant]').requestSubmit(); return; }
      if (name === 'apply-ai') {
        const result = workspace.querySelector('[data-ai-result]'), title = result.querySelector('textarea').value.trim(), customer = customers.find(x => String(x.id) === result.dataset.customer);
        if (!title) { result.querySelector('textarea').focus(); return; } if (!customer) throw new Error('Khách hàng không còn tồn tại. Hãy tạo lại gợi ý.');
        const tomorrow = new Date(Date.now()+86400000); tomorrow.setMinutes(tomorrow.getMinutes()-tomorrow.getTimezoneOffset());
        const next = [{id:id('CS'),title:title.slice(0,200),customerId:String(customer.id),customer:customer.name,when:tomorrow.toISOString().slice(0,16),status:'Chưa hoàn thành',note:'Gợi ý mô phỏng đã được người dùng xác nhận.',history:[{at:new Date().toISOString(),text:'Áp dụng gợi ý chăm sóc'}]},...tasks];
        persist({tasks:next}); tasks = next; navigate('care'); notice = 'Đã lưu gợi ý thành lịch chăm sóc. Bạn có thể sửa thời gian liên hệ.'; render();
      }
    }
    workspace.addEventListener('click',e => {
      const link = e.target.closest('.shared-nav-link'); if (link) { e.preventDefault(); navigate(link.hash.slice(1)); return; }
      const page = e.target.closest('[data-page]'); if (page) { filters[section] = {...filterValue(section),page:Number(page.dataset.page)}; try { persist(); } catch (err) { workspace.querySelector('.role-message').textContent = err.message; } renderList(); return; }
      const target = e.target.closest('[data-action]'); if (target) void action(target.dataset.action,target.dataset.id,target).catch(err => { const message = workspace.querySelector('.role-message'); if (message) { message.setAttribute('role','alert'); message.textContent = err.message; } });
    });
    function changeFilter(e) {
      const input = e.target.closest('[data-filter]'); if (!input || (e.type === 'input' && input.tagName === 'SELECT') || (e.type === 'change' && input.tagName !== 'SELECT')) return;
      filters[section] = {...filterValue(section),[input.dataset.filter]:input.value,page:1}; try { persist(); } catch (err) { workspace.querySelector('.role-message').textContent = err.message; } renderList();
    }
    workspace.addEventListener('input',changeFilter); workspace.addEventListener('change',changeFilter);
    let generation = 0;
    workspace.addEventListener('submit',e => {
      if (e.target.matches('[data-settings]')) { e.preventDefault(); const form = e.target, next = {notifications:form.elements.notifications.checked,'payment-reminders':form.elements['payment-reminders'].checked}; try { localStorage.setItem(settingsKey,JSON.stringify(next)); settings = next; notice = 'Đã lưu tùy chọn.'; } catch { notice = 'Không lưu được tùy chọn. Kiểm tra quyền lưu trữ.'; } render(); }
      if (!e.target.matches('[data-assistant]')) return;
      e.preventDefault(); const form = e.target, result = workspace.querySelector('[data-ai-result]'), error = form.querySelector('[data-ai-error]'), goal = form.elements.goal.value.trim(), customer = customers.find(x => String(x.id) === form.elements.customer.value);
      if (!customer || goal.length < 10) { error.textContent = 'Chưa đủ dữ liệu: chọn khách hàng và nhập mục tiêu ít nhất 10 ký tự, hoặc tạo lịch chăm sóc thủ công.'; result.replaceChildren(); return; }
      error.textContent = ''; result.innerHTML = '<p role="status">Đang phân tích theo quy tắc…</p>'; form.querySelector('button').disabled = true;
      aiTimer = setTimeout(() => {
        if (!form.isConnected) return; generation++;
        const overdue = invoices.filter(x => x.customerId === customer.id && x.status === 'Quá hạn');
        const title = generation % 2 ? `Liên hệ ${customer.name}: ${goal}` : `Hẹn trao đổi với ${customer.name} và xác nhận: ${goal}`;
        result.dataset.customer = String(customer.id);
        result.innerHTML = `<h2>Đề xuất chăm sóc</h2><p>Vì sao: công nợ ${money(customer.debt)}, ${overdue.length} hóa đơn quá hạn, trạng thái ${safe(customer.status)}.</p><p class="sales-warning">Mô phỏng theo quy tắc, không có độ tin cậy thống kê. Kiểm tra dữ liệu và nội dung trước khi lưu.</p><label>Chỉnh sửa đề xuất<textarea maxlength="200">${safe(title.slice(0,200))}</textarea></label><div class="sales-actions">${button('Chấp nhận và lưu lịch','apply-ai','',true)}${button('Tạo lại','regenerate-ai')}${button('Từ chối','dismiss-ai')}</div>`;
        form.querySelector('button').disabled = false;
      },450);
    });
    window.addEventListener('popstate',() => { dialogs.close(); section = nav.some(x => x.id === location.hash.slice(1)) ? location.hash.slice(1) : 'overview'; notice = ''; render(); });
    window.addEventListener('invoicepilot:global-search-select',e => { if (e.detail?.role !== 'sales') return; filters.customers = {...filters.customers,query:e.detail.query,page:1}; navigate('customers'); });
    render(); await refresh();
    if (typeof IPCommon.subscribeCompanyBusinessData === 'function') IPCommon.subscribeCompanyBusinessData(() => { if (workspace.querySelector('[role="dialog"]')) { warning = 'Dữ liệu doanh nghiệp vừa thay đổi. Tải lại dữ liệu sau khi đóng biểu mẫu.'; return; } void refresh(); });
  }
  start().catch(error => fatal(error.message || 'Không khởi tạo được khu vực Kinh doanh.'));
})();
