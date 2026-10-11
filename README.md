# InvoicePilot · BTL-19

Nhánh `feature/manager-admin-TU` chứa phần giao diện dùng chung và các màn hình Quản trị viên, Quản lý do Phạm Đình Tú phụ trách. Dự án dùng HTML, CSS và JavaScript thuần; dữ liệu hiện là dữ liệu demo phía trình duyệt, chưa có backend.

## Cấu trúc trong nhánh này

```text
BTL-19_InvoicePilot/
├── index.html
├── common/                       # Đăng nhập, đăng ký, trang giới thiệu, CSS/JS dùng chung
└── admin-manager/                # Màn hình Quản trị viên và Quản lý
    ├── index.html
    ├── admin-manager.css
    └── admin-manager.js
```

Kế toán và Kinh doanh do các thành viên khác phụ trách; hai phân hệ đó sẽ được nhập vào nhánh tích hợp sau.

## Quy tắc tích hợp

1. Đặt tên class theo BEM, ví dụ `.invoice-table`, `.invoice-table__row`, `.invoice-table__row--overdue`.
2. Giữ thay đổi của mỗi thành viên trong phân hệ được giao; thống nhất trước khi sửa API hoặc tài nguyên trong `common/`.
3. Đặt CSS dùng chung trong `common/common.css`, CSS riêng trong thư mục phân hệ; tránh selector toàn cục để chỉnh một màn hình.
4. Làm việc trên nhánh riêng, cập nhật từ nhánh tích hợp thường xuyên và tạo commit nhỏ có nội dung rõ ràng.
5. Dùng chung design token và giữ nguyên API kết nối giữa shell chung với từng phân hệ.
