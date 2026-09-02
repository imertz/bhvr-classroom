import { hc } from 'hono/client';
import { Schema, Effect } from 'effect';
import type { AppType } from 'server/src/client';
import { useAuthStore } from '../stores/authStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

let isRefreshing = false;
let requestQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = input instanceof URL ? input.href : input instanceof Request ? input.url : String(input);
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
      const err = refreshError instanceof Error ? refreshError : new Error(String(refreshError));
      requestQueue.forEach(({ reject }) => reject(err));
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
  headers: () => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    // SAFETY: empty object literal satisfies Record<string, string> expected by hc headers callback
    return {} as Record<string, string>;
  },
  fetch: customFetch,
});

type ErrorBody = {
  error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | Record<string, string>;
  message?: string;
};

export type ApiResponseData = object | string | number | boolean | null;

export interface ApiResponseLike {
  ok: boolean;
  status: number;
  statusText?: string;
  json(): Promise<ApiResponseData>;
}

export async function unwrapJson<T>(
  resPromise: Promise<ApiResponseLike>
): Promise<T> {
  const res = await resPromise;
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      // SAFETY: error response body is parsed and checked for error fields
      const body = (await res.json()) as ErrorBody | null;
      if (body) {
        if (body.error && !(body.error instanceof Object)) {
          errorMsg = String(body.error);
        } else if (body.message) {
          errorMsg = body.message;
        } else if (body.error && body.error instanceof Object) {
          const errObj = body.error;
          if ('formErrors' in errObj && Array.isArray(errObj.formErrors) && errObj.formErrors.length > 0) {
            errorMsg = errObj.formErrors.join(', ');
          } else if ('fieldErrors' in errObj && errObj.fieldErrors && errObj.fieldErrors instanceof Object) {
            const fields = Object.entries(errObj.fieldErrors)
              .map(([f, errs]) => `${f}: ${Array.isArray(errs) ? errs.join(', ') : String(errs)}`)
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
  // SAFETY: Server API endpoints return typed response matching generic type parameter T
  return res.json() as Promise<T>;
}

export function unwrapJsonEffect<T>(
  resPromise: Promise<ApiResponseLike>,
  schema?: Schema.Decoder<T>
): Effect.Effect<T, Error> {
  return Effect.tryPromise({
    try: async () => {
      const data = await unwrapJson<T>(resPromise);
      if (schema) {
        return Schema.decodeUnknownSync(schema)(data);
      }
      return data;
    },
    catch: (error) => error instanceof Error ? error : new Error(String(error))
  });
}

export default client;
