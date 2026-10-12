'use client';
import { useState, type FormEvent } from 'react';
import { useEventCategories } from '@/lib/events/useEventCategories';
import type { TicketFilters as Filters } from '@/lib/commerce/types';
import { ticketLabels } from '@/lib/commerce/rules';

export function TicketFilters({ mine = false, eventId, hideSort = false, onApply }: { mine?: boolean; eventId?: string; hideSort?: boolean; onApply: (filters: Filters) => void }) {
  const categories = useEventCategories();
  const [error, setError] = useState('');
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); const filters: Filters = {};
    for (const field of ['q', 'eventId', 'categoryId', 'ticketTier', 'sort', 'status'] as const) {
      const value = String(data.get(field) ?? '').trim();
      if (value) Object.assign(filters, { [field]: value });
    }
    for (const field of ['minPrice', 'maxPrice'] as const) if (data.get(field)) filters[field] = Number(data.get(field));
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) { setError('Giá tối thiểu không được lớn hơn giá tối đa.'); return; }
    setError(''); onApply(filters);
  }
  return <form onSubmit={submit} className="tv-panel space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <label>Tên sự kiện / hạng vé<input name="q" type="search" maxLength={100} className="tv-input" placeholder="Tìm vé…" /></label>
    <label>Danh mục<select name="categoryId" className="tv-input"><option value="">Tất cả danh mục</option>{categories.data?.map(c => <option value={c.category_id} key={c.category_id}>{c.name}</option>)}</select></label>
    <label>Hạng vé (khớp chính xác)<input name="ticketTier" maxLength={100} className="tv-input" placeholder="Ví dụ: VIP" /></label>
    {!eventId && <label>Mã sự kiện<input name="eventId" maxLength={40} className="tv-input" /></label>}
    <label>Giá bán từ (VNĐ)<input name="minPrice" type="number" min={0} max={1000000000} step="0.01" className="tv-input" /></label>
    <label>Giá bán đến (VNĐ)<input name="maxPrice" type="number" min={0} max={1000000000} step="0.01" className="tv-input" /></label>
    {!hideSort && <label>Sắp xếp<select name="sort" className="tv-input"><option value="newest">Mới đăng</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="event_soonest">Sự kiện gần nhất</option></select></label>}
    {mine && <label>Trạng thái<select name="status" className="tv-input"><option value="">Tất cả</option>{Object.entries(ticketLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
  </div>{categories.isError && <p role="alert">Không tải được danh mục. <button type="button" className="underline" onClick={() => void categories.refetch()}>Thử lại</button></p>}{error && <p role="alert">{error}</p>}<div className="flex gap-3"><button className="tv-button tv-primary">Áp dụng bộ lọc</button><button className="tv-button" type="reset" onClick={() => { setError(''); onApply({}); }}>Đặt lại</button></div></form>;
}
