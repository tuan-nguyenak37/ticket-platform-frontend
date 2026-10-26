'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { adminApi, type UpdateUserInput } from '../_lib/admin.api';
import type { User } from '@/lib/auth/types/userInterface';
import { Failure, Pagination } from '@/components/ui/commerce';
import { Dialog } from '@/components/ui/Dialog';
import { formatHttpError } from '@/lib/api/http-errors';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });

export function AdminDashboard() {
  const cache = useQueryClient();
  const adminUser = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'users', adminUser?.user_id, revision],
    queryFn: () => adminApi.users(),
    enabled: adminUser?.role === 'ADMIN',
    gcTime: 0,
    retry: 1,
  });

  const users = query.data || [];
  const filtered = users.filter(user => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return user.email.toLowerCase().includes(search) || user.full_name.toLowerCase().includes(search) || user.user_id.toLowerCase().includes(search);
  });
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 20)));
  const visibleUsers = filtered.slice((visiblePage - 1) * 20, visiblePage * 20);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#d2adff]">HỆ THỐNG QUẢN TRỊ</p>
          <h1 className="mt-1 text-3xl font-bold">Quản lý người dùng</h1>
          <p className="mt-1 text-sm tv-muted">Tra cứu tài khoản, điều chỉnh trạng thái và cấp hoặc thu hồi quyền kiểm duyệt.</p>
        </div>
        <button type="button" className="tv-button tv-primary" onClick={() => setCreateOpen(true)}>
          + Tạo tài khoản
        </button>
      </header>

      <div className="tv-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            aria-label="Tìm người dùng theo email, tên hoặc mã"
            value={searchTerm}
            onChange={event => { setSearchTerm(event.target.value); setPage(1); }}
            placeholder="Tìm theo email, tên, mã người dùng…"
            className="tv-input !mt-0 max-w-sm"
          />
          <span className="text-xs tv-muted">Lọc trên danh sách đã tải: {filtered.length} / {users.length} tài khoản</span>
          <button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới</button>
        </div>

        {query.isPending ? (
          <p role="status" className="py-8 text-center tv-muted">Đang tải danh sách người dùng…</p>
        ) : query.isError ? (
          <Failure error={query.error} retry={() => void query.refetch()} />
        ) : !filtered.length ? (
          <p className="py-8 text-center tv-muted">Không tìm thấy tài khoản nào phù hợp.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Họ và tên / Email</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 pl-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleUsers.map(user => (
                  <tr key={user.user_id} className="hover:bg-white/5">
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-xs tv-muted">{user.email}</p>
                      <p className="font-mono text-[10px] text-slate-500">{user.user_id}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        user.role === 'ADMIN' ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30' :
                        user.role === 'MODERATOR' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30' :
                        'bg-slate-700/40 text-slate-300'
                      }`}>{user.role}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>{user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã đình chỉ'}</span>
                    </td>
                    <td className="py-3.5 px-4 tv-muted">{user.phone_number || '—'}</td>
                    <td className="py-3.5 px-4 text-xs tv-muted">{dateFormat.format(new Date(user.created_at))}</td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user.user_id !== adminUser?.user_id && user.status === 'ACTIVE' && (user.role === 'USER' || user.role === 'MODERATOR') && (
                          <button type="button" className="tv-button !px-2.5 !text-xs" onClick={() => setRoleTarget(user)}>{user.role === 'USER' ? 'Cấp quyền duyệt' : 'Thu hồi quyền duyệt'}</button>
                        )}
                        <button
                          type="button"
                          className="tv-button !min-h-[36px] !px-2.5 !text-xs"
                          onClick={() => setEditTarget(user)}
                        >
                          Sửa
                        </button>
                        {user.user_id !== adminUser?.user_id && user.role !== 'ADMIN' && (
                          <button
                            type="button"
                            className={`tv-button !min-h-[36px] !px-2.5 !text-xs ${
                              user.status === 'ACTIVE' ? 'border-rose-400/40 text-rose-300 hover:bg-rose-500/10' : 'border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                            onClick={() => setStatusTarget(user)}
                          >
                            {user.status === 'ACTIVE' ? 'Đình chỉ' : 'Mở lại'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {query.isSuccess && <Pagination page={visiblePage} total={filtered.length} busy={query.isFetching} onChange={setPage} />}

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            void cache.invalidateQueries({ queryKey: ['admin', 'users'] });
            void cache.invalidateQueries({ queryKey: ['admin', 'summary'] });
          }}
        />
      )}

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            void cache.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />
      )}

      {statusTarget && (
        <UpdateStatusModal
          user={statusTarget}
          onClose={() => setStatusTarget(null)}
          onUpdated={() => {
            setStatusTarget(null);
            void cache.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />
      )}
      {roleTarget && (
        <UpdateRoleModal user={roleTarget} onClose={() => setRoleTarget(null)} onUpdated={() => {
          setRoleTarget(null);
          void cache.invalidateQueries({ queryKey: ['admin', 'users'] });
          void cache.invalidateQueries({ queryKey: ['admin', 'summary'] });
        }} />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!fullName.trim()) throw new Error('Họ và tên không được để trống.');
      const revision = useAuthStore.getState().revision;
      await adminApi.createUser({ fullName: fullName.trim(), email: email.trim(), password });
      if (useAuthStore.getState().revision !== revision) return;
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title="Tạo tài khoản người dùng" onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-4">
        <p className="tv-notice">Tài khoản mới có vai trò USER. Sau khi tạo, có thể cấp quyền MODERATOR bằng thao tác riêng có xác nhận. Không cấp ADMIN tại đây.</p>
        <label className="block text-sm">
          Họ và tên (tối đa 150 ký tự)
          <input
            required
            maxLength={150}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="tv-input"
            disabled={busy}
            placeholder="Nguyễn Văn A"
          />
        </label>
        <label className="block text-sm">
          Email đăng nhập
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="tv-input"
            disabled={busy}
            placeholder="user@example.com"
          />
        </label>
        <label className="block text-sm">
          Mật khẩu (6–32 ký tự)
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={6}
            maxLength={32}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="tv-input"
            disabled={busy}
            placeholder="••••••••"
          />
        </label>
        {error != null && <Failure error={error} />}
        <div className="flex justify-end gap-3 pt-3">
          <button type="button" className="tv-button" disabled={busy} onClick={onClose}>Hủy</button>
          <button type="submit" className="tv-button tv-primary" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
        </div>
      </form>
    </Dialog>
  );
}

function UpdateRoleModal({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: () => void }) {
  const cache = useQueryClient();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);
  const targetRole = user.role === 'USER' ? 'MODERATOR' : 'USER';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const session = useAuthStore.getState();
    if (session.status !== 'authenticated' || session.user?.role !== 'ADMIN' || session.user.user_id === user.user_id) return;
    if (user.role !== 'USER' && user.role !== 'MODERATOR') return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!reason.trim()) throw new Error('Vui lòng nhập lý do thay đổi vai trò.');
      await adminApi.updateRole(user.user_id, { role: targetRole, expectedRole: user.role, reason: reason.trim() });
      if (useAuthStore.getState().revision === session.revision) onUpdated();
    } catch (error) {
      if (useAuthStore.getState().revision !== session.revision) return;
      setError(error);
      if (formatHttpError(error).statusCode === 409) void cache.invalidateQueries({ queryKey: ['admin', 'users'] });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title={targetRole === 'MODERATOR' ? 'Cấp quyền kiểm duyệt viên' : 'Thu hồi quyền kiểm duyệt viên'} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-4">
        <p className="break-words text-sm">Tài khoản: <strong>{user.email}</strong></p>
        <p className="tv-notice">{user.role} → {targetRole}. Thao tác được lưu cùng lý do. Toàn bộ phiên đăng nhập của tài khoản này bị thu hồi; người dùng cần đăng nhập lại.</p>
        <label className="block text-sm">Lý do thay đổi (bắt buộc, tối đa 1000 ký tự)<textarea required maxLength={1000} rows={3} value={reason} onChange={event => setReason(event.target.value)} className="tv-input" disabled={busy} /></label>
        {error != null && <Failure error={error} />}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" className="tv-button" disabled={busy} onClick={onClose}>Hủy</button><button type="submit" className="tv-button tv-primary" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận thay đổi quyền'}</button></div>
      </form>
    </Dialog>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone_number || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!fullName.trim()) throw new Error('Họ và tên không được để trống.');
      if (phone.trim() && !/^\+?[0-9]{7,20}$/.test(phone.trim())) throw new Error('Số điện thoại phải có 7–20 chữ số, có thể bắt đầu bằng +.');
      const payload: UpdateUserInput = {};
      if (fullName.trim() !== user.full_name) payload.full_name = fullName.trim();
      if ((phone.trim() || null) !== user.phone_number) payload.phone_number = phone.trim() || null;
      if (payload.full_name === undefined && payload.phone_number === undefined) {
        onClose();
        return;
      }
      const revision = useAuthStore.getState().revision;
      const updated = await adminApi.updateUser(user.user_id, payload);
      if (useAuthStore.getState().revision !== revision) return;
      if (useAuthStore.getState().user?.user_id === updated.user_id) useAuthStore.getState().updateUser(updated);
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title={`Cập nhật thông tin — ${user.email}`} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Họ và tên
          <input
            required
            maxLength={150}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="tv-input"
            disabled={busy}
          />
        </label>
        <label className="block text-sm">
          Số điện thoại (7–20 chữ số, để trống nếu không có)
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="tv-input"
            disabled={busy}
            placeholder="+84901234567"
          />
        </label>
        {error != null && <Failure error={error} />}
        <div className="flex justify-end gap-3 pt-3">
          <button type="button" className="tv-button" disabled={busy} onClick={onClose}>Hủy</button>
          <button type="submit" className="tv-button tv-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
        </div>
      </form>
    </Dialog>
  );
}

