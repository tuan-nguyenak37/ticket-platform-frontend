'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublicEvents } from '@/lib/events/events.api';

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['public', 'events', 'upcoming'],
    queryFn: ({ signal }) => getPublicEvents({ phase: 'upcoming', limit: 12 }, signal),
    staleTime: 60_000,
    retry: 1,
  });
}
