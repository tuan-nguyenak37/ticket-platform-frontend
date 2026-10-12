'use client';
import { useEffect, useState } from 'react';
import { downloadDisputeEvidence } from '@/lib/commerce/api';
import type { DisputeAttachment } from '@/lib/commerce/types';
import { dateTime } from '@/lib/commerce/rules';
import { Failure } from './shared';

const formats: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

function EvidencePreview({ orderId, attachment }: { orderId: string; attachment: DisputeAttachment }) {
  const [file, setFile] = useState<{ url: string; extension: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;
    void downloadDisputeEvidence(orderId, attachment.id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      const extension = formats[blob.type.split(';')[0].toLowerCase()];
      if (!extension) throw new Error('Định dạng file không được hỗ trợ để xem bằng chứng.');
      url = URL.createObjectURL(blob);
      setFile({ url, extension });
    }).catch(failure => { if (!controller.signal.aborted) setError(failure); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [orderId, attachment.id, attempt]);

  if (error) return <Failure error={error} retry={() => { setError(null); setFile(null); setAttempt(value => value + 1); }} />;
  if (!file) return <p role="status">Đang tải bằng chứng qua kết nối xác thực…</p>;
  return <div className="space-y-3">
    <a className="tv-button inline-block" href={file.url} download={`evidence-${attachment.id}.${file.extension}`}>Tải file bằng chứng</a>
    {file.extension === 'pdf' ? <object data={file.url} type="application/pdf" aria-label="PDF bằng chứng tranh chấp" className="h-[65vh] w-full rounded-xl bg-white"><p>Trình duyệt không hỗ trợ xem PDF. Hãy dùng nút tải file.</p></object> : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.url} alt={`Bằng chứng từ ${attachment.side === 'buyer' ? 'người mua' : 'người bán'}`} className="max-h-[65vh] w-full rounded-xl object-contain" />
    )}
  </div>;
}

export function DisputeAttachments({ orderId, attachments }: { orderId: string; attachments: DisputeAttachment[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <div className="space-y-3"><h3 className="font-semibold">File bằng chứng ({attachments.length})</h3>
    {!attachments.length ? <p className="text-sm opacity-70">Chưa có file bằng chứng được gửi.</p> : <ul className="space-y-3">{attachments.map((attachment, index) => <li key={attachment.id} className="space-y-3 rounded-xl border border-current/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 space-y-1 text-sm">
        <p className="font-semibold">Bằng chứng {index + 1} · {attachment.side === 'buyer' ? 'Người mua' : 'Người bán'}</p>
        <p className="break-all opacity-70">Người gửi: {attachment.uploadedBy}</p>
        <p className="break-all">{attachment.mimetype} · {new Intl.NumberFormat('vi-VN').format(attachment.size)} byte</p>
        <p className="opacity-70">{dateTime(attachment.createdAt)}</p>
      </div><button className="tv-button" aria-expanded={selected === attachment.id} onClick={() => setSelected(selected === attachment.id ? null : attachment.id)}>{selected === attachment.id ? 'Đóng bằng chứng' : 'Xem / tải bằng chứng'}</button></div>
      {selected === attachment.id && <EvidencePreview key={`${orderId}:${attachment.id}`} orderId={orderId} attachment={attachment} />}
    </li>)}</ul>}
  </div>;
}
