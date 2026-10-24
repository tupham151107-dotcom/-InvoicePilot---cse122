const icon = (name, size=18) => {
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    invoice:'<path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" transform="translate(-1 -1)"/>',
    chart:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    filter:'<path d="M4 5h16M7 12h10m-7 7h4"/>',
    dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    spark:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`;
};

const initial = {
  route: 'login', role: 'manager', authMode: 'login', currentUser: 'Nguyễn Nguyên', notificationsRead:{admin:false,manager:false,accountant:false,sales:false},
  customers: [],
  company:{name:'',tax:'',email:'',bank:''},
  members: [],
  invoices: [],
  settings:{prefix:'IP-{YYYY}-',nextNumber:'009',currency:'VND - ₫',tax:'10%',due:'20 ngày kể từ ngày phát hành',bank:'Vietcombank (VCB)',accountName:'Công ty TNHH Ánh Dương',accountNumber:'0123 4567 890',transferNote:'Vui lòng ghi mã hóa đơn trong nội dung chuyển khoản.',reminderTitle:'Nhắc thanh toán hóa đơn {ma_hoa_don}',reminderDays:'3, 7, 14'}
};
let accountStateKey='invoicepilot-demo';
const state={...initial};
const entryParams=new URLSearchParams(location.search);
const entryRole=window.INVOICEPILOT_ENTRY_ROLE||entryParams.get('role');
if(entryRole==='admin'||entryRole==='manager'){
 state.role=entryRole;
 state.route=entryRole==='admin'?'admin-overview':'manager-overview';
 const email=entryParams.get('email');
 if(email)state.currentUser=email.split('@')[0];
}
if(state.role==='admin'&&state.route==='admin-customers')state.route='admin-overview';
function persist(){try{localStorage.setItem(accountStateKey,JSON.stringify(state))}catch{}}
const money=n=>new Intl.NumberFormat('vi-VN').format(n)+' ₫';
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const today='10/10/2026';
const app=document.getElementById('app');
function toast(message){const node=document.getElementById('toast');node.textContent=message;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2600)}
function badge(label){let cls=label==='Hoạt động'||label==='Đã thanh toán'?'badge-green':label==='Lưu trữ'||label==='Chờ xác nhận'?'badge-amber':label==='Vô hiệu hóa'?'badge-red':'badge-blue';return `<span class="badge ${cls}">${label}</span>`}
function button(text,kind='btn-primary',action='',ico=''){return `<button class="btn ${kind}" ${action?`data-action="${action}"`:''}>${ico?icon(ico,14):''}${text}</button>`}

function authAside(){return `<aside class="auth-aside"><div class="brand"><span class="brand-mark">${icon('invoice',17)}</span><span class="brand-name">InvoicePilot</span></div><div class="eyebrow">BTL-19 · Quản trị và quản lý</div><h1>Rõ từng hóa đơn.<br>Chủ động từng khoản thu.</h1><p>Một không gian làm việc gọn gàng để theo dõi hóa đơn, quản lý công nợ và dự báo dòng tiền.</p><div class="hero-metric"><small>Công ty TNHH Ánh Dương · Tổng phải thu</small><strong>126.500.000 ₫</strong><div class="hero-metric-row"><span>5 hóa đơn đang mở</span><span>3 quá hạn</span></div></div><div class="hero-quote">“Một bảng công nợ chung giúp đội ngũ nhìn rõ việc cần làm và chủ động theo sát dòng tiền.”</div></aside>`}
function authPage(mode=state.authMode){state.authMode=mode;const config={login:{title:'Chào mừng trở lại',desc:'Đăng nhập để theo dõi hóa đơn và công nợ.',submit:'Đăng nhập'},signup:{title:'Đăng ký doanh nghiệp',desc:'Tạo không gian riêng cho đội ngũ của bạn.',submit:'Tạo không gian doanh nghiệp'},forgot:{title:'Khôi phục mật khẩu',desc:'Nhập email công việc để nhận hướng dẫn đặt lại mật khẩu.',submit:'Gửi hướng dẫn'}}[mode];
 let fields=mode==='login'?`<div class="form-group"><label for="email">Email công việc</label><input class="input" id="email" type="email" value="admin@anhduong.demo" autocomplete="username" required></div><div class="form-group"><label for="password">Mật khẩu</label><input class="input" id="password" type="password" value="invoicepilot" autocomplete="current-password" required></div><div class="auth-meta"><label class="check-row"><input type="checkbox" checked> Ghi nhớ đăng nhập</label><a href="#forgot" data-auth="forgot">Quên mật khẩu?</a></div><div class="form-group"><label>Vào bản demo với vai trò</label><div class="role-pick"><button type="button" class="role-choice ${state.role==='manager'?'active':''}" data-role="manager">Quản lý</button><button type="button" class="role-choice ${state.role==='admin'?'active':''}" data-role="admin">Quản trị viên</button></div></div>`:
 mode==='signup'?`<div class="form-group"><label>Tên doanh nghiệp *</label><input class="input" placeholder="Công ty TNHH Ánh Dương" required></div><div class="form-grid"><div class="form-group"><label>Mã số thuế *</label><input class="input" placeholder="0312345678" required></div><div class="form-group"><label>Người đại diện *</label><input class="input" placeholder="Nguyễn Minh Quân" required></div></div><div class="form-group"><label>Email quản trị *</label><input class="input" type="email" placeholder="quan@congty.vn" required></div><div class="form-grid"><div class="form-group"><label>Mật khẩu *</label><input class="input" type="password" placeholder="Tối thiểu 8 ký tự" required></div><div class="form-group"><label>Xác nhận mật khẩu *</label><input class="input" type="password" placeholder="Nhập lại mật khẩu" required></div></div><label class="check-row"><input type="checkbox" required> Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật.</label>`:
 `<div class="form-group"><label for="email">Email công việc</label><input class="input" id="email" type="email" placeholder="ten@congty.vn" required></div>`;
 app.innerHTML=`<div class="auth-page">${authAside()}<main class="auth-main"><div class="auth-card"><div class="auth-top"><button data-auth="home">← Trang chủ</button></div><h2>${config.title}</h2><p>${config.desc}</p><form class="auth-form" id="auth-form">${fields}<button class="btn btn-primary auth-submit" type="submit">${config.submit} ${icon('arrow',14)}</button></form>${mode==='login'?'<div class="auth-note"><strong>Tài khoản dùng thử</strong><br>admin@anhduong.demo · invoicepilot<br>Bản demo hỗ trợ xem hai vai trò Quản trị viên và Quản lý.</div>':''}<div class="auth-foot">${mode==='login'?`Chưa có không gian làm việc? <button data-auth="signup">Đăng ký doanh nghiệp</button>`:mode==='signup'?`Đã có tài khoản? <button data-auth="login">Đăng nhập</button>`:`Đã nhớ mật khẩu? <button data-auth="login">Quay lại đăng nhập</button>`}</div></div></main></div>`;
 document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>{state.role=el.dataset.role;authPage('login')});
 document.getElementById('auth-form').onsubmit=e=>{e.preventDefault();if(mode==='login'){state.route=state.role==='admin'?'admin-overview':'manager-overview';persist();render()}else if(mode==='signup'){toast('Không gian doanh nghiệp đã sẵn sàng trong bản demo.');authPage('login')}else toast('Nếu email tồn tại, hướng dẫn khôi phục sẽ được gửi.');};
}
function homePage(){app.innerHTML=`<div class="auth-page"><aside class="auth-aside"><div class="hero-nav"><div class="brand"><span class="brand-mark">${icon('invoice',17)}</span><span class="brand-name">InvoicePilot</span></div><div class="hero-nav-actions"><button class="btn btn-soft" data-auth="login">Đăng nhập</button><button class="btn btn-primary" data-auth="signup">Đăng ký</button></div></div><div style="margin:auto 0"><div class="eyebrow">BTL-19 · Nền tảng công nợ doanh nghiệp</div><h1>Thu tiền đúng hạn.<br>Vận hành nhẹ nhàng.</h1><p>Theo dõi hóa đơn, đối chiếu thanh toán và quản lý công nợ trong một không gian rõ ràng, dễ kiểm soát.</p><div class="hero-nav-actions" style="margin-top:22px"><button class="btn btn-primary" data-auth="signup">Khám phá bản demo ${icon('arrow',14)}</button><button class="btn btn-soft" data-auth="login">Xem quy trình</button></div><div class="feature-row"><div class="feature"><strong>Hóa đơn không bỏ sót</strong>Nhắc việc rõ ràng, kiểm tra trước khi phát hành.</div><div class="feature"><strong>Công nợ luôn rõ ràng</strong>Tổng hợp số liệu theo khách hàng và thời hạn.</div><div class="feature"><strong>Chủ động dòng tiền</strong>Dự báo thu tiền để lên kế hoạch phù hợp.</div></div></div><div class="hero-quote">© 2026 InvoicePilot · Không gian quản trị và quản lý</div></aside><main class="auth-main"><div class="auth-card"><div class="hero-metric" style="max-width:100%;margin:0 0 14px"><small>Tổng phải thu · 5 hóa đơn đang mở</small><strong>126.500.000 ₫</strong><div class="hero-metric-row"><span>Đã thu tháng này 27.500.000 ₫</span><span>Quá hạn 71.500.000 ₫</span></div></div><div class="panel"><div class="panel-title"><div><h2>Thu tiền trong tháng</h2><p>Xu hướng thu tiền theo tuần</p></div><span class="badge badge-blue">+12,8%</span></div>${chartMarkup([35,0,62,48,77],['02/10','04/10','06/10','08/10','10/10'])}</div><div class="panel" style="margin-top:14px"><div class="panel-title"><div><h2>Từ hóa đơn đến khoản thu, trong 3 bước</h2><p>1. Tạo hóa đơn · 2. Theo dõi công nợ · 3. Đối chiếu</p></div></div><div class="summary-line"><span>Không gian dùng riêng cho đội ngũ</span>${icon('check',15)}</div><div class="summary-line"><span>Phân quyền theo vai trò</span>${icon('check',15)}</div></div></div></main></div>`}

const roleNav={admin:[['admin-overview','grid','Tổng quan'],['admin-customers','users','Khách hàng'],['admin-settings','settings','Cài đặt'],['admin-notifications','bell','Thông báo']],manager:[['manager-overview','grid','Tổng quan phải thu'],['manager-overdue','clock','Hóa đơn quá hạn'],['manager-forecast','chart','Dự báo dòng tiền'],['manager-notifications','bell','Thông báo'],['manager-settings','settings','Cài đặt']]};
function shell(content){
 const role=state.route.startsWith('admin')?'admin':'manager';
 const title=role==='admin'?'Quản trị viên':'Quản lý';
 const displayName=escapeHTML(state.currentUser&&state.currentUser!=='demo'?state.currentUser:(role==='admin'?'Admin':'Nguyễn Nguyên'));
 const hasUnread=typeof window.IP_SHARED_NOTIFICATIONS_UNREAD==='boolean'?window.IP_SHARED_NOTIFICATIONS_UNREAD:state.notificationsRead?.[role]!==true;
 const active=state.route;
 const company=escapeHTML(state.company?.name||'Công ty Minh Phát');
 app.innerHTML=`<div class="app-shell ${role==='admin'?'admin-shell':''}"><aside class="sidebar"><div class="brand"><span class="brand-mark">IP</span><span class="brand-name">InvoicePilot</span></div><button class="company-switch"><span class="company-avatar">CT</span><span><strong>${company}</strong><small>Không gian làm việc</small></span><span class="company-chevron">⌄</span></button><div class="nav-label">Không gian làm việc</div><nav class="nav-list">${roleNav[role].map(([route,ico,label])=>`<button class="nav-item ${active===route?'active':''}" data-route="${route}">${icon(ico,16)}<span>${label}</span>${route.endsWith('notifications')&&hasUnread?`<small class="nav-count">${role==='admin'?'2':'3'}</small>`:''}</button>`).join('')}</nav><div class="sidebar-spacer"></div><div class="side-note"><span>✦</span><div><strong>Cần hỗ trợ?</strong><br>Hướng dẫn sử dụng InvoicePilot<br><a href="#help" data-action="help">Xem hướng dẫn →</a></div></div>${role==='admin'?'':`<a class="side-home" href="#home" data-auth="home">← Trang giới thiệu</a>`}</aside><main class="main-area"><header class="topbar"><div class="crumb"><strong>${active.includes('overview')?'Tổng quan':active.includes('customers')?'Khách hàng':active.includes('settings')?'Cài đặt':active.includes('notifications')?'Thông báo':title}</strong></div><div class="global-search">${icon('search',15)}<input id="role-global-search" placeholder="Tìm hóa đơn, khách hàng..." autocomplete="off"><kbd>⌘ K</kbd><div class="role-global-search-results" id="role-global-search-results" hidden></div></div><div class="top-actions"><button class="top-link notification-bell" data-action="notification-menu" aria-label="Thông báo">${icon('bell',17)}${hasUnread?'<i class="dot notification-dot-indicator"></i>':''}</button><button class="user-menu" data-action="profile"><span class="avatar">${displayName.slice(0,2).toLocaleUpperCase('vi')}</span><span class="user-meta"><strong>${displayName}</strong><small>${title}</small></span></button><button class="btn btn-soft logout-button" data-action="logout">Đăng xuất</button></div></header>${content}</main></div>`;
 const globalSearch=document.getElementById('role-global-search');
 const globalResults=document.getElementById('role-global-search-results');
 if(globalSearch&&globalResults){
  const available=role==='admin'?state.customers.map(row=>({title:row[0],kind:'Khách hàng',search:`${row[0]} ${row[3]} ${row[4]} ${row[1]}`,route:'admin-customers',query:row[0]})):[...state.invoices.map(row=>({title:row.id,kind:'Hóa đơn',search:`${row.id} ${row.customer}`,route:'manager-overdue',query:row.id})),...Array.from(new Set(state.invoices.map(row=>row.customer))).map(name=>({title:name,kind:'Khách hàng',search:name,route:'manager-overdue',query:name}))];
  globalSearch.addEventListener('input',()=>{const q=globalSearch.value.trim().toLocaleLowerCase('vi');globalResults.replaceChildren();if(!q){globalResults.hidden=true;return}const matches=available.filter(item=>item.search.toLocaleLowerCase('vi').includes(q)).slice(0,7);if(!matches.length){const empty=document.createElement('p');empty.textContent='Không tìm thấy hóa đơn hoặc khách hàng.';empty.className='role-global-search-empty';globalResults.append(empty)}matches.forEach(item=>{const button=document.createElement('button');button.type='button';button.className='role-global-search-result';const title=document.createElement('strong');title.textContent=item.title;const description=document.createElement('small');description.textContent=`${item.kind} · Nhấn để mở danh sách`;button.append(title,description);button.addEventListener('click',()=>{state.route=item.route;persist();render();const filter=document.getElementById(role==='admin'?'customer-search':'invoice-search');if(filter){filter.value=item.query;filter.dispatchEvent(new Event('input',{bubbles:true}))}});globalResults.append(button)});globalResults.hidden=false});
  globalSearch.addEventListener('keydown',event=>{if(event.key==='Escape')globalResults.hidden=true});
 }
 document.addEventListener('click',event=>{if(!event.target.closest('.global-search'))globalResults?.setAttribute('hidden','')});
 document.querySelector('[data-action="logout"]').onclick=async()=>{try{await IPCommon.signOut()}finally{window.location.href='../common/index.html'}};
 document.querySelector('[data-action="notification-menu"]').onclick=e=>{e.stopPropagation();toggleRoleNotificationMenu()};
 document.querySelector('[data-action="profile"]').onclick=()=>toast(`Đang đăng nhập với vai trò ${title}.`);
 document.querySelector('[data-action="help"]').onclick=e=>{e.preventDefault();toast('Trung tâm hướng dẫn đang được hoàn thiện.')};
}

function toggleRoleNotificationMenu(){
 const existing=document.querySelector('.admin-role-notification-menu');
 if(existing){existing.remove();return}
 const role=state.route.startsWith('admin')?'admin':'manager';
 const unread=state.notificationsRead?.[role]!==true;
 const admin=role==='admin';
 const title=admin?'Hóa đơn mới được phát hành':'3 hóa đơn đã quá hạn thanh toán';
 const detail=admin?'IP-2026-009 · Công ty TNHH Minh Anh':'Tổng công nợ quá hạn 71.500.000 ₫ · Cần theo dõi khách hàng.';
 const route=admin?'admin-customers':'manager-overdue';
 const action=admin?'Xem khách hàng':'Xem hóa đơn quá hạn';
 const panel=document.createElement('section');
 panel.className='admin-role-notification-menu';
 panel.innerHTML=`<div class="admin-role-notification-heading"><strong>Thông báo ${admin?'Quản trị viên':'Quản lý'}</strong><span>${unread?'Mới':'Đã xem'}</span></div><article><b>${title}</b><small>${detail}</small><button type="button" class="admin-role-notification-link" data-route="${route}">${action}</button></article><button type="button" class="admin-role-notification-mark" data-role-notification-read="${role}" ${unread?'':'disabled'}>Đánh dấu đã đọc</button>`;
 document.querySelector('.top-actions')?.append(panel);
 panel.querySelector('[data-role-notification-read]')?.addEventListener('click',()=>{
   state.notificationsRead={...(state.notificationsRead||{}),[role]:true};persist();
   document.querySelector('.notification-dot-indicator')?.remove();
   document.querySelector('.nav-count')?.remove();
   panel.querySelector('.admin-role-notification-heading span').textContent='Đã xem';
   panel.querySelector('[data-role-notification-read]').disabled=true;
 });
}
document.addEventListener('click',e=>{
 if(!e.target.closest('.admin-role-notification-menu')&&!e.target.closest('[data-action="notification-menu"]'))document.querySelector('.admin-role-notification-menu')?.remove();
});

function pageHead(title,description,actions=''){return `<div class="page-head"><div><h1>${title}</h1><p>${description}</p></div><div class="head-actions">${actions}</div></div>`}
function cardStat(label,value,sub,ico,accent=''){return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon(ico,14)}</span></div><div class="stat-value ${accent}">${value}</div><div class="stat-sub">${sub}</div></article>`}
function chartMarkup(vals,labels){const max=Math.max(...vals,1);return `<div class="chart">${vals.map((n,i)=>`<div class="bar-wrap"><div class="bar ${i===0?'dark':''}" style="height:${Math.max(3,n/max*82)}%"><span class="bar-value">${n===0?'0':n}</span></div><span class="x-label">${labels[i]}</span></div>`).join('')}</div>`}
function table(rows,headers){return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}


