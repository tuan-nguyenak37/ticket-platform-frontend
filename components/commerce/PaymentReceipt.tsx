'use client';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { getCommerce, money, vietnamDate } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { useAuthStore } from '@/lib/auth/auth.store';
import { paymentLabels, type Receipt } from './checkout.types';

export function PaymentReceipt({ path }: { path: string }) {
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, 'receipt', path], queryFn: () => getCommerce<Receipt>(`${path}/receipt`), retry: false });
  if (query.isPending) return <p role="status">Đang tải biên nhận…</p>;
  if (!query.data) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const receipt = query.data;
  return <section className="checkout-receipt space-y-5">
    <div className="checkout-print space-y-5"><div><p className="checkout-eyebrow">TICKETVERSE</p><h3 className="text-xl font-semibold">Biên nhận thanh toán</h3><p className="mt-2 break-all text-xs tv-muted">{receipt.receiptNumber}</p></div>
      <dl className="checkout-receipt-details"><dt>Người nhận vé</dt><dd>{receipt.recipient.name}</dd><dt>Email liên hệ</dt><dd>{receipt.recipient.email}</dd><dt>Số điện thoại</dt><dd>{receipt.recipient.phone}</dd><dt>Mã đơn</dt><dd>{receipt.orderId}</dd><dt>Mã giao dịch</dt><dd>{receipt.paymentId}</dd><dt>Thời gian</dt><dd>{vietnamDate(receipt.issuedAt)}</dd><dt>Phương thức</dt><dd>{paymentLabels[receipt.method]} · {receipt.instrument.label} · •••• {receipt.instrument.last4}</dd></dl>
      <div className="checkout-receipt-item"><strong>{receipt.item.name}</strong><span>{receipt.item.quantity} × {money(receipt.item.unitPrice)}</span></div>
      <div className="checkout-total"><span>Đã thanh toán</span><strong>{money(receipt.amount)}</strong></div>
    </div>
    <button type="button" className="tv-button w-full checkout-no-print" onClick={() => window.print()}><Printer size={17} aria-hidden="true" />In / lưu biên nhận PDF</button>
  </section>;
}
