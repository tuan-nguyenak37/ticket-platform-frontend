# TicketVerse frontend

## Stack và cấu hình

Giữ Next.js 16 App Router, React 19, Tailwind 4, Lucide, Axios, React Query 5 và Zustand. Giao diện public dùng nền tối/violet hiện có; không gian quản trị dùng nền sáng. Đọc tài liệu Next tại `node_modules/next/dist/docs/` trước khi thay đổi quy ước framework.

Sao chép các biến cần thiết từ `.env.example` vào cấu hình local:

| Biến | Ý nghĩa |
| --- | --- |
| NEXT_PUBLIC_API_URL | URL backend có `/api`, mặc định `http://localhost:7000/api` |
| NEXT_PUBLIC_UPLOAD_MAX_FILE_SIZE_MB | Đồng bộ `UPLOAD_MAX_FILE_SIZE_MB` backend, mặc định 10, 1–50 MB |
| NEXT_PUBLIC_PAYMENT_MOCK_ENABLED | Mặc định false; chỉ bật rõ ràng cho môi trường phát triển/demo |

Biến NEXT_PUBLIC được đóng gói lúc build; đổi cấu hình cần chạy lại dev/build. Backend còn phải bật `PAYMENT_MOCK_ENABLED=true` và chạy development/test; production backend từ chối mock. Không có VNPay hoặc thanh toán thật. Frontend không thay cấu hình tự duyệt; giữ `TICKET_AUTO_APPROVE_ENABLED=false`.

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Build hiện dùng next/font/google (Geist và Geist Mono), cần kết nối Google Fonts. Không thay font hoặc framework để che lỗi mạng.

## Các trang

| Trang | Chức năng |
| --- | --- |
| `/moderator/tickets` | ADMIN/MODERATOR: hàng chờ, tìm kiếm, lọc trạng thái/OCR/cách duyệt và sự kiện/danh mục/hạng/giá, phân trang |
| `/moderator/tickets/[ticketId]` | PDF riêng tư, dữ liệu khai báo, OCR/expected/confidence/evidence/cảnh báo/trùng, kiểm tra lại, duyệt/từ chối |
| `/organizer/create` | Chọn sự kiện từ API, một PDF, giá gốc và giá bán lại VNĐ |
| `/dashboard/tickets` | Vé tôi đăng, lọc và phân trang |
| `/dashboard/tickets/[ticketId]` | Chi tiết/trạng thái OCR và hủy đăng theo trạng thái được phép |
| `/tickets` | Tìm vé public, bộ lọc đúng DTO, chọn vé và xác nhận tạo đơn |
| `/events/[eventId]` | Thay danh sách vé mock bằng API theo eventId |
| `/dashboard/orders` | Đơn mua/bán, lọc side/status, phân trang |
| `/dashboard/orders/[orderId]` | Trạng thái backend, mock payment, hủy, tải vé, mở tranh chấp/phản hồi |
| `/moderator/orders` | Danh sách quản trị và bộ lọc trạng thái |
| `/moderator/orders/[orderId]` | Giải quyết tranh chấp, hoàn tiền/chi trả giả lập theo quyền và trạng thái |

## Hợp đồng và hành vi

