# Kiến trúc frontend Pass Vé 2.0

Tổ chức theo route-based feature colocation của Next.js App Router. Các route group `(modules)`, `(auth)`, `(account)`, `(organizer)`, `(moderator)`, `(admin)` không xuất hiện trên URL. `_components`, `_hooks`, `_lib` không tạo route.

## Cây thư mục

```text
app/
  layout.tsx            # root layout
  page.tsx              # trang chủ duy nhất cho /
  globals.css
  favicon.ico
  providers.tsx
  (modules)/
    (auth)/             # login, register, dialog đăng nhập
    (account)/          # hồ sơ tài khoản
    (organizer)/        # quản lý Ban tổ chức
    (moderator)/        # kiểm duyệt sự kiện
    (admin)/            # chưa triển khai
components/            # layout và UI dùng chung
config/                # biến môi trường
hooks/                 # hook dùng chung
lib/                   # API, auth, query và utils dùng chung
public/                # tài nguyên tĩnh
types/                 # kiểu dùng chung
```

Các route chưa triển khai chỉ chứa `.gitkeep`; chưa có `page.tsx` nên chưa hoạt động. Không tạo chức năng giả chỉ để lấp đầy cây thư mục. Auth có dialog toàn ứng dụng và các trang `/login`, `/register` dùng chung form; `/account` hiển thị phiên đã xác thực. Xem `docs/auth-frontend.md`.

## Quy tắc đặt mã

- Một trang sử dụng: đặt cạnh `page.tsx` ở `_components`, `_hooks`, `_lib` tương ứng.
- Nhiều trang trong cùng nhánh: đặt ở thư mục cha chung.
- Nhiều khu vực độc lập: chuyển sang `components` hoặc `lib`. Chỉ thêm `features` khi thực sự cần chia sẻ nghiệp vụ.
- Access token giữ trong bộ nhớ, refresh cookie HttpOnly do BE quản lý. `lib/auth` chứa phiên đăng nhập, `lib/api` là HTTP dùng chung. React Query dùng cho server state, Zustand chỉ quản lý phiên và modal auth.
- Phân quyền layout chỉ hỗ trợ trải nghiệm người dùng; backend phải kiểm tra quyền API.
- `@/` trỏ tới root dự án trong `tsconfig.json`; `public/`, cấu hình Next.js và environment ở root.

Sau khi chuyển các route group vào `app/(modules)` và giữ trang chủ ở `app/page.tsx`, dừng rồi khởi động lại `npm run dev` để Turbopack bỏ tham chiếu cũ. Nếu panic vẫn xảy ra, đổi tên cache `.next` khi server đã dừng và chạy lại.

