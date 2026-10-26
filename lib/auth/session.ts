'use client';

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { AppApiError, formatHttpError } from '@/lib/api/http-errors';
import type { TokenAuthData, ApiResponse } from './types/authInterface';
import type { User } from './types/userInterface';
import { useAuthStore } from './auth.store';

const sessionHttp = axios.create({ baseURL: '/api/backend', timeout: 15000, withCredentials: true });
let restorePromise: Promise<void> | null = null;
let logoutPromise: Promise<void> | null = null;
let loginPromise: Promise<TokenAuthData> | null = null;
let sessionChannel: BroadcastChannel | null = null;
let authAttempt = 0;

async function withCookieLock<T>(action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('ticketverse-auth-cookie', action);
  }
  return action();
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}

function sameSession(revision: number) {
  return useAuthStore.getState().revision === revision;
}

export function subscribeToSessionChanges() {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel('ticketverse-session');
  sessionChannel = channel;
  channel.onmessage = ({ data }: MessageEvent<unknown>) => {
    if (data !== 'login' && data !== 'logout') return;
    authAttempt += 1;
    useAuthStore.getState().clearSession();
    if (data === 'login') void Promise.allSettled([restorePromise, loginPromise, logoutPromise].filter(Boolean)).then(() => restoreSession());
  };
  return () => {
    if (sessionChannel === channel) sessionChannel = null;
    channel.close();
  };
}

async function loadSession() {
  const revision = useAuthStore.getState().revision;
  const attempt = authAttempt;
  try {
    const data = await withCookieLock(async () => {
      const delays = [0, 100, 300, 1000];
      for (const delay of delays) {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        if (attempt !== authAttempt || !sameSession(revision)) return null;
        try {
          return unwrap((await sessionHttp.post<ApiResponse<TokenAuthData>>('/auth/browser/refresh')).data);
        } catch (error) {
          const response = axios.isAxiosError(error) ? error.response : undefined;
          if (response?.status === 409 && response.data?.code === 'AUTH_REFRESH_CONFLICT' && delay !== 1000) continue;
          throw error;
        }
      }
      return null;
    });
    if (!data || attempt !== authAttempt || !sameSession(revision)) return;
    if (!data.user?.user_id || !data.accessToken || !Number.isFinite(Date.parse(data.accessTokenExpiresAt))) {
      throw new AppApiError('Phản hồi xác thực không hợp lệ.', 502);
    }
    const previous = useAuthStore.getState().user;
    if (previous && previous.user_id !== data.user.user_id) useAuthStore.getState().setAuth(data);
    else useAuthStore.getState().setSession(data);
  } catch (error) {
    const failure = formatHttpError(error);
    if (attempt === authAttempt && sameSession(revision)) {
      if (failure.statusCode === 401) useAuthStore.getState().clearSession();
      else if (useAuthStore.getState().status !== 'authenticated') {
        useAuthStore.getState().setStatus('error', failure.message);
      }
    }
    throw failure;
  }
}

export function restoreSession(): Promise<void> {
  if (logoutPromise) return logoutPromise;
  if (restorePromise) return restorePromise;
  const state = useAuthStore.getState();
  if (state.accessToken && Date.parse(state.accessTokenExpiresAt ?? '') > Date.now() + 60_000) return Promise.resolve();
  if (state.status !== 'authenticated') useAuthStore.getState().setStatus('restoring');
  restorePromise = loadSession().catch(() => undefined).finally(() => { restorePromise = null; });
  return restorePromise;
}

export function loginSession(credentials: { email: string; password: string }): Promise<TokenAuthData> {
  if (loginPromise) return loginPromise;
  const attempt = ++authAttempt;
  loginPromise = (async () => {
    if (logoutPromise) await logoutPromise;
    if (restorePromise) await restorePromise;
    if (attempt !== authAttempt) throw new AppApiError('Yêu cầu đăng nhập đã bị hủy.', 401);
    const revision = useAuthStore.getState().revision;
    const response = await withCookieLock(() => sessionHttp.post<ApiResponse<TokenAuthData>>('/auth/browser/login', credentials));
    const data = unwrap(response.data);
    if (!data.user?.user_id || !data.accessToken || !Number.isFinite(Date.parse(data.accessTokenExpiresAt))) throw new AppApiError('Phản hồi xác thực không hợp lệ.', 502);
    if (attempt !== authAttempt || !sameSession(revision)) throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
    useAuthStore.getState().setAuth(data);
    sessionChannel?.postMessage('login');
    return data;
  })().finally(() => { loginPromise = null; });
  return loginPromise;
}

