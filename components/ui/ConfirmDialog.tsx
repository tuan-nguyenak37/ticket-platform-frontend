'use client';
import { useRef, useState } from 'react';
import { Dialog } from './Dialog';
import { Failure } from './commerce';

export function ConfirmDialog({ title, description, confirmLabel, onClose, onConfirm, light = true }: {
  title: string; description: string; confirmLabel: string; onClose: () => void; onConfirm: () => Promise<unknown>; light?: boolean;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await onConfirm(); onClose(); } catch (failure) { setError(failure); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Dialog title={title} busy={busy} light={light} onClose={onClose}><p className="mb-5 text-sm leading-6">{description}</p>{error != null && <Failure error={error} />}<div className="mt-6 flex flex-wrap justify-end gap-3"><button className="tv-button" disabled={busy} onClick={onClose}>Quay lại</button><button className="tv-button tv-primary" disabled={busy} onClick={() => void confirm()}>{busy ? 'Đang xử lý…' : confirmLabel}</button></div></Dialog>;
}
