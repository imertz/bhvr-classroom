import { hc } from 'hono/client';
import type { AppType } from 'server/src/client';
import { useAuthStore } from '../stores/authStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

let isRefreshing = false;
let requestQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const isAuthEndpoint = (
    urlStr.includes('/auth/login') ||
    urlStr.includes('/auth/teacher/login') ||
    urlStr.includes('/auth/student/login') ||
    urlStr.includes('/auth/teacher/register') ||
    urlStr.includes('/auth/refresh') ||
    urlStr.includes('/auth/logout')
  );

  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !isAuthEndpoint) {
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        requestQueue.push({ resolve, reject });
      }).then(async (newToken) => {
        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return fetch(input, {
          ...init,
          headers: retryHeaders,
          credentials: 'include',
        });
      });
    }

    isRefreshing = true;
    try {
      await useAuthStore.getState().refreshAccessToken();
      const newToken = useAuthStore.getState().accessToken;
      if (newToken) {
        requestQueue.forEach(({ resolve }) => resolve(newToken));
        requestQueue = [];

        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return await fetch(input, {
          ...init,
          headers: retryHeaders,
          credentials: 'include',
        });
      }
    } catch (refreshError) {
      requestQueue.forEach(({ reject }) => reject(refreshError));
      requestQueue = [];
      useAuthStore.getState().clearAuth();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      return res;
    } finally {
      isRefreshing = false;
    }
  }

  return res;
};

export const client = hc<AppType>(SERVER_URL, {
  headers: (): Record<string, string> => {
    const token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },
  fetch: customFetch,
});

export async function unwrapJson<T = any>(
  resPromise: Promise<Response | { ok: boolean; status: number; statusText?: string; json: () => Promise<any> }>
): Promise<T> {
  const res = await resPromise;
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: unknown; message?: unknown };
      if (body) {
        if (typeof body.error === 'string') {
          errorMsg = body.error;
        } else if (typeof body.message === 'string') {
          errorMsg = body.message;
        } else if (body.error && typeof body.error === 'object') {
          const errObj = body.error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
          if (errObj.formErrors && errObj.formErrors.length > 0) {
            errorMsg = errObj.formErrors.join(', ');
          } else if (errObj.fieldErrors) {
            const fields = Object.entries(errObj.fieldErrors)
              .map(([f, errs]) => `${f}: ${errs.join(', ')}`)
              .join('; ');
            if (fields) errorMsg = fields;
          } else {
            errorMsg = JSON.stringify(body.error);
          }
        }
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export default client;
