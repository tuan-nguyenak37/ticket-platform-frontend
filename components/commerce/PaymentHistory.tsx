'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentHistory, paymentReceipt } from '@/lib/commerce/payment';
import { dateTime, money, orderLabels } from '@/lib/commerce/rules';
import { Failure } from './shared';

export const paymentLabels = { pending: 'Chờ xác nhận', succeeded: 'Thành công', failed: 'Thẻ bị từ chối', cancelled: 'Đã hủy lần thanh toán', refund_pending: 'Chờ hoàn tiền', refunded: 'Đã hoàn tiền' };
const eventLabels: Record<string, string> = { 'order.created': 'Đã tạo đơn', 'order.cancelled': 'Đã hủy đơn', 'payment.created': 'Bắt đầu thanh toán', 'payment.succeeded': 'Thanh toán thành công', 'payment.failed': 'Thanh toán bị từ chối', 'payment.cancelled': 'Đã hủy lần thanh toán', 'payment.refund_pending': 'Đang chờ hoàn tiền', 'dispute.opened': 'Đã mở tranh chấp' };
export function PaymentHistory({ id }: { id: string }) {
  const [open, setOpen] = useState(false); const [receiptOpen, setReceiptOpen] = useState(false);
  const query = useQuery({ queryKey: ['commerce', 'payment-history', id], queryFn: ({ signal }) => paymentHistory(id, signal), enabled: open, retry: false });
  const receipt = useQuery({ queryKey: ['commerce', 'receipt', id], queryFn: ({ signal }) => paymentReceipt(id, signal), enabled: receiptOpen, retry: false });
  const captured = query.data?.payments.some(payment => payment.receivedResult === 'success');
  return <section className="tv-panel space-y-4"><button className="font-semibold" aria-expanded={open} onClick={() => setOpen(!open)}>Lịch sử thanh toán {open ? '−' : '+'}</button>{open && <>
    {query.isPending && <p role="status">Đang tải lịch sử…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}
    {query.data && <><ul className="space-y-3">{query.data.payments.map(payment => <li key={payment.payment_id} className="rounded-xl border border-current/15 p-4 text-sm"><p className="font-semibold">Lần {payment.attemptNumber} · {paymentLabels[payment.status]}</p><p className="mt-2">{money(payment.amount)} · {dateTime(payment.createdAt)}</p>{payment.card && <p className="mt-2">{payment.card.brand.toUpperCase()} •••• {payment.card.last4} · {payment.card.holderName}</p>}</li>)}</ul>{!query.data.payments.length && <p>Chưa có lần thanh toán.</p>}{query.data.transfers.filter(transfer => transfer.kind === 'refund').map(transfer => <p key={transfer.id} className="rounded-xl bg-emerald-500/10 p-4">Đã hoàn {money(transfer.amount)} · {transfer.legacy ? 'Ghi nhận dữ liệu trước đây: ' : ''}{dateTime(transfer.recordedAt)}</p>)}<details><summary className="cursor-pointer text-sm font-semibold">Hoạt động đơn hàng</summary><ul className="mt-3 space-y-2 text-sm">{query.data.events.map(event => <li key={event.id} className="border-l border-violet-400/40 pl-3"><p>{eventLabels[event.kind] ?? 'Cập nhật giao dịch'}</p><p className="text-xs opacity-60">{dateTime(event.createdAt)}</p></li>)}</ul></details>{captured && <button className="tv-button" onClick={() => setReceiptOpen(!receiptOpen)}>{receiptOpen ? 'Đóng biên nhận' : 'Xem biên nhận'}</button>}</>}
    {receiptOpen && <div className="space-y-3 rounded-xl border border-current/15 p-5">{receipt.isPending && <p role="status">Đang tải biên nhận…</p>}{receipt.isError && <Failure error={receipt.error} retry={() => void receipt.refetch()} />}{receipt.data && <><h3 className="font-semibold">Biên nhận thanh toán thử nghiệm</h3><p className="break-all text-sm">{receipt.data.receiptId}</p><p>{receipt.data.order.ticket.eventName} · {receipt.data.order.ticket.ticketTier}</p><p className="text-xl font-bold">{money(receipt.data.order.amount)}</p><p>{orderLabels[receipt.data.order.status]}</p><p className="text-sm opacity-70">Không có tiền thật được chuyển. Đây không phải hóa đơn thuế.</p></>}</div>}
  </>}</section>;
}
