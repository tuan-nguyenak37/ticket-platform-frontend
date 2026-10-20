export type Recipient = { name: string; email: string; phone: string };
export type CheckoutSession = {
  sessionId: string; orderId: string; kind: 'orders' | 'resale';
  method: 'CARD' | 'WALLET' | 'BANK_TRANSFER';
  status: 'AWAITING_AUTH' | 'VERIFIED' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  amount: string; currency: string; recipient: Recipient;
  instrument: { label: string; last4: string };
  item: { name: string; quantity: number; unitPrice: string };
  attemptsRemaining: number; expiresAt: string; createdAt: string;
  processedAt: string | null; paymentId: string | null; failureCode: string | null;
};
export type CheckoutHistory = { current: CheckoutSession | null; history: CheckoutSession[] };
export type Receipt = CheckoutSession & { receiptNumber: string; issuedAt: string };
export const paymentLabels = { CARD: 'Thẻ thanh toán', WALLET: 'Ví điện tử', BANK_TRANSFER: 'Chuyển khoản ngân hàng' };
export const transactionLabels: Record<CheckoutSession['status'], string> = {
  AWAITING_AUTH: 'Chờ xác thực', VERIFIED: 'Đang xử lý', SUCCEEDED: 'Thành công', FAILED: 'Thất bại', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn',
};
