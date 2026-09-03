import { Effect } from 'effect';
import { client, unwrapJson, unwrapJsonEffect } from '../lib/api';
import {
  LoginResponse,
  AuthResponse,
  RefreshResponse,
  type AuthUser,
  type LoginCredentials,
  type RegistrationData
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
   * Effect-based login
   */
  loginEffect(credentials: LoginCredentials): Effect.Effect<LoginResponse, Error> {
    return unwrapJsonEffect<LoginResponse>(() => client.auth.login.$post({ json: credentials }), LoginResponse);
  },

  /**
   * Login with email and password (supports teacher, admin, and student)
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return Effect.runPromise(this.loginEffect(credentials));
  },

  /**
   * Effect-based register
   */
  registerEffect(data: RegistrationData): Effect.Effect<LoginResponse, Error> {
    return unwrapJsonEffect<LoginResponse>(() => client.auth.teacher.register.$post({ json: data }), LoginResponse);
  },

  /**
   * Register a new teacher account
   */
  async register(data: RegistrationData): Promise<LoginResponse> {
    return Effect.runPromise(this.registerEffect(data));
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
    return Effect.runPromise(
      unwrapJsonEffect<AuthResponse>(() => client.auth.me.$get(), AuthResponse)
    );
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<RefreshResponse> {
    return Effect.runPromise(
      unwrapJsonEffect<RefreshResponse>(() => client.auth.refresh.$post(), RefreshResponse)
    );
  },
};

export default authService;
