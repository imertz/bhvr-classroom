import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';
import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AuthVariables, RequiredAuthVariables, AccessTokenPayload } from '../types/auth';
import { AUTH_CONFIG } from '../config/auth';

// Optional authentication middleware - attempts to authenticate but continues if no token
export const optionalAuthMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const jwtMiddleware = jwt({
      secret: AUTH_CONFIG.ACCESS_TOKEN_SECRET,
      alg: 'HS256',
    });

    try {
      await jwtMiddleware(c, async () => {
        const payload = c.get('jwtPayload') as AccessTokenPayload;
        if (payload.type === 'access') {
          c.set('user', payload.user);
        }
      });
    } catch (error) {
      // Continue without setting user - token was invalid but that's ok
    }
  }
  // Continue regardless of authentication status
  await next();
});

// Required authentication middleware
export const requireAuth = createMiddleware<{
  Variables: RequiredAuthVariables;
}>(async (c, next) => {
  // Manually implement authentication logic
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const jwtMiddleware = jwt({
      secret: AUTH_CONFIG.ACCESS_TOKEN_SECRET,
      alg: 'HS256',
    });

    try {
      await jwtMiddleware(c, async () => {
        const payload = c.get('jwtPayload') as AccessTokenPayload;
        if (payload.type === 'access') {
          c.set('user', payload.user);
        }
      });
    } catch (error) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  }
  
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  await next();
});

// Legacy middleware for backward compatibility
export const authMiddleware = requireAuth;

// Role-based middleware
export const requireAdmin = createMiddleware<{
  Variables: RequiredAuthVariables;
}>(async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
});

export const requireTeacher = createMiddleware<{
  Variables: RequiredAuthVariables;
}>(async (c, next) => {
  const user = c.get('user');
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return c.json({ error: 'Teacher or admin access required' }, 403);
  }
  await next();
});

export const requireStudent = createMiddleware<{
  Variables: RequiredAuthVariables;
}>(async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'student') {
    return c.json({ error: 'Student access required' }, 403);
  }
  await next();
});
