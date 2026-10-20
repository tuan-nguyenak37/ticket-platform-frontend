# TicketVerse frontend

Cập nhật: 13/10/2026. Tài liệu này mô tả giao diện và hợp đồng đang được tích hợp; cấu trúc mã nguồn xem [frontend-architecture.md](frontend-architecture.md).

## Stack và cấu hình

Next.js 16 App Router, React 19, Tailwind 4, Lucide, Axios, React Query 5, Zustand. Đọc hướng dẫn Next đi kèm `node_modules/next/dist/docs/` trước khi đổi quy ước route/layout.

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend có `/api`, mặc định `http://localhost:7000/api` |
| `NEXT_PUBLIC_UPLOAD_MAX_FILE_SIZE_MB` | Giới hạn PDF đồng bộ backend, mặc định 10 MB |
| `NEXT_PUBLIC_PAYMENT_MOCK_ENABLED` | Bật rõ ràng cho môi trường mô phỏng; mặc định tắt |

Không đổi cấu hình backend hoặc secrets trong đợt sửa giao diện. Các biến public được đóng gói bởi Next, cần khởi động lại/build lại khi tự thay cấu hình. Gmail, Redis, scanner và worker được cấu hình riêng trong backend.

## UX và điều hướng

- Giữ thương hiệu tím, nền tối cho khách hàng, nền sáng cho quản trị. Một font Geist và các token CSS chung; biểu mẫu dùng bề mặt rõ ràng, giảm hiệu ứng trang trí.
- Desktop: Khám phá, Tìm vé, Đăng bán, Đơn hàng, menu tài khoản. Mobile: thanh dưới Khám phá, Tìm vé, Đăng bán, Tài khoản.
- Hồ sơ và menu tài khoản có Vé tôi đăng, Đơn mua/bán, Doanh thu. Phân biệt vé đăng bán với vé người mua đã được cấp trong đơn hàng.
- Tìm sự kiện có phân trang; tìm vé dùng bộ lọc nâng cao trong dialog, tìm sự kiện bằng tên thay vì nhập ID. Bộ lọc và trang được giữ trên URL.
- Footer chỉ dẫn tới chức năng có thật. Bỏ quảng bá tạo sự kiện/check-in QR và các liên kết chưa có trang đích.
- Dialog dùng native dialog, Escape, phục hồi focus; thao tác gửi khóa bấm lặp. CSS có reduced-motion, focus-visible và nút dùng chung tối thiểu 44px.

## Đăng bán Ticketbox PDF

Luồng: **Tải PDF → Xác nhận thông tin → Giá bán và gửi duyệt**.

1. Người bán đăng nhập, chọn một PDF đúng định dạng/chữ ký và giới hạn dung lượng.
2. FE gửi `POST /tickets/extract`, multipart `ticketFile`, timeout 150 giây, có AbortSignal. Không tự retry mutation. Trình duyệt tự đặt boundary.
3. Chỉ mở bước kế tiếp khi `template=ticketbox-v1`, có eventName/date/time/endTime/venue/ticketTier, không có cảnh báo thiếu/không chắc chắn ở các trường này, đúng một QRCode và `eventEnded=false`. Ghế và địa chỉ không bắt buộc. Vé hết hạn vẫn hiển thị kết quả đọc nhưng không được đăng bán. Kết quả generic, không rõ thời hạn hoặc lịch qua đêm chưa xử lý thì chặn.
4. Tìm sự kiện sắp diễn ra đã xuất bản theo tên đọc được; người bán chọn và xác nhận đúng ngày giờ/địa điểm. FE cảnh báo ngày/giờ khác với PDF. Không tự chọn kết quả đầu, không có tạo sự kiện/draft cho người bán. Không thấy sự kiện thì cần quản trị bổ sung.
5. Chỉ nhập `price` và mô tả tùy chọn. Gửi `POST /tickets` với cùng File, eventId, ticketTier, price, optional seatInfo/description. Không gửi metadata extraction, mã QR hoặc giá gốc.
6. Thành công chuyển tới chi tiết vé do server trả. Backend đọc lại file, kiểm tra trùng và duyệt độc lập. Nếu mất phản hồi khi tạo vé, hướng dẫn kiểm tra Vé tôi đăng trước khi đăng lại.

Thay PDF hủy request hiện tại, xóa kết quả/sự kiện đã chọn; kết quả cũ không được ghi đè file mới. File chỉ nằm trong bộ nhớ, reload phải chọn lại. Lỗi 413, 422, 429, 503 và timeout có lời giải thích; 429 chờ Retry-After, không tự chạy lại.

Hai mẫu Ticketbox cung cấp trong dự án đều thuộc sự kiện năm 2025 đã kết thúc: dùng để đối chiếu nhận diện, không dùng để đăng bán hiện tại. Không sao chép PDF/mã riêng tư vào repository.

`originalPrice` đã bị loại khỏi contract backend. FE không khai báo, gửi hoặc hiển thị trường này. Backend strict whitelist từ chối payload cũ chứa trường đó.

## Mua, thanh toán và tranh chấp

