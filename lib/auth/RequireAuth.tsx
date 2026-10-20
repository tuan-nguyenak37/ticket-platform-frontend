'use client';
import type { ReactNode } from 'react';
import { useAuthStore } from './auth.store';
import { useAuthUi } from './auth-ui.store';
import { restoreSession } from './session';
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore(state => state.status);
  const show = useAuthUi(state => state.show);
  if (status === 'restoring') return <div className="commerce mx-auto w-full max-w-xl p-6"><p className="tv-panel" role="status">Đang khôi phục phiên đăng nhập…</p></div>;
  if (status === 'error') return <div className="commerce mx-auto w-full max-w-xl p-6"><section className="tv-panel space-y-4" role="alert"><h2 className="text-lg font-semibold">Chưa thể kết nối tài khoản</h2><p>Vui lòng kiểm tra kết nối và thử lại.</p><button className="tv-button" onClick={() => void restoreSession()}>Thử lại</button></section></div>;
  if (status !== 'authenticated') return <div className="commerce mx-auto w-full max-w-xl px-4 py-12"><section className="tv-panel space-y-4"><h2 className="text-2xl font-semibold">Đăng nhập để tiếp tục</h2><p className="tv-muted">Quản lý vé, đơn hàng và tiền bán vé trong cùng một tài khoản.</p><button className="tv-button tv-primary" onClick={() => show()}>Đăng nhập / Đăng ký</button></section></div>;
  return children;
}
