import { apiClient } from '@/lib/auth/session';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';
import type { User } from '@/lib/auth/types/userInterface';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
}

export interface UpdateUserInput {
  full_name?: string;
  phone_number?: string | null;
}

export interface UpdateStatusInput {
  status: 'ACTIVE' | 'SUSPENDED';
  reason: string;
}

export interface AdminSummary {
  users: string;
  moderators: string;
  organizers: string;
  pendingEvents: string;
  publishedEvents: string;
  paidOrders: string;
  paidResaleOrders: string;
  reviewPayments: string;
}

export interface UpdateRoleInput {
  role: 'USER' | 'MODERATOR';
  expectedRole: 'USER' | 'MODERATOR';
  reason: string;
}

export interface StatisticsFilter {
  dateFrom: string;
  dateTo: string;
  groupBy: 'day' | 'month';
}

export interface AdminStatistics extends StatisticsFilter {
  timeZone: string;
  series: { period: string; originalOrders: string; resaleOrders: string; originalAmount: string; resaleAmount: string }[];
  topEvents: { eventId: string; title: string; originalTickets: string; resaleTickets: string }[];
  payments: { kind: 'orders' | 'resale'; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REVIEW'; count: string }[];
}

export const adminApi = {
  summary: async () => unwrap((await apiClient.get<ApiResponse<AdminSummary>>('/users/admin-summary')).data),
  statistics: async (params: StatisticsFilter, signal?: AbortSignal) => unwrap((await apiClient.get<ApiResponse<AdminStatistics>>('/users/admin-statistics', { params, signal })).data),
  users: async () => unwrap((await apiClient.get<ApiResponse<User[]>>('/users')).data),
  user: async (id: string) => unwrap((await apiClient.get<ApiResponse<User>>(`/users/${encodeURIComponent(id)}`)).data),
  createUser: async (body: CreateUserInput) => unwrap((await apiClient.post<ApiResponse<User>>('/users', body)).data),
  updateUser: async (id: string, body: UpdateUserInput) => unwrap((await apiClient.patch<ApiResponse<User>>(`/users/${encodeURIComponent(id)}`, body)).data),
  updateStatus: async (id: string, body: UpdateStatusInput) => unwrap((await apiClient.patch<ApiResponse<User>>(`/users/${encodeURIComponent(id)}/status`, body)).data),
  updateRole: async (id: string, body: UpdateRoleInput) => unwrap((await apiClient.patch<ApiResponse<User>>(`/users/${encodeURIComponent(id)}/role`, body)).data),
};
