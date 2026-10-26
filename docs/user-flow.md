# Luồng người dùng

Tài liệu mô tả các luồng theo cấu trúc hiện tại của repo. Cần đối chiếu lại với cấu hình Supabase và ứng dụng đang chạy trước khi quay video hoặc nộp bài.

## Luồng chung

1. Người dùng mở [trang giới thiệu](../common/home.html).
2. Chọn đăng nhập tại [common/index.html](../common/index.html) hoặc đăng ký tại [common/signup.html](../common/signup.html).
3. Sau khi xác thực, hệ thống đọc vai trò của thành viên trong doanh nghiệp và chuyển tới không gian tương ứng. Tài khoản không có hồ sơ vai trò hợp lệ cần được xử lý bằng thông báo lỗi, không tự gán quyền cao hơn.
4. Người dùng thao tác trong phạm vi vai trò được cấp và đăng xuất khi kết thúc.

## Luồng đăng ký và đăng nhập

- **Đăng ký:** nhập thông tin doanh nghiệp và tài khoản theo biểu mẫu; nếu Supabase bật xác nhận email, mở email xác nhận rồi quay lại đăng nhập.
- **Đăng nhập:** nhập email và mật khẩu; khi thông tin hợp lệ, kiểm tra hồ sơ thành viên và chuyển đúng vai trò.
- **Quên mật khẩu:** yêu cầu mã xác minh qua email, xác minh mã, sau đó đặt mật khẩu mới.
- **Lời mời thành viên:** mở liên kết mời, đặt mật khẩu ban đầu nếu được yêu cầu, rồi đăng nhập bằng email được mời. Vai trò và doanh nghiệp phải theo lời mời đã tạo.

## Các không gian theo vai trò

| Vai trò | Tệp không gian | Nhiệm vụ chính |
|---|---|---|
| Quản trị viên | [admin/index.html](../admin/index.html) | Quản lý thành viên, cấu hình và thông tin doanh nghiệp. |
| Quản lý | [manager/index.html](../manager/index.html) | Theo dõi tổng quan, hoạt động và công nợ. |
| Kế toán | [accountant/index.html](../accountant/index.html) | Theo dõi hóa đơn, khoản phải thu và thanh toán. |
| Kinh doanh | [sales/index.html](../sales/index.html) | Theo dõi khách hàng và cơ hội kinh doanh. |

## Nhánh lỗi cần kiểm tra

- Email hoặc mật khẩu không hợp lệ: giữ người dùng ở trang đăng nhập và hiển thị lỗi dễ hiểu.
- Email chưa xác nhận hoặc liên kết/mã hết hạn: hướng dẫn gửi lại hoặc bắt đầu lại quy trình.
- Không tìm thấy vai trò hoặc doanh nghiệp: không chuyển vào màn hình của vai trò khác; báo cần quản trị viên kiểm tra hồ sơ.
- Phiên hết hạn: yêu cầu đăng nhập lại.
- Dữ liệu trống hoặc mất kết nối: hiển thị trạng thái rỗng/lỗi và cho phép thử lại.

## Kiểm tra trước khi demo

Dùng tài khoản thử nghiệm riêng cho từng vai trò; xác nhận trang đích, quyền truy cập, đăng xuất và hành vi khi phiên hết hạn. Không ghi mật khẩu, mã xác minh hoặc khóa bí mật vào tài liệu hay video công khai.