- `lib/commerce/api.ts` dùng client public hoặc `lib/auth/session.ts` có Bearer/refresh chung. Không tự dựng endpoint hay gửi amount/sellerId/buyerId/status khi tạo đơn/vé.
- Access token chỉ ở bộ nhớ. Cookie HttpOnly refresh nhận/gửi bằng withCredentials; refresh được tuần tự hóa, chỉ replay request 401 một lần. Session revision chặn kết quả của phiên cũ; đổi tài khoản/xuất phiên xóa query cache. Backend CORS cần cho phép origin frontend với credentials. SameSite=Lax yêu cầu triển khai phù hợp cùng site; không trộn localhost với 127.0.0.1.
- PDF validate một file, MIME/đuôi/chữ ký và dung lượng; backend vẫn là nơi xác thực cuối cùng. Response tạo chỉ dùng ID để tải trang chi tiết, không tự đổi pending_review thành available. Upload không có idempotency contract: lỗi mạng hướng người bán kiểm tra danh sách trước khi gửi lại.
- OCR polling 3 giây, tối đa 100 lần cập nhật dữ liệu cho query; dừng khi terminal, lỗi, tab nền hoặc unmount. QueryFn nhận AbortSignal. Khi hết giới hạn có nút Làm mới. Kiểm tra lại dùng backend xác định thời gian tối thiểu một phút vì DTO không trả check.updatedAt.
- Duyệt gửi checkVersion hiện tại, selectedCodeId thuộc codes hiện tại; nhiều mã phải chọn. Cảnh báo cần note; reject cần reason. Không cho người đăng tự duyệt/từ chối. Xung đột 409 tải lại chi tiết và giải thích trạng thái/phiên bản đổi.
- **Đối chiếu runtime/controller:** PATCH review trả `TicketResponseDto.from`, không có event/check/review/fileUrl. Sau quyết định chỉ invalidate/refetch GET detail; không ghi DTO rút gọn vào cache chi tiết.
- Mỗi lần tạo đơn mới có UUID Idempotency-Key; sessionStorage lưu theo buyer/ticket trước request. Retry và reload dùng key cũ đến khi nhận response thành công. Lần mua mới sau kết quả đã xác nhận dùng key mới. Nếu storage bị chặn, không gửi đơn vì không đảm bảo retry qua reload. Không lưu token/password vào storage.
- Tạo đơn không giữ vé. Đơn pending tự đọc lại tối đa 60 lần, 5 giây/lần; không tự đánh dấu trả tiền, hết hạn hay cấp vé dựa vào đồng hồ frontend. Backend quyết định. `refund_pending` không có quyền tải file và không được hiển thị như đã hoàn tiền.
- Bằng chứng văn bản được hiển thị nguyên văn, không biến URL người dùng nhập thành liên kết. Danh sách dispute.attachments hiển thị bên gửi, người gửi, MIME, dung lượng và thời gian; xem ảnh/PDF và tải qua API có xác thực. Đóng/chuyển bằng chứng hoặc rời trang hủy request và thu hồi object URL. Giao diện upload bằng chứng chưa triển khai. Seller chỉ phản hồi một lần; manager thuộc giao dịch không giải quyết/hoàn tiền/chi trả.
- PDF quản trị và file đơn mua dùng Axios blob có xác thực. Không dùng fileUrl làm URL static. Object URL thu hồi khi unmount hoặc sau download; lỗi JSON của endpoint blob được giải mã để giữ nguyên HTTP status và thông báo.
- Nút gửi dùng pending state + khóa tức thời chống double-click; mutation không tự retry. Các thao tác lỗi hiển thị thật, không fallback mock. Các module mock mua vé cũ đã được gỡ khỏi repository.

## Kiểm chứng ngày 11/10/2026

- 26 test frontend đạt: refresh đồng thời/hết phiên, review đúng mã/phiên bản, ghi chú, API payload, polling giới hạn, PDF validation, idempotency retry/lần mua mới, quyền download cho paid so với refund_pending, tranh chấp một lần/giới hạn thời gian/không tự xử lý và chi trả.
- TypeScript và ESLint đạt. Production build đã đạt sau khi cho phép tải Google Fonts.
- Đăng nhập thật qua UI bằng tài khoản người dùng cung cấp: backend trả role admin; khôi phục cookie qua reload hoạt động. Không lưu thông tin đăng nhập trong source/docs.
- Tạo ba tài khoản test riêng (seller, buyer, buyer2) bằng API auth với mật khẩu ngẫu nhiên chỉ ở bộ nhớ; không chỉnh role hoặc database.
- API thật: tạo sự kiện demo `event_n-XIpDocKhHIzp7J`, đăng PDF tổng hợp `ticket_WgGBsb7S5RwxtgjD` → 201 pending_review. Worker thực chạy OCR → completed/version 1. UI quản trị hiển thị bảy trường, cảnh báo confidence, một QR; yêu cầu ghi chú trước khi duyệt. Duyệt thủ công thật → available, GET public có đúng vé. Sau reload, quyết định đã lưu hiển thị đúng và nút duyệt biến mất.
- Có kiểm tra giao diện quản trị ở desktop và 390×844; file tải qua blob riêng tư. Trình xem PDF nhúng tùy trình duyệt; luôn có liên kết mở file để đối chiếu.
- **Chặn backend:** GET `/api/orders/manage` và POST `/api/orders` cho cả hai buyer trả 500. Kiểm tra metadata database chỉ đọc cho thấy schema public chưa có `orders`, `order_payments`, `order_disputes`. Chưa áp dụng SQL/migration hoặc sửa backend theo phạm vi yêu cầu. Cần người quản lý backend áp dụng `backend/docs/orders-schema.sql` đúng database và khởi động với mock enabled để kiểm thử tiếp.
- Bản backend dist có lỗi thiếu module `./dto/update-user.dto`; không sửa dist. API đang chạy cổng 7000 được dùng cho kiểm thử. Worker chạy trực tiếp bằng ts-node có sẵn, giữ tự duyệt tắt.

