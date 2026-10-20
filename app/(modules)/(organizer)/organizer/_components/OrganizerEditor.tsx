'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { organizerApi as api, vnInput, vnd, type Showing, type TicketType, type TicketInput } from '../_lib/organizer.api';
import { useOrganizer } from '../_hooks/useOrganizer';
import { EventForm, ShowingForm, TicketForm } from './OrganizerForms';
import { PayoutPanel } from './PayoutPanel';
import { ReportPanel } from './ReportPanel';
import { Dialog } from '@/components/ui/Dialog';
import { PosterPreview } from './PosterPreview';
import { ArrowLeft, ArrowRight, CalendarDays, Info, Plus, Ticket } from 'lucide-react';
import { OrganizerShell } from './OrganizerShell';
import { OrganizerStatus } from './OrganizerStatus';

const steps = ['Thông tin sự kiện', 'Thời gian & địa điểm', 'Loại vé & lịch bán', 'Thông tin nhận tiền', 'Kiểm tra & gửi duyệt'];
const guidance = [
  'Nhập nội dung, chọn danh mục và thêm ảnh đại diện. Lưu bản nháp để bắt đầu thiết lập lịch diễn.',
  'Mỗi suất diễn có thời gian và địa điểm riêng. Tất cả thời gian được nhập theo giờ Việt Nam (GMT+7).',
  'Tạo loại vé cho từng suất diễn, sau đó thiết lập giá, số lượng, thời gian bán và giới hạn mỗi đơn.',
  'Thông tin dùng để nhận tiền từ sự kiện. Bạn có thể bỏ qua và bổ sung sau; lưu tài khoản không phải là thực hiện chuyển tiền.',
  'Kiểm tra dữ liệu đã lưu và xử lý các mục còn thiếu. Gửi duyệt chưa đồng nghĩa với công bố sự kiện.',
];
export function OrganizerEditor({ organizerId, eventId }: { organizerId: string; eventId?: string }) {
  const revision = useAuthStore(state => state.revision);
  return <RequireAuth><Editor key={revision + ':' + organizerId + ':' + eventId} organizerId={organizerId} eventId={eventId} /></RequireAuth>;
}
function Editor({ organizerId, eventId }: { organizerId: string; eventId?: string }) {
  const router = useRouter();
  const { params } = useUrlFilters();
  const parsedStep = Number(params.get('step'));
  const step = Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= 5 ? parsedStep : 1;
  const data = useOrganizer(organizerId, eventId);
  const revision = useAuthStore(state => state.revision);
  const userId = useAuthStore(state => state.user?.user_id);
  const [dialog, setDialog] = useState<'showing' | 'ticket' | null>(null);
  const [editingShowing, setEditingShowing] = useState<Showing>();
  const [editingTicket, setEditingTicket] = useState<TicketType>();
  const [ticketShowing, setTicketShowing] = useState<Showing>();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const sending = useRef(false);
  const event = data.event.data?.organizerId === organizerId ? data.event.data : undefined;
  const showings = data.showings.data ?? [];
  const ticketQueries = useQueries({ queries: showings.map(showing => ({ queryKey: ['organizer', userId, revision, organizerId, 'tickets', showing.showingId], queryFn: ({ signal }: { signal: AbortSignal }) => api.tickets(showing.showingId, signal), enabled: !!event })) });
  const readiness = useQuery({ queryKey: ['organizer', userId, revision, eventId, 'readiness'], queryFn: ({ signal }) => api.readiness(eventId!, signal), enabled: !!event && step === 5 });
  const writable = data.owner?.status === 'ACTIVE' && (!event || event.status !== 'PENDING_REVIEW');
  const base = '/organizer/' + organizerId;
  const url = eventId ? base + '/events/' + eventId : base + '/events/new';
  function move(target: number) {
    if (document.querySelector('[data-organizer-dirty="true"]') && !window.confirm('Bạn có thay đổi chưa lưu. Rời bước này?')) return;
    router.push(url + '?step=' + target);
  }
  useEffect(() => {
    function guard(click: MouseEvent) {
      if ((click.target as Element).closest('a[href]') && document.querySelector('[data-organizer-dirty="true"]') && !window.confirm('Bạn có thay đổi chưa lưu. Rời trang này?')) { click.preventDefault(); click.stopPropagation(); }
    }
    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, []);
  async function mutate<T>(action: () => Promise<T>) { setNotice(''); try { const result = await data.mutate(action); setNotice('Đã lưu thành công.'); if (eventId) await readiness.refetch(); return result; } catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Không thể lưu.'); throw failure; } }
  async function submit() {
    if (!event || sending.current || !readiness.data?.ready) return;
    sending.current = true; setBusy(true); setNotice('');
    try { await mutate(() => api.submit(event.eventId)); setConfirm(false); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'Không thể gửi duyệt.'); await readiness.refetch(); }
    finally { setBusy(false); sending.current = false; }
  }
  if (data.mine.isPending) return <p role="status" className="p-8">Đang tải Ban tổ chức…</p>;
  if (!data.owner) return <p role="alert" className="p-8">Bạn không có quyền OWNER với Ban tổ chức này.</p>;
  if (eventId && data.event.isPending) return <p role="status" className="p-8">Đang tải sự kiện…</p>;
  if (eventId && !event) return <p role="alert" className="p-8">Không tìm thấy sự kiện của Ban tổ chức này.</p>;
  return <OrganizerShell organizerId={organizerId} name={data.owner.name} sidebar={<nav className="org-step-nav" aria-label="Các bước tạo sự kiện"><p>THIẾT LẬP SỰ KIỆN</p><ol>{steps.map((label, index) => <li key={label}><button type="button" className="org-step-button" disabled={!event && index > 0} aria-current={step === index + 1 ? 'step' : undefined} onClick={() => move(index + 1)}><span>{index + 1}</span><span>{label}</span></button></li>)}</ol></nav>}>
    <Link className="inline-flex items-center gap-2 text-sm tv-muted" href={base + '/events'}><ArrowLeft size={16} aria-hidden="true" />Sự kiện của tôi</Link>
    <div className="org-page-heading"><div><p className="org-eyebrow">Thiết lập sự kiện · Bước {step} / 5</p><h1>{event?.title ?? 'Tạo sự kiện mới'}</h1><p>{event ? 'Hoàn thiện từng bước để sẵn sàng gửi duyệt.' : 'Bắt đầu từ thông tin cơ bản. Bạn có thể quay lại chỉnh sửa bản nháp.'}</p></div>{event && <OrganizerStatus status={event.status} />}</div>
    {event?.rejectionReason && <p role="alert" className="tv-notice">Lý do từ chối: {event.rejectionReason}</p>}
    {!writable && <p className="tv-notice" role="status">{data.owner.status !== 'ACTIVE' ? 'Ban tổ chức đang bị đình chỉ. Bạn chỉ có thể xem dữ liệu.' : 'Sự kiện đang chờ duyệt. Thông tin và vé tạm khóa chỉnh sửa.'}</p>}
    <label className="org-mobile-step">Chuyển bước<select className="tv-input" value={step} onChange={change => move(Number(change.target.value))}>{steps.map((label, index) => <option key={label} value={index + 1} disabled={!event && index > 0}>{index + 1}. {label}</option>)}</select></label>
    <section className="org-step-guide"><Info size={20} aria-hidden="true" /><div><h2>{steps[step - 1]}</h2><p>{guidance[step - 1]}</p></div></section>
    {notice && <p role="status" className="tv-notice">{notice}</p>}
      {step === 1 && <section className="tv-panel space-y-4"><h2 className="text-xl font-semibold">Thông tin sự kiện</h2>{event && <><p>{event.description || 'Chưa có mô tả.'}</p><PosterPreview key={event.posterUrl} url={event.posterUrl} /></>}{data.categories.isPending && <p>Đang tải danh mục…</p>}{data.categories.error && <p role="alert">{data.categories.error.message}</p>}{writable && data.categories.data && <EventForm inline onBusyChange={setSaving} initial={event} categories={data.categories.data} close={() => setDialog(null)} save={async body => { if (event) return mutate(() => api.updateEvent(event.eventId, body)); const created = await mutate(() => api.createEvent(organizerId, body)); router.replace(base + '/events/' + created.eventId + '?step=1'); }} />}{event && <form className="space-y-3 border-t border-white/10 pt-5" onSubmit={async (formEvent: FormEvent<HTMLFormElement>) => { formEvent.preventDefault(); const form = formEvent.currentTarget; const file = new FormData(form).get('file'); if (!(file instanceof File) || !file.size) return; setBusy(true); try { await mutate(() => api.uploadPoster(event.eventId, file)); form.reset(); } catch {} finally { setBusy(false); } }}><label className="block">Tải ảnh poster JPEG / PNG / WebP<input className="tv-input" type="file" name="file" accept="image/jpeg,image/png,image/webp" required disabled={!writable || busy} /></label><button className="tv-button" disabled={!writable || busy}>Tải ảnh</button></form>}</section>}
      {step === 2 && <section className="space-y-4"><div className="org-section-heading"><h2 className="text-xl font-semibold">Suất diễn</h2><button className="tv-button tv-primary" disabled={!writable} onClick={() => { setEditingShowing(undefined); setDialog('showing'); }}><Plus size={16} aria-hidden="true" />Thêm suất diễn</button></div>{data.showings.isPending && <p>Đang tải…</p>}{data.showings.error && <p role="alert">{data.showings.error.message}</p>}{data.showings.isSuccess && !showings.length && <div className="org-empty"><CalendarDays size={32} aria-hidden="true" /><h3>Thêm lịch diễn đầu tiên</h3><p>Chọn thời gian và địa điểm. Sau khi lưu suất diễn, bạn có thể tạo loại vé tương ứng ở bước tiếp theo.</p><button className="tv-button tv-primary" disabled={!writable} onClick={() => { setEditingShowing(undefined); setDialog('showing'); }}>Thêm suất diễn</button></div>}{showings.map(showing => <article className="tv-panel flex flex-wrap items-center justify-between gap-4" key={showing.showingId}><div><h3 className="font-semibold">{showing.name}</h3><p className="tv-muted">{vnInput(showing.startTime).replace('T',' ')} · {showing.venueName}, {showing.city}</p></div><button className="tv-button" disabled={!writable} onClick={() => { setEditingShowing(showing); setDialog('showing'); }}>Chỉnh sửa</button></article>)}</section>}
      {step === 3 && <section className="space-y-5"><h2 className="text-xl font-semibold">Hạng vé</h2>{data.showings.isPending && <p>Đang tải suất diễn…</p>}{data.showings.error && <p role="alert">{data.showings.error.message} <button className="underline" onClick={() => void data.showings.refetch()}>Thử lại</button></p>}{data.showings.isSuccess && !showings.length && <div className="org-empty"><Ticket size={32} aria-hidden="true" /><h3>Cần có suất diễn trước khi tạo vé</h3><p>Mỗi loại vé thuộc một suất diễn. Hãy thêm thời gian và địa điểm ở bước trước.</p><button className="tv-button" onClick={() => move(2)}>Thêm suất diễn</button></div>}{showings.map((showing, index) => <div className="tv-panel space-y-4" key={showing.showingId}><div className="org-section-heading"><h3 className="text-lg font-semibold">{showing.name}</h3><button className="tv-button tv-primary" disabled={!writable} onClick={() => { setTicketShowing(showing); setEditingTicket(undefined); setDialog('ticket'); }}>Tạo hạng vé</button></div>{ticketQueries[index]?.isPending && <p>Đang tải hạng vé…</p>}{ticketQueries[index]?.error && <p role="alert">{ticketQueries[index].error.message}</p>}{ticketQueries[index]?.isSuccess && !ticketQueries[index].data?.length && <p className="org-help">Chưa có loại vé. Tạo vé thường, VIP hoặc các loại vé phù hợp với suất diễn này.</p>}{ticketQueries[index]?.data?.map(ticket => <div key={ticket.ticketTypeId} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><div><p className="font-medium">{ticket.name} · {vnd(ticket.price)}</p><p className="tv-muted">{ticket.status === 'DRAFT' ? 'Bản nháp' : ticket.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'} · {ticket.totalQuantity} vé · tối đa {ticket.maxPerOrder}/đơn</p></div><button className="tv-button" disabled={!writable} onClick={() => { setTicketShowing(showing); setEditingTicket(ticket); setDialog('ticket'); }}>Cấu hình</button></div>)}</div>)}</section>}
      {step === 4 && <PayoutPanel organizerId={organizerId} editable={!!writable} onSkip={() => move(5)} />}
      {step === 5 && <div className="space-y-5"><section className="tv-panel space-y-4"><h2 className="text-xl font-semibold">Xem lại trước khi gửi</h2><p>{event?.title} · {showings.length} suất diễn · {ticketQueries.reduce((count, query) => count + (query.data?.length ?? 0), 0)} hạng vé</p>{readiness.isPending && <p role="status">Đang kiểm tra điều kiện gửi duyệt…</p>}{readiness.error && <p role="alert">{readiness.error.message} <button className="underline" onClick={() => void readiness.refetch()}>Thử lại</button></p>}{readiness.data?.issues.map(issue => <p key={issue.code + issue.resourceId} className="tv-notice"><button className="underline" onClick={() => move(issue.step)}>{steps[issue.step - 1]}</button>: {issue.message}</p>)}{readiness.data?.ready && <p role="status" className="tv-notice">Dữ liệu đã sẵn sàng. Gửi duyệt chưa phải xuất bản.</p>}<button className="tv-button tv-primary" disabled={!writable || event?.status !== 'DRAFT' || !readiness.data?.ready || busy} onClick={() => setConfirm(true)}>Gửi duyệt</button></section>{event && <ReportPanel organizerId={organizerId} eventId={event.eventId} />}</div>}
    {event && <aside className="org-saved-summary"><span>Dữ liệu đã lưu: {data.showings.isSuccess ? `${showings.length} suất diễn` : 'Đang tải suất diễn'} · {data.showings.isSuccess && ticketQueries.every(query => query.isSuccess) ? `${ticketQueries.reduce((count, query) => count + (query.data?.length ?? 0), 0)} loại vé` : 'Chưa tải đủ loại vé'}</span><span>Giờ Việt Nam · GMT+7</span></aside>}
    <footer className="org-editor-footer"><button type="button" className="tv-button" disabled={step === 1 || saving || busy} onClick={() => move(step - 1)}><ArrowLeft size={16} aria-hidden="true" />Quay lại</button><span>{event ? 'Lưu các thay đổi trong từng mục trước khi tiếp tục.' : 'Lưu bản nháp ở bước này để tiếp tục.'}</span>{step === 1 && writable && data.categories.isSuccess && <button type="submit" form="organizer-event-form" className="tv-button tv-primary" disabled={saving || busy}>{saving ? 'Đang lưu…' : 'Lưu bản nháp'}</button>}{step < 5 ? <button type="button" className="tv-button tv-primary" disabled={!event || saving || busy} onClick={() => move(step + 1)}>Tiếp tục<ArrowRight size={16} aria-hidden="true" /></button> : <Link className="tv-button" href={base + '/events'}>Về danh sách</Link>}</footer>
      {dialog === 'showing' && event && <ShowingForm initial={editingShowing} event={event} close={() => setDialog(null)} save={body => mutate(() => editingShowing ? api.updateShowing(editingShowing.showingId, body) : api.createShowing(event.eventId, body))} />}
      {dialog === 'ticket' && ticketShowing && <TicketForm initial={editingTicket} showing={ticketShowing} close={() => setDialog(null)} save={body => mutate(() => editingTicket ? api.updateTicket(editingTicket.ticketTypeId, body) : api.createTicket(ticketShowing.showingId, body as TicketInput))} />}
      {confirm && <Dialog title="Xác nhận gửi duyệt" onClose={() => setConfirm(false)} busy={busy}><p>Trong khi chờ duyệt, thông tin sự kiện và vé không thể thay đổi.</p><div className="mt-5 flex gap-3"><button className="tv-button" onClick={() => setConfirm(false)}>Quay lại</button><button className="tv-button tv-primary" disabled={busy || !readiness.data?.ready} onClick={() => void submit()}>Xác nhận gửi</button></div></Dialog>}
    </OrganizerShell>;
}
