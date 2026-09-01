import { api } from '../lib/api';
import type {
  AuthUser,
  LoginCredentials,
  RegistrationData,
  LoginResponse,
  AuthResponse,
  RefreshResponse
} from 'shared/dist';

export type {
  AuthUser,
  LoginCredentials,
  RegistrationData,
  LoginResponse,
  AuthResponse,
  RefreshResponse
};

export const authService = {
  /**
   * Login with email and password (supports teacher, admin, and student)
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new teacher account
   */
  async register(data: RegistrationData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/teacher/register', data);
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
