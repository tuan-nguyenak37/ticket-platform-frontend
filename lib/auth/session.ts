'use client';

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/lib/env';
import { createApiClient } from '@/lib/http/axios-client';
import { AppApiError, formatHttpError } from '@/lib/http/http-errors';
import type { AuthData, ApiResponse } from '@/lib/interface/authInterface';
import type { User } from '@/lib/interface/userInterface';
import { useAuthStore } from '@/lib/store/auth.store';

// Client riêng cho refresh/login/logout: không có interceptor tự refresh.
const sessionHttp = createApiClient();
let refreshPromise: Promise<AuthData> | null = null;
let restorePromise: Promise<void> | null = null;
let logoutPromise: Promise<void> | null = null;

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}

function sameSession(revision: number) {
  return useAuthStore.getState().revision === revision;
}

// Một refresh đang chạy được dùng chung bởi bootstrap và các request 401.
function refreshSession(): Promise<AuthData> {
  if (refreshPromise) return refreshPromise;
  const revision = useAuthStore.getState().revision;
  refreshPromise = (async () => {
    try {
      const response = await sessionHttp.post<ApiResponse<AuthData>>('/auth/refresh');
      const data = unwrap(response.data);
      if (sameSession(revision)) {
        const status = useAuthStore.getState().status;
        useAuthStore.getState().setSession(data, status === 'authenticated' ? status : 'restoring');
      }
      return data;
    } catch (error) {
      const failure = formatHttpError(error);
      if (sameSession(revision)) {
        if (failure.statusCode === 401) useAuthStore.getState().clearSession();
        else {
          useAuthStore.setState({ accessToken: null });
          useAuthStore.getState().setStatus('error', failure.message);
        }
      }
      throw failure;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export function restoreSession(): Promise<void> {
  if (logoutPromise) return logoutPromise;
  if (restorePromise) return restorePromise;
  if (useAuthStore.getState().status === 'authenticated') return Promise.resolve();
  const revision = useAuthStore.getState().revision;
  useAuthStore.getState().setStatus('restoring');
  restorePromise = (async () => {
    try {
      // Retry sau lỗi mạng ở /users/me dùng lại token vừa lấy, không refresh thừa.
      let token = useAuthStore.getState().accessToken;
      if (!token) token = (await refreshSession()).accessToken;
      if (!sameSession(revision)) return;
      const response = await sessionHttp.get<ApiResponse<User>>('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sameSession(revision)) {
        useAuthStore.getState().setSession({ accessToken: token, user: unwrap(response.data) });
      }
    } catch (error) {
      if (sameSession(revision)) {
        const failure = formatHttpError(error);
        if (failure.statusCode === 401) useAuthStore.getState().clearSession();
        else useAuthStore.getState().setStatus('error', failure.message);
      }
    } finally {
      restorePromise = null;
    }
  })();
  return restorePromise;
}

// Dùng cho form đăng nhập; refresh cookie được trình duyệt nhận từ Set-Cookie.
export async function loginSession(credentials: { email: string; password: string }) {
  if (logoutPromise) await logoutPromise;
  if (restorePromise) await restorePromise;
  if (refreshPromise) await refreshPromise.catch(() => undefined);
  const revision = useAuthStore.getState().revision;
  const response = await sessionHttp.post<ApiResponse<AuthData>>('/auth/login', credentials);
  const data = unwrap(response.data);
  if (sameSession(revision)) useAuthStore.getState().setAuth(data);
  return data;
}

// Dùng cho form đăng ký; nếu backend trả về token sẽ tự động lưu phiên
export async function registerSession(data: { email: string; password: string; fullName: string }) {
  if (logoutPromise) await logoutPromise;
  const response = await sessionHttp.post<ApiResponse<AuthData | User | { message: string }>>('/auth/register', data);
  const result = unwrap(response.data);
  if (result && typeof result === 'object' && 'accessToken' in result && (result as AuthData).accessToken) {
    const revision = useAuthStore.getState().revision;
    if (sameSession(revision)) useAuthStore.getState().setAuth(result as AuthData);
  }
  return result;
}

export function logoutSession(): Promise<void> {
  if (logoutPromise) return logoutPromise;
  let token = useAuthStore.getState().accessToken;
  const pendingRefresh = refreshPromise;
  useAuthStore.getState().clearSession();
  logoutPromise = (async () => {
    try {
      // Nếu refresh đang đổi cookie, đợi nó xong rồi mới yêu cầu BE xóa cookie.
      if (pendingRefresh) token = (await pendingRefresh).accessToken;
      if (!token) {
        token = unwrap((await sessionHttp.post<ApiResponse<AuthData>>('/auth/refresh')).data).accessToken;
      }
      try {
        await sessionHttp.post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        if (formatHttpError(error).statusCode !== 401) throw error;
        token = unwrap((await sessionHttp.post<ApiResponse<AuthData>>('/auth/refresh')).data).accessToken;
        await sessionHttp.post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      // 401: phiên đã vô hiệu. Lỗi mạng được trả về để UI không báo logout thành công giả.
      const failure = formatHttpError(error);
      if (failure.statusCode !== 401) throw failure;
    } finally {
      logoutPromise = null;
    }
  })();
  return logoutPromise;
}

type AuthRequest = InternalAxiosRequestConfig & { _retried?: boolean; _revision?: number };

// Chỉ dùng client này cho API cần Bearer token. API công khai dùng createApiClient().
export const apiClient = axios.create({
  baseURL: ENV.API_URL, timeout: 15000, withCredentials: true,
});

apiClient.interceptors.request.use(async (config: AuthRequest) => {
  if (logoutPromise) throw new AppApiError('Đang đăng xuất.', 401);
  if (useAuthStore.getState().status === 'restoring') await restoreSession();
  const state = useAuthStore.getState();
  if (config._revision !== undefined && config._revision !== state.revision) {
    throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
  }
  if (state.status !== 'authenticated' || !state.accessToken) {
    throw new AppApiError(state.error || 'Bạn chưa đăng nhập.', state.status === 'error' ? 0 : 401);
  }
  config._revision = state.revision;
  config.headers.Authorization = `Bearer ${state.accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (!sameSession((response.config as AuthRequest)._revision!)) {
      throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
    }
    return response;
  },
  async (error: unknown) => {
    const failure = formatHttpError(error);
    const config = axios.isAxiosError(error) ? error.config as AuthRequest | undefined : undefined;
    if (failure.statusCode !== 401 || !config || !sameSession(config._revision!)) throw failure;
    if (config._retried) {
      useAuthStore.getState().clearSession();
      throw failure;
    }
    config._retried = true;
    // Request cũ có thể trả 401 sau khi request khác đã refresh xong.
    const currentToken = useAuthStore.getState().accessToken;
    if (config.headers.Authorization === `Bearer ${currentToken}`) await refreshSession();
    if (!sameSession(config._revision!)) throw failure;
    return apiClient.request(config);
  }
);
