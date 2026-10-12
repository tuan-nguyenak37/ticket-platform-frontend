'use client';
import { useEffect, useState } from 'react';
import { getTicketFile } from '../../_lib/tickets.api';
export function TicketFilePreview({ id }: { id: string }) {
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let url: string | undefined;
    void getTicketFile(id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'].includes(blob.type.split(';')[0])) throw new Error('Định dạng file không được hỗ trợ.');
      url = URL.createObjectURL(blob); setFile({ url, type: blob.type });
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Không tải được file.'); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [id, attempt]);
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">File vé gốc</h2>{error ? <div role="alert" className="text-sm text-rose-700">{error}<button className="ml-2 underline" onClick={() => { setError(null); setFile(null); setAttempt(value => value + 1); }}>Thử lại</button></div> : !file ? <p role="status" className="py-20 text-center text-sm text-slate-500">Đang tải file bảo mật…</p> : <>
    {file.type.startsWith('image/') ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.url} alt="File vé do người bán cung cấp" className="max-h-[75vh] w-full object-contain" />
    ) : <object data={file.url} type="application/pdf" aria-label="Nội dung PDF vé" className="h-[65vh] w-full"><p className="text-sm">Trình duyệt không hỗ trợ xem PDF tại đây. Dùng liên kết mở file bên dưới.</p></object>}
    <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-violet-700 underline">Mở file ở tab mới</a>
  </>}</section>;
}
