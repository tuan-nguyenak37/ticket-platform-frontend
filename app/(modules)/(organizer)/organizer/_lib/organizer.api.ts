import { apiClient } from '@/lib/auth/session';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';

export type Organizer = { organizerId: string; name: string; description: string | null; contactEmail: string; status: 'ACTIVE' | 'SUSPENDED'; memberRole?: string };
export type Event = { eventId: string; organizerId: string; title: string; categoryId: string; description: string | null; posterUrl: string | null; status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'; rejectionReason: string | null; updatedAt: string };
export type Category = { categoryId: string; name: string };
export type Showing = { showingId: string; eventId: string; name: string; startTime: string; endTime: string; venueName: string; address: string; city: string };
export type TicketType = { ticketTypeId: string; showingId: string; name: string; description: string | null; price: string; saleStartAt: string | null; saleEndAt: string | null; maxPerOrder: number; resaleAllowed: boolean; status: 'DRAFT' | 'ACTIVE' | 'INACTIVE'; totalQuantity: number; reservedQuantity: number; soldQuantity: number; availableQuantity: number };
export type Page<T> = { items: T[]; total: number; page: number; limit: number };
export type OrganizerInput = Pick<Organizer, 'name' | 'description' | 'contactEmail'>;
export type EventInput = Pick<Event, 'title' | 'categoryId' | 'description'> & { posterUrl?: string | null };
export type ShowingInput = Pick<Showing, 'name' | 'startTime' | 'endTime' | 'venueName' | 'address' | 'city'>;
export type TicketInput = Pick<TicketType, 'name' | 'description'> & { price: number; totalQuantity: number; saleStartAt?: string; saleEndAt?: string; maxPerOrder?: number; resaleAllowed?: boolean; status?: TicketType['status'] };
export type PayoutAccount = { bankName: string; accountHolder: string; accountNumber: string; updatedAt?: string };
export type Readiness = { ready: boolean; issues: { code: string; step: number; field: string; resourceId: string; message: string }[] };
export type Report = { totals: { orderCount: string; ticketCount: string; amount: string }; rows: { eventId: string; eventTitle: string; showingId: string; showingName: string; showingStartTime: string; ticketTypeId: string; ticketTypeName: string; orderCount: string; ticketCount: string; amount: string }[] };
export type TicketUpdate = Partial<Omit<TicketInput, 'price'> & { price: number; saleStartAt: string; saleEndAt: string; maxPerOrder: number; resaleAllowed: boolean; status: TicketType['status'] }>;
export type Discount = { discountId: string; code: string; kind: 'PERCENT' | 'FIXED'; value: number; usageLimit: number; usedOrReserved: number; startsAt: string; endsAt: string; active: boolean };
export type EventOperator = { userId: string; fullName: string; email: string };
export type Attendee = { ticketId: string; status: string; checkedInAt: string | null; fullName: string; email: string; ticketTypeName: string; showingName: string; orderId: string; answers: { questionId: string; label: string; value: string }[] };
export type Attendees = Page<Attendee> & { checkedIn: number; showings: { showingId: string; name: string }[] };

async function get<T>(path: string, signal?: AbortSignal) { return unwrap((await apiClient.get<ApiResponse<T>>(path, { signal })).data); }
async function post<T>(path: string, body?: unknown) { return unwrap((await apiClient.post<ApiResponse<T>>(path, body)).data); }
async function patch<T>(path: string, body: unknown) { return unwrap((await apiClient.patch<ApiResponse<T>>(path, body)).data); }
async function remove(path: string) { await apiClient.delete(path); }
export const organizerApi = {
  discounts: (id: string, signal?: AbortSignal) => get<Discount[]>(`/v1/events/${id}/discounts`, signal),
  createDiscount: (id: string, body: Pick<Discount, 'code' | 'kind' | 'value' | 'usageLimit' | 'startsAt' | 'endsAt'>) => post<Discount>(`/v1/events/${id}/discounts`, body),
  discountStatus: (id: string, code: string, active: boolean) => patch<Discount>(`/v1/events/${id}/discounts/${encodeURIComponent(code)}`, { active }),
  operators: (id: string, signal?: AbortSignal) => get<EventOperator[]>(`/v1/events/${id}/operators`, signal),
  addOperator: (id: string, email: string) => post<EventOperator>(`/v1/events/${id}/operators`, { email }),
  removeOperator: (id: string, userId: string) => remove(`/v1/events/${id}/operators/${encodeURIComponent(userId)}`),
  assigned: (signal?: AbortSignal) => get<{ eventId: string; title: string; organizerName: string; organizerId: string }[]>('/v1/event-operations/mine', signal),
  attendees: (id: string, page: number, showingId: string, signal?: AbortSignal) => get<Attendees>(`/v1/events/${id}/attendees?page=${page}${showingId ? '&showingId=' + encodeURIComponent(showingId) : ''}`, signal),
  exportAttendees: async (id: string, showingId: string) => (await apiClient.get<Blob>(`/v1/events/${id}/attendees/export${showingId ? '?showingId=' + encodeURIComponent(showingId) : ''}`, { responseType: 'blob' })).data,
  checkIn: (id: string, payload: string) => post<{ ticketId: string; checkedInAt: string; alreadyCheckedIn: boolean }>(`/v1/events/${id}/check-in`, { payload }),
  payout: (id: string, signal?: AbortSignal) => get<PayoutAccount | null>('/v1/organizers/' + id + '/payout-account', signal),
  savePayout: async (id: string, body: PayoutAccount) => unwrap((await apiClient.put<ApiResponse<PayoutAccount>>('/v1/organizers/' + id + '/payout-account', body)).data),
  readiness: (id: string, signal?: AbortSignal) => get<Readiness>('/v1/events/' + id + '/readiness', signal),
  report: (id: string, eventId?: string, signal?: AbortSignal) => get<Report>('/v1/organizers/' + id + (eventId ? '/events/' + eventId : '') + '/report', signal),
  uploadPoster: async (id: string, file: File) => { const body = new FormData(); body.append('file', file); return post<Event>('/v1/events/' + id + '/poster', body); },
  posterBlob: async (url: string, signal?: AbortSignal) => (await apiClient.get<Blob>(url.replace(/^\/api/, ''), { responseType: 'blob', signal })).data,

  mine: (signal?: AbortSignal) => get<Organizer[]>('/v1/organizers/mine', signal),
  create: (body: OrganizerInput) => post<Organizer>('/v1/organizers', body),
  update: (id: string, body: OrganizerInput) => patch<Organizer>(`/v1/organizers/${id}`, body),
  categories: (signal?: AbortSignal) => get<Category[]>('/v1/events/categories', signal),
  events: (id: string, page: number, signal?: AbortSignal) => get<Page<Event>>(`/v1/organizers/${id}/events?page=${page}&limit=20`, signal),
  createEvent: (id: string, body: EventInput) => post<Event>(`/v1/organizers/${id}/events`, body),
  event: (id: string, signal?: AbortSignal) => get<Event>(`/v1/events/${id}`, signal),
  updateEvent: (id: string, body: EventInput) => patch<Event>(`/v1/events/${id}`, body),
  submit: (id: string) => post<Event>(`/v1/events/${id}/submit`),
  showings: (id: string, signal?: AbortSignal) => get<Showing[]>(`/v1/events/${id}/showings`, signal),
  createShowing: (id: string, body: ShowingInput) => post<Showing>(`/v1/events/${id}/showings`, body),
  updateShowing: (id: string, body: ShowingInput) => patch<Showing>(`/v1/showings/${id}`, body),
  deleteShowing: (id: string) => remove(`/v1/showings/${id}`),
  tickets: (id: string, signal?: AbortSignal) => get<TicketType[]>(`/v1/showings/${id}/ticket-types`, signal),
  createTicket: (id: string, body: TicketInput) => post<TicketType>(`/v1/showings/${id}/ticket-types`, body),
  updateTicket: (id: string, body: TicketUpdate) => patch<TicketType>(`/v1/ticket-types/${id}`, body),
  deleteTicket: (id: string) => remove(`/v1/ticket-types/${id}`),
};

export { vnd, parseVnd, vnInput, vnWire } from './organizer.utils';
