# InvoicePilot · BTL-19

Prototype quản lý hóa đơn và công nợ bằng HTML, CSS và JavaScript thuần. Mở `index.html` bằng Live Server để chạy website. Nhánh `main` hiện có các thư mục dùng chung và giao diện cho bốn vai trò.

## Phân công vai trò

| Thành viên | Phân hệ | Công việc phụ trách |
|---|---|---|
| **Phạm Đình Tú** | Dùng chung, Quản trị viên, Quản lý | Làm đăng nhập/đăng ký, xác thực và điều hướng; thành phần giao diện dùng chung; màn hình quản trị doanh nghiệp, thành viên và quyền; màn hình quản lý theo dõi hóa đơn, công nợ, dòng tiền và báo cáo. |
| **Nguyễn Hải An (`anhai27`)** | Kế toán | Làm tổng quan kế toán; tạo và quản lý hóa đơn; ghi nhận, đối chiếu thanh toán; tra cứu khách hàng, công nợ và chi tiết hóa đơn. |
| **Phạm Trần Gia Khánh (`kiskypham`)** | Kinh doanh | Làm tổng quan kinh doanh; quản lý khách hàng, khách hàng tiềm năng và cơ hội; tạo nhắc việc, theo dõi chăm sóc khách hàng và chuyển thông tin cần thiết cho Kế toán. |

## Cấu trúc dự án

```text
BTL-19_InvoicePilot/
├── index.html                    # Điểm vào website
├── README.md
├── common/                       # Đăng nhập, đăng ký và tài nguyên dùng chung
├── admin-manager/                # Giao diện Quản trị viên và Quản lý
├── accountant/                   # Giao diện Kế toán
└── sales/                        # Giao diện Kinh doanh
```

Mỗi phân hệ có HTML, CSS và JavaScript riêng; các trang vai trò sử dụng tài nguyên chung trong `common/`.

## Chạy dự án

1. Mở thư mục dự án trong VS Code.
2. Dùng Live Server mở `index.html`.
3. Từ trang đăng nhập, chọn vai trò để vào giao diện tương ứng.

## Quy tắc tích hợp

1. Đặt tên class theo BEM, ví dụ `.invoice-table`, `.invoice-table__row`, `.invoice-table__row--overdue`; dùng prefix theo phân hệ khi cần.
2. Mỗi thành viên ưu tiên sửa trong thư mục được giao. Thống nhất trước khi thay đổi `common/`, API dùng chung hoặc cấu trúc dữ liệu.
3. Đặt CSS dùng chung trong `common/`, CSS riêng trong thư mục phân hệ; tránh selector toàn cục để chỉnh một màn hình.
4. Làm việc trên nhánh riêng, cập nhật từ nhánh tích hợp thường xuyên, commit nhỏ và tạo pull request để rà soát trước khi nhập vào `main`.
5. Phối hợp thống nhất dữ liệu khách hàng giữa Kinh doanh và Kế toán; không giả định dữ liệu đã đồng bộ cho đến khi luồng tích hợp được kiểm tra.
