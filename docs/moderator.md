# Khu vực Kiểm duyệt viên (Moderator) — Pass Vé 2.0

## 1. Vai trò và nguyên tắc
- Quyền truy cập: Chỉ tài khoản có `role: "MODERATOR"` mới được vào `/moderator/*`. Tài khoản `ADMIN` hay `USER` bị từ chối bằng giao diện báo quyền và HTTP 403 ở backend.
- Tính độc lập: Moderator được quyền xem nội dung chi tiết của sự kiện thuộc Ban tổ chức do mình sở hữu (`isOwnEvent: true`), nhưng bị khóa nút Phê duyệt và Từ chối ở cả giao diện lẫn kiểm tra quyền OWNER trong giao dịch khóa ở backend (trả 403).
- Phạm vi công việc: Chỉ xử lý 5 nghiệp vụ: Hàng đợi chờ duyệt, Chi tiết nội bộ, Phê duyệt, Từ chối kèm lý do và Lịch sử kiểm duyệt. Không chỉnh sửa sự kiện, không quản lý hạng vé và không truy cập vé/QR của người mua.

## 2. Các màn hình và URL
- `/moderator` hoặc `/moderator/dashboard`: Chuyển hướng tự động về `/moderator/events`.
- `/moderator/events`: Hàng đợi các sự kiện đang ở trạng thái `PENDING_REVIEW`, hỗ trợ tìm kiếm theo tiêu đề `q`, lọc theo `categoryId` và phân trang.
- `/moderator/events/:eventId`: Chi tiết sự kiện cần kiểm duyệt (mô tả, ban tổ chức, suất diễn, hạng vé và lịch sử các lần duyệt trước đó của sự kiện).
- `/moderator/history`: Bảng lịch sử toàn bộ các quyết định đã ghi nhận trên hệ thống (lọc theo `action` và `eventId`).

## 3. Endpoints Backend phục vụ
- `GET /api/v1/moderation/events`: Hàng đợi `PENDING_REVIEW`, áp dụng lọc `q` và `categoryId` trước phân trang.
- `GET /api/v1/moderation/events/:id`: Chi tiết nội bộ, trả thêm thông tin ban tổ chức và cờ `isOwnEvent`.
- `GET /api/v1/moderation/events/history`: Lịch sử từ `event_review_logs`, sắp xếp `createdAt DESC, reviewId DESC`.
- `POST /api/v1/moderation/events/:id/approve`: Chuyển sự kiện sang `PUBLISHED`.
- `POST /api/v1/moderation/events/:id/reject`: Chuyển sự kiện sang `REJECTED`, yêu cầu lý do (1 - 2000 ký tự).