function companyNotificationsPage(description){
 const content=`<div class="content">${pageHead('Thông báo',description)}<section class="panel notification-list"><div id="company-notifications-page"><div class="empty-state">Đang tải thông báo…</div></div></section></div>`;
 shell(content);
 (async()=>{
  const host=document.getElementById('company-notifications-page');if(!host)return;
  try{
   const items=await IPCommon.getCompanyNotifications(50);
   host.innerHTML=items.length?`${items.some(item=>!item.readAt)?'<button class="btn btn-soft" type="button" data-company-notifications-read>Đánh dấu đã đọc</button>':''}${items.map(item=>{const customer=item.event_type==='customer_added';const success=item.event_type==='payment_received'||item.event_type==='payment_reconciled';const kind=customer?'users':success?'success':'invoice';const time=new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(item.created_at));return `<article class="notification-item ${item.readAt?'':'unread'}"><span class="notification-icon ${kind}">${icon(success?'check':customer?'users':'invoice',16)}</span><div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><small>${time}</small></div>${item.readAt?'':'<span class="notification-dot"></span>'}</article>`}).join('')}`:'<div class="empty-state">Chưa có thông báo.</div>';
  }catch(error){host.innerHTML=`<div class="empty-state">Không tải được thông báo: ${escapeHTML(error.message||'Hãy kiểm tra kết nối Supabase.')}</div>`}
 })();
}

























