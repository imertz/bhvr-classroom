import type { Context, Next } from 'hono';

export const errorMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    console.error('Error:', err.message);
    return c.json({ error: 'An internal server error occurred' }, 500);
  }
};
