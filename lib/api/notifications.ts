import { apiClient } from '@/lib/auth/session';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';

export type WebNotification = {
  id: string;
  kind: 'ORDER_PAID' | 'RESALE_BOUGHT' | 'RESALE_SOLD' | 'EVENT_APPROVED' | 'EVENT_REJECTED';
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};
export type NotificationPage = { items: WebNotification[]; total: number; unreadCount: number; page: number; limit: number };

export const notificationsApi = {
  list: async (page: number, signal?: AbortSignal) => unwrap((await apiClient.get<ApiResponse<NotificationPage>>('/v1/notifications', { params: { page }, signal })).data),
  read: async (id: string) => unwrap((await apiClient.patch<ApiResponse<unknown>>(`/v1/notifications/${encodeURIComponent(id)}/read`)).data),
  readAll: async () => unwrap((await apiClient.patch<ApiResponse<unknown>>('/v1/notifications/read-all')).data),
};
