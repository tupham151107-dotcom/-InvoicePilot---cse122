(() => {
  window.InvoicePilotRoles = window.InvoicePilotRoles || {};
  window.InvoicePilotRoles.manager = {
    label: "Quản lý", initials: "QL",
    nav: [["overview", "Tổng quan", "▦"], ["forecast", "Dự báo dòng tiền", "⌁"], ["invoices", "Hóa đơn", "▤"]],
    permissions: { editCustomers: false, manageCustomers: false, inviteMembers: false },
    dashboard: { title: "Dashboard điều hành", tableTitle: "Hóa đơn gần đây", tableSubtitle: "Cập nhật trạng thái và khoản phải thu", tablePage: "invoices", tableType: "invoices", chartTitle: "Doanh thu và dòng tiền" },
    renderMetrics({ metric, money, number, stats }) {
      return `<section class="metrics">${metric("Doanh thu ghi nhận", money(stats.paid), "12,5% · so với tháng trước", "↗")}${metric("Dự kiến thu", money(stats.unpaid), "8,2% · so với tháng trước", "◷")}${metric("Tỷ lệ thu đúng hạn", "92,4%", "4,1% · so với quý trước", "✓")}${metric("Khách hàng hoạt động", number(stats.activeCustomers), "3 · mới trong tháng", "♙")}</section>`;
    }
  };
})();
