import { createMiddleware } from 'hono/factory';
import { logger } from '../utils/logger';
import type { AuthVariables } from '../types/auth';

export const requestLogger = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const start = performance.now();
    const method = c.req.method;
    const path = c.req.path;
    const requestId = c.get('requestId') || c.req.header('x-request-id');

    await next();

    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const status = c.res.status;
    const user = c.get('user');

    const context = {
      requestId,
      method,
      path,
      status,
      durationMs,
      userId: user?.id,
      role: user?.role,
      userType: user?.userType,
    };

    const logSummary = `${method} ${path} ${status} (${durationMs}ms)`;

    if (status >= 500) {
      logger.error(`HTTP ${logSummary}`, undefined, context);
    } else if (status >= 400) {
      logger.warn(`HTTP ${logSummary}`, context);
    } else if (durationMs > 500) {
      logger.warn(`Slow Request: HTTP ${logSummary}`, context);
    } else {
      logger.info(`HTTP ${logSummary}`, context);
    }
  }
);
