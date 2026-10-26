'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { useAuthStore } from '@/lib/auth/auth.store';
import { Failure } from '@/components/ui/commerce';
import { organizerApi as api, vnWire, vnd } from '../_lib/organizer.api';
import { OrganizerShell } from './OrganizerShell';
import { ReportPanel } from './ReportPanel';
import { useOrganizer } from '../_hooks/useOrganizer';

export function EventOperations({ eventId, organizerId }: { eventId?: string; organizerId?: string }) {
  const revision = useAuthStore(state => state.revision);
  return <RequireAuth><Workspace key={`${revision}:${eventId}`} eventId={eventId} organizerId={organizerId} /></RequireAuth>;
}

function Workspace({ eventId, organizerId }: { eventId?: string; organizerId?: string }) {
  const userId = useAuthStore(state => state.user?.user_id);
  const revision = useAuthStore(state => state.revision);
  const root = ['organizer', userId, revision, 'operations', eventId];
  const data = useOrganizer(organizerId, organizerId ? eventId : undefined);
  const assigned = useQuery({ queryKey: ['organizer', userId, revision, 'assignments'], queryFn: ({ signal }) => api.assigned(signal), enabled: !organizerId });
  const assignment = assigned.data?.find(event => event.eventId === eventId);
  const owner = !!data.owner && data.event.data?.organizerId === organizerId;
  const allowed = owner || !!assignment;
  const active = allowed && (!owner || data.owner?.status === 'ACTIVE');
  const [tab, setTab] = useState('attendees');
  const [page, setPage] = useState(1);
  const [showingId, setShowingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const cache = useQueryClient();
  const attendees = useQuery({ queryKey: [...root, 'attendees', page, showingId], queryFn: ({ signal }) => api.attendees(eventId!, page, showingId, signal), enabled: !!eventId && allowed && tab === 'attendees' });
  const discounts = useQuery({ queryKey: [...root, 'discounts'], queryFn: ({ signal }) => api.discounts(eventId!, signal), enabled: owner && tab === 'discounts' });
  const operators = useQuery({ queryKey: [...root, 'operators'], queryFn: ({ signal }) => api.operators(eventId!, signal), enabled: owner && tab === 'operators' });
  async function perform(action: () => Promise<unknown>, success = 'Đã lưu thay đổi.') {
    if (lock.current || useAuthStore.getState().revision !== revision) return false;
    lock.current = true; setBusy(true); setError(null); setNotice('');
    try {
      await action(); if (useAuthStore.getState().revision !== revision) return false;
      await cache.invalidateQueries({ queryKey: root }); if (success) setNotice(success); return true;
    } catch (failure) { if (useAuthStore.getState().revision === revision) setError(failure); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  const title = owner ? data.event.data?.title : assignment?.title;
  const loading = organizerId ? data.mine.isPending || (!!data.owner && data.event.isPending) : assigned.isPending;
  return <OrganizerShell organizerId={owner ? organizerId : undefined} name={data.owner?.name ?? assignment?.organizerName}>
    {!eventId ? <><div className="org-page-heading"><div><p className="org-eyebrow">ĐIỀU HÀNH VIÊN</p><h1>Sự kiện được phân công</h1><p>Quyền chỉ áp dụng cho danh sách khách và check-in của từng sự kiện.</p></div></div>{assigned.isPending && <p role="status">Đang tải…</p>}{assigned.error && <Failure error={assigned.error} retry={() => void assigned.refetch()} />}{assigned.data?.length === 0 && <p className="tv-notice">Chưa có sự kiện được phân công. Chủ ban tổ chức cần thêm email tài khoản của bạn.</p>}<div className="grid gap-4 sm:grid-cols-2">{assigned.data?.map(event => <article className="tv-panel space-y-3" key={event.eventId}><h2 className="font-semibold">{event.title}</h2><p className="tv-muted">{event.organizerName}</p><Link className="tv-button tv-primary" href={`/organizer/operations/${event.eventId}`}>Danh sách khách & check-in</Link></article>)}</div></> : loading ? <p role="status">Đang kiểm tra quyền truy cập…</p> : !allowed ? <div role="alert" className="tv-panel"><p>Không có quyền điều hành sự kiện này hoặc không thể tải dữ liệu.</p>{(assigned.error || data.mine.error || data.event.error) && <Failure error={assigned.error || data.mine.error || data.event.error} />}<Link className="tv-button" href="/organizer/operations">Về danh sách phân công</Link></div> : <>
      {owner && <Link className="tv-button" href={`/organizer/${organizerId}/events/${eventId}`}>Về thiết lập sự kiện</Link>}
      <div className="org-page-heading"><div><p className="org-eyebrow">VẬN HÀNH SỰ KIỆN</p><h1>{title}</h1><p>Danh sách khách, ưu đãi và đội ngũ điều hành tại một nơi.</p></div></div>
      <nav className="mb-6 flex flex-wrap gap-3" aria-label="Nghiệp vụ sự kiện">{[['attendees','Khách & check-in'], ...(owner ? [['discounts','Mã giảm giá'],['operators','Điều hành viên'],['report','Báo cáo bán vé']] : [])].map(([value,label]) => <button type="button" key={value} className={`tv-button ${tab === value ? 'tv-primary' : ''}`} aria-current={tab === value ? 'page' : undefined} onClick={() => { setTab(value); setError(null); setNotice(''); }}>{label}</button>)}</nav>
      {error != null && <div className="mb-5"><Failure error={error} /></div>}{notice && <p role="status" className="tv-notice mb-5">{notice}</p>}
      {tab === 'attendees' && <div className="space-y-5"><section className="tv-panel space-y-4"><h2 className="text-xl font-semibold">Check-in bằng mã QR</h2><p className="org-help">Dùng máy quét QR dạng bàn phím hoặc dán nội dung mã từ vé. Mở từ 24 giờ trước suất diễn đến khi kết thúc. Vé đang bán lại phải được hủy niêm yết trước.</p><form className="flex flex-wrap items-end gap-3" onSubmit={async event => {
        event.preventDefault(); const form = event.currentTarget; const payload = String(new FormData(form).get('payload') ?? '');
        if (await perform(async () => { const result = await api.checkIn(eventId, payload); setNotice(result.alreadyCheckedIn ? `Vé ${result.ticketId} đã check-in trước đó lúc ${new Date(result.checkedInAt).toLocaleString('vi-VN')}. Không nhận khách lần hai.` : `Check-in thành công: ${result.ticketId}`); }, '')) { form.reset(); form.querySelector('input')?.focus(); }
      }}><label className="min-w-0 flex-1">Nội dung mã QR<input className="tv-input" name="payload" autoComplete="off" required maxLength={512} placeholder="pv1.…" disabled={!active || busy} /></label><button className="tv-button tv-primary" disabled={!active || busy}>Xác nhận check-in</button></form></section>
      <section className="tv-panel space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Danh sách người giữ vé</h2><p className="org-help">{attendees.data ? `${attendees.data.checkedIn} / ${attendees.data.total} vé đã check-in` : 'Dữ liệu vé đã thanh toán; câu trả lời thuộc người mua ban đầu.'}</p></div><div className="flex gap-2"><button className="tv-button" onClick={() => void attendees.refetch()}>Làm mới</button><button className="tv-button" disabled={busy || !active} onClick={() => void perform(async () => { const blob = await api.exportAttendees(eventId, showingId); if (useAuthStore.getState().revision !== revision) return; const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `attendees-${eventId}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }, 'Đã xuất danh sách CSV. Lưu trữ tệp an toàn vì có thông tin cá nhân.')}>Xuất CSV</button></div></div>
      <label className="block">Lọc suất diễn<select className="tv-input" value={showingId} onChange={event => { setShowingId(event.target.value); setPage(1); }}><option value="">Tất cả suất diễn</option>{attendees.data?.showings.map(showing => <option key={showing.showingId} value={showing.showingId}>{showing.name}</option>)}</select></label>
      {attendees.isPending && <p role="status">Đang tải khách…</p>}{attendees.error && <Failure error={attendees.error} retry={() => void attendees.refetch()} />}
      {attendees.data && <><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><caption className="sr-only">Khách giữ vé đã thanh toán</caption><thead><tr className="border-b border-white/15">{['Khách','Vé / suất diễn','Check-in','Đăng ký của người mua'].map(label => <th scope="col" className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{attendees.data.items.map(item => <tr className="border-b border-white/10 align-top" key={item.ticketId}><td className="p-3"><p>{item.fullName}</p><p className="tv-muted break-all">{item.email}</p></td><td className="p-3"><p>{item.ticketTypeName} · {item.showingName}</p><p className="tv-muted break-all">{item.ticketId}</p><p>{item.status}</p></td><td className="p-3">{item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('vi-VN') : 'Chưa vào'}</td><td className="p-3">{item.answers.length ? <details><summary className="cursor-pointer">Xem câu trả lời</summary>{item.answers.map(answer => <p className="mt-2 break-words" key={answer.questionId}>{answer.label}: {answer.value || '—'}</p>)}</details> : 'Không có'}</td></tr>)}</tbody></table></div>{!attendees.data.items.length && <p className="org-help">Chưa có vé phù hợp.</p>}<div className="flex justify-between gap-3"><button className="tv-button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trang trước</button><span>Trang {page}</span><button className="tv-button" disabled={page * 50 >= attendees.data.total} onClick={() => setPage(value => value + 1)}>Trang sau</button></div></>}
      </section></div>}
      {tab === 'discounts' && owner && <section className="tv-panel space-y-5"><h2 className="text-xl font-semibold">Mã giảm giá</h2><p className="org-help">Áp dụng cho tổng tiền của một đơn thuộc sự kiện. Đơn giữ chỗ còn hạn cũng chiếm một lượt; hủy hoặc hết hạn sẽ trả lại lượt. Đơn đã tạo giữ nguyên giá kể cả khi tắt mã.</p><DiscountForm busy={busy || !active} save={body => perform(() => api.createDiscount(eventId, body))} />{discounts.isPending && <p role="status">Đang tải mã…</p>}{discounts.error && <Failure error={discounts.error} retry={() => void discounts.refetch()} />}{discounts.data?.length === 0 && <p className="org-help">Chưa có mã giảm giá.</p>}{discounts.data?.map(discount => <article className="flex flex-wrap justify-between gap-4 border-t border-white/10 pt-4" key={discount.discountId}><div><h3 className="font-semibold">{discount.code} · {discount.kind === 'PERCENT' ? discount.value + '%' : vnd(String(discount.value))}</h3><p className="org-help">{discount.usedOrReserved}/{discount.usageLimit} lượt đã dùng/giữ · {discount.active ? 'Đã bật' : 'Đã tắt'}</p><p className="org-help">{new Date(discount.startsAt).toLocaleString('vi-VN')} – {new Date(discount.endsAt).toLocaleString('vi-VN')}</p></div><button className="tv-button" disabled={busy || !active} onClick={() => void perform(() => api.discountStatus(eventId, discount.code, !discount.active))}>{discount.active ? 'Tắt mã' : 'Bật mã'}</button></article>)}</section>}
      {tab === 'operators' && owner && <section className="tv-panel space-y-5"><h2 className="text-xl font-semibold">Điều hành viên</h2><p className="org-help">Thêm email tài khoản đã đăng ký. Điều hành viên chỉ được xem/xuất danh sách khách và check-in cho sự kiện này; không được sửa sự kiện, ưu đãi, ngân hàng hoặc báo cáo tài chính.</p><form className="flex flex-wrap items-end gap-3" onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; const email = String(new FormData(form).get('email')); if (await perform(() => api.addOperator(eventId, email))) form.reset(); }}><label className="min-w-0 flex-1">Email điều hành viên<input className="tv-input" name="email" type="email" autoComplete="off" maxLength={255} required disabled={busy || !active} /></label><button className="tv-button tv-primary" disabled={busy || !active}>Thêm quyền</button></form><p className="org-help">Người được thêm đăng nhập rồi vào “Sự kiện được phân công”.</p>{operators.isPending && <p role="status">Đang tải nhân sự…</p>}{operators.error && <Failure error={operators.error} retry={() => void operators.refetch()} />}{operators.data?.length === 0 && <p className="org-help">Chưa phân công điều hành viên.</p>}{operators.data?.map(operator => <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4" key={operator.userId}><p>{operator.fullName}<span className="block tv-muted break-all">{operator.email}</span></p><button className="tv-button" disabled={busy || !active} onClick={() => { if (window.confirm(`Thu hồi quyền điều hành của ${operator.email}?`)) void perform(() => api.removeOperator(eventId, operator.userId)); }}>Thu hồi quyền</button></div>)}</section>}
      {tab === 'report' && owner && <ReportPanel organizerId={organizerId!} eventId={eventId} />}
    </>}
  </OrganizerShell>;
}

function DiscountForm({ busy, save }: { busy: boolean; save: (body: { code: string; kind: 'PERCENT' | 'FIXED'; value: number; usageLimit: number; startsAt: string; endsAt: string }) => Promise<boolean> }) {
  const [kind, setKind] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setError(null);
    try { if (await save({ code: String(values.get('code')).trim().toUpperCase(), kind, value: Number(values.get('value')), usageLimit: Number(values.get('usageLimit')), startsAt: vnWire(String(values.get('startsAt'))), endsAt: vnWire(String(values.get('endsAt'))) })) { form.reset(); setKind('PERCENT'); } }
    catch (failure) { setError(failure); }
  }
  return <form className="space-y-4 rounded-xl border border-white/15 p-4" onSubmit={event => void submit(event)}><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><label>Mã<input className="tv-input" name="code" required minLength={3} maxLength={32} pattern="(?:[A-Za-z0-9_]|-){3,32}" placeholder="CHAOBAN" /></label><label>Hình thức<select className="tv-input" value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="PERCENT">Giảm phần trăm</option><option value="FIXED">Giảm tiền VND</option></select></label><label>Giá trị giảm<input className="tv-input" name="value" required type="number" min={1} max={kind === 'PERCENT' ? 100 : 1_000_000_000} step={1} /></label><label>Số lượt sử dụng<input className="tv-input" name="usageLimit" required type="number" min={1} max={1_000_000} step={1} /></label><label>Bắt đầu (GMT+7)<input className="tv-input" name="startsAt" type="datetime-local" required /></label><label>Kết thúc (GMT+7)<input className="tv-input" name="endsAt" type="datetime-local" required /></label></fieldset>{error != null && <Failure error={error} />}<button className="tv-button tv-primary" disabled={busy}>Tạo mã giảm giá</button></form>;
}
