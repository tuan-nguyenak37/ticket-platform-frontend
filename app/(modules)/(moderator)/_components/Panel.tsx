import type { ReactNode } from 'react';

export function Panel({ title, eyebrow, action, children }: { title: string; eyebrow?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white"><div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6"><div>{eyebrow && <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{eyebrow}</p>}<h2 className="text-sm font-semibold">{title}</h2></div>{action}</div>{children}</section>;
}

