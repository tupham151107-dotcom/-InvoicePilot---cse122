# InvoicePilot · BTL-19

Prototype giao diện dùng HTML, CSS và JavaScript thuần. Mở `index.html` trong trình duyệt để vào trang giới thiệu chung; chọn Đăng nhập để vào màn hình đăng nhập và chọn vai trò. Bản demo hiện có luồng Quản trị viên, Quản lý, Kế toán và Kinh doanh. Dữ liệu chỉ là dữ liệu mẫu phía trình duyệt, chưa có backend.

## Cấu trúc thư mục

```text
BTL-19_InvoicePilot/
├── index.html                    # Điểm vào, chuyển tới trang giới thiệu chung
├── README.md
├── common/                       # Phạm Đình Tú: màn hình và tài nguyên dùng chung
│   ├── index.html                # Đăng nhập, chọn vai trò
│   ├── home.html                 # Trang giới thiệu khi mới mở website
│   ├── signup.html               # Đăng ký dùng chung
│   ├── common.css                # Reset, design tokens, form và shell dùng chung
│   └── common.js                 # Login, điều hướng vai trò, helper dùng chung
├── admin-manager/                # Phạm Đình Tú
│   ├── index.html
│   ├── admin-manager.css
│   └── admin-manager.js          # Màn hình Quản trị viên và Quản lý
├── accountant/                   # Thành viên 2
│   ├── index.html
│   ├── accountant.css
│   └── accountant.js
└── sales/                        # Thành viên 3
    ├── index.html
    ├── sales.css
    └── sales.js
```

## Ví dụ liên kết tài nguyên của Kế toán

Trong `accountant/index.html`, đường dẫn tương đối đi lên một cấp để lấy tài nguyên chung, còn CSS/JS riêng dùng đường dẫn ngay trong thư mục hiện tại:

```html
<link rel="stylesheet" href="../common/common.css" />
<link rel="stylesheet" href="accountant.css" />
...
<script src="../common/common.js"></script>
<script src="accountant.js"></script>
```

Các file Kế toán/Kinh doanh dùng `IPCommon.mountShell()` để gắn header và sidebar chung. `IPCommon.money()` định dạng tiền Việt; `IPCommon.saveDemoState()` lưu trạng thái mẫu.

## Quy tắc làm việc nhóm

1. **Đặt tên class theo BEM:** ví dụ `.invoice-table`, `.invoice-table__row`, `.invoice-table__row--overdue`. Prefix component theo module để tránh đụng tên.
2. **Giữ ranh giới thư mục:** mỗi người chỉ sửa HTML/CSS/JS trong phân hệ được giao; thay đổi `common/` cần báo cả nhóm và thống nhất API trước.
3. **CSS riêng theo module:** style dùng chung đặt trong `common/common.css`; style riêng đặt trong file của phân hệ. Không viết selector chung quá rộng như `button`, `.card` để chỉnh giao diện một màn hình.
4. **Git theo nhánh và commit nhỏ:** mỗi thành viên làm một nhánh tính năng, pull/rebase từ nhánh chung thường xuyên, commit ghi rõ phần thay đổi rồi mới tạo pull request hoặc merge.
5. **Thống nhất giao diện tích hợp:** dùng token màu trong `common.css`, giữ nguyên ID/API được chia sẻ, không thêm thư viện hoặc sửa file của thành viên khác mà chưa trao đổi.

## Phân công

- **Phạm Đình Tú:** `common/` và `admin-manager/`.
- **Thành viên 2:** `accountant/`.
- **Thành viên 3:** `sales/`.
