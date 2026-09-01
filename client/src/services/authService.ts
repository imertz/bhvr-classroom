import { client, unwrapJson } from '../lib/api';
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
    return unwrapJson<LoginResponse>(client.auth.login.$post({ json: credentials }));
  },

  /**
   * Register a new teacher account
   */
  async register(data: RegistrationData): Promise<LoginResponse> {
    return unwrapJson<LoginResponse>(client.auth.teacher.register.$post({ json: data }));
  },

  /**
   * Logout and invalidate refresh token
   */
  async logout(): Promise<void> {
    await unwrapJson(client.auth.logout.$post());
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse> {
    return unwrapJson<AuthResponse>(client.auth.me.$get());
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<RefreshResponse> {
    return unwrapJson<RefreshResponse>(client.auth.refresh.$post());
  },
};

export default authService;
