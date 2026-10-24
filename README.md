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
├── common/                       # Đăng nhập, đăng ký, layout và tài nguyên dùng chung
│   ├── workspace.js               # Logic và layout dùng chung của hai vai trò
│   ├── workspace.css              # CSS dùng chung
│   └── workspace-tools.js         # Xuất báo cáo và xem chi tiết hóa đơn
├── admin/                        # HTML, CSS và JavaScript của Quản trị viên
├── manager/                      # HTML, CSS và JavaScript của Quản lý
├── accountant/                   # Giao diện Kế toán
└── sales/                        # Giao diện Kinh doanh
```

Quản trị viên mở `admin/index.html`; Quản lý mở `manager/index.html`. Mỗi vai trò có HTML, CSS và JavaScript riêng; đăng nhập, dữ liệu doanh nghiệp, bố cục và tiện ích chung nằm trong `common/`. Các luồng đăng nhập, thanh toán, thông báo và trợ lý AI vẫn dùng chung như trước.

## Bài giữa kỳ CSE122 · Trang Quản lý khách hàng

**Trang thực hiện:** Quản trị viên → Khách hàng (`admin/index.html`, chọn **Khách hàng** ở thanh điều hướng).

**Mục đích:** giúp quản trị viên xem danh sách khách hàng trong doanh nghiệp, tra cứu thông tin liên hệ/mã số thuế, theo dõi trạng thái và công nợ, đồng thời thêm hoặc cập nhật hồ sơ khách hàng. Dữ liệu khách hàng lấy từ vùng dữ liệu dùng chung của doanh nghiệp; thay đổi được gửi qua Supabase để các vai trò được cấp quyền cùng sử dụng.

**Chức năng có thể trình diễn:**

- Tìm theo tên doanh nghiệp, mã số thuế, người liên hệ hoặc email.
- Lọc khách hàng đang hoạt động/cần theo dõi.
- Mở form thêm hoặc xem/sửa; kiểm tra trường bắt buộc và email, báo lỗi khi lưu thất bại.
- Xem số lượng khách hàng, số khách còn công nợ và tổng phải thu.
- Xuất danh sách đang lọc thành CSV để mở bằng bảng tính.
- Bố cục co lại cho màn hình nhỏ; bảng có vùng cuộn ngang để không làm vỡ layout.

**Mã nguồn để giải thích:**

- Cấu trúc trang và các vùng semantic nằm trong hàm `adminCustomers()` ở `admin/admin.js`; shell trang cung cấp `header`, `nav` và `main`.
- Bảng HTML, tìm kiếm/lọc, xuất CSV và sự kiện nằm trong `customerTable()`, `filterCustomers()`, `exportCustomersCsv()` ở `admin/admin.js`; sự kiện chung `data-action` nằm ở `common/workspace.js`.
- Form thêm/sửa và kiểm tra dữ liệu nằm trong `customerModal()` ở `admin/admin.js`.
- Màu sắc, thẻ thống kê, bảng, trạng thái hover, focus và responsive nằm trong `admin/admin.css` và `common/workspace.css`.
- Đồng bộ dữ liệu dùng chung được nạp bởi `refreshSharedBusinessData()` qua `IPCommon` trong `common/workspace.js`.

**Công nghệ:** HTML5, CSS3 (Flexbox/Grid/media query), JavaScript thuần, Supabase cho dữ liệu dùng chung.

**Tài liệu nộp cần bổ sung:**

- Figma trang Quản lý khách hàng: *chưa có link trong repository*.
- Video trình bày khoảng 3 phút: *chưa có link trong repository*.
- Repository GitHub: https://github.com/tupham151107-dotcom/-InvoicePilot---cse122

**Gợi ý demo 3 phút:** giới thiệu mục đích trang; chỉ bố cục trên Figma; mở trang ở chế độ Quản trị viên; trình bày `admin/admin.js` và CSS responsive ở `admin/admin.css`; demo tìm kiếm/lọc, thêm hoặc sửa khách hàng, rồi xuất CSV. Cần dùng tài khoản được cấp quyền và dữ liệu thử phù hợp trước khi quay.

## Chạy dự án

1. Mở thư mục dự án trong VS Code.
2. Dùng Live Server mở `index.html`.
3. Từ trang đăng nhập, chọn vai trò để vào giao diện tương ứng.

## Hóa đơn, thanh toán và lịch sử

- Kế toán có thể ghi nhận thanh toán toàn phần hoặc từng phần; khoản thu và số dư còn lại được đồng bộ giữa các vai trò.
- Chuông thông báo hiển thị khoản thanh toán gần đây và hóa đơn đến hạn trong 7 ngày hoặc đã quá hạn.
- Lịch sử hóa đơn ghi lại lúc tạo, thay đổi thông tin và ghi nhận tiền thanh toán.
- Để bật các chức năng này trên Supabase, chạy `supabase/migrations/202610140001_invoice_payments_and_history.sql` trong SQL Editor sau migration `docs/supabase-shared-business-data.sql`.
- Nhắc hạn hiện hiển thị trong ứng dụng. Gửi email nhắc tự động chưa được cấu hình.

## Quy tắc tích hợp

1. Đặt tên class theo BEM, ví dụ `.invoice-table`, `.invoice-table__row`, `.invoice-table__row--overdue`; dùng prefix theo phân hệ khi cần.
2. Mỗi thành viên ưu tiên sửa trong thư mục được giao. Thống nhất trước khi thay đổi `common/`, API dùng chung hoặc cấu trúc dữ liệu.
3. Đặt CSS dùng chung trong `common/`, CSS riêng trong thư mục phân hệ; tránh selector toàn cục để chỉnh một màn hình.
4. Làm việc trên nhánh riêng, cập nhật từ nhánh tích hợp thường xuyên, commit nhỏ và tạo pull request để rà soát trước khi nhập vào `main`.
5. Phối hợp thống nhất dữ liệu khách hàng giữa Kinh doanh và Kế toán; không giả định dữ liệu đã đồng bộ cho đến khi luồng tích hợp được kiểm tra.
