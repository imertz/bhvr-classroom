export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LogContext {
  requestId?: string;
  userId?: string;
  role?: string;
  userType?: string;
  path?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'tokenhash',
  'passwordhash',
  'secret',
  'authorization',
  'cookie',
  'apikey',
]);

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Checks if a key should be redacted.
 */
function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  if (SENSITIVE_KEYS.has(normalized)) return true;
  return (
    normalized.includes('password') ||
    normalized.includes('secret') ||
    normalized.includes('token') ||
    normalized.includes('cookie') ||
    normalized.includes('apikey') ||
    normalized.includes('authorization')
  );
}

/**
 * Recursively redacts sensitive fields from objects.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  private currentLevel: number;
  private isProduction: boolean;
  private isColorDisabled: boolean;
  private baseContext: LogContext;

  constructor(options?: {
    level?: LogLevel;
    isProduction?: boolean;
    noColor?: boolean;
    baseContext?: LogContext;
  }) {
    this.isProduction = options?.isProduction ?? process.env.NODE_ENV === 'production';
    this.isColorDisabled =
      options?.noColor ?? (!!process.env.NO_COLOR || this.isProduction);

    const defaultLevel: LogLevel =
      (process.env.LOG_LEVEL as LogLevel) ||
      (process.env.NODE_ENV === 'test' ? 'silent' : 'info');

    const selectedLevel = options?.level || defaultLevel;
    this.currentLevel = LOG_LEVELS[selectedLevel] ?? LOG_LEVELS.info;
    this.baseContext = options?.baseContext || {};
  }

  public setLevel(level: LogLevel): void {
    this.currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  }

  public getLevel(): LogLevel {
    const entry = Object.entries(LOG_LEVELS).find(([, val]) => val === this.currentLevel);
    return (entry?.[0] as LogLevel) || 'info';
  }

  public child(context: LogContext): Logger {
    return new Logger({
      level: this.getLevel(),
      isProduction: this.isProduction,
      noColor: this.isColorDisabled,
      baseContext: { ...this.baseContext, ...context },
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return (LOG_LEVELS[level] ?? 0) >= this.currentLevel;
  }

  private formatStatusColor(status?: number): string {
    if (!status || this.isColorDisabled) return status ? `${status}` : '';
    if (status >= 500) return `${ANSI.red}${status}${ANSI.reset}`;
    if (status >= 400) return `${ANSI.yellow}${status}${ANSI.reset}`;
    if (status >= 300) return `${ANSI.cyan}${status}${ANSI.reset}`;
    return `${ANSI.green}${status}${ANSI.reset}`;
  }

  private formatLevelColor(level: LogLevel): string {
    if (this.isColorDisabled) return level.toUpperCase().padEnd(5);
    switch (level) {
      case 'debug':
        return `${ANSI.gray}DEBUG${ANSI.reset}`;
      case 'info':
        return `${ANSI.cyan}INFO ${ANSI.reset}`;
      case 'warn':
        return `${ANSI.yellow}WARN ${ANSI.reset}`;
      case 'error':
        return `${ANSI.red}${ANSI.bold}ERROR${ANSI.reset}`;
      default:
        return level.toUpperCase().padEnd(5);
    }
  }

  private output(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    context?: LogContext
  ): void {
    if (!this.shouldLog(level)) return;

    const mergedContext = redactSensitiveData({
      ...this.baseContext,
      ...context,
    }) as LogContext;

    const timestamp = new Date().toISOString();

    if (this.isProduction) {
      const logPayload: Record<string, unknown> = {
        timestamp,
        level,
        message,
        ...mergedContext,
      };

      if (error) {
        if (error instanceof Error) {
          logPayload.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
          };
        } else {
          logPayload.error = String(error);
        }
      }

      const jsonString = JSON.stringify(logPayload);
      if (level === 'error') {
        console.error(jsonString);
      } else if (level === 'warn') {
        console.warn(jsonString);
      } else {
        console.log(jsonString);
      }
      return;
    }

    // Development / Pretty format
    const levelStr = this.formatLevelColor(level);
    const timeStr = this.isColorDisabled
      ? timestamp
      : `${ANSI.gray}${timestamp}${ANSI.reset}`;

    const reqIdStr = mergedContext.requestId
      ? this.isColorDisabled
        ? `[${mergedContext.requestId}]`
        : `${ANSI.dim}[${mergedContext.requestId}]${ANSI.reset}`
      : '';

    const userStr = mergedContext.userId
      ? this.isColorDisabled
        ? `(user: ${mergedContext.role || 'user'}:${mergedContext.userId})`
        : `${ANSI.magenta}(user: ${mergedContext.role || 'user'}:${mergedContext.userId})${ANSI.reset}`
      : '';

    const statusStr = this.formatStatusColor(mergedContext.status as number | undefined);

    const durationStr =
      mergedContext.durationMs !== undefined
        ? this.isColorDisabled
          ? `+${mergedContext.durationMs}ms`
          : `${ANSI.gray}+${mergedContext.durationMs}ms${ANSI.reset}`
        : '';

    const parts = [timeStr, levelStr, reqIdStr, message, statusStr, userStr, durationStr].filter(
      Boolean
    );

    const mainLine = parts.join(' ');

    if (level === 'error') {
      console.error(mainLine);
      if (error && error instanceof Error && error.stack) {
        console.error(this.isColorDisabled ? error.stack : `${ANSI.red}${error.stack}${ANSI.reset}`);
      } else if (error) {
        console.error(error);
      }
    } else if (level === 'warn') {
      console.warn(mainLine);
    } else {
      console.log(mainLine);
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.output('debug', message, undefined, context);
  }

  public info(message: string, context?: LogContext): void {
    this.output('info', message, undefined, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.output('warn', message, undefined, context);
  }

  public error(
    message: string,
    errorOrContext?: Error | unknown | LogContext,
    context?: LogContext
  ): void {
    if (
      errorOrContext instanceof Error ||
      (typeof errorOrContext === 'object' && errorOrContext !== null && 'stack' in errorOrContext)
    ) {
      this.output('error', message, errorOrContext, context);
    } else if (typeof errorOrContext === 'object' && errorOrContext !== null) {
      this.output('error', message, undefined, errorOrContext as LogContext);
    } else {
      this.output('error', message, errorOrContext, context);
    }
  }
}

export const logger = new Logger();
