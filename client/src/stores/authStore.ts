import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../../../server/src/types/auth';
import { authService, type LoginCredentials, type RegistrationData } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  clearError: () => void;
  startTokenRefreshTimer: () => void;
  stopTokenRefreshTimer: () => void;
}

// Timer for automatic token refresh
let refreshTimer: NodeJS.Timeout | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiresAt: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login(credentials);

          // Calculate token expiration (15 minutes from now)
          const expiresAt = Date.now() + (15 * 60 * 1000);

          set({
            user: data.user,
            accessToken: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenExpiresAt: expiresAt,
          });

          // Start the token refresh timer
          get().startTokenRefreshTimer();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data: RegistrationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);

          // Calculate token expiration (15 minutes from now)
          const expiresAt = Date.now() + (15 * 60 * 1000);

          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenExpiresAt: expiresAt,
          });

          // Start the token refresh timer
          get().startTokenRefreshTimer();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Stop the refresh timer
          get().stopTokenRefreshTimer();

          // Clear auth state regardless of API call success
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tokenExpiresAt: null,
          });
        }
      },

      checkAuth: async () => {
        const { accessToken, isAuthenticated } = get();
        
        // If we think we're authenticated but have no access token, clear auth state
        if (isAuthenticated && !accessToken) {
          get().clearAuth();
          return;
        }

        if (!accessToken) {
          // Try to refresh token if we don't have an access token
          try {
            await get().refreshAccessToken();
          } catch {
            get().clearAuth();
          }
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const data = await authService.getCurrentUser();
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check error:', error);
          get().clearAuth();
        }
      },

      refreshAccessToken: async () => {
        try {
          const data = await authService.refreshToken();

          // Calculate new token expiration
          const expiresAt = Date.now() + (15 * 60 * 1000);

          set({
            accessToken: data.accessToken,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenExpiresAt: expiresAt,
          });

          // Restart the refresh timer with the new token
          get().startTokenRefreshTimer();
        } catch (error) {
          console.error('Token refresh error:', error);
          get().clearAuth();
          throw error;
        }
      },

      setUser: (user: AuthUser) => {
        set({ user, isAuthenticated: true });
      },

      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      clearAuth: () => {
        get().stopTokenRefreshTimer();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tokenExpiresAt: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      startTokenRefreshTimer: () => {
        const { tokenExpiresAt } = get();

        // Clear existing timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        if (tokenExpiresAt) {
          // Refresh token 2 minutes before it expires
          const refreshTime = tokenExpiresAt - Date.now() - (2 * 60 * 1000);

          if (refreshTime > 0) {
            refreshTimer = setTimeout(async () => {
              try {
                await get().refreshAccessToken();
              } catch (error) {
                console.error('Auto refresh failed:', error);
              }
            }, refreshTime);
          }
        }
      },

      stopTokenRefreshTimer: () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist essential data, not sensitive tokens or timer data
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
