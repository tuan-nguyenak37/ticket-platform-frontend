# Auth frontend

## Routes

- `/login`: đăng nhập bằng email và mật khẩu.
- `/register`: họ tên, email, mật khẩu 6-32 ký tự và xác nhận mật khẩu. Đăng ký thành công chuyển sang login, không tự tạo phiên.
- `/account`: thông tin từ user profile BE và đăng xuất; cần phiên hợp lệ.
- `next` chỉ nhận đường dẫn nội bộ, mặc định `/account` và không cho quay lại login/register.
- Modal và trang riêng sử dụng chung `app/(modules)/(auth)/_components/AuthForm.tsx`.

## Contract với BE

- `POST /auth/register`: `{ email, password, fullName }`, nhận profile.
- `POST /auth/login`: `{ email, password }`, nhận `data.accessToken`, `data.user` và refresh cookie.
- `POST /auth/refresh`: không gửi refresh token trong body; trình duyệt gửi cookie HttpOnly.
- `GET /users/me`: Bearer token, nhận user với field snake_case và role viết hoa.
- `POST /auth/logout`: Bearer token, BE thu hồi phiên và xóa cookie.

`lib/auth/session.ts` giữ token trong bộ nhớ, không persist vào localStorage. Bootstrap refresh rồi lấy profile. Request 401 refresh một lần và replay; 403 không refresh. Refresh cookie không còn hợp lệ thì xóa phiên; lỗi mạng giữ trạng thái lỗi để thử lại. Khi retry profile bằng token cache đã hết hạn, FE refresh trước khi gọi profile lại.

Khi tab đang hiển thị, provider kiểm tra hạn access token mỗi 30 giây và refresh trong phút cuối. Thời gian JWT chỉ dùng để lên lịch, BE vẫn xác thực token. Khi có mạng trở lại hoặc quay lại tab, FE thử khôi phục/làm mới nếu cần. Refresh đang chạy được dùng chung trong tab; Web Locks tuần tự hóa thao tác cookie giữa các tab cùng origin khi trình duyệt hỗ trợ. BroadcastChannel thông báo login/logout giữa các tab, không truyền hoặc lưu mật khẩu/token. Revision bỏ kết quả phiên cũ và xóa query cache khi thay đổi phiên.

## Cấu hình

- FE: `NEXT_PUBLIC_API_URL=http://localhost:7000/api`.
- BE: `FRONTEND_URL` cần chứa chính xác origin FE, CORS cho phép credentials.
- Dùng nhất quán localhost hoặc hostname đã cấu hình, không trộn localhost và 127.0.0.1.
- Cookie BE hiện là HttpOnly, SameSite=Lax, path=/api/auth; production bật Secure nên cần HTTPS. Triển khai FE/BE khác site cần xem lại chính sách cookie/CORS ở backend, không đổi bằng JavaScript FE.

## Kiểm tra thủ công còn cần thực hiện

Chưa chạy kiểm thử BE thật trong lần triển khai này. Cần xác nhận: đăng ký/email trùng, sai mật khẩu/tài khoản khóa, reload sau login, access token hết hạn, refresh hết hạn, nhiều request 401 đồng thời, nhiều tab, mất mạng/thử lại, đăng xuất và reload. Không chạy test suite theo yêu cầu.


