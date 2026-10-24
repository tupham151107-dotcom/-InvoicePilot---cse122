(() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function downloadCsv(rows, filename) {
    const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportOverdue(invoices) {
    downloadCsv([['Hóa đơn', 'Khách hàng', 'Hạn thanh toán', 'Ngày quá hạn', 'Còn phải thu', 'Phụ trách'], ...invoices.map(item => [item.id, item.customer, item.date, item.days, item.amount, item.owner])], 'invoicepilot-hoa-don-qua-han.csv');
  }

  function exportForecast() {
    downloadCsv([['Kịch bản', 'Tỷ lệ thu', 'Dự kiến thu (VND)'], ['Thận trọng', '60%', 75900000], ['Cơ sở', '80%', 101200000], ['Tích cực', '100%', 126500000]], 'invoicepilot-du-bao-dong-tien.csv');
  }

  function showInvoice(id, invoices, money, root, toast) {
    const invoice = invoices.find(item => item.id === id);
    if (!invoice) { toast('Không tìm thấy hóa đơn này.'); return; }
    const rows = [['Mã hóa đơn', invoice.id], ['Khách hàng', invoice.customer], ['Hạn thanh toán', invoice.date], ['Số ngày quá hạn', `${invoice.days} ngày`], ['Còn phải thu', money(invoice.amount)], ['Người phụ trách', invoice.owner]];
    root.innerHTML = `<div class="modal-backdrop" data-invoice-detail-backdrop><section class="modal invoice-detail-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title"><div class="modal-head"><div><h2 id="invoice-detail-title">Chi tiết hóa đơn</h2><p>Thông tin khoản phải thu đang theo dõi</p></div><button class="modal-close" type="button" aria-label="Đóng" data-close-invoice-detail>×</button></div><div class="invoice-detail-grid">${rows.map(([label, value]) => `<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join('')}</div><div class="modal-actions"><button class="btn btn-primary" type="button" data-close-invoice-detail>Đóng</button></div></section></div>`;
    const close = () => root.replaceChildren();
    root.querySelectorAll('[data-close-invoice-detail]').forEach(button => button.addEventListener('click', close));
    root.querySelector('[data-invoice-detail-backdrop]').addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
  }

  window.InvoicePilotAdminTools = { exportOverdue, exportForecast, showInvoice };
})();
