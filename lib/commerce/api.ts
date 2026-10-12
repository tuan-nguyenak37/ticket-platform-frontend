import { apiClient } from '@/lib/auth/session';
import { createApiClient } from '@/lib/http/axios-client';
import { AppApiError } from '@/lib/http/http-errors';
import type { ApiResponse } from '@/lib/interface/authInterface';
import type { MyTicket, Order, OrderDetail, OrderFilters, Page, Ticket, TicketFilters } from './types';
const publicClient = createApiClient();
const idPath = (id: string) => encodeURIComponent(id);
function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}
export async function listTickets(filters: TicketFilters, mine = false, signal?: AbortSignal) {
  return unwrap((await (mine ? apiClient : publicClient).get<ApiResponse<Page<Ticket>>>(mine ? '/tickets/me' : '/tickets', { params: filters, signal })).data);
}
export async function myTicket(id: string, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<MyTicket>>(`/tickets/me/${idPath(id)}`, { signal })).data);
}
export async function uploadTicket(body: FormData) {
  return unwrap((await apiClient.post<ApiResponse<Pick<Ticket, 'ticket_id' | 'status'>>>('/tickets', body)).data);
}
export async function cancelTicket(id: string) {
  return unwrap((await apiClient.delete<ApiResponse<Pick<Ticket, 'ticket_id' | 'status'>>>(`/tickets/${idPath(id)}`)).data);
}
export async function createOrder(ticketId: string, key: string) {
  return unwrap((await apiClient.post<ApiResponse<OrderDetail>>('/orders', { ticketId }, { headers: { 'Idempotency-Key': key } })).data);
}
export async function listOrders(filters: OrderFilters, manage: boolean, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<Page<Order>>>(manage ? '/orders/manage' : '/orders/me', { params: filters, signal })).data);
}
export async function getOrder(id: string, manage: boolean, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<OrderDetail>>(`/orders/${manage ? 'manage' : 'me'}/${idPath(id)}`, { signal })).data);
}
export type OrderAction = { path: 'cancel' } | { path: 'dispute'; body: { reason: string; evidence: string } } | { path: 'dispute/reply'; body: { response: string } } | { path: 'dispute/resolve'; body: { decision: 'accept' | 'reject'; note: string } };
export async function actOnOrder(id: string, action: OrderAction, manage: boolean) {
  return unwrap((await apiClient.post<ApiResponse<OrderDetail>>(`/orders/${manage ? 'manage' : 'me'}/${idPath(id)}/${action.path}`, 'body' in action ? action.body : undefined)).data);
}
export async function downloadOrder(id: string, signal?: AbortSignal) {
  return (await apiClient.get<Blob>(`/orders/me/${idPath(id)}/file`, { responseType: 'blob', signal })).data;
}
export async function downloadDisputeEvidence(orderId: string, attachmentId: string, signal?: AbortSignal) {
  return (await apiClient.get<Blob>(`/orders/${idPath(orderId)}/dispute/evidence/${idPath(attachmentId)}`, { responseType: 'blob', signal })).data;
}
