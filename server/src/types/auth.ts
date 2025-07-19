import type { JWTPayload } from 'hono/utils/jwt/types'

export interface AuthUser {
  id: string
  email: string
  role: 'teacher' | 'student' | 'admin'
  userType: 'teacher' | 'student'
}

export interface AccessTokenPayload extends JWTPayload {
  user: AuthUser
  type: 'access'
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string
  userType: 'teacher' | 'student'
  tokenId: string
  type: 'refresh'
}

export interface AuthVariables {
  user?: AuthUser
  jwtPayload?: AccessTokenPayload
}

export interface RequiredAuthVariables {
  user: AuthUser
  jwtPayload: AccessTokenPayload
}
