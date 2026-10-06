'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublicEvents } from '@/lib/events/events.api';

export function usePinCandidates() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ q: string; phase: 'upcoming' | 'ongoing'; page: number }>({ q: '', phase: 'upcoming', page: 1 });
  useEffect(() => {
    const timer = setTimeout(() => setFilters(current => current.q === search.trim() ? current : { ...current, q: search.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ['public', 'events', 'pin-candidates', filters],
    queryFn: ({ signal }) => getPublicEvents({ ...filters, limit: 10 }, signal),
  });
  return {
    ...query, search, setSearch, ...filters,
    isDebouncing: search.trim() !== filters.q,
    setPhase: (phase: 'upcoming' | 'ongoing') => setFilters(current => ({ ...current, phase, page: 1 })),
    setPage: (page: number) => setFilters(current => ({ ...current, page })),
  };
}
