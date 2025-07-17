import type { Context, Next } from 'hono';

export const authMiddleware = async (c: Context, next: Next) => {
  // Implement auth logic here
  // For now, we'll just call next()
  await next();
};
