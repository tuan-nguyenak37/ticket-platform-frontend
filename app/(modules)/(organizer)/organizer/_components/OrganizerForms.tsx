'use client';
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { parseVnd, vnInput, vnWire, type Organizer, type Event, type Category, type Showing, type TicketType, type OrganizerInput, type EventInput, type ShowingInput, type TicketInput, type TicketUpdate } from '../_lib/organizer.api';

export function Field({ name, label, value, type = 'text', required = true, maxLength, min, max, disabled, placeholder }: { name: string; label: string; value?: string | number | null; type?: string; required?: boolean; maxLength?: number; min?: number | string; max?: number | string; disabled?: boolean; placeholder?: string }) {
  return <label className="block text-sm font-medium">{label}{required && <span className="text-fuchsia-300" aria-hidden="true"> *</span>}<input className="tv-input" name={name} type={type} defaultValue={value ?? ''} required={required} maxLength={maxLength} min={min} max={max} disabled={disabled} placeholder={placeholder} step={type === 'number' ? 1 : undefined} /></label>;
}
function PriceField({ value }: { value?: string }) {
  function format(input: HTMLInputElement, grouped: boolean) {
    input.setCustomValidity('');
    if (!input.value) return;
    try {
      const amount = parseVnd(input.value);
      input.value = grouped ? new Intl.NumberFormat('vi-VN').format(amount) : String(amount);
    } catch (failure) { input.setCustomValidity(failure instanceof Error ? failure.message : 'Giá vé không hợp lệ.'); }
  }
  return <label className="block text-sm font-medium">Giá mỗi vé (VND)<span className="text-fuchsia-300" aria-hidden="true"> *</span><span className="relative mt-2 block"><input className="tv-input" style={{ paddingRight: '4.5rem', marginTop: 0 }} name="price" type="text" inputMode="numeric" required pattern="(?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:\.[0-9]{3})+)" placeholder="Ví dụ: 230.000" defaultValue={value == null ? '' : new Intl.NumberFormat('vi-VN').format(BigInt(value))} onFocus={event => format(event.currentTarget, false)} onBlur={event => format(event.currentTarget, true)} onChange={event => event.currentTarget.setCustomValidity('')} /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center tv-muted" aria-hidden="true">VND</span></span></label>;
}
function text(data: FormData, key: string) { return String(data.get(key) ?? '').trim(); }
function Form({ title, children, save, close, inline = false, onBusyChange }: { title: string; children: ReactNode; save: (data: FormData) => Promise<unknown>; close: () => void; inline?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const sending = useRef(false);
  const dirty = useRef(false);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (dirty.current) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  function closeSafely() { if (!dirty.current || window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi?')) close(); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (sending.current) return;
    sending.current = true;
    const form = event.currentTarget;
    const data = new FormData(form); setBusy(true); setError('');
    try { await save(data); dirty.current = false; delete form.dataset.organizerDirty; close(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể lưu. Vui lòng thử lại.'); } finally { sending.current = false; setBusy(false); }
  }
  const content = <form id={inline ? 'organizer-event-form' : undefined} aria-busy={busy} onSubmit={submit} onChange={event => { dirty.current = true; event.currentTarget.dataset.organizerDirty = 'true'; }} className="space-y-4"><fieldset disabled={busy} className="space-y-4">{children}</fieldset>{error && <p ref={errorRef} tabIndex={-1} className="tv-notice border-rose-400/50 text-rose-200" role="alert"><strong>Chưa lưu thay đổi.</strong> {error}</p>}{!inline && <footer className="flex justify-end gap-3">{!inline && <button type="button" className="tv-button" disabled={busy} onClick={closeSafely}>Hủy</button>}<button className="tv-button tv-primary" disabled={busy}>{busy ? 'Đang lưu…' : inline ? 'Lưu bản nháp' : 'Lưu thay đổi'}</button></footer>}</form>;
  return inline ? <section className="space-y-4">{content}</section> : <Dialog title={title} onClose={closeSafely} busy={busy}>{content}</Dialog>;
}
export function OrganizerForm({ initial, save, close }: { initial?: Organizer; save: (body: OrganizerInput) => Promise<unknown>; close: () => void }) {
  return <Form title={initial ? 'Sửa hồ sơ Ban tổ chức' : 'Tạo Ban tổ chức'} close={close} save={data => save({ name: text(data, 'name'), contactEmail: text(data, 'contactEmail'), description: text(data, 'description') || null })}><p className="org-help">Thông tin này dùng chung cho các sự kiện của bạn. Điền tên và email mà người tham dự có thể nhận diện và liên hệ.</p><Field name="name" label="Tên Ban tổ chức" value={initial?.name} maxLength={255} /><Field name="contactEmail" label="Email liên hệ" type="email" value={initial?.contactEmail} maxLength={255} /><label className="block text-sm font-medium">Giới thiệu Ban tổ chức<textarea className="tv-input min-h-32" name="description" defaultValue={initial?.description ?? ''} placeholder="Giới thiệu đơn vị tổ chức và các hoạt động của bạn…" /></label></Form>;
}
export function EventForm({ initial, categories, save, close, inline = false, onBusyChange }: { initial?: Event; categories: Category[]; save: (body: EventInput) => Promise<unknown>; close: () => void; inline?: boolean; onBusyChange?: (busy: boolean) => void }) {
  return <Form inline={inline} onBusyChange={onBusyChange} title={initial ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'} close={close} save={data => save({ title: text(data, 'title'), categoryId: text(data, 'categoryId'), description: text(data, 'description') || null, posterUrl: initial?.posterUrl?.startsWith('/api/') ? undefined : text(data, 'posterUrl') || null })}>
    {initial && ['PUBLISHED', 'REJECTED'].includes(initial.status) && <p className="tv-notice">Thay đổi nội dung sẽ đưa sự kiện về bản nháp và cần gửi kiểm duyệt lại.</p>}
    <div className="org-form-section"><h3>Thông tin cơ bản</h3><div className="org-form-grid"><Field name="title" label="Tên sự kiện" value={initial?.title} maxLength={255} /><label className="block text-sm font-medium">Danh mục <span className="text-fuchsia-300" aria-hidden="true">*</span><select name="categoryId" className="tv-input" required defaultValue={initial?.categoryId ?? ''}><option value="" disabled>Chọn danh mục</option>{categories.map(category => <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)}</select></label></div></div>
    <div className="org-form-section"><h3>Giới thiệu sự kiện</h3><label className="block text-sm font-medium">Nội dung mô tả<textarea className="tv-input min-h-48" name="description" placeholder="Giới thiệu chương trình và lịch trình dự kiến. Nêu quyền lợi của người tham dự, điều kiện vào cửa và chính sách khi chương trình thay đổi…" defaultValue={initial?.description ?? ''} /></label><p className="org-help mt-2">Có thể lưu bản nháp trước. Cần hoàn thiện mô tả để gửi duyệt; thông tin công bố phải chính xác và bạn có quyền sử dụng nội dung, hình ảnh.</p></div>
    {!initial?.posterUrl?.startsWith('/api/') && <div className="org-form-section"><h3>Ảnh bìa sự kiện</h3><Field name="posterUrl" label="Đường dẫn ảnh bìa (tùy chọn)" type="url" required={false} value={initial?.posterUrl} /><p className="org-help mt-2">Khuyến nghị ảnh ngang 1560 × 600 px, dung lượng không quá 1 MB để tải nhanh. Bạn cũng có thể lưu bản nháp rồi tải ảnh trực tiếp từ thiết bị.</p></div>}
  </Form>;
}
export function ShowingForm({ initial, event, save, close }: { initial?: Showing; event: Event; save: (body: ShowingInput) => Promise<unknown>; close: () => void }) {
  return <Form title={initial ? 'Chỉnh sửa suất diễn' : 'Thêm suất diễn'} close={close} save={data => {
    const startTime = vnWire(text(data, 'startTime')); const endTime = vnWire(text(data, 'endTime'));
    if (Date.parse(endTime) <= Date.parse(startTime)) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
    const changed = !initial || Date.parse(initial.startTime) !== Date.parse(startTime) || Date.parse(initial.endTime) !== Date.parse(endTime);
    if (changed && Date.parse(startTime) <= Date.now()) throw new Error('Giờ bắt đầu phải ở tương lai.');
    return save({ name: text(data, 'name'), startTime, endTime, venueName: text(data, 'venueName'), address: text(data, 'address'), city: text(data, 'city') });
  }}>
    <p className="tv-muted">Tất cả thời gian là giờ Việt Nam (UTC+07:00).</p>{['PUBLISHED', 'REJECTED'].includes(event.status) && <p className="tv-notice">Thêm hoặc sửa suất diễn sẽ đưa sự kiện về bản nháp.</p>}
    <p className="org-help">Suất diễn là một lần tổ chức sự kiện, có thời gian và địa điểm riêng. Sau khi lưu suất diễn, bạn có thể thêm các hạng vé như Vé thường, VIP cho suất diễn đó.</p>
    <Field name="name" label="Tên suất diễn" placeholder="Ví dụ: Đêm diễn 22/10 hoặc Suất tối" value={initial?.name} maxLength={255} />
    <div className="org-form-section"><h3>Thời gian diễn ra</h3><div className="org-form-grid"><Field name="startTime" label="Bắt đầu" type="datetime-local" value={vnInput(initial?.startTime ?? null)} /><Field name="endTime" label="Kết thúc" type="datetime-local" value={vnInput(initial?.endTime ?? null)} /></div></div>
    <div className="org-form-section space-y-4"><h3>Địa điểm tổ chức</h3><div className="org-form-grid"><Field name="venueName" label="Tên địa điểm" value={initial?.venueName} maxLength={255} /><Field name="city" label="Thành phố" value={initial?.city} maxLength={150} /></div><Field name="address" label="Địa chỉ chi tiết" value={initial?.address} maxLength={2000} /></div>
  </Form>;
}
export function TicketForm({ initial, showing, save, close }: { initial?: TicketType; showing: Showing; save: (body: TicketInput | TicketUpdate) => Promise<unknown>; close: () => void }) {
  const locked = !!initial && initial.reservedQuantity + initial.soldQuantity > 0;
  const showingTime = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(showing.startTime));
  const saleDeadline = `Kết thúc bán phải trước hoặc đúng ${showingTime} (giờ Việt Nam), là giờ bắt đầu suất diễn.`;
  return <Form title={initial ? 'Cấu hình hạng vé' : 'Tạo hạng vé'} close={close} save={data => {
    const totalQuantity = Number(text(data, 'totalQuantity'));
    if (!Number.isInteger(totalQuantity) || totalQuantity < 1 || totalQuantity > 2147483647) throw new Error('Số lượng vé không hợp lệ.');
    if (locked) { if (totalQuantity < initial.totalQuantity) throw new Error('Chỉ được tăng tổng số lượng.'); return save({ totalQuantity }); }
    const body: TicketInput = { name: text(data, 'name'), description: text(data, 'description') || null, price: parseVnd(text(data, 'price')), totalQuantity };
    if (!initial) {
      const start = text(data, 'saleStartAt'); const end = text(data, 'saleEndAt');
      const maxPerOrder = Number(text(data, 'maxPerOrder'));
      if (!Number.isInteger(maxPerOrder) || maxPerOrder < 1 || maxPerOrder > totalQuantity) throw new Error('Giới hạn mỗi đơn không hợp lệ.');
      if (!!start !== !!end) throw new Error('Cần đủ cả hai mốc lịch bán.');
      if (start && end) { body.saleStartAt = vnWire(start); body.saleEndAt = vnWire(end); }
      if (body.saleStartAt && body.saleEndAt && Date.parse(body.saleStartAt) >= Date.parse(body.saleEndAt)) throw new Error('Kết thúc bán phải sau bắt đầu bán.');
      if (body.saleEndAt && Date.parse(body.saleEndAt) > Date.parse(showing.startTime)) throw new Error(saleDeadline);
      body.maxPerOrder = maxPerOrder; body.resaleAllowed = data.get('resaleAllowed') === 'on'; body.status = text(data, 'status') as TicketType['status'];
      if (body.status === 'ACTIVE' && !body.saleEndAt) throw new Error('Cần lịch bán để kích hoạt vé.');
      return save(body);
    }
    const start = text(data, 'saleStartAt'); const end = text(data, 'saleEndAt');
    if ((!start && initial.saleStartAt) || (!end && initial.saleEndAt)) throw new Error('API chưa hỗ trợ xóa mốc lịch bán đã lưu.');
    const saleStartAt = start ? vnWire(start) : undefined; const saleEndAt = end ? vnWire(end) : undefined;
    const status = text(data, 'status') as TicketType['status']; const maxPerOrder = Number(text(data, 'maxPerOrder'));
    if (status === 'ACTIVE' && (!saleStartAt || !saleEndAt)) throw new Error('Cần đủ lịch bán trước khi kích hoạt.');
    if (saleStartAt && saleEndAt && Date.parse(saleStartAt) >= Date.parse(saleEndAt)) throw new Error('Kết thúc bán phải sau bắt đầu bán.');
    if (saleEndAt && Date.parse(saleEndAt) > Date.parse(showing.startTime)) throw new Error(saleDeadline);
    if (!Number.isInteger(maxPerOrder) || maxPerOrder < 1 || maxPerOrder > 2147483647 || (maxPerOrder > totalQuantity)) throw new Error('Giới hạn mỗi đơn không hợp lệ.');
    const timeChanged = (saleStartAt ? Date.parse(saleStartAt) : null) !== (initial.saleStartAt ? Date.parse(initial.saleStartAt) : null) || (saleEndAt ? Date.parse(saleEndAt) : null) !== (initial.saleEndAt ? Date.parse(initial.saleEndAt) : null);
    if (saleEndAt && (timeChanged || (status === 'ACTIVE' && initial.status !== status)) && Date.parse(saleEndAt) <= Date.now()) throw new Error('Kết thúc bán phải ở tương lai khi thay lịch hoặc kích hoạt.');
    return save({ ...body, saleStartAt, saleEndAt, status, maxPerOrder, resaleAllowed: data.get('resaleAllowed') === 'on' });
  }}>
    <section className="tv-notice space-y-2" aria-label="Suất diễn áp dụng cho hạng vé"><p><strong>Suất diễn: {showing.name}</strong></p><p>Bắt đầu: {new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'long', timeStyle: 'short' }).format(new Date(showing.startTime))} (giờ Việt Nam)</p><p>Địa điểm: {[showing.venueName, showing.address, showing.city].filter(Boolean).join(', ')}</p><p>Hạng vé này chỉ áp dụng cho suất diễn trên, không dùng chung cho các suất diễn khác.</p></section>
    {locked ? <p className="tv-notice">Đã có vé giữ chỗ hoặc đã bán. Chỉ được tăng tổng số lượng.</p> : <div className="org-form-section space-y-4"><h3>Thông tin hạng vé</h3><Field name="name" label="Tên hạng vé" placeholder="Ví dụ: Vé thường, VIP, VVIP" value={initial?.name} maxLength={255} /><Field name="description" label="Quyền lợi của hạng vé (tùy chọn)" placeholder="Ví dụ: Khu vực VIP, kèm 1 phần nước" value={initial?.description} maxLength={2000} required={false} /><PriceField value={initial?.price} /></div>}
    <Field name="totalQuantity" label="Tổng số lượng" type="number" value={initial?.totalQuantity} min={locked ? initial.totalQuantity : 1} max={2147483647} />
    {!locked && <><div className="org-form-section"><h3>Thời gian mở bán</h3><p className="org-help mb-4">{saleDeadline} Nếu cần chuẩn bị hậu cần, có thể ngừng bán sớm 1–2 ngày. Cần đủ lịch bán trước khi kích hoạt.</p><div className="org-form-grid"><Field name="saleStartAt" label="Bắt đầu bán" type="datetime-local" value={vnInput(initial?.saleStartAt ?? null)} max={vnInput(showing.startTime)} required={false} /><Field name="saleEndAt" label="Kết thúc bán" type="datetime-local" value={vnInput(initial?.saleEndAt ?? null)} max={vnInput(showing.startTime)} required={false} /></div></div><div className="org-form-section space-y-4"><h3>Giới hạn & chính sách vé</h3><div className="org-form-grid"><Field name="maxPerOrder" label="Số vé tối đa mỗi đơn" type="number" value={initial?.maxPerOrder ?? 4} min={1} max={2147483647} /><label className="block text-sm font-medium">Trạng thái<select className="tv-input" name="status" defaultValue={initial?.status ?? 'DRAFT'}>{(!initial || initial.status === 'DRAFT') && <option value="DRAFT">Bản nháp</option>}<option value="ACTIVE">Kích hoạt</option><option value="INACTIVE">Ngừng kích hoạt</option></select></label></div><p className="org-help">Mỗi đơn mua ít nhất 1 vé. Giá 0 VND là vé miễn phí.</p><label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="resaleAllowed" defaultChecked={initial?.resaleAllowed ?? false} />Cho phép bán lại vé</label><p className="org-help">Kích hoạt không đồng nghĩa đang trong thời gian bán.</p></div></>}

  </Form>;
}
