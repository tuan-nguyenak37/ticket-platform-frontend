import type { ManagedUser } from '@/lib/users/api';
import { dateTime } from '@/lib/commerce/rules';

export const statusLabels: Record<string, string> = { active: 'Hoạt động', suspended: 'Tạm khóa', banned: 'Bị cấm', deleted: 'Đã xóa' };
export const roleLabels: Record<string, string> = { admin: 'Quản trị viên', moderator: 'Kiểm duyệt viên', user: 'Người dùng' };
export function UserInfo({ user }: { user: ManagedUser }) {
  const fields = [
    ['Mã tài khoản', user.user_id], ['Họ tên', user.fullName || 'Chưa cập nhật'], ['Email', user.email], ['Điện thoại', user.phone || 'Chưa cập nhật'],
    ['Vai trò', roleLabels[user.role] ?? user.role], ['Trạng thái', statusLabels[user.status] ?? user.status],
    ['Email xác minh', user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'], ['Điện thoại xác minh', user.phoneVerified ? 'Đã xác minh' : 'Chưa xác minh'], ['Danh tính', user.identityVerified ? 'Đã xác minh' : 'Chưa xác minh'],
    ['Điểm uy tín', user.reputationScore], ['Mua thành công', user.successfulBuys], ['Bán thành công', user.successfulSales], ['Tranh chấp', user.disputeCount],
    ['Ngày tạo', dateTime(user.createdAt)], ['Cập nhật', dateTime(user.updatedAt)], ['Đăng nhập gần nhất', dateTime(user.lastLoginAt)],
  ];
  return <section className="tv-panel space-y-4"><h2 className="font-bold">Thông tin tài khoản</h2><dl className="grid gap-4 text-sm sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="opacity-60">{label}</dt><dd className="mt-1 break-all font-medium">{value}</dd></div>)}</dl>{user.moderation && <div className="space-y-2 border-t border-current/15 pt-4 text-sm"><h3 className="font-semibold">Lần xử lý gần nhất</h3><p className="whitespace-pre-wrap break-words">{user.moderation.reason || 'Chưa có lý do xử lý'}</p><p className="break-all">Người xử lý: {user.moderation.changedBy || '—'} · {dateTime(user.moderation.changedAt)}</p></div>}</section>;
}
