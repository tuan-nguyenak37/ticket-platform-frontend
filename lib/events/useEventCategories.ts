'use client';

import { useQuery } from '@tanstack/react-query';
import { getEventCategories } from './events.api';

export function useEventCategories(enabled = true) {
  return useQuery({
    queryKey: ['public', 'event-categories'],
    queryFn: ({ signal }) => getEventCategories(signal),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
