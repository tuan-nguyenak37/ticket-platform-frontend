import { LayoutDashboard, CalendarDays, ReceiptText, Tickets, ScanLine, Users, Flag, ShieldCheck, Pin } from 'lucide-react';

export const moderatorMenu = [
  { label: 'Tổng quan', href: '/moderator/dashboard', icon: LayoutDashboard },
  { label: 'Sự kiện', href: '/moderator/events', icon: CalendarDays, badge: '12' },
  { label: 'Sự kiện ghim', href: '/moderator/pinned-events', icon: Pin },
  { label: 'Xét duyệt', href: '/moderator/approvals', icon: ShieldCheck, badge: '12' },
  { label: 'Đơn hàng', href: '/moderator/orders', icon: ReceiptText },
  { label: 'Vé', href: '/moderator/tickets', icon: Tickets },
  { label: 'Check-in', href: '/moderator/check-in', icon: ScanLine },
  { label: 'Người dùng', href: '/moderator/users', icon: Users },
  { label: 'Báo cáo vi phạm', href: '/moderator/reports', icon: Flag, badge: '8' },
];

