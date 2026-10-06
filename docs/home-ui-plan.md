# Kế hoạch UI trang Home — Header và banner sự kiện ghim

## Nguồn và phạm vi

- Phác thảo của người dùng: logo, tìm kiếm, Đăng vé, Vé của tôi, tài khoản và carousel banner sự kiện nổi bật.
- Style: `style.md` (Modern Gradient).
- Postman: [Backend - Events CRUD](https://go.postman.co/collection/47599760-ff255c5f-4756-4945-b7d6-a182634eaaa5), request **13 - List pinned events (public)**, request UID `47599760-5179933f-6411-6fc9-bac9-b7edcfc5aa7a`.
- Postman không có saved response cho request này. Schema được đối chiếu với controller, service, DTO và global response interceptor trong backend.
- Đã thử đọc `http://localhost:7000/api/events/pinned`; backend từ chối kết nối. Chưa xác nhận được nội dung danh sách thực tế.
- Đây là kế hoạch; chưa chỉnh UI Home hoặc cấu hình backend.

## Hợp đồng API đã xác nhận

```text
GET {{baseUrl}}/api/events/pinned
baseUrl trong Postman = http://localhost:7000
Authentication: noauth
Query/body: không có
```

Frontend dùng `ENV.API_URL`, mặc định `http://localhost:7000/api`, nên service gọi `/events/pinned` để tránh lặp `/api/api`.

Response theo backend:

```text
ApiResponse<PublicEvent[]>
  success, statusCode, message, timestamp
  data: [
    event_id, name, description,
    bannerUrl,
    startTime, endTime, venueName, address, categoryId,
    status, isPinned, pinnedAt, phase, createdAt, updatedAt
  ]
```

Quy tắc backend: tối đa 4 sự kiện; `isPinned=true`, `status=published`, `endTime` còn ở tương lai. Thứ tự `pinnedAt DESC`, sau đó `event_id ASC`. FE giữ thứ tự trả về. `data` là mảng, không phải `{ items, total }`.

Các trường mô tả, ảnh và `pinnedAt` có thể null. Không có giá vé, tên nghệ sĩ, tên nhà tổ chức hoặc categoryName trong DTO public này; không tự bịa dữ liệu cho banner.

## Bố cục và hành vi

### Header

- Tái sử dụng `components/layout/Navbar.tsx`, nơi đã có auth modal và tài khoản Zustand.
- Logo bên trái; ô “Bạn muốn tìm sự kiện nào?” ở giữa; Đăng vé, Vé của tôi, tài khoản bên phải.
- Navbar chỉ render một lần qua SiteShell. Home hiện import Navbar lần nữa, cần bỏ lần render đó.
- Desktop: một hàng; mobile: logo/actions hàng đầu, ô tìm kiếm toàn chiều rộng hàng dưới.
- Nút tìm kiếm hoặc Enter dẫn tới `/events?q=<từ khóa đã encode>`. Postman xác nhận API list public hỗ trợ `q`; trang `/events` phải được kiểm tra/tạo handler trước khi bật điều hướng.
- Giữ logic AuthModal khi chưa đăng nhập. Kiểm tra route `/organizer/create` và `/dashboard/tickets` hiện được Navbar tham chiếu, không để CTA dẫn vào trang chưa tồn tại.
- Không lọc riêng các slide pinned bằng ô tìm kiếm; tìm kiếm phải áp dụng cho danh sách sự kiện public.

### Banner carousel

- Container max-width 1280px; padding 16px mobile, 32px desktop.
- Banner bo góc 24px, cao khoảng 420–480px desktop, 320–380px mobile; nội dung không bị cắt khi tên dài.
- Dùng `bannerUrl`; ảnh lỗi thì hiển thị trạng thái banner chưa được cập nhật.
- Dùng lớp phủ tối trên ảnh để chữ trắng luôn đọc được, không hiển thị HTML từ `description` trực tiếp.
- Overlay: tên sự kiện, mô tả ngắn tối đa 2 dòng, thời gian, địa điểm, nhãn “Sắp diễn ra”/“Đang diễn ra”, CTA “Xem sự kiện”.
- CTA dẫn tới `/events/{event_id}`, route chi tiết đã có trong dự án.
- Mũi tên trước/sau; chấm chỉ báo đúng số slide thực tế, không cố định 4 chấm.
- Tự chuyển khoảng 6 giây, có điều khiển dừng/chạy; dừng khi hover, focus hoặc tab trình duyệt bị ẩn.
- Khi prefers-reduced-motion bật: không tự chạy, không chuyển cảnh mạnh. Người dùng vẫn đổi slide thủ công.
- 1 sự kiện: không timer, không nút đổi slide hoặc chấm điều hướng.
- 0 sự kiện: hero thương hiệu trung tính “Khám phá sự kiện cùng TicketVerse”; không hiển thị sự kiện giả.
- Thời gian hiển thị theo Asia/Ho_Chi_Minh, định dạng vi-VN.
- Chuẩn hóa URL ảnh: URL tuyệt đối dùng trực tiếp; `/api/...` được ghép với origin backend, không nối thêm `/api`. Cấu hình Next Image chỉ cho nguồn ảnh được dùng thực tế.

## Style và cách giải quyết xung đột

`style.md` quy định prohibitions có ưu tiên cao nhất. File vừa yêu cầu gradient text/glass cards/Geist ở phần tham chiếu, vừa cấm gradient text, glassmorphism mặc định và Geist ở phần Self-Check.

Kế hoạch áp dụng quy tắc cấm trước:

- Nền tối với ánh sáng gradient violet → fuchsia; không dùng nền trắng cho vùng chính.
- Heading trắng, body trắng 70–80%; không gradient text và không chữ xám trên nền màu.
- Không dùng glassmorphism làm bề mặt mặc định. Kính mờ chỉ dùng hạn chế cho ô tìm kiếm/điều khiển nếu cần.
- Bo góc rounded-2xl/rounded-3xl, viền nhẹ, shadow màu violet; tránh gradient dày đặc.
- Hover CTA dịch dải gradient, tăng glow nhẹ; motion-reduce tắt animation và scale.
- Focus rõ ràng, icon Lucide có tên truy cập khi dùng làm nút.
- Font đề xuất: Be Vietnam Pro, scoped cho phần public Home/Navbar; không đổi font Moderator. Xác nhận nguồn font trước khi triển khai để không phụ thuộc tải font ngoài nếu môi trường không cho phép.
- Không chỉnh nội dung style.md trong bước triển khai UI.

## Cấu trúc module đề xuất

```text
app/
  page.tsx                         # Route / duy nhất, ghép HomePage
  (modules)/
    (homePage)/
      _components/
        HomePage.tsx
        PinnedEventCarousel.tsx
        PinnedEventSlide.tsx
        CarouselControls.tsx
        HomeBannerSkeleton.tsx
        HomeBannerFallback.tsx
      _hooks/
        usePinnedEvents.ts
        useBannerCarousel.ts
      _lib/
        home.api.ts
        home.types.ts
components/layout/
  Navbar.tsx                       # Header dùng chung public
  SiteShell.tsx                     # Ghép navbar/footer một lần
```

Hiện `app/page.tsx` và `app/(modules)/(homePage)/page.tsx` cùng biểu diễn `/`. Khi triển khai, chuyển nội dung group page thành `_components/HomePage.tsx`, giữ app/page.tsx làm entry duy nhất để tránh trùng route.

Service public Home dùng `createApiClient()` không gắn token, không dùng authenticated `apiClient` hoặc import service của Moderator. Hook hiện tại của trang chi tiết đang import API từ Moderator; cần tránh sao chép kiểu phụ thuộc đó sang Home. Logic/type thực sự dùng chung public có thể đưa vào `lib/events` khi tách service public.

## Luồng dữ liệu

1. HomePage render carousel client nằm trong QueryProvider đã có.
2. usePinnedEvents dùng key `['public', 'events', 'pinned']`, gọi home.api.ts, đọc `response.data.data` và xác thực đó là mảng.
3. Cache đề xuất staleTime 60 giây, retry 1; đọc public không chờ restoreSession và không yêu cầu đăng nhập.
4. Loading: skeleton cùng kích thước banner để tránh nhảy layout.
5. Lỗi: thông báo gọn, nút Thử lại; không thay dữ liệu lỗi bằng mock tự động.
6. Success: truyền dữ liệu cho carousel; active slide theo event_id, xử lý an toàn khi dữ liệu thay đổi sau refetch.
7. Ảnh slide đầu ưu tiên tải; ảnh còn lại lazy-load. Chỉ dùng một vùng banner, tránh ảnh lớn gây chậm trang.

## Trình tự triển khai và nghiệm thu

1. Chuẩn hóa route Home và bỏ navbar trùng; giữ nguyên nội dung các module khác.
2. Tạo type/service/hook cho GET public pinned, dựa trên hợp đồng ở trên.
3. Dựng slide + skeleton + fallback theo style và bản phác thảo.
4. Thêm điều khiển carousel, keyboard, pause và reduced motion.
5. Hoàn thiện header tìm kiếm và kiểm tra đích đến các CTA.
6. Kiểm tra TypeScript, ESLint; kiểm thử trường hợp 0/1/4 slide, API lỗi, ảnh thiếu/ảnh lỗi, tiêu đề dài và dữ liệu refetch làm đổi số slide.
7. Xem desktop/mobile (375px, 768px, 1440px), không tràn ngang, focus đủ rõ, chuyển slide không mất focus.
8. Khi backend chạy: xác nhận GET /api/events/pinned trả HTTP 200 và mảng public đúng schema; khách chưa đăng nhập vẫn thấy banner, không phát sinh refresh để gọi API này.
