export const sectionContent = {
  events: { title: 'Sự kiện', description: 'Theo dõi và xem xét các sự kiện trên nền tảng.', label: 'Sự kiện' },
  orders: { title: 'Đơn hàng', description: 'Tra cứu đơn hàng và tình trạng giao dịch.', label: 'Đơn hàng' },
  tickets: { title: 'Vé', description: 'Tra cứu vé và kiểm tra trạng thái sử dụng.', label: 'Vé' },
  'check-in': { title: 'Check-in', description: 'Theo dõi lượt check-in và các trường hợp cần kiểm tra.', label: 'Người tham dự' },
  users: { title: 'Người dùng', description: 'Tra cứu thông tin người dùng trên nền tảng.', label: 'Người dùng' },
  reports: { title: 'Báo cáo vi phạm', description: 'Theo dõi các báo cáo và trường hợp cần xử lý.', label: 'Báo cáo' },
} as const;
export type SectionKey = keyof typeof sectionContent;

