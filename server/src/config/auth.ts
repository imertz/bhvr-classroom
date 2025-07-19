export const AUTH_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  ACCESS_TOKEN_DURATION: '15m',
  REFRESH_TOKEN_DURATION: '7d',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  // Admin user configuration
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@classroom.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD, // No default - will be generated if not set
}