- Mỗi đơn một vé, tạo đơn không giữ vé; không đếm ngược hết hạn thanh toán. Backend quyết định kết quả khi nhiều người mua cùng vé.
- UUID Idempotency-Key lưu trong sessionStorage theo buyer/ticket và theo lần thanh toán. Retry sau mất phản hồi dùng lại key. Không lưu token/mật khẩu/thông tin thẻ vào storage.
- Checkout dùng payment history/start/confirm/cancel hiện có và đánh dấu mô phỏng. CVV được xóa khỏi form sau gửi; frontend không lưu thẻ.
- `refund_pending` là chờ hoàn tiền, không phải hoàn tiền thành công và không cho tải vé. Không suy luận trạng thái theo đồng hồ FE.
- Đơn hàng có tab Tôi mua/Tôi bán, status/filter/page trên URL. Chi tiết ưu tiên trạng thái và hành động tiếp theo.
- PDF riêng tư tải qua API Bearer, chỉ theo quyền. Preview tạo khi bấm, thu hồi object URL khi đóng/rời trang. Đọc file có thể khiến backend ghi nhận delivered; không đồng nghĩa check-in thành công.
- Tranh chấp giữ nội dung và các file chưa gửi khi lỗi; upload tuần tự JPEG/PNG/GIF/WebP/PDF, tối đa 5 MB/file và 5 file mỗi bên theo contract hiện có. Không tự retry vì upload không có idempotency. Tải lại và đối chiếu bằng chứng trước khi gửi bổ sung.
- Quyết định tranh chấp, hoàn tiền và chi trả quản trị vẫn theo quyền/trạng thái backend; không được xử lý giao dịch mà mình là một bên.

## Doanh thu và tài khoản nhận tiền

- Dùng `GET /orders/me/revenue`, đủ 7 revenueStatus; summary toàn bộ danh sách không đổi theo bộ lọc. Amount, platformFee, sellerNetAmount lấy từ snapshot backend.
- GET/PUT `/users/me/payout-account`: DEMO_VCB/DEMO_TCB/DEMO_MB, tên 2–100 ký tự, số 9900 dài 10–16 chữ số. Chỉ hiển thị đầy đủ trong form chỉnh sửa của chủ tài khoản.
- Thiếu tài khoản không cấm đăng bán; doanh thu nhắc bổ sung. Không có ví/nút rút tiền. Lưu tài khoản chỉ xác nhận đã lưu và làm mới doanh thu.
- Khi trang đang mở, có tài khoản, cấu hình chi trả tự động bật và có khoản chờ xử lý: cập nhật khoảng 15 giây, dừng ở tab nền, lỗi hoặc giới hạn 40 lần cập nhật của query; vẫn có Làm mới thủ công và refetch khi quay lại.
- `automaticPayoutsEnabled` là cờ cấu hình, không phải kiểm tra worker khỏe. Không hứa chuyển tiền trong 15 giây hoặc email chắc chắn đã tới hộp thư. Toàn bộ chuyển tiền vẫn mô phỏng theo `isMock`.

## Quản trị

- Layout có guard admin/moderator; backend vẫn là nơi xác thực quyền.
- Menu có quản lý sự kiện/ghim, duyệt vé, đơn hàng, tranh chấp, thanh toán, người dùng. Không có check-in hoặc báo cáo chưa tích hợp.
- Màn duyệt: hai vùng PDF/đối chiếu trên desktop, nút chuyển vùng trên mobile. Báo cáo ghi nguồn PDF/OCR và giờ kết thúc/địa chỉ; điểm tin cậy không phải xác suất vé thật.
- Duyệt vẫn gửi checkVersion, chọn mã thuộc lượt hiện tại, ghi chú khi có cảnh báo. 409 tải lại, không cập nhật cache detail bằng response quyết định rút gọn.
- Xác nhận duyệt/xuất bản/hủy sự kiện và khóa/mở khóa người dùng qua dialog; lý do và ảnh hưởng được trình bày trước khi gửi.
- Moderator có thể xử lý USER theo ID; danh sách/chi tiết người dùng chỉ cho ADMIN theo API hiện tại. Không dựng tìm kiếm toàn hệ thống khi endpoint chỉ trả tối đa 100 tài khoản.

## Kiểm chứng và bàn giao

Không chạy test suite, build hoặc lint theo yêu cầu. Đường dẫn import và cú pháp được rà tĩnh; trạng thái kiểm tra TypeScript/hiển thị thực tế được ghi trong bàn giao cuối cùng. Không thực hiện thanh toán, duyệt vé, khóa tài khoản hay gửi email thật trong quá trình sửa UI.

Các tình huống cần nghiệm thu khi chạy tích hợp: hai PDF mẫu hết hạn; PDF khác mẫu/thiếu trường/nhiều QR; timeout và 429/503; đổi file lúc đang đọc; tạo vé mất phản hồi; hai người mua cùng vé; refund_pending không tải file; lỗi upload bằng chứng; thiếu tài khoản nhận tiền; phân quyền và giao diện mobile/desktop.

Backend cần endpoint extraction và scanner hoạt động. Worker kiểm tra vé vẫn cần HMAC secret ổn định cho dữ liệu lịch sử; FE không tạo hoặc thay secret đó. Không thay đổi backend/database trong đợt này. Không tạo nhánh, commit hoặc push Git.

## Nhập sự kiện từ PDF

Trong form Tạo sự kiện mới, mục Nhập từ PDF gọi POST /tickets/extract và hiển thị bản xem trước. Người dùng bấm Điền thông tin vào form để áp dụng tên, địa điểm, địa chỉ, ngày và giờ; trường thiếu để trống. Danh mục, ảnh bìa, mô tả bổ sung thủ công. Không áp dụng điều kiện một QR của đăng bán vé. PDF hết hạn vẫn có thể đọc nhưng xuất bản phải thỏa lịch hợp lệ. Giờ gửi lên API theo múi giờ Việt Nam UTC+7. Không tự lưu hoặc xuất bản; chưa có phát hiện sự kiện trùng tự động.
