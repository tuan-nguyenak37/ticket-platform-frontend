'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventById, updateEventStatus } from '../../_lib/events.api';

export function useEventDetail(eventId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['moderator', 'event', eventId],
    queryFn: () => getEventById(eventId),
    enabled: Boolean(eventId),
  });

  const mutation = useMutation({
    mutationFn: (status: 'published' | 'cancelled' | 'draft') =>
      updateEventStatus(eventId, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['public', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'event'] });
      queryClient.setQueryData(['moderator', 'event', eventId], updated);
      queryClient.invalidateQueries({ queryKey: ['moderator', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['moderator', 'dashboard'] });
    },
  });

  return {
    ...query,
    updateStatus: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
