'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, children, onClose, busy = false, light = false, className = '' }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean; light?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={heading} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className={`tv-dialog commerce ${light ? 'commerce-light' : ''} ${className}`}>
    <header className="mb-5 flex items-start justify-between gap-4"><h2 id={heading} className="text-xl font-semibold">{title}</h2><button type="button" className="tv-icon-button shrink-0" aria-label="Đóng hộp thoại" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    {children}
  </dialog>;
}
