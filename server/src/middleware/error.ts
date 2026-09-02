import type { Context, Next, ErrorHandler } from 'hono';
import { logger } from '../utils/logger';
import type { AuthVariables } from '../types/auth';

export const errorHandler: ErrorHandler<{ Variables: AuthVariables }> = (err: any, c: Context) => {
  const requestId = c.get('requestId') || c.req.header('x-request-id');
  const user = c.get('user');

  logger.error(`Unhandled error on ${c.req.method} ${c.req.path}`, err, {
    requestId,
    userId: user?.id,
    role: user?.role,
    userType: user?.userType,
    path: c.req.path,
    method: c.req.method,
  });

  return c.json(
    {
      error: 'An internal server error occurred',
      requestId,
    },
    500
  );
};

export const errorMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err: any) {
    return errorHandler(err, c);
  }
};


