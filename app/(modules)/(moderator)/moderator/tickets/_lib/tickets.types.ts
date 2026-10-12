export type TicketStatus = 'pending_review' | 'rejected' | 'available' | 'holding' | 'sold' | 'cancelled' | 'expired';
export type CheckStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';
export type ReviewMethod = 'automatic' | 'manual';
export interface CheckSummary { status: CheckStatus; outcome: 'passed' | 'needs_review' | null; version: number; errorCode: string | null }
export interface Evidence { text: string; confidence: number; page: number; box: number[] }
export interface Report {
  outcome: 'passed' | 'needs_review'; reasons: string[];
  fields: { field: string; expected: string | null; observed: string | null; status: 'match' | 'mismatch' | 'missing' | 'uncertain'; confidence: number; evidence: Evidence[] }[];
  duplicates: { ticketId: string; status: TicketStatus; kind: 'file' | 'code' }[];
}
export interface TicketItem {
  ticket_id: string; eventId: string; sellerId: string; ticketTier: string; seatInfo: string | null;
  originalPrice: number; price: number; status: TicketStatus; description: string | null;
  verifiedBy?: string; verifiedAt?: string; rejectionReason?: string; buyerId?: string; soldAt?: string;
  createdAt: string; updatedAt: string; reviewMethod: ReviewMethod | null; check: CheckSummary | null;
  event: { event_id: string; name: string; bannerUrl: string | null; startTime: string; endTime: string; venueName: string; address: string; categoryId: string };
}
export interface TicketDetail extends TicketItem {
  fileUrl: string;
  check: (CheckSummary & { attempts: number; completedAt: string | null; engineVersion: string | null; codes: { id: string; format: string; page: number; box: number[] }[]; report: Report | null }) | null;
  review: { decision: 'approve' | 'reject'; method: ReviewMethod; actorId: string | null; checkVersion: number | null; selectedCodeId: string | null; note: string | null; createdAt: string; report: Report | null } | null;
}
export interface TicketFilters { q?: string; eventId?: string; categoryId?: string; ticketTier?: string; minPrice?: number; maxPrice?: number; status?: TicketStatus; checkStatus?: CheckStatus; reviewMethod?: ReviewMethod; page?: number; limit?: number }
export interface TicketList { items: TicketItem[]; total: number; page: number; limit: number }
export type ReviewInput = { decision: 'approve'; checkVersion: number; selectedCodeId: string; note?: string } | { decision: 'reject'; reason: string };
