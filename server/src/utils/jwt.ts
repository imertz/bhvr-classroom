import { sign } from 'hono/jwt'
import type { AccessTokenPayload, RefreshTokenPayload, AuthUser } from '../types/auth'
import { AUTH_CONFIG } from '../config/auth'

export async function generateAccessToken(user: AuthUser): Promise<string> {
  const payload: AccessTokenPayload = {
    user,
    type: 'access',
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    iat: Math.floor(Date.now() / 1000)
  }

  return await sign(payload, AUTH_CONFIG.ACCESS_TOKEN_SECRET)
}

export async function generateRefreshToken(
  userId: string,
  userType: 'teacher' | 'student',
  tokenId: string
): Promise<string> {
  const payload: RefreshTokenPayload = {
    userId,
    userType,
    tokenId,
    type: 'refresh',
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    iat: Math.floor(Date.now() / 1000)
  }

  return await sign(payload, AUTH_CONFIG.REFRESH_TOKEN_SECRET)
}