**Chưa kiểm chứng xuyên suốt:** thanh toán giả lập → tải vé, tranh chấp qua HTTP thực, race settlement hai người mua, payout sau hạn tranh chấp, OCR nhiều mã/recheck/stale version qua UI. Logic/frontend contract có test, nhưng không thay thế kiểm thử tích hợp backend. Tài khoản MODERATOR riêng chưa được cấp; ADMIN đã được kiểm chứng truy cập cùng màn hình.

Các trang dashboard tổng quan/check-in/reports cũ ngoài phạm vi vẫn cần tích hợp riêng; không coi số liệu mẫu ở đó là kết quả giao dịch thật.

## Chạy lại acceptance sau khi backend sẵn sàng

1. Seller đăng PDF tổng hợp phù hợp sự kiện published chưa kết thúc; xác nhận pending_review, không có trên public. Admin khác seller mở chi tiết; đợi OCR, chọn mã, nhập ghi chú và duyệt. PDF nhiều mã phải chọn rõ một code; kiểm tra reject reason và cấm tự duyệt.
2. Hai buyer tạo đơn trên cùng vé (key khác nhau); retry từng thao tác giữ nguyên key. Cả hai đơn pending không làm vé mất khỏi sàn. Bắt đầu payment cho cả hai, gửi success đồng thời theo folder race của `backend/docs/postman/orders.postman_collection.json`.
3. Đúng một đơn paid, một refund_pending. UI người thắng có tải file; người thua hiển thị chờ hoàn tiền và không có nút tải. Kiểm tra API từ chối tải cho seller/người ngoài và người thua. Download thành công đổi paid thành delivered theo backend.
4. Buyer mở tranh chấp trong hạn với reason/evidence text; seller gửi response; manager ngoài giao dịch giải quyết accept/reject với note. Accept mới chỉ refund_pending; mock refund mới chuyển refunded. Reject khôi phục trạng thái backend, không cho mở tranh chấp thứ hai.
5. Kiểm tra payout chỉ khi completed/ready và payment succeeded; backend còn kiểm tra event published/hạn tranh chấp. Kiểm tra 401/403/409, mất mạng khi tạo đơn, double-click, reload và rời trang khi polling/download.

PDF test và sự kiện tổng hợp chỉ phục vụ kiểm thử local, không phải vé thật. IDs trên giúp phân biệt với dữ liệu người dùng; chưa xóa tài khoản thử vì backend không có endpoint xóa user.


## Dọn dữ liệu mẫu (12/10/2026)

Đã gỡ dữ liệu sự kiện, thống kê, check-in, cảnh báo và bản ghi minh họa khỏi workspace moderator. Dashboard liên kết đến các trang sự kiện/vé/đơn hàng dùng API thật. Các mục chưa tích hợp hiển thị thông báo rõ ràng, không trả danh sách giả. Thay đổi này chỉ dọn frontend, không xóa bản ghi trong database backend.

Kiểm tra ngày 12/10/2026: production build, TypeScript, ESLint trên app/components/lib/tests và các file cấu hình đều đạt; 26 test đạt. Chưa chạy lại luồng E2E với backend vừa cập nhật.

Chi tiết đơn quản trị và đơn mua/bán dùng chung phần xem bằng chứng; tranh chấp đã đóng vẫn xem được file. Chưa kiểm chứng xem/tải với dữ liệu tranh chấp thật trên backend cập nhật.

## API người dùng

- `/moderator/users`: ADMIN gọi GET /users (tối đa 100 tài khoản), GET /users/:id, POST /users, PATCH /users/:id và PATCH /users/:id/status. Tìm kiếm chỉ trên danh sách đã tải; không giả lập phân trang backend.
- MODERATOR chỉ có form PATCH /users/:id/status theo mã USER. List/detail vẫn ADMIN-only theo controller hiện tại; backend cần cấp API tra cứu phù hợp nếu muốn moderator chọn người dùng từ danh sách.
- `/dashboard/profile`: GET/PATCH /users/me và PATCH /users/me/password; chỉ sửa fullName. Đổi mật khẩu thành công xóa phiên và yêu cầu đăng nhập lại; không trim mật khẩu.
- Không có thao tác đổi role, email, reset mật khẩu người khác hoặc xóa tài khoản. Chưa kiểm chứng runtime các thao tác ghi bằng tài khoản thật trong lần tích hợp này.
