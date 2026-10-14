(() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function create({ workspace, customers, opportunities, money, onCustomerAdded, onOpportunityAdded }) {
    function openModal(title, body, onSubmit) {
      workspace.querySelector('[data-sales-modal]')?.remove();
      const backdrop = document.createElement('div');
      backdrop.className = 'sales-reminder-backdrop';
      backdrop.dataset.salesModal = '';
      backdrop.innerHTML = `<section class="sales-reminder-modal sales-data-modal" role="dialog" aria-modal="true" aria-labelledby="sales-modal-title"><header><div><span class="eyebrow">KINH DOANH</span><h2 id="sales-modal-title">${escapeHtml(title)}</h2></div><button type="button" class="sales-reminder-close" aria-label="Đóng" data-close-sales-modal>×</button></header>${body}</section>`;
      workspace.append(backdrop);
      backdrop.addEventListener('click', event => {
        if (event.target === backdrop || event.target.closest('[data-close-sales-modal]')) backdrop.remove();
      });
      const form = backdrop.querySelector('[data-sales-modal-form]');
      form?.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity() || form.dataset.submitting === 'true') return;
        form.dataset.submitting = 'true';
        const submit = form.querySelector('[type="submit"]');
        if (submit) submit.disabled = true;
        try {
          await onSubmit(new FormData(form), backdrop);
        } catch (error) {
          let message = form.querySelector('[data-sales-save-error]');
          if (!message) { message = document.createElement('p'); message.dataset.salesSaveError = ''; message.className = 'sales-form-error'; form.prepend(message); }
          message.textContent = error.message || 'Không lưu được vào dữ liệu chung. Hãy thử lại.';
          if (submit) submit.disabled = false;
        } finally {
          if (backdrop.isConnected) delete form.dataset.submitting;
        }
      });
      backdrop.querySelector('[data-close-sales-modal]')?.focus();
      return backdrop;
    }

    function openCustomerForm() {
      const body = `<form class="sales-data-form" data-sales-modal-form><label>Tên khách hàng<input name="name" required maxlength="100" placeholder="Tên doanh nghiệp"></label><label>Người liên hệ<input name="contact" required maxlength="80" placeholder="Họ tên người liên hệ"></label><label>Email<input name="email" type="email" required maxlength="120" placeholder="email@congty.vn"></label><label>Công nợ hiện tại (₫)<input name="debt" type="number" min="0" step="1" value="0" required></label><label>Hạn thanh toán gần nhất<input name="due" type="date"></label><label>Trạng thái<select name="status"><option>Đang hoạt động</option><option>Đang theo dõi</option><option>Cần liên hệ</option></select></label><footer><button type="button" class="button" data-close-sales-modal>Hủy</button><button class="button button-primary" type="submit">Lưu khách hàng</button></footer></form>`;
      openModal('Thêm khách hàng', body, async (data, modal) => {
        const name = String(data.get('name') || '').trim();
        if (customers.some(customer => customer.name.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
          modal.querySelector('.sales-form-error')?.remove();
          const error = document.createElement('p');
          error.className = 'sales-form-error';
          error.setAttribute('role', 'alert');
          error.textContent = 'Khách hàng này đã có trong danh sách.';
          modal.querySelector('[data-sales-modal-form]').prepend(error);
          modal.querySelector('[name="name"]').focus();
          return;
        }
        const dueISO = String(data.get('due') || '');
        const customer = { name, contact: String(data.get('contact') || '').trim(), email: String(data.get('email') || '').trim(), openingBalance: Number(data.get('debt')) || 0, debt: Number(data.get('debt')) || 0, due: dueISO ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${dueISO}T00:00:00`)) : '—', status: String(data.get('status')) };
        await onCustomerAdded(customer, modal);
      });
    }

    function openOpportunityForm() {
      const customerOptions = customers.map(customer => `<option value="${escapeHtml(customer.name)}">${escapeHtml(customer.name)}</option>`).join('');
      const body = `<form class="sales-data-form" data-sales-modal-form><label>Tên cơ hội<input name="name" required maxlength="120" placeholder="Ví dụ: Gia hạn dịch vụ"></label><label>Khách hàng<select name="customer" required>${customerOptions}</select></label><label>Giá trị dự kiến (₫)<input name="value" type="number" min="1" step="1" required placeholder="50000000"></label><label>Giai đoạn<select name="stage"><option>Đủ điều kiện</option><option>Đang trao đổi</option><option>Đề xuất</option><option>Đàm phán</option></select></label><label>Dự kiến chốt<input name="close" type="date" required></label><footer><button type="button" class="button" data-close-sales-modal>Hủy</button><button class="button button-primary" type="submit">Lưu cơ hội</button></footer></form>`;
      openModal('Thêm cơ hội kinh doanh', body, (data, modal) => {
        const name = String(data.get('name') || '').trim();
        const nextNumber = Math.max(0, ...opportunities.map(item => Number(item.id.match(/(\d+)$/)?.[1] || 0))) + 1;
        const closeISO = String(data.get('close'));
        opportunities.unshift({ id: `CH-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`, customer: String(data.get('customer')), name, value: Number(data.get('value')), stage: String(data.get('stage')), close: new Intl.DateTimeFormat('vi-VN').format(new Date(`${closeISO}T00:00:00`)) });
        onOpportunityAdded(name, modal);
      });
    }

    function showDetail(kind, item) {
      if (!item) return;
      const fields = kind === 'customer'
        ? [['Khách hàng', item.name], ['Người liên hệ', item.contact], ['Email', item.email], ['Công nợ', money(item.debt)], ['Hạn thanh toán gần nhất', item.due], ['Trạng thái', item.status]]
        : [['Mã cơ hội', item.id], ['Cơ hội', item.name], ['Khách hàng', item.customer], ['Giá trị dự kiến', money(item.value)], ['Giai đoạn', item.stage], ['Dự kiến chốt', item.close]];
      const body = `<div class="sales-detail-grid">${fields.map(([label, value]) => `<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join('')}</div><footer class="sales-detail-actions"><button type="button" class="button button-primary" data-close-sales-modal>Đóng</button></footer>`;
      openModal(kind === 'customer' ? 'Hồ sơ khách hàng' : 'Chi tiết cơ hội', body, () => {});
    }

    return {
      openCustomerForm,
      openOpportunityForm,
      showCustomer: name => showDetail('customer', customers.find(item => item.name === name)),
      showOpportunity: id => showDetail('opportunity', opportunities.find(item => item.id === id))
    };
  }

  window.InvoicePilotSalesModals = { create };
})();
