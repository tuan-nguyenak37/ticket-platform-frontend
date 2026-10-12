import { apiClient } from '@/lib/auth/session';
import { AppApiError } from '@/lib/http/http-errors';
import type { ApiResponse } from '@/lib/interface/authInterface';
import type { User } from '@/lib/interface/userInterface';

export type ManagedUser = User & { moderation?: { reason: string | null; changedBy: string | null; changedAt: string | null } };
export type AccountStatus = 'active' | 'suspended' | 'banned';
function unwrap<T>(body: ApiResponse<T>) {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}
export async function getProfile(signal?: AbortSignal) { return unwrap((await apiClient.get<ApiResponse<User>>('/users/me', { signal })).data); }
export async function listUsers(signal?: AbortSignal) { return unwrap((await apiClient.get<ApiResponse<ManagedUser[]>>('/users', { signal })).data); }
export async function getUser(id: string, signal?: AbortSignal) { return unwrap((await apiClient.get<ApiResponse<ManagedUser>>(`/users/${encodeURIComponent(id)}`, { signal })).data); }
export async function saveName(fullName: string, id?: string) { return unwrap((await apiClient.patch<ApiResponse<ManagedUser>>(id ? `/users/${encodeURIComponent(id)}` : '/users/me', { fullName: fullName.trim() })).data); }
export async function createUser(body: { email: string; password: string; fullName?: string }) { return unwrap((await apiClient.post<ApiResponse<ManagedUser>>('/users', body)).data); }
export async function setUserStatus(id: string, status: AccountStatus, reason: string) { return unwrap((await apiClient.patch<ApiResponse<ManagedUser>>(`/users/${encodeURIComponent(id)}/status`, { status, reason: reason.trim() })).data); }
export async function changePassword(currentPassword: string, newPassword: string) { return unwrap((await apiClient.patch<ApiResponse<{ message: string }>>('/users/me/password', { currentPassword, newPassword })).data); }
