'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTicket, checkTicket, reviewTicket } from '../_lib/tickets.api';
import type { ReviewInput } from '../_lib/tickets.types';
export function useTicketDetail(id: string) {
  const client = useQueryClient();
  const key = ['moderator', 'ticket', id];
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => getTicket(id, signal), refetchInterval: query => (query.state.dataUpdateCount ?? 0) < 100 && !query.state.error && query.state.data?.status === 'pending_review' && ['queued', 'processing'].includes(query.state.data?.check?.status ?? '') ? 3000 : false, refetchIntervalInBackground: false });
  const reconcile = async () => { await Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: ['moderator', 'tickets'] })]); };
  const check = useMutation({ mutationFn: () => checkTicket(id), retry: false, onSettled: reconcile });
  // Review returns the base ticket DTO; only the detail GET includes event/check/report.
  const review = useMutation({ mutationFn: (input: ReviewInput) => reviewTicket(id, input), retry: false, onSettled: reconcile });
  return { query, check, review };
}
