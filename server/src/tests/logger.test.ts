import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { Logger, redactSensitiveData } from '../utils/logger';
import { requestLogger } from '../middleware/logging';
import { errorMiddleware, errorHandler } from '../middleware/error';
import type { AuthVariables } from '../types/auth';

describe('Logger & Observability', () => {
  describe('Sensitive Data Redaction', () => {
    it('should redact sensitive keys at the top level', () => {
      const data = {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!',
        token: 'jwt-access-token-string',
        apiKey: 'api-key-12345',
        role: 'teacher',
      };

      const redacted = redactSensitiveData(data) as Record<string, unknown>;
      expect(redacted.email).toBe('user@example.com');
      expect(redacted.role).toBe('teacher');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
    });

    it('should redact nested sensitive keys and arrays', () => {
      const data = {
        user: {
          id: '123',
          password_hash: '$2b$10$xyz...',
          credentials: {
            refreshToken: 'refresh-token-val',
            secret: 'jwt-secret',
          },
        },
        tags: ['math', 'grade-10'],
        students: [
          { name: 'Alice', password: 'alice_secret' },
          { name: 'Bob', password: 'bob_secret' },
        ],
      };

      const redacted = redactSensitiveData(data) as any;
      expect(redacted.user.id).toBe('123');
      expect(redacted.user.password_hash).toBe('[REDACTED]');
      expect(redacted.user.credentials.refreshToken).toBe('[REDACTED]');
      expect(redacted.user.credentials.secret).toBe('[REDACTED]');
      expect(redacted.tags).toEqual(['math', 'grade-10']);
      expect(redacted.students[0].name).toBe('Alice');
      expect(redacted.students[0].password).toBe('[REDACTED]');
      expect(redacted.students[1].name).toBe('Bob');
      expect(redacted.students[1].password).toBe('[REDACTED]');
    });

    it('should handle null, undefined, and non-object inputs safely', () => {
      expect(redactSensitiveData(null)).toBe(null);
      expect(redactSensitiveData(undefined)).toBe(undefined);
      expect(redactSensitiveData('string')).toBe('string');
      expect(redactSensitiveData(123)).toBe(123);
    });
  });

  describe('Logger Level Filtering & Output', () => {
    let logSpy: any;
    let warnSpy: any;
    let errorSpy: any;

    beforeEach(() => {
      logSpy = spyOn(console, 'log').mockImplementation(() => {});
      warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
      errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should filter logs below the active log level', () => {
      const logger = new Logger({ level: 'warn', isProduction: false });

      logger.debug('This is debug');
      logger.info('This is info');
      expect(logSpy).not.toHaveBeenCalled();

      logger.warn('This is warn');
      expect(warnSpy).toHaveBeenCalled();

      logger.error('This is error');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should format production output as valid JSON', () => {
      const logger = new Logger({ level: 'info', isProduction: true });

      logger.info('User logged in', {
        userId: 'teacher_123',
        role: 'teacher',
        password: 'plain-password',
      });

      expect(logSpy).toHaveBeenCalled();
      const outputJson = JSON.parse(logSpy.mock.calls[0][0]);

      expect(outputJson.level).toBe('info');
      expect(outputJson.message).toBe('User logged in');
      expect(outputJson.userId).toBe('teacher_123');
      expect(outputJson.role).toBe('teacher');
      expect(outputJson.password).toBe('[REDACTED]');
      expect(outputJson.timestamp).toBeDefined();
    });

    it('should include error stack trace in production JSON when error is logged', () => {
      const logger = new Logger({ level: 'info', isProduction: true });
      const testErr = new Error('Database connection failed');

      logger.error('Database query error', testErr, { query: 'SELECT 1' });

      expect(errorSpy).toHaveBeenCalled();
      const outputJson = JSON.parse(errorSpy.mock.calls[0][0]);

      expect(outputJson.level).toBe('error');
      expect(outputJson.message).toBe('Database query error');
      expect(outputJson.error.name).toBe('Error');
      expect(outputJson.error.message).toBe('Database connection failed');
      expect(outputJson.error.stack).toBeDefined();
      expect(outputJson.query).toBe('SELECT 1');
    });

    it('should support child loggers with pre-bound context', () => {
      const logger = new Logger({ level: 'info', isProduction: true });
      const childLogger = logger.child({ service: 'auth-service', version: '1.0' });

      childLogger.info('Auth success', { userId: '456' });

      expect(logSpy).toHaveBeenCalled();
      const outputJson = JSON.parse(logSpy.mock.calls[0][0]);
      expect(outputJson.service).toBe('auth-service');
      expect(outputJson.version).toBe('1.0');
      expect(outputJson.userId).toBe('456');
    });
  });

  describe('HTTP Request & Error Middleware Integration', () => {
    it('should generate and return X-Request-Id header', async () => {
      const testApp = new Hono<{ Variables: AuthVariables }>()
        .use(requestId())
        .use(requestLogger)
        .use(errorMiddleware)
        .onError(errorHandler);

      testApp.get('/test-health', (c) => c.json({ ok: true }));

      const res = await testApp.request('/test-health');
      expect(res.status).toBe(200);

      const headerReqId = res.headers.get('x-request-id');
      expect(headerReqId).toBeDefined();
      expect(typeof headerReqId).toBe('string');
      expect(headerReqId?.length).toBeGreaterThan(0);
    });

    it('should preserve incoming X-Request-Id header', async () => {
      const testApp = new Hono<{ Variables: AuthVariables }>()
        .use(requestId())
        .use(requestLogger)
        .use(errorMiddleware)
        .onError(errorHandler);

      testApp.get('/test-ping', (c) => c.text('pong'));

      const customId = 'client-trace-12345';
      const res = await testApp.request('/test-ping', {
        headers: { 'x-request-id': customId },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('x-request-id')).toBe(customId);
    });

    it('should catch unhandled errors and return 500 with requestId in body', async () => {
      const testApp = new Hono<{ Variables: AuthVariables }>()
        .use(requestId())
        .use(requestLogger)
        .use(errorMiddleware)
        .onError(errorHandler);

      testApp.get('/test-error', () => {
        throw new Error('Simulated runtime failure');
      });

      const res = await testApp.request('/test-error');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('An internal server error occurred');
      expect(body.requestId).toBeDefined();
      expect(res.headers.get('x-request-id')).toBe(body.requestId);
    });
  });
});
