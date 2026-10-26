# InvoicePilot · BTL-19

InvoicePilot là prototype web hỗ trợ doanh nghiệp theo dõi khách hàng, cơ hội kinh doanh, hóa đơn và công nợ. Dự án phục vụ học phần **CSE122 – Phát triển ứng dụng Web cơ bản**.

## 1. Demo trực tuyến

- **Website:** [InvoicePilot trên GitHub Pages](https://tupham151107-dotcom.github.io/-InvoicePilot---cse122/)
- Ứng dụng có thể cần cấu hình Supabase và tài khoản hợp lệ để đăng nhập. Không đưa mật khẩu tài khoản thật vào README.

## 2. Chức năng theo vai trò


| Vai trò | Chức năng chính | Thư mục |
|---|---|---|---|
| Quản trị viên | Tổng quan doanh nghiệp, quản lý thành viên và thiết lập | `admin/` |
| Quản lý | Theo dõi hoạt động, hóa đơn, công nợ và các chỉ số quản lý | `manager/` |
| Kế toán | Theo dõi hóa đơn, khoản phải thu và thanh toán | `accountant/` |
| Kinh doanh | Quản lý khách hàng, khách hàng tiềm năng và cơ hội kinh doanh | `sales/` |
| Dùng chung | Trang giới thiệu, đăng nhập/đăng ký, xác thực và thành phần giao diện dùng chung | `common/` |

## 3. Thiết kế giao diện

- [Mở bản thiết kế InvoicePilot trên Figma](https://www.figma.com/design/IcxgOTkl8vWqJA3OwSwYOK/Untitled?node-id=0-1&t=BnU4SmSLUdm0UFKy-1)
- Ghi chú liên kết: [`design/figma-link.txt`](design/figma-link.txt)

> Trước khi nộp, kiểm tra quyền xem Figma bằng cửa sổ ẩn danh và cập nhật mockup nếu giao diện triển khai đã thay đổi.

## 4. Luồng người dùng và danh sách màn hình

Luồng đăng nhập và các nhánh theo 4 vai trò được mô tả tại [`docs/user-flow.md`](docs/user-flow.md). Nếu đã có phiên hợp lệ, người dùng có thể bắt đầu demo tại Tổng quan của vai trò.

- Danh sách màn hình: [`docs/screen-inventory.md`](docs/screen-inventory.md) (đối chiếu các view hiện có; repo chưa có thư mục `pages/`).
- Sơ đồ user flow: [Luồng người dùng theo 4 vai trò](docs/user-flow.md).

Chỉ ghi một màn hình vào inventory khi đó là màn hình độc lập có thể truy cập và demo; đối chiếu inventory với đường dẫn thực tế trước khi quay video.

## 5. Công nghệ

- HTML5, CSS3 và JavaScript thuần.
- Supabase Auth cho đăng nhập/đăng ký và quản lý phiên.
- Botpress Cloud Webchat v5 để nhúng trợ lý AI vào các trang theo vai trò.
- GitHub Pages để triển khai bản web tĩnh.

## 6. Cấu trúc thư mục

```text
.
├── index.html
├── README.md
├── common/                 # Trang chung, xác thực, shell và tiện ích
│   ├── workspace.js        # Logic và layout dùng chung
│   ├── workspace.css       # CSS dùng chung
│   └── workspace-tools.js  # Tiện ích báo cáo và xem hóa đơn
├── admin/                  # Giao diện Quản trị viên
│   ├── index.html          # Khung HTML của trang Quản trị viên
│   ├── admin.css           # Giao diện và bố cục Quản trị viên
│   └── admin.js            # Nội dung trang và xử lý tương tác
├── manager/                # Giao diện Quản lý
│   ├── index.html          # Khung HTML của trang Quản lý
│   ├── manager.css         # Giao diện và bố cục Quản lý
│   └── manager.js          # Nội dung trang và xử lý tương tác
├── accountant/             # Giao diện Kế toán
│   ├── index.html          # Khung HTML của trang Kế toán
│   ├── accountant.css      # Giao diện và bố cục Kế toán
│   └── accountant.js      # Nội dung trang và xử lý tương tác
├── sales/                  # Giao diện Kinh doanh
│   ├── index.html          # Khung HTML của trang Kinh doanh
│   ├── sales.css           # Giao diện và bố cục Kinh doanh
│   ├── sales.js            # Nội dung trang và xử lý tương tác
│   ├── sales-modals.css    # Giao diện hộp thoại Kinh doanh
│   └── sales-modals.js     # Xử lý hộp thoại và biểu mẫu Kinh doanh
├── design/                 # Liên kết thiết kế
├── docs/                   # Hướng dẫn, SQL và tài liệu tính năng AI
├── supabase/               # Migration và Edge Function
└── Chatbox_AI_HuanLuyen/   # Tài liệu tri thức dùng để cấu hình trợ lý
```

Các trang theo vai trò có HTML, CSS và JavaScript riêng; thành phần giao diện và xác thực dùng chung nằm trong `common/`.

## 7. Chạy dự án trên máy

1. Clone repository và mở thư mục dự án bằng VS Code.
2. Cài tiện ích **Live Server** nếu máy chưa có.
3. Cấu hình Supabase theo mục bên dưới nếu cần đăng nhập.
4. Mở `index.html` bằng **Open with Live Server**. Không mở file bằng đường dẫn `file://` vì một số tính năng cần máy chủ HTTP.

## 8. Cấu hình Supabase

1. Tạo project Supabase.
2. Chạy [`docs/supabase-setup.sql`](docs/supabase-setup.sql) trong SQL Editor.
3. Điền Project URL và publishable key (hoặc anon key cũ) vào `common/supabase-config.js`.
4. Trong **Authentication → URL Configuration**, đặt Site URL là link triển khai và thêm redirect URL `https://tupham151107-dotcom.github.io/-InvoicePilot---cse122/common/index.html`.
5. Khi chạy Live Server ở cổng 5500, thêm `http://localhost:5500/common/index.html` và `http://127.0.0.1:5500/common/index.html` vào redirect URLs.

Chỉ dùng publishable/anon key trong mã phía trình duyệt. **Không commit secret key, service-role key, mật khẩu hoặc token riêng tư.** Nếu bật xác nhận email, người dùng cần xác nhận email trước khi đăng nhập.

## 9. Dữ liệu và giới hạn hiện tại

Supabase Auth quản lý tài khoản và phiên đăng nhập. Theo trạng thái được ghi nhận trong mã/tài liệu hiện tại, dữ liệu nghiệp vụ mẫu như khách hàng, hóa đơn và công nợ có thể được lưu ở trình duyệt và chưa chắc đã đồng bộ giữa tài khoản hoặc thiết bị. Hãy kiểm tra luồng dữ liệu thực tế trước khi giới thiệu đây là dữ liệu dùng chung trên máy chủ.

## 10. Tính năng AI

Trợ lý hội thoại được nhúng bằng Botpress Cloud Webchat. Tài liệu [`docs/ai-features.md`](docs/ai-features.md) mô tả riêng ba tính năng AI theo nghiệp vụ và tình trạng triển khai; không nên xem việc nhúng khung chat là bằng chứng cả ba tính năng đã hoàn thành. Chỉ giới thiệu từng tính năng nghiệp vụ là đã hoàn thành sau khi kiểm tra trực tiếp trên website.

Tài liệu tri thức trợ lý hiện nằm trong `Chatbox_AI_HuanLuyen/`. Báo cáo sử dụng AI: [`docs/ai-usage-report.md`](docs/ai-usage-report.md). Nhóm cần bổ sung nhật ký sử dụng riêng của từng thành viên và kết quả chạy thử thực tế trước khi nộp.

## 11. Tài liệu dự án

| Tài liệu | Trạng thái |
|---|---|
| Bản thiết kế Figma | [Mở Figma](https://www.figma.com/design/IcxgOTkl8vWqJA3OwSwYOK/Untitled?node-id=0-1&t=BnU4SmSLUdm0UFKy-1) |
| SQL khởi tạo Supabase | [`docs/supabase-setup.sql`](docs/supabase-setup.sql) |
| SQL mời thành viên | [`docs/supabase-member-invites.sql`](docs/supabase-member-invites.sql) |
| Mô tả tính năng AI | [`docs/ai-features.md`](docs/ai-features.md) |
| Checklist 20 mục tự rà soát trước bảo vệ | [`docs/checklist-bao-ve.md`](docs/checklist-bao-ve.md) |
| Đề xuất sản phẩm / phân tích bài toán | [`docs/de-xuat-san-pham.md`](docs/de-xuat-san-pham.md) |
| Screen inventory | [`docs/screen-inventory.md`](docs/screen-inventory.md) |
| User flow 4 vai trò | [`docs/user-flow.md`](docs/user-flow.md) |
| Báo cáo sử dụng AI | [`docs/ai-usage-report.md`](docs/ai-usage-report.md) — cần nhóm rà soát và bổ sung minh chứng thực tế |

## 12. Quản lý công việc

- Bảng công việc của nhóm: [Trello – Bảng Trello của tôi](https://trello.com/invite/b/6ac1c4e3b5e36434a6617daa/ATTI67ef313a8c394be0b399be8b1e982ae213D22628/b%E1%BA%A3ng-trello-c%E1%BB%A7a-t%C3%B4i).
- Mỗi thẻ nên có Task ID, màn hình, người phụ trách, hạn hoàn thành, nhánh Git, PR và video OBS liên quan.

## 13. Quy trình Git và Pull Request

1. Mỗi thành viên làm trên nhánh tính năng riêng (`feature/...`, `fix/...` hoặc `docs/...`).
2. Commit theo Conventional Commits, ví dụ `feat: add sales opportunity view`, `fix: handle empty invoice list`, `docs: update setup guide`.
3. Mở Pull Request vào nhánh tích hợp của nhóm; nhờ thành viên khác review trước khi merge.
4. Giữ PR gắn với công việc và màn hình cụ thể; ghi nhận các thay đổi qua nhiều commit nhỏ có nội dung rõ ràng.

Liên kết repository: [GitHub – InvoicePilot](https://github.com/tupham151107-dotcom/-InvoicePilot---cse122). Bổ sung liên kết trực tiếp tới PR/nhánh đại diện của từng thành viên sau khi xác nhận chúng trên GitHub.

## 14. Video OBS và minh chứng

Barem yêu cầu số video khớp 1:1 với số màn hình độc lập trong screen inventory. Mỗi video cần có khuôn mặt và giọng nói sinh viên, mockup, mã HTML/CSS/JS, giải thích code, một chỉnh sửa trực tiếp, chạy thử và thông tin task/branch/commit.

| STT | Người trình bày | Phạm vi video | Link video OBS |
|---|---|---|---|
| 1 | SV1 — Phạm Đình Tú | Quản trị viên / Quản lý | [CSE122_BTCK_2551060706](https://www.youtube.com/playlist?list=PLOh3k0AQukis) |
| 2 | SV2 — Nguyễn Hải An | Kế toán | [Playlist YouTube](https://youtube.com/playlist?list=PLU69sRPTfYNE&si=U8u9vNwpLlfT1kOE) |
| 3 | SV3 — Phạm Trần Gia Khánh | Kinh doanh | [CSE122 BTCK 2551060636](https://youtube.com/playlist?list=PLG9wHxV0b4LE&si=e3ipme22mN19smhT) |

Không để link giả hoặc video riêng tư không mở được với người chấm.

## 15. Thành viên và phạm vi đóng góp

| Mã thành viên | Họ và tên | Vai trò/phạm vi | Thư mục |
|---|---|---|
| SV1 | Phạm Đình Tú | Quản trị viên, Quản lý và phần dùng chung | `common/`, `admin/`, `manager/` |
| SV2 | Nguyễn Hải An | Kế toán | `accountant/` |
| SV3 | Phạm Trần Gia Khánh | Kinh doanh | `sales/` |

Mỗi người ưu tiên sửa phân hệ được giao. Thay đổi trong `common/` hoặc cấu trúc dữ liệu dùng chung cần được trao đổi và review trước khi tích hợp.

## Checklist trước khi nộp

- [ ] Xác nhận link deploy mở được trên máy tính và điện thoại, không có lỗi 404.
- [ ] Rà soát screen inventory với website thực tế; bổ sung minh chứng và nhật ký AI của từng thành viên; user flow 4 vai trò đã có tại `docs/user-flow.md`.
- [x] Đã thêm link bảng Trello và playlist video OBS của cả SV1, SV2, SV3.
- [x] Cập nhật họ tên và mã thành viên SV1–SV3.
- [ ] Kiểm tra quyền truy cập Figma, GitHub, bảng công việc và video bằng cửa sổ ẩn danh.
- [ ] Đảm bảo README mô tả đúng những gì đang chạy; không ghi tính năng mục tiêu thành tính năng đã hoàn thành.
