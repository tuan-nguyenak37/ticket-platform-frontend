import type { Page } from './types';
import { apiClient } from '@/lib/auth/session';
import { AppApiError } from '@/lib/http/http-errors';
import type { ApiResponse } from '@/lib/interface/authInterface';
import type { DemoCard, PaymentHistory, PaymentResult, Receipt, PayoutAccount, PayoutAccountInput, PaymentFilters, PaymentAttempt, TransferResult } from './payment-types';

const orderPath = (id: string) => `/orders/me/${encodeURIComponent(id)}`;
function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) throw new AppApiError(response.message, response.statusCode);
  return response.data;
}
export async function paymentHistory(id: string, signal?: AbortSignal, manage = false) {
  return unwrap((await apiClient.get<ApiResponse<PaymentHistory>>(`${manage ? `/orders/manage/${encodeURIComponent(id)}` : orderPath(id)}/payments`, { signal })).data);
}
export async function paymentReceipt(id: string, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<Receipt>>(`${orderPath(id)}/receipt`, { signal })).data);
}
export async function startPayment(id: string, key: string) {
  return unwrap((await apiClient.post<ApiResponse<PaymentResult>>(`${orderPath(id)}/payments`, undefined, { headers: { 'Idempotency-Key': key } })).data);
}
export async function confirmPayment(id: string, paymentId: string, card: DemoCard) {
  return unwrap((await apiClient.post<ApiResponse<PaymentResult>>(`${orderPath(id)}/payments/${encodeURIComponent(paymentId)}/confirm`, card)).data);
}
export async function cancelPayment(id: string, paymentId: string) {
  return unwrap((await apiClient.post<ApiResponse<PaymentResult>>(`${orderPath(id)}/payments/${encodeURIComponent(paymentId)}/cancel`)).data);
}
export function attemptStorageKey(buyer: string, order: string) { return `ticketverse:payment:${buyer}:${order}`; }
export function attemptKey(buyer: string, order: string) {
  const name = attemptStorageKey(buyer, order);
  const saved = sessionStorage.getItem(name);
  if (saved && /^[A-Za-z0-9_-]{8,80}$/.test(saved)) return saved;
  const key = crypto.randomUUID(); sessionStorage.setItem(name, key); return key;
}

export async function listPayments(params: PaymentFilters, signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<Page<PaymentAttempt>>>('/orders/manage/payments', { params, signal })).data);
}
export async function getPayoutAccount(signal?: AbortSignal) {
  return unwrap((await apiClient.get<ApiResponse<PayoutAccount | null>>('/users/me/payout-account', { signal })).data);
}
export async function savePayoutAccount(body: PayoutAccountInput) {
  return unwrap((await apiClient.put<ApiResponse<PayoutAccount>>('/users/me/payout-account', body)).data);
}
export async function transferOrder(id: string, kind: 'refund' | 'payout', reason: string, key: string) {
  return unwrap((await apiClient.post<ApiResponse<TransferResult>>(`/orders/manage/${encodeURIComponent(id)}/${kind}/mock`, { reason }, { headers: { 'Idempotency-Key': key } })).data);
}
