'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEventPin } from '../_lib/pinned-events.api';

export function useEventPin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateEventPin,
    retry: false,
    onSettled: async () => {
      // Also reconcile after a conflict or a lost response; never invent a successful pin.
      await Promise.all([
        ['public', 'events'], ['public', 'event'],
        ['moderator', 'events'], ['moderator', 'event'], ['moderator', 'dashboard'],
      ].map(queryKey => client.invalidateQueries({ queryKey })));
    },
  });
}
