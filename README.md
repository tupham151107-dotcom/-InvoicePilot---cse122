# InvoicePilot · BTL-19

Nhánh `feature/accountant-anhai27` chứa phân hệ Kế toán do thành viên phụ trách:

**Họ và tên:**: Nguyễn Hải An

Dự án sử dụng HTML, CSS và JavaScript. Phân hệ Kế toán hỗ trợ theo dõi hóa đơn, khách hàng, thanh toán và công nợ; nội dung thay đổi trong nhánh này tập trung vào phần Kế toán.

## Cấu trúc trong nhánh này

```text
BTL-19_InvoicePilot/
├── README.md
├── accountant/
│   ├── index.html
│   ├── accountant.css
│   └── accountant.js
├── assets/
├── css/
├── design/
├── docs/
├── js/
└── pages/
```

Các thư mục `assets/`, `css/`, `design/`, `docs/`, `js/` và `pages/` là khung cấu trúc dự án. Giao diện của phân hệ Kế toán nằm trong thư mục `accountant/`; một số chức năng và tài nguyên dùng chung được tích hợp từ nhánh chính khi hợp nhất.

## Chức năng Kế toán

- Xem tổng quan hóa đơn, khoản đã thu và công nợ.
- Tạo hóa đơn, tra cứu hóa đơn và xem bản chi tiết.
- Theo dõi khách hàng, thông tin liên hệ và công nợ.
- Ghi nhận thanh toán và xem lịch sử hóa đơn.
- In hoặc lưu hóa đơn dưới dạng PDF.

## Quy tắc tích hợp

1. Giữ các thay đổi nghiệp vụ trong phạm vi phân hệ Kế toán.
2. Thống nhất trước khi thay đổi API hoặc tài nguyên dùng chung.
3. Dùng design token và quy tắc giao diện chung của dự án.
4. Làm việc trên nhánh riêng, cập nhật từ nhánh tích hợp và tạo commit có nội dung rõ ràng.
5. Kiểm tra giao diện ở kích thước màn hình khác nhau và xác nhận các liên kết, thao tác chính trước khi tạo pull request.
