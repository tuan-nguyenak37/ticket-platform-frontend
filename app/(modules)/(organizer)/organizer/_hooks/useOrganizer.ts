'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { formatHttpError } from '@/lib/api/http-errors';
import { organizerApi } from '../_lib/organizer.api';

export function useOrganizer(organizerId?: string, eventId?: string, showingId?: string, page = 1) {
  const userId = useAuthStore(state => state.user?.user_id);
  const revision = useAuthStore(state => state.revision);
  const authenticated = useAuthStore(state => state.status === 'authenticated');
  const client = useQueryClient();
  const root = ['organizer', userId, revision] as const;
  const mine = useQuery({ queryKey: [...root, 'mine'], queryFn: ({ signal }) => organizerApi.mine(signal), enabled: authenticated });
  const owner = mine.data?.find(item => item.organizerId === organizerId && item.memberRole === 'OWNER');
  const categories = useQuery({ queryKey: [...root, 'categories'], queryFn: ({ signal }) => organizerApi.categories(signal), enabled: !!owner });
  const events = useQuery({ queryKey: [...root, organizerId, 'events', page], queryFn: ({ signal }) => organizerApi.events(organizerId!, page, signal), enabled: !!owner && !eventId });
  const event = useQuery({ queryKey: [...root, organizerId, 'event', eventId], queryFn: ({ signal }) => organizerApi.event(eventId!, signal), enabled: !!owner && !!eventId });
  const validEvent = event.data?.organizerId === organizerId;
  const showings = useQuery({ queryKey: [...root, organizerId, 'showings', eventId], queryFn: ({ signal }) => organizerApi.showings(eventId!, signal), enabled: !!owner && !!eventId && validEvent });
  const showing = showings.data?.find(item => item.showingId === showingId);
  const tickets = useQuery({ queryKey: [...root, organizerId, 'tickets', showingId], queryFn: ({ signal }) => organizerApi.tickets(showingId!, signal), enabled: !!owner && !!showing });
  async function mutate<T>(action: () => Promise<T>) {
    if (!authenticated || useAuthStore.getState().revision !== revision) throw new Error('Phiên đã thay đổi. Vui lòng tải lại trang.');
    try {
      const result = await action();
      if (useAuthStore.getState().revision !== revision) throw new Error('Phiên đã thay đổi.');
      await Promise.all([
        client.invalidateQueries({ queryKey: root }),
        client.invalidateQueries({ predicate: query => query.queryKey[0] === 'public' && ['events', 'event', 'showings', 'ticket-types'].includes(String(query.queryKey[1])) }),
      ]);
      if (useAuthStore.getState().revision !== revision) throw new Error('Phiên đã thay đổi.');
      return result;
    } catch (error) {
      if (useAuthStore.getState().revision === revision) await client.invalidateQueries({ queryKey: root });
      if (useAuthStore.getState().revision !== revision) throw new Error('Phiên đã thay đổi. Vui lòng đăng nhập lại.');
      if (formatHttpError(error).statusCode === 409) {
        await client.invalidateQueries({ queryKey: ['public'] });
        throw new Error('Dữ liệu đã thay đổi hoặc thao tác không còn hợp lệ. Đã yêu cầu tải lại trạng thái mới; vui lòng kiểm tra trước khi thử lại.');
      }
      throw error;
    }
  }
  return { mine, owner, categories, events, event, showings, showing, tickets, mutate, revision, root };
}

