export const todayEvents = [
  { name: 'Music Festival 2026', venue: 'SECC · 18:00 – 23:00', checkedIn: 420, total: 600, live: true, color: 'bg-violet-500' },
  { name: 'Tech Meetup Saigon', venue: 'Dreamplex · 14:00 – 17:00', checkedIn: 180, total: 250, live: true, color: 'bg-blue-500' },
  { name: 'Workshop AI Basics', venue: 'Bình Dương · 19:00 – 21:00', checkedIn: 50, total: 150, live: false, color: 'bg-amber-500' },
];

export const alerts = [
  { id: 'ALT-01', name: 'Phát hiện check-in trùng', description: 'Vé TKT-932 · Music Festival 2026', severity: 'high', time: '5 phút trước' },
  { id: 'ALT-02', name: 'Mã QR không hợp lệ', description: '3 vé cần kiểm tra · Tech Meetup', severity: 'medium', time: '12 phút trước' },
  { id: 'ALT-03', name: 'Sự kiện có báo cáo mới', description: 'Indie Night · Nội dung sự kiện', severity: 'medium', time: '28 phút trước' },
];

export const activities = [
  { id: 'ACT-01', action: 'Đã duyệt sự kiện', target: 'Acoustic Weekend', actor: 'Bạn', time: '10 phút trước', type: 'approved' },
  { id: 'ACT-02', action: 'Đã từ chối sự kiện', target: 'Late Night Party', actor: 'Minh Anh', time: '35 phút trước', type: 'rejected' },
  { id: 'ACT-03', action: 'Đã xử lý báo cáo', target: 'RPT-203 · Thông tin vé', actor: 'Bạn', time: '1 giờ trước', type: 'report' },
  { id: 'ACT-04', action: 'Đã xác nhận check-in', target: 'TKT-932 · Music Festival', actor: 'Hoàng Nam', time: '1 giờ trước', type: 'checkin' },
];

