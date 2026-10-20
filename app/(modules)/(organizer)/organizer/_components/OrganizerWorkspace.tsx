'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { useAuthStore } from '@/lib/auth/auth.store';
import { Dialog } from '@/components/ui/Dialog';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useOrganizer } from '../_hooks/useOrganizer';
import { organizerApi as api, vnInput, vnd, type Showing, type TicketType, type TicketInput } from '../_lib/organizer.api';
import { ReviewReadiness } from './ReviewReadiness';
import { OrganizerForm, EventForm, ShowingForm, TicketForm } from './OrganizerForms';
import { PayoutPanel } from './PayoutPanel';
import { ReportPanel } from './ReportPanel';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { OrganizerShell } from './OrganizerShell';
import { OrganizerEventList } from './OrganizerEventList';
import { OrganizerStatus } from './OrganizerStatus';

const Badge = OrganizerStatus;
function State({ loading, error, retry }: { loading?: boolean; error?: Error | null; retry: () => unknown }) {
  if (error) return <section className="tv-panel space-y-3" role="alert"><p>{error.message}</p><button className="tv-button" onClick={retry}>Thử lại</button></section>;
  return loading ? <p role="status" className="tv-panel">Đang tải dữ liệu…</p> : null;
}
type Props = { organizerId?: string; eventId?: string; showingId?: string; settings?: boolean };
export function OrganizerWorkspace(props: Props) {
  const revision = useAuthStore(state => state.revision);
  return <RequireAuth><Workspace key={`${revision}:${props.organizerId ?? ""}:${props.eventId ?? ""}:${props.showingId ?? ""}:${props.settings ?? false}`} {...props} /></RequireAuth>;
}
function Workspace({ organizerId, eventId, showingId, settings }: Props) {
  const [page, setPage] = useState(1);
  const data = useOrganizer(organizerId, eventId, showingId, page);
  const router = useRouter();
  const pathname = usePathname();
  const { params } = useUrlFilters();
  const createdKind = params.get('created');
  const tab = params.get('tab');
  const confirming = useRef(false);
  const [dialog, setDialog] = useState<'organizer' | 'event' | 'showing' | 'ticket' | null>(null);
  const [editingShowing, setEditingShowing] = useState<Showing>();
  const [editingTicket, setEditingTicket] = useState<TicketType>();
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => Promise<unknown> }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const base = `/organizer/${organizerId}`;
  const eventBase = `${base}/events/${eventId}`;
  const event = data.event.data;
  const writable = data.owner?.status === 'ACTIVE';
  const canEditEvent = writable && event?.status !== 'PENDING_REVIEW';
  useEffect(() => {
    if (data.event.isSuccess && (data.showings.isSuccess || data.tickets.isSuccess) && ['#event-info', '#showings', '#tickets', '#review'].includes(window.location.hash)) {
      const target = document.getElementById(window.location.hash.slice(1));
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
      target?.focus({ preventScroll: true });
    }
  }, [data.event.isSuccess, data.showings.isSuccess, data.tickets.isSuccess]);
  async function save<T>(action: () => Promise<T>) { const result = await data.mutate(action); setNotice('Thao tác thành công. Kiểm tra dữ liệu cập nhật bên dưới.'); return result; }
  function ask(title: string, message: string, action: () => Promise<unknown>) { setError(''); setConfirm({ title, message, action }); }
  async function confirmAction() { if (!confirm || confirming.current) return; confirming.current = true; setBusy(true); setError(''); try { await save(confirm.action); setConfirm(undefined); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể thực hiện.'); } finally { confirming.current = false; setBusy(false); } }
  useEffect(() => {
    const owners = data.mine.data?.filter(item => item.memberRole === 'OWNER');
    if (!organizerId && owners?.length === 1 && !params.has('choose')) router.replace('/organizer/' + owners[0].organizerId);
  }, [data.mine.data, organizerId, router, params]);
  const ownerReady = !organizerId || !!data.owner;
  const eventReady = !eventId || (!!event && event.organizerId === organizerId);
  return <OrganizerShell organizerId={organizerId} name={data.owner?.name}>
    <div className="space-y-6"><State loading={data.mine.isPending} error={data.mine.error} retry={data.mine.refetch} />{notice && <p role="status" className="tv-notice">{notice}</p>}{organizerId && data.mine.isSuccess && !data.owner && <p role="alert" className="tv-panel">Bạn không có quyền OWNER đối với Ban tổ chức này.</p>}
    {ownerReady && data.mine.isSuccess && <>
      {!organizerId && <><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Ban tổ chức của tôi</h1><button className="tv-button tv-primary" onClick={() => setDialog('organizer')}>Tạo Ban tổ chức</button></div>{!data.mine.data.length && <p className="tv-panel">Bạn chưa có Ban tổ chức. Hãy tạo hồ sơ để bắt đầu.</p>}<div className="grid gap-4 sm:grid-cols-2">{data.mine.data.map(item => <article className="tv-panel space-y-4" key={item.organizerId}><h2 className="text-lg font-semibold break-words">{item.name}</h2><Badge status={item.status} /><p className="tv-muted break-words">{item.contactEmail}</p>{item.memberRole === 'OWNER' ? <Link className="tv-button" href={`/organizer/${item.organizerId}/events`}>Quản lý sự kiện</Link> : <p>Không có quyền OWNER.</p>}</article>)}</div></>}
      {data.owner && <>{!writable && <p role="alert" className="tv-notice">Ban tổ chức đang bị đình chỉ. Các thao tác ghi bị khóa.</p>}
      {pathname === base ? <ReportPanel organizerId={organizerId!} /> : settings && tab === 'payout' ? <PayoutPanel organizerId={organizerId!} editable={!!writable} /> : settings ? <section className="tv-panel space-y-4"><h1 className="text-2xl font-semibold">{data.owner.name}</h1><Badge status={data.owner.status} /><p className="break-words">{data.owner.contactEmail}</p><p className="whitespace-pre-wrap break-words">{data.owner.description || 'Chưa có mô tả.'}</p><button className="tv-button tv-primary" disabled={!writable} onClick={() => setDialog('organizer')}>Chỉnh sửa hồ sơ</button></section> : <>
      {!eventId && <><div className="org-page-heading"><div><p className="org-eyebrow">Quản lý sự kiện</p><h1>Sự kiện của tôi</h1><p>Tạo, chỉnh sửa và theo dõi sự kiện của {data.owner.name}.</p></div><button className="tv-button tv-primary" disabled={!writable} onClick={() => router.push(`${base}/events/new`)}><Plus size={18} aria-hidden="true" />Tạo sự kiện</button></div><State loading={data.events.isPending} error={data.events.error} retry={data.events.refetch} />{data.events.data && <OrganizerEventList key={page} data={data.events.data} base={base} page={page} onPageChange={setPage} writable={!!writable} />}</>}
      {eventId && <><Link className="text-violet-700" href={`${base}/events`}>← Danh sách sự kiện</Link><State loading={data.event.isPending} error={data.event.error} retry={data.event.refetch} />{data.event.isSuccess && !eventReady && <p role="alert">Sự kiện không thuộc Ban tổ chức này.</p>}{eventReady && event && <>{createdKind === 'event' && <p role="status" className="tv-notice">Đã lưu sự kiện. Tiếp theo, hãy thêm suất diễn.</p>}{createdKind === 'showing' && <p role="status" className="tv-notice">Đã lưu suất diễn. Tiếp theo, hãy tạo hạng vé.</p>}<nav className="tv-panel flex flex-wrap gap-2" aria-label="Các bước hoàn thiện sự kiện"><a className="tv-button" href={showingId ? `${eventBase}#event-info` : '#event-info'}>1. Thông tin</a><a className="tv-button" href={showingId ? `${eventBase}#showings` : '#showings'}>2. Suất diễn</a><a className="tv-button" href={showingId ? '#tickets' : data.showings.data?.[0] ? `${eventBase}/showings/${data.showings.data[0].showingId}#tickets` : '#showings'}>3. Hạng vé</a><a className="tv-button" href={showingId ? `${eventBase}#review` : '#review'}>4. Kiểm tra &amp; gửi duyệt</a></nav><section id="event-info" tabIndex={-1} className="tv-panel scroll-mt-24 space-y-4"><h1 className="text-2xl font-semibold break-words">{event.title}</h1><Badge status={event.status} />{event.rejectionReason && <p className="tv-notice">Lý do từ chối: {event.rejectionReason}</p>}<p className="whitespace-pre-wrap break-words">{event.description || 'Chưa có mô tả.'}</p>{event.posterUrl && <a className="text-violet-700" href={/^https?:\/\//i.test(event.posterUrl) ? event.posterUrl : undefined} target="_blank" rel="noreferrer">Xem poster</a>}<div className="flex flex-wrap gap-3"><button className="tv-button" disabled={!canEditEvent || !data.categories.isSuccess} onClick={() => setDialog('event')}>Sửa nội dung</button>{event.status === 'PENDING_REVIEW' && <p className="tv-muted">Nội dung bị khóa trong lúc chờ kiểm duyệt.</p>}</div>{event.status === 'REJECTED' && <p className="tv-muted">Chỉnh sửa nội dung hoặc suất diễn thực sự để trở về bản nháp trước khi gửi lại.</p>}</section>
      <section id="showings" tabIndex={-1} className="scroll-mt-24 space-y-5"><State loading={data.showings.isPending} error={data.showings.error} retry={data.showings.refetch} />
      {!showingId && <><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Suất diễn</h2><button className={`tv-button ${canEditEvent && (createdKind === 'event' || (data.showings.isSuccess && !data.showings.data.length)) ? 'tv-primary' : ''}`} disabled={!canEditEvent} onClick={() => { setEditingShowing(undefined); setDialog('showing'); }}>Thêm suất diễn</button></div>{data.showings.isSuccess && !data.showings.data.length && <p role="status" className="tv-panel">Sự kiện đã được lưu. Tiếp theo, hãy thêm suất diễn và địa điểm; bạn cũng có thể quay lại bổ sung sau.</p>}{event.status === 'PENDING_REVIEW' && <p className="tv-notice">Đang chờ duyệt; không thể sửa hoặc thêm suất diễn. Hạng vé được quản lý theo quy tắc riêng.</p>}{data.showings.data?.map(item => <article className="tv-panel space-y-3" key={item.showingId}><Link className="text-lg font-semibold text-violet-700" href={`${eventBase}/showings/${item.showingId}`}>{item.name}</Link><p>{vnInput(item.startTime).replace('T', ' ')} — {vnInput(item.endTime).replace('T', ' ')} (GMT+7)</p><p>{item.venueName} · {item.address} · {item.city}</p><div className="flex flex-wrap gap-3"><Link className="tv-button" href={`${eventBase}/showings/${item.showingId}#tickets`}>Quản lý hạng vé</Link><button className="tv-button" disabled={!canEditEvent} onClick={() => { setEditingShowing(item); setDialog('showing'); }}>Sửa</button><button className="tv-button" disabled={!canEditEvent} onClick={() => ask('Xóa suất diễn', 'Không thể xóa khi còn hạng vé. Xóa suất diễn của sự kiện đã công bố hoặc bị từ chối sẽ đưa sự kiện về bản nháp.', () => api.deleteShowing(item.showingId))}>Xóa</button></div></article>)}</>}
      {showingId && data.showings.isSuccess && !data.showing && <p role="alert">Suất diễn không thuộc sự kiện này.</p>}
      {data.showing && <><Link className="text-violet-700" href={`${eventBase}#showings`}>← Quay lại danh sách suất diễn</Link><div id="tickets" tabIndex={-1} className="flex scroll-mt-24 flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold">{data.showing.name} · Hạng vé</h2><p className="tv-muted">{vnInput(data.showing.startTime).replace('T', ' ')} (GMT+7)</p></div><button className={`tv-button ${createdKind === 'showing' || !data.tickets.data?.length ? 'tv-primary' : ''}`} disabled={!writable} onClick={() => { setEditingTicket(undefined); setDialog('ticket'); }}>Tạo hạng vé</button></div><State loading={data.tickets.isPending} error={data.tickets.error} retry={data.tickets.refetch} />{data.tickets.isSuccess && !data.tickets.data.length && <p role="status" className="tv-panel">Suất diễn đã được lưu. Tiếp theo, hãy tạo hạng vé nháp để cấu hình giá và lịch bán.</p>}{data.tickets.isSuccess && data.tickets.data.length > 0 && <div className="tv-notice space-y-3"><p>Hạng vé đã được lưu. Bạn có thể cấu hình lịch bán và chính sách Pass cho từng hạng vé hoặc thêm hạng vé khác.</p><button type="button" className="tv-button" disabled={!writable} onClick={() => { setEditingTicket(undefined); setDialog('ticket'); }}>Thêm hạng vé khác</button></div>}{data.tickets.data?.map(ticket => <article key={ticket.ticketTypeId} className="tv-panel space-y-3"><div className="flex flex-wrap justify-between gap-3"><h3 className="text-lg font-semibold">{ticket.name} · {vnd(ticket.price)}</h3><Badge status={ticket.status} /></div><p>Tổng {ticket.totalQuantity} · Giữ chỗ {ticket.reservedQuantity} · Đã bán {ticket.soldQuantity} · Còn {ticket.availableQuantity}</p><p className="tv-muted">Lịch bán: {vnInput(ticket.saleStartAt).replace('T', ' ') || 'Chưa đặt'} → {vnInput(ticket.saleEndAt).replace('T', ' ') || 'Chưa đặt'} (GMT+7)</p><p>Tối đa {ticket.maxPerOrder} vé/đơn · {ticket.resaleAllowed ? 'Cho phép bán lại' : 'Không cho bán lại'}</p><div className="flex gap-3"><button className="tv-button" disabled={!writable} onClick={() => { setEditingTicket(ticket); setDialog('ticket'); }}>{!ticket.saleStartAt || !ticket.saleEndAt ? 'Cấu hình lịch bán & chính sách Pass' : 'Cấu hình'}</button><button className="tv-button" disabled={!writable || ticket.reservedQuantity + ticket.soldQuantity > 0} onClick={() => ask('Xóa hạng vé', `Xóa hạng vé ${ticket.name}? Chỉ thực hiện khi chưa có giao dịch.`, () => api.deleteTicket(ticket.ticketTypeId))}>Xóa</button></div></article>)}</>}
      </section>
      {!showingId && <ReviewReadiness event={event} showings={data.showings.data} showingsPending={data.showings.isPending} showingsError={data.showings.error} retryShowings={data.showings.refetch} root={data.root} writable={!!writable} submit={() => save(() => api.submit(event.eventId))} />}
      </>}</>}
      </>}</>}
    </>}
    </div>
    {dialog === 'organizer' && <OrganizerForm initial={data.owner} close={() => setDialog(null)} save={body => save(async () => { const result = organizerId ? await api.update(organizerId, body) : await api.create(body); return result; })} />}
    {dialog === 'event' && data.categories.data && <EventForm initial={event} categories={data.categories.data} close={() => setDialog(null)} save={async body => { if (event) return save(() => api.updateEvent(event.eventId, body)); const created = await save(() => api.createEvent(organizerId!, body)); router.push(`${base}/events/${created.eventId}?created=event#showings`); }} />}
    {dialog === 'showing' && event && <ShowingForm initial={editingShowing} event={event} close={() => setDialog(null)} save={async body => { if (editingShowing) return save(() => api.updateShowing(editingShowing.showingId, body)); const created = await save(() => api.createShowing(event.eventId, body)); router.push(`${eventBase}/showings/${created.showingId}?created=showing#tickets`); }} />}
    {dialog === 'ticket' && data.showing && <TicketForm initial={editingTicket} showing={data.showing} close={() => setDialog(null)} save={async body => { const saved = await save(() => editingTicket ? api.updateTicket(editingTicket.ticketTypeId, body) : api.createTicket(showingId!, body as TicketInput)); if (!editingTicket) { setNotice('Đã lưu hạng vé nháp. Hãy cấu hình lịch bán & chính sách Pass, hoặc thêm hạng vé khác.'); document.getElementById('tickets')?.scrollIntoView({ block: 'start' }); } return saved; }} />}
    {confirm && <Dialog title={confirm.title} onClose={() => setConfirm(undefined)} busy={busy}><p>{confirm.message}</p>{error && <p role="alert" className="tv-notice">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button className="tv-button" disabled={busy} onClick={() => setConfirm(undefined)}>Hủy</button><button className="tv-button tv-primary" disabled={busy} onClick={confirmAction}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</button></div></Dialog>}
  </OrganizerShell>;
}

