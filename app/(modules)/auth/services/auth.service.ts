import apiClient from '@/app/_lib/axios-client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth.types';

export const authService = {
  /**
   * Đăng nhập người dùng qua API /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data;
  },

  /**
   * Đăng ký tài khoản mới qua API /auth/register
   */
  async register(data: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    });
    return response.data;
  },

  /**
   * Lấy thông tin tài khoản hiện tại từ Backend (/auth/profile hoặc /auth/me)
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/profile');
      return response.data;
    } catch {
      const fallbackResponse = await apiClient.get<User>('/auth/me');
      return fallbackResponse.data;
    }
  },

  /**
   * Đăng xuất người dùng trên Backend (/auth/logout)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Bỏ qua nếu backend không có endpoint này
    }
  },
};
