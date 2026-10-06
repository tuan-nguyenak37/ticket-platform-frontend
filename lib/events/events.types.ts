export type EventStatus = 'draft' | 'published' | 'cancelled';
export type EventPhase = 'upcoming' | 'ongoing' | 'ended';

export interface PublicEvent {
  event_id: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  categoryId: string;
  status: EventStatus;
  isPinned: boolean;
  pinnedAt: string | null;
  phase: EventPhase;
  createdAt: string;
  updatedAt: string;
}

export interface EventList<T = PublicEvent> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface EventCategory {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}
