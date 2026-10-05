import { Activity, Check, X, Flag, CheckCheck } from 'lucide-react';
import { Panel } from '@/app/(modules)/(moderator)/_components/Panel';
import type { activities as MockActivity } from '../_lib/dashboard.mock';

export function RecentActivity({ activities }: { activities: typeof MockActivity }) { return (
    <Panel title="Hoạt động gần đây" action={<span className="flex items-center gap-1.5 text-[10px] text-slate-400"><Activity size={13} aria-hidden="true" />Nhật ký hoạt động</span>}><div className="grid divide-y divide-slate-100 px-5 pb-2 sm:px-6">{activities.map(item => { const Icon = item.type === 'approved' ? Check : item.type === 'rejected' ? X : item.type === 'report' ? Flag : CheckCheck; return <div key={item.id} className="flex items-center gap-3 py-3.5"><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${item.type === 'approved' || item.type === 'checkin' ? 'bg-emerald-50 text-emerald-600' : item.type === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}><Icon size={15} aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-xs"><span className="font-semibold">{item.actor}</span><span className="text-slate-500"> · {item.action.toLocaleLowerCase('vi')}</span></p><p className="mt-1 truncate text-[10px] text-slate-400">{item.target}</p></div><span className="shrink-0 text-[10px] text-slate-400">{item.time}</span></div>; })}</div></Panel>

); }
