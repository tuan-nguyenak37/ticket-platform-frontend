import { apiClient } from '@/lib/auth/session';
import { createApiClient } from '@/lib/api/axios-client';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';
import type { Page } from '@/types/api';

export interface Venue {
  showingId: string; name: string; startTime: string; venueName: string; address: string; city: string;
}
export interface TicketMetadata {
  ticketId: string; ticketNumber: number; orderId: string; status: 'ACTIVE' | 'CANCELLED'; issuedAt: string;
  event: { eventId: string; title: string }; organizer: { name: string }; showing: Venue;
  ticketType: { ticketTypeId: string; name: string };
}
export interface Order {
  payment?: { paymentId: string; amount: string; processedAt: string } | null;
  orderId: string; status: string; totalAmount: string; expiresAt: string; quantity: number;
  ticketTypeName: string; unitPrice: string; createdAt: string; cancelReason: string | null;
}
export interface Listing {
  listingId: string; ticketId?: string; status: string; price: string; originalPrice: string; createdAt: string;
  event: { eventId: string; title: string }; organizer: { name: string }; showing: Venue;
  ticketType: { ticketTypeId: string; name: string };
}
export interface ResaleOrder {
  payment?: { paymentId: string; amount: string; processedAt: string } | null;
  resaleOrderId: string; listingId: string; price: string; status: string; expiresAt: string;
  cancelReason: string | null; createdAt: string;
}
const publicClient = createApiClient();
publicClient.defaults.withCredentials = false;
export async function getCommerce<T>(path: string, params?: Record<string, number>, publicView = false): Promise<T> {
  const { data } = await (publicView ? publicClient : apiClient).get<ApiResponse<T>>(`/v1/${path}`, { params });
  return unwrap(data);
}
export async function postCommerce<T>(path: string, body: unknown = {}, key?: string): Promise<T> {
  const { data } = await apiClient.post<ApiResponse<T>>(`/v1/${path}`, body, { headers: key ? { 'Idempotency-Key': key } : undefined });
  return unwrap(data);
}
export function listCommerce<T>(path: string, page: number, publicView = false) {
  return getCommerce<Page<T>>(path, { page, limit: 20 }, publicView);
}
export async function downloadTicketPdf(path: string, filename: string) {
  const response = await apiClient.get<Blob>(`/v1/${path}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function money(value: string) {
  try { return `${BigInt(value).toLocaleString('vi-VN')} đ`; } catch { return 'Giá chưa khả dụng'; }
}
export function vietnamDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
