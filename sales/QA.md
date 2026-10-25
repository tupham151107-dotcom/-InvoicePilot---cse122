# Sales — phạm vi và kiểm tra hồi quy

Cập nhật ngày 25/10/2026, đối chiếu main tại a353b89. Thay đổi chỉ trong sales/.

## Chức năng

- Khách hàng: thêm, sửa qua API dùng chung; kiểm tra trùng tên và dữ liệu bắt buộc. Ẩn/hiện chỉ tác động danh sách cá nhân, không xóa hay lưu trữ khách hàng trên Supabase.
- Cơ hội: thêm/sửa, giai đoạn tiềm năng đến thành công/thất bại, lưu trữ/khôi phục có lý do, lịch sử cập nhật.
- Chăm sóc: tạo/sửa lịch, ghi kết quả, hoàn thành, lưu trữ/khôi phục và lịch sử.
- Tìm kiếm kết hợp hai bộ lọc, sắp xếp, phân trang 8 dòng, lưu bộ lọc, CSV theo kết quả đã lọc.
- Nhắc thanh toán: nội dung mailto lấy bản đã sửa, ghi nhận liên hệ chỉ sau khi lưu trình duyệt thành công.
- Gợi ý chăm sóc: mô phỏng theo quy tắc, có giải thích, xử lý thiếu dữ liệu, chỉnh sửa/tạo lại/từ chối và xác nhận lưu thành lịch. Đây không phải tích hợp mô hình AI mới và không thay thế yêu cầu ba tính năng AI cho toàn dự án.
- Trạng thái đang tải, rỗng, lỗi/thử lại; chống màn hình trắng khi tài nguyên hoặc khởi tạo lỗi.
- SDK Supabase 2.110.8 được sao chép từ vendor hiện có của main vào sales/vendor để không phụ thuộc CDN khi khởi tạo đăng nhập sales.

## Cách chạy kiểm tra

Cần Node.js, package `playwright` và Chrome/Chromium. Từ thư mục gốc dự án:

```sh
node sales/tests/sales-regression.cjs
```

Biến môi trường tùy chọn:

- SALES_TEST_ROOT: thư mục dự án muốn phục vụ (mặc định gốc chứa sales/tests).
- SALES_CHROME_PATH: đường dẫn Chrome/Chromium; nếu không đặt dùng Chrome trên Windows nếu có, hoặc Chromium của Playwright.

Test tạo máy chủ localhost cổng ngẫu nhiên, dùng common/common.js thật cùng Supabase giả lập, chặn hai script Botpress từ xa trong môi trường test. Không dùng tài khoản thật hoặc ghi dữ liệu doanh nghiệp. Ảnh kiểm tra lưu vào tmp/sales-qa/.

## Đã kiểm tra tự động

- Thêm khách hàng, chặn tên trùng, sửa lại sau báo trùng và nút lưu không bị khóa.
- Mở form sửa khách hàng; đóng bằng Esc và giữ focus trong modal khi Tab.
- Tạo cơ hội, giữ dữ liệu sau F5, đổi giai đoạn, lưu trữ/khôi phục có lý do.
- Tạo lịch chăm sóc, áp dụng gợi ý thành lịch.
- Tìm kiếm kết hợp trạng thái, danh sách rỗng và phân trang.
- Nội dung email sau khi chỉnh sửa.
- Tải lỗi ban đầu và lỗi đồng bộ, nút thử lại.
- Trình duyệt chặn ghi localStorage: hiển thị lỗi, không báo lưu thành công.
- Guard đăng nhập chung chuyển phiên chưa đăng nhập về login; form login chung chuyển tài khoản sales vào sales.
- SDK không có: chuyển về login thay vì trắng màn hình.
- Các màn hình ở 320, 375, 768, 1024 và 1440 CSS px không tràn ngang toàn trang; bảng rộng cuộn trong vùng bảng.
- Bố cục ở 720 CSS px tương đương vùng nội dung của màn hình 1440px khi zoom 200%; chưa thay thế thao tác zoom thủ công trên thiết bị thật.
- Modal ở cả năm kích thước; ảnh desktop và mobile được xem lại.
- Không lỗi JavaScript không bắt và không 404 tài nguyên nội bộ trong các luồng đã thử.

## Giới hạn cần kiểm thử khi tích hợp

- Chưa đăng nhập bằng tài khoản Supabase thật. Cần xác minh quyền RLS và cấu hình máy chủ của doanh nghiệp trên bản triển khai.
- Khách hàng và hóa đơn dùng API/Supabase hiện có. Cơ hội, lịch chăm sóc, bộ lọc, ẩn khách hàng và lịch sử nhắc vẫn lưu theo tài khoản trên trình duyệt; không đồng bộ giữa thiết bị.
- KPI thu tháng dùng các khoản thanh toán API trả về. API common hiện giới hạn 100 khoản; sales không sửa giới hạn truy vấn này.
- Botpress và dịch vụ bên ngoài cần kết nối mạng; nội dung và khả dụng của chúng không thuộc bộ test giả lập.
- Không thay đổi common/, cấu hình Auth, SQL, main hoặc chức năng của các vai trò khác.
- Figma, screen inventory toàn dự án, video OBS, peer review và bản khai sử dụng AI vẫn cần người phụ trách hoàn thiện trung thực.

Bộ kiểm tra cũng đã chạy đạt với common/ của folder BTL-19 hiện tại. Khi API cũ chưa cung cấp payments, KPI thu tháng hiển thị “Chưa có dữ liệu” thay vì báo 0. Bộ kiểm tra bổ sung đã thực hiện lưu thay đổi khách hàng, chuyển trang và tải CSV.
