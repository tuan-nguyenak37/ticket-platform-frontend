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

export const adminApi = {
  users: async () => unwrap((await apiClient.get<ApiResponse<User[]>>('/users')).data),
  user: async (id: string) => unwrap((await apiClient.get<ApiResponse<User>>(`/users/${encodeURIComponent(id)}`)).data),
  createUser: async (body: CreateUserInput) => unwrap((await apiClient.post<ApiResponse<User>>('/users', body)).data),
  updateUser: async (id: string, body: UpdateUserInput) => unwrap((await apiClient.patch<ApiResponse<User>>(`/users/${encodeURIComponent(id)}`, body)).data),
  updateStatus: async (id: string, body: UpdateStatusInput) => unwrap((await apiClient.patch<ApiResponse<User>>(`/users/${encodeURIComponent(id)}/status`, body)).data),
};
