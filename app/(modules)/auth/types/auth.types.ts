export interface User {
  id: string | number;
  email: string;
  fullName?: string;
  name?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (payload: { user: User; token: string; refreshToken?: string }) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}
