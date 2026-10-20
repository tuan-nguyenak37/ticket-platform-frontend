import { apiClient } from '@/lib/auth/session';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';

export type EventStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
export type ReviewAction = 'APPROVED' | 'REJECTED';

export type ModerationEventSummary = {
  eventId: string;
  organizerId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string | null;
  posterUrl: string | null;
  status: EventStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ModerationEventDetail = ModerationEventSummary & {
  organizer: {
    organizerId: string;
    name: string;
    status: 'ACTIVE' | 'SUSPENDED';
  };
  isOwnEvent: boolean;
};

export type Category = { categoryId: string; code: string; name: string };
export type Showing = { showingId: string; eventId: string; name: string; startTime: string; endTime: string; venueName: string; address: string; city: string };
export type TicketType = { ticketTypeId: string; showingId: string; name: string; description: string | null; price: string; totalQuantity: number; reservedQuantity: number; soldQuantity: number; availableQuantity: number; status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' };

export type ReviewHistoryItem = {
  reviewId: string;
  eventId: string;
  eventTitle: string | null;
  moderatorId: string;
  moderatorName: string | null;
  action: ReviewAction;
  reason: string | null;
  createdAt: string;
};

export type Page<T> = { items: T[]; total: number; page: number; limit: number };

async function get<T>(path: string, signal?: AbortSignal) { return unwrap((await apiClient.get<ApiResponse<T>>(path, { signal })).data); }
async function post<T>(path: string, body?: unknown) { return unwrap((await apiClient.post<ApiResponse<T>>(path, body)).data); }

export const moderationApi = {
  categories: (signal?: AbortSignal) => get<Category[]>('/v1/events/categories', signal),
  pendingEvents: ({ page, q, categoryId }: { page: number; q?: string; categoryId?: string }, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q?.trim()) params.set('q', q.trim());
    if (categoryId) params.set('categoryId', categoryId);
    return get<Page<ModerationEventSummary>>('/v1/moderation/events?' + params.toString(), signal);
  },
  eventDetail: (eventId: string, signal?: AbortSignal) => get<ModerationEventDetail>('/v1/moderation/events/' + eventId, signal),
  showings: (eventId: string, signal?: AbortSignal) => get<Showing[]>('/v1/events/' + eventId + '/showings', signal),
  ticketTypes: (showingId: string, signal?: AbortSignal) => get<TicketType[]>('/v1/showings/' + showingId + '/ticket-types', signal),
  approve: (eventId: string) => post<ModerationEventSummary>('/v1/moderation/events/' + eventId + '/approve'),
  reject: (eventId: string, reason: string) => post<ModerationEventSummary>('/v1/moderation/events/' + eventId + '/reject', { reason }),
  history: ({ page, eventId, action }: { page: number; eventId?: string; action?: ReviewAction }, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (eventId) params.set('eventId', eventId);
    if (action) params.set('action', action);
    return get<Page<ReviewHistoryItem>>('/v1/moderation/events/history?' + params.toString(), signal);
  },
};
