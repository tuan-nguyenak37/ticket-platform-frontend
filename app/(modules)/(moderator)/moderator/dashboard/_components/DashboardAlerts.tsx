'use client';
import { useState } from 'react';
import { CircleAlert, ChevronRight } from 'lucide-react';
import { Panel } from '@/app/(modules)/(moderator)/_components/Panel';
import { PreviewDialog, type PreviewDetails } from '@/app/(modules)/(moderator)/_components/PreviewDialog';
import type { alerts as MockAlerts } from '../_lib/dashboard.mock';

export function DashboardAlerts({ alerts }: { alerts: typeof MockAlerts }) {
const [details, setDetails] = useState<PreviewDetails | null>(null);
return <>      <Panel title="Cảnh báo cần chú ý" action={<span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600">3 mới</span>}><div className="space-y-3 px-5 pb-5 sm:px-6">{alerts.map(alert => <button key={alert.id} onClick={() => setDetails({ title: alert.name, fields: [{ label: 'Mã cảnh báo', value: alert.id }, { label: 'Chi tiết', value: alert.description }, { label: 'Thời gian', value: alert.time }, { label: 'Mức độ', value: alert.severity === 'high' ? 'Ưu tiên cao' : 'Cần kiểm tra' }] })} className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${alert.severity === 'high' ? 'border-rose-100 bg-rose-50/60 hover:bg-rose-50' : 'border-amber-100 bg-amber-50/50 hover:bg-amber-50'}`}><CircleAlert size={17} className={`mt-0.5 shrink-0 ${alert.severity === 'high' ? 'text-rose-500' : 'text-amber-500'}`} aria-hidden="true" /><span className="flex-1"><span className="block text-xs font-semibold">{alert.name}</span><span className="mt-1 block text-[10px] text-slate-500">{alert.description}</span><span className="mt-2 block text-[9px] text-slate-400">{alert.time}</span></span><ChevronRight size={14} className="mt-1 text-slate-400" aria-hidden="true" /></button>)}</div></Panel>
<PreviewDialog details={details} onClose={() => setDetails(null)} /></>;
}