function UpdateStatusModal({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: () => void }) {
  const targetStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!reason.trim()) throw new Error('Vui lòng nhập lý do điều chỉnh trạng thái.');
      const revision = useAuthStore.getState().revision;
      await adminApi.updateStatus(user.user_id, { status: targetStatus, reason: reason.trim() });
      if (useAuthStore.getState().revision !== revision) return;
      onUpdated();
    } catch (err) {
      setError(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={targetStatus === 'SUSPENDED' ? `Đình chỉ tài khoản: ${user.email}` : `Mở lại tài khoản: ${user.email}`}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm tv-muted">
          {targetStatus === 'SUSPENDED'
            ? 'Khi bị đình chỉ, toàn bộ phiên đăng nhập của người dùng sẽ bị thu hồi và không thể thao tác trên hệ thống.'
            : 'Mở lại quyền đăng nhập và hoạt động bình thường cho tài khoản này.'}
        </p>
        <label className="block text-sm">
          Lý do thực hiện (bắt buộc, tối đa 1000 ký tự)
          <textarea
            required
            maxLength={1000}
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="tv-input"
            disabled={busy}
            placeholder="Ví dụ: Vi phạm quy định sử dụng, xác minh bổ sung…"
          />
        </label>
        {error != null && <Failure error={error} />}
        <div className="flex justify-end gap-3 pt-3">
          <button type="button" className="tv-button" disabled={busy} onClick={onClose}>Hủy</button>
          <button
            type="submit"
            className={`tv-button ${targetStatus === 'SUSPENDED' ? 'border-rose-400 bg-rose-600 text-white hover:bg-rose-700' : 'tv-primary'}`}
            disabled={busy}
          >
            {busy ? 'Đang xử lý…' : targetStatus === 'SUSPENDED' ? 'Xác nhận đình chỉ' : 'Xác nhận mở lại'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
