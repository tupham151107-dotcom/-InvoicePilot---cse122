# Checklist 20 mục tự rà soát trước bảo vệ

Đối chiếu mã nguồn trên nhánh main ngày 26/10/2026. Người dùng xác nhận đã chạy thử các mục 1–6; các mục 7–10 được đối chiếu mã nguồn và sự tồn tại của trang đích. Các mục 7–10 xác nhận phần mã nguồn, chưa thay thế kiểm thử đăng nhập trực tiếp. Các mục còn lại cần kiểm tra và lưu bằng chứng trước khi đánh dấu.

## Chạy và điều hướng

- [x] 1. Mở trang giới thiệu bằng HTTPS/GitHub Pages hoặc Live Server, không dùng đường dẫn file://.
- [x] 2. Các liên kết nội bộ mở đúng trang, không có lỗi 404.
- [x] 3. Trang đăng nhập nhận thông tin hợp lệ và hiển thị lỗi dễ hiểu khi sai.
- [x] 4. Luồng đăng ký hoạt động với cấu hình Supabase của nhóm.
- [x] 5. Xác nhận email, quên mật khẩu và đặt lại mật khẩu được kiểm tra nếu bật các tính năng này.
- [x] 6. Lời mời thành viên mở đúng tài khoản, công ty và vai trò.

## Vai trò và dữ liệu

- [x] 7. Trang Quản trị viên có tại [admin/index.html](../admin/index.html); mã nguồn định tuyến vai trò admin tới trang này.
- [x] 8. Trang Quản lý có tại [manager/index.html](../manager/index.html); mã nguồn định tuyến vai trò manager tới trang này.
- [x] 9. Trang Kế toán có tại [accountant/index.html](../accountant/index.html); mã nguồn định tuyến vai trò accountant tới trang này.
- [x] 10. Trang Kinh doanh có tại [sales/index.html](../sales/index.html); mã nguồn định tuyến vai trò sales tới trang này.
- [ ] 11. Tài khoản không có vai trò hợp lệ không thể tự vào không gian khác.
- [ ] 12. Dữ liệu giữa các vai trò/công ty tuân theo chính sách phân quyền đã cấu hình.
- [ ] 13. Thao tác thêm, sửa, tìm kiếm và lọc dữ liệu nghiệp vụ hoạt động với dữ liệu thử.
- [ ] 14. Hóa đơn đến hạn/quá hạn và trạng thái thanh toán hiển thị đúng theo dữ liệu.

## Giao diện, AI và bàn giao

- [ ] 15. Trang hiển thị tốt trên máy tính và màn hình điện thoại.
- [ ] 16. Trạng thái tải, rỗng, mất kết nối và lỗi có hướng dẫn phù hợp.
- [ ] 17. Mọi nút và liên kết được trình bày trong video đều hoạt động.
- [ ] 18. Trợ lý AI và từng tình huống nghiệp vụ được chạy thử; kết quả được người dùng xác minh.
- [ ] 19. README, user flow, danh sách màn hình, link Figma, Trello và video OBS truy cập được.
- [ ] 20. Nhánh/commit/PR thể hiện phần đóng góp; video có mã nguồn, giải thích, chỉnh sửa trực tiếp và chạy thử theo yêu cầu môn học.

## Bằng chứng

Người dùng xác nhận đã chạy thử các mục 1–6. Mục 7–10 được đối chiếu từ common/common.js và sự tồn tại của bốn trang index.html trên nhánh main. Ghi lại ngày kiểm thử, người kiểm tra, trình duyệt/thiết bị, tài khoản vai trò thử nghiệm (không ghi mật khẩu), kết quả và link ảnh/video hoặc commit để bổ sung bằng chứng.
