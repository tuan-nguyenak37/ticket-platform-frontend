import { apiClient } from '@/lib/auth/session';
import type { ApiResponse } from '@/lib/interface/authInterface';
import { unwrapEventResponse } from '@/lib/events/events.api';
import type { EventFilterParams, EventItem, EventListResponse } from './events.types';

export async function getModeratorEvents(params: EventFilterParams = {}): Promise<EventListResponse> {
  const { q, status, categoryId, phase, page = 1, limit = 10 } = params;
  const response = await apiClient.get<ApiResponse<EventListResponse>>('/events/manage', {
    params: { q: q?.trim() || undefined, status: status === 'all' ? undefined : status, categoryId, phase, page, limit },
  });
  return unwrapEventResponse(response.data);
}

export const getEvents = getModeratorEvents;

export async function getEventById(eventId: string): Promise<EventItem> {
  const response = await apiClient.get<ApiResponse<EventItem>>(`/events/manage/${encodeURIComponent(eventId)}`);
  return unwrapEventResponse(response.data);
}

export async function updateEventStatus(eventId: string, status: 'published' | 'cancelled' | 'draft'): Promise<EventItem> {
  const response = await apiClient.patch<ApiResponse<EventItem>>(`/events/${encodeURIComponent(eventId)}`, { status });
  return unwrapEventResponse(response.data);
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResponse<unknown>>(`/events/${encodeURIComponent(eventId)}`);
  unwrapEventResponse(response.data);
  return true;
}

export async function createEvent(formData: FormData): Promise<EventItem> {
  const response = await apiClient.post<ApiResponse<EventItem>>('/events', formData, {
    headers: { 'Content-Type': undefined },
  });
  return unwrapEventResponse(response.data);
}
