# Danh sách màn hình

Danh sách các trang HTML chính hiện có trên nhánh main. Các hộp thoại đăng nhập, khôi phục mật khẩu và hoàn tất lời mời nằm trong trang đăng nhập, không tính thành trang HTML riêng.

| Màn hình | Tệp | Mục đích |
|---|---|---|
| Trang giới thiệu | [common/home.html](../common/home.html) | Giới thiệu InvoicePilot và dẫn tới đăng nhập/đăng ký. |
| Đăng nhập và khôi phục tài khoản | [common/index.html](../common/index.html) | Đăng nhập, khôi phục mật khẩu và hoàn tất lời mời thành viên. |
| Đăng ký doanh nghiệp | [common/signup.html](../common/signup.html) | Tạo tài khoản doanh nghiệp theo cấu hình Supabase. |
| Không gian Quản trị viên | [admin/index.html](../admin/index.html) | Tổng quan doanh nghiệp, thành viên và cấu hình. |
| Không gian Quản lý | [manager/index.html](../manager/index.html) | Theo dõi hoạt động, hóa đơn, công nợ và chỉ số quản lý. |
| Không gian Kế toán | [accountant/index.html](../accountant/index.html) | Theo dõi hóa đơn, khoản phải thu và thanh toán. |
| Không gian Kinh doanh | [sales/index.html](../sales/index.html) | Quản lý khách hàng, khách hàng tiềm năng và cơ hội. |

## Cách rà soát

1. Mở từng trang bằng Live Server hoặc GitHub Pages.
2. Xác nhận trang tải được và các liên kết điều hướng không trả về 404.
3. Đăng nhập bằng tài khoản từng vai trò và kiểm tra trang đích.
4. Kiểm tra trạng thái rỗng, có dữ liệu, lỗi và màn hình nhỏ.
5. Chỉ tính trang có thể truy cập và trình bày độc lập là một màn hình riêng.

> Danh sách này phản ánh cấu trúc tệp hiện có trên nhánh main; cập nhật khi nhóm thêm hoặc đổi trang.
