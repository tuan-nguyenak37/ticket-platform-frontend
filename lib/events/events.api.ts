import { createApiClient } from '@/lib/http/axios-client';
import { AppApiError } from '@/lib/http/http-errors';
import type { ApiResponse } from '@/lib/interface/authInterface';
import { ENV } from '@/lib/env';
import type { PublicEvent, EventCategory, EventList, EventPhase } from './events.types';

const publicClient = createApiClient();
export function unwrapEventResponse<T>(body: ApiResponse<T>): T {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}

export function getEventImageUrl(path?: string | null): string | null {
  if (!path) return null;
  try {
    const url = new URL(path, new URL(ENV.API_URL).origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export async function getEventCategories(signal?: AbortSignal): Promise<EventCategory[]> {
  const response = await publicClient.get<ApiResponse<EventCategory[]>>('/event-categories', { signal });
  return unwrapEventResponse(response.data);
}

export async function getPublicEventById(eventId: string, signal?: AbortSignal): Promise<PublicEvent> {
  const response = await publicClient.get<ApiResponse<PublicEvent>>(`/events/${encodeURIComponent(eventId)}`, { signal });
  return unwrapEventResponse(response.data);
}

export async function getPublicEvents(params: { q?: string; phase?: EventPhase; categoryId?: string; page?: number; limit?: number } = {}, signal?: AbortSignal): Promise<EventList> {
  const response = await publicClient.get<ApiResponse<EventList>>('/events', { params, signal });
  return unwrapEventResponse(response.data);
}

export async function getPinnedEvents(signal?: AbortSignal): Promise<PublicEvent[]> {
  const response = await publicClient.get<ApiResponse<PublicEvent[]>>('/events/pinned', { signal });
  const events = unwrapEventResponse(response.data);
  if (!Array.isArray(events)) throw new AppApiError('Dữ liệu sự kiện không đúng định dạng.');
  return events.slice(0, 4);
}
