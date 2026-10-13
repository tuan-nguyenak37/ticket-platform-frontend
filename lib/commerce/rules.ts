import type { OrderDetail } from './types';
export const ticketLabels = { pending_review: 'Chờ duyệt', rejected: 'Bị từ chối', available: 'Đang bán', holding: 'Đang giữ', sold: 'Đã bán', cancelled: 'Đã hủy', expired: 'Hết hạn' };
export const orderLabels = { pending_payment: 'Chờ thanh toán', cancelled: 'Đã hủy', expired: 'Hết hạn', paid: 'Đã thanh toán, đã được cấp vé', delivered: 'Đã mở vé', completed: 'Hoàn tất', disputed: 'Đang tranh chấp', refund_pending: 'Chờ hoàn tiền', refunded: 'Đã hoàn tiền' };
export const payoutLabels = { none: 'Chưa phát sinh', pending: 'Chờ đủ điều kiện', ready: 'Sẵn sàng chi trả', paid: 'Đã chi trả', blocked: 'Tạm khóa' };
export const checkLabels = { queued: 'Đang xếp hàng', processing: 'Đang xử lý OCR', completed: 'Đã hoàn tất đối chiếu', failed: 'Kiểm tra lỗi', skipped: 'Đã bỏ qua' };
export const money = (value: number | string) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 2 }).format(Number(value));
export const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
export function orderPermissions(order: OrderDetail, actor: string | undefined, manage: boolean, now: number) {
  const buyer = actor === order.buyerId && !manage;
  const seller = actor === order.sellerId && !manage;
  const manager = Boolean(manage && actor && actor !== order.buyerId && actor !== order.sellerId);
  return {
    cancel: buyer && order.status === 'pending_payment',
    pay: buyer && order.status === 'pending_payment',
    download: buyer && ['paid', 'delivered', 'disputed', 'completed'].includes(order.status),
    dispute: buyer && ['paid', 'delivered'].includes(order.status) && !order.dispute && Boolean(order.disputeUntil && new Date(order.disputeUntil).getTime() > now),
    reply: seller && order.status === 'disputed' && order.dispute?.status === 'open' && !order.dispute.sellerResponse,
    resolve: manager && order.status === 'disputed' && order.dispute?.status === 'open',
    refund: manager && order.status === 'refund_pending',
    payout: manager && order.status === 'completed' && order.payoutStatus === 'ready' && order.payment?.status === 'succeeded',
  };
}
export function checkoutKey(storage: Pick<Storage, 'getItem' | 'setItem'>, buyer: string, ticket: string, generate: () => string) {
  const name = `ticketverse:checkout:${buyer}:${ticket}`;
  const existing = storage.getItem(name);
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) return existing;
  const key = generate(); storage.setItem(name, key); return key;
}
export function clearCheckout(storage: Pick<Storage, 'removeItem'>, buyer: string, ticket: string) {
  storage.removeItem(`ticketverse:checkout:${buyer}:${ticket}`);
}
export async function validatePdf(file: File, maxBytes: number) {
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Chỉ nhận một file PDF.');
  if (!file.size || file.size > maxBytes) throw new Error(`PDF phải có dung lượng từ 1 byte đến ${maxBytes / 1024 / 1024} MB.`);
  if (await file.slice(0, 5).text() !== '%PDF-') throw new Error('Nội dung file không có chữ ký PDF hợp lệ.');
}
