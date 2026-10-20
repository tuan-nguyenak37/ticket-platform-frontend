export const sectionContent = {
  events: { title: 'Sự kiện', description: 'Theo dõi và xem xét các sự kiện trên nền tảng.', label: 'Sự kiện' },
  orders: { title: 'Đơn hàng', description: 'Tra cứu đơn hàng và tình trạng giao dịch.', label: 'Đơn hàng' },
  tickets: { title: 'Vé', description: 'Tra cứu vé và kiểm tra trạng thái sử dụng.', label: 'Vé' },
  users: { title: 'Người dùng', description: 'Tra cứu thông tin người dùng trên nền tảng.', label: 'Người dùng' },
} as const;
export type SectionKey = keyof typeof sectionContent;

