'use client';

import { useEffect, useState } from 'react';

export function useBannerCarousel(ids: string[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const found = ids.indexOf(selectedId ?? '');
  const index = found < 0 ? 0 : found;
  const activeId = ids[index];
  const canPlay = ids.length > 1 && !paused && !focused && visible && !reducedMotion;
  const signature = ids.join('|');

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () => setVisible(!document.hidden);
    syncMotion(); syncVisibility();
    media.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      media.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!canPlay) return;
    const items = signature.split('|');
    const timer = window.setInterval(() => {
      setSelectedId(current => {
        const currentIndex = items.indexOf(current ?? activeId);
        return items[(Math.max(0, currentIndex) + 1) % items.length];
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [canPlay, signature, activeId]);

  return {
    index, paused, reducedMotion, setPaused, setFocused,
    select: (next: number) => { if (ids.length) setSelectedId(ids[(next + ids.length) % ids.length]); },
  };
}
