import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AuthVariables, AccessTokenPayload } from '../types/auth';
import { AUTH_CONFIG } from '../config/auth';

// JWT middleware for access tokens
export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  // First try Bearer token
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Use Hono's JWT middleware
    const jwtMiddleware = jwt({
      secret: AUTH_CONFIG.ACCESS_TOKEN_SECRET,
      alg: 'HS256',
    });

    try {
      await jwtMiddleware(c, async () => {
        const payload = c.get('jwtPayload') as AccessTokenPayload;
        if (payload.type !== 'access') {
          throw new Error('Invalid token type');
        }
        c.set('user', payload.user);
      });
      await next();
    } catch (error) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  } else {
    return c.json({ error: 'No authorization token provided' }, 401);
  }
});

// Role-based middleware
export const requireTeacher = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'teacher') {
    return c.json({ error: 'Teacher access required' }, 403);
  }
  await next();
});

export const requireStudent = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'student') {
    return c.json({ error: 'Student access required' }, 403);
  }
  await next();
});
