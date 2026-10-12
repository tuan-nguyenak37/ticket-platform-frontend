'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { getOrder } from '@/lib/commerce/api';
import { attemptKey, attemptStorageKey, paymentHistory, startPayment, confirmPayment, cancelPayment } from '@/lib/commerce/payment';
import type { DemoCard } from '@/lib/commerce/payment-types';
import { AppApiError } from '@/lib/http/http-errors';
import { orderLabels } from '@/lib/commerce/rules';
import { CardCheckout } from './CardCheckout';
import { PaymentHistory, paymentLabels } from './PaymentHistory';
import { Failure } from './shared';

export function CheckoutPage({ id }: { id: string }) {
  const actor = useAuthStore(state => state.user?.user_id); const client = useQueryClient();
  const query = useQuery({ queryKey: ['commerce', 'order', false, id], queryFn: ({ signal }) => getOrder(id, false, signal), retry: false, refetchInterval: q => !q.state.error && q.state.dataUpdateCount < 60 && q.state.data?.status === 'pending_payment' && Date.parse(q.state.data.expiresAt) > Date.now() ? 5000 : false, refetchIntervalInBackground: false });
  const lock = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [message, setMessage] = useState(''); const [now, setNow] = useState(0); const [retryAt, setRetryAt] = useState(0);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function operate(card?: DemoCard) {
    if (lock.current || !actor || Date.now() < retryAt) return;
    lock.current = true; setBusy(true); setError(null); setMessage('');
    try {
      const history = await paymentHistory(id);
      const order = history.order;
      let pending = history.payments.find(payment => payment.status === 'pending');
      if (order.status !== 'pending_payment' || Date.parse(order.expiresAt) <= Date.now()) { client.setQueryData(['commerce', 'order', false, id], order); setMessage(orderLabels[order.status]); return; }
      if (!card) {
        if (pending) {
          const result = await cancelPayment(id, pending.payment_id);
          client.setQueryData(['commerce', 'order', false, id], result);
          sessionStorage.removeItem(attemptStorageKey(actor, id));
          setMessage(paymentLabels[result.payment.status]);
        } else setMessage('Không có lần thanh toán đang chờ để hủy.');
        return;
      }
      if (history.payments.some(payment => payment.receivedResult === 'success')) { setMessage('Thanh toán đã được ghi nhận. Vui lòng xem trạng thái đơn hàng.'); return; }
      if (!pending) {
        const result = await startPayment(id, attemptKey(actor, id));
        if (result.payment.status !== 'pending') {
          // A previous start request may have succeeded before its response was lost.
          sessionStorage.removeItem(attemptStorageKey(actor, id));
          setMessage(`${paymentLabels[result.payment.status]}. Chọn Thanh toán để bắt đầu lần mới nếu đơn còn hạn.`);
          return;
        }
        pending = result.payment;
      }
      const result = await confirmPayment(id, pending.payment_id, card);
      client.setQueryData(['commerce', 'order', false, id], result);
      if (result.payment.status !== 'pending') sessionStorage.removeItem(attemptStorageKey(actor, id));
      setMessage(result.status === 'refund_pending' ? 'Thanh toán đã được ghi nhận nhưng vé không thể cấp. Đơn đang chờ hoàn tiền.' : paymentLabels[result.payment.status]);
    } catch (failure) {
      setError(failure);
      if (failure instanceof AppApiError && failure.statusCode === 429) setRetryAt(Date.now() + (failure.retryAfterSeconds ?? 60) * 1000);
    } finally {
      await Promise.allSettled([query.refetch(), client.invalidateQueries({ queryKey: ['commerce', 'payment-history', id] }), client.invalidateQueries({ queryKey: ['commerce', 'receipt', id] }), client.invalidateQueries({ queryKey: ['commerce', 'orders'] }), client.invalidateQueries({ queryKey: ['commerce', 'tickets'] })]);
      lock.current = false; setBusy(false);
    }
  }
  const order = query.data; const buyer = Boolean(actor && order?.buyerId === actor);
  const payable = order?.status === 'pending_payment' && now > 0 && Date.parse(order.expiresAt) > now;
  const disabled = busy || query.isFetching || query.isError || now < retryAt;
  return <div className="space-y-5"><Link className="text-sm text-violet-300" href={`/don-hang/${encodeURIComponent(id)}`}>← Chi tiết đơn hàng</Link>{query.isPending && <p role="status">Đang tải đơn hàng…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}{error != null && <Failure error={error} />}{message && <p role="status" className="tv-panel">{message}</p>}{now < retryAt && <p role="status">Vui lòng thử lại sau {Math.ceil((retryAt - now) / 1000)} giây.</p>}
    {order && now > 0 && !query.isError && (!buyer ? <p role="alert" className="tv-panel">Chỉ người mua của đơn hàng được thanh toán.</p> : <>{payable && process.env.NEXT_PUBLIC_PAYMENT_MOCK_ENABLED === 'true' ? <><p className="text-sm opacity-70">Thời gian thanh toán còn khoảng {Math.max(0, Math.ceil((Date.parse(order.expiresAt) - now) / 60000))} phút.</p><CardCheckout order={order} busy={disabled} onPay={card => operate(card)} />{order.payment?.status === 'pending' && <button className="tv-button" disabled={disabled} onClick={() => void operate()}>Hủy lần thanh toán này</button>}</> : <section className="tv-panel space-y-3"><h2 className="text-xl font-semibold">{order.status === 'pending_payment' ? payable ? 'Thanh toán chưa khả dụng' : 'Đã hết thời gian thanh toán' : orderLabels[order.status]}</h2>{order.status === 'refund_pending' && <p>Thanh toán đã ghi nhận nhưng vé không thể cấp. Bạn có thể theo dõi hoàn tiền trong đơn hàng.</p>}<Link className="tv-button tv-primary" href={`/don-hang/${encodeURIComponent(id)}`}>{['paid', 'delivered', 'completed'].includes(order.status) ? 'Xem và tải vé' : 'Xem đơn hàng'}</Link></section>}<PaymentHistory id={id} /></>)}
  </div>;
}
