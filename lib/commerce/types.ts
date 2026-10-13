export type TicketStatus = 'pending_review' | 'rejected' | 'available' | 'holding' | 'sold' | 'cancelled' | 'expired';
export interface Page<T> { items: T[]; total: number; page: number; limit: number }
export interface Ticket {
  ticket_id: string; eventId: string; ticketTier: string; seatInfo: string | null;
  originalPrice: number; price: number; status: TicketStatus; description: string | null; createdAt: string;
  event: { event_id: string; name: string; startTime: string; endTime: string; venueName: string; address: string; categoryId: string; bannerUrl: string | null };
}
export interface MyTicket extends Ticket {
  updatedAt: string; reviewMethod: 'manual' | 'automatic' | null; verifiedAt: string | null; rejectionReason: string | null;
  check: { status: 'queued' | 'processing' | 'completed' | 'failed' | 'skipped'; outcome: 'passed' | 'needs_review' | null; version: number; completedAt: string | null } | null;
}
export interface TicketFilters { page?: number; limit?: number; q?: string; eventId?: string; categoryId?: string; ticketTier?: string; minPrice?: number; maxPrice?: number; sort?: 'newest' | 'price_asc' | 'price_desc' | 'event_soonest'; status?: TicketStatus }
export type OrderStatus = 'pending_payment' | 'cancelled' | 'expired' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'refund_pending' | 'refunded';
export interface Order {
  feeBasisPoints: number; platformFee: string; sellerNetAmount: string;
  order_id: string; ticketId: string; buyerId: string; sellerId: string; amount: string; currency: 'VND'; status: OrderStatus;
  ticket: { eventName: string; ticketTier: string; seatInfo: string | null; eventEndTime: string };
  expiresAt: string | null; paidAt: string | null; deliveredAt: string | null; disputeUntil: string | null; reason: string | null;
  payoutStatus: 'none' | 'pending' | 'ready' | 'paid' | 'blocked'; createdAt: string; updatedAt: string;
}
export interface DisputeAttachment {
  id: string; uploadedBy: string; side: 'buyer' | 'seller'; mimetype: string;
  size: number; createdAt: string; downloadUrl: string;
}
export interface OrderDetail extends Order {
  payment: { payment_id: string; provider: 'mock'; amount: string; currency: 'VND'; status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refund_pending' | 'refunded'; settledAt: string | null } | null;
  dispute: { dispute_id: string; reason: string; evidence: string; sellerResponse: string | null; status: 'open' | 'accepted' | 'rejected'; resolution: string | null; resolvedAt: string | null; createdAt: string; attachments: DisputeAttachment[] } | null;
}
export interface OrderFilters { page?: number; limit?: number; side?: 'buyer' | 'seller'; status?: OrderStatus }
