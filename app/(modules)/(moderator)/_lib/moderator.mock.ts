import { pendingEvents } from '../moderator/events/_lib/events.mock';
import type { PreviewRecord } from '../moderator/events/_lib/events.types';

export const sectionContent = {
  events: { title: 'Sự kiện', description: 'Theo dõi và xem xét các sự kiện trên nền tảng.', label: 'Sự kiện' },
  orders: { title: 'Đơn hàng', description: 'Tra cứu đơn hàng và tình trạng giao dịch.', label: 'Đơn hàng' },
  tickets: { title: 'Vé', description: 'Tra cứu vé và kiểm tra trạng thái sử dụng.', label: 'Vé' },
  'check-in': { title: 'Check-in', description: 'Theo dõi lượt check-in và các trường hợp cần kiểm tra.', label: 'Người tham dự' },
  users: { title: 'Người dùng', description: 'Tra cứu thông tin người dùng trên nền tảng.', label: 'Người dùng' },
  reports: { title: 'Báo cáo vi phạm', description: 'Theo dõi các báo cáo và trường hợp cần xử lý.', label: 'Báo cáo' },
} as const;
export type SectionKey = keyof typeof sectionContent;

export const sectionRecords: Record<SectionKey, PreviewRecord[]> = {
  events: pendingEvents.map(e => ({ id: e.id, name: e.name, detail: e.organizer, status: 'Chờ duyệt', time: e.submittedAt })),
  orders: [
    { id: 'ORD-1001', name: 'Nguyễn Minh Anh', detail: 'Music Festival · 2 vé · 1.200.000 ₫', status: 'Đã thanh toán', time: '10:42 · 05/10/2026' },
    { id: 'ORD-1002', name: 'Trần Hoàng Nam', detail: 'Tech Meetup · 1 vé · 250.000 ₫', status: 'Chờ thanh toán', time: '10:30 · 05/10/2026' },
  ],
  tickets: [
    { id: 'TKT-932', name: 'Music Festival 2026', detail: 'Nguyễn Minh Anh · Vé Standard', status: 'Cần kiểm tra', time: '10:42 · 05/10/2026' },
    { id: 'TKT-933', name: 'Tech Meetup Saigon', detail: 'Trần Hoàng Nam · Vé General', status: 'Chưa sử dụng', time: '10:30 · 05/10/2026' },
  ],
  'check-in': [
    { id: 'CHK-001', name: 'Nguyễn Minh Anh', detail: 'TKT-932 · Music Festival 2026', status: 'Check-in trùng', time: '10:42 · 05/10/2026' },
    { id: 'CHK-002', name: 'Lê Thu Hà', detail: 'TKT-801 · Tech Meetup Saigon', status: 'Thành công', time: '10:40 · 05/10/2026' },
  ],
  users: [
    { id: 'USR-001', name: 'Nguyễn Minh Anh', detail: 'minhanh@example.com · Người mua', status: 'Hoạt động', time: '05/10/2026' },
    { id: 'USR-002', name: 'Live Nation Vietnam', detail: 'contact@example.com · Nhà tổ chức', status: 'Hoạt động', time: '04/10/2026' },
  ],
  reports: [
    { id: 'RPT-203', name: 'Thông tin vé không chính xác', detail: 'Music Festival 2026 · Nguyễn Minh Anh', status: 'Chờ xử lý', time: '15 phút trước' },
    { id: 'RPT-204', name: 'Nội dung sự kiện cần kiểm tra', detail: 'Indie Night · Lê Thu Hà', status: 'Đang xử lý', time: '28 phút trước' },
  ],
};
