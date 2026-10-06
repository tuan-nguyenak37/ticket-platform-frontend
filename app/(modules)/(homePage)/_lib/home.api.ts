import { getPublicEvents } from '@/lib/events/events.api';
import type { PublicEventList } from './home.types';

export async function searchPublicEvents(query: string, signal?: AbortSignal): Promise<PublicEventList> {
  return getPublicEvents({ q: query, page: 1, limit: 12 }, signal);
}
