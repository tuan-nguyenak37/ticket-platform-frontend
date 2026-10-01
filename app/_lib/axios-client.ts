import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV } from './env';
import { formatHttpError } from './http-errors';
import { useAuthStore } from '@/app/(modules)/auth/store/auth.store';

/**
 * Khởi tạo Axios Client kết nối trực tiếp Backend (Port 7000)
 * Đặt tại app/_lib/axios-client.ts
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Request Interceptor: Tự động đính kèm Bearer Token vào Header
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token trực tiếp từ Zustand store
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(formatHttpError(error));
  }
);

/**
 * Response Interceptor: Bóc tách dữ liệu và xử lý lỗi đồng nhất
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const appError = formatHttpError(error);

    // Xử lý tự động khi Token hết hạn hoặc chưa đăng nhập (401)
    if (appError.statusCode === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(appError);
  }
);

export default apiClient;
