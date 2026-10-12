'use client';
import { useQuery } from '@tanstack/react-query';
import { getTickets } from '../_lib/tickets.api';
import type { TicketFilters } from '../_lib/tickets.types';
export function useTickets(filters: TicketFilters) {
  return useQuery({ queryKey: ['moderator', 'tickets', filters], queryFn: ({ signal }) => getTickets(filters, signal) });
}
