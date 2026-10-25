const {chromium} = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(process.env.SALES_TEST_ROOT || path.join(__dirname, '../..'));
fs.mkdirSync('tmp/sales-qa', {recursive:true});
const failures = [], requests = [];
const server = http.createServer((req,res) => {
  const filename = path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!filename.startsWith(root+path.sep)) {res.writeHead(403);return res.end();}
  fs.readFile(filename,(err,data) => {if(err){res.writeHead(404);failures.push(req.url);return res.end();} res.setHeader('Content-Type',filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});
});
const sdk = `(() => {
 const now = new Date();
 window.fixture = {delay:80, fail:false, guest:false,role:'sales', customers:Array.from({length:20},(_,i)=>({id:'c'+i,name:'Khách hàng '+String(i).padStart(2,'0'),contact_name:'Nguyễn An',contact_email:'khach'+i+'@example.com',phone:'0901234567',tax_code:'',status:i%2?'Cần liên hệ':'Đang hoạt động',opening_balance:i*1000000})),invoices:[{id:'inv1',invoice_no:'HD-001',customer_id:'c1',amount:5000000,amount_paid:1000000,issue_date:'2026-01-01',due_date:'2026-02-01'}]};
 const client={auth:{getSession:async()=>({data:{session:fixture.guest?null:{user:{id:'test-sales',email:'sales@example.com'}}}}),signInWithPassword:async()=>{fixture.guest=false;sessionStorage.setItem('qa-auth','1');return {data:{user:{id:'test-sales',email:'sales@example.com'}}}},signOut:async()=>({}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},channel:()=>({on(){return this},subscribe(){return this}}),from(table){let mutation=null,payload=null,recordId=null;const q={select(){return q},eq(field,value){if(field==='id')recordId=value;return q},order(){return q},limit(){return q},insert(v){mutation='insert';payload=v;return q},update(v){mutation='update';payload=v;return q},async single(){if(table==='profiles')return {data:{role:fixture.role,full_name:'Sales QA',company_name:'QA',company_admin_id:'company'}};if(fixture.fail)return {error:{message:'Lỗi thử nghiệm'}};if(mutation==='insert'){const row={id:'new-'+Date.now(),...payload};fixture.customers.unshift(row);return {data:row};}if(mutation==='update'){const row=fixture.customers.find(x=>x.id===recordId);Object.assign(row,payload);return {data:row}};return {data:null}},then(resolve,reject){return new Promise(r=>setTimeout(r,fixture.delay)).then(()=>({data:table==='ip_customers'?fixture.customers:table==='ip_invoices'?fixture.invoices:[],error:fixture.fail?{message:'Lỗi thử nghiệm'}:null})).then(resolve,reject)}};return q}};window.supabase={createClient:()=>client};
})();`;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.SALES_CHROME_PATH || (fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),headless:true});
 const context=await browser.newContext();
 await context.route(/(supabase-2\.110\.8\.js|supabase-js@2)/,r=>r.fulfill({contentType:'text/javascript',body:sdk}));
 await context.route(/^https:\/\/(cdn.botpress.cloud|files.bpcontent.cloud)/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 const page=await context.newPage(); page.on('pageerror',err=>failures.push(err.message));page.on('response',r=>{if(r.status()>=400)requests.push(r.status()+' '+r.url())});
 const go=async section=>{await page.locator('.shared-nav-link[href="#'+section+'"]').click();await page.waitForTimeout(30)};
 await page.goto(base+'/sales/index.html'); await page.getByRole('heading',{name:'Tổng quan kinh doanh',exact:true}).waitFor();
 assert.equal(await page.locator('.role-card').count(),3);
 await go('customers'); assert.equal(await page.locator('tbody tr').count(),8);await page.locator('[data-page="2"]').click();assert.match(await page.locator('.sales-pagination').innerText(),/Trang 2\/3/);await page.locator('[data-page="1"]').click();
 await page.locator('[data-filter="query"]').fill('Khách hàng 01'); assert.equal(await page.locator('tbody tr').count(),1);
 await page.locator('[data-filter="status"]').selectOption('Đang hoạt động'); await page.getByRole('heading',{name:'Chưa có kết quả phù hợp'}).waitFor();
 await page.locator('[data-action="clear"]').click();const downloadPromise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const exported=await downloadPromise;assert.match(exported.suggestedFilename(),/sales-customers.csv/);
 await page.locator('[data-action="add-customer"]').first().click();
 const dialog=page.getByRole('dialog'); await dialog.locator('[name="name"]').fill('Khách hàng 00');await dialog.locator('[name="contact"]').fill('An');await dialog.locator('[name="email"]').fill('an@example.com'); await dialog.getByRole('button',{name:'Lưu',exact:true}).click();
 assert.equal(await dialog.locator('[type="submit"]').isEnabled(),true);
 await dialog.locator('[name="name"]').fill('Khách hàng mới'); await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.locator('[data-action="edit-customer"]').first().click();await dialog.locator('[name="contact"]').fill('Liên hệ đã sửa');await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.match(await page.locator('tbody').innerText(),/Liên hệ đã sửa/);await page.locator('[data-action="edit-customer"]').first().click(); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(),0);
 await go('opportunities');await page.locator('[data-action="add-opportunity"]').first().click();await dialog.locator('[name="name"]').fill('Cơ hội QA');await dialog.locator('[name="value"]').fill('60000000');await dialog.locator('[name="closeISO"]').fill('2027-12-20');await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.equal(await page.locator('tbody tr').count(),1);
 await page.reload();await page.locator('tbody tr').waitFor();assert.equal(await page.locator('tbody tr').count(),1);
 await page.locator('[data-action="edit-opportunity"]').click();await dialog.locator('[name="stage"]').selectOption('Thành công');await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.match(await page.locator('tbody').innerText(),/Thành công/);
 await page.locator('[data-action="archive-opportunity"]').click();await dialog.locator('[name="reason"]').fill('Đã kết thúc');await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.locator('[data-filter="archive"]').selectOption('archived');assert.equal(await page.locator('tbody tr').count(),1);
 await page.locator('[data-action="archive-opportunity"]').click();await dialog.locator('[name="reason"]').fill('Tiếp tục');await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await go('care'); await page.locator('[data-action="add-task"]').first().click();await dialog.locator('[name="title"]').fill('Gọi khách');await dialog.locator('[name="when"]').fill('2027-01-01T09:00');await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.equal(await page.locator('tbody tr').count(),1);
 await go('reminders');await page.locator('[data-action="remind"]').click();await dialog.locator('[data-subject]').fill('Tiêu đề đã sửa');await dialog.locator('[data-message]').fill('Nội dung đã sửa');assert.match(decodeURIComponent(await dialog.locator('[data-email]').getAttribute('href')),/Tiêu đề đã sửa.*Nội dung đã sửa/);await page.keyboard.press('Escape');
 await go('assistant');await page.locator('[name="customer"]').selectOption('c1');await page.locator('[name="goal"]').fill('ngắn');await page.locator('[data-assistant] button').click();await page.locator('[data-ai-error]').filter({hasText:'Chưa đủ dữ liệu'}).waitFor();await page.locator('[name="goal"]').fill('Xác nhận kế hoạch thanh toán');await page.locator('[data-assistant] button').click();await page.locator('[data-action="apply-ai"]').waitFor();await page.locator('[data-action="apply-ai"]').click();await page.getByRole('heading',{name:'Chăm sóc khách hàng',exact:true}).waitFor();assert.equal(await page.locator('tbody tr').count(),2);
 for (const width of [320,375,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  for(const section of ['overview','customers','opportunities','care','reminders','assistant','settings']) {
   await go(section);
   const dimensions=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));if(dimensions.scroll>dimensions.w+1) console.log(await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).slice(0,25)));assert.ok(dimensions.scroll<=dimensions.w+1,JSON.stringify({width,section,...dimensions}));
  }
  await go('customers');await page.locator('[data-action="add-customer"]').first().click();const dimensions=await dialog.evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth}));assert.ok(dimensions.scroll<=dimensions.width+1,'modal overflow '+width);await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:320,height:900});await go('customers');await page.screenshot({path:'tmp/sales-qa/mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'tmp/sales-qa/desktop.png',fullPage:true});
 // Test server error and recovery using the real shared data layer.
 await page.evaluate(()=>{fixture.fail=true});await go('overview');await page.locator('[data-action="retry"]').click();await page.locator('.sales-warning').filter({hasText:'Lỗi thử nghiệm'}).waitFor();await page.evaluate(()=>{fixture.fail=false});await page.locator('[data-action="retry"]').first().click();await page.waitForTimeout(200);
 // Unauthenticated access must redirect through the unchanged auth guard.
 const guest=await context.newPage();await guest.addInitScript(()=>{Object.defineProperty(window,'fixture',{configurable:true,set(value){value.guest=sessionStorage.getItem('qa-auth')!=='1';Object.defineProperty(window,'fixture',{value,writable:true,configurable:true})}})});await guest.goto(base+'/sales/index.html');await guest.waitForURL('**/common/index.html');

 // The actual shared login form must still send a sales session to sales/index.html.
 await guest.locator('#login-email').fill('sales@example.com');await guest.locator('#login-password').fill('password123');await guest.locator('#login-form [type="submit"]').click();await guest.waitForURL('**/sales/index.html*');await guest.getByRole('heading',{name:'Tổng quan kinh doanh',exact:true}).waitFor();
 // Initial error state and retry.
 const failed=await context.newPage();await failed.addInitScript(()=>{Object.defineProperty(window,'fixture',{configurable:true,set(value){value.fail=true;Object.defineProperty(window,'fixture',{value,writable:true,configurable:true})}})});await failed.goto(base+'/sales/index.html');await failed.getByRole('heading',{name:'Chưa tải được dữ liệu'}).waitFor();await failed.evaluate(()=>{fixture.fail=false});await failed.locator('[data-action="retry"]').click();await failed.getByRole('heading',{name:'Tổng quan kinh doanh',exact:true}).waitFor();
 // Full lack of SDK produces a readable failure or auth redirect rather than a blank page.
 const noSdk=await context.newPage();await noSdk.route('**/supabase-2.110.8.js',r=>r.fulfill({contentType:'text/javascript',body:''}));await noSdk.goto(base+'/sales/index.html');await noSdk.waitForURL('**/common/index.html');assert.ok((await noSdk.locator('body').innerText()).length>20);
 // Layout at 200% zoom equivalence: 1440px display with 720 CSS-pixel viewport.
 await page.setViewportSize({width:720,height:500});for(const name of ['customers','opportunities','care','reminders','assistant','settings']){await go(name);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await go('customers');await page.locator('[data-action="add-customer"]').first().click();await page.keyboard.press('Shift+Tab');assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Escape');
 // Failed storage cannot silently report that an opportunity was saved.
 await go('opportunities');await page.locator('[data-filter="archive"]').selectOption('active');await page.locator('[data-action="add-opportunity"]').first().click();await dialog.locator('[name="name"]').fill('Không lưu được');await dialog.locator('[name="value"]').fill('100');await dialog.locator('[name="closeISO"]').fill('2027-12-20');await page.evaluate(()=>{window.savedStorageWrite=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('quota')}});await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await dialog.locator('[data-error]').filter({hasText:'Không lưu được'}).waitFor();assert.ok(await dialog.locator('[type="submit"]').isEnabled());await page.evaluate(()=>{Storage.prototype.setItem=window.savedStorageWrite});await page.keyboard.press('Escape');
 console.log('PASS: shared login form, initial API failure/retry, missing SDK redirect, 200% zoom-equivalent layout, modal keyboard, blocked storage handling.');
assert.deepEqual(failures,[]);assert.deepEqual(requests,[]);console.log('PASS: CRUD, duplicate validation, F5, lifecycle, filters, pagination, reminder edit, suggestion apply, 5 responsive widths, API error/retry, guest auth redirect; zero local 404/page errors.');
 await browser.close();server.close();
})().catch(error=>{console.error(error);server.close();process.exit(1)});
