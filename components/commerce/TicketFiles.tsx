'use client';

import { useRef, useState } from 'react';
import { downloadTicketPdf, postCommerce } from '@/lib/api/commerce';
import { formatHttpError } from '@/lib/api/http-errors';
import { Failure } from '@/components/ui/commerce';
import { useClock } from './shared';

export function TicketFiles({ id, order = false }: { id: string; order?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const now = useClock();
  const lock = useRef(false);
  const path = order ? `orders/${encodeURIComponent(id)}/tickets` : `tickets/${encodeURIComponent(id)}`;
  async function run(email: boolean) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); setNotice('');
    try {
      if (email) {
        const result = await postCommerce<{ sent: boolean; ticketCount: number }>(`${path}/resend-email`);
        if (result.sent) setNotice(`SMTP đã chấp nhận gửi ${result.ticketCount} vé đến email tài khoản. Hãy kiểm tra cả mục thư rác.`);
        setRetryAt(Date.now() + 60_000);
      } else await downloadTicketPdf(`${path}/pdf`, `${id}.pdf`);
    } catch (failure) {
      const parsed = formatHttpError(failure);
      if (parsed.statusCode === 429) setRetryAt(Date.now() + (parsed.retryAfterSeconds ?? 60) * 1000);
      setError(parsed);
    } finally { lock.current = false; setBusy(false); }
  }
  return <section className="space-y-3"><div className="flex flex-wrap gap-3"><button className="tv-button" disabled={busy} onClick={() => void run(false)}>Tải PDF {order ? 'cả đơn' : 'vé'}</button><button className="tv-button" disabled={busy || retryAt > now} onClick={() => void run(true)}>{retryAt > now ? `Gửi lại sau ${Math.ceil((retryAt - now) / 1000)}s` : 'Gửi lại email'}</button></div><p className="text-xs tv-muted">Chỉ xuất vé có hiệu lực còn thuộc bạn. Giới hạn email được dùng chung giữa vé và đơn hàng.</p>{busy && <p role="status">Đang xử lý tài liệu…</p>}{notice && <p role="status" className="tv-notice">{notice}</p>}{error != null && <Failure error={error} />}</section>;
}
