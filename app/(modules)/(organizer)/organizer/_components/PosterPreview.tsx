'use client';
import { useEffect, useState } from 'react';
import { organizerApi } from '../_lib/organizer.api';

export function PosterPreview({ url }: { url: string | null }) {
  const [source, setSource] = useState('');
  useEffect(() => {
    if (!url || !url.startsWith('/api/')) return;
    const controller = new AbortController();
    let objectUrl = '';
    void organizerApi.posterBlob(url, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); setSource(objectUrl);
    }).catch(() => {});
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);
  const display = url?.startsWith('/api/') ? source : url;
  return display ? <div className="h-44 rounded-xl bg-cover bg-center" style={{ backgroundImage: 'url(' + JSON.stringify(display) + ')' }} role="img" aria-label="Ảnh sự kiện" /> : <div className="flex h-28 items-center justify-center rounded-xl bg-white/5 text-sm tv-muted">Chưa có ảnh xem trước</div>;
}
