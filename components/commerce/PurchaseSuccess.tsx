import Link from 'next/link';
import { ArrowRight, Check, Ticket } from 'lucide-react';
import type { Order } from '@/lib/commerce/types';
import { money } from '@/lib/commerce/rules';

export function PurchaseSuccess({ order }: { order: Order }) {
  return <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-slate-950/80 to-emerald-500/10 px-5 py-10 sm:px-12 sm:py-14">
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-emerald-300"><Check size={32} aria-hidden="true" /></div>
      <p className="mb-3 text-sm font-medium text-emerald-300" role="status">Thanh toán thành công</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cảm ơn bạn đã mua hàng!</h1>
      <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">Vé của bạn đã sẵn sàng. Xem vé trực tuyến hoặc tải về trong chi tiết đơn hàng để chuẩn bị cho sự kiện.</p>
      <div className="my-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left sm:p-6">
        <div className="flex items-start gap-4"><Ticket className="mt-1 shrink-0 text-violet-300" aria-hidden="true" /><div className="min-w-0"><h2 className="break-words text-xl font-semibold">{order.ticket.eventName}</h2><p className="mt-2 text-sm text-slate-300">{order.ticket.ticketTier}{order.ticket.seatInfo && ` · ${order.ticket.seatInfo}`}</p></div></div>
        <dl className="mt-5 space-y-3 border-t border-dashed border-white/15 pt-5 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Đã thanh toán</dt><dd className="text-lg font-semibold">{money(order.amount)}</dd></div><div><dt className="text-slate-400">Mã đơn hàng</dt><dd className="mt-1 break-all">{order.order_id}</dd></div></dl>
      </div>
      <div className="flex flex-col justify-center gap-3 sm:flex-row"><Link className="tv-button tv-primary inline-flex items-center justify-center gap-2" href={`/don-hang/${encodeURIComponent(order.order_id)}`}>Xem vé của tôi <ArrowRight size={18} aria-hidden="true" /></Link><Link className="tv-button" href="/tickets">Khám phá thêm vé</Link></div>
    </div>
  </section>;
}
