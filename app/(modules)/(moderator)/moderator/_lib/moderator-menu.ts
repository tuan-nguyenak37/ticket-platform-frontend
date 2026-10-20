import { Inbox, History, UserRound } from 'lucide-react';

export const moderatorMenu = [
  { label: 'Chờ kiểm duyệt', href: '/moderator/events', icon: Inbox },
  { label: 'Lịch sử kiểm duyệt', href: '/moderator/history', icon: History },
  { label: 'Trạng thái tài khoản', href: '/moderator/users', icon: UserRound },
];
