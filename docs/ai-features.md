# Tính năng AI

## Thành phần đang có trong repo

README và mã trong thư mục common cho thấy dự án nhúng Botpress Cloud Webchat làm trợ lý hội thoại. Việc khung chat xuất hiện chỉ xác nhận tích hợp giao diện; cần chạy thử từng tình huống dưới đây trước khi ghi nhận là tính năng nghiệp vụ đã hoàn thành.

## Các tình huống nghiệp vụ cần đánh giá

| Vai trò | Tình huống hỗ trợ | Kết quả mong đợi | Kiểm tra trước khi đánh dấu hoàn thành |
|---|---|---|---|
| Kế toán | Rà soát hóa đơn có dấu hiệu bất thường | Nêu hóa đơn cần chú ý, lý do và trường dữ liệu liên quan để kế toán kiểm tra. | Dùng dữ liệu mẫu có trường hợp bình thường/bất thường; xác nhận không tự sửa hoặc xóa hóa đơn. |
| Quản lý | Tóm tắt công nợ và xu hướng dòng tiền | Tóm tắt khoản đến hạn/quá hạn và xu hướng từ dữ liệu hiện có. | Đối chiếu số tiền, kỳ thời gian và kết quả với bảng dữ liệu; không tạo số liệu dự báo nếu thiếu dữ liệu. |
| Kinh doanh | Gợi ý bước theo dõi khách hàng | Đề xuất nội dung hoặc thời điểm liên hệ dựa trên thông tin khách hàng được phép dùng. | Kiểm tra gợi ý với dữ liệu mẫu; người dùng duyệt trước khi gửi bất kỳ nội dung nào. |

## Quy tắc sử dụng

- Xem câu trả lời AI là gợi ý; người dùng chịu trách nhiệm xác minh dữ liệu và quyết định nghiệp vụ.
- Không cho phép AI tự xác nhận thanh toán, thay đổi quyền, gửi nhắc nợ hoặc sửa/xóa hồ sơ khi chưa có thao tác xác nhận rõ ràng.
- Không nhập mật khẩu, mã xác minh, khóa Supabase hoặc dữ liệu khách hàng không cần thiết vào hội thoại.
- Ghi lại tình huống thử, dữ liệu đầu vào đã ẩn danh, kết quả mong đợi, kết quả thực tế và lỗi cần khắc phục.

## Trạng thái xác minh

Tài liệu này phân biệt phần nhúng webchat với các tình huống AI theo vai trò. Nhóm cần chạy thử trên bản triển khai và cập nhật trạng thái từng tình huống; không suy ra rằng ba tình huống nghiệp vụ đã hoàn thành chỉ từ việc thấy biểu tượng trợ lý.
