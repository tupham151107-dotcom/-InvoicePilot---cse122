# Checklist 20 mục tự rà soát trước bảo vệ

Đánh dấu hoàn thành sau khi đã kiểm tra trực tiếp trên bản chạy và lưu bằng chứng phù hợp. Không đánh dấu chỉ dựa trên mô tả trong README.

## Chạy và điều hướng

- [ ] 1. Mở trang giới thiệu bằng HTTPS/GitHub Pages hoặc Live Server, không dùng đường dẫn file://.
- [ ] 2. Các liên kết nội bộ mở đúng trang, không có lỗi 404.
- [ ] 3. Trang đăng nhập nhận thông tin hợp lệ và hiển thị lỗi dễ hiểu khi sai.
- [ ] 4. Luồng đăng ký hoạt động với cấu hình Supabase của nhóm.
- [ ] 5. Xác nhận email, quên mật khẩu và đặt lại mật khẩu được kiểm tra nếu bật các tính năng này.
- [ ] 6. Lời mời thành viên mở đúng tài khoản, công ty và vai trò.

## Vai trò và dữ liệu

- [ ] 7. Tài khoản Quản trị viên vào đúng [admin/index.html](../admin/index.html).
- [ ] 8. Tài khoản Quản lý vào đúng [manager/index.html](../manager/index.html).
- [ ] 9. Tài khoản Kế toán vào đúng [accountant/index.html](../accountant/index.html).
- [ ] 10. Tài khoản Kinh doanh vào đúng [sales/index.html](../sales/index.html).
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

Ghi lại ngày kiểm tra, người kiểm tra, trình duyệt/thiết bị, tài khoản vai trò thử nghiệm (không ghi mật khẩu), kết quả và link ảnh/video hoặc commit liên quan.
