'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { AppApiError } from '@/lib/http/http-errors';

export function CommercePage({ title, children, manage = false }: { title: string; children: ReactNode; manage?: boolean }) {
  return <div className={`commerce ${manage ? 'commerce-light' : 'mx-auto w-full max-w-6xl px-4 py-8 sm:px-6'} space-y-6`}><nav className="flex flex-wrap gap-4 text-sm" aria-label="Giao dịch vé"><Link href="/tickets">Tìm vé</Link><Link href="/organizer/create">Đăng vé PDF</Link><Link href="/dashboard/tickets">Vé tôi đăng</Link><Link href="/dashboard/orders">Đơn mua / bán</Link>{manage && <Link href="/moderator/orders">Quản trị đơn</Link>}</nav><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{children}</div>;
}
export function ManagerGate({ children }: { children: ReactNode }) {
  const role = useAuthStore(s => s.user?.role);
  return <RequireAuth>{role === 'admin' || role === 'moderator' ? children : <p role="alert">Bạn cần quyền ADMIN hoặc MODERATOR để xem trang này.</p>}</RequireAuth>;
}
export function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  const code = error instanceof AppApiError ? error.statusCode : undefined;
  return <div role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4"><p>{code === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : code === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : code === 409 ? 'Trạng thái đã thay đổi. Dữ liệu đang được tải lại; hãy kiểm tra trước khi thử lại.' : code && code >= 500 ? 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại sau hoặc liên hệ quản trị.' : ''}</p><p>{error instanceof Error ? error.message : 'Không thể hoàn thành yêu cầu.'}</p>{retry && <button className="mt-2 underline" onClick={retry}>Thử lại</button>}</div>;
}
export function Pagination({ page, total, limit = 20, busy, onChange }: { page: number; total: number; limit?: number; busy: boolean; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return <div className="flex items-center justify-between gap-3 text-sm"><button className="tv-button" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>Trước</button><span>{total} kết quả · Trang {page}/{pages}</span><button className="tv-button" disabled={busy || page >= pages} onClick={() => onChange(page + 1)}>Sau</button></div>;
}
