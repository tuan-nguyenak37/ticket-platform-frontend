# TicketVerse Frontend

Giao diện nền tảng đặt vé sự kiện và bán lại vé, xây dựng bằng Next.js App Router, React, TypeScript, TanStack Query, Axios và Zustand. Backend NestJS được quản lý trong repo riêng.

## Yêu cầu và khởi chạy

Cần Node.js 22 trở lên, npm và backend đã cấu hình PostgreSQL/Redis.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Frontend chạy tại `http://localhost:3000`; backend mặc định tại `http://localhost:7000/api`.

- `NEXT_PUBLIC_API_URL`: địa chỉ API dùng cho dữ liệu công khai.
- `BACKEND_API_URL`: địa chỉ API phía server dùng cho proxy và xác minh phiên SSR; không đặt secrets trong biến `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_UPLOAD_MAX_FILE_SIZE_MB`: giới hạn upload phải khớp backend.

Chỉ tạo một cấu hình môi trường cục bộ cho cùng mục đích. Nếu đã có `.env`, kiểm tra giá trị trước khi tạo `.env.local` vì `.env.local` có độ ưu tiên cao hơn. Không commit các file này; `.env.example` được giữ lại làm mẫu.

## Chức năng

- Khám phá sự kiện, chọn suất diễn/hạng vé và thanh toán VNPay.
- Quản lý hồ sơ, đơn hàng, QR/PDF vé và lịch sử bán lại.
- Chợ vé bán lại, thông tin nhận tiền của người bán và trạng thái chi trả.
- Không gian Organizer, kiểm duyệt sự kiện, quản trị người dùng và biểu đồ thống kê.
- Thông báo trong web; khả năng gửi email phụ thuộc cấu hình backend.

Mọi trạng thái thanh toán, quyền truy cập, giá và tồn kho do backend quyết định. Kết quả quay về từ trang VNPay không tự xác nhận đơn đã thanh toán. Tích hợp hiện dùng môi trường thử nghiệm; chưa có chuyển khoản thật cho người bán.

## Xác thực

Access JWT chỉ lưu trong Zustand, không persist vào localStorage/sessionStorage. Axios gửi Bearer token qua proxy cùng origin. Refresh JWT nằm trong cookie HttpOnly; backend xác minh và xoay token dùng một lần bằng Redis.

SSR chỉ lấy hồ sơ tối thiểu; sau hydrate, frontend lấy access token âm thầm. Các API có bảo vệ đợi khôi phục phiên. Xem [tài liệu xác thực](docs/auth-frontend.md).

## Kiểm tra và build

```sh
npm test
npm run lint
npx next typegen
npm run typecheck
npm run build
```

`next typegen` tạo kiểu route cần thiết khi kiểm tra từ checkout sạch. `next/font/google` tải font khi build, do đó cần kết nối tới máy chủ font Google. Build thành công không thay cho kiểm thử backend, email hoặc cổng thanh toán thực tế.

```sh
npm run start
```

Lệnh `start` phục vụ bản production sau khi đã build.

## Cấu trúc và tài liệu

`app/` chứa layout/provider chung và các module `(auth)`, `(account)`, `(public)`, `(organizer)`, `(moderator)`, `(admin)`. Route groups không xuất hiện trong URL. Thành phần riêng của từng nhánh đặt trong `_components`/`_lib`; phần dùng chung nằm ở `components`, `lib`, `hooks`, `types` và `config`.

- [Hướng dẫn frontend](docs/ticketverse-frontend.md)
- [Cấu trúc theo chức năng](docs/frontend-architecture.md)
- [Trang khách hàng](docs/home-implementation.md)
- [Không gian Organizer](docs/organizer-frontend.md)
- [Giao diện Admin](docs/admin-implementation.md)
- [Trạng thái kiểm chứng và phần chưa đồng bộ backend](docs/verification-status.md)

Một số tài liệu cũ còn mô tả route/API legacy. Kiểm tra mã đang chạy và test trước khi dùng các ví dụ đó. Không commit secrets, thông tin tài khoản thật, file build, log hoặc dữ liệu người dùng.
