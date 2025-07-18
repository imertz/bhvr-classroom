import { api } from '../lib/api';
import type { AuthUser } from '../../../server/src/types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  message: string;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
}

export interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
  message: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/teacher/login', credentials);
    return response.data;
  },

  /**
   * Logout and invalidate refresh token
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<RefreshResponse> {
    const response = await api.post<RefreshResponse>('/auth/refresh');
    return response.data;
  },
};

export default authService;
