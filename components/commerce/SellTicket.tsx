'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPublicEvents } from '@/lib/events/events.api';
import { uploadTicket } from '@/lib/commerce/api';
import { validatePdf, dateTime } from '@/lib/commerce/rules';
import { Failure, Pagination } from './shared';

const configuredLimit = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_FILE_SIZE_MB ?? 10);
const maxMB = Number.isInteger(configuredLimit) && configuredLimit >= 1 && configuredLimit <= 50 ? configuredLimit : 10;
export function SellTicket() {
  const [phase, setPhase] = useState<'upcoming' | 'ongoing'>('upcoming');
  const [q, setQ] = useState(''); const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const [eventId, setEventId] = useState(''); const [eventName, setEventName] = useState('');
  const [error, setError] = useState<Error | null>(null); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const router = useRouter(); const client = useQueryClient();
  const events = useQuery({ queryKey: ['sell-events', search, phase, page], queryFn: ({ signal }) => getPublicEvents({ q: search || undefined, phase, page, limit: 20 }, signal) });
  const mutation = useMutation({ mutationFn: uploadTicket, retry: false });
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(null);
    const data = new FormData(e.currentTarget);
    try {
      const file = data.get('ticketFile');
      if (!eventId || !(file instanceof File)) throw new Error('Chọn sự kiện và một file PDF.');
      await validatePdf(file, maxMB * 1024 * 1024);
      data.set('eventId', eventId);
      for (const key of ['ticketTier', 'seatInfo', 'description']) {
        const value = String(data.get(key) ?? '').trim();
        if (key === 'ticketTier' && !value) throw new Error('Hạng vé không được chỉ có khoảng trắng.');
        if (value) data.set(key, value); else data.delete(key);
      }
      const result = await mutation.mutateAsync(data);
      await client.invalidateQueries({ queryKey: ['commerce', 'my-tickets'] });
      router.push(`/ve-cua-toi/${encodeURIComponent(result.ticket_id)}`);
    } catch (failure) { setError(failure instanceof Error ? failure : new Error('Không thể đăng vé.')); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-6"><p className="max-w-3xl opacity-75">Một tin đăng tương ứng một vé PDF. Sau khi gửi, vé chờ kiểm tra và duyệt trước khi xuất hiện trên sàn. OCR chỉ hỗ trợ đối chiếu thông tin.</p>
    <section className="tv-panel space-y-4"><h2 className="text-lg font-semibold">1. Chọn đúng sự kiện trên vé</h2><div className="flex flex-wrap gap-2">{(['upcoming', 'ongoing'] as const).map(value => <button key={value} type="button" aria-pressed={phase === value} className={`tv-button ${phase === value ? 'tv-primary' : ''}`} onClick={() => { setPhase(value); setPage(1); }}>{value === 'upcoming' ? 'Sắp diễn ra' : 'Đang diễn ra'}</button>)}</div><form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}><label className="flex-1">Tìm sự kiện<input className="tv-input" value={q} maxLength={100} onChange={e => setQ(e.target.value)} /></label><button className="tv-button">Tìm</button></form>
      {events.isPending ? <p role="status">Đang tải sự kiện…</p> : events.isError ? <Failure error={events.error} retry={() => void events.refetch()} /> : <><div className="grid gap-2 sm:grid-cols-2">{events.data.items.map(event => <button type="button" key={event.event_id} disabled={event.phase === 'ended' || event.status !== 'published' || busy} aria-pressed={eventId === event.event_id} className={`tv-button text-left ${eventId === event.event_id ? 'tv-primary' : ''}`} onClick={() => { setEventId(event.event_id); setEventName(event.name); }}>{event.name} · {dateTime(event.startTime)}</button>)}</div>{!events.data.items.length && <p>Không có sự kiện phù hợp.</p>}<Pagination page={page} total={events.data.total} busy={events.isFetching} onChange={setPage} /></>}
      {eventId && <p role="status">Đã chọn: {eventName}</p>}
    </section>
    <form className="tv-panel space-y-5" onSubmit={submit}><h2 className="text-lg font-semibold">2. Thông tin vé</h2><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><label>Hạng vé *<input name="ticketTier" required maxLength={100} className="tv-input" /></label><label>Ghế / vị trí<input name="seatInfo" maxLength={100} className="tv-input" /></label><label>Giá gốc (VNĐ) *<input name="originalPrice" required type="number" min={0} max={1000000000} step="0.01" className="tv-input" /></label><label>Giá bán lại (VNĐ) *<input name="price" required type="number" min={1} max={1000000000} step="0.01" className="tv-input" /></label><label className="sm:col-span-2">Mô tả<textarea name="description" rows={3} maxLength={2000} className="tv-input" /></label><label className="sm:col-span-2">Một file PDF, tối đa {maxMB} MB *<input name="ticketFile" required type="file" accept="application/pdf,.pdf" className="tv-input" /></label></fieldset>{error && <Failure error={error} />}<p className="text-sm opacity-70">Nếu gửi gặp lỗi mạng, hãy kiểm tra “Vé tôi đăng” trước khi gửi lại để tránh đăng trùng.</p><button disabled={busy || !eventId} className="tv-button tv-primary">{busy ? 'Đang gửi PDF…' : 'Đăng vé và chờ duyệt'}</button></form>
  </div>;
}
