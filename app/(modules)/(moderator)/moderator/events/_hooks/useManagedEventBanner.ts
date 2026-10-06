'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/auth/session';
import type { EventItem } from '../_lib/events.types';

export function useManagedEventBanner(event: EventItem) {
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);
  const key = `${event.event_id}:${event.updatedAt}:${event.bannerUrl}`;

  useEffect(() => {
    if (!event.bannerUrl) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    // Draft images require a Bearer header, which a normal img request cannot send.
    void apiClient.get<Blob>(`/events/manage/${encodeURIComponent(event.event_id)}/images/banner`, {
      responseType: 'blob', signal: controller.signal,
    }).then(response => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(response.data);
      setImage({ key, url: objectUrl });
    }).catch(() => {
      if (!controller.signal.aborted) setImage(null);
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [event.event_id, event.bannerUrl, key]);

  return image?.key === key ? image.url : null;
}
