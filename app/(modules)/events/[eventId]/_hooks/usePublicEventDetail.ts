'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublicEventById } from '@/lib/events/events.api';

export function usePublicEventDetail(eventId: string) {
  return useQuery({
    queryKey: ['public', 'event', eventId],
    queryFn: ({ signal }) => getPublicEventById(eventId, signal),
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
