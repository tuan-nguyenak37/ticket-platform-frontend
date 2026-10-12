'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createOrder, listTickets } from '@/lib/commerce/api';
import { checkoutKey, clearCheckout, money, ticketLabels } from '@/lib/commerce/rules';
import type { Ticket, TicketFilters as Filters } from '@/lib/commerce/types';
import { useAuthStore } from '@/lib/store/auth.store';
import { AuthModal } from '@/components/auth';
import { TicketFilters } from './TicketFilters';
import { Failure, Pagination } from './shared';

export function TicketList({ mine = false, eventId }: { mine?: boolean; eventId?: string }) {
  const [filters, setFilters] = useState<Filters>({}); const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Ticket | null>(null); const [login, setLogin] = useState(false);
  const [storageError, setStorageError] = useState<Error | null>(null);
  const actor = useAuthStore(s => s.user?.user_id); const status = useAuthStore(s => s.status);
  const lock = useRef(false); const router = useRouter();
  const params = { ...filters, ...(eventId ? { eventId } : {}), page, limit: 20 };
  const query = useQuery({ queryKey: ['commerce', mine ? 'my-tickets' : 'tickets', mine ? actor : null, params], queryFn: ({ signal }) => listTickets(params, mine, signal), enabled: !mine || status === 'authenticated' });
  const purchase = useMutation({ mutationFn: ({ id, key }: { id: string; key: string }) => createOrder(id, key), retry: false });
  async function buy() {
    if (lock.current || !selected) return;
    if (!actor || status !== 'authenticated') { setLogin(true); return; }
    lock.current = true; setStorageError(null);
    try {
      // Persist before sending so a reload after an ambiguous network failure reuses the key.
      let key: string;
      try { key = checkoutKey(sessionStorage, actor, selected.ticket_id, () => crypto.randomUUID()); }
      catch { setStorageError(new Error('Trình duyệt không cho lưu mã giao dịch. Hãy cho phép lưu trữ phiên trước khi tạo đơn để có thể thử lại an toàn.')); return; }
      const order = await purchase.mutateAsync({ id: selected.ticket_id, key });
      clearCheckout(sessionStorage, actor, selected.ticket_id);
      router.push(`/dashboard/orders/${encodeURIComponent(order.order_id)}/checkout`);
    } catch { await query.refetch(); }
    finally { lock.current = false; }
  }
  return <div className="commerce space-y-5">
    <TicketFilters mine={mine} eventId={eventId} onApply={value => { setFilters(value); setPage(1); }} />
    {selected && <section aria-label="Xác nhận tạo đơn" className="tv-panel space-y-4"><h2 className="text-xl font-semibold">Mua {selected.ticketTier} · {selected.event.name}</h2><p>{money(selected.price)} · Một đơn mua một vé.</p>{purchase.error && <Failure error={purchase.error} />}{storageError && <Failure error={storageError} />}<div className="flex flex-wrap gap-3"><button className="tv-button tv-primary" disabled={purchase.isPending || status === 'restoring'} onClick={() => void buy()}>{purchase.isPending ? 'Đang tạo đơn…' : purchase.isError ? 'Thử lại cùng giao dịch' : 'Xác nhận tạo đơn'}</button><button className="tv-button" disabled={purchase.isPending} onClick={() => setSelected(null)}>Đóng</button><Link className="tv-button" href="/dashboard/orders">Kiểm tra đơn đã tạo</Link></div></section>}
    {query.isPending ? <p role="status">Đang tải vé…</p> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <>
      {!query.data.items.length && <div className="tv-panel text-center">Không có vé phù hợp. Vé chờ duyệt chưa được mở bán.</div>}
      <div className="grid gap-4 md:grid-cols-2">{query.data.items.map(ticket => <article key={ticket.ticket_id} className="tv-panel flex flex-col gap-3"><Link href={`/events/${encodeURIComponent(ticket.eventId)}`} className="text-lg font-semibold">{ticket.event.name}</Link><p>{ticket.ticketTier} · {ticket.seatInfo || 'Không khai báo ghế'}</p><p className="text-sm opacity-70">{ticket.event.venueName} · {ticketLabels[ticket.status]}</p><p className="text-2xl font-bold">{money(ticket.price)}</p><p className="text-sm opacity-70">Giá gốc: {money(ticket.originalPrice)}</p>{ticket.description && <p className="whitespace-pre-wrap break-words text-sm">{ticket.description}</p>}<div className="mt-auto pt-2">{mine ? <Link className="tv-button" href={`/dashboard/tickets/${encodeURIComponent(ticket.ticket_id)}`}>Chi tiết vé</Link> : <button className="tv-button tv-primary" disabled={purchase.isPending} onClick={() => { purchase.reset(); setStorageError(null); setSelected(ticket); }}>Chọn mua vé</button>}</div></article>)}</div>
      <Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} />
    </>}
    <AuthModal isOpen={login} onClose={() => setLogin(false)} initialMode="login" />
  </div>;
}
