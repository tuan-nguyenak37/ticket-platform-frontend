# Frontend

Next.js App Router, React, TypeScript, TanStack Query, Axios và Zustand.

## Chạy dự án

```bash
npm install
npm run dev
```

Backend mặc định: `http://localhost:7000/api`. Đổi bằng `NEXT_PUBLIC_API_URL` trong `.env.local`.

## Tổ chức theo tính năng

Giao diện và nghiệp vụ của một tính năng nằm cạnh nhau trong `app`. `lib` chứa logic và cấu hình dùng chung.

```text
app/
  layout.tsx                  # Layout gốc
  providers.tsx               # Ghép các provider toàn ứng dụng
  globals.css
  page.tsx                    # Trang chủ /
  auth/
    login/page.tsx            # /auth/login
    register/page.tsx         # /auth/register
    _module/                  # Toàn bộ code nội bộ của tính năng auth
      LoginForm.tsx           # Giao diện đăng nhập
      RegisterForm.tsx        # Giao diện đăng ký
      use-auth.ts             # Hooks query/mutation, điều hướng
      auth.service.ts         # Các lời gọi API auth
      auth-client.ts          # Gắn token, xử lý phiên đăng nhập khi lỗi 401
      auth.store.ts           # Zustand: phiên đăng nhập
      auth.types.ts           # Kiểu dữ liệu auth
      auth.keys.ts            # Query keys auth
      index.ts                # Export dùng bên ngoài tính năng
lib/
  env.ts                      # Cấu hình môi trường
  http/
    axios-client.ts           # HTTP factory dùng chung
    http-errors.ts            # Chuẩn hóa lỗi HTTP
  query/
    query-client.ts           # Cấu hình cache mặc định
    QueryProvider.tsx         # Kết nối TanStack Query với React
```

`_module` là thư mục private của Next.js, không tạo route. Đây là tên quy ước của dự án, không phải tên bắt buộc của framework. Giữ các file cùng cấp khi tính năng còn nhỏ; chỉ chia thêm thư mục khi số lượng file thực sự cần.

File nháp trống có sẵn `app/(modules)/auth/(homePage)/page.tsx` được giữ nguyên. File này tạo route `/auth` và cần có default export hợp lệ trước khi build toàn dự án.

## Quy ước

- Mở `app/auth` là tìm thấy cả route, giao diện và nghiệp vụ auth.
- `page.tsx` giữ metadata và ghép giao diện. Logic auth nằm trong `_module`.
- Trong `_module`, import trực tiếp file cùng cấp. Các tính năng khác cần auth có thể import export công khai từ `@/app/auth/_module`; tránh import vòng qua `index.ts` trong nội bộ auth.
- `lib` không import ngược từ `app`. HTTP nhận callback để auth tự cung cấp token và xử lý 401.
- TanStack Query giữ trạng thái request và cache API. Zustand giữ phiên đăng nhập. Query keys nằm cạnh code auth, cấu hình cache chung nằm trong `lib/query`.
- Auth hooks, store và authenticated HTTP client dùng phía client. Server Components có thể render form client; HTTP phía server cần thông tin xác thực riêng theo từng request.
- Component giao diện dùng chung giữa nhiều tính năng có thể đặt trong `components`; chỉ tạo thư mục này khi cần.

## Thêm tính năng mới

Ví dụ quản lý sản phẩm:

```text
app/products/
  page.tsx
  [id]/page.tsx
  _module/
    ProductList.tsx
    ProductDetails.tsx
    use-products.ts
    product.service.ts
    product.types.ts
    product.keys.ts
```

Chỉ tạo file cần dùng. Không bắt buộc mỗi tính năng phải có store, HTTP client riêng hoặc đủ mọi lớp. Các service phía client cần token có thể dùng `authenticatedApiClient` được export từ auth.

## Kiểm tra

```bash
npm run lint
npx next typegen
npx tsc --noEmit
npm run build
```
