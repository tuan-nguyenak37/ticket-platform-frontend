'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { getUser, listUsers, type ManagedUser } from '@/lib/users/api';
import { Failure } from '@/components/commerce/shared';
import { UserInfo, roleLabels, statusLabels } from './UserInfo';
import { UserForm } from './UserForms';

function UserDetail({ id }: { id: string }) {
  const actor = useAuthStore(state => state.user); const client = useQueryClient();
  const query = useQuery({ queryKey: ['users', id], queryFn: ({ signal }) => getUser(id, signal), retry: false });
  async function saved(user: ManagedUser) {
    client.setQueryData(['users', id], user);
    if (actor?.user_id === user.user_id) useAuthStore.getState().updateUser({ fullName: user.fullName });
    await client.invalidateQueries({ queryKey: ['users'] });
  }
  return <div className="space-y-4"><button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Tải lại tài khoản</button>{query.isPending && <p role="status">Đang tải hồ sơ…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}{query.data && !query.isError && <><UserInfo user={query.data} /><UserForm key={`${id}:${query.data.updatedAt}`} kind="name" user={query.data} onSaved={saved} />{actor?.user_id !== id && ['user', 'moderator'].includes(query.data.role) && <UserForm key={`status:${id}`} kind="status" user={query.data} onSaved={saved} />}</>}</div>;
}

export function UserManagement() {
  const role = useAuthStore(state => state.user?.role); const client = useQueryClient();
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState(''); const [creating, setCreating] = useState(false); const [result, setResult] = useState<ManagedUser | null>(null);
  const query = useQuery({ queryKey: ['users', 'list'], queryFn: ({ signal }) => listUsers(signal), enabled: role === 'admin', retry: false });
  if (role !== 'admin') return <div className="space-y-4"><p className="tv-panel">MODERATOR được khóa/mở khóa USER theo mã tài khoản. Backend hiện chỉ cho ADMIN xem danh sách và chi tiết người dùng.</p><UserForm kind="status" onSaved={setResult} />{result && <UserInfo user={result} />}</div>;
  const users = query.data?.filter(user => `${user.user_id} ${user.email} ${user.fullName ?? ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))) ?? [];
  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới</button><button className="tv-button tv-primary" onClick={() => setCreating(!creating)}>{creating ? 'Đóng tạo tài khoản' : 'Tạo tài khoản'}</button></div>
    {creating && <UserForm kind="create" onSaved={async user => { setSelected(user.user_id); await client.invalidateQueries({ queryKey: ['users'] }); }} />}
    <label className="block">Tìm trong danh sách đã tải<input value={search} onChange={event => setSearch(event.target.value)} className="tv-input" placeholder="Tên, email hoặc mã tài khoản" /></label><p className="text-sm opacity-70">API trả tối đa 100 tài khoản mới nhất, chưa hỗ trợ phân trang hoặc tìm kiếm toàn hệ thống.</p>
    {query.isPending && <p role="status">Đang tải người dùng…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}
    {!query.isPending && !query.isError && <div className="grid items-start gap-5 xl:grid-cols-2"><section className="tv-panel space-y-3"><h2 className="font-bold">Người dùng ({users.length})</h2>{!users.length && <p>Không có tài khoản phù hợp.</p>}{users.map(user => <button key={user.user_id} aria-pressed={selected === user.user_id} onClick={() => setSelected(user.user_id)} className={`block w-full space-y-1 rounded-xl border p-4 text-left ${selected === user.user_id ? 'border-violet-500 bg-violet-500/10' : 'border-current/15'}`}><span className="block break-words font-semibold">{user.fullName || user.email}</span><span className="block break-all text-sm opacity-70">{user.email}</span><span className="block text-sm">{roleLabels[user.role] ?? user.role} · {statusLabels[user.status] ?? user.status}</span></button>)}</section>{selected ? <UserDetail key={selected} id={selected} /> : <p className="tv-panel">Chọn tài khoản để xem thông tin và xử lý.</p>}</div>}
  </div>;
}
