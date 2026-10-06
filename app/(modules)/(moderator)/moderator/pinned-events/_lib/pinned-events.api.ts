import { apiClient } from '@/lib/auth/session';
import { unwrapEventResponse } from '@/lib/events/events.api';
import type { PublicEvent } from '@/lib/events/events.types';
import type { ApiResponse } from '@/lib/interface/authInterface';

export async function updateEventPin({ eventId, isPinned }: { eventId: string; isPinned: boolean }): Promise<PublicEvent> {
  const response = await apiClient.patch<ApiResponse<PublicEvent>>(`/events/${encodeURIComponent(eventId)}/pin`, { isPinned });
  return unwrapEventResponse(response.data);
}
