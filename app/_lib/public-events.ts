import { ENV } from '@/config/env';
import { createApiClient } from '@/lib/api/axios-client';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';
import type { Page } from '@/types/api';

export interface PublicEvent {
  eventId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string | null;
  posterUrl: string | null;
  createdAt: string;
  nextShowingAt?: string | null;
  minPrice?: string | null;
}

export interface EventCategory {
  categoryId: string;
  code: string;
  name: string;
}

const client = createApiClient();
client.defaults.withCredentials = false;

export async function listPublicEvents(params: { page?: number; limit?: number; q?: string; categoryId?: string } = {}) {
  const { data } = await client.get<ApiResponse<Page<PublicEvent>>>('/v1/events', { params });
  const result = unwrap(data);
  return { ...result, items: result.items.map(normalizePoster) };
}

function normalizePoster(event: PublicEvent): PublicEvent { return { ...event, posterUrl: event.posterUrl?.startsWith('/api/') ? ENV.API_URL.replace(/\/api\/?$/, '') + event.posterUrl : event.posterUrl }; }

export async function listCategories() {
  const { data } = await client.get<ApiResponse<EventCategory[]>>('/v1/events/categories');
  return unwrap(data);
}

export async function getPublicEvent(eventId: string) {
  const { data } = await client.get<ApiResponse<PublicEvent>>(`/v1/events/${encodeURIComponent(eventId)}`);
  return normalizePoster(unwrap(data));
}

export interface PublicShowing {
  showingId: string;
  name: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  city: string;
}

export interface PublicTicketType {
  ticketTypeId: string;
  name: string;
  description: string | null;
  price: string;
  maxPerOrder: number;
  availableQuantity: number;
  saleStartAt: string | null;
  saleEndAt: string | null;
}

export async function listPublicShowings(eventId: string) {
  const { data } = await client.get<ApiResponse<PublicShowing[]>>(`/v1/events/${encodeURIComponent(eventId)}/showings`);
  return unwrap(data);
}

export async function listPublicTicketTypes(showingId: string) {
  const { data } = await client.get<ApiResponse<PublicTicketType[]>>(`/v1/showings/${encodeURIComponent(showingId)}/ticket-types`);
  return unwrap(data);
}