export async function registerSession(data: { email: string; password: string; fullName: string }): Promise<User> {
  if (logoutPromise) await logoutPromise;
  return unwrap((await sessionHttp.post<ApiResponse<User>>('/auth/register', data)).data);
}

export function logoutSession(): Promise<void> {
  if (logoutPromise) return logoutPromise;
  authAttempt += 1;
  const pendingLogin = loginPromise;
  const pendingRefresh = restorePromise;
  useAuthStore.getState().clearSession();
  logoutPromise = (async () => {
    if (pendingLogin) await pendingLogin.catch(() => undefined);
    if (pendingRefresh) await pendingRefresh.catch(() => undefined);
    try {
      await withCookieLock(() => sessionHttp.post('/auth/browser/logout'));
    } catch (error) {
      if (formatHttpError(error).statusCode !== 401) throw formatHttpError(error);
    }
    sessionChannel?.postMessage('logout');
  })().finally(() => { logoutPromise = null; });
  return logoutPromise;
}

export function refreshExpiringSession(): Promise<void> {
  if (useAuthStore.getState().status !== 'authenticated' || logoutPromise || loginPromise) return Promise.resolve();
  const state = useAuthStore.getState();
  if (state.accessToken && Date.parse(state.accessTokenExpiresAt ?? '') > Date.now() + 60_000) return Promise.resolve();
  if (!restorePromise) restorePromise = loadSession().finally(() => { restorePromise = null; });
  return restorePromise;
}

type AuthRequest = InternalAxiosRequestConfig & { _revision?: number; _accessToken?: string; _authRetry?: boolean };

export const apiClient = axios.create({ baseURL: '/api/backend', timeout: 15000, withCredentials: true });

apiClient.interceptors.request.use(async (config: AuthRequest) => {
  if (logoutPromise) throw new AppApiError('Đang đăng xuất.', 401);
  if (config._revision === undefined) config._revision = useAuthStore.getState().revision;
  if (!sameSession(config._revision)) throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
  if (useAuthStore.getState().status === 'restoring') await restoreSession();
  if (useAuthStore.getState().status === 'authenticated') await refreshExpiringSession();
  const state = useAuthStore.getState();
  if (config._revision !== undefined && config._revision !== state.revision) throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
  if (state.status !== 'authenticated') throw new AppApiError(state.error || 'Bạn chưa đăng nhập.', state.status === 'error' ? 0 : 401);
  if (!state.accessToken) throw new AppApiError('Chưa thể khôi phục access token. Vui lòng thử lại.', 503);
  config._revision = state.revision;
  config._accessToken = state.accessToken;
  config.headers.set('Authorization', `Bearer ${state.accessToken}`);
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) config.headers.delete('Content-Type');
  return config;
});

apiClient.interceptors.response.use(
  response => {
    if (!sameSession((response.config as AuthRequest)._revision!)) throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
    return response;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error) && typeof Blob !== 'undefined' && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { error.response.data = undefined; }
    }
    const failure = formatHttpError(error);
    const config = axios.isAxiosError(error) ? error.config as AuthRequest | undefined : undefined;
    const code = axios.isAxiosError(error) ? error.response?.data?.code : undefined;
    if (failure.statusCode === 401 && code === 'AUTH_ACCESS_EXPIRED' && config && !config._authRetry && sameSession(config._revision!)) {
      config._authRetry = true;
      const state = useAuthStore.getState();
      if (state.accessToken === config._accessToken) {
        if (!restorePromise) restorePromise = loadSession().finally(() => { restorePromise = null; });
        await restorePromise;
      }
      if (!sameSession(config._revision!) || useAuthStore.getState().status !== 'authenticated') throw new AppApiError('Phiên đăng nhập đã thay đổi.', 401);
      return apiClient.request(config);
    }
    if (failure.statusCode === 401 && config && sameSession(config._revision!)) useAuthStore.getState().clearSession();
    throw failure;
  },
);
