# Trạng thái kiểm chứng frontend

## Chuẩn bị commit — 26/10/2026

- `npm run lint`: đạt với 0 lỗi, 2 cảnh báo. Hồ sơ dùng
  `window.location.assign` cho điều hướng nội bộ; màn hình vé dùng `img`.
- `npx next typegen` và `npm run typecheck`: đạt với dependencies đã cài.
- `npm run build`: đạt sau khi cho phép kết nối tải Geist/Geist Mono từ Google
  Fonts. Lượt build bị hạn chế mạng trước đó thất bại vì không tải được font.
- Không chạy test theo yêu cầu của chủ dự án. Các file test được commit không
  phải bằng chứng luồng thực tế hoặc toàn bộ bộ kiểm thử đã đạt.
- Không cài lại dependencies, push, deploy, chạy migration hoặc thao tác thanh
  toán. Không thay đổi backend hoặc cấu hình môi trường riêng.
- Rà các file chờ commit bằng một số mẫu secret có độ tin cậy cao: không phát
  hiện; đây không phải kiểm toán bảo mật đầy đủ. `.env` và build output không
  nằm trong phạm vi commit.

## Chưa đồng bộ với backend

Không coi build thành công là đủ để triển khai toàn bộ chức năng:

1. Giao diện check-in hiện gọi API với `payload` mà thiếu `showingId`. Backend
   mới yêu cầu cả hai và trả `result`/`admitted`, không trả `alreadyCheckedIn`.
   Cần đồng bộ chọn suất diễn và cách hiển thị kết quả trước khi dùng check-in.
2. Màn hình phân công, thêm/xóa điều hành viên vẫn gọi API `operators` và
   `event-operations/mine`; các API này không có trong backend hiện hành.
   Backend check-in và danh sách khách chỉ cho OWNER. Chức năng cũ được giữ
   nguyên trong commit, không phải cam kết đã hoạt động với backend mới.
3. Cần nghiệm thu bằng trình duyệt với tài khoản phù hợp: đăng nhập/F5/xoay
   refresh, quay về VNPay, mua/bán lại, thông báo và thao tác Organizer/Admin.

Các lệnh kiểm tra trong tài liệu chức năng là hướng dẫn hoặc kết quả lịch sử,
không thay thế trạng thái của lượt commit này. Không dùng các script backend
legacy đã được lưu trữ ngoài repo để thiết lập hoặc đánh giá bản deploy.
