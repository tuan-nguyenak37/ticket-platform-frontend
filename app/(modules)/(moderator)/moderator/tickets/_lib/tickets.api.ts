import { apiClient } from '@/lib/auth/session';
import { AppApiError } from '@/lib/http/http-errors';
import type { ApiResponse } from '@/lib/interface/authInterface';
import type { TicketFilters, TicketList, TicketDetail, ReviewInput, CheckStatus } from './tickets.types';
function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}
export async function getTickets(params: TicketFilters, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<TicketList>>('/tickets/manage', { params, signal })).data);
}
export async function getTicket(id: string, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<TicketDetail>>(`/tickets/manage/${encodeURIComponent(id)}`, { signal })).data);
}
export async function getTicketFile(id: string, signal?: AbortSignal) {
  return (await apiClient.get<Blob>(`/tickets/manage/${encodeURIComponent(id)}/file`, { responseType: 'blob', signal })).data;
}
export async function checkTicket(id: string) {
  return unwrap((await apiClient.post<ApiResponse<{ ticket_id: string; status: CheckStatus; version: number }>>(`/tickets/manage/${encodeURIComponent(id)}/check`)).data);
}
export async function reviewTicket(id: string, input: ReviewInput) {
  return unwrap((await apiClient.patch<ApiResponse<Omit<TicketDetail, 'event' | 'check' | 'review' | 'fileUrl'>>>(`/tickets/${encodeURIComponent(id)}/review`, input)).data);
}
