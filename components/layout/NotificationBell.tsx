'use client';

import { useRef, useState } from 'react';
import { Bell, CheckCheck, CircleCheck, CircleX, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { notificationsApi, type WebNotification } from '@/lib/api/notifications';
import { Dialog } from '@/components/ui/Dialog';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

export function NotificationBell() {
  const status = useAuthStore(state => state.status);
  const userId = useAuthStore(state => state.user?.user_id);
  const revision = useAuthStore(state => state.revision);
  return status === 'authenticated' && userId ? <Inbox key={`${userId}:${revision}`} userId={userId} revision={revision} /> : null;
}

export function Inbox({ userId, revision }: { userId: string; revision: number }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const router = useRouter();
  const cache = useQueryClient();
  const root = ['notifications', userId, revision];
  const query = useQuery({
    queryKey: [...root, page],
    queryFn: ({ signal }) => notificationsApi.list(page, signal),
    gcTime: 0,
    retry: 1,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  });
  const data = query.isError ? undefined : query.data;
  function sameSession() {
    const session = useAuthStore.getState();
    return session.status === 'authenticated' && session.user?.user_id === userId && session.revision === revision;
  }
  async function read(item?: WebNotification) {
    if (lock.current || !sameSession()) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (item) { if (!item.readAt) await notificationsApi.read(item.id); }
      else await notificationsApi.readAll();
      if (!sameSession()) return;
      void cache.invalidateQueries({ queryKey: root });
      if (item) {
        if (!/^\/(?:checkout\/(?:orders|pass)\/|organizer\/|account\/resale(?:$|\?))/.test(item.href) || item.href.includes('\\')) throw new Error('Invalid notification link');
        setOpen(false); router.push(item.href);
      }
    } catch {
      if (sameSession()) setError('Chưa thể mở hoặc đánh dấu thông báo. Vui lòng thử lại.');
    } finally {
      lock.current = false;
      if (sameSession()) setBusy(false);
    }
  }
  const unread = data?.unreadCount;
  return <>
    <button type="button" className="tv-button relative !px-3" aria-label={`Thông báo${unread === undefined ? '' : `, ${unread} chưa đọc`}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); setError(''); void query.refetch(); }}>
      <Bell size={19} aria-hidden="true" />
      {!!unread && <span aria-hidden="true" className="absolute -right-2 -top-2 min-w-5 rounded-full bg-violet-500 px-1 text-center text-xs font-bold leading-5 text-white">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <Dialog title="Thông báo" onClose={() => setOpen(false)} busy={busy} className="!max-w-xl [color-scheme:dark]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tv-muted" aria-live="polite">{unread === undefined ? 'Đang cập nhật thông báo' : `${unread} thông báo chưa đọc`}</p>
        <button type="button" className="tv-button" disabled={busy || !unread} onClick={() => void read()}><CheckCheck size={16} aria-hidden="true" />Đọc tất cả</button>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-rose-300">{error}</p>}
      {query.isPending ? <p role="status" className="py-8 text-center tv-muted">Đang tải thông báo…</p> : query.isError ? <div role="alert" className="space-y-3 py-6"><p>Chưa thể tải thông báo.</p><button className="tv-button" onClick={() => void query.refetch()}>Thử lại</button></div> : data && <>
        {!data.items.length ? <div className="py-10 text-center"><Bell className="mx-auto mb-3 text-violet-300" aria-hidden="true" /><p>{page === 1 ? 'Bạn chưa có thông báo.' : 'Trang này không còn thông báo.'}</p><p className="mt-2 text-sm tv-muted">Kết quả mua vé, bán lại và duyệt sự kiện sẽ xuất hiện tại đây.</p></div> : <ul className="max-h-[55dvh] space-y-2 overflow-y-auto p-1" aria-label="Danh sách thông báo">{data.items.map(item => <li key={item.id}>
          <button type="button" disabled={busy} className={`flex w-full gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-violet-500/15 ${item.readAt ? 'border-white/10' : 'border-violet-400/35 bg-violet-500/10'}`} onClick={() => void read(item)}>
            <span className="mt-1 shrink-0 text-violet-300">{item.kind === 'EVENT_REJECTED' ? <CircleX size={20} aria-hidden="true" /> : item.kind === 'EVENT_APPROVED' ? <CircleCheck size={20} aria-hidden="true" /> : <Ticket size={20} aria-hidden="true" />}</span>
            <span className="min-w-0 flex-1"><span className="block break-words font-semibold">{item.title}{!item.readAt && <span className="ml-2 text-xs text-violet-300">Chưa đọc</span>}</span><span className="mt-1 block whitespace-pre-wrap break-words text-sm tv-muted">{item.body}</span><time dateTime={item.createdAt} className="mt-2 block text-xs tv-muted">{dateFormat.format(new Date(item.createdAt))}</time><span className="mt-2 block text-sm font-medium text-violet-300">Xem chi tiết</span></span>
          </button>
        </li>)}</ul>}
        <nav aria-label="Phân trang thông báo" className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4"><button className="tv-button" disabled={busy || page === 1} onClick={() => setPage(page - 1)}>Trước</button><span className="text-sm tv-muted">Trang {page} / {Math.max(1, Math.ceil(data.total / data.limit))}</span><button className="tv-button" disabled={busy || page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Sau</button></nav>
      </>}
    </Dialog>}
  </>;
}
