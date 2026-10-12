import { LayoutDashboard, CalendarDays, ReceiptText, ScanLine, Users, Flag, ShieldCheck, Pin } from 'lucide-react';

export const moderatorMenu = [
  { label: 'Tổng quan', href: '/moderator/dashboard', icon: LayoutDashboard },
  { label: 'Sự kiện', href: '/moderator/events', icon: CalendarDays },
  { label: 'Sự kiện ghim', href: '/moderator/pinned-events', icon: Pin },
  { label: 'Xét duyệt vé', href: '/moderator/tickets', icon: ShieldCheck },
  { label: 'Thanh toán', href: '/moderator/payments', icon: ReceiptText },
  { label: 'Đơn hàng', href: '/moderator/orders', icon: ReceiptText },
  { label: 'Check-in', href: '/moderator/check-in', icon: ScanLine },
  { label: 'Người dùng', href: '/moderator/users', icon: Users },
  { label: 'Báo cáo vi phạm', href: '/moderator/reports', icon: Flag },
];

