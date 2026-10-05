'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface PreviewDetails { title: string; fields: { label: string; value: string }[] }

export function PreviewDialog({ details, onClose }: { details: PreviewDetails | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (details && dialog && !dialog.open) dialog.showModal();
    else if (!details && dialog?.open) dialog.close();
  }, [details]);
  return <dialog ref={ref} onClose={onClose} onClick={e => { if (e.target === e.currentTarget) ref.current?.close(); }} aria-labelledby="preview-title" className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50">
    {details && <div className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">Thông tin chi tiết</p><h2 id="preview-title" className="mt-2 text-xl font-semibold">{details.title}</h2></div><button aria-label="Đóng chi tiết" autoFocus onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div><dl className="mt-6 divide-y divide-slate-100">{details.fields.map(field => <div key={field.label} className="flex justify-between gap-6 py-3 text-sm"><dt className="text-slate-400">{field.label}</dt><dd className="text-right font-medium">{field.value}</dd></div>)}</dl><p className="mt-5 rounded-lg bg-violet-50 p-3 text-xs leading-5 text-violet-700">Dữ liệu minh họa. Các thao tác nghiệp vụ sẽ được kết nối khi tích hợp API.</p><button onClick={onClose} className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700">Đóng</button></div>}
  </dialog>;
}
