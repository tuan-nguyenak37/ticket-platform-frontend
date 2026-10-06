import type { PublicEvent, EventPhase } from '@/lib/events/events.types';

export interface ModerationEvent {
  id: string;
  name: string;
  category: string;
  organizer: string;
  location: string;
  date: string;
  submittedAt: string;
  tickets: number;
  color: string;
}

export interface PreviewRecord {
  id: string;
  name: string;
  detail: string;
  status: string;
  time: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';

export interface EventItem extends PublicEvent {
  createdBy?: string | null;
}

export interface EventFilterParams {
  q?: string;
  status?: string;
  categoryId?: string;
  phase?: EventPhase;
  page?: number;
  limit?: number;
}

export interface EventListResponse {
  items: EventItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEventInput {
  name: string;
  description?: string;
  venueName: string;
  address: string;
  categoryId: string;
  status: 'draft' | 'published';
  startTime: string;
  endTime: string;
  banner: File | null;
}

