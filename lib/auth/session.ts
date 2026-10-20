'use client';

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';
import { createApiClient } from '@/lib/api/axios-client';
import { AppApiError, formatHttpError } from '@/lib/api/http-errors';
import type { AuthData, ApiResponse } from '@/lib/auth/types/authInterface';
import type { User } from '@/lib/auth/types/userInterface';
import { useAuthStore } from '@/lib/auth/auth.store';

// Client riêng cho refresh/login/logout: không có interceptor tự refresh.
const sessionHttp = createApiClient();
let refreshPromise: Promise<AuthData> | null = null;
let restorePromise: Promise<void> | null = null;
let logoutPromise: Promise<void> | null = null;
let loginPromise: Promise<AuthData> | null = null;
let sessionChannel: BroadcastChannel | null = null;
let authAttempt = 0;

async function withCookieLock<T>(action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('ticketverse-auth-cookie', action);
  }
  return action();
}

function notifyTabs(event: 'login' | 'logout') {
  sessionChannel?.postMessage(event);
}

export function subscribeToSessionChanges() {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel('ticketverse-session');
  sessionChannel = channel;
  channel.onmessage = ({ data }: MessageEvent<unknown>) => {
    if (data !== 'login' && data !== 'logout') return;
    authAttempt += 1;
    useAuthStore.getState().clearSession();
    if (data === 'login') {
      void Promise.allSettled([restorePromise, refreshPromise].filter(promise => promise !== null))
        .then(() => restoreSession());
    }
  };
  return () => {
    if (sessionChannel === channel) sessionChannel = null;
    channel.close();
  };
}

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
      const response = await withCookieLock(() => sessionHttp.post<ApiResponse<AuthData>>('/auth/refresh'));
      const data = unwrap(response.data);
      if (sameSession(revision)) {
        const status = useAuthStore.getState().status;
        const previousUser = useAuthStore.getState().user;
        if (previousUser && previousUser.user_id !== data.user.user_id) {
          useAuthStore.getState().setAuth(data);
        } else {
          useAuthStore.getState().setSession(data, status === 'authenticated' ? status : 'restoring');
        }
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
      const hadCachedToken = Boolean(token);
      if (!token) token = (await refreshSession()).accessToken;
      if (!sameSession(revision)) return;
      let response;
      try {
        response = await sessionHttp.get<ApiResponse<User>>('/users/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
      } catch (error) {
        if (!hadCachedToken || formatHttpError(error).statusCode !== 401 || !sameSession(revision)) throw error;
        token = (await refreshSession()).accessToken;
        if (!sameSession(revision)) return;
        response = await sessionHttp.get<ApiResponse<User>>('/users/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
      }
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
export function loginSession(credentials: { email: string; password: string }): Promise<AuthData> {
  if (loginPromise) return loginPromise;
  const attempt = ++authAttempt;
  const pendingLogout = logoutPromise;
  loginPromise = (async () => {
    if (pendingLogout) await pendingLogout;
    if (restorePromise) await restorePromise;
    if (refreshPromise) await refreshPromise.catch(() => undefined);
    if (attempt !== authAttempt) throw new AppApiError('Yêu cầu đăng nhập đã bị hủy.', 401);
    const revision = useAuthStore.getState().revision;
    const response = await withCookieLock(() => sessionHttp.post<ApiResponse<AuthData>>('/auth/login', credentials));
    const data = unwrap(response.data);
    if (attempt !== authAttempt || !sameSession(revision)) throw new AppApiError('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.', 401);
    useAuthStore.getState().setAuth(data);
    notifyTabs('login');
    return data;
  })().finally(() => { loginPromise = null; });
  return loginPromise;
}

export async function registerSession(data: { email: string; password: string; fullName: string }): Promise<User> {
  if (logoutPromise) await logoutPromise;
  const response = await sessionHttp.post<ApiResponse<User>>('/auth/register', data);
  return unwrap(response.data);
}

export function logoutSession(): Promise<void> {
  if (logoutPromise) return logoutPromise;
  authAttempt += 1;
  let token = useAuthStore.getState().accessToken;
  const pendingRefresh = refreshPromise;
  const pendingLogin = loginPromise;
  useAuthStore.getState().clearSession();
  logoutPromise = (async () => {
    try {
      if (pendingLogin) await pendingLogin.catch(() => undefined);
      if (pendingRefresh) token = (await pendingRefresh).accessToken;
      await withCookieLock(async () => {
        if (!token || pendingLogin) {
          token = unwrap((await sessionHttp.post<ApiResponse<AuthData>>('/auth/refresh')).data).accessToken;
        }
        try {
          await sessionHttp.post('/auth/logout', undefined, { headers: { Authorization: 'Bearer ' + token } });
        } catch (error) {
          if (formatHttpError(error).statusCode !== 401) throw error;
          token = unwrap((await sessionHttp.post<ApiResponse<AuthData>>('/auth/refresh')).data).accessToken;
          await sessionHttp.post('/auth/logout', undefined, { headers: { Authorization: 'Bearer ' + token } });
        }
      });
      notifyTabs('logout');
    } catch (error) {
      const failure = formatHttpError(error);
      if (failure.statusCode !== 401) throw failure;
      notifyTabs('logout');
    } finally {
      logoutPromise = null;
    }
  })();
  return logoutPromise;
}

export async function refreshExpiringSession(): Promise<void> {
  const { status, accessToken } = useAuthStore.getState();
  if (status !== 'authenticated' || !accessToken) return;
  try {
    const encoded = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded)) as { exp?: number };
    if (typeof payload.exp === 'number' && payload.exp * 1000 - Date.now() < 60_000) {
      await refreshSession();
    }
  } catch (error) {
    if (error instanceof AppApiError) throw error;
  }
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
    // File endpoints return JSON error envelopes even when requested as blobs.
    if (axios.isAxiosError(error) && typeof Blob !== 'undefined' && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Preserve HTTP status for non-JSON errors. */ }
    }
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
