import type { OrderDetail } from './types';

export interface DemoCard { cardNumber: string; holderName: string; expiryMonth: number; expiryYear: number; cvv: string }
export interface PaymentAttempt {
  payment_id: string; orderId: string; provider: 'mock'; attemptNumber: number;
  amount: string; currency: 'VND'; status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refund_pending' | 'refunded';
  receivedResult: 'success' | 'failed' | 'cancelled' | null; failureCode: string | null;
  createdAt: string; settledAt: string | null;
  card?: { holderName: string; brand: string; last4: string; expiryMonth: number; expiryYear: number } | null;
}
export interface PaymentHistory {
  order: OrderDetail; isMock: true; payments: PaymentAttempt[];
  transfers: { id: string; paymentId: string; kind: 'refund' | 'payout'; amount: string; currency: string; actorId: string | null; reason: string; legacy: boolean; recordedAt: string; bank?: { bankCode: string; accountName: string; last4: string } }[];
  events: { id: string; paymentId: string | null; kind: string; actorId: string | null; reason: string | null; createdAt: string }[];
}
export interface Receipt extends PaymentHistory { receiptId: string; notice: string }
export type PaymentResult = OrderDetail & { payment: PaymentAttempt; isMock: true };

export interface PayoutAccountInput { bankCode: 'DEMO_VCB' | 'DEMO_TCB' | 'DEMO_MB'; accountName: string; accountNumber: string }
export interface PayoutAccount extends PayoutAccountInput { updatedAt: string; isMock: true }
export interface PaymentFilters { page: number; limit: number; orderId?: string; status?: PaymentAttempt['status']; from?: string; to?: string }
export type TransferResult = OrderDetail & { transfer: PaymentHistory['transfers'][number]; isMock: true };
