import type { TicketDetail } from './tickets.types';
export const statusLabels = { pending_review: 'Chờ duyệt', rejected: 'Đã từ chối', available: 'Đang bán', holding: 'Đang giữ', sold: 'Đã bán', cancelled: 'Đã hủy', expired: 'Hết hạn' };
export const checkLabels = { queued: 'Đang xếp hàng', processing: 'Đang kiểm tra', completed: 'Đã kiểm tra', failed: 'Kiểm tra lỗi', skipped: 'Đã bỏ qua' };
export const fieldLabels: Record<string, string> = { eventName: 'Tên sự kiện', date: 'Ngày', time: 'Giờ', venue: 'Địa điểm', ticketTier: 'Hạng vé', seat: 'Ghế', originalPrice: 'Giá gốc' };
export const comparisonLabels: Record<string, string> = { match: 'Khớp', mismatch: 'Không khớp', missing: 'Thiếu', uncertain: 'Chưa chắc chắn' };
const warnings: Record<string, string> = { automatic_approval_disabled: 'Tự duyệt đang tắt; cần kiểm tra thủ công.', code_missing: 'Không đọc được mã vé.', multiple_codes: 'Có nhiều mã; hãy chọn mã vé cần duyệt.', event_not_eligible: 'Sự kiện không đủ điều kiện duyệt vé.', duplicate_detected: 'Phát hiện vé có file hoặc mã trùng.', legacy_codes_unchecked: 'Có vé lịch sử chưa được kiểm tra mã.', auto_review_failed: 'Lượt tự duyệt gặp lỗi.' };
export function warningLabel(reason: string) {
  if (warnings[reason]) return warnings[reason];
  const match = /^field_(.+)_(match|mismatch|missing|uncertain)$/.exec(reason);
  return match ? `${fieldLabels[match[1]] ?? match[1]}: ${comparisonLabels[match[2]]}` : reason;
}
export function money(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value); }
export function dateTime(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(d); }
export function canReview(ticket: TicketDetail, actorId?: string) { return Boolean(actorId && ticket.sellerId !== actorId && ticket.status === 'pending_review' && !ticket.review); }
export function approvalError(ticket: TicketDetail, actorId: string | undefined, codeId: string, note: string, now: number): string | null {
  if (!canReview(ticket, actorId)) return 'Không thể duyệt vé này hoặc vé do chính bạn đăng.';
  if (ticket.check?.status !== 'completed' || !ticket.check.report) return 'Cần lượt kiểm tra hiện tại hoàn tất trước khi duyệt.';
  if (!ticket.check.codes.some(code => code.id === codeId)) return 'Hãy chọn một mã đã đọc được từ file vé.';
  if (ticket.check.report.reasons.includes('event_not_eligible') || new Date(ticket.event.endTime).getTime() <= now) return 'Sự kiện không đủ điều kiện duyệt vé.';
  if (note.trim().length > 2000) return 'Ghi chú tối đa 2000 ký tự.';
  if (ticket.check.report.reasons.length && !note.trim()) return 'Cần ghi chú cách xử lý các cảnh báo trước khi duyệt.';
  return null;
}
