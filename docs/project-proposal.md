# Đề xuất sản phẩm InvoicePilot

## Bài toán

Doanh nghiệp nhỏ thường theo dõi khách hàng, hóa đơn và khoản phải thu ở nhiều bảng tính hoặc qua tin nhắn. Khi thông tin tách rời, nhóm khó biết khoản nào sắp đến hạn, ai đang theo dõi khách hàng và tình trạng thanh toán mới nhất.

## Người dùng mục tiêu

- **Quản trị viên:** thiết lập doanh nghiệp, mời thành viên và phân quyền.
- **Quản lý:** xem tình hình chung, hóa đơn và công nợ để theo dõi hoạt động.
- **Kế toán:** quản lý hóa đơn, khoản phải thu và cập nhật thanh toán.
- **Kinh doanh:** theo dõi khách hàng, khách hàng tiềm năng và cơ hội.

## Đề xuất giải pháp

InvoicePilot là prototype web với một không gian làm việc chung. Tài khoản đăng nhập theo email; ứng dụng đưa người dùng tới giao diện theo vai trò được cấp. Các màn hình tập trung thông tin khách hàng, hóa đơn, hạn thanh toán và khoản công nợ để nhóm phối hợp trên cùng một quy trình.

## Phạm vi prototype

- Trang giới thiệu, đăng nhập, đăng ký, khôi phục tài khoản và lời mời thành viên.
- Không gian riêng cho bốn vai trò, dùng các thành phần chung ở phần xác thực và giao diện.
- Quản lý thông tin khách hàng, hóa đơn, công nợ và theo dõi trạng thái thanh toán theo khả năng hiện có trong mã.
- Trợ lý hội thoại Botpress; các tình huống AI nghiệp vụ cần được kiểm thử và ghi nhận riêng.

## Giá trị cần chứng minh

1. Thành viên vào đúng màn hình theo vai trò.
2. Hóa đơn và khoản đến hạn dễ tìm, dễ theo dõi.
3. Thông tin khách hàng và hóa đơn có thể được các vai trò liên quan sử dụng theo chính sách quyền của doanh nghiệp.
4. Quy trình có thể trình bày bằng dữ liệu mẫu và kiểm tra được từ giao diện.

## Giới hạn và hướng phát triển

Đây là sản phẩm học tập, không thay thế phần mềm kế toán hoặc xác nhận giao dịch ngân hàng. Cần kiểm thử cấu hình Supabase, quyền truy cập theo doanh nghiệp, độ chính xác dữ liệu, khả năng dùng trên điện thoại và các tình huống AI trước khi xem là sẵn sàng vận hành. Hướng mở rộng gồm nhắc hạn thanh toán, báo cáo công nợ và gợi ý hỗ trợ có người xác nhận.
