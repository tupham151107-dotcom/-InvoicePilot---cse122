(() => {
  window.InvoicePilotRoles = window.InvoicePilotRoles || {};
  window.InvoicePilotRoles.admin = {
    label: "Quản trị viên", initials: "AD",
    nav: [["overview", "Tổng quan", "▦"], ["customers", "Khách hàng", "♙"], ["settings", "Cấu hình", "⚙"]],
    permissions: { editCustomers: true, manageCustomers: true, inviteMembers: true },
    dashboard: { title: "Tổng quan hệ thống", tableTitle: "Hóa đơn gần đây", tableSubtitle: "Cập nhật trạng thái và khoản phải thu", tablePage: "invoices", tableType: "invoices", chartTitle: "Thu chi theo tháng" },
    renderMetrics({ metric, money, number, stats }) {
      return `<section class="metrics">${metric("Khách hàng", number(stats.activeCustomers), "3 · mới trong tháng", "♙")}${metric("Đang có công nợ", number(stats.debtorCount), "trên toàn hệ thống", "◷")}${metric("Tổng hóa đơn", number(stats.invoiceCount), "6 · lập tháng này", "▤")}${metric("Tổng giá trị hóa đơn", money(stats.invoiceValue), "ổn định · so với tháng trước", "₫", "up")}</section>`;
    }
  };
})();
