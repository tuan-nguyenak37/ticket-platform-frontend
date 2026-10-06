'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, updateEventStatus, deleteEvent, createEvent } from '../_lib/events.api';
import type { EventFilterParams } from '../_lib/events.types';

export function useEvents(params: EventFilterParams = {}) {
  return useQuery({
    queryKey: ['moderator', 'events', params],
    queryFn: () => getEvents(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createEvent(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['moderator', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'event'] });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      status,
    }: {
      eventId: string;
      status: 'published' | 'cancelled' | 'draft';
    }) => updateEventStatus(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['moderator', 'event'] });
      queryClient.invalidateQueries({ queryKey: ['moderator', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'event'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['moderator', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'event'] });
    },
  });
}