async function refreshSharedBusinessData(){const shared=await IPCommon.getCompanyBusinessData();state.customers=shared.customers.map(c=>[c.name,c.tax,c.status,c.contact,c.email,c.debt,c.id]);const todayDate=new Date();todayDate.setHours(0,0,0,0);state.invoices=shared.invoices.map(i=>{const dueDate=i.dueDate?new Date(`${i.dueDate}T00:00:00`):todayDate;return{id:i.id,customer:i.customer,date:i.due,due:i.due,days:Math.max(0,Math.floor((todayDate-dueDate)/86400000)),amount:i.balance,balance:i.balance,totalAmount:i.amount,status:i.status,owner:'Chưa phân công'}});persist();}






function render(){if(state.route==='home')return homePage();if(state.route==='login'||state.route==='signup'||state.route==='forgot')return authPage(state.route);if(state.route==='manager-overview')return managerOverview();if(state.route==='manager-overdue')return overduePage();if(state.route==='manager-forecast')return forecastPage();if(state.route==='manager-notifications')return managerNotifications();if(state.route==='manager-settings')return managerSettings();if(state.route==='admin-overview')return adminOverview();if(state.route==='admin-notifications')return adminNotifications();if(state.route==='admin-customers')return adminCustomers();if(state.route==='admin-users')return adminUsers();if(state.route==='admin-settings')return adminSettings();return authPage('login')}
document.addEventListener('click',e=>{const route=e.target.closest('[data-route]');if(route){e.preventDefault();state.route=route.dataset.route;persist();render();return}const auth=e.target.closest('[data-auth]');if(auth){e.preventDefault();if(auth.dataset.auth==='home'){state.route='home';render()}else if(auth.dataset.auth==='login'){window.location.href='../common/index.html'}else if(auth.dataset.auth==='signup'){window.location.href='../common/signup.html'}else{state.route=auth.dataset.auth;authPage(auth.dataset.auth)}return}const action=e.target.closest('[data-action]');if(!action)return;switch(action.dataset.action){case'route':state.route='manager-forecast';persist();render();break;case'scenario':scenario();break;case'export':InvoicePilotAdminTools.exportOverdue(state.invoices);toast('Đã tải báo cáo hóa đơn quá hạn.');break;case'export-customers':exportCustomersCsv();break;case'add-customer':customerModal();break;case'add-member':memberModal();break;case'delete-member':deleteMemberModal(action.dataset.memberId,action.dataset.memberName);break;case'save-settings':saveSettings();break;case'save-manager-preferences':saveManagerPreferences();break;case'assign':assignOwner();break;case'invoice-detail':e.preventDefault();InvoicePilotAdminTools.showInvoice(action.dataset.id||state.invoices[0]?.id,state.invoices,money,document.getElementById('modal-root'),toast);break;case'edit-customer':e.preventDefault();{const i=Number(action.dataset.index);customerModal(state.customers[i],i);break}case'edit-member':e.preventDefault();{const i=Number(action.dataset.index);memberModal(state.members[i],i);break}case'view-report':InvoicePilotAdminTools.exportForecast();toast('Đã tải báo cáo dự báo dòng tiền.');break;case'mark-read':{const role=state.route.startsWith('admin')?'admin':'manager';state.notificationsRead={...(state.notificationsRead||{}),[role]:true};persist();document.querySelectorAll('.notification-item').forEach(x=>x.classList.remove('unread'));document.querySelectorAll('.notification-item .notification-dot').forEach(x=>x.remove());document.querySelector('.notification-dot-indicator')?.remove();document.querySelector('.nav-count')?.remove();toast('Đã đánh dấu thông báo là đã đọc.');break}case'help':toast('Trung tâm hướng dẫn đang được hoàn thiện.');break;case'users':state.route='admin-users';persist();render();break}});
IPCommon.requireRole(state.role === 'admin' ? 'admin' : 'manager').then(async profile => {
  if (!profile) return;
  accountStateKey = IPCommon.accountStorageKey('invoicepilot-demo');
  try {
    const saved = JSON.parse(localStorage.getItem(accountStateKey) || 'null');
    if (saved && typeof saved === 'object') Object.assign(state, saved);
  } catch { /* A newly registered account starts with clean workspace data. */ }
  state.role = profile.role;
  const expectedRoutePrefix = profile.role === 'admin' ? 'admin-' : 'manager-';
  if (!state.route.startsWith(expectedRoutePrefix)) state.route = profile.role === 'admin' ? 'admin-overview' : 'manager-overview';
  state.currentUser = profile.full_name || state.currentUser;
  state.company = { ...state.company, name: profile.company_name || '', tax: profile.tax_code || '', email: profile.email || '' };
  state.settings = { ...state.settings, accountName: profile.company_name || '' };
  try {
    await refreshSharedBusinessData();
    IPCommon.subscribeCompanyBusinessData(async () => { try { await refreshSharedBusinessData(); render(); } catch (error) { console.error('Không đồng bộ được dữ liệu dùng chung:', error); } });
  } catch (error) {
    console.error('Không tải được dữ liệu dùng chung:', error);
    state.customers = [];
    state.invoices = [];
    state.businessDataError = error.message || 'Không tải được dữ liệu dùng chung.';
  }
  if (profile.role === 'admin') {
    try { await refreshCompanyMembers(); state.memberLoadError = ''; }
    catch (error) { console.error('Không tải được danh sách thành viên:', error); state.members = []; state.memberLoadError = error.message || 'Không tải được danh sách thành viên.'; }
  }
  persist();
  render();
});
