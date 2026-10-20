# TicketVerse frontend

Next.js frontend cho nền tảng mua bán lại vé sự kiện PDF.

- [Hướng dẫn chức năng và API](docs/ticketverse-frontend.md)
- [Cấu trúc theo chức năng](docs/frontend-architecture.md)
- [Quy chuẩn giao diện](style.md)

Chạy `npm run dev` sau khi cấu hình `.env` theo `.env.example`. Nếu server đang chạy trước khi di chuyển route, khởi động lại để Next cập nhật cây route.

# Frontend

Next.js App Router, React, TypeScript, TanStack Query, Axios và Zustand.

## Chạy dự án

```bash
npm install
npm run dev
```

Backend mặc định: `http://localhost:7000/api`. Đổi bằng `NEXT_PUBLIC_API_URL` trong `.env.local`.

## Cấu trúc mã nguồn

`app/` giữ `layout.tsx`, `page.tsx`, `globals.css` và `providers.tsx` ở root; các chức năng nằm trong `(modules)` với các nhóm `(auth)`, `(account)`, `(organizer)`, `(moderator)` và `(admin)`. Route groups không xuất hiện trong URL. Code dành riêng cho một nhánh nằm ở `_components/`, `_hooks/`, `_lib/` cạnh trang; code dùng chung nằm trong `components/`, `lib/`, `hooks/`, `types/`, `config/`.

Các nhánh chưa có `page.tsx` hiện chỉ là khung thư mục với `.gitkeep`; chưa phải chức năng hoạt động. Auth có trang `/login`, `/register`, `/account` và modal dùng chung form. Xem `docs/auth-frontend.md` để cấu hình cookie/CORS và refresh phiên. Xem `docs/frontend-architecture.md` để tiếp tục phát triển theo cây route.

## Kiểm tra

### Quản trị tài khoản 2.0 (14/10/2026)

- `/admin`: chỉ ADMIN; danh sách và lọc người dùng, tạo tài khoản USER, sửa tên/số điện thoại, đình chỉ/mở lại kèm lý do. Dùng `/api/users`, không có prefix `/v1` cho nhóm API này.
- `/moderator/users`: chỉ MODERATOR; nhập ID và xác nhận thay đổi trạng thái tài khoản USER qua `PATCH /api/users/:id/status`. Không gọi API danh sách/chi tiết chỉ dành cho ADMIN.
- ADMIN không được đổi trạng thái chính mình hoặc tài khoản ADMIN; MODERATOR không được đổi trạng thái tài khoản MODERATOR/ADMIN. Backend kiểm tra quyền cuối cùng.
- Chưa có API quản trị trạng thái Organizer hoặc cấp vai trò; giao diện không giả lập các chức năng đó. Đình chỉ tài khoản không đồng nghĩa đình chỉ Organizer.
- Nghiệm thu thủ công với tài khoản thử nghiệm: khách/sai vai trò bị chặn; ADMIN tạo/sửa USER và đình chỉ/mở lại có lý do; MODERATOR xử lý USER theo ID; thử ID sai, lý do rỗng, quyền bị từ chối, mạng/Redis lỗi và chuyển phiên đăng nhập.
- Danh sách ADMIN hiện tải toàn bộ từ API; tìm kiếm và phân trang trên dữ liệu đã tải, không phải tìm kiếm/phân trang phía server. Không dùng số hiển thị làm thống kê nghiệp vụ toàn nền tảng.

Các lệnh bên dưới chỉ là hướng dẫn; không tự chạy build/test trong đợt bổ sung giao diện quản trị.

```bash
npm run lint
npx next typegen
npx tsc --noEmit
npm run build
```
