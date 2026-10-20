import axios, { type AxiosInstance } from 'axios';
import { ENV } from '@/config/env';
import { formatHttpError } from '@/lib/api/http-errors';

interface ApiClientOptions {
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

// HTTP dùng chung chỉ nhận callback, không import store của module.
export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
  const client = axios.create({
    baseURL: ENV.API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  client.interceptors.request.use(
    (config) => {
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) config.headers.delete('Content-Type');
      const token = options.getToken?.();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(formatHttpError(error))
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const appError = formatHttpError(error);
      if (appError.statusCode === 401) {
        options.onUnauthorized?.();
      }
      return Promise.reject(appError);
    }
  );

  return client;
}
