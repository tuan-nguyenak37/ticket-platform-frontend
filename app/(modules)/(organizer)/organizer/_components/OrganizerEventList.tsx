'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Search } from 'lucide-react';
import { type Event, type Page, vnInput } from '../_lib/organizer.api';
import { PosterPreview } from './PosterPreview';
import { OrganizerStatus } from './OrganizerStatus';

export function OrganizerEventList({ data, base, page, onPageChange, writable }: {
  data: Page<Event>; base: string; page: number; onPageChange: (page: number) => void; writable: boolean;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const items = data.items.filter(item => (!status || item.status === status) && normalize(item.title).includes(normalize(query.trim())));
  const filtered = !!query || !!status;
  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return <>
    <div className="org-toolbar">
      <label className="org-search-field"><Search size={18} aria-hidden="true" /><input type="search" maxLength={255} aria-label="Tìm tên sự kiện trong trang hiện tại" placeholder="Tìm trong trang hiện tại…" value={query} onChange={change => setQuery(change.target.value)} /></label>
      <label className="text-sm tv-muted">Trạng thái trong trang<select className="tv-input" value={status} onChange={change => setStatus(change.target.value)}><option value="">Tất cả trạng thái</option><option value="DRAFT">Bản nháp</option><option value="PENDING_REVIEW">Chờ duyệt</option><option value="PUBLISHED">Đã công bố</option><option value="REJECTED">Cần chỉnh sửa</option></select></label>
    </div>
    <p className="org-help" role="status">{filtered ? `${items.length} kết quả trong ${data.items.length} sự kiện ở trang ${page}. Bộ lọc chỉ áp dụng trang hiện tại.` : `${data.total} sự kiện · Mới tạo trước`}</p>
    <div className="org-event-list">
      {items.map(item => <article className="org-event-card" key={item.eventId}>
        <div className="org-event-poster"><PosterPreview key={item.posterUrl} url={item.posterUrl} /></div>
        <div className="org-event-details"><OrganizerStatus status={item.status} /><h2><Link href={`${base}/events/${item.eventId}`}>{item.title}</Link></h2><p className="org-event-meta"><Clock3 size={14} aria-hidden="true" />Cập nhật {vnInput(item.updatedAt).replace('T', ' ')} · GMT+7</p></div>
        <Link className="tv-button" href={`${base}/events/${item.eventId}`}>{item.status === 'DRAFT' || item.status === 'REJECTED' ? 'Tiếp tục chỉnh sửa' : 'Quản lý sự kiện'}<ArrowRight size={16} aria-hidden="true" /></Link>
      </article>)}
      {!items.length && <section className="org-empty"><CalendarDays size={32} aria-hidden="true" /><h2>{filtered ? 'Không có sự kiện phù hợp' : 'Bắt đầu với sự kiện đầu tiên'}</h2><p>{filtered ? 'Thử tên hoặc trạng thái khác. Bạn cũng có thể chuyển trang để xem thêm sự kiện.' : 'Tạo bản nháp, thêm lịch diễn và loại vé, sau đó gửi kiểm duyệt khi đã sẵn sàng.'}</p>{filtered ? <button className="tv-button" onClick={() => { setQuery(''); setStatus(''); }}>Xóa bộ lọc</button> : writable && <Link className="tv-button tv-primary" href={`${base}/events/new`}><Plus size={16} aria-hidden="true" />Tạo sự kiện</Link>}</section>}
    </div>
    <nav className="org-pagination" aria-label="Phân trang sự kiện"><span>Trang {page} / {pages} · Tổng {data.total} sự kiện</span><div><button className="tv-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} aria-hidden="true" />Trước</button><button className="tv-button" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Sau<ChevronRight size={16} aria-hidden="true" /></button></div></nav>
  </>;
}
