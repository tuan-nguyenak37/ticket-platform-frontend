'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actOnOrder, downloadOrder, getOrder, type OrderAction } from '@/lib/commerce/api';
import { dateTime, money, orderLabels, orderPermissions, payoutLabels } from '@/lib/commerce/rules';
import { useAuthStore } from '@/lib/store/auth.store';
import { Failure } from './shared';
import { DisputeAttachments } from './DisputeAttachments';
import { TransferForm } from './TransferForm';
import { PaymentHistory } from './PaymentHistory';

const demoEnabled = process.env.NEXT_PUBLIC_PAYMENT_MOCK_ENABLED === 'true';
const paymentLabels = { pending: 'Chờ kết quả', succeeded: 'Thành công', failed: 'Thất bại', cancelled: 'Đã hủy', refund_pending: 'Chờ hoàn tiền', refunded: 'Đã hoàn tiền' };
export function OrderDetail({ id, manage = false }: { id: string; manage?: boolean }) {
  const actor = useAuthStore(s => s.user?.user_id); const client = useQueryClient();
  const [now, setNow] = useState(0); const [error, setError] = useState<unknown>(null); const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const urls = useRef(new Set<string>()); const timers = useRef(new Set<ReturnType<typeof setTimeout>>()); const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const currentUrls = urls.current; const currentTimers = timers.current;
    return () => { clearInterval(timer); abort.current?.abort(); currentTimers.forEach(clearTimeout); currentUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  const query = useQuery({ queryKey: ['commerce', 'order', manage, id], queryFn: ({ signal }) => getOrder(id, manage, signal), refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false });
  const mutation = useMutation({ mutationFn: (action: OrderAction) => actOnOrder(id, action, manage), retry: false });
  async function reconcile() {
    await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ['commerce', 'orders'] }), client.invalidateQueries({ queryKey: ['commerce', 'tickets'] }), client.invalidateQueries({ queryKey: ['commerce', 'my-tickets'] })]);
  }
  async function act(action: OrderAction) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(null); setMessage('');
    try {
      const order = await mutation.mutateAsync(action);
      client.setQueryData(['commerce', 'order', manage, id], order);
      setMessage(`Trạng thái đơn hàng: ${orderLabels[order.status]}.`);
    } catch (failure) { setError(failure); }
    finally { await reconcile(); lock.current = false; setBusy(false); }
  }
  async function download() {
    if (lock.current) return; lock.current = true; setBusy(true); setError(null); abort.current = new AbortController();
    try {
      const blob = await downloadOrder(id, abort.current.signal);
      if (abort.current.signal.aborted) return;
      const url = URL.createObjectURL(blob); urls.current.add(url);
      const link = document.createElement('a'); link.href = url;
      const mime = blob.type.split(';')[0];
      const extension = ({ 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[mime] ?? 'bin';
      link.download = `ticket-${id}.${extension}`; link.click();
      const timer = setTimeout(() => { URL.revokeObjectURL(url); urls.current.delete(url); timers.current.delete(timer); }, 30000); timers.current.add(timer);
      setMessage('Đã gửi file vé đến trình duyệt. Bạn có thể kiểm tra trong mục tải xuống.');
    } catch (failure) { if (!abort.current?.signal.aborted) setError(failure); }
    finally { await reconcile(); lock.current = false; setBusy(false); }
  }
  function formAction(e: FormEvent<HTMLFormElement>, kind: 'dispute' | 'reply' | 'resolve') {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const required = kind === 'dispute' ? ['reason', 'evidence'] : kind === 'reply' ? ['response'] : ['note'];
    if (required.some(name => !value(name))) { setError(new Error('Nội dung không được chỉ có khoảng trắng.')); return; }
    if (kind === 'dispute') void act({ path: 'dispute', body: { reason: value('reason'), evidence: value('evidence') } });
    if (kind === 'reply') void act({ path: 'dispute/reply', body: { response: value('response') } });
    if (kind === 'resolve') void act({ path: 'dispute/resolve', body: { decision: value('decision') as 'accept' | 'reject', note: value('note') } });
  }
  const order = query.data; const permissions = order ? orderPermissions(order, actor, manage, now) : null;
  const disabled = busy || query.isFetching || query.isError || !now;
  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><button className="tv-button" disabled={busy || query.isFetching} onClick={() => void query.refetch()}>Làm mới</button><Link className="tv-button" href={manage ? '/moderator/orders' : '/don-hang'}>Danh sách đơn</Link></div>{message && <p role="status" className="tv-panel">{message}</p>}{error != null && <Failure error={error} />}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}{query.isPending && <p role="status">Đang tải đơn hàng…</p>}
    {order && permissions && <>
      <section className="tv-panel space-y-4"><p className="break-all text-sm opacity-70">{order.order_id}</p><h2 className="text-xl font-bold">{order.ticket.eventName}</h2><p>{order.ticket.ticketTier} · {order.ticket.seatInfo || 'Không khai báo ghế'}</p><p className="text-3xl font-bold">{money(order.amount)}</p><p className="text-lg font-semibold">{orderLabels[order.status]}</p><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt>Thanh toán</dt><dd>{order.payment ? paymentLabels[order.payment.status] : 'Chưa khởi tạo'}</dd></div><div><dt>Chi trả người bán</dt><dd>{payoutLabels[order.payoutStatus]}</dd></div><div><dt>Hạn tranh chấp</dt><dd>{dateTime(order.disputeUntil)}</dd></div></dl>{order.reason && <p className="break-words text-sm">Lý do: {order.reason}</p>}

        {order.status === 'refund_pending' && <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">Chờ hoàn tiền (refund_pending). Thanh toán đã được ghi nhận nhưng vé không thể cấp hoặc đơn được hoàn theo xử lý tranh chấp / sự kiện. Nếu người khác đã mua vé trước, bạn không được tải vé này. Chưa có xác nhận hoàn tiền.</p>}
        {manage && (actor === order.buyerId || actor === order.sellerId) && <p role="alert">Bạn là một bên giao dịch, không được giải quyết tranh chấp, hoàn tiền hoặc chi trả đơn này.</p>}
        <div className="flex flex-wrap gap-3">{permissions.download && <button className="tv-button tv-primary" disabled={disabled} onClick={() => void download()}>Tải vé qua kết nối xác thực</button>}{permissions.cancel && <button className="tv-button" disabled={disabled} onClick={() => void act({ path: 'cancel' })}>Hủy đơn chờ thanh toán</button>}</div>
      </section>
      {permissions.pay && <Link className="tv-button tv-primary" href={`/thanh-toan/${encodeURIComponent(id)}`}>Tiếp tục thanh toán</Link>}
      <PaymentHistory id={id} manage={manage} />
      {(manage || actor === order.sellerId) && <section className="tv-panel space-y-3"><h2 className="font-bold">Doanh thu bán vé</h2><dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt>Giá bán</dt><dd>{money(order.amount)}</dd></div><div><dt>Phí nền tảng ({order.feeBasisPoints / 100}%)</dt><dd>{money(order.platformFee)}</dd></div><div><dt>Người bán thực nhận</dt><dd className="font-bold">{money(order.sellerNetAmount)}</dd></div></dl>{!manage && <Link href="/tai-khoan" className="inline-block text-sm underline">Thiết lập tài khoản nhận tiền</Link>}</section>}
      {!manage && actor === order.buyerId && ['paid', 'delivered', 'completed'].includes(order.status) && <section role="status" className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6"><h2 className="text-xl font-semibold text-emerald-300">Thanh toán đã được xác nhận</h2><p className="mt-2 text-sm">Vé của bạn đã sẵn sàng. Bạn có thể tải vé trong đơn hàng này.</p></section>}
      {demoEnabled && permissions.refund && <TransferForm key={`${id}:refund`} id={id} kind="refund" amount={order.amount} disabled={disabled} />}
      {demoEnabled && permissions.payout && <TransferForm key={`${id}:payout`} id={id} kind="payout" amount={order.sellerNetAmount} disabled={disabled} />}
      {!demoEnabled && permissions.pay && <p className="tv-panel">Thanh toán hiện chưa khả dụng. Vui lòng quay lại sau.</p>}
      {['cancelled', 'expired'].includes(order.status) && !manage && actor === order.buyerId && <p className="tv-panel">Lần mua này đã kết thúc. <Link className="underline" href="/tickets">Chọn vé và tạo lần mua mới</Link> để dùng mã giao dịch mới.</p>}
      {order.dispute && <section className="tv-panel space-y-4"><h2 className="font-bold">Tranh chấp · {({ open: 'Đang mở', accepted: 'Được chấp nhận', rejected: 'Bị bác bỏ' })[order.dispute.status]}</h2><p className="whitespace-pre-wrap break-words">Lý do: {order.dispute.reason}</p><p className="whitespace-pre-wrap break-words">Bằng chứng: {order.dispute.evidence}</p><p className="whitespace-pre-wrap break-words">Phản hồi người bán: {order.dispute.sellerResponse || 'Chưa phản hồi'}</p>{order.dispute.resolution && <p className="whitespace-pre-wrap break-words">Quyết định: {order.dispute.resolution} · {dateTime(order.dispute.resolvedAt)}</p>}<DisputeAttachments key={id} orderId={id} attachments={order.dispute.attachments ?? []} /></section>}
      {permissions.dispute && <form className="tv-panel space-y-4" onSubmit={e => formAction(e, 'dispute')}><h2 className="font-bold">Gửi tranh chấp</h2><fieldset disabled={disabled} className="space-y-3"><label className="block">Lý do *<textarea name="reason" required maxLength={2000} rows={3} className="tv-input" /></label><label className="block">Bằng chứng dạng văn bản *<textarea name="evidence" required maxLength={5000} rows={5} className="tv-input" /></label><p className="text-sm opacity-70">Mỗi đơn một tranh chấp. Biểu mẫu này gửi bằng chứng văn bản; file đã gửi được hiển thị trong chi tiết tranh chấp.</p><button className="tv-button tv-primary">Gửi tranh chấp</button></fieldset></form>}
      {permissions.reply && <form className="tv-panel space-y-4" onSubmit={e => formAction(e, 'reply')}><h2 className="font-bold">Phản hồi của người bán</h2><fieldset disabled={disabled}><label>Giải trình (chỉ gửi một lần) *<textarea name="response" required maxLength={5000} rows={5} className="tv-input" /></label><button className="tv-button mt-4">Gửi phản hồi</button></fieldset></form>}
      {permissions.resolve && <form className="tv-panel space-y-4" onSubmit={e => formAction(e, 'resolve')}><h2 className="font-bold">Giải quyết tranh chấp</h2><fieldset disabled={disabled} className="space-y-3"><label className="block">Quyết định<select name="decision" className="tv-input"><option value="accept">Chấp nhận và chuyển chờ hoàn tiền</option><option value="reject">Bác bỏ tranh chấp</option></select></label><label className="block">Ghi chú quyết định *<textarea name="note" required maxLength={2000} rows={4} className="tv-input" /></label><p>Quyết định đã lưu không thể ghi đè.</p><button className="tv-button tv-primary">Lưu quyết định</button></fieldset></form>}
    </>}
  </div>;
}
