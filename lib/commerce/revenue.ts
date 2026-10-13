import { apiClient } from '@/lib/auth/session';
import { AppApiError } from '@/lib/http/http-errors';
import type { ApiResponse } from '@/lib/interface/authInterface';
import type { Order, Page } from './types';

export const revenueLabels = {
  waiting_settlement: 'Chờ hoàn tất giao dịch',
  awaiting_account: 'Chờ bổ sung tài khoản',
  ready: 'Chờ chi trả',
  paid: 'Đã chi trả',
  blocked: 'Tạm dừng chi trả',
  refund_pending: 'Chờ hoàn tiền cho người mua',
  refunded: 'Đã hoàn tiền cho người mua',
} as const;
export type RevenueStatus = keyof typeof revenueLabels;
export interface RevenueOrder extends Order {
  revenueStatus: RevenueStatus;
  transferId: string | null;
  transferRecordedAt: string | null;
  legacyTransfer: boolean | null;
}
export interface Revenue extends Page<RevenueOrder> {
  currency: 'VND'; isMock: boolean;
  payoutAccountConfigured: boolean;
  requiredAction: 'add_payout_account' | null;
  automaticPayoutsEnabled: boolean;
  summary: {
    totalOrders: number;
    waitingSettlementAmount: string; awaitingAccountAmount: string;
    readyAmount: string; paidAmount: string; blockedAmount: string;
    refundPendingAmount: string; refundedAmount: string;
  };
}
export const revenueBuckets: { status: RevenueStatus; amount: Exclude<keyof Revenue['summary'], 'totalOrders'> }[] = [
  { status: 'waiting_settlement', amount: 'waitingSettlementAmount' },
  { status: 'awaiting_account', amount: 'awaitingAccountAmount' },
  { status: 'ready', amount: 'readyAmount' },
  { status: 'paid', amount: 'paidAmount' },
  { status: 'blocked', amount: 'blockedAmount' },
  { status: 'refund_pending', amount: 'refundPendingAmount' },
  { status: 'refunded', amount: 'refundedAmount' },
];
export async function getRevenue(params: { page: number; limit: number; status?: RevenueStatus }, signal?: AbortSignal) {
  const { data } = await apiClient.get<ApiResponse<Revenue>>('/orders/me/revenue', { params, signal });
  if (!data.success) throw new AppApiError(data.message, data.statusCode);
  return data.data;
}
