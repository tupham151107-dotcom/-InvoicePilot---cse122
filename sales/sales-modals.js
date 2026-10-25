/* Sales forms and accessible dialogs. No authentication logic is changed here. */
(() => {
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function create({workspace, getCustomers, saveCustomer, saveOpportunity, saveTask}) {
    let closeCurrent;
    function close() { closeCurrent?.(); }
    function open(title, body, submit) {
      close(); const previous = document.activeElement;
      const box = document.createElement('div'); box.className = 'sales-reminder-backdrop';
      box.innerHTML = `<section class="sales-reminder-modal" role="dialog" aria-modal="true" aria-labelledby="sales-modal-title"><header><h2 id="sales-modal-title">${safe(title)}</h2><button class="sales-reminder-close" type="button" data-close aria-label="Đóng">×</button></header>${body}</section>`;
      workspace.append(box);
      function key(event) {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
        if (event.key !== 'Tab') return;
        const fields = [...box.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => !el.disabled && el.getClientRects().length);
        if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0]?.focus(); }
      }
      document.addEventListener('keydown', key, true);
      closeCurrent = () => { document.removeEventListener('keydown', key, true); box.remove(); closeCurrent = null; if (previous?.isConnected) previous.focus(); else workspace.querySelector('h1')?.focus(); };
      box.addEventListener('click', e => { if (e.target === box || e.target.closest('[data-close]')) close(); });
      const form = box.querySelector('form');
      form?.addEventListener('input', e => { e.target.setCustomValidity?.(''); const hint = e.target.closest('label')?.querySelector('[data-field-error]'); if (hint) hint.textContent = ''; });
      form?.addEventListener('invalid', e => { const label = e.target.closest('label'); if (!label) return; let hint = label.querySelector('[data-field-error]'); if (!hint) { hint = document.createElement('small'); hint.dataset.fieldError = ''; hint.className = 'sales-form-error'; label.append(hint); } hint.textContent = e.target.validationMessage; }, true);
      form?.addEventListener('submit', async e => {
        e.preventDefault(); if (form.dataset.busy) return;
        for (const input of form.querySelectorAll('input[required],textarea[required]')) if (!input.value.trim()) input.setCustomValidity('Vui lòng nhập nội dung, không chỉ khoảng trắng.');
        if (!form.reportValidity()) return;
        const button = form.querySelector('[type="submit"]'), error = form.querySelector('[data-error]');
        form.dataset.busy = 'true'; button.disabled = true; error.textContent = '';
        try { await submit(new FormData(form), {form, close, box}); }
        catch (err) { error.textContent = err.message || 'Không lưu được. Hãy thử lại.'; error.focus(); }
        finally { delete form.dataset.busy; button.disabled = false; }
      });
      box.querySelector('input,select,textarea,button')?.focus(); return box;
    }
    const input = (label, name, value = '', type = 'text', attrs = '') => `<label>${label}<input name="${name}" type="${type}" value="${safe(value)}" ${attrs}></label>`;
    const select = (label, name, rows, value) => `<label>${label}<select name="${name}" required>${rows.map(([id,text]) => `<option value="${safe(id)}" ${id === value ? 'selected' : ''}>${safe(text)}</option>`).join('')}</select></label>`;
    const options = rows => rows.map(x => [x,x]);
    const form = body => `<form class="sales-data-form">${body}<p class="sales-form-error" role="alert" tabindex="-1" data-error></p><footer><button type="button" class="button" data-close>Hủy</button><button class="button button-primary" type="submit">Lưu</button></footer></form>`;
    function customerForm(item = {}) {
      open(item.id ? 'Sửa khách hàng' : 'Thêm khách hàng', form(
        input('Tên khách hàng','name',item.name,'text','required maxlength="100"') + input('Người liên hệ','contact',item.contact,'text','required maxlength="80"') + input('Email','email',item.email,'email','required maxlength="120"') + input('Điện thoại','phone',item.phone,'tel','maxlength="20" pattern="[+0-9 ().\\-]{8,20}"') + input('Mã số thuế','tax',item.tax,'text','maxlength="30"') + (!item.id ? input('Công nợ đầu kỳ (₫)','openingBalance',0,'number','required min="0" step="1" max="99999999999999"') : '') + select('Trạng thái','status',options(['Đang hoạt động','Đang theo dõi','Cần liên hệ','Cần theo dõi']),item.status)
      ), async (data, dialog) => {
        const values = Object.fromEntries(data); Object.keys(values).forEach(key => values[key] = values[key].trim());
        if (getCustomers().some(row => row.id !== item.id && row.name.toLocaleLowerCase('vi') === values.name.toLocaleLowerCase('vi'))) { const field = dialog.form.elements.name; field.setCustomValidity('Tên khách hàng đã tồn tại.'); field.reportValidity(); return; }
        await saveCustomer({...item,...values,openingBalance:Number(values.openingBalance ?? item.openingBalance ?? 0)}); dialog.close();
      });
    }
    function opportunityForm(item = {}) {
      const customers = getCustomers();
      if (!customers.length) return open('Cần có khách hàng','<p>Thêm khách hàng trước khi tạo cơ hội.</p>');
      open(item.id ? 'Sửa cơ hội' : 'Thêm cơ hội',form(
        input('Tên cơ hội','name',item.name,'text','required maxlength="120"') + select('Khách hàng','customerId',customers.map(x => [String(x.id),x.name]),item.customerId || String(customers.find(x => x.name === item.customer)?.id || '')) + input('Giá trị dự kiến (₫)','value',item.value,'number','required min="1" step="1" max="99999999999999"') + select('Giai đoạn','stage',options(['Tiềm năng','Đủ điều kiện','Đang trao đổi','Đề xuất','Đàm phán','Thành công','Thất bại']),item.stage) + input('Dự kiến chốt','closeISO',item.closeISO,'date','required')
      ),async (data,dialog) => {
        const values = Object.fromEntries(data), date = new Date(`${values.closeISO}T00:00:00`), today = new Date(); today.setHours(0,0,0,0);
        if (!Number.isFinite(date.getTime())) throw new Error('Ngày chốt không hợp lệ.');
        if (!item.id && date < today && !['Thành công','Thất bại'].includes(values.stage)) { const field = dialog.form.elements.closeISO; field.setCustomValidity('Ngày chốt cơ hội mới phải từ hôm nay.'); field.reportValidity(); return; }
        await saveOpportunity({...item,...values,name:values.name.trim(),customer:customers.find(x => String(x.id) === values.customerId).name,value:Number(values.value),close:date.toLocaleDateString('vi-VN')}); dialog.close();
      });
    }
    function taskForm(item = {}) {
      const customers = getCustomers(); if (!customers.length) return open('Cần có khách hàng','<p>Thêm khách hàng trước khi tạo lịch chăm sóc.</p>');
      open(item.id ? 'Sửa lịch chăm sóc' : 'Thêm lịch chăm sóc',form(input('Nội dung','title',item.title,'text','required maxlength="200"') + select('Khách hàng','customerId',customers.map(x => [String(x.id),x.name]),item.customerId) + input('Thời gian liên hệ','when',item.when,'datetime-local','required') + select('Trạng thái','status',options(['Chưa hoàn thành','Hoàn thành']),item.status) + `<label>Ghi chú kết quả<textarea name="note" maxlength="2000">${safe(item.note)}</textarea></label>`),async (data,dialog) => { const values = Object.fromEntries(data); await saveTask({...item,...values,title:values.title.trim(),customer:customers.find(x => String(x.id) === values.customerId).name}); dialog.close(); });
    }
    function confirm(title, submit) { return open(title,form(input('Lý do','reason','','text','required maxlength="200"')),async (data,dialog) => { await submit(String(data.get('reason')).trim()); dialog.close(); }); }
    return {open,close,customerForm,opportunityForm,taskForm,confirm};
  }
  window.InvoicePilotSalesModals = {create};
})();
