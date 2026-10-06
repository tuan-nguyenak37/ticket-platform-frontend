'use client';

import { useQuery } from '@tanstack/react-query';
import { getPinnedEvents } from './events.api';

export function usePinnedEvents() {
  return useQuery({
    queryKey: ['public', 'events', 'pinned'],
    queryFn: ({ signal }) => getPinnedEvents(signal),
    staleTime: 60_000,
    retry: 1,
  });
}
