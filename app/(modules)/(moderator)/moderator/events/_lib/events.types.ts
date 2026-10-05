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

export interface EventItem {
  event_id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  categoryId?: string;
  categoryName?: string;
  status: 'draft' | 'published' | 'cancelled';
  phase?: string;
  createdAt: string;
  updatedAt: string;
  ticketsCount?: number;
  organizerName?: string;
}

export interface EventFilterParams {
  q?: string;
  status?: string;
  category?: string;
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
  shortDescription?: string;
  description?: string;
  venueName: string;
  address: string;
  categoryId: string;
  status: 'draft' | 'published';
  startTime: string;
  endTime: string;
  thumbnail: File | null;
  banner: File | null;
}